const { readFileSync } = require("fs");
const { Environment, GlobalEnv } = require("./utils/Environment");
const { isNumber, isString, isVariableName } = require("./utils/Helper");
const Transformer = require("./utils/Transformer");
const evaParser = require("../valid_parser/parserinJs");
class Eva {
  constructor(global = GlobalEnv) {
    this.global = global;
    this._transformer = new Transformer();
  }

  evalGlobal(expressions) {
    return this._evalBlock(expressions, this.global);
  }

  eval(exp, env = this.global) {
    if (isNumber(exp)) {
      return exp;
    }

    if (isString(exp)) {
      //remove the addtional ""
      return exp.slice(1, -1);
    }

    //----------------------
    //Block: sequenece of expressions
    if (exp[0] === "begin") {
      const blockEnv = new Environment({}, env);
      return this._evalBlock(exp, blockEnv);
    }

    //----------------------
    //variabel declaraiton
    if (exp[0] == "var") {
      const [_, name, value] = exp;
      //this.eval(value) instead of value, as some value
      //maybe the pre-defined value or expression
      return env.define(name, this.eval(value, env));
    }

    //----------------------
    //variabel update
    if (exp[0] == "set") {
      const [_, ref, value] = exp;
      //Assignment to a property:
      if (ref[0] === "prop") {
        // console.log({ ref });
        const [_tag, instance, propName] = ref;
        const instanceEnv = this.eval(instance, env);

        return instanceEnv.define(propName, this.eval(value, env));
      }
      return env.assign(ref, this.eval(value, env));
    }

    //-------------------------
    //variabel access
    if (isVariableName(exp)) {
      return env.lookup(exp);
    }

    //-------------------------
    //if expression

    if (exp[0] == "if") {
      const [_tag, condition, consequent, alternate] = exp;

      if (this.eval(condition, env)) {
        return this.eval(consequent, env);
      }
      return this.eval(alternate, env);
    }

    //-------------------------
    //while-expression

    if (exp[0] == "while") {
      const [_tag, condition, body] = exp;
      let result;
      while (this.eval(condition, env)) {
        result = this.eval(body, env);
      }
      return result;
    }

    //-------------------------
    //for-expression to-do

    if (exp[0] == "for") {
      const whileExp = this._transformer.transformForToWhile(exp);
      return this.eval(whileExp, env);
    }

    //-------------------------
    //Increment: (++ foo) to-do

    if (exp[0] == "++") {
      const whileExp = this._transformer.transformIncToSet(exp);
      return this.eval(whileExp, env);
    }

    //-------------------------
    //Increment: (-- foo) to-do
    if (exp[0] == "--") {
      const whileExp = this._transformer.transformDecToSet(exp);
      return this.eval(whileExp, env);
    }

    //-------------------------
    //Increment: (-= foo dec) to-do

    if (exp[0] == "-=") {
      const whileExp = this._transformer.transformDecEqToSet(exp);
      return this.eval(whileExp, env);
    }

    //-------------------------
    //Increment: (+= foo) to-do
    if (exp[0] == "+=") {
      const whileExp = this._transformer.transformIncEqToSet(exp);
      return this.eval(whileExp, env);
    }

    //-------------------------
    //Function declaration: (def square (x) (* x x))
    //
    // Syntactic sugar for (var square (lambda (x) (x * x)))
    if (exp[0] === "def") {
      //use var key word to save to var
      //JIT
      const varExp = this._transformer.transformDefToVarLambda(exp);

      return this.eval(varExp, env);
    }

    if (exp[0] === "switch") {
      const ifExp = this._transformer.transformSwitchToIf(exp);

      return this.eval(ifExp, env);
    }

    //-------------------------
    //Lambda function: (lambda (x) (* x x))
    if (exp[0] === "lambda") {
      const [_tag, params, body] = exp;

      return {
        params,
        body,
        /**
         * save the current env, as the
         * function maybe called in any place
         * this is the only valid parent env
         */
        env,
      };
    }

    //-------------------------
    //class
    if (exp[0] === "class") {
      const [_tag, name, parent, body] = exp;

      const parentEnv = this.eval(parent, env) || env;
      const classEnv = new Environment({}, parentEnv);

      this._evalBody(body, classEnv);

      //class just an env
      return env.define(name, classEnv);
    }

    //-------------------------------
    //super
    if (exp[0] === "super") {
      const [_tag, className] = exp;
      return this.eval(className, env).parent;
    }

    //-------------------------
    //new
    if (exp[0] === "new") {
      const classEnv = this.eval(exp[1], env);
      const instanceEnv = new Environment({}, classEnv);

      //not need to deal with the object it self
      const args = exp.slice(2).map((arg) => this.eval(arg, env));

      this._callUserDefinedFunction(classEnv.lookup("constructor"), [
        instanceEnv,
        ...args,
      ]);

      return instanceEnv;
    }

    //-------------------------
    //Property class
    if (exp[0] === "prop") {
      const [_tag, instance, name] = exp;
      const instanceEnv = this.eval(instance, env);

      return instanceEnv.lookup(name);
    }

    //-------------------------
    //module
    if (exp[0] === "module") {
      const [_tag, name, body] = exp;
      const moduleEnv = new Environment({}, env);
      this._evalBody(body, moduleEnv);
      return env.define(name, moduleEnv);
    }

    //----------------------------
    //import

    if (exp[0] === "import") {
      const [_tag, name] = exp;

      const moduleSrc = readFileSync(
        `.././__tests__/modules/${name}.eva`,
        "utf-8"
      );

      const body = evaParser.parse(`(begin ${moduleSrc})`);

      const moduleExp = ["module", name, body];
      return this.eval(moduleExp, this.global);
    }

    //----------------
    // Finaly as funciton, the exp is an array
    //Ex: (+ x 5) (print "hello world") (foo 5)

    if (Array.isArray(exp)) {
      //fetch the function
      const fn = this.eval(exp[0], env);

      //these args maybe anothe experssion, another varable
      //any other things, so we need to eval them
      const args = exp.slice(1).map((arg) => this.eval(arg, env));

      //pre-defined function will be returned as function
      if (typeof fn === "function") {
        return fn(...args);
      }

      return this._callUserDefinedFunction(fn, args);
    }

    throw `Unimplemented : ${JSON.stringify(exp)}`;
  }

  _callUserDefinedFunction(fn, args) {
    /*
        the function has already stored here
        if is lambda, it will return an object function
        which simply become a new function get defined
        in this new Env
      */
    const activationRecord = {};
    fn.params.forEach(
      (param, index) => (activationRecord[param] = args[index])
    );

    //if it env, this turns into dynamic scop
    //fn.env makes it static
    //this activationEnv is also parameter
    const activationEnv = new Environment(activationRecord, fn.env);

    return this._evalBody(fn.body, activationEnv);
  }

  _evalBody(body, env) {
    if (body[0] === "begin") {
      return this._evalBlock(body, env);
    }

    return this.eval(body, env);
  }

  _evalBlock(block, blockEnv) {
    let result;
    const [_tag, ...expressions] = block;

    expressions.forEach((exp) => {
      /**
       * evaluate each contents, and the last constent
       * will be turned, these values store into the blockEnv
       */
      result = this.eval(exp, blockEnv);
    });

    return result;
  }
}

module.exports = Eva;
