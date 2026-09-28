/* Accounting: treasury, income statement, balance sheet, trial balance, general ledger, journal, period close */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MG, t } from '../lib/index.js';
import { Icon, Page, Tabs, Seg, Field, Input, confirmBox, guardDate, toast, printDoc, DocHeader } from '../components/ui.jsx';
import { IncomeStatement, StatementTable } from '../components/tables.jsx';
import { openTransfer, openEquity } from '../forms/money.jsx';
import { openAccount } from '../forms/parties.jsx';

const N = v => parseFloat(v) || 0;
const money = (v, d) => MG.money(v, d);
const ym = () => MG.today().slice(0, 7);
const range = { from: ym() + '-01', to: MG.today(), acc: 'acc:cash' };

function presets() {
  const d = new Date(), y = d.getFullYear(), m = d.getMonth();
  const f = (a, b) => [MG.iso(a), MG.iso(new Date(b.getTime() - 86400000))];
  return [['thisMonth', f(new Date(y, m, 1), new Date(y, m + 1, 1))], ['lastMonth', f(new Date(y, m - 1, 1), new Date(y, m, 1))],
    ['thisYear', f(new Date(y, 0, 1), new Date(y + 1, 0, 1))], ['lastYear', f(new Date(y - 1, 0, 1), new Date(y, 0, 1))]];
}

function RangeBar({ asOf, r, setRange }) {
  return <div className="filters range-bar">
    {!asOf && <><label className="muted">{t('fromDate')}</label><input type="date" className="input" value={r.from} onChange={e => setRange({ from: e.target.value })} style={{ width: 'auto' }} /></>}
    <label className="muted">{asOf ? t('asOf') : t('toDate')}</label><input type="date" className="input" value={r.to} onChange={e => setRange({ to: e.target.value })} style={{ width: 'auto' }} />
    {!asOf && <Seg value={presets().find(p => p[1][0] === r.from && p[1][1] === r.to)?.[1].join('|')} onChange={v => { const [from, to] = v.split('|'); setRange({ from, to }); }}
      options={presets().map(p => [p[1].join('|'), t(p[0])])} />}
  </div>;
}

