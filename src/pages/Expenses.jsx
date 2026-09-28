import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MG, t } from '../lib/index.js';
import { Icon, Page, Search } from '../components/ui.jsx';
import { ExpenseTable } from '../components/tables.jsx';
import { QuickTiles } from '../forms/QuickAdd.jsx';
import { openExpense, openRecurring } from '../forms/money.jsx';
import { RecurringDue } from './Dashboard.jsx';

const N = v => parseFloat(v) || 0;
const money = (v, d) => MG.money(v, d);
const saved = { month: MG.today().slice(0, 7), cat: '', q: '' };

export default function Expenses() {
  const [f, setF] = useState(saved);
  const up = k => v => { saved[k] = v; setF({ ...saved }); };
  const q = f.q.toLowerCase();
  const list = MG.db.expenses.filter(x => (!f.month || (x.date || '').startsWith(f.month)) && (!f.cat || x.category === f.cat) &&
    (!q || [x.note, x.ref, (MG.getSupplier(x.supplierId) || {}).name].join(' ').toLowerCase().includes(q)))
    .sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  const wages = MG.db.payroll.filter(x => x.type !== 'advance' && (!f.month || (x.date || '').startsWith(f.month)));
  const byCat = {};
  list.forEach(x => { byCat[x.category] = (byCat[x.category] || 0) + N(x.amount); });
  wages.forEach(x => { const k = x.projectId ? 'labor' : 'salary'; if (!f.cat || f.cat === k) byCat[k] = (byCat[k] || 0) + N(x.amount); });
  const total = Object.values(byCat).reduce((s, v) => s + v, 0), max = Math.max(1, ...Object.values(byCat));
  const due = MG.recurringDue();
  const csv = () => MG.downloadCsv('majed-expenses-' + (f.month || 'all') + '.csv',
    [['date', 'category', 'group', 'amount_usd', 'original', 'currency', 'paid', 'account', 'supplier', 'project', 'invoice', 'note']].concat(list.map(x => {
      const c = MG.getCategory(x.category);
      return [x.date, MG.nm(c.name), c.group, N(x.amount).toFixed(2), x.orig || x.amount, x.cur || 'USD', x.paid === false ? 'credit' : 'paid', MG.nm((MG.getAccount(x.accountId) || {}).name || ''),
        (MG.getSupplier(x.supplierId) || {}).name || '', (MG.getProject(x.projectId) || {}).code || '', x.ref || '', x.note || ''];
    })));

  return <Page title={t('expenses')} sub={<>{f.month ? MG.monthNames()[+f.month.slice(5) - 1] + ' ' + f.month.slice(0, 4) : t('all')} · <span className="money">{money(total, 0)}</span></>}
    actions={<><input type="month" className="input" value={f.month} onChange={e => up('month')(e.target.value)} style={{ width: 'auto' }} />
      <button className="btn" onClick={csv}><Icon name="download" /> CSV</button>
      <button className="btn btn-gold" onClick={() => openExpense()}><Icon name="plus" /> {t('addExpense')}</button></>}>
    <div className="card" style={{ marginBottom: 18 }}><div className="card-h"><h3>{t('quickEntry')}</h3><span className="muted" style={{ fontSize: 13 }}>{t('quickHint')}</span></div><QuickTiles compact /></div>
    <div className="two-col" style={{ marginBottom: 18 }}>
      <div className="card"><div className="card-h"><h3>{t('expensesByCat')}</h3>
        <select className="input" value={f.cat} onChange={e => up('cat')(e.target.value)} style={{ width: 'auto', minHeight: 36, padding: '6px 10px' }}>
          <option value="">{t('all')}</option>{MG.db.settings.categories.map(c => <option key={c.id} value={c.id}>{MG.nm(c.name)}</option>)}</select></div>
        {Object.keys(byCat).length ? <div className="bd">{Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
          <div className="bd-row" key={k}><span>{MG.nm(MG.getCategory(k).name)}</span><div className="bd-bar"><i style={{ width: v / max * 100 + '%', background: 'var(--iron)' }} /></div><span className="money">{money(v, 0)}</span></div>)}
          <div className="trow big" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}><span>{t('total')}</span><span className="money">{money(total)}</span></div></div>
          : <p className="muted">—</p>}
        {wages.length > 0 && <p className="muted" style={{ fontSize: 12.5, margin: '12px 0 0' }}>{t('wagesIncluded')} <Link to="/workers">{t('workers')}</Link></p>}
      </div>
      <div className="card"><div className="card-h"><h3>{t('fixedCosts')}</h3><button className="btn btn-sm" onClick={() => openRecurring()}><Icon name="plus" /> {t('add')}</button></div>
        {due.length > 0 && <><div className="alert"><Icon name="alert" /> {t('fixedDue')}</div><RecurringDue list={due} /></>}
        {MG.db.recurring.length ? <div className="totals" style={{ marginTop: 12 }}>{MG.db.recurring.map(r =>
          <div className="trow" key={r.id} style={{ cursor: 'pointer', opacity: r.active === false ? .5 : 1 }} onClick={() => openRecurring(r)}>
            <span>{MG.nm(MG.getCategory(r.category).name)} {r.note && <span className="muted">· {r.note}</span>}</span><span className="money">{money(r.amount, 0)} <span className="muted">/ {t('month')}</span></span></div>)}</div>
          : <p className="muted" style={{ margin: 0 }}>{t('fixedHint')}</p>}
      </div>
    </div>
    <div className="filters"><Search value={f.q} onChange={up('q')} /></div>
    <div className="card"><ExpenseTable list={list} showProject /></div>
  </Page>;
}
