const Eva = require("../src/Eva");

const tests = [
  require("./tests/self-eval-test.js"),
  require("./tests/math-test.js"),
  require("./tests/variables-test.js"),
  require("./tests/block-test.js"),
  require("./tests/if-test.js"),
  require("./tests/while-test.js"),
  require("./tests/built-in-function-test.js"),
  require("./tests/user-defined-function-test.js"),
  require("./tests/lambda-function-test.js"),
  require("./tests/switch-test.js"),
  require("./tests/for-test.js"),
  require("./tests/inc-test.js"),
  require("./tests/dec-test.js"),
  require("./tests/inc-val-test.js"),
  require("./tests/dec-val-test.js"),
  require("./tests/class-test.js"),
  require("./tests/module-test.js"),
  require("./tests/import-test.js"),
];

const eva = new Eva();
eva.eval(["print", '"--------start"', '"testing!------------"']);
eva.eval(["begin", ["+", 5, 2]], "hello");
tests.forEach((test) => test(eva));

console.log("------------All assertions passed!--------------");
