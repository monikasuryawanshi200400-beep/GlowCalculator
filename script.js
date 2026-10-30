
const expressionDisplay = document.getElementById("expression");
const resultDisplay = document.getElementById("result");

let expression = "";
let justCalculated = false;

function formatNumber(number) {
  if (!Number.isFinite(number)) return "Error";
  return Number(number.toPrecision(12)).toString();
}

// Safe arithmetic expression parser
function calculate(expressionText) {
  const tokens = expressionText.match(
    /\d*\.?\d+(?:e[+-]?\d+)?|[+\-*/%]/gi
  );

  if (!tokens || tokens.join("") !== expressionText.replace(/\s/g, "")) {
    throw new Error("Invalid expression");
  }

  let position = 0;

  function parseFactor() {
    let sign = 1;

    while (tokens[position] === "+" || tokens[position] === "-") {
      if (tokens[position] === "-") sign *= -1;
      position++;
    }

    const token = tokens[position];

    if (!token || !/^\d*\.?\d+(?:e[+-]?\d+)?$/i.test(token)) {
      throw new Error("Invalid number");
    }

    let value = Number(token);
    position++;

    if (!Number.isFinite(value)) throw new Error("Invalid number");

    if (tokens[position] === "%") {
      value /= 100;
      position++;
    }

    return sign * value;
  }

  function parseTerm() {
    let value = parseFactor();

    while (tokens[position] === "*" || tokens[position] === "/") {
      const operator = tokens[position++];
      const next = parseFactor();

      if (operator === "*") value *= next;
      else {
        if (next === 0) throw new Error("Cannot divide by zero");
        value /= next;
      }
    }

    return value;
  }

  function parseExpression() {
    let value = parseTerm();

    while (tokens[position] === "+" || tokens[position] === "-") {
      const operator = tokens[position++];
      const next = parseTerm();

      if (operator === "+") value += next;
      else value -= next;
    }

    return value;
  }

  const answer = parseExpression();

  if (position !== tokens.length || !Number.isFinite(answer)) {
    throw new Error("Invalid expression");
  }

  return answer;
}

function updateDisplay() {
  expressionDisplay.textContent = expression || "0";

  if (!expression) {
    resultDisplay.textContent = "0";
    return;
  }

  try {
    const answer = calculate(expression);
    resultDisplay.textContent = formatNumber(answer);
  } catch {
    resultDisplay.textContent = "—";
  }
}

function addValue(value) {
  const operators = ["+", "-", "*", "/"];

  if (justCalculated) {
    if (!operators.includes(value) && value !== "%") {
      expression = "";
    }
    justCalculated = false;
  }

  const lastChar = expression.slice(-1);

  if (operators.includes(value)) {
    if (!expression && value !== "-") return;

    if (operators.includes(lastChar)) {
      expression = expression.slice(0, -1);
    }
    expression += value;
  } else if (value === "%") {
    if (/\d$/.test(expression)) expression += value;
  } else if (value === ".") {
    const currentNumber = expression.split(/[+\-*/]/).pop();

    if (currentNumber.includes(".")) return;

    expression += currentNumber === "" ? "0." : ".";
  } else {
    expression += value;
  }

  updateDisplay();
}

function clearAll() {
  expression = "";
  justCalculated = false;
  updateDisplay();
}

function deleteLast() {
  if (justCalculated) {
    clearAll();
    return;
  }

  expression = expression.slice(0, -1);
  updateDisplay();
}

function toggleSign() {
  if (!expression) {
    expression = "-";
  } else if (justCalculated) {
    expression = formatNumber(-calculate(expression));
    justCalculated = false;
  } else {
    const match = expression.match(/(\d*\.?\d+%?)$/);

    if (!match) {
      if (expression.endsWith("-")) {
        expression = expression.slice(0, -1);
      } else {
        expression += "-";
      }
    } else {
      const start = match.index;
      const number = match[0];
      const before = expression.slice(0, start);

      if (before.endsWith("-") &&
          (before.length === 1 || /[+*/-]$/.test(before))) {
        expression = before.slice(0, -1) + number;
      } else {
        expression = before + "-" + number;
      }
    }
  }

  updateDisplay();
}

function showResult() {
  if (!expression) return;

  try {
    const answer = calculate(expression);
    expression = formatNumber(answer);
    resultDisplay.textContent = expression;
    expressionDisplay.textContent = expression;
    justCalculated = true;
  } catch (error) {
    resultDisplay.textContent =
      error.message === "Cannot divide by zero"
        ? "Cannot divide by zero"
        : "Invalid Input";
  }
}

// Button click events
document.querySelectorAll(".buttons button").forEach(button => {
  button.addEventListener("click", () => {
    const value = button.dataset.value;
    const action = button.dataset.action;

    if (value !== undefined) addValue(value);

    if (action === "clear") clearAll();
    if (action === "delete") deleteLast();
    if (action === "sign") toggleSign();
    if (action === "calculate") showResult();
  });
});

// Keyboard support
document.addEventListener("keydown", event => {
  const key = event.key;

  if (/^[0-9.]$/.test(key)) {
    addValue(key);
  } else if (["+", "-", "*", "/", "%"].includes(key)) {
    addValue(key);
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    showResult();
  } else if (key === "Backspace") {
    deleteLast();
  } else if (key === "Escape") {
    clearAll();
  }
});

updateDisplay();
