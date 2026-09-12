/* Numeric engine for Titanium 89. No JS eval(). */
(function (global) {
  const FUNS = {
    sin: (x, c) => Math.sin(angleIn(x, c)),
    cos: (x, c) => Math.cos(angleIn(x, c)),
    tan: (x, c) => Math.tan(angleIn(x, c)),
    asin: (x, c) => angleOut(Math.asin(x), c),
    acos: (x, c) => angleOut(Math.acos(x), c),
    atan: (x, c) => angleOut(Math.atan(x), c),
    sinh: (x) => Math.sinh(x),
    cosh: (x) => Math.cosh(x),
    tanh: (x) => Math.tanh(x),
    ln: (x) => Math.log(x),
    log: (x) => Math.log10(x),
    exp: (x) => Math.exp(x),
    sqrt: (x) => Math.sqrt(x),
    abs: (x) => Math.abs(x),
    floor: (x) => Math.floor(x),
    ceil: (x) => Math.ceil(x),
    round: (x) => Math.round(x),
    int: (x) => Math.trunc(x),
    fact: (x) => factorial(x),
    min: (...a) => Math.min(...a),
    max: (...a) => Math.max(...a),
    nroot: (n, x) => Math.pow(x, 1 / n),
    nCr: (n, r) => factorial(n) / (factorial(r) * factorial(n - r)),
    nPr: (n, r) => factorial(n) / factorial(n - r),
  };

  const FUN_NAMES = new Set(Object.keys(FUNS));
  const CONSTS = { pi: Math.PI, π: Math.PI, e: Math.E, inf: Infinity };

  function angleIn(x, ctx) {
    return ctx.angle === "deg" ? (x * Math.PI) / 180 : x;
  }
  function angleOut(x, ctx) {
    return ctx.angle === "deg" ? (x * 180) / Math.PI : x;
  }

  function factorial(n) {
    if (!Number.isFinite(n) || n < 0 || Math.abs(n - Math.round(n)) > 1e-12) {
      throw new Error("Domain error");
    }
    n = Math.round(n);
    if (n > 170) throw new Error("Overflow");
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  function tokenize(src) {
    const s = String(src).replace(/π/g, "pi").replace(/√/g, "sqrt");
    const out = [];
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (/\s/.test(ch)) {
        i++;
        continue;
      }
      if (/[0-9.]/.test(ch) || ((ch === "e" || ch === "E") && false)) {
        const m = s.slice(i).match(/^\d*\.?\d+(?:[eE][+-]?\d+)?/);
        if (m && m[0] !== ".") {
          out.push({ t: "num", v: parseFloat(m[0]) });
          i += m[0].length;
          continue;
        }
      }
      if (/[a-zA-Z_π]/.test(ch)) {
        const m = s.slice(i).match(/^[a-zA-Z_π][a-zA-Z0-9_π]*/);
        out.push({ t: "id", v: m[0] });
        i += m[0].length;
        continue;
      }
      if (ch === "→" || (ch === "-" && s[i + 1] === ">")) {
        out.push({ t: "sto" });
        i += ch === "→" ? 1 : 2;
        continue;
      }
      if ("+-*/^!(),".includes(ch)) {
        out.push({ t: "op", v: ch });
        i++;
        continue;
      }
      if (ch === "×") {
        out.push({ t: "op", v: "*" });
        i++;
        continue;
      }
      if (ch === "÷") {
        out.push({ t: "op", v: "/" });
        i++;
        continue;
      }
      if (ch === "−") {
        out.push({ t: "op", v: "-" });
        i++;
        continue;
      }
      throw new Error("Syntax error");
    }
    return out;
  }

  function implied(tokens) {
    const out = [];
    for (let i = 0; i < tokens.length; i++) {
      const a = tokens[i];
      const b = tokens[i + 1];
      out.push(a);
      if (!b) continue;
      const aVal = a.t === "id" || a.t === "num" || (a.t === "op" && a.v === ")") || (a.t === "op" && a.v === "!");
      const bVal = b.t === "id" || b.t === "num" || (b.t === "op" && b.v === "(");
      if (!aVal || !bVal) continue;
      const call = a.t === "id" && FUN_NAMES.has(a.v) && b.t === "op" && b.v === "(";
      if (!call) out.push({ t: "op", v: "*" });
    }
    return out;
  }

  function unary(tokens) {
    const out = [];
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok.t === "op" && tok.v === "-") {
        const prev = out[out.length - 1];
        const unaryPos =
          !prev ||
          (prev.t === "op" && prev.v !== ")" && prev.v !== "!") ||
          prev.t === "sto";
        out.push(unaryPos ? { t: "op", v: "u-" } : tok);
      } else {
        out.push(tok);
      }
    }
    return out;
  }

  const PREC = { "u-": 5, "!": 5, "^": 4, "*": 3, "/": 3, "+": 2, "-": 2 };
  const RIGHT = { "u-": true, "^": true };

  function toRPN(tokens) {
    const out = [];
    const st = [];
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok.t === "num" || tok.t === "id") {
        out.push(tok);
        continue;
      }
      if (tok.t === "sto") {
        st.push(tok);
        continue;
      }
      if (tok.t === "op" && tok.v === ",") {
        while (st.length && !(st[st.length - 1].t === "op" && st[st.length - 1].v === "(")) {
          out.push(st.pop());
        }
        continue;
      }
      if (tok.t === "op" && tok.v === "(") {
        st.push(tok);
        continue;
      }
      if (tok.t === "op" && tok.v === ")") {
        while (st.length && !(st[st.length - 1].t === "op" && st[st.length - 1].v === "(")) {
          out.push(st.pop());
        }
        if (!st.length) throw new Error("Syntax error");
        st.pop();
        continue;
      }
      if (tok.t === "op") {
        while (st.length) {
          const top = st[st.length - 1];
          if (top.t !== "op" || top.v === "(") break;
          const pT = PREC[top.v] || 0;
          const pC = PREC[tok.v] || 0;
          if (pT > pC || (pT === pC && !RIGHT[tok.v])) out.push(st.pop());
          else break;
        }
        st.push(tok);
      }
    }
    while (st.length) {
      const t = st.pop();
      if (t.t === "op" && (t.v === "(" || t.v === ")")) throw new Error("Syntax error");
      out.push(t);
    }
    return out;
  }

  function lookup(name, ctx) {
    const k = name.toLowerCase();
    if (k === "ans") return ctx.ans;
    if (Object.prototype.hasOwnProperty.call(CONSTS, k)) return CONSTS[k];
    if (ctx.vars && Object.prototype.hasOwnProperty.call(ctx.vars, k)) return ctx.vars[k];
    throw new Error("Undefined " + name);
  }

  function evalRPN(rpn, ctx) {
    const st = [];
    for (const tok of rpn) {
      if (tok.t === "num") {
        st.push(tok.v);
        continue;
      }
      if (tok.t === "id") {
        if (FUN_NAMES.has(tok.v)) {
          st.push({ fn: tok.v });
        } else {
          st.push(lookup(tok.v, ctx));
        }
        continue;
      }
      if (tok.t === "op" && tok.v === "u-") {
        if (!st.length) throw new Error("Syntax error");
        st.push(-popNum(st));
        continue;
      }
      if (tok.t === "op" && tok.v === "!") {
        st.push(factorial(popNum(st)));
        continue;
      }
      if (tok.t === "op") {
        const b = popNum(st);
        const a = popNum(st);
        let r;
        if (tok.v === "+") r = a + b;
        else if (tok.v === "-") r = a - b;
        else if (tok.v === "*") r = a * b;
        else if (tok.v === "/") {
          if (b === 0) throw new Error("Undefined");
          r = a / b;
        } else if (tok.v === "^") r = Math.pow(a, b);
        else throw new Error("Syntax error");
        st.push(r);
        continue;
      }
    }
    if (st.length !== 1) throw new Error("Syntax error");
    const top = st[0];
    if (top && typeof top === "object" && top.fn) {
      return callFun(top.fn, [], ctx);
    }
    return asNum(top);
  }

  function popNum(st) {
    if (!st.length) throw new Error("Syntax error");
    const v = st.pop();
    if (v && typeof v === "object" && v.fn) throw new Error("Syntax error");
    return asNum(v);
  }

  function asNum(v) {
    const n = Number(v);
    if (!Number.isFinite(n) && n !== Infinity && n !== -Infinity) throw new Error("Undefined");
    return n;
  }

  function callFun(name, args, ctx) {
    const fn = FUNS[name];
    if (name === "min" || name === "max") return fn(...args);
    if (name === "nroot" || name === "nCr" || name === "nPr") {
      if (args.length !== 2) throw new Error("Syntax error");
      return fn(args[0], args[1]);
    }
    if (args.length !== 1) throw new Error("Syntax error");
    const r = fn(args[0], ctx);
    if (Number.isNaN(r)) throw new Error("Domain error");
    return r;
  }

  function rewriteCalls(tokens) {
    const out = [];
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const next = tokens[i + 1];
      if (tok.t === "id" && FUN_NAMES.has(tok.v) && next && next.t === "op" && next.v === "(") {
        let depth = 0;
        let j = i + 1;
        const args = [[]];
        j++;
        depth = 1;
        while (j < tokens.length && depth) {
          const t = tokens[j];
          if (t.t === "op" && t.v === "(") depth++;
          if (t.t === "op" && t.v === ")") {
            depth--;
            if (!depth) break;
          }
          if (t.t === "op" && t.v === "," && depth === 1) args.push([]);
          else if (depth) args[args.length - 1].push(t);
          j++;
        }
        if (depth) throw new Error("Syntax error");
        out.push({ t: "call", v: tok.v, args: args.filter((a) => a.length) });
        i = j;
        continue;
      }
      out.push(tok);
    }
    return out;
  }

  function evalTokens(tokens, ctx) {
    const rewritten = [];
    const walk = (list) => {
      const inner = rewriteCalls(list);
      const mapped = inner.map((t) => {
        if (t.t === "call") {
          const vals = t.args.map((a) => evalTokens(a, ctx));
          return { t: "num", v: callFun(t.v, vals, ctx) };
        }
        return t;
      });
      rewritten.push(mapped);
      return mapped;
    };
    const flat = walk(tokens);
    return evalRPN(toRPN(flat), ctx);
  }

  function splitSto(tokens) {
    let idx = -1;
    for (let i = 0; i < tokens.length; i++) if (tokens[i].t === "sto") idx = i;
    if (idx < 0) return null;
    const left = tokens.slice(0, idx);
    const right = tokens.slice(idx + 1);
    if (right.length !== 1 || right[0].t !== "id") throw new Error("Syntax error");
    return { left, name: right[0].v };
  }

  function evaluate(expr, ctx) {
    ctx = ctx || { angle: "rad", ans: 0, vars: {} };
    const tokens = unary(implied(tokenize(expr)));
    if (!tokens.length) throw new Error("Empty");
    const sto = splitSto(tokens);
    if (sto) {
      const value = evalTokens(sto.left, ctx);
      ctx.vars[sto.name.toLowerCase()] = value;
      return value;
    }
    return evalTokens(tokens, ctx);
  }

  function nearly(a, b) {
    return Math.abs(a - b) <= 1e-10 * Math.max(1, Math.abs(a), Math.abs(b));
  }

  function toFraction(x) {
    if (!Number.isFinite(x)) return null;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    if (nearly(x, Math.round(x))) return { n: sign * Math.round(x), d: 1 };
    let h1 = 1, h0 = 0, k1 = 0, k0 = 1, b = x;
    for (let i = 0; i < 20; i++) {
      const a = Math.floor(b);
      const h2 = a * h1 + h0;
      const k2 = a * k1 + k0;
      if (k2 > 10000) break;
      h0 = h1; k0 = k1; h1 = h2; k1 = k2;
      if (nearly(x, h2 / k2)) return { n: sign * h2, d: k2 };
      const frac = b - a;
      if (frac < 1e-12) break;
      b = 1 / frac;
    }
    return null;
  }

  function format(n, exact) {
    if (n === Infinity) return "∞";
    if (n === -Infinity) return "-∞";
    if (!Number.isFinite(n)) return "undef";
    if (exact) {
      const f = toFraction(n);
      if (f && f.d !== 1) return f.n + "/" + f.d;
      if (f && f.d === 1) return String(f.n);
      if (nearly(n, Math.PI)) return "π";
      if (nearly(n, -Math.PI)) return "-π";
      if (nearly(n, Math.E)) return "e";
    }
    if (nearly(n, Math.round(n)) && Math.abs(n) < 1e12) return String(Math.round(n));
    const abs = Math.abs(n);
    if (abs !== 0 && (abs >= 1e10 || abs < 1e-4)) {
      return n.toExponential(9).replace(/e\+?/, "ᴇ").replace(/0+ᴇ/, "ᴇ").replace(/0+E/, "E");
    }
    let s = n.toPrecision(12);
    if (s.indexOf("e") >= 0) return Number(n).toExponential(9).replace(/e\+?/, "ᴇ");
    s = String(Number(s));
    return s;
  }

  global.TIMath = { evaluate, format, FUN_NAMES: FUN_NAMES };
})(typeof window !== "undefined" ? window : globalThis);
