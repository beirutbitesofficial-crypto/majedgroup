/* Majed Group — sketch pad: grid, pen, line & rectangle with automatic measurements, text */
(function () {
  const t = MG.t, ic = MG.ic, esc = MG.esc;

  MG.views.sketch = function (el, projectId) {
    const proj = projectId ? MG.getProject(projectId) : null;
    const st = { tool: 'line', color: '#1d1a14', scale: 10, grid: true, shapes: [], cur: null };
    const colors = ['#1d1a14', '#a57c34', '#2f6fb0', '#c0392b', '#2f8f63'];
    const tools = [['pen', 'pen'], ['line', 'line'], ['rect', 'rect'], ['text', 'text'], ['eraser', 'eraser']];
    el.innerHTML = MG.page(t('sketch'), proj ? esc(proj.name || proj.code) : '',
      `<button class="btn" id="dl">${ic('download')} ${t('download')}</button><button class="btn btn-gold" id="sv">${ic('pen')} ${t('saveSketch')}</button>`) + `
      <div class="sk-bar">
        <label class="check" style="padding:0"><input type="checkbox" id="gr" checked> ${t('grid')}</label>
        <span class="sk-hint">${t('scale')}</span>
        <select class="input" id="sc" style="width:auto;min-height:36px;padding:5px 10px">${[5, 10, 20, 25, 50, 100].map(v => `<option ${v === 10 ? 'selected' : ''}>${v}</option>`).join('')}</select>
        <span class="sk-hint">${t('cm')}</span>
      </div>
      <div class="sk-wrap">
        <div class="sk-tools">
          ${tools.map(x => `<button data-tool="${x[0]}" class="${st.tool === x[0] ? 'on' : ''}" title="${t(x[0])}">${ic(x[1])}</button>`).join('')}
          <div class="sep"></div>
          ${colors.map(c => `<div class="sk-color ${c === st.color ? 'on' : ''}" data-color="${c}" style="background:${c}"></div>`).join('')}
          <div class="sep"></div>
          <button id="un" title="${t('undo')}">${ic('undo')}</button>
          <button id="cl" title="${t('clear')}">${ic('trash')}</button>
        </div>
        <div class="sk-canvas-wrap"><canvas id="cv"></canvas></div>
      </div>`;

    const cv = el.querySelector('#cv'), wrap = cv.parentElement, ctx = cv.getContext('2d');
    const GRID = 20; // px per grid square (logical)
    let W = 0, H = 0, dpr = window.devicePixelRatio || 1;
    function size() {
      W = wrap.clientWidth; H = Math.round(Math.min(window.innerHeight * 0.72, W * 0.75));
      cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); render();
    }
    const snap = v => Math.round(v / (GRID / 2)) * (GRID / 2);
    const toCm = px => Math.round(px / GRID * st.scale * 10) / 10;

    function drawShape(s, c) {
      c.strokeStyle = s.color; c.fillStyle = s.color; c.lineWidth = s.type === 'pen' ? 2 : 2.2; c.lineCap = 'round'; c.lineJoin = 'round';
      if (s.type === 'pen') { c.beginPath(); s.pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
      else if (s.type === 'line') {
        c.beginPath(); c.moveTo(s.x1, s.y1); c.lineTo(s.x2, s.y2); c.stroke();
        const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
        if (len > 8) label(c, (s.x1 + s.x2) / 2, (s.y1 + s.y2) / 2, toCm(len), Math.atan2(s.y2 - s.y1, s.x2 - s.x1), s.color);
      } else if (s.type === 'rect') {
        const x = Math.min(s.x1, s.x2), y = Math.min(s.y1, s.y2), w = Math.abs(s.x2 - s.x1), h = Math.abs(s.y2 - s.y1);
        c.strokeRect(x, y, w, h);
        if (w > 8) label(c, x + w / 2, y + h + 12, toCm(w), 0, s.color);
        if (h > 8) label(c, x + w + 12, y + h / 2, toCm(h), -Math.PI / 2, s.color);
      } else if (s.type === 'text') {
        c.font = '600 16px Tajawal, Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s.text, s.x, s.y);
      }
    }
    function label(c, x, y, txt, ang, color) {
      c.save(); c.translate(x, y);
      if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
      c.rotate(ang); c.font = '700 12px Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      const w = c.measureText(txt).width + 8;
      c.fillStyle = 'rgba(255,255,255,.92)'; c.fillRect(-w / 2, -8, w, 16);
      c.fillStyle = color; c.fillText(txt, 0, 0); c.restore();
    }
    function render(target, w, h) {
      const c = target || ctx; w = w || W; h = h || H;
      c.fillStyle = '#fff'; c.fillRect(0, 0, w, h);
      if (st.grid) {
        c.lineWidth = 1;
        for (let x = 0; x <= w; x += GRID) { c.strokeStyle = (x / GRID) % 5 ? '#eef0f3' : '#d9dde3'; c.beginPath(); c.moveTo(x + .5, 0); c.lineTo(x + .5, h); c.stroke(); }
        for (let y = 0; y <= h; y += GRID) { c.strokeStyle = (y / GRID) % 5 ? '#eef0f3' : '#d9dde3'; c.beginPath(); c.moveTo(0, y + .5); c.lineTo(w, y + .5); c.stroke(); }
      }
      st.shapes.forEach(s => drawShape(s, c));
      if (st.cur) drawShape(st.cur, c);
    }
    function pos(e) { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    function hit(p) {
      for (let i = st.shapes.length - 1; i >= 0; i--) {
        const s = st.shapes[i];
        if (s.type === 'text' && Math.hypot(s.x - p[0], s.y - p[1]) < 20) return i;
        if (s.type === 'pen' && s.pts.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 10)) return i;
        if (s.type === 'line' || s.type === 'rect') {
          const segs = s.type === 'line' ? [[s.x1, s.y1, s.x2, s.y2]] :
            [[s.x1, s.y1, s.x2, s.y1], [s.x2, s.y1, s.x2, s.y2], [s.x2, s.y2, s.x1, s.y2], [s.x1, s.y2, s.x1, s.y1]];
          if (segs.some(g => distSeg(p, g) < 10)) return i;
        }
      }
      return -1;
    }
    function distSeg(p, g) {
      const [x1, y1, x2, y2] = g, dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy;
      let k = L ? ((p[0] - x1) * dx + (p[1] - y1) * dy) / L : 0; k = Math.max(0, Math.min(1, k));
      return Math.hypot(p[0] - (x1 + k * dx), p[1] - (y1 + k * dy));
    }

    cv.addEventListener('pointerdown', e => {
      e.preventDefault(); cv.setPointerCapture(e.pointerId);
      const p = pos(e);
      if (st.tool === 'eraser') { const i = hit(p); if (i >= 0) { st.shapes.splice(i, 1); render(); } st.erasing = true; return; }
      if (st.tool === 'text') {
        const txt = prompt(t('enterText'));
        if (txt) { st.shapes.push({ type: 'text', x: snap(p[0]), y: snap(p[1]), text: txt, color: st.color }); render(); }
        return;
      }
      if (st.tool === 'pen') st.cur = { type: 'pen', pts: [p], color: st.color };
      else { const a = [snap(p[0]), snap(p[1])]; st.cur = { type: st.tool, x1: a[0], y1: a[1], x2: a[0], y2: a[1], color: st.color }; }
    });
    cv.addEventListener('pointermove', e => {
      const p = pos(e);
      if (st.erasing) { const i = hit(p); if (i >= 0) { st.shapes.splice(i, 1); render(); } return; }
      if (!st.cur) return;
      if (st.cur.type === 'pen') st.cur.pts.push(p);
      else {
        let x = snap(p[0]), y = snap(p[1]);
        if (st.cur.type === 'line' && !e.altKey) { // lock to horizontal / vertical when close
          if (Math.abs(y - st.cur.y1) < GRID * 0.75) y = st.cur.y1;
          else if (Math.abs(x - st.cur.x1) < GRID * 0.75) x = st.cur.x1;
        }
        st.cur.x2 = x; st.cur.y2 = y;
      }
      render();
    });
    const end = () => {
      st.erasing = false;
      if (st.cur) {
        const c = st.cur;
        if (c.type === 'pen' ? c.pts.length > 1 : (c.x1 !== c.x2 || c.y1 !== c.y2)) st.shapes.push(c);
        st.cur = null; render();
      }
    };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);

    el.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => { st.tool = b.dataset.tool; el.querySelectorAll('[data-tool]').forEach(x => x.classList.toggle('on', x === b)); });
    el.querySelectorAll('[data-color]').forEach(b => b.onclick = () => { st.color = b.dataset.color; el.querySelectorAll('[data-color]').forEach(x => x.classList.toggle('on', x === b)); });
    el.querySelector('#un').onclick = () => { st.shapes.pop(); render(); };
    el.querySelector('#cl').onclick = () => { if (st.shapes.length && confirm(t('confirmDelete'))) { st.shapes = []; render(); } };
    el.querySelector('#gr').onchange = e => { st.grid = e.target.checked; render(); };
    el.querySelector('#sc').onchange = e => { st.scale = parseFloat(e.target.value); render(); };

    function exportPng() {
      const c = document.createElement('canvas'); c.width = W * 2; c.height = H * 2;
      const x = c.getContext('2d'); x.scale(2, 2); render(x, W, H);
      return c.toDataURL('image/png');
    }
    el.querySelector('#dl').onclick = () => { const a = document.createElement('a'); a.href = exportPng(); a.download = 'sketch.png'; a.click(); };
    el.querySelector('#sv').onclick = () => {
      if (!st.shapes.length) return;
      const opts = MG.db.projects.map(p => [p.id, (p.code + ' — ' + (p.name || p.client || ''))]);
      if (!opts.length) { MG.toast(t('noProjects'), 'err'); return; }
      const m = MG.modal(t('saveSketch'), `<div class="grid">
        ${MG.fld(t('sketchName'), MG.inp('name', (MG.lang === 'ar' ? 'رسمة ' : 'Sketch ') + MG.today()))}
        ${MG.fld(t('attachTo'), MG.sel('pid', opts, proj ? proj.id : opts[0][0]))}</div>`,
        `<button class="btn" data-close>${t('cancel')}</button><button class="btn btn-gold" id="ok">${t('save')}</button>`);
      m.querySelector('[data-close]').onclick = () => MG.closeModal();
      m.querySelector('#ok').onclick = () => {
        const v = MG.formData(m), p = MG.getProject(v.pid);
        p.sketches = p.sketches || [];
        const c = document.createElement('canvas'); c.width = W; c.height = H; render(c.getContext('2d'), W, H);
        p.sketches.push({ id: MG.uid(), name: v.name, date: MG.today(), data: c.toDataURL('image/png') });
        if (MG.save()) { MG.closeModal(); MG.toast(t('saved')); MG.go('#/project/' + p.id + '/sketches'); }
        else p.sketches.pop();
      };
    };

    const ro = new ResizeObserver(() => { if (Math.abs(wrap.clientWidth - W) > 2) size(); });
    ro.observe(wrap);
    size();
  };
})();
