import { MG } from './mg.js';
/* Majed Group — pricing engines, cut lists and project totals */

MG.partName = function (k) {
  const ar = { frame: 'إطار', sash: 'درفة', mullion: 'قاطع', bead: 'كبس', transom: 'قاطع علوي', post: 'عامود', rail: 'عارضة',
    bar: 'قضيب', column: 'عامود', beam: 'جسر', rafter: 'مدّاد', jamb: 'حلق', top: 'درابزين علوي', bottom: 'عارضة سفلية' };
  const en = { frame: 'Frame', sash: 'Sash', mullion: 'Mullion', bead: 'Bead', transom: 'Transom', post: 'Post', rail: 'Rail',
    bar: 'Bar', column: 'Column', beam: 'Beam', rafter: 'Rafter', jamb: 'Jamb', top: 'Top rail', bottom: 'Bottom rail' };
  return (MG.lang === 'ar' ? ar : en)[k] || k;
};

/* Field specs drive the item editor. kind: n=number, sel=select, chk=checkbox, txt=text */
MG.itemTypes = {
  alu: {
    sliding: [['w', 'n', 'width', 200], ['h', 'n', 'height', 150], ['sashes', 'n', 'sashes', 2], ['topH', 'n', 'topH', 0],
      ['finish', 'sel:finish', 'finish'], ['glass', 'sel:glass', 'glass'], ['net', 'chk', 'withNet', false]],
    hinged: [['w', 'n', 'width', 120], ['h', 'n', 'height', 140], ['sashes', 'n', 'sashes', 2], ['topH', 'n', 'topH', 0],
      ['finish', 'sel:finish', 'finish'], ['glass', 'sel:glass', 'glass'], ['side', 'sel:side', 'openSide', 'right'], ['net', 'chk', 'withNet', false]],
    fixed: [['w', 'n', 'width', 150], ['h', 'n', 'height', 120], ['sashes', 'n', 'sashes', 1], ['topH', 'n', 'topH', 0],
      ['finish', 'sel:finish', 'finish'], ['glass', 'sel:glass', 'glass']],
    door: [['w', 'n', 'width', 90], ['h', 'n', 'height', 220], ['sashes', 'n', 'sashes', 1], ['topH', 'n', 'topH', 0],
      ['finish', 'sel:finish', 'finish'], ['glass', 'sel:glass', 'glass'], ['side', 'sel:side', 'openSide', 'right']],
    custom: [['unitCost', 'n', 'unitCost', 0], ['w', 'n', 'width', 0], ['h', 'n', 'height', 0]]
  },
  iron: {
    gate: [['w', 'n', 'width', 400], ['h', 'n', 'height', 200], ['leaves', 'n', 'leaves', 2], ['fp', 'sel:iprof', 'frameProfile', 'sq60'],
      ['bp', 'sel:iprof', 'barProfile', 'sq20'], ['spacing', 'n', 'spacing', 12], ['rails', 'n', 'rails', 2],
      ['sheetH', 'n', 'sheetH', 0], ['thk', 'n', 'sheetThk', 1.5]],
    irondoor: [['w', 'n', 'width', 100], ['h', 'n', 'height', 215], ['fp', 'sel:iprof', 'frameProfile', 'sq40'],
      ['thk', 'n', 'sheetThk', 1.5], ['both', 'chk', 'bothSides', true], ['side', 'sel:side', 'openSide', 'right']],
    railing: [['l', 'n', 'length', 400], ['h', 'n', 'height', 100], ['pp', 'sel:iprof', 'postProfile', 'sq50'],
      ['rp', 'sel:iprof', 'railProfile', 're6040'], ['bp', 'sel:iprof', 'barProfile', 'sq20'], ['ps', 'n', 'postSpacing', 150], ['spacing', 'n', 'spacing', 11]],
    guard: [['w', 'n', 'width', 120], ['h', 'n', 'height', 140], ['fp', 'sel:iprof', 'frameProfile', 'sq30'],
      ['bp', 'sel:iprof', 'barProfile', 'bar12'], ['vs', 'n', 'vSpacing', 12], ['hs', 'n', 'hSpacing', 40]],
    pergola: [['l', 'n', 'length', 600], ['d', 'n', 'depth', 400], ['h', 'n', 'height', 280], ['cp', 'sel:iprof', 'columnProfile', 'sq100'],
      ['bp', 'sel:iprof', 'beamProfile', 're6040'], ['rp', 'sel:iprof', 'rafterProfile', 'sq40'], ['cps', 'n', 'colsPerSide', 3],
      ['rs', 'n', 'rafterSpacing', 60], ['roof', 'sel:roof', 'roofType', 'sandwich']],
    custom: [['unitCost', 'n', 'unitCost', 0], ['w', 'n', 'width', 0], ['h', 'n', 'height', 0]]
  }
};

