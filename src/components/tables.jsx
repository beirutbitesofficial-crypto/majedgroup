/* Tables, charts and statements shared across pages */
import { Link } from 'react-router-dom';
import { MG, t } from '../lib/index.js';
import { Icon, Svg, SecTag, StTag, PayTag, confirmBox, guardDate, go } from './ui.jsx';
import { openExpense, printReceipt } from '../forms/money.jsx';

const N = v => parseFloat(v) || 0;
const money = (v, d) => MG.money(v, d);
const Del = ({ onClick }) => MG.can('delete') ? <button className="btn btn-ghost btn-sm btn-icon btn-danger" onClick={onClick}><Icon name="trash" /></button> : null;
const removeWithGuard = (coll, x, label) => {
  if (!guardDate(x.date)) return;
  confirmBox(t('confirmDelete'), () => { MG.db[coll] = MG.db[coll].filter(y => y !== x); MG.log(label, money(x.amount) + ' ' + x.date); MG.save(); });
};
const LbpNote = ({ x }) => x.cur === 'LBP' ? <div className="muted num" style={{ fontSize: 11 }}>{MG.fmt(x.orig, 0)} ل.ل</div> : null;

export function ProjectRow({ p }) {
  const T = MG.projectTotals(p);
  const pct = T.total > 0 ? Math.min(100, T.paid / T.total * 100) : 0;
  const client = MG.clientName(p);
  const prices = MG.can('view.prices');
  return <div className="prow" onClick={() => go('/project/' + p.id)}>
    <div className={'picon ' + p.section}><Icon name={p.section === 'iron' ? 'gate' : p.section === 'mixed' ? 'grid' : 'window'} /></div>
    <div style={{ minWidth: 0 }}><div className="prow-t">{p.name || client || p.code}</div>
      <div className="prow-m"><span className="num">{p.code}</span>{client && <span>{client}</span>}<StTag s={p.status} />{prices && <PayTag s={MG.payStatus(p, T)} />}</div></div>
    {prices ? <div className="prow-v"><div className="money">{money(T.total, 0)}</div>
      <div><div className="small">{t('paid')} {Math.round(pct)}%</div><div className="progress"><i style={{ width: pct + '%' }} /></div></div></div> : <div />}
  </div>;
}

export function PaymentTable({ list, showProject = true, showCustomer }) {
  if (!list.length) return <p className="muted">—</p>;
  const total = list.reduce((s, x) => s + N(x.amount), 0);
  return <div className="table-wrap"><table className="t"><thead><tr><th>{t('date')}</th>{showCustomer && <th>{t('client')}</th>}{showProject && <th>{t('project')}</th>}
    <th>{t('cashAccount')}</th><th>{t('notes')}</th><th className="r">{t('amount')}</th><th></th></tr></thead><tbody>
    {list.map(x => {
      const p = x.projectId && MG.getProject(x.projectId), c = MG.getCustomer(x.customerId || (p && p.customerId));
      return <tr key={x.id}><td className="num">{x.date}</td>
        {showCustomer && <td>{c ? <Link to={'/customer/' + c.id}>{c.name}</Link> : '—'}</td>}
        {showProject && <td>{p ? <Link to={'/project/' + p.id + '/finance'}>{p.name || p.code}</Link> : <span className="muted">{t('onAccount')}</span>}</td>}
        <td>{MG.nm((MG.getAccount(x.accountId) || {}).name || '')} <span className="muted">· {t(x.method || 'cash')}</span></td><td>{x.note}</td>
        <td className="r"><span className="money">{money(x.amount)}</span><LbpNote x={x} /></td>
        <td className="r" style={{ whiteSpace: 'nowrap' }}><button className="btn btn-ghost btn-sm btn-icon" title={t('receipt')} onClick={() => printReceipt(x)}><Icon name="print" /></button>
          <Del onClick={() => removeWithGuard('payments', x, 'payment.delete')} /></td></tr>;
    })}
  </tbody><tfoot><tr><td colSpan={2 + (showCustomer ? 1 : 0) + (showProject ? 1 : 0)}>{t('total')}</td><td className="r money">{money(total)}</td><td></td></tr></tfoot></table></div>;
}

