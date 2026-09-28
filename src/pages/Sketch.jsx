/* Sketch pad: grid, pen, lines and rectangles with automatic measurements, text, eraser */
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MG, t } from '../lib/index.js';
import { Icon, Page, Modal, Field, Input, Select, openModal, toast, go } from '../components/ui.jsx';

const GRID = 20; // px per grid square
const COLORS = ['#1d1a14', '#a57c34', '#2f6fb0', '#c0392b', '#2f8f63'];
const TOOLS = [['pen', 'pen'], ['line', 'line'], ['rect', 'rect'], ['text', 'text'], ['eraser', 'eraser']];

export default function Sketch() {
  const { projectId } = useParams();
  const proj = projectId ? MG.getProject(projectId) : null;
  const [tool, setTool] = useState('line');
  const [color, setColor] = useState(COLORS[0]);
  const [grid, setGrid] = useState(true);
  const [scale, setScale] = useState(10);
  const cvRef = useRef(null), wrapRef = useRef(null);
  const st = useRef({ shapes: [], cur: null, W: 0, H: 0, erasing: false });
  const opts = useRef({}); opts.current = { tool, color, grid, scale };

  const snap = v => Math.round(v / (GRID / 2)) * (GRID / 2);
  const toCm = px => Math.round(px / GRID * opts.current.scale * 10) / 10;

  function label(c, x, y, txt, ang, col) {
    c.save(); c.translate(x, y);
    if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
    c.rotate(ang); c.font = '700 12px Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const w = c.measureText(txt).width + 8;
    c.fillStyle = 'rgba(255,255,255,.92)'; c.fillRect(-w / 2, -8, w, 16);
    c.fillStyle = col; c.fillText(txt, 0, 0); c.restore();
  }
  function drawShape(s, c) {
    c.strokeStyle = s.color; c.fillStyle = s.color; c.lineWidth = s.type === 'pen' ? 2 : 2.2; c.lineCap = 'round'; c.lineJoin = 'round';
    if (s.type === 'pen') { c.beginPath(); s.pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
    else if (s.type === 'line') {
      c.beginPath(); c.moveTo(s.x1, s.y1); c.lineTo(s.x2, s.y2); c.stroke();
      const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
      if (len > 8) label(c, (s.x1 + s.x2) / 2, (s.y1 + s.y2) / 2, String(toCm(len)), Math.atan2(s.y2 - s.y1, s.x2 - s.x1), s.color);
    } else if (s.type === 'rect') {
      const x = Math.min(s.x1, s.x2), y = Math.min(s.y1, s.y2), w = Math.abs(s.x2 - s.x1), h = Math.abs(s.y2 - s.y1);
      c.strokeRect(x, y, w, h);
      if (w > 8) label(c, x + w / 2, y + h + 12, String(toCm(w)), 0, s.color);
      if (h > 8) label(c, x + w + 12, y + h / 2, String(toCm(h)), -Math.PI / 2, s.color);
    } else if (s.type === 'text') {
      c.font = '600 16px Tajawal, Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s.text, s.x, s.y);
    }
  }
  function render(target, w, h) {
    const cv = cvRef.current; if (!cv) return;
    const c = target || cv.getContext('2d'); w = w || st.current.W; h = h || st.current.H;
    c.fillStyle = '#fff'; c.fillRect(0, 0, w, h);
    if (opts.current.grid) {
      c.lineWidth = 1;
      for (let x = 0; x <= w; x += GRID) { c.strokeStyle = (x / GRID) % 5 ? '#eef0f3' : '#d9dde3'; c.beginPath(); c.moveTo(x + .5, 0); c.lineTo(x + .5, h); c.stroke(); }
      for (let y = 0; y <= h; y += GRID) { c.strokeStyle = (y / GRID) % 5 ? '#eef0f3' : '#d9dde3'; c.beginPath(); c.moveTo(0, y + .5); c.lineTo(w, y + .5); c.stroke(); }
    }
    st.current.shapes.forEach(s => drawShape(s, c));
    if (st.current.cur) drawShape(st.current.cur, c);
  }
  const renderRef = useRef(render); renderRef.current = render;

  useEffect(() => { renderRef.current(); }, [grid, scale]);

  useEffect(() => {
    const cv = cvRef.current, wrap = wrapRef.current, ctx = cv.getContext('2d'), S = st.current;
    const dpr = window.devicePixelRatio || 1;
    const size = () => {
      S.W = wrap.clientWidth; S.H = Math.round(Math.min(window.innerHeight * 0.72, S.W * 0.75));
      cv.width = S.W * dpr; cv.height = S.H * dpr; cv.style.height = S.H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); renderRef.current();
    };
    const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const distSeg = (p, g) => {
      const [x1, y1, x2, y2] = g, dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy;
      let k = L ? ((p[0] - x1) * dx + (p[1] - y1) * dy) / L : 0; k = Math.max(0, Math.min(1, k));
      return Math.hypot(p[0] - (x1 + k * dx), p[1] - (y1 + k * dy));
    };
    const hit = p => {
      for (let i = S.shapes.length - 1; i >= 0; i--) {
        const s = S.shapes[i];
        if (s.type === 'text' && Math.hypot(s.x - p[0], s.y - p[1]) < 20) return i;
        if (s.type === 'pen' && s.pts.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 10)) return i;
        if (s.type === 'line' || s.type === 'rect') {
          const segs = s.type === 'line' ? [[s.x1, s.y1, s.x2, s.y2]] : [[s.x1, s.y1, s.x2, s.y1], [s.x2, s.y1, s.x2, s.y2], [s.x2, s.y2, s.x1, s.y2], [s.x1, s.y2, s.x1, s.y1]];
          if (segs.some(g => distSeg(p, g) < 10)) return i;
        }
      }
      return -1;
    };
    const down = e => {
      e.preventDefault(); cv.setPointerCapture(e.pointerId);
      const p = pos(e), o = opts.current;
      if (o.tool === 'eraser') { const i = hit(p); if (i >= 0) { S.shapes.splice(i, 1); renderRef.current(); } S.erasing = true; return; }
      if (o.tool === 'text') {
        const txt = window.prompt(t('enterText'));
        if (txt) { S.shapes.push({ type: 'text', x: snap(p[0]), y: snap(p[1]), text: txt, color: o.color }); renderRef.current(); }
        return;
      }
      if (o.tool === 'pen') S.cur = { type: 'pen', pts: [p], color: o.color };
      else { const a = [snap(p[0]), snap(p[1])]; S.cur = { type: o.tool, x1: a[0], y1: a[1], x2: a[0], y2: a[1], color: o.color }; }
    };
    const move = e => {
      const p = pos(e);
      if (S.erasing) { const i = hit(p); if (i >= 0) { S.shapes.splice(i, 1); renderRef.current(); } return; }
      if (!S.cur) return;
      if (S.cur.type === 'pen') S.cur.pts.push(p);
      else {
        let x = snap(p[0]), y = snap(p[1]);
        if (S.cur.type === 'line' && !e.altKey) { // lock to horizontal / vertical when close
          if (Math.abs(y - S.cur.y1) < GRID * 0.75) y = S.cur.y1;
          else if (Math.abs(x - S.cur.x1) < GRID * 0.75) x = S.cur.x1;
        }
        S.cur.x2 = x; S.cur.y2 = y;
      }
      renderRef.current();
    };
    const up = () => {
      S.erasing = false;
      if (S.cur) {
        const c = S.cur;
        if (c.type === 'pen' ? c.pts.length > 1 : (c.x1 !== c.x2 || c.y1 !== c.y2)) S.shapes.push(c);
        S.cur = null; renderRef.current();
      }
    };
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    const ro = new ResizeObserver(() => { if (Math.abs(wrap.clientWidth - S.W) > 2) size(); });
    ro.observe(wrap); size();
    return () => { ro.disconnect(); cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); };
  }, []);

  const exportPng = (mult = 2) => {
    const S = st.current, c = document.createElement('canvas'); c.width = S.W * mult; c.height = S.H * mult;
    const x = c.getContext('2d'); x.scale(mult, mult); render(x, S.W, S.H);
    return c.toDataURL('image/png');
  };
  const download = () => { const a = document.createElement('a'); a.href = exportPng(); a.download = 'sketch.png'; a.click(); };
  const saveSketch = () => {
    if (!st.current.shapes.length) return;
    if (!MG.db.projects.length) return toast(t('noProjects'), 'err');
    const data = exportPng(1);
    openModal(close => <SaveSketch data={data} proj={proj} close={close} />);
  };

  return <Page title={t('sketch')} sub={proj ? (proj.name || proj.code) : ''}
    actions={<><button className="btn" onClick={download}><Icon name="download" /> {t('download')}</button>
      <button className="btn btn-gold" onClick={saveSketch}><Icon name="pen" /> {t('saveSketch')}</button></>}>
    <div className="sk-bar">
      <label className="check" style={{ padding: 0 }}><input type="checkbox" checked={grid} onChange={e => setGrid(e.target.checked)} /> {t('grid')}</label>
      <span className="sk-hint">{t('scale')}</span>
      <select className="input" value={scale} onChange={e => setScale(parseFloat(e.target.value))} style={{ width: 'auto', minHeight: 36, padding: '5px 10px' }}>
        {[5, 10, 20, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}</select>
      <span className="sk-hint">{t('cm')}</span>
    </div>
    <div className="sk-wrap">
      <div className="sk-tools">
        {TOOLS.map(x => <button key={x[0]} className={tool === x[0] ? 'on' : ''} title={t(x[0])} onClick={() => setTool(x[0])}><Icon name={x[1]} /></button>)}
        <div className="sep" />
        {COLORS.map(c => <div key={c} className={'sk-color' + (c === color ? ' on' : '')} style={{ background: c }} onClick={() => setColor(c)} />)}
        <div className="sep" />
        <button title={t('undo')} onClick={() => { st.current.shapes.pop(); render(); }}><Icon name="undo" /></button>
        <button title={t('clear')} onClick={() => { if (st.current.shapes.length && window.confirm(t('confirmDelete'))) { st.current.shapes = []; render(); } }}><Icon name="trash" /></button>
      </div>
      <div className="sk-canvas-wrap" ref={wrapRef}><canvas ref={cvRef} /></div>
    </div>
  </Page>;
}

function SaveSketch({ data, proj, close }) {
  const [name, setName] = useState((MG.lang === 'ar' ? 'رسمة ' : 'Sketch ') + MG.today());
  const [pid, setPid] = useState(proj ? proj.id : MG.db.projects[0].id);
  const save = () => {
    const p = MG.getProject(pid);
    p.sketches = p.sketches || [];
    p.sketches.push({ id: MG.uid(), name, date: MG.today(), data });
    if (MG.save()) { close(); toast(t('saved')); go('/project/' + p.id + '/sketches'); }
    else p.sketches.pop();
  };
  return <Modal title={t('saveSketch')} onClose={close}
    footer={<><button className="btn" onClick={close}>{t('cancel')}</button><button className="btn btn-gold" onClick={save}>{t('save')}</button></>}>
    <div className="grid">
      <Field label={t('sketchName')}><Input value={name} onChange={e => setName(e.target.value)} /></Field>
      <Field label={t('attachTo')}><Select value={pid} onChange={e => setPid(e.target.value)} options={MG.db.projects.map(p => [p.id, p.code + ' — ' + (p.name || MG.clientName(p))])} /></Field>
    </div>
  </Modal>;
}
