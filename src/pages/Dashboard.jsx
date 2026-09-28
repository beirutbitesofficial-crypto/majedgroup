import { Link } from 'react-router-dom';
import { MG, t } from '../lib/index.js';
import { Icon, Kpi, Page, Totals } from '../components/ui.jsx';
import { ProjectRow, TrendChart } from '../components/tables.jsx';
import { QuickTiles } from '../forms/QuickAdd.jsx';
import { canQuick } from '../components/Shell.jsx';
import { openProjectForm } from '../forms/ProjectForm.jsx';
import { recordRecurring } from '../forms/money.jsx';
import { CustomerSummary } from './Customers.jsx';

const money = (v, d) => MG.money(v, d);

export function EmptyProjects() {
  return <div className="empty"><Icon name="folder" /><h3>{t('noProjects')}</h3><p>{t('startFirst')}</p>
    {MG.can('projects.edit') && <button className="btn btn-gold" onClick={() => openProjectForm()}><Icon name="plus" /> {t('newProject')}</button>}</div>;
}

export function RecurringDue({ list }) {
  return <div className="totals">{list.map(r => <div className="trow" key={r.id} style={{ alignItems: 'center' }}>
    <span>{MG.nm(MG.getCategory(r.category).name)}{r.note && <span className="muted"> · {r.note}</span>}<div className="muted" style={{ fontSize: 12 }}>{t('dueDay')} {r.day || 1}</div></span>
    <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span className="money">{money(r.amount, 0)}</span>
      <button className="btn btn-sm btn-gold" onClick={() => recordRecurring(r)}><Icon name="check" /> {t('record')}</button></span></div>)}</div>;
}

export default function Dashboard() {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth();
  const hello = (MG.lang === 'ar' ? 'أهلاً ' : 'Welcome, ') + (MG.user.name || '').split(' ')[0];
  const dateStr = now.toLocaleDateString(MG.lang === 'ar' ? 'ar-LB' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const recent = MG.db.projects.filter(p => p.status !== 'cancelled').slice(0, 6);
  const fin = MG.can('accounting') || MG.can('reports');
  const month = fin ? MG.periodStats(new Date(y, m, 1), new Date(y, m + 1, 1)) : null;
  const due = MG.can('expenses') ? MG.recurringDue() : [];

  return <Page title={hello} sub={dateStr} actions={<>
    {MG.can('view.prices') && <Link className="btn" to="/calc"><Icon name="calc" /> {t('calculator')}</Link>}
    {MG.can('projects.edit') && <button className="btn btn-gold" onClick={() => openProjectForm()}><Icon name="plus" /> {t('newProject')}</button>}</>}>
    {fin && <div className="kpis">
      <Kpi hl icon="trend" label={t('sales') + ' · ' + t('thisMonth')} value={money(month.sales, 0)} sub={`${month.count} ${t('projects')}`} />
      <Kpi icon="coins" label={t('collected') + ' · ' + t('thisMonth')} value={money(month.collected, 0)} sub={t('expensesT') + ': ' + money(month.expenses, 0)} />
      <Kpi icon="chart" label={t('netProfit') + ' · ' + t('thisMonth')} value={<span className={month.net >= 0 ? 'pos' : 'neg'}>{money(month.net, 0)}</span>}
        sub={t('netCash') + ': ' + money(month.cashIn - month.cashOut, 0)} />
      <Kpi icon="clock" label={t('outstanding')} value={money(MG.totalReceivable(), 0)} sub={<Link to="/customers">{t('customers')}</Link>} />
    </div>}
    <div className="two-col">
      <div className="cards">
        {fin && <div className="card"><div className="card-h"><h3>{t('monthlyTrend')} · {y}</h3><Link to="/reports" className="btn btn-sm btn-ghost">{t('reports')}</Link></div><TrendChart year={y} /></div>}
        <div className="card"><div className="card-h"><h3>{t('recentProjects')}</h3><Link to="/projects" className="btn btn-sm btn-ghost">{t('viewAll')}</Link></div>
          {recent.length ? <div className="plist">{recent.map(p => <ProjectRow key={p.id} p={p} />)}</div> : <EmptyProjects />}</div>
      </div>
      <div className="cards">
        {canQuick() && <div className="card"><div className="card-h"><h3>{t('quickEntry')}</h3></div><QuickTiles compact /></div>}
        {MG.can('accounting') && <div className="card"><div className="card-h"><h3>{t('cashPosition')}</h3><Link to="/accounting" className="btn btn-sm btn-ghost">{t('accounting')}</Link></div>
          <Totals rows={MG.db.accounts.map(a => [<><Icon name={a.type === 'bank' ? 'bank' : 'wallet'} style={{ width: 15, verticalAlign: -3, color: 'var(--gold)' }} /> {MG.nm(a.name)}</>, money(MG.cashBalance(a.id))])}
            big={[t('total'), money(MG.db.accounts.reduce((s, a) => s + MG.cashBalance(a.id), 0))]} /></div>}
        {MG.can('customers') && MG.can('view.prices') && <div className="card"><div className="card-h"><h3>{t('customerStatus')}</h3><Link to="/customers" className="btn btn-sm btn-ghost">{t('viewAll')}</Link></div><CustomerSummary /></div>}
        {due.length > 0 && <div className="card"><div className="card-h"><h3>{t('fixedDue')}</h3><Link to="/expenses" className="btn btn-sm btn-ghost">{t('expenses')}</Link></div><RecurringDue list={due} /></div>}
        {!MG.can('view.prices') && <div className="card"><div className="card-h"><h3>{t('quickActions')}</h3></div><Link className="btn btn-block" to="/sketch"><Icon name="pen" /> {t('sketch')}</Link></div>}
      </div>
    </div>
  </Page>;
}
