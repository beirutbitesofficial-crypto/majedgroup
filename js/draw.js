/* Majed Group — automatic technical drawings (SVG) for each item */
window.MG = window.MG || {};

(function () {
  function n(v, d) { v = parseFloat(v); return isFinite(v) ? v : (d || 0); }
  function f(v) { return Math.round(v * 10) / 10; }

  function Ctx(W, H, extraTop) {
    const m = Math.max(W, H);
    this.W = W; this.H = H; this.fs = Math.max(6, m * 0.042); this.pad = this.fs * 3.2;
    this.top = extraTop ? this.pad + this.fs * 2 : this.pad;
    this.out = [];
  }
  Ctx.prototype.add = function (s) { this.out.push(s); };
  Ctx.prototype.rect = function (x, y, w, h, cls) { this.add(`<rect x="${f(x)}" y="${f(y)}" width="${f(Math.max(0, w))}" height="${f(Math.max(0, h))}" class="${cls}"/>`); };
  Ctx.prototype.line = function (x1, y1, x2, y2, cls) { this.add(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" class="${cls}"/>`); };
  Ctx.prototype.text = function (x, y, s, cls, rot) {
    const tr = rot ? ` transform="rotate(${rot} ${f(x)} ${f(y)})"` : '';
    this.add(`<text x="${f(x)}" y="${f(y)}" font-size="${f(this.fs)}" class="${cls || 'd-txt'}" text-anchor="middle" dominant-baseline="middle"${tr}>${MG.esc(s)}</text>`);
  };
  Ctx.prototype.dimH = function (x1, x2, y, label) {
    const t = this.fs * 0.5;
    this.line(x1, y, x2, y, 'd-dim'); this.line(x1, y - t, x1, y + t, 'd-dim'); this.line(x2, y - t, x2, y + t, 'd-dim');
    const lw = String(label).length * this.fs * 0.62 + this.fs * 0.6;
    this.rect((x1 + x2) / 2 - lw / 2, y - this.fs * 0.65, lw, this.fs * 1.3, 'd-dimbg');
    this.text((x1 + x2) / 2, y, label, 'd-dimtxt');
  };
  Ctx.prototype.dimV = function (y1, y2, x, label) {
    const t = this.fs * 0.5;
    this.line(x, y1, x, y2, 'd-dim'); this.line(x - t, y1, x + t, y1, 'd-dim'); this.line(x - t, y2, x + t, y2, 'd-dim');
    const lw = String(label).length * this.fs * 0.62 + this.fs * 0.6;
    this.rect(x - this.fs * 0.65, (y1 + y2) / 2 - lw / 2, this.fs * 1.3, lw, 'd-dimbg');
    this.text(x, (y1 + y2) / 2, label, 'd-dimtxt', -90);
  };
  Ctx.prototype.arrow = function (x1, y, x2) {
    const a = this.fs * 0.55, dir = x2 > x1 ? 1 : -1;
    this.line(x1, y, x2, y, 'd-arrow');
    this.add(`<path d="M${f(x2)} ${f(y)} l${f(-dir * a)} ${f(-a * 0.6)} l0 ${f(a * 1.2)}z" class="d-arrowhead"/>`);
  };
  Ctx.prototype.svg = function (cls) {
    const p = this.pad;
    return `<svg class="drawing ${cls || ''}" viewBox="${f(-p)} ${f(-this.top)} ${f(this.W + p * 2)} ${f(this.H + p + this.top)}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${this.out.join('')}</svg>`;
  };

  function sashTriangle(c, x, y, w, h, hingeLeft) {
    // architectural convention: dashed lines from opposite corners meet at the hinge side
    const hx = hingeLeft ? x : x + w, ox = hingeLeft ? x + w : x;
    c.add(`<polyline points="${f(ox)},${f(y)} ${f(hx)},${f(y + h / 2)} ${f(ox)},${f(y + h)}" class="d-open"/>`);
    const hy = y + h / 2, hxh = hingeLeft ? x + w - c.fs * 0.6 : x + c.fs * 0.6;
    c.rect(hxh - c.fs * 0.18, hy - c.fs * 0.9, c.fs * 0.36, c.fs * 1.8, 'd-handle');
  }

  function drawAlu(it) {
    const W = Math.max(20, n(it.w, 100)), H = Math.max(20, n(it.h, 100)), s = Math.max(1, Math.round(n(it.sashes, 1)));
    const topH = Math.min(Math.max(0, n(it.topH)), H - 30), Hm = H - topH;
    const c = new Ctx(W, H, s > 1);
    const fr = Math.min(6, Math.min(W, H) * 0.06);
    c.rect(0, 0, W, H, 'd-frame');
    c.rect(fr, fr, W - fr * 2, H - fr * 2, 'd-frame-in');
    let y0 = fr;
    if (topH > 0) {
      c.rect(fr, fr, W - fr * 2, topH - fr, 'd-glass');
      c.rect(fr - 0.5, topH - fr / 2, W - fr * 2 + 1, fr, 'd-bar-alu');
      y0 = topH + fr / 2;
    }
    const inH = H - fr - y0;
    const pw = (W - fr * 2) / s;
    if (it.type === 'sliding') {
      const ov = Math.min(4, pw * 0.1);
      for (let i = 0; i < s; i++) {
        const x = Math.max(fr, fr + i * pw - ov / 2), w = Math.min(W - fr, fr + (i + 1) * pw + ov / 2) - x;
        const g = Math.min(4, w * 0.08);
        c.rect(x, y0, w, inH, i % 2 ? 'd-sash d-sash-b' : 'd-sash');
        c.rect(x + g, y0 + g, w - g * 2, inH - g * 2, 'd-glass');
        if (s > 1) { const cx = x + w / 2, dir = i % 2 ? -1 : 1; c.arrow(cx - dir * w * 0.2, y0 + inH / 2, cx + dir * w * 0.2); }
      }
      if (s === 1) c.text(W / 2, y0 + inH / 2, MG.t('t_sliding'), 'd-lbl');
    } else if (it.type === 'fixed') {
      for (let i = 0; i < s; i++) {
        const x = fr + i * pw;
        c.rect(x + 1, y0 + 1, pw - 2, inH - 2, 'd-glass');
        if (i > 0) c.rect(x - fr / 2, y0, fr, inH, 'd-bar-alu');
        c.text(x + pw / 2, y0 + inH / 2, 'F', 'd-lbl');
      }
    } else {
      for (let i = 0; i < s; i++) {
        const x = fr + i * pw, g = Math.min(5, pw * 0.08);
        c.rect(x + 1, y0 + 1, pw - 2, inH - 2, 'd-sash');
        c.rect(x + 1 + g, y0 + 1 + g, pw - 2 - g * 2, inH - 2 - g * 2, 'd-glass');
        let hingeLeft;
        if (s === 1) hingeLeft = (it.side || 'right') === 'left';
        else if (s === 2) hingeLeft = i === 0;
        else hingeLeft = i % 2 === 0;
        sashTriangle(c, x + 1 + g, y0 + 1 + g, pw - 2 - g * 2, inH - 2 - g * 2, hingeLeft);
      }
      if (it.type === 'door') c.line(-c.fs, H, W + c.fs, H, 'd-floor');
    }
    // dimensions
    c.dimH(0, W, H + c.pad * 0.55, n(it.w));
    c.dimV(0, H, W + c.pad * 0.55, n(it.h));
    if (topH > 0) { c.dimV(0, topH, -c.pad * 0.55, topH); c.dimV(topH, H, -c.pad * 0.55, f(Hm)); }
    if (s > 1) for (let i = 0; i < s; i++) c.dimH(i * W / s, (i + 1) * W / s, -c.pad * 0.55, f(W / s));
    return c.svg('d-alu');
  }

  function drawIron(it) {
    const t = it.type;
    if (t === 'pergola') return drawPergola(it);
    const W = Math.max(20, n(t === 'railing' ? it.l : it.w, 100)), H = Math.max(20, n(it.h, 100));
    const c = new Ctx(W, H, t === 'gate' && n(it.leaves, 1) > 1);
    const fw = Math.min(6, Math.min(W, H) * 0.05);
    if (t === 'gate') {
      const L = Math.max(1, Math.round(n(it.leaves, 1))), lw = W / L, sH = Math.min(Math.max(0, n(it.sheetH)), H - 20);
      const sp = Math.max(4, n(it.spacing, 12)), rails = Math.max(0, Math.round(n(it.rails)));
      for (let i = 0; i < L; i++) {
        const x = i * lw + (i > 0 ? 1 : 0), w = lw - (L > 1 ? 1 : 0);
        c.rect(x, 0, w, H, 'd-iron-frame');
        if (sH > 0) c.rect(x + fw, H - fw - sH, w - fw * 2, sH, 'd-sheet');
        const nb = Math.max(0, Math.round((w - fw * 2) / sp) - 1), step = (w - fw * 2) / (nb + 1);
        for (let b = 1; b <= nb; b++) c.line(x + fw + b * step, fw, x + fw + b * step, H - fw - sH, 'd-iron-bar');
        for (let r = 1; r <= rails; r++) { const ry = fw + (H - fw * 2 - sH) * r / (rails + 1); c.rect(x + fw, ry - fw / 3, w - fw * 2, fw * 0.66, 'd-iron-rail'); }
        c.rect(x + fw, fw, w - fw * 2, H - fw * 2, 'd-iron-inner');
      }
      c.line(-c.fs, H, W + c.fs, H, 'd-floor');
      if (L > 1) for (let i = 0; i < L; i++) c.dimH(i * lw, (i + 1) * lw, -c.pad * 0.55, f(W / L));
      if (sH > 0) c.dimV(H - sH, H, -c.pad * 0.55, sH);
    } else if (t === 'irondoor') {
      const j = fw * 0.9;
      c.rect(-j, -j, W + j * 2, H + j, 'd-iron-frame');
      c.rect(0, 0, W, H, 'd-iron-frame');
      c.rect(fw, fw, W - fw * 2, H * 0.3 - fw, 'd-sheet');
      c.rect(fw, H * 0.3 + fw / 2, W - fw * 2, H * 0.4 - fw, 'd-sheet');
      c.rect(fw, H * 0.7 + fw / 2, W - fw * 2, H * 0.3 - fw * 1.5, 'd-sheet');
      const left = (it.side || 'right') === 'left';
      c.add(`<polyline points="${f(left ? W : 0)},${f(0)} ${f(left ? 0 : W)},${f(H / 2)} ${f(left ? W : 0)},${f(H)}" class="d-open"/>`);
      const hx = left ? W - fw * 2 : fw * 2;
      c.rect(hx - 1, H * 0.5 - c.fs, 2, c.fs * 2, 'd-handle');
      c.line(-c.fs * 2, H, W + c.fs * 2, H, 'd-floor');
    } else if (t === 'railing') {
      const ps = Math.max(30, n(it.ps, 150)), posts = Math.ceil(W / ps) + 1, sp = Math.max(4, n(it.spacing, 11));
      const pw = Math.min(5, W * 0.02), bottomY = H - 12;
      c.rect(0, 0, W, 5, 'd-iron-rail');
      c.line(0, bottomY, W, bottomY, 'd-iron-bar2');
      const nb = Math.max(0, Math.round(W / sp));
      for (let b = 1; b < nb; b++) c.line(b * W / nb, 5, b * W / nb, bottomY, 'd-iron-bar');
      for (let p = 0; p < posts; p++) { const x = Math.min(W - pw, p * (W - pw) / (posts - 1)); c.rect(x, 0, pw, H, 'd-iron-post'); }
      c.line(-c.fs, H, W + c.fs, H, 'd-floor');
      c.dimH(0, (W - pw) / (posts - 1), -c.pad * 0.55, f(W / (posts - 1)));
    } else if (t === 'guard') {
      c.rect(0, 0, W, H, 'd-iron-frame');
      c.rect(fw, fw, W - fw * 2, H - fw * 2, 'd-iron-inner');
      const vs = n(it.vs), hs = n(it.hs);
      if (vs > 0) { const nv = Math.max(0, Math.round(W / vs) - 1); for (let i = 1; i <= nv; i++) c.line(i * W / (nv + 1), fw, i * W / (nv + 1), H - fw, 'd-iron-bar'); }
      if (hs > 0) { const nh = Math.max(0, Math.round(H / hs) - 1); for (let i = 1; i <= nh; i++) c.line(fw, i * H / (nh + 1), W - fw, i * H / (nh + 1), 'd-iron-bar'); }
    } else {
      c.rect(0, 0, W, H, 'd-frame-in');
      c.text(W / 2, H / 2, MG.itemTitle(it), 'd-lbl');
    }
    c.dimH(0, W, H + c.pad * 0.55, f(W));
    c.dimV(0, H, W + c.pad * 0.55, f(H));
    return c.svg('d-iron');
  }

  function drawPergola(it) {
    const L = Math.max(50, n(it.l, 600)), D = Math.max(50, n(it.d, 400));
    const c = new Ctx(L, D, false);
    const cs = Math.max(8, Math.min(L, D) * 0.03), cps = Math.max(2, Math.round(n(it.cps, 2))), rs = Math.max(20, n(it.rs, 60));
    if (it.roof && it.roof !== 'none') c.rect(0, 0, L, D, 'd-roof');
    const nr = Math.ceil(L / rs) + 1;
    for (let i = 0; i < nr; i++) { const x = Math.min(L, i * L / (nr - 1)); c.line(x, 0, x, D, 'd-iron-bar'); }
    c.rect(0, -cs / 3, L, cs * 0.66, 'd-iron-rail'); c.rect(0, D - cs / 3, L, cs * 0.66, 'd-iron-rail');
    for (let i = 0; i < cps; i++) {
      const x = i * (L - cs) / (cps - 1);
      c.rect(x, -cs / 2, cs, cs, 'd-iron-post'); c.rect(x, D - cs / 2, cs, cs, 'd-iron-post');
    }
    c.text(L / 2, D / 2, (MG.lang === 'ar' ? 'مسقط — ارتفاع ' : 'Plan — height ') + n(it.h), 'd-lbl');
    c.dimH(0, L, D + c.pad * 0.55, L);
    c.dimV(0, D, L + c.pad * 0.55, D);
    return c.svg('d-iron');
  }

  MG.drawItem = function (it) {
    try {
      if (it.type === 'custom') {
        const c = new Ctx(160, 100, false);
        c.rect(0, 0, 160, 100, 'd-frame-in');
        c.text(80, 50, MG.itemTitle(it), 'd-lbl');
        return c.svg('d-custom');
      }
      return it.section === 'alu' ? drawAlu(it) : drawIron(it);
    } catch (e) { console.error(e); return ''; }
  };

  /* Visual cut-bar diagram */
  MG.drawBars = function (g) {
    const rows = g.bars.map((b, i) => {
      let x = 0;
      const segs = b.cuts.map(c => {
        const w = c.len / g.barLen * 100;
        const s = `<div class="seg" style="width:${w}%" title="${MG.esc(c.label)} — ${c.len}"><span>${c.len}</span></div>`;
        x += w; return s;
      }).join('');
      const rest = Math.max(0, g.barLen - b.used);
      return `<div class="barrow"><div class="barno">${i + 1}</div><div class="bar ${b.over ? 'over' : ''}">${segs}${rest > 0 ? `<div class="seg rest" style="width:${rest / g.barLen * 100}%"><span>${f(rest)}</span></div>` : ''}</div></div>`;
    });
    return rows.join('');
  };
})();