MG.newItem = function (section, type) {
  const S = MG.db.settings;
  const it = { id: MG.uid(), section, type, name: '', qty: 1, extra: 0, price: 0 };
  (MG.itemTypes[section][type] || []).forEach(f => {
    const [key, kind, , def] = f;
    if (kind === 'sel:finish') it[key] = (S.alu.finishes[1] || S.alu.finishes[0] || {}).id;
    else if (kind === 'sel:glass') it[key] = (S.alu.glass[1] || S.alu.glass[0] || {}).id;
    else if (kind === 'sel:iprof') it[key] = S.iron.profiles.some(p => p.id === def) ? def : (S.iron.profiles[0] || {}).id;
    else it[key] = def;
  });
  return it;
};

function num(v, d) { v = parseFloat(v); return isFinite(v) ? v : (d || 0); }
function r1(v) { return Math.round(v * 10) / 10; }

MG.calcItem = function (item, margin) {
  const S = MG.db.settings;
  let res;
  if (item.type === 'custom') {
    const w = num(item.w), h = num(item.h);
    res = { pieces: [], weight: 0, area: w * h / 10000, breakdown: { extra: num(item.unitCost) + num(item.extra) } };
  } else if (item.section === 'alu') res = calcAlu(item, S);
  else res = calcIron(item, S);
  res.unitCost = Object.values(res.breakdown).reduce((a, b) => a + b, 0);
  const m = margin == null ? S.margin : num(margin);
  res.autoPrice = Math.round(res.unitCost * (1 + m / 100));
  res.unitPrice = num(item.price) > 0 ? num(item.price) : res.autoPrice;
  res.qty = Math.max(0, num(item.qty, 1));
  res.totalCost = res.unitCost * res.qty;
  res.total = res.unitPrice * res.qty;
  return res;
};

function calcAlu(item, S) {
  const A = S.alu, sys = A.systems[item.type] || A.systems.hinged;
  const prof = id => A.profiles.find(p => p.id === id);
  const W = Math.max(10, num(item.w)), H = Math.max(10, num(item.h));
  const n = Math.max(1, Math.round(num(item.sashes, 1)));
  const topH = Math.min(Math.max(0, num(item.topH)), H - 30);
  const Hm = H - topH;
  const pieces = [], panes = [];
  const push = (pid, len, count, part) => { if (pid && prof(pid) && count > 0 && len > 0) pieces.push({ pid, len: r1(len), count, part }); };

  push(sys.frame, W, 2, 'frame'); push(sys.frame, H, 2, 'frame');
  if (topH > 0) { push(sys.mullion, W - 8, 1, 'transom'); panes.push([W - 10, topH - 8, true]); }

  if (item.type === 'sliding') {
    const sw = n > 1 ? W / n + 4 : W - 8, sh = Hm - 6;
    push(sys.sash, sw, 2 * n, 'sash'); push(sys.sash, sh, 2 * n, 'sash');
    for (let i = 0; i < n; i++) panes.push([sw - 10, sh - 10, false]);
  } else if (item.type === 'fixed') {
    if (n > 1) push(sys.mullion, Hm - 8, n - 1, 'mullion');
    for (let i = 0; i < n; i++) panes.push([W / n - 8, Hm - 8, true]);
  } else {
    if (n > 1) push(sys.mullion, Hm - 8, n - 1, 'mullion');
    const sw = W / n - 3, sh = Hm - (item.type === 'door' ? 3 : 5);
    push(sys.sash, sw, 2 * n, 'sash'); push(sys.sash, sh, 2 * n, 'sash');
    for (let i = 0; i < n; i++) panes.push([sw - 12, sh - 12, true]);
  }
  if (sys.bead) panes.forEach(p => { if (p[2]) { push(sys.bead, p[0], 2, 'bead'); push(sys.bead, p[1], 2, 'bead'); } });

  const waste = 1 + num(A.waste) / 100;
  const weight = pieces.reduce((s, p) => s + p.len / 100 * p.count * prof(p.pid).kg, 0) * waste;
  const fin = A.finishes.find(f => f.id === item.finish) || A.finishes[0] || { price: 0 };
  const gl = A.glass.find(g => g.id === item.glass) || A.glass[0] || { price: 0 };
  const glassArea = panes.reduce((s, p) => s + Math.max(0, p[0]) * Math.max(0, p[1]) / 10000, 0);
  const area = W * H / 10000;
  const net = item.net ? W * Hm / 10000 * num(A.netPrice) * (item.type === 'sliding' ? 0.5 : 1) : 0;
  return {
    pieces, weight, area, glassArea,
    breakdown: {
      aluminum: weight * fin.price,
      glassC: glassArea * gl.price,
      accessories: n * num(sys.acc) + net,
      labor: Math.max(area, 1) * num(sys.labor),
      extra: num(item.extra)
    }
  };
}

