(function (root) {
  "use strict";

  const OPERATORS = {
    "+": { precedence: 1, apply: (a, b) => a + b },
    "-": { precedence: 1, apply: (a, b) => a - b },
    "*": { precedence: 2, apply: (a, b) => a * b },
    "/": {
      precedence: 2,
      apply: (a, b) => {
        if (b === 0) throw new Error("Can't divide by zero");
        return a / b;
      },
    },
    // "neg" is the unary minus, e.g. the "-" in "-5" or "3*-2"
    neg: { precedence: 3, unary: true, apply: (a) => -a },
  };

  function normalize(expr) {
    return String(expr)
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-")
      .replace(/\s+/g, "");
  }

  function addImpliedTimes(tokens) {
    const prev = tokens[tokens.length - 1];
    if (prev && (prev.type === "num" || prev.value === ")")) {
      tokens.push({ type: "op", value: "*" });
    }
  }

  function tokenize(expr) {
    const s = normalize(expr);
    const tokens = [];
    let i = 0;

    while (i < s.length) {
      const ch = s[i];

      if (/[0-9.]/.test(ch)) {
        let num = "";
        while (i < s.length && /[0-9.]/.test(s[i])) num += s[i++];
        if ((num.match(/\./g) || []).length > 1 || num === ".") {
          throw new Error("Invalid number");
        }
        // Scientific notation, e.g. "1.5e+21", so big or tiny answers
        // can be used again in the next calculation
        const exponent = s.slice(i).match(/^e[+-]?\d+/i);
        if (exponent) {
          num += exponent[0];
          i += exponent[0].length;
        }
        let value = parseFloat(num);
        // "50%" means 0.5
        if (s[i] === "%") {
          value /= 100;
          i++;
        }
        addImpliedTimes(tokens);
        tokens.push({ type: "num", value });
        continue;
      }

      if ("+-*/".includes(ch)) {
        const prev = tokens[tokens.length - 1];
        const isUnary =
          ch === "-" &&
          (!prev || prev.type === "op" || prev.value === "(");
        if (isUnary) tokens.push({ type: "op", value: "neg" });
        else if (ch === "+" && (!prev || prev.type === "op" || prev.value === "(")) {
          // unary plus: ignore it
        } else tokens.push({ type: "op", value: ch });
        i++;
        continue;
      }

      if (ch === "(" || ch === ")") {
        if (ch === "(") addImpliedTimes(tokens);
        tokens.push({ type: "paren", value: ch });
        i++;
        continue;
      }

      throw new Error(`Unexpected character "${ch}"`);
    }
    return tokens;
  }

  function toRPN(tokens) {
    const output = [];
    const stack = [];

    for (const t of tokens) {
      if (t.type === "num") {
        output.push(t);
      } else if (t.type === "op") {
        const op = OPERATORS[t.value];
        while (stack.length) {
          const top = stack[stack.length - 1];
          if (top.type !== "op") break;
          const topOp = OPERATORS[top.value];
          // unary minus is right-associative, the rest are left-associative
          const shouldPop = op.unary
            ? topOp.precedence > op.precedence
            : topOp.precedence >= op.precedence;
          if (!shouldPop) break;
          output.push(stack.pop());
        }
        stack.push(t);
      } else if (t.value === "(") {
        stack.push(t);
      } else {
        // ")"
        while (stack.length && stack[stack.length - 1].value !== "(") {
          output.push(stack.pop());
        }
        if (!stack.length) throw new Error("Mismatched brackets");
        stack.pop();
      }
    }

    while (stack.length) {
      const t = stack.pop();
      if (t.type === "paren") throw new Error("Mismatched brackets");
      output.push(t);
    }
    return output;
  }

  function evalRPN(rpn) {
    const stack = [];
    for (const t of rpn) {
      if (t.type === "num") {
        stack.push(t.value);
        continue;
      }
      const op = OPERATORS[t.value];
      if (op.unary) {
        if (stack.length < 1) throw new Error("Incomplete expression");
        stack.push(op.apply(stack.pop()));
      } else {
        if (stack.length < 2) throw new Error("Incomplete expression");
        const b = stack.pop();
        const a = stack.pop();
        stack.push(op.apply(a, b));
      }
    }
    if (stack.length !== 1) throw new Error("Incomplete expression");
    return stack[0];
  }

  function clean(n) {
    return parseFloat(n.toPrecision(12));
  }

  function evaluate(expr) {
    if (!normalize(expr)) return 0;
    const result = evalRPN(toRPN(tokenize(expr)));
    if (!Number.isFinite(result)) throw new Error("Number too large");
    return clean(result);
  }

  function format(n) {
    if (!Number.isFinite(n)) return "Error";
    if (Math.abs(n) >= 1e15 || (Math.abs(n) < 1e-9 && n !== 0)) {
      // 1.500000e+21 -> 1.5e+21
      return n.toExponential(6).replace(/\.?0+e/, "e");
    }
    return n.toLocaleString("en-US", { maximumFractionDigits: 10 });
  }

  const Calc = { tokenize, toRPN, evaluate, format };

  if (typeof module !== "undefined" && module.exports) module.exports = Calc;
  else root.Calc = Calc;
})(typeof window !== "undefined" ? window : globalThis);
