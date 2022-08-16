class Transformer {
  transformDefToVarLambda(defExp) {
    const [_tag, name, params, body] = defExp;
    return ["var", name, ["lambda", params, body]];
  }

  transformSwitchToIf(switchExp) {
    const [_tag, ...cases] = switchExp;
    const ifExp = ["if", null, null, null];

    let current = ifExp;

    for (let i = 0; i < cases.length - 1; ++i) {
      const [currentCond, currentBlock] = cases[i];
      current[1] = currentCond;
      current[2] = currentBlock;

      const next = cases[i + 1];
      const [nextCond, nextBlock] = next;

      current[3] = nextCond === "else" ? nextBlock : ["if"];

      current = current[3];
    }
    console.log(ifExp);
    return ifExp;
  }

  transformForToWhile(ForExp) {
    const [_tag, init, cond, modifier, exp] = ForExp;

    return ["begin", init, ["while", cond, ["begin", exp, modifier]]];
  }

  transformIncToSet(IncExp) {
    const [_, name] = IncExp;
    return ["set", name, ["+", name, 1]];
  }

  transformIncEqToSet(IncExp) {
    const [_, name, value] = IncExp;
    return ["set", name, ["+", name, value]];
  }

  transformDecToSet(DecExp) {
    const [_, name] = DecExp;
    return ["set", name, ["-", name, 1]];
  }

  transformDecEqToSet(DecExp) {
    const [_, name, value] = DecExp;
    return ["set", name, ["-", name, value]];
  }
}

module.exports = Transformer;