function calcIron(item, S) {
  const I = S.iron;
  const prof = id => I.profiles.find(p => p.id === id);
  const pieces = [];
  const push = (pid, len, count, part) => { if (pid && prof(pid) && count > 0 && len > 0) pieces.push({ pid, len: r1(len), count: Math.round(count), part }); };
  let sheetArea = 0, roofArea = 0, area = 0;
  const t = item.type;

  if (t === 'gate') {
    const W = num(item.w), H = num(item.h), n = Math.max(1, Math.round(num(item.leaves, 1)));
    const lw = W / n - 1, sH = Math.min(Math.max(0, num(item.sheetH)), H - 20), sp = Math.max(4, num(item.spacing, 12));
    push(item.fp, lw, 2 * n, 'frame'); push(item.fp, H, 2 * n, 'frame');
    push(item.fp, lw - 12, Math.max(0, num(item.rails)) * n, 'rail');
    const nb = Math.max(0, Math.round((lw - 12) / sp) - 1);
    push(item.bp, H - 12 - sH, nb * n, 'bar');
    sheetArea = W * sH / 10000; area = W * H / 10000;
  } else if (t === 'irondoor') {
    const W = num(item.w), H = num(item.h);
    push(item.fp, W, 2, 'frame'); push(item.fp, H, 2, 'frame'); push(item.fp, W - 8, 2, 'rail');
    push(item.fp, H + 4, 2, 'jamb'); push(item.fp, W + 8, 1, 'jamb');
    sheetArea = W * H / 10000 * (item.both ? 2 : 1); area = W * H / 10000;
  } else if (t === 'railing') {
    const L = num(item.l), H = num(item.h), ps = Math.max(30, num(item.ps, 150)), sp = Math.max(4, num(item.spacing, 11));
    const posts = Math.ceil(L / ps) + 1;
    push(item.pp, H, posts, 'post'); push(item.rp, L, 1, 'top'); push(item.bp, L, 1, 'bottom');
    const nb = Math.max(0, Math.round(L / sp) - posts);
    push(item.bp, H - 20, nb, 'bar');
    area = L * H / 10000;
  } else if (t === 'guard') {
    const W = num(item.w), H = num(item.h), vs = num(item.vs), hs = num(item.hs);
    push(item.fp, W, 2, 'frame'); push(item.fp, H, 2, 'frame');
    if (vs > 0) push(item.bp, H - 6, Math.max(0, Math.round(W / vs) - 1), 'bar');
    if (hs > 0) push(item.bp, W - 6, Math.max(0, Math.round(H / hs) - 1), 'rail');
    area = W * H / 10000;
  } else if (t === 'pergola') {
    const L = num(item.l), D = num(item.d), H = num(item.h), cps = Math.max(2, Math.round(num(item.cps, 2))), rs = Math.max(20, num(item.rs, 60));
    push(item.cp, H, cps * 2, 'column'); push(item.bp, L, 2, 'beam');
    push(item.rp, D, Math.ceil(L / rs) + 1, 'rafter');
    roofArea = L * D / 10000; area = roofArea;
  }

  const waste = 1 + num(I.waste) / 100;
  const steelKg = pieces.reduce((s, p) => s + p.len / 100 * p.count * prof(p.pid).kg, 0) * waste;
  const sheetKg = sheetArea * num(item.thk, 1.5) * 7.85;
  const kg = steelKg + sheetKg;
  const roof = (I.roofs.find(r => r.id === item.roof) || { price: 0 }).price * roofArea;
  const steel = steelKg * num(I.steelPrice), sheet = sheetKg * num(I.sheetPrice);
  return {
    pieces, weight: kg, area, sheetArea,
    breakdown: {
      steel, sheet,
      consumables: (steel + sheet) * num(I.consumables) / 100,
      labor: kg * num(I.labor),
      paint: kg * num(I.paint),
      roof,
      extra: num(item.extra)
    }
  };
}

