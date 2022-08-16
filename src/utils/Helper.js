const isNumber = (exp) => {
  return typeof exp === "number";
};

const isString = (exp) => {
  return typeof exp === "string" && exp[0] === '"' && exp.slice(-1) === '"';
};

const isVariableName = (exp) => {
  return typeof exp === "string" && /^[+\-*/<>=a-zA-Z0-9_]*$/.test(exp);
};

module.exports = {
  isNumber,
  isString,
  isVariableName,
};
