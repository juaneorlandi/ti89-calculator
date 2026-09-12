(function () {
  const lcd = document.getElementById("lcd");
  const keysRoot = document.getElementById("keys");

  const state = {
    on: false,
    splash: false,
    mode: "home",
    second: false,
    secondLock: false,
    alpha: false,
    alphaLock: false,
    diamond: false,
    angle: "rad",
    exact: true,
    entry: "",
    cursor: 0,
    history: [],
    error: null,
    ans: 0,
    vars: { x: 0, y: 0, z: 0, t: 0, a: 0, b: 0, c: 0 },
    ylist: ["sin(x)", "", ""],
    yIndex: 0,
    win: { xmin: -10, xmax: 10, ymin: -10, ymax: 10, xscl: 1, yscl: 1 },
    winIndex: 0,
    traceOn: false,
    traceX: 0,
    tableStart: -5,
    tableStep: 1,
    tableOff: 0,
    catOff: 0,
    appsOff: 0,
    clock: "",
  };

  const CATALOG = [
    "sin(", "cos(", "tan(", "asin(", "acos(", "atan(",
    "ln(", "log(", "exp(", "sqrt(", "abs(", "fact(",
    "π", "e", "ans", "nCr(", "nPr(",
  ];
  const APPS = ["HOME", "Y=", "WINDOW", "GRAPH", "TABLE", "MODE", "CATALOG"];
  const WIN_KEYS = ["xmin", "xmax", "xscl", "ymin", "ymax", "yscl"];
  const SOFT = {
    home: ["Clr", "RAD", "Y=", "WIN", "GRAPH", "TBL"],
    yeq: ["sel", "clr", "HOME", "WIN", "GRAPH", "TBL"],
    window: ["std", "zoom", "HOME", "Y=", "GRAPH", "TBL"],
    graph: ["trace", "zoom", "HOME", "Y=", "WIN", "TBL"],
    table: ["▲", "▼", "HOME", "Y=", "WIN", "GRAPH"],
    mode: ["RAD", "EXACT", "HOME", "", "", ""],
    cat: ["▲", "▼", "ins", "HOME", "", ""],
    apps: ["go", "", "HOME", "", "", ""],
  };

  const LAYOUT = [
    { cls: "f", keys: [
      k("f1", "F1"), k("f2", "F2"), k("f3", "F3"), k("f4", "F4"), k("f5", "F5"), k("f6", "F6"),
    ]},
    { cls: "g", keys: [
      k("y=", "Y=", { second: "cut", diamond: "Y=" }),
      k("window", "WINDOW", { second: "copy" }),
      k("graph", "GRAPH", { second: "paste" }),
      k("tblset", "TBLSET"),
      k("table", "TABLE"),
    ]},
    { cls: "mod", keys: [
      k("2nd", "2nd", { cls: "key-2nd" }),
      k("diamond", "♦", { cls: "key-dia" }),
      k("alpha", "α", { cls: "key-alpha" }),
      k("esc", "ESC"),
      k("apps", "APPS"),
      k("mode", "MODE", { second: "QUIT" }),
    ]},
    { cls: "nav", keys: [
      k("home", "HOME"),
      k("cat", "CATALOG"),
      k("del", "DEL", { second: "INS" }),
      k("left", "◄"),
      k("up", "▲"),
      k("right", "►"),
    ]},
    { cls: "fn", keys: [
      k("sin", "SIN", { second: "SIN⁻¹", alpha: "I", insert: "sin(", secondInsert: "asin(" }),
      k("cos", "COS", { second: "COS⁻¹", alpha: "J", insert: "cos(", secondInsert: "acos(" }),
      k("tan", "TAN", { second: "TAN⁻¹", alpha: "K", insert: "tan(", secondInsert: "atan(" }),
      k("pow", "^", { second: "π", alpha: "P", insert: "^", secondInsert: "π" }),
      k("lpar", "(", { alpha: "Q", insert: "(" }),
      k("rpar", ")", { alpha: "R", insert: ")" }),
      k("comma", ",", { alpha: "S", insert: "," }),
    ]},
    { cls: "fn", keys: [
      k("ln", "LN", { second: "eˣ", alpha: "L", insert: "ln(", secondInsert: "exp(" }),
      k("ee", "EE", { alpha: "M", insert: "e" }),
      k("pi", "π", { alpha: "N", insert: "π" }),
      k("sto", "STO▶", { alpha: "O", insert: "→" }),
      k("sqrt", "√", { second: "x²", alpha: "T", insert: "sqrt(", secondInsert: "^2" }),
      k("inv", "x⁻¹", { alpha: "U", insert: "^(-1)" }),
      k("div", "÷", { alpha: "V", insert: "/" }),
    ]},
    { cls: "num", keys: [
      k("7", "7", { alpha: "A", insert: "7", alphaInsert: "a" }),
      k("8", "8", { alpha: "B", insert: "8", alphaInsert: "b" }),
      k("9", "9", { alpha: "C", insert: "9", alphaInsert: "c" }),
      k("mul", "×", { alpha: "W", insert: "*" }),
      k("clear", "CLEAR"),
    ]},
    { cls: "num", keys: [
      k("4", "4", { alpha: "D", insert: "4", alphaInsert: "d" }),
      k("5", "5", { alpha: "E", insert: "5", alphaInsert: "e" }),
      k("6", "6", { alpha: "F", insert: "6", alphaInsert: "f" }),
      k("sub", "−", { alpha: "X", insert: "-" }),
      k("down", "▼"),
    ]},
    { cls: "num", keys: [
      k("1", "1", { alpha: "G", insert: "1", alphaInsert: "g" }),
      k("2", "2", { alpha: "H", insert: "2", alphaInsert: "h" }),
      k("3", "3", { alpha: "I", insert: "3", alphaInsert: "x" }),
      k("add", "+", { alpha: "Y", insert: "+" }),
      k("enter", "ENTER", { cls: "key-enter", second: "≈" }),
    ]},
    { cls: "bot", keys: [
      k("on", "ON", { cls: "key-on", second: "OFF" }),
      k("0", "0", { insert: "0" }),
      k("dot", ".", { insert: "." }),
      k("neg", "(−)", { insert: "-" }),
      k("xvar", "X", { alpha: "Z", insert: "x", alphaInsert: "z" }),
    ]},
  ];

  function k(id, label, extra) {
    return Object.assign({ id, label, cls: "" }, extra || {});
  }

  function pad(n) { return String(n).padStart(2, "0"); }
  function tickClock() {
    const d = new Date();
    state.clock = pad(d.getHours()) + ":" + pad(d.getMinutes());
    if (state.on) render();
  }

  function consumeMod() {
    const m = {
      second: state.secondLock || state.second,
      alpha: state.alphaLock || state.alpha,
      diamond: state.diamond,
    };
    if (!state.secondLock) state.second = false;
    if (!state.alphaLock) state.alpha = false;
    state.diamond = false;
    return m;
  }

  function insert(text) {
    const e = state.entry;
    const c = state.cursor;
    state.entry = e.slice(0, c) + text + e.slice(c);
    state.cursor = c + text.length;
    state.error = null;
  }

  function ctx() {
    return { angle: state.angle, ans: state.ans, vars: state.vars };
  }

  function evalEntry() {
    const expr = state.entry.trim();
    if (!expr) return;
    try {
      const value = TIMath.evaluate(expr, ctx());
      state.ans = value;
      state.vars.ans = value;
      const shown = TIMath.format(value, state.exact);
      state.history.push({ expr, result: shown });
      if (state.history.length > 8) state.history.shift();
      state.entry = "";
      state.cursor = 0;
      state.error = null;
    } catch (err) {
      state.error = err.message || "Error";
    }
  }

  function powerOn() {
    state.on = true;
    state.splash = true;
    state.mode = "home";
    state.error = null;
    render();
    setTimeout(function () {
      state.splash = false;
      render();
    }, 900);
  }

  function powerOff() {
    state.on = false;
    state.splash = false;
    state.second = state.alpha = state.diamond = false;
    state.secondLock = state.alphaLock = false;
    render();
  }

  function setMode(m) {
    if (state.mode === "yeq") state.ylist[state.yIndex] = state.entry;
    if (state.mode === "window" && m !== "window") commitWin();
    state.mode = m;
    state.error = null;
    if (m === "yeq") {
      state.entry = state.ylist[state.yIndex];
      state.cursor = state.entry.length;
    } else if (m === "window") {
      state.entry = String(state.win[WIN_KEYS[state.winIndex]]);
      state.cursor = state.entry.length;
    } else if (m === "graph") {
      state.traceOn = false;
      state.traceX = (state.win.xmin + state.win.xmax) / 2;
    } else if (m === "home") {
      state.entry = "";
      state.cursor = 0;
    }
  }

  function handle(id) {
    if (!state.on) {
      if (id === "on") powerOn();
      return;
    }
    if (id === "2nd") {
      if (state.second) state.secondLock = !state.secondLock;
      state.second = !state.second;
      if (state.secondLock) state.second = true;
      render();
      return;
    }
    if (id === "alpha") {
      if (state.alpha) state.alphaLock = !state.alphaLock;
      state.alpha = !state.alpha;
      if (state.alphaLock) state.alpha = true;
      render();
      return;
    }
    if (id === "diamond") {
      state.diamond = !state.diamond;
      render();
      return;
    }

    const mod = consumeMod();
    if (id === "on") {
      if (mod.second) powerOff();
      return;
    }

    if (id === "esc") {
      if (state.mode !== "home") setMode("home");
      else { state.entry = ""; state.cursor = 0; state.error = null; }
      render();
      return;
    }

    if (id === "home") { setMode("home"); render(); return; }
    if (id === "apps") { setMode("apps"); render(); return; }
    if (id === "cat") { setMode("cat"); render(); return; }
    if (id === "mode" && !mod.second) { setMode("mode"); render(); return; }
    if (id === "mode" && mod.second) { setMode("home"); render(); return; }
    if (id === "y=" || (mod.diamond && id === "y=")) { setMode("yeq"); render(); return; }
    if (id === "window") { setMode("window"); render(); return; }
    if (id === "graph") { setMode("graph"); render(); return; }
    if (id === "table") { setMode("table"); render(); return; }
    if (id === "tblset") { setMode("window"); render(); return; }

    if (id.startsWith("f")) {
      softKey(Number(id.slice(1)));
      render();
      return;
    }

    if (id === "clear") {
      if (mod.second) { state.history = []; state.error = null; }
      state.entry = "";
      state.cursor = 0;
      state.error = null;
      if (state.mode === "yeq") state.ylist[state.yIndex] = "";
      render();
      return;
    }
    if (id === "del") {
      if (state.cursor > 0) {
        state.entry = state.entry.slice(0, state.cursor - 1) + state.entry.slice(state.cursor);
        state.cursor--;
      }
      render();
      return;
    }
    if (id === "left") { move(-1); render(); return; }
    if (id === "right") { move(1); render(); return; }
    if (id === "up") { nav(-1); render(); return; }
    if (id === "down") { nav(1); render(); return; }

    if (id === "enter") {
      if (mod.second) state.exact = false;
      if (state.mode === "home") evalEntry();
      else if (state.mode === "yeq") setMode("graph");
      else if (state.mode === "window") commitWin();
      else if (state.mode === "cat") insert(CATALOG[state.catOff]);
      else if (state.mode === "apps") runApp(APPS[state.appsOff]);
      else if (state.mode === "graph") state.traceOn = !state.traceOn;
      if (!mod.second) state.exact = true;
      render();
      return;
    }

    const def = findKey(id);
    if (!def) { render(); return; }

    if (state.mode === "yeq" || state.mode === "window" || state.mode === "home") {
      const text = pickInsert(def, mod);
      if (text) {
        insert(text);
        if (state.mode === "yeq") state.ylist[state.yIndex] = state.entry;
      }
      render();
      return;
    }
    if (state.mode !== "home" && state.mode !== "yeq" && state.mode !== "window") {
      if (["graph", "table", "mode", "cat", "apps"].indexOf(state.mode) >= 0) {
        const text = pickInsert(def, mod);
        if (text) {
          setMode("home");
          insert(text);
        }
      }
      render();
      return;
    }
    const text = pickInsert(def, mod);
    if (text) insert(text);
    render();
  }

  function pickInsert(def, mod) {
    if (mod.alpha && def.alphaInsert) return def.alphaInsert;
    if (mod.alpha && def.alpha) return def.alpha.toLowerCase();
    if (mod.second && def.secondInsert) return def.secondInsert;
    return def.insert || null;
  }

  function findKey(id) {
    for (const row of LAYOUT) for (const key of row.keys) if (key.id === id) return key;
    return null;
  }

  function move(dir) {
    if (state.mode === "graph" && state.traceOn) {
      const step = (state.win.xmax - state.win.xmin) / 80;
      state.traceX += dir * step;
      return;
    }
    state.cursor = Math.max(0, Math.min(state.entry.length, state.cursor + dir));
  }

  function nav(dir) {
    if (state.mode === "yeq") {
      state.ylist[state.yIndex] = state.entry;
      state.yIndex = (state.yIndex + dir + 3) % 3;
      state.entry = state.ylist[state.yIndex];
      state.cursor = state.entry.length;
    } else if (state.mode === "window") {
      commitWin();
      state.winIndex = (state.winIndex + dir + WIN_KEYS.length) % WIN_KEYS.length;
      state.entry = String(state.win[WIN_KEYS[state.winIndex]]);
      state.cursor = state.entry.length;
    } else if (state.mode === "cat") {
      state.catOff = (state.catOff + dir + CATALOG.length) % CATALOG.length;
    } else if (state.mode === "apps") {
      state.appsOff = (state.appsOff + dir + APPS.length) % APPS.length;
    } else if (state.mode === "table") {
      state.tableOff += dir;
    } else if (state.mode === "home" && dir < 0 && state.history.length) {
      const last = state.history[state.history.length - 1];
      state.entry = last.expr;
      state.cursor = state.entry.length;
    }
  }

  function commitWin() {
    const key = WIN_KEYS[state.winIndex];
    const n = Number(state.entry);
    if (Number.isFinite(n)) state.win[key] = n;
    state.entry = String(state.win[key]);
    state.cursor = state.entry.length;
  }

  function runApp(name) {
    const map = { HOME: "home", "Y=": "yeq", WINDOW: "window", GRAPH: "graph", TABLE: "table", MODE: "mode", CATALOG: "cat" };
    setMode(map[name] || "home");
  }

  function softKey(n) {
    const labels = SOFT[state.mode] || SOFT.home;
    const lab = (labels[n - 1] || "").toLowerCase();
    if (state.mode === "home") {
      if (n === 1) { state.history = []; state.entry = ""; state.cursor = 0; state.error = null; }
      if (n === 2) state.angle = state.angle === "rad" ? "deg" : "rad";
      if (n === 3) setMode("yeq");
      if (n === 4) setMode("window");
      if (n === 5) setMode("graph");
      if (n === 6) setMode("table");
    } else if (state.mode === "yeq") {
      if (n === 2) state.ylist[state.yIndex] = "";
      if (n === 3) setMode("home");
      if (n === 4) setMode("window");
      if (n === 5) setMode("graph");
      if (n === 6) setMode("table");
    } else if (state.mode === "window") {
      if (n === 1) {
        state.win = { xmin: -10, xmax: 10, ymin: -10, ymax: 10, xscl: 1, yscl: 1 };
        state.entry = String(state.win[WIN_KEYS[state.winIndex]]);
      }
      if (n === 3) setMode("home");
      if (n === 4) setMode("yeq");
      if (n === 5) setMode("graph");
      if (n === 6) setMode("table");
    } else if (state.mode === "graph") {
      if (n === 1) state.traceOn = !state.traceOn;
      if (n === 2) zoomFit();
      if (n === 3) setMode("home");
      if (n === 4) setMode("yeq");
      if (n === 5) setMode("window");
      if (n === 6) setMode("table");
    } else if (state.mode === "table") {
      if (n === 1) state.tableOff--;
      if (n === 2) state.tableOff++;
      if (n === 3) setMode("home");
      if (n === 4) setMode("yeq");
      if (n === 5) setMode("window");
      if (n === 6) setMode("graph");
    } else if (state.mode === "mode") {
      if (n === 1) state.angle = state.angle === "rad" ? "deg" : "rad";
      if (n === 2) state.exact = !state.exact;
      if (n === 3) setMode("home");
    } else if (state.mode === "cat") {
      if (n === 1) state.catOff = (state.catOff - 1 + CATALOG.length) % CATALOG.length;
      if (n === 2) state.catOff = (state.catOff + 1) % CATALOG.length;
      if (n === 3) { insert(CATALOG[state.catOff]); setMode("home"); }
      if (n === 4) setMode("home");
    } else if (state.mode === "apps") {
      if (n === 1) runApp(APPS[state.appsOff]);
      if (n === 3) setMode("home");
    }
    SOFT.home[1] = state.angle === "rad" ? "DEG" : "RAD";
  }

  function zoomFit() {
    const xs = [];
    const ys = [];
    const w = state.win;
    for (let i = 0; i < 80; i++) {
      const x = w.xmin + (i / 79) * (w.xmax - w.xmin);
      state.vars.x = x;
      for (const expr of state.ylist) {
        if (!expr.trim()) continue;
        try {
          const y = TIMath.evaluate(expr, ctx());
          if (Number.isFinite(y)) { xs.push(x); ys.push(y); }
        } catch (e) {}
      }
    }
    if (!ys.length) return;
    const minY = Math.min.apply(null, ys);
    const maxY = Math.max.apply(null, ys);
    const padY = (maxY - minY) * 0.12 || 1;
    w.ymin = minY - padY;
    w.ymax = maxY + padY;
  }

  function modeLabel() {
    const map = { home: "HOME", yeq: "Y=", window: "WINDOW", graph: "GRAPH", table: "TABLE", mode: "MODE", cat: "CATALOG", apps: "APPS" };
    return map[state.mode] || "HOME";
  }

  function render() {
    lcd.classList.toggle("off", !state.on);
    paintKeys();
    if (!state.on) {
      lcd.innerHTML = '<div class="screen-body"><div class="splash"><div class="small">press ON</div></div></div>';
      return;
    }
    if (state.splash) {
      lcd.innerHTML =
        '<div class="status"><span>TI-89</span><span>AMS 3.10</span></div>' +
        '<div class="screen-body"><div class="splash"><div class="big">TI-89</div><div class="small">DALMATIAN</div><div class="small">Advanced Mathematics Software</div></div></div>' +
        softHtml();
      return;
    }
    const ang = state.angle === "rad" ? "RAD" : "DEG";
    const mods = (state.second || state.secondLock ? "2nd " : "") + (state.alpha || state.alphaLock ? "α " : "") + (state.diamond ? "♦ " : "");
    lcd.innerHTML =
      '<div class="status"><span>' + ang + "  FUNC  " + modeLabel() + '</span><span>' + mods + state.clock + "</span></div>" +
      '<div class="screen-body" id="body"></div>' +
      softHtml();
    const body = document.getElementById("body");
    if (state.mode === "home") renderHome(body);
    else if (state.mode === "yeq") renderYeq(body);
    else if (state.mode === "window") renderWindow(body);
    else if (state.mode === "graph") renderGraph(body);
    else if (state.mode === "table") renderTable(body);
    else if (state.mode === "mode") renderMode(body);
    else if (state.mode === "cat") renderList(body, CATALOG, state.catOff);
    else if (state.mode === "apps") renderList(body, APPS, state.appsOff);
  }

  function softHtml() {
    const labels = (SOFT[state.mode] || SOFT.home).slice();
    if (state.mode === "home") labels[1] = state.angle === "rad" ? "DEG" : "RAD";
    if (state.mode === "mode") {
      labels[0] = state.angle === "rad" ? "DEG" : "RAD";
      labels[1] = state.exact ? "APROX" : "EXACT";
    }
    return '<div class="soft">' + labels.map(function (s) { return "<span>" + s + "</span>"; }).join("") + "</div>";
  }

  function renderHome(body) {
    const rows = state.history.slice(-5).map(function (h) {
      return '<div class="hist-row"><span class="ex">' + esc(h.expr) + '</span><span class="rs">' + esc(h.result) + "</span></div>";
    }).join("");
    body.innerHTML =
      '<div class="history">' + rows + "</div>" +
      (state.error ? '<div class="error">' + esc(state.error) + "</div>" : "") +
      '<div class="entry"><span class="prompt">►</span>' + entryHtml() + "</div>";
  }

  function entryHtml() {
    const e = state.entry;
    const c = state.cursor;
    return '<span class="entry-text">' + esc(e.slice(0, c)) + '<span class="caret"></span>' + esc(e.slice(c)) + "</span>";
  }

  function renderYeq(body) {
    const lines = state.ylist.map(function (y, i) {
      const val = i === state.yIndex ? state.entry : y;
      const sel = i === state.yIndex ? " sel" : "";
      const caret = i === state.yIndex ? '<span class="caret"></span>' : "";
      return '<div class="list' + sel + '">y' + (i + 1) + "=" + esc(val) + caret + "</div>";
    }).join("");
    body.innerHTML = lines + '<div class="entry" style="margin-top:8px;font-size:11px;opacity:.7">ENTER = GRAPH</div>';
  }

  function renderWindow(body) {
    const lines = WIN_KEYS.map(function (key, i) {
      const sel = i === state.winIndex ? " sel" : "";
      const val = i === state.winIndex ? state.entry : String(state.win[key]);
      const caret = i === state.winIndex ? '<span class="caret"></span>' : "";
      return '<div class="list' + sel + '">' + key + "=" + esc(val) + caret + "</div>";
    }).join("");
    body.innerHTML = lines;
  }

  function renderMode(body) {
    body.innerHTML =
      '<div class="list">1: Angle = ' + (state.angle === "rad" ? "RADIAN" : "DEGREE") + "</div>" +
      '<div class="list">2: Exact = ' + (state.exact ? "ON" : "OFF") + "</div>" +
      '<div class="list" style="margin-top:8px;opacity:.7">F1 cambia ángulo · F2 exacto</div>';
  }

  function renderList(body, items, off) {
    const start = Math.max(0, off - 2);
    const view = items.slice(start, start + 6);
    body.innerHTML = view.map(function (item, i) {
      const sel = start + i === off ? " sel" : "";
      return '<div class="list' + sel + '">' + esc(item) + "</div>";
    }).join("");
  }

  function renderTable(body) {
    const start = state.tableStart + state.tableOff * state.tableStep;
    let html = '<div class="hist-row"><span>x</span><span>y1</span></div>';
    for (let i = 0; i < 6; i++) {
      const x = start + i * state.tableStep;
      state.vars.x = x;
      let y = "";
      try { y = state.ylist[0].trim() ? TIMath.format(TIMath.evaluate(state.ylist[0], ctx()), false) : ""; }
      catch (e) { y = "error"; }
      html += '<div class="hist-row"><span>' + x + "</span><span>" + y + "</span></div>";
    }
    body.innerHTML = html;
  }

  function renderGraph(body) {
    body.innerHTML = '<canvas class="graph-canvas" id="gcan" width="320" height="148"></canvas>' +
      (state.traceOn ? '<div class="trace-readout" id="tr"></div>' : "");
    const canvas = document.getElementById("gcan");
    const g = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const w = state.win;
    g.fillStyle = "#c9d3a6";
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(26,36,16,0.25)";
    g.lineWidth = 1;
    const xTo = function (x) { return ((x - w.xmin) / (w.xmax - w.xmin)) * W; };
    const yTo = function (y) { return H - ((y - w.ymin) / (w.ymax - w.ymin)) * H; };
    if (w.xscl > 0) {
      for (let x = Math.ceil(w.xmin / w.xscl) * w.xscl; x <= w.xmax; x += w.xscl) {
        const px = xTo(x);
        g.beginPath(); g.moveTo(px, 0); g.lineTo(px, H); g.stroke();
      }
    }
    if (w.yscl > 0) {
      for (let y = Math.ceil(w.ymin / w.yscl) * w.yscl; y <= w.ymax; y += w.yscl) {
        const py = yTo(y);
        g.beginPath(); g.moveTo(0, py); g.lineTo(W, py); g.stroke();
      }
    }
    g.strokeStyle = "#1a2410";
    g.lineWidth = 1.25;
    g.beginPath(); g.moveTo(xTo(0), 0); g.lineTo(xTo(0), H); g.stroke();
    g.beginPath(); g.moveTo(0, yTo(0)); g.lineTo(W, yTo(0)); g.stroke();

    const styles = ["#1a2410", "#1a2410", "#1a2410"];
    const dashes = [[], [3, 3], [1, 3]];
    state.ylist.forEach(function (expr, idx) {
      if (!expr.trim()) return;
      g.save();
      g.strokeStyle = styles[idx];
      g.setLineDash(dashes[idx]);
      g.lineWidth = 1.4;
      g.beginPath();
      let started = false;
      let lastY = 0;
      for (let i = 0; i < W; i++) {
        const x = w.xmin + (i / (W - 1)) * (w.xmax - w.xmin);
        state.vars.x = x;
        let y;
        try { y = TIMath.evaluate(expr, ctx()); }
        catch (e) { started = false; continue; }
        if (!Number.isFinite(y)) { started = false; continue; }
        const py = yTo(y);
        if (!started || Math.abs(py - lastY) > H * 0.7) {
          g.moveTo(i, py);
          started = true;
        } else g.lineTo(i, py);
        lastY = py;
      }
      g.stroke();
      g.restore();
    });

    if (state.traceOn) {
      const x = Math.min(w.xmax, Math.max(w.xmin, state.traceX));
      state.vars.x = x;
      let y = NaN;
      try { if (state.ylist[0].trim()) y = TIMath.evaluate(state.ylist[0], ctx()); } catch (e) {}
      const px = xTo(x);
      const py = Number.isFinite(y) ? yTo(y) : yTo(0);
      g.strokeStyle = "#1a2410";
      g.beginPath(); g.moveTo(px, 0); g.lineTo(px, H); g.stroke();
      g.beginPath(); g.moveTo(0, py); g.lineTo(W, py); g.stroke();
      g.fillStyle = "#1a2410";
      g.fillRect(px - 2, py - 2, 5, 5);
      const tr = document.getElementById("tr");
      if (tr) tr.textContent = "x=" + TIMath.format(x, false) + "  y=" + (Number.isFinite(y) ? TIMath.format(y, false) : "undef");
    }
  }

  function esc(s) {
    return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; });
  }

  function paintKeys() {
    keysRoot.querySelectorAll(".key").forEach(function (btn) {
      btn.classList.toggle("lit-2nd", btn.dataset.id === "2nd" && (state.second || state.secondLock));
      btn.classList.toggle("lit-alpha", btn.dataset.id === "alpha" && (state.alpha || state.alphaLock));
      btn.classList.toggle("lit-dia", btn.dataset.id === "diamond" && state.diamond);
    });
  }

  function buildKeys() {
    keysRoot.innerHTML = "";
    LAYOUT.forEach(function (row) {
      const r = document.createElement("div");
      r.className = "row " + row.cls;
      row.keys.forEach(function (key) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "key " + (key.cls || "");
        b.dataset.id = key.id;
        b.setAttribute("aria-label", key.label);
        if (key.second) {
          const s = document.createElement("span");
          s.className = "sec";
          s.textContent = key.second;
          b.appendChild(s);
        }
        if (key.alpha) {
          const a = document.createElement("span");
          a.className = "al";
          a.textContent = key.alpha;
          b.appendChild(a);
        }
        b.appendChild(document.createTextNode(key.label));
        b.addEventListener("pointerdown", function (ev) {
          ev.preventDefault();
          b.classList.add("down");
          handle(key.id);
        });
        b.addEventListener("pointerup", function () { b.classList.remove("down"); });
        b.addEventListener("pointerleave", function () { b.classList.remove("down"); });
        r.appendChild(b);
      });
      keysRoot.appendChild(r);
    });
  }

  const TYPE_MAP = {
    Enter: "enter", Backspace: "del", Escape: "esc",
    ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
    F1: "f1", F2: "f2", F3: "f3", F4: "f4", F5: "f5", F6: "f6",
    Delete: "clear",
  };

  document.addEventListener("keydown", function (ev) {
    if (ev.metaKey || ev.ctrlKey) return;
    if (!state.on) {
      if (ev.key === "Enter" || ev.key.toLowerCase() === "o") { powerOn(); ev.preventDefault(); }
      return;
    }
    if (TYPE_MAP[ev.key]) {
      ev.preventDefault();
      handle(TYPE_MAP[ev.key]);
      return;
    }
    if (ev.key.length === 1) {
      ev.preventDefault();
      if (state.mode === "graph" || state.mode === "table" || state.mode === "apps" || state.mode === "cat") setMode("home");
      const ch = ev.key === "*" ? "*" : ev.key === "/" ? "/" : ev.key;
      insert(ch === "," ? "," : ch);
      render();
    }
  });

  buildKeys();
  tickClock();
  setInterval(tickClock, 10000);
  render();
  powerOn();
})();