MG.itemDims = function (it) {
  if (it.type === 'railing') return num(it.l) + ' × ' + num(it.h);
  if (it.type === 'pergola') return num(it.l) + ' × ' + num(it.d) + ' × ' + num(it.h);
  if (num(it.w) && num(it.h)) return num(it.w) + ' × ' + num(it.h);
  return '';
};

MG.itemTitle = function (it) {
  return it.name || MG.t('t_' + it.type);
};

MG.projectTotals = function (p) {
  let subtotal = 0, estCost = 0, weight = 0;
  const rows = p.items.map(it => { const c = MG.calcItem(it, p.margin); subtotal += c.total; estCost += c.totalCost; weight += c.weight * c.qty; return c; });
  const discount = num(p.discount);
  const net = subtotal - discount;
  const vatAmt = net * num(p.vat) / 100;
  const total = net + vatAmt;
  const paid = MG.db.payments.filter(x => x.projectId === p.id).reduce((s, x) => s + num(x.amount), 0);
  const actual = MG.db.expenses.filter(x => x.projectId === p.id).reduce((s, x) => s + num(x.amount), 0)
    + MG.db.payroll.filter(x => x.projectId === p.id && x.type !== 'advance').reduce((s, x) => s + num(x.amount), 0);
  return { rows, subtotal, discount, net, vatAmt, total, estCost, weight, paid, balance: total - paid, actual,
    profit: net - (actual > 0 ? actual : estCost) };
};

/* Cut list: nest pieces onto stock bars (first-fit decreasing). */
MG.cutList = function (items) {
  const S = MG.db.settings, groups = {};
  items.forEach(it => {
    if (it.type === 'custom') return;
    const c = MG.calcItem(it);
    const sec = it.section, table = S[sec].profiles;
    c.pieces.forEach(pc => {
      const key = sec + ':' + pc.pid;
      if (!groups[key]) {
        const pr = table.find(x => x.id === pc.pid) || { name: pc.pid, kg: 0 };
        groups[key] = { key, section: sec, name: pr.name, kg: pr.kg, barLen: num(S[sec].barLength, 600), cuts: [] };
      }
      const total = pc.count * Math.max(1, Math.round(num(it.qty, 1)));
      for (let i = 0; i < total; i++) groups[key].cuts.push({ len: pc.len, label: MG.itemTitle(it) + ' · ' + MG.partName(pc.part) });
    });
  });
  const kerf = 0.5;
  return Object.values(groups).map(g => {
    const cuts = g.cuts.slice().sort((a, b) => b.len - a.len), bars = [];
    cuts.forEach(c => {
      if (c.len > g.barLen) { bars.push({ cuts: [c], used: c.len, over: true }); return; }
      let bar = bars.find(b => !b.over && g.barLen - b.used >= c.len + (b.cuts.length ? kerf : 0));
      if (!bar) { bar = { cuts: [], used: 0 }; bars.push(bar); }
      bar.used += c.len + (bar.cuts.length ? kerf : 0); bar.cuts.push(c);
    });
    const summary = {};
    g.cuts.forEach(c => { const k = c.len + '|' + c.label; summary[k] = summary[k] || { len: c.len, label: c.label, count: 0 }; summary[k].count++; });
    const usedLen = g.cuts.reduce((s, c) => s + c.len, 0);
    const stock = bars.length * g.barLen;
    return Object.assign(g, { bars, summary: Object.values(summary).sort((a, b) => b.len - a.len), usedLen, stock,
      waste: stock ? (1 - usedLen / stock) * 100 : 0, weight: stock / 100 * g.kg });
  }).sort((a, b) => a.section.localeCompare(b.section) || a.name.localeCompare(b.name));
};