export default function Accounting() {
  const { tab: tp } = useParams();
  const nav = useNavigate();
  const [r, setR] = useState(range);
  const setRange = patch => { Object.assign(range, patch); setR({ ...range }); };
  const tabs = [['treasury', 'wallet', t('treasury')], ['pl', 'chart', t('incomeStatement')], ['bs', 'book', t('balanceSheet')], ['trial', 'list', t('trialBalance')],
    ['ledger', 'doc', t('generalLedger')], ['journal', 'book', t('journalBook')], ['close', 'lock', t('periodClose')]];
  const tab = tabs.some(x => x[0] === tp) ? tp : 'treasury';
  const tb = MG.trialBalance();
  const balanced = Math.abs(tb.reduce((s, a) => s + a.dr, 0) - tb.reduce((s, a) => s + a.cr, 0)) < 0.01;
  const toEx = r.to ? MG.nextDay(r.to) : '';
  const openLedger = acc => { setRange({ acc }); nav('/accounting/ledger'); };

  const PrintBtn = ({ doc }) => <button className="btn btn-sm" onClick={() => printDoc(doc)}><Icon name="print" /> {t('print')}</button>;

  let body;
  if (tab === 'treasury') body = <Treasury openLedger={openLedger} />;
  else if (tab === 'pl') {
    const doc = <div className="q"><DocHeader title={t('incomeStatement')} date={r.from + ' → ' + r.to} /><IncomeStatement from={r.from} to={toEx} /></div>;
    body = <><RangeBar r={r} setRange={setRange} /><div className="card statement"><div className="card-h"><h3>{t('incomeStatement')}</h3><span className="muted num">{r.from} → {r.to}</span><PrintBtn doc={doc} /></div>
      <IncomeStatement from={r.from} to={toEx} /></div></>;
  } else if (tab === 'bs') {
    const doc = <div className="q"><DocHeader title={t('balanceSheet')} date={t('asOf') + ' ' + r.to} /><BalanceSheet asOf={r.to} /></div>;
    body = <><RangeBar asOf r={r} setRange={setRange} /><div className="card statement"><div className="card-h"><h3>{t('balanceSheet')}</h3><span className="muted num">{t('asOf')} {r.to}</span><PrintBtn doc={doc} /></div>
      <BalanceSheet asOf={r.to} /></div></>;
  } else if (tab === 'trial') {
    const doc = <div className="q"><DocHeader title={t('trialBalance')} date={t('asOf') + ' ' + r.to} /><Trial to={toEx} /></div>;
    body = <><RangeBar asOf r={r} setRange={setRange} /><div className="card"><div className="card-h"><h3>{t('trialBalance')}</h3><span className="muted num">{t('asOf')} {r.to}</span><PrintBtn doc={doc} /></div>
      <Trial to={toEx} onPick={openLedger} /></div></>;
  } else if (tab === 'ledger') {
    const coa = MG.coa(); const acc = coa.some(a => a.id === r.acc) ? r.acc : coa[0].id;
    const L = MG.ledger(acc, r.from, toEx);
    const doc = <div className="q"><DocHeader title={t('generalLedger') + ' — ' + MG.accName(acc)} date={r.from + ' → ' + r.to} /><StatementTable rows={L.rows} opening={L.opening} /></div>;
    body = <><RangeBar r={r} setRange={setRange} /><div className="card"><div className="card-h">
      <select className="input" style={{ maxWidth: 420 }} value={acc} onChange={e => setRange({ acc: e.target.value })}>
        {['asset', 'liability', 'equity', 'revenue', 'expense'].map(ty => <optgroup key={ty} label={t('type_' + ty)}>{coa.filter(a => a.type === ty).map(a => <option key={a.id} value={a.id}>{a.code} — {MG.nm(a.name)}</option>)}</optgroup>)}
      </select><PrintBtn doc={doc} /></div>
      <div className="chips" style={{ margin: '0 0 14px' }}><span className="chip">{t('openingBal')}<b className="money">{money(L.opening)}</b></span><span className="chip">{t('closingBal')}<b className="money">{money(L.closing)}</b></span></div>
      <StatementTable rows={L.rows} opening={L.opening} /></div></>;
  } else if (tab === 'journal') {
    const list = MG.journal().filter(e => e.date >= r.from && e.date < toEx);
    const csv = () => {
      const coa = MG.coa(), code = id => (coa.find(a => a.id === id) || {}).code || '';
      const rows = [['entry', 'date', 'ref', 'description', 'account_code', 'account', 'debit', 'credit']];
      list.forEach(e => e.lines.forEach(l => rows.push([e.no, e.date, e.ref, e.desc, code(l.acc), MG.accName(l.acc), l.dr.toFixed(2), l.cr.toFixed(2)])));
      MG.downloadCsv('majed-journal-' + r.from + '_' + r.to + '.csv', rows);
    };
    const doc = <div className="q"><DocHeader title={t('journalBook')} date={r.from + ' → ' + r.to} /><Journal list={list} /></div>;
    body = <><RangeBar r={r} setRange={setRange} /><div className="card"><div className="card-h"><h3>{t('journalBook')} <span className="muted" style={{ fontSize: 14 }}>({list.length})</span></h3>
      <div style={{ display: 'flex', gap: 8 }}><button className="btn btn-sm" onClick={csv}><Icon name="download" /> CSV</button><PrintBtn doc={doc} /></div></div>
      <p className="muted" style={{ marginTop: 0, fontSize: 12.5 }}>{t('journalHint')}</p>{list.length ? <Journal list={list} /> : <p className="muted">—</p>}</div></>;
  } else body = <PeriodClose />;

  return <Page title={t('accounting')} sub={<>{MG.journal().length} {t('entries')} · <span className={balanced ? 'pos' : 'neg'}>{balanced ? '✓ ' + t('booksBalanced') : '✗ ' + t('booksNotBalanced')}</span></>}
    actions={<><button className="btn" onClick={openTransfer}><Icon name="swap" /> {t('transfer2')}</button><button className="btn" onClick={() => openEquity('drawing')}><Icon name="user" /> {t('ownerEntry')}</button></>}>
    <Tabs tabs={tabs} value={tab} onChange={k => nav('/accounting/' + k)} />
    {body}
  </Page>;
}

