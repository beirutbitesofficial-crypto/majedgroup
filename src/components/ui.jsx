/* Shared UI building blocks */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { MG, t } from '../lib/index.js';
import { ICONS } from './icons.js';

/* Re-render whenever data, language or theme changes */
export function useDb() { return useSyncExternalStore(MG.subscribe, MG.getVersion); }

export function Icon({ name, style, className }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
    style={style} className={className} dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }} />;
}

/* Trusted SVG produced by our own drawing generators (all text is escaped there) */
export function Svg({ html, className, style, onClick }) {
  return <div className={className} style={style} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}

export const Money = ({ v, dec, className }) => <span className={'money ' + (className || '')}>{MG.money(v, dec)}</span>;

/* ---------------- tiny global stores for modals, toasts and print ---------------- */
function createStore(initial) {
  let state = initial; const subs = new Set();
  return {
    get: () => state,
    set: v => { state = typeof v === 'function' ? v(state) : v; subs.forEach(f => f()); },
    sub: f => { subs.add(f); return () => subs.delete(f); }
  };
}
const modalStore = createStore([]);
const toastStore = createStore([]);
const printStore = createStore(null);

/* openModal(close => <Modal …/>) — returns a function that closes it */
export function openModal(render) {
  const id = MG.uid();
  const close = () => modalStore.set(s => s.filter(m => m.id !== id));
  modalStore.set(s => [...s, { id, render, close }]);
  return close;
}
export const closeAllModals = () => modalStore.set([]);

export function ModalHost() {
  const stack = useSyncExternalStore(modalStore.sub, modalStore.get);
  useDb();
  useEffect(() => { document.body.style.overflow = stack.length ? 'hidden' : ''; }, [stack.length]);
  return stack.map(m => <div key={m.id}>{m.render(m.close)}</div>);
}

export function Modal({ title, children, footer, wide, onClose }) {
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="modal-bg" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={'modal' + (wide ? ' wide' : '')}>
        <div className="modal-h"><h2>{title}</h2><button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" /></button></div>
        <div className="modal-b">{children}</div>
        {footer && <div className="modal-f">{footer}</div>}
      </div>
    </div>
  );
}

export function toast(msg, type) {
  const id = MG.uid();
  toastStore.set(s => [...s, { id, msg, type: type || 'ok' }]);
  setTimeout(() => toastStore.set(s => s.filter(x => x.id !== id)), 2400);
}
MG.toast = toast;
export function ToastHost() {
  const list = useSyncExternalStore(toastStore.sub, toastStore.get);
  return list.slice(-1).map(x => <div key={x.id} className={'toast ' + x.type}>{x.msg}</div>);
}

export function confirmBox(msg, onOk, okLabel) {
  openModal(close => (
    <Modal title={okLabel || t('delete')} onClose={close}
      footer={<><button className="btn" onClick={close}>{t('cancel')}</button>
        <button className="btn btn-gold" onClick={() => { close(); onOk(); }}>{okLabel || t('delete')}</button></>}>
      <p style={{ margin: 0 }}>{msg}</p>
    </Modal>
  ));
}

/* Print: render any React node into a print-only area, then open the print dialog */
export function printDoc(node) { printStore.set({ node, key: MG.uid() }); }
export function PrintHost() {
  const doc = useSyncExternalStore(printStore.sub, printStore.get);
  useEffect(() => { if (doc) { const h = setTimeout(() => window.print(), 120); return () => clearTimeout(h); } }, [doc]);
  return createPortal(<div id="print-area">{doc && doc.node}</div>, document.body);
}

/* Blocks saving into a closed accounting period */
export function guardDate(date) {
  if (MG.isLocked(date)) { toast(t('periodLocked') + ' ' + MG.db.settings.lockBefore, 'err'); return false; }
  return true;
}
export const canEditInvoice = p => !((p.status === 'active' || p.status === 'done') && !guardDate(p.date));

/* ---------------- form controls ---------------- */
export function useForm(initial) {
  const [v, setV] = useState(initial);
  const set = k => e => {
    const el = e && e.target;
    const val = !el ? e : el.type === 'checkbox' ? el.checked : el.type === 'number' ? (el.value === '' ? '' : parseFloat(el.value)) : el.value;
    setV(s => ({ ...s, [k]: val }));
  };
  return [v, set, setV];
}
export const Field = ({ label, children, className }) => <div className={'field ' + (className || '')}><label>{label}</label>{children}</div>;
export const Input = ({ type, value, onChange, ...rest }) => (
  <input className="input" type={type || 'text'} value={value == null ? '' : value} onChange={onChange}
    {...(type === 'number' ? { inputMode: 'decimal', step: 'any' } : {})} {...rest} />
);
export const Select = ({ options, value, onChange, ...rest }) => (
  <select className="input" value={value == null ? '' : value} onChange={onChange} {...rest}>
    {options.map(o => <option key={o[0]} value={o[0]}>{o[1]}</option>)}
  </select>
);
export const Check = ({ checked, onChange, children, className }) => (
  <label className={'check ' + (className || '')}><input type="checkbox" checked={!!checked} onChange={onChange} /> {children}</label>
);
/* Amount in USD or LBP with a live conversion hint */
export function MoneyInput({ value, cur, onValue, onCur }) {
  const n = parseFloat(value) || 0;
  return <>
    <div className="money-in">
      <Input type="number" min="0" value={value} onChange={e => onValue(e.target.value)} />
      <select className="input" value={cur || 'USD'} onChange={e => onCur(e.target.value)}>
        <option value="USD">$ USD</option><option value="LBP">ل.ل LBP</option>
      </select>
    </div>
    <div className="money-hint">{!n ? '' : cur === 'LBP' ? '≈ ' + MG.money(MG.toUsd(n, 'LBP')) : '≈ ' + MG.lbp(n)}</div>
  </>;
}

