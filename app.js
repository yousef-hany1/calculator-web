(function () {
  "use strict";

  const expressionEl = document.getElementById("expression");
  const resultEl = document.getElementById("result");
  const historyEl = document.getElementById("history");

  let expression = "";
  let justEvaluated = false;
  let lastAnswer = 0;
  let carried = null;
  let preview = "0";
  const history = [];

  function toExpression(value) {
    return String(value).replace(/-/g, "−");
  }

  function carry(raw) {
    expression = toExpression(Calc.clean(raw));
    carried = { text: expression, raw };
  }

  function exact(expr) {
    if (!carried || !expr.startsWith(carried.text)) return expr;
    const rest = expr.slice(carried.text.length);
    if (/^[0-9.e]/i.test(rest)) return expr;
    return String(carried.raw) + rest;
  }

  function render() {
    expressionEl.textContent = expression;
    if (justEvaluated) return;
    try {
      preview = Calc.format(Calc.evaluate(exact(expression)));
    } catch {}
    resultEl.textContent = preview;
    resultEl.classList.remove("error");
  }

  function openBrackets() {
    let count = 0;
    for (const ch of expression) {
      if (ch === "(") count++;
      else if (ch === ")") count--;
    }
    return count;
  }

  function nextExpression(value) {
    const last = expression.slice(-1);
    const endsValue = /[0-9.)%]/.test(last);

    if ("+−×÷".includes(value)) {
      const trail = (expression.match(/[+−×÷]+$/) || [""])[0];
      const base = expression.slice(0, expression.length - trail.length);
      const atStart = base === "" || base.endsWith("(");
      if (value === "−") {
        if (trail.endsWith("−")) return null;
        if (trail.endsWith("+")) return expression.slice(0, -1) + "−";
        return expression + "−";
      }
      if (atStart) return null;
      return base + value;
    }

    if (value === ".") {
      const number = expression.match(/[0-9.]*$/)[0];
      if (number.includes(".") || /e[+−]?\d*$/i.test(expression)) return null;
      return expression + (number ? "." : "0.");
    }

    if (value === "%") return endsValue ? expression + "%" : null;

    if (value === ")") {
      return openBrackets() > 0 && endsValue ? expression + ")" : null;
    }

    return expression + value;
  }

  function input(value) {
    if (justEvaluated) {
      justEvaluated = false;
      if ("+−×÷%".includes(value)) carry(lastAnswer);
      else {
        expression = "";
        carried = null;
      }
    }
    const next = nextExpression(value);
    if (next === null) return render();
    expression = next;
    render();
  }

  function equals() {
    if (!expression || justEvaluated) return;
    expression += ")".repeat(Math.max(openBrackets(), 0));
    try {
      const raw = Calc.calculate(exact(expression));
      const answer = Calc.format(Calc.clean(raw));
      addToHistory(expression, answer, raw);
      lastAnswer = raw;
      resultEl.textContent = answer;
      resultEl.classList.remove("error");
      justEvaluated = true;
    } catch (err) {
      resultEl.textContent = err.message;
      resultEl.classList.add("error");
    }
    expressionEl.textContent = expression + " =";
  }

  function clear() {
    expression = "";
    carried = null;
    justEvaluated = false;
    preview = "0";
    render();
  }

  function backspace() {
    if (justEvaluated) return clear();
    expression = expression.slice(0, -1);
    render();
  }

  function addToHistory(expr, answer, value) {
    history.unshift({ expr, answer, value });
    history.length = Math.min(history.length, 10);
    historyEl.innerHTML = "";
    for (const item of history) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = `${item.expr} = ${item.answer}`;
      btn.title = "Use this result";
      btn.addEventListener("click", () => {
        carry(item.value);
        justEvaluated = false;
        render();
      });
      li.appendChild(btn);
      historyEl.appendChild(li);
    }
  }

  document.querySelector(".keys").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const { value, action } = btn.dataset;
    if (value) input(value);
    else if (action === "equals") equals();
    else if (action === "clear") clear();
    else if (action === "backspace") backspace();
  });

  const keyMap = { "*": "×", "/": "÷", "-": "−", "+": "+" };
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (/^[0-9.%()]$/.test(k)) input(k);
    else if (keyMap[k]) input(keyMap[k]);
    else if (k === "Enter" || k === "=") equals();
    else if (k === "Backspace") backspace();
    else if (k === "Escape") clear();
    else return;
    e.preventDefault();
  });

  render();
})();