function Treasury({ openLedger }) {
  const moves = MG.db.transfers.map(x => ({ x, k: 'transfer' })).concat(MG.db.equity.map(x => ({ x, k: 'equity' }))).sort((a, b) => a.x.date < b.x.date ? 1 : -1);
  const del = (k, x) => {
    const coll = k === 'transfer' ? 'transfers' : 'equity';
    if (!guardDate(x.date)) return;
    confirmBox(t('confirmDelete'), () => { MG.db[coll] = MG.db[coll].filter(y => y !== x); MG.log(k + '.delete', money(x.amount)); MG.save(); });
  };
  const accName = id => MG.nm((MG.getAccount(id) || {}).name || '');
  return <>
    <div className="acc-cards">{MG.db.accounts.map(a => {
      const L = MG.ledger('acc:' + a.id, ym() + '-01', '');
      return <a key={a.id} className={'kpi' + (a.type === 'cash' ? ' hl' : '')} onClick={() => openLedger('acc:' + a.id)}>
        <div className="kpi-l"><Icon name={a.type === 'bank' ? 'bank' : 'wallet'} />{MG.nm(a.name)}</div>
        <div className="kpi-v money">{money(MG.cashBalance(a.id))}</div>
        <div className="kpi-s">{t('thisMonth')}: <span className="pos">+{money(L.rows.reduce((s, r) => s + r.dr, 0), 0)}</span> / <span className="neg">-{money(L.rows.reduce((s, r) => s + r.cr, 0), 0)}</span></div></a>;
    })}</div>
    <div className="two-col" style={{ marginTop: 18 }}>
      <div className="card"><div className="card-h"><h3>{t('transfersOwner')}</h3></div>
        {moves.length ? <div className="table-wrap"><table className="t"><thead><tr><th>{t('date')}</th><th>{t('type')}</th><th>{t('description')}</th><th className="r">{t('amount')}</th><th></th></tr></thead><tbody>
          {moves.map(({ x, k }) => <tr key={x.id}><td className="num">{x.date}</td><td>{k === 'transfer' ? t('transfer2') : t('eq_' + x.type)}</td>
            <td>{k === 'transfer' ? accName(x.from) + ' → ' + accName(x.to) : accName(x.accountId)} {x.note && <span className="muted">· {x.note}</span>}</td>
            <td className="r money">{money(x.amount)}</td><td className="r">{MG.can('delete') && <button className="btn btn-ghost btn-sm btn-icon btn-danger" onClick={() => del(k, x)}><Icon name="trash" /></button>}</td></tr>)}
        </tbody></table></div> : <p className="muted">{t('transfersHint')}</p>}</div>
      <div className="card"><div className="card-h"><h3>{t('cashAccounts')}</h3><button className="btn btn-sm" onClick={() => openAccount()}><Icon name="plus" /> {t('add')}</button></div>
        <div className="table-wrap"><table className="t"><thead><tr><th>{t('name')}</th><th>{t('type')}</th><th className="r">{t('openingBal')}</th><th></th></tr></thead><tbody>
          {MG.db.accounts.map(a => <tr key={a.id}><td>{MG.nm(a.name)}</td><td>{t(a.type === 'bank' ? 'bankAcc' : 'cashBox')}</td><td className="r money">{money(a.opening || 0)}</td>
            <td className="r"><button className="btn btn-ghost btn-sm btn-icon" onClick={() => openAccount(a)}><Icon name="edit" /></button></td></tr>)}</tbody></table></div>
        <p className="muted" style={{ fontSize: 12.5, margin: '12px 0 0' }}>{t('openingHint')} <b className="num">{MG.db.settings.openingDate || '—'}</b></p></div>
    </div>
  </>;
}

function BalanceSheet({ asOf }) {
  const B = MG.balanceSheet(asOf);
  const Rows = ({ list }) => list.length ? list.map(a => <div className="trow" key={a.id}><span><span className="muted num" style={{ fontSize: 12 }}>{a.code}</span> {MG.nm(a.name)}</span><span className="money">{money(a.v)}</span></div>)
    : <div className="trow muted"><span>—</span></div>;
  const ok = Math.abs(B.totalAssets - B.totalLiabilities - B.totalEquity) < 0.01;
  return <>
    <div className="grid g2" style={{ gap: 18, alignItems: 'start' }}>
      <div className="totals pl"><div className="pl-h">{t('assets')}</div><Rows list={B.assets} /><div className="trow big"><span>{t('totalAssets')}</span><span className="money">{money(B.totalAssets)}</span></div></div>
      <div className="totals pl"><div className="pl-h">{t('liabilities')}</div><Rows list={B.liabilities} /><div className="trow sub"><span>{t('totalLiabilities')}</span><span className="money">{money(B.totalLiabilities)}</span></div>
        <div className="pl-h">{t('equityT')}</div><Rows list={B.equity} /><div className="trow"><span>{t('retainedEarnings')}</span><span className={'money ' + (B.earnings >= 0 ? 'pos' : 'neg')}>{money(B.earnings)}</span></div>
        <div className="trow sub"><span>{t('totalEquity')}</span><span className="money">{money(B.totalEquity)}</span></div>
        <div className="trow big"><span>{t('totalLE')}</span><span className="money">{money(B.totalLiabilities + B.totalEquity)}</span></div></div>
    </div>
    <p className={ok ? 'pos' : 'neg'} style={{ margin: '14px 0 0', fontWeight: 600 }}>{ok ? '✓ ' + t('bsBalanced') : '✗ ' + t('booksNotBalanced')}</p>
  </>;
}