export function ExpenseTable({ list, showProject }) {
  if (!list.length) return <p className="muted">—</p>;
  const total = list.reduce((s, x) => s + N(x.amount), 0);
  return <div className="table-wrap"><table className="t"><thead><tr><th>{t('date')}</th><th>{t('category')}</th>{showProject && <th>{t('project')}</th>}<th>{t('supplier')}</th>
    <th>{t('notes')}</th><th>{t('payment')}</th><th className="r">{t('amount')}</th><th></th></tr></thead><tbody>
    {list.map(x => {
      const p = x.projectId && MG.getProject(x.projectId), s = x.supplierId && MG.getSupplier(x.supplierId), c = MG.getCategory(x.category || 'other');
      return <tr key={x.id}><td className="num">{x.date}</td><td><span className={'cat-dot ' + c.group} />{MG.nm(c.name)}</td>
        {showProject && <td>{p ? <Link to={'/project/' + p.id + '/finance'}>{p.code}</Link> : <span className="muted">{t('general')}</span>}</td>}
        <td>{s && <Link to={'/supplier/' + s.id}>{s.name}</Link>}</td><td>{x.note}{x.ref && <span className="muted num"> #{x.ref}</span>}</td>
        <td>{x.paid === false ? <span className="tag pay-unpaid">{t('onCredit')}</span> : MG.nm((MG.getAccount(x.accountId) || {}).name || '')}</td>
        <td className="r"><span className="money">{money(x.amount)}</span><LbpNote x={x} /></td>
        <td className="r" style={{ whiteSpace: 'nowrap' }}><button className="btn btn-ghost btn-sm btn-icon" onClick={() => guardDate(x.date) && openExpense(x)}><Icon name="edit" /></button>
          <Del onClick={() => removeWithGuard('expenses', x, 'expense.delete')} /></td></tr>;
    })}
  </tbody><tfoot><tr><td colSpan={showProject ? 6 : 5}>{t('total')}</td><td className="r money">{money(total)}</td><td></td></tr></tfoot></table></div>;
}

export function PayrollTable({ list, showWorker }) {
  if (!list.length) return <p className="muted">—</p>;
  return <div className="table-wrap"><table className="t"><thead><tr><th>{t('date')}</th>{showWorker && <th>{t('worker')}</th>}<th>{t('type')}</th><th>{t('project')}</th>
    <th className="r">{t('days')}</th><th className="r">{t('amount')}</th><th className="r">{t('deductAdvance')}</th><th></th></tr></thead><tbody>
    {list.map(x => {
      const p = x.projectId && MG.getProject(x.projectId), w = MG.getWorker(x.workerId);
      return <tr key={x.id}><td className="num">{x.date}</td>{showWorker && <td>{w && <Link to={'/worker/' + w.id}>{w.name}</Link>}</td>}
        <td>{x.type === 'advance' ? <span className="tag pay-partial">{t('advance')}</span> : t('wage')}</td>
        <td>{p ? <Link to={'/project/' + p.id}>{p.code}</Link> : <span className="muted">—</span>}</td>
        <td className="r num">{x.days || ''}</td><td className="r money">{money(x.amount)}</td><td className="r money">{x.deduct ? money(x.deduct) : ''}</td>
        <td className="r"><Del onClick={() => removeWithGuard('payroll', x, 'payroll.delete')} /></td></tr>;
    })}
  </tbody></table></div>;
}

export function StatementTable({ rows, opening, debitLabel, creditLabel }) {
  if (!rows.length && !opening) return <p className="muted">—</p>;
  const dr = rows.reduce((s, r) => s + r.dr, 0), cr = rows.reduce((s, r) => s + r.cr, 0);
  return <div className="table-wrap"><table className="t"><thead><tr><th>{t('date')}</th><th>{t('ref')}</th><th>{t('description')}</th>
    <th className="r">{debitLabel || t('debit')}</th><th className="r">{creditLabel || t('credit')}</th><th className="r">{t('runningBalance')}</th></tr></thead><tbody>
    {opening ? <tr><td></td><td></td><td className="muted">{t('openingBal')}</td><td></td><td></td><td className="r money">{money(opening)}</td></tr> : null}
    {rows.map((r, i) => <tr key={i}><td className="num">{r.date}</td><td className="num muted">{r.ref}</td><td>{r.desc}</td>
      <td className="r money">{r.dr ? money(r.dr) : ''}</td><td className="r money">{r.cr ? money(r.cr) : ''}</td><td className="r money"><b>{money(r.bal)}</b></td></tr>)}
  </tbody><tfoot><tr><td colSpan={3}>{t('total')}</td><td className="r money">{money(dr)}</td><td className="r money">{money(cr)}</td>
    <td className="r money">{money(rows.length ? rows[rows.length - 1].bal : opening)}</td></tr></tfoot></table></div>;
}

/* ---------- Charts ---------- */
function niceStep(v) { const p = Math.pow(10, Math.floor(Math.log10(v || 1))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
function short(v) { return v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : String(v); }

export function TrendChart({ year, hlMonth }) {
  const months = [...Array(12).keys()].map(m => MG.periodStats(new Date(year, m, 1), new Date(year, m + 1, 1)));
  const W = 720, H = 250, pl = 50, pr = 10, pt = 14, pb = 28;
  const max = Math.max(100, ...months.map(s => Math.max(s.sales, s.expenses, s.collected)));
  const step = niceStep(max / 4), top = Math.ceil(max / step) * step;
  const cw = (W - pl - pr) / 12, bw = Math.min(18, cw * 0.3);
  const y = v => pt + (H - pt - pb) * (1 - Math.max(0, v) / top);
  const names = MG.monthNames(), grid = [];
  for (let v = 0; v <= top; v += step) grid.push(v);
  return <>
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} direction="ltr">
      <defs><linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f1d9a4" /><stop offset="1" stopColor="#a57c34" /></linearGradient></defs>
      {grid.map(v => <g key={v}><line className="gl" x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} /><text x={pl - 8} y={y(v) + 4} textAnchor="end">{short(v)}</text></g>)}
      {months.map((m, i) => { const cx = pl + cw * i + cw / 2; return <g key={i}>
        {hlMonth === i && <rect x={pl + cw * i + 2} y={pt} width={cw - 4} height={H - pt - pb} rx="8" fill="rgba(212,175,106,.08)" />}
        <rect className="b-sales" x={cx - bw - 1} y={y(m.sales)} width={bw} height={Math.max(0, y(0) - y(m.sales))} rx="3"><title>{t('sales')}: {money(m.sales, 0)}</title></rect>
        <rect className="b-exp" x={cx + 1} y={y(m.expenses)} width={bw} height={Math.max(0, y(0) - y(m.expenses))} rx="3"><title>{t('expensesT')}: {money(m.expenses, 0)}</title></rect>
        <text x={cx} y={H - 8} textAnchor="middle">{MG.lang === 'ar' ? i + 1 : names[i].slice(0, 3)}</text></g>; })}
      <polyline className="l-col" points={months.map((m, i) => `${pl + cw * i + cw / 2},${y(m.collected)}`).join(' ')} />
      {months.map((m, i) => <circle key={i} className="d-col" cx={pl + cw * i + cw / 2} cy={y(m.collected)} r="3.2"><title>{t('collected')}: {money(m.collected, 0)}</title></circle>)}
      <line className="ax" x1={pl} x2={W - pr} y1={y(0)} y2={y(0)} />
    </svg>
    <div className="legend" style={{ marginTop: 8 }}><span><i style={{ background: 'var(--gold)' }} />{t('sales')}</span><span><i style={{ background: 'var(--iron)' }} />{t('expensesT')}</span>
      <span><i style={{ background: 'var(--ok)', borderRadius: '50%' }} />{t('collected')}</span></div>
  </>;
}

export function SectionSplit({ st }) {
  const tot = st.sec.alu + st.sec.iron, pa = tot ? st.sec.alu / tot * 100 : 50;
  return <>
    <div className="split"><i style={{ width: pa + '%', background: 'var(--alu)' }} /><i style={{ width: 100 - pa + '%', background: 'var(--iron)' }} /></div>
    <div className="totals">
      <div className="trow"><span><SecTag s="alu" /></span><span className="money">{money(st.sec.alu, 0)} <span className="muted">· {tot ? Math.round(pa) : 0}%</span></span></div>
      <div className="trow"><span><SecTag s="iron" /></span><span className="money">{money(st.sec.iron, 0)} <span className="muted">· {tot ? Math.round(100 - pa) : 0}%</span></span></div>
      <div className="trow big"><span>{t('sales')}</span><span className="money">{money(tot, 0)}</span></div>
    </div>
  </>;
}

export function IncomeStatement({ from, to }) {
  const P = MG.incomeStatement(from, to);
  const Rows = ({ list }) => list.length ? list.map(a => <div className="trow" key={a.id}><span><span className="muted num" style={{ fontSize: 12 }}>{a.code}</span> {MG.nm(a.name)}</span><span className="money">{money(a.v)}</span></div>)
    : <div className="trow muted"><span>—</span><span /></div>;
  const pct = v => P.totalRevenue ? <span className="muted"> ({Math.round(v / P.totalRevenue * 100)}%)</span> : null;
  return <div className="totals pl">
    <div className="pl-h">{t('revenue')}</div><Rows list={P.revenue} />
    <div className="trow sub"><span>{t('totalRevenue')}</span><span className="money">{money(P.totalRevenue)}</span></div>
    <div className="pl-h">{t('cogs')}</div><Rows list={P.cogs} />
    <div className="trow sub"><span>{t('totalCogs')}</span><span className="money">{money(P.totalCogs)}</span></div>
    <div className="trow sub"><span><b>{t('grossProfitAcc')}</b>{pct(P.gross)}</span><span className="money"><b>{money(P.gross)}</b></span></div>
    <div className="pl-h">{t('opex')}</div><Rows list={P.opex} />
    <div className="trow sub"><span>{t('totalOpex')}</span><span className="money">{money(P.totalOpex)}</span></div>
    <div className="trow big"><span>{t('netProfit')}{pct(P.net)}</span><span className={'money ' + (P.net >= 0 ? 'pos' : 'neg')}>{money(P.net)}</span></div>
  </div>;
}

/* ---------- Cut list with bar nesting diagram ---------- */
export function CutList({ items, plain }) {
  const groups = MG.cutList(items);
  if (!groups.length) return <div className="card empty"><Icon name="scissors" /><p>{t('noCut')}</p></div>;
  return <>
    <p className="muted" style={{ marginTop: 0 }}>{t('cutHint')}</p>
    {groups.map(g => <div className={(plain ? '' : 'card ') + 'cut-group'} key={g.key}>
      <div className="cut-head"><div><h3 style={{ fontSize: 17 }}>{MG.nm(g.name)}</h3><div className="muted" style={{ fontSize: 12.5 }}>{t(g.section)} · {t('barLen')} <span className="num">{g.barLen}</span> {t('cm')}</div></div>
        <div className="cut-stats"><span className="chip">{t('barsToBuy')}<b className="num">{g.bars.length}</b></span>
          <span className="chip">{t('usedLen')}<b className="num">{MG.fmt(g.usedLen / 100, 2)} m</b></span>
          <span className="chip">{t('waste')}<b className="num">{MG.fmt(g.waste, 1)}%</b></span>
          <span className="chip">{t('weight')}<b className="num">{MG.fmt(g.weight, 1)} kg</b></span></div></div>
      <div className="table-wrap" style={{ marginBottom: 14 }}><table className="t"><thead><tr><th>{t('cutLen')} ({t('cm')})</th><th>{t('count')}</th><th>{t('description')}</th></tr></thead>
        <tbody>{g.summary.map((s, i) => <tr key={i}><td className="num"><b>{s.len}</b></td><td className="num">× {s.count}</td><td>{s.label}</td></tr>)}</tbody></table></div>
      {g.bars.map((b, i) => {
        const rest = Math.max(0, g.barLen - b.used);
        return <div className="barrow" key={i}><div className="barno">{i + 1}</div><div className={'bar' + (b.over ? ' over' : '')}>
          {b.cuts.map((c, j) => <div key={j} className="seg" style={{ width: c.len / g.barLen * 100 + '%' }} title={c.label + ' — ' + c.len}><span>{c.len}</span></div>)}
          {rest > 0 && <div className="seg rest" style={{ width: rest / g.barLen * 100 + '%' }}><span>{Math.round(rest * 10) / 10}</span></div>}
        </div></div>;
      })}
    </div>)}
  </>;
}

/* ---------- Quotation document ---------- */
export function QuoteDoc({ p }) {
  const T = MG.projectTotals(p), S = MG.db.settings;
  const c = MG.db.settings.company;
  return <div className="q">
    <div className="q-head"><div className="q-brand"><div className="q-mark">M</div><div>
      <div className="q-name">{MG.lang === 'ar' ? (c.nameAr || c.name) : (c.name || c.nameAr)}</div><div className="q-sub">{t('appSub')}</div>
      <div style={{ fontSize: 11.5, color: '#6b6250' }}>{c.phone || ''}{c.address ? ' · ' + c.address : ''}</div></div></div>
      <div className="q-title"><h1>{t('quoteTitle')}</h1><div className="num">{t('quoteNo')} {p.code}</div><div className="num">{MG.today()}</div></div></div>
    <div className="q-info">
      <div><b>{t('client')}:</b>{MG.clientName(p)}</div><div><b>{t('phone')}:</b><span className="num">{p.phone || ''}</span></div>
      <div><b>{t('project')}:</b>{p.name}</div><div><b>{t('location')}:</b>{p.location}</div>
    </div>
    <table><thead><tr><th>#</th><th>{t('drawing')}</th><th>{t('description')}</th><th>{t('dims')} ({t('cm')})</th><th className="r">{t('qty')}</th><th className="r">{t('unitPrice')}</th><th className="r">{t('total')}</th></tr></thead>
      <tbody>{p.items.map((it, i) => {
        const row = T.rows[i];
        const extra = it.section === 'alu' && it.type !== 'custom'
          ? [(S.alu.finishes.find(f => f.id === it.finish) || {}).name, (S.alu.glass.find(g => g.id === it.glass) || {}).name].filter(Boolean).map(MG.nm).join(' · ') : '';
        return <tr key={it.id}><td>{i + 1}</td><td><Svg className="qd" html={MG.drawItem(it)} /></td>
          <td><b>{MG.itemTitle(it)}</b><div style={{ fontSize: 11.5, color: '#6b6250' }}>{t('t_' + it.type)}{extra ? ' · ' + extra : ''}</div></td>
          <td className="num">{MG.itemDims(it)}</td><td className="r num">{row.qty}</td><td className="r money">{money(row.unitPrice, 0)}</td><td className="r money"><b>{money(row.total, 0)}</b></td></tr>;
      })}</tbody></table>
    <div className="q-tot">
      <div><span>{t('subtotal')}</span><span className="money">{money(T.subtotal)}</span></div>
      {T.discount ? <div><span>{t('discount')}</span><span className="money">-{money(T.discount)}</span></div> : null}
      {T.vatAmt ? <div><span>{t('vat')} {p.vat}%</span><span className="money">{money(T.vatAmt)}</span></div> : null}
      <div className="g"><span>{t('grandTotal')}</span><span className="money">{money(T.total)}</span></div>
    </div>
    <div className="q-foot"><div><b>{t('terms')}</b><p>{t('termsText')}</p><p>{t('validity')}</p>{p.notes && <p>{p.notes}</p>}</div>
      <div><div className="q-sign">{t('signature')} — {t('client')}</div></div></div>
  </div>;
}
