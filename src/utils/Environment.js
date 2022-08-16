class Environment {
  constructor(record = {}, parent = null) {
    this.record = record;
    this.parent = parent;
    this.id = parent ? parent.id + 1 : 0;
  }
  define(name, value) {
    this.record[name] = value;
    return value;
  }

  //update the value

  assign(name, value) {
    this.resolve(name).record[name] = value;
    return value;
  }

  //
  lookup(name) {
    return this.resolve(name).record[name];
  }

  resolve(name) {
    if (this.record.hasOwnProperty(name)) {
      return this;
    }

    if (this.parent == null) {
      throw new ReferenceError(`Variable not find ${name}`);
    }

    return this.parent.resolve(name);
  }
}

const GlobalEnv = new Environment({
  null: null,
  true: true,
  false: false,
  Version: "0.01",

  "+"(op1, op2) {
    return op1 + op2;
  },
  "-"(op1, op2 = null) {
    return op2 ? op1 - op2 : -op1;
  },
  "*"(op1, op2) {
    return op1 * op2;
  },
  "/"(op1, op2) {
    return op1 / op2;
  },

  "<"(op1, op2) {
    return op1 < op2;
  },
  ">"(op1, op2) {
    return op1 > op2;
  },
  "<="(op1, op2) {
    return op1 <= op2;
  },
  ">="(op1, op2) {
    return op1 >= op2;
  },
  "="(op1, op2) {
    return op1 === op2;
  },

  print(...args) {
    console.log(...args);
  },
});

module.exports = { Environment, GlobalEnv };