function Trial({ to, onPick }) {
  const rows = MG.trialBalance('', to);
  const s = k => rows.reduce((x, a) => x + a[k], 0);
  return <div className="table-wrap"><table className="t"><thead><tr><th>{t('code')}</th><th>{t('account')}</th><th className="r">{t('debit')}</th><th className="r">{t('credit')}</th><th className="r">{t('balDebit')}</th><th className="r">{t('balCredit')}</th></tr></thead><tbody>
    {rows.map(a => <tr key={a.id} style={{ cursor: onPick ? 'pointer' : '' }} onClick={() => onPick && onPick(a.id)}><td className="num">{a.code}</td><td>{MG.nm(a.name)}</td>
      <td className="r money">{money(a.dr)}</td><td className="r money">{money(a.cr)}</td><td className="r money">{a.balDr ? money(a.balDr) : ''}</td><td className="r money">{a.balCr ? money(a.balCr) : ''}</td></tr>)}
  </tbody><tfoot><tr><td colSpan={2}>{t('total')}</td><td className="r money">{money(s('dr'))}</td><td className="r money">{money(s('cr'))}</td><td className="r money">{money(s('balDr'))}</td><td className="r money">{money(s('balCr'))}</td></tr></tfoot></table></div>;
}

function Journal({ list }) {
  return <div className="table-wrap"><table className="t jr"><thead><tr><th>#</th><th>{t('date')}</th><th>{t('ref')}</th><th>{t('account')}</th><th className="r">{t('debit')}</th><th className="r">{t('credit')}</th></tr></thead><tbody>
    {list.map(e => [<tr className="jr-h" key={e.no}><td className="num muted">{e.no}</td><td className="num">{e.date}</td><td className="num muted">{e.ref}</td><td colSpan={3}><b>{e.desc}</b></td></tr>,
      ...e.lines.map((l, i) => <tr key={e.no + '-' + i}><td /><td /><td /><td className={l.cr ? 'jr-cr' : ''}>{MG.accName(l.acc)}</td><td className="r money">{l.dr ? money(l.dr) : ''}</td><td className="r money">{l.cr ? money(l.cr) : ''}</td></tr>)])}
  </tbody><tfoot><tr><td colSpan={4}>{t('total')}</td><td className="r money">{money(list.reduce((s, e) => s + e.lines.reduce((x, l) => x + l.dr, 0), 0))}</td>
    <td className="r money">{money(list.reduce((s, e) => s + e.lines.reduce((x, l) => x + l.cr, 0), 0))}</td></tr></tfoot></table></div>;
}

function PeriodClose() {
  const S = MG.db.settings, admin = MG.can('users');
  const [v, setV] = useState({ lockBefore: S.lockBefore || '', openingDate: S.openingDate || '', rate: S.rate });
  const saveLock = () => { S.lockBefore = v.lockBefore; S.openingDate = v.openingDate; MG.log('period.lock', v.lockBefore || '—'); MG.save(); toast(t('saved')); };
  const saveRate = () => { S.rate = N(v.rate) || S.rate; MG.log('rate', S.rate); MG.save(); toast(t('saved')); };
  return <div className="two-col">
    <div className="card"><div className="card-h"><h3><Icon name="lock" style={{ width: 18, verticalAlign: -3, color: 'var(--gold)' }} /> {t('periodClose')}</h3></div>
      <p className="muted" style={{ marginTop: 0 }}>{t('lockHint')}</p>
      <div className="grid g2">
        <Field label={t('lockBefore')}><Input type="date" disabled={!admin} value={v.lockBefore} onChange={e => setV({ ...v, lockBefore: e.target.value })} /></Field>
        <Field label={t('openingDate')}><Input type="date" disabled={!admin} value={v.openingDate} onChange={e => setV({ ...v, openingDate: e.target.value })} /></Field>
      </div>
      {admin ? <button className="btn btn-gold" style={{ marginTop: 14 }} onClick={saveLock}>{t('save')}</button> : <p className="muted">{t('adminOnly')}</p>}</div>
    <div className="card"><div className="card-h"><h3>{t('exchangeRate')}</h3></div><p className="muted" style={{ marginTop: 0 }}>{t('rateHint')}</p>
      <Field label="1 USD = LBP"><Input type="number" value={v.rate} onChange={e => setV({ ...v, rate: e.target.value })} /></Field>
      <button className="btn" style={{ marginTop: 14 }} onClick={saveRate}>{t('save')}</button></div>
  </div>;
}
