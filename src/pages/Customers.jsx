import { useState } from 'react';
import { Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import { MG, t } from '../lib/index.js';
import { Icon, Page, Kpi, Search, PayTag, Empty, confirmBox, printDoc, DocHeader, go } from '../components/ui.jsx';
import { PaymentTable, StatementTable, ProjectRow } from '../components/tables.jsx';
import { openPayment } from '../forms/money.jsx';
import { openCustomer } from '../forms/parties.jsx';
import { openProjectForm } from '../forms/ProjectForm.jsx';

const money = (v, d) => MG.money(v, d);
const saved = { q: '', status: 'all' };
const matches = (k, a) => k === 'all' ? true : k === 'overdue' ? a.overdue : a.status === k;

/* Dashboard card: counts of paid / partial / unpaid / overdue */
export function CustomerSummary() {
  const g = MG.customerSummary();
  return <div className="stat-tiles">{['paid', 'partial', 'unpaid', 'overdue'].map(k =>
    <Link key={k} className={'stat-tile st-' + k} to="/customers" onClick={() => { saved.status = k; }}>
      <div className="st-n num">{g[k][0]}</div><div className="st-l">{t('pay_' + k)}</div>
      <div className="st-v money">{k !== 'paid' ? money(g[k][1], 0) : ' '}</div></Link>)}</div>;
}

export function Customers() {
  const [f, setF] = useState(saved);
  const up = k => v => { saved[k] = v; setF({ ...saved }); };
  const rows = MG.db.customers.map(c => ({ c, a: MG.customerAccount(c.id), n: MG.db.projects.filter(p => p.customerId === c.id).length }));
  const pick = k => rows.filter(r => matches(k, r.a));
  const sumBal = k => pick(k).reduce((s, r) => s + Math.max(0, r.a.balance), 0);
  const q = f.q.trim().toLowerCase();
  const list = rows.filter(r => matches(f.status, r.a) && (!q || (r.c.name + ' ' + (r.c.phone || '') + ' ' + (r.c.address || '')).toLowerCase().includes(q)))
    .sort((a, b) => b.a.balance - a.a.balance);
  const print = () => printDoc(<div className="q"><DocHeader title={t('receivablesReport')} />
    <table><thead><tr><th>{t('client')}</th><th>{t('phone')}</th><th className="r">{t('invoiced')}</th><th className="r">{t('paid')}</th><th className="r">{t('balance')}</th><th>{t('status')}</th></tr></thead><tbody>
      {rows.filter(r => r.a.status !== 'none').sort((a, b) => b.a.balance - a.a.balance).map(({ c, a }) => <tr key={c.id}><td>{c.name}</td><td className="num">{c.phone}</td>
        <td className="r money">{money(a.invoiced)}</td><td className="r money">{money(a.paid)}</td><td className="r money"><b>{money(a.balance)}</b></td><td>{t('pay_' + a.status)}{a.overdue ? ' · ' + t('pay_overdue') : ''}</td></tr>)}
    </tbody></table><div className="q-tot"><div className="g"><span>{t('outstanding')}</span><span className="money">{money(sumBal('all'))}</span></div></div></div>);

  return <Page title={t('customers')} sub={<>{rows.length} {t('customers')} · {t('outstanding')}: <span className="money">{money(sumBal('all'), 0)}</span></>}
    actions={<>{MG.can('payments.receive') && <button className="btn" onClick={() => openPayment({})}><Icon name="cash" /> {t('addPayment')}</button>}
      <button className="btn" onClick={print}><Icon name="print" /> {t('print')}</button>
      <button className="btn btn-gold" onClick={() => openCustomer()}><Icon name="plus" /> {t('newCustomer')}</button></>}>
    <div className="stat-tiles big">{['all', 'paid', 'partial', 'unpaid', 'overdue'].map(k =>
      <button key={k} className={'stat-tile st-' + k + (f.status === k ? ' on' : '')} onClick={() => up('status')(k)}>
        <div className="st-n num">{pick(k).length}</div><div className="st-l">{k === 'all' ? t('all') : t('pay_' + k)}</div>
        <div className="st-v money">{k === 'paid' ? '' : money(sumBal(k), 0)}</div></button>)}</div>
    <div className="filters"><Search value={f.q} onChange={up('q')} /></div>
    {list.length ? <div className="table-wrap"><table className="t"><thead><tr><th>{t('client')}</th><th>{t('phone')}</th><th>{t('projects')}</th>
      <th className="r">{t('invoiced')}</th><th className="r">{t('paid')}</th><th className="r">{t('balance')}</th><th>{t('status')}</th><th></th></tr></thead><tbody>
      {list.map(({ c, a, n }) => <tr key={c.id} style={{ cursor: 'pointer' }} onClick={e => { if (!e.target.closest('a')) go('/customer/' + c.id); }}>
        <td><b>{c.name}</b>{a.overdue && <> <span className="tag pay-overdue">{t('pay_overdue')}</span></>}</td>
        <td className="num">{c.phone}</td><td className="num">{n}</td><td className="r money">{money(a.invoiced, 0)}</td><td className="r money">{money(a.paid, 0)}</td>
        <td className="r money"><b className={a.balance > 0.5 ? 'neg' : a.balance < -0.5 ? 'pos' : ''}>{money(a.balance, 0)}</b></td><td><PayTag s={a.status} /></td>
        <td className="r">{a.balance > 0.5 && c.phone && <a className="btn btn-ghost btn-sm btn-icon wa" href={MG.waLink(c.phone, MG.reminderMsg(c, a.balance))} target="_blank" rel="noopener noreferrer" title="WhatsApp"><Icon name="phone" /></a>}</td></tr>)}
    </tbody></table></div> : <Empty icon="users" text={MG.db.customers.length ? '—' : t('noCustomers')} />}
  </Page>;
}

export function Customer() {
  const { id } = useParams();
  const nav = useNavigate();
  const c = MG.getCustomer(id);
  if (!c) return <Navigate to="/customers" replace />;
  const a = MG.customerAccount(c.id);
  const projects = MG.db.projects.filter(p => p.customerId === c.id);
  const pays = MG.db.payments.filter(x => x.customerId === c.id).sort((x, y) => x.date < y.date ? 1 : -1);
  const L = MG.ledger('ar', '', '', { t: 'customer', id: c.id });
  const printStatement = () => printDoc(<div className="q"><DocHeader title={t('statement')} />
    <div className="q-info"><div><b>{t('client')}:</b>{c.name}</div><div><b>{t('phone')}:</b><span className="num">{c.phone}</span></div></div>
    <StatementTable rows={L.rows} opening={L.opening} />
    <div className="q-tot"><div><span>{t('invoiced')}</span><span className="money">{money(a.invoiced)}</span></div><div><span>{t('paid')}</span><span className="money">{money(a.paid)}</span></div>
      <div className="g"><span>{t('balance')}</span><span className="money">{money(a.balance)}</span></div></div></div>);
  const del = () => confirmBox(t('confirmDelete'), () => { MG.db.customers = MG.db.customers.filter(x => x !== c); MG.log('customer.delete', c.name); MG.save(); nav('/customers'); });

  return <Page back={<Link to="/customers" className="back"><Icon name="back" /> {t('customers')}</Link>} title={c.name}
    sub={<>{c.phone && <a className="num" href={'tel:' + c.phone}>{c.phone}</a>}{c.address ? ' · ' + c.address : ''}</>}
    actions={<>{a.balance > 0.5 && c.phone && <a className="btn" target="_blank" rel="noopener noreferrer" href={MG.waLink(c.phone, MG.reminderMsg(c, a.balance))}><Icon name="phone" /> {t('whatsappReminder')}</a>}
      <button className="btn" onClick={printStatement}><Icon name="print" /> {t('statement')}</button>
      <button className="btn" onClick={() => openCustomer(c)}><Icon name="edit" /> {t('edit')}</button>
      {MG.can('payments.receive') && <button className="btn btn-gold" onClick={() => openPayment({ customer: c })}><Icon name="cash" /> {t('addPayment')}</button>}</>}>
    <div className="kpis">
      <Kpi hl icon="doc" label={t('invoiced')} value={money(a.invoiced, 0)} sub={`${projects.length} ${t('projects')}`} />
      <Kpi icon="cash" label={t('paid')} value={money(a.paid, 0)} sub={a.invoiced ? Math.round(a.paid / a.invoiced * 100) + '%' : ''} />
      <Kpi icon="clock" label={t('balance')} value={<span className={a.balance > 0.5 ? 'neg' : 'pos'}>{money(a.balance, 0)}</span>} sub={a.balance < -0.5 ? t('customerCredit') : ''} />
      <Kpi icon="shield" label={t('status')} value={<PayTag s={a.status} /> || '—'} sub={a.overdue ? <span className="neg">{t('pay_overdue')}</span> : ''} />
    </div>
    <div className="two-col">
      <div className="cards">
        <div className="card"><div className="card-h"><h3>{t('statement')}</h3></div><StatementTable rows={L.rows} opening={L.opening} /></div>
        <div className="card"><div className="card-h"><h3>{t('payments')}</h3></div><PaymentTable list={pays} /></div>
      </div>
      <div className="cards">
        <div className="card"><div className="card-h"><h3>{t('projects')}</h3>{MG.can('projects.edit') && <button className="btn btn-sm" onClick={() => openProjectForm(null, null, c)}><Icon name="plus" /> {t('newProject')}</button>}</div>
          {projects.length ? <div className="plist">{projects.map(p => <ProjectRow key={p.id} p={p} />)}</div> : <p className="muted">—</p>}</div>
        {c.notes && <div className="card"><div className="card-h"><h3>{t('notes')}</h3></div><p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{c.notes}</p></div>}
        {MG.can('delete') && !projects.length && !pays.length && <button className="btn btn-danger" onClick={del}><Icon name="trash" /> {t('delete')}</button>}
      </div>
    </div>
  </Page>;
}