/* ---------------- display pieces ---------------- */
export const SecTag = ({ s }) => <span className={'tag tag-' + s}>{t(s)}</span>;
export const StTag = ({ s }) => <span className={'tag st-' + s}>{t('st_' + s)}</span>;
export const PayTag = ({ s }) => s && s !== 'none' ? <span className={'tag pay-' + s}>{t('pay_' + s)}</span> : null;

export function Kpi({ label, icon, value, sub, hl }) {
  return <div className={'kpi' + (hl ? ' hl' : '')}>
    <div className="kpi-l"><Icon name={icon} />{label}</div>
    <div className="kpi-v money">{value}</div>
    <div className="kpi-s">{sub}</div>
  </div>;
}

export function Brand() {
  const c = MG.db.settings.company;
  return <div className="brand"><div className="brand-mark">M</div><div>
    <div className="brand-name">{MG.lang === 'ar' ? (c.nameAr || c.name) : (c.name || c.nameAr)}</div>
    <div className="brand-sub">{t('appSub')}</div></div></div>;
}

export function Page({ title, sub, actions, back, children }) {
  return <>
    <div className="mobile-top"><Brand /><div style={{ display: 'flex', gap: 6 }}>
      <button className="btn btn-sm btn-icon" onClick={MG.toggleLang} title={t('language')}><Icon name="globe" /></button>
      <button className="btn btn-sm btn-icon" onClick={MG.toggleTheme}><Icon name={MG.theme() === 'dark' ? 'sun' : 'moon'} /></button></div></div>
    {back}
    <div className="topbar"><div><h1>{title}</h1>{sub && <div className="sub">{sub}</div>}</div><div className="topbar-actions">{actions}</div></div>
    {children}
  </>;
}

export function Empty({ icon, title, text, children }) {
  return <div className="card empty"><Icon name={icon} />{title && <h3>{title}</h3>}{text && <p>{text}</p>}{children}</div>;
}

export function Tabs({ tabs, value, onChange }) {
  return <div className="tabs">{tabs.map(x => (
    <button key={x[0]} className={value === x[0] ? 'on' : ''} onClick={() => onChange(x[0])}>
      <Icon name={x[1]} />{x[2]}{x[3] ? <span className="badge">{x[3]}</span> : null}
    </button>))}</div>;
}

export function Seg({ options, value, onChange, style }) {
  return <div className="seg-ctl" style={style}>{options.map(o =>
    <button type="button" key={o[0]} className={value === o[0] ? 'on' : ''} onClick={() => onChange(o[0])}>{o[1]}</button>)}</div>;
}

export function Totals({ rows, big }) {
  return <div className="totals">
    {rows.filter(Boolean).map((r, i) => <div className="trow" key={i}><span>{r[0]}</span><span className={'money ' + (r[2] || '')}>{r[1]}</span></div>)}
    {big && <div className="trow big"><span>{big[0]}</span><span className={'money ' + (big[2] || '')}>{big[1]}</span></div>}
  </div>;
}

export function Search({ value, onChange }) {
  return <div className="search"><Icon name="search" /><input className="input" placeholder={t('search')} value={value} onChange={e => onChange(e.target.value)} /></div>;
}

export const go = path => { window.location.hash = '#' + path; };

/* Letterhead used on every printed document */
export function DocHeader({ title, no, date }) {
  const c = MG.db.settings.company;
  return <div className="q-head">
    <div className="q-brand"><div className="q-mark">M</div><div>
      <div className="q-name">{MG.lang === 'ar' ? (c.nameAr || c.name) : (c.name || c.nameAr)}</div>
      <div className="q-sub">{t('appSub')}</div>
      <div style={{ fontSize: 11.5, color: '#6b6250' }}>{c.phone || ''}{c.address ? ' · ' + c.address : ''}</div></div></div>
    <div className="q-title"><h1>{title}</h1>{no && <div className="num">{t('quoteNo')} {no}</div>}<div className="num">{date || MG.today()}</div></div>
  </div>;
}
