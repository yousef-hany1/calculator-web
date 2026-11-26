const test = require("node:test");
const assert = require("node:assert/strict");
const Calc = require("./calculator.js");

test("basic operations", () => {
  assert.equal(Calc.evaluate("2+3"), 5);
  assert.equal(Calc.evaluate("10−4"), 6);
  assert.equal(Calc.evaluate("6×7"), 42);
  assert.equal(Calc.evaluate("9÷3"), 3);
});

test("order of operations", () => {
  assert.equal(Calc.evaluate("2+3×4"), 14);
  assert.equal(Calc.evaluate("(2+3)×4"), 20);
  assert.equal(Calc.evaluate("10−2−3"), 5);
  assert.equal(Calc.evaluate("100÷10÷2"), 5);
});

test("negative numbers", () => {
  assert.equal(Calc.evaluate("-5+2"), -3);
  assert.equal(Calc.evaluate("3×-2"), -6);
  assert.equal(Calc.evaluate("-(2+3)"), -5);
});

test("decimals and floating point noise", () => {
  assert.equal(Calc.evaluate("0.1+0.2"), 0.3);
  assert.equal(Calc.evaluate("1.5×2"), 3);
});

test("percent", () => {
  assert.equal(Calc.evaluate("50%"), 0.5);
  assert.equal(Calc.evaluate("200×10%"), 20);
  assert.equal(Calc.evaluate("(50)%"), 0.5);
  assert.equal(Calc.evaluate("(20+30)%×4"), 2);
  assert.equal(Calc.evaluate("-50%"), -0.5);
  assert.equal(Calc.evaluate("50%2"), 1);
  assert.throws(() => Calc.evaluate("%"), /Incomplete/);
  assert.throws(() => Calc.evaluate("5+%"), /Incomplete/);
});

test("implied multiplication", () => {
  assert.equal(Calc.evaluate("2(3+4)"), 14);
  assert.equal(Calc.evaluate("(2)(3)"), 6);
  assert.equal(Calc.evaluate("(1+1)3"), 6);
  assert.equal(Calc.evaluate("-2(3)"), -6);
});

test("scientific notation (very big and very small answers)", () => {
  assert.equal(Calc.evaluate("1.5e+21×2"), 3e21);
  assert.equal(Calc.evaluate("2e-10×2"), 4e-10);
  const big = Calc.evaluate("99999999999×99999999999");
  assert.match(String(big), /e\+/);
  assert.equal(Calc.evaluate(`${big}÷${big}`), 1);
});

test("errors", () => {
  assert.throws(() => Calc.evaluate("5÷0"), /divide by zero/);
  assert.throws(() => Calc.evaluate("(2+3"), /brackets/);
  assert.throws(() => Calc.evaluate("2+"), /Incomplete/);
  assert.throws(() => Calc.evaluate("1.2.3"), /Invalid number/);
  assert.throws(() => Calc.evaluate("1e308×10"), /too large/);
});

test("format", () => {
  assert.equal(Calc.format(1234567.5), "1,234,567.5");
  assert.equal(Calc.format(1.5e21), "1.5e+21");
  assert.equal(Calc.format(Infinity), "Error");
  assert.equal(Calc.format(0.000000012345), "1.2345e-8");
  assert.equal(Calc.format(9.9999999998e21), "9.9999999998e+21");
  assert.equal(Calc.format(1 / 3), "0.333333333333");
  assert.equal(Calc.format(0.000123), "0.000123");
});
