// Connects the buttons and keyboard to the calculator engine (calculator.js).
(function () {
  "use strict";

  const expressionEl = document.getElementById("expression");
  const resultEl = document.getElementById("result");
  const historyEl = document.getElementById("history");

  let expression = "";
  let justEvaluated = false;
  let lastAnswer = 0; // the real number, not the formatted text on screen
  const history = [];

  /** Turn an answer back into text the engine can read, e.g. -3 -> "−3" */
  function toExpression(value) {
    return String(value).replace(/-/g, "−");
  }

  function render() {
    expressionEl.textContent = expression;
    // Live preview of the answer while typing
    if (!justEvaluated) {
      try {
        resultEl.textContent = Calc.format(Calc.evaluate(expression));
        resultEl.classList.remove("error");
      } catch {
        // Unfinished expression like "5+" – keep the last preview
      }
    }
  }

  function input(value) {
    const isOperator = "+−×÷".includes(value);
    if (justEvaluated) {
      // After "=", typing an operator continues from the answer,
      // typing a number starts a new calculation.
      expression = isOperator ? toExpression(lastAnswer) : "";
      justEvaluated = false;
    }
    // Replace the last operator instead of stacking "5+×"
    const last = expression.slice(-1);
    if (isOperator && "+×÷".includes(last) && value !== "−") {
      expression = expression.slice(0, -1);
    }
    expression += value;
    render();
  }

  function equals() {
    if (!expression) return;
    try {
      const value = Calc.evaluate(expression);
      const answer = Calc.format(value);
      addToHistory(expression, answer, value);
      lastAnswer = value;
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
    justEvaluated = false;
    resultEl.textContent = "0";
    resultEl.classList.remove("error");
    render();
  }

  function backspace() {
    if (justEvaluated) return clear();
    expression = expression.slice(0, -1);
    if (!expression) resultEl.textContent = "0";
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
        expression = toExpression(item.value);
        justEvaluated = false;
        render();
      });
      li.appendChild(btn);
      historyEl.appendChild(li);
    }
  }

  // Buttons
  document.querySelector(".keys").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const { value, action } = btn.dataset;
    if (value) input(value);
    else if (action === "equals") equals();
    else if (action === "clear") clear();
    else if (action === "backspace") backspace();
  });

  // Keyboard
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
