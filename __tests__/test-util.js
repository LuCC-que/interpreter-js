const assert = require("assert");
const evaParser = require("../valid_parser/parserinJs");

function test(eva, code, expected) {
  const exp = evaParser.parse(`(begin ${code})`);
  // console.log(`${JSON.stringify(exp)}\n`);
  assert.strictEqual(eva.evalGlobal(exp), expected);
}

module.exports = {
  test,
};
