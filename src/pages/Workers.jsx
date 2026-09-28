import { Link, useParams, Navigate } from 'react-router-dom';
import { MG, t } from '../lib/index.js';
import { Icon, Page, Kpi, Empty, go } from '../components/ui.jsx';
import { PayrollTable } from '../components/tables.jsx';
import { openWage, openAdvance } from '../forms/money.jsx';
import { openWorker } from '../forms/parties.jsx';

const N = v => parseFloat(v) || 0;
const money = (v, d) => MG.money(v, d);
const per = w => t(w.wageType === 'monthly' ? 'perMonth' : 'perDay');

export function Workers() {
  const ym = MG.today().slice(0, 7);
  const rows = MG.db.workers.map(w => {
    const month = MG.db.payroll.filter(x => x.workerId === w.id && x.type !== 'advance' && (x.date || '').startsWith(ym));
    return { w, a: MG.workerAccount(w.id), mDays: month.reduce((s, x) => s + N(x.days), 0), mPaid: month.reduce((s, x) => s + N(x.amount), 0) };
  });
  return <Page title={t('workers')} sub={<>{t('thisMonth')}: <span className="money">{money(rows.reduce((s, r) => s + r.mPaid, 0), 0)}</span></>}
    actions={<><button className="btn" onClick={() => openAdvance({})}><Icon name="coins" /> {t('giveAdvance')}</button>
      <button className="btn" onClick={() => openWage({})}><Icon name="cash" /> {t('payWage')}</button>
      <button className="btn btn-gold" onClick={() => openWorker()}><Icon name="plus" /> {t('newWorker')}</button></>}>
    {rows.length ? <div className="table-wrap"><table className="t"><thead><tr><th>{t('worker')}</th><th>{t('phone')}</th><th>{t('wageRate')}</th>
      <th className="r">{t('daysThisMonth')}</th><th className="r">{t('paidThisMonth')}</th><th className="r">{t('advanceBalance')}</th><th></th></tr></thead><tbody>
      {rows.map(({ w, a, mDays, mPaid }) => <tr key={w.id} style={{ cursor: 'pointer', opacity: w.active === false ? .5 : 1 }} onClick={e => { if (!e.target.closest('button')) go('/worker/' + w.id); }}>
        <td><b>{w.name}</b>{w.job && <span className="muted"> · {w.job}</span>}</td><td className="num">{w.phone}</td>
        <td><span className="money">{money(w.rate, 0)}</span> / {per(w)}</td><td className="r num">{mDays || ''}</td><td className="r money">{money(mPaid, 0)}</td>
        <td className={'r money ' + (a.advBalance > 0 ? 'neg' : '')}>{a.advBalance ? money(a.advBalance, 0) : '—'}</td>
        <td className="r"><button className="btn btn-sm" onClick={() => openWage({ workerId: w.id })}>{t('payWage')}</button></td></tr>)}
    </tbody></table></div> : <Empty icon="hardhat" text={t('noWorkers')} />}
  </Page>;
}

export function Worker() {
  const { id } = useParams();
  const w = MG.getWorker(id);
  if (!w) return <Navigate to="/workers" replace />;
  const a = MG.workerAccount(w.id);
  return <Page back={<Link to="/workers" className="back"><Icon name="back" /> {t('workers')}</Link>} title={w.name}
    sub={<>{w.job} · <span className="money">{money(w.rate, 0)}</span> / {per(w)}</>}
    actions={<><button className="btn" onClick={() => openWorker(w)}><Icon name="edit" /> {t('edit')}</button>
      <button className="btn" onClick={() => openAdvance({ workerId: w.id })}><Icon name="coins" /> {t('giveAdvance')}</button>
      <button className="btn btn-gold" onClick={() => openWage({ workerId: w.id })}><Icon name="cash" /> {t('payWage')}</button></>}>
    <div className="kpis">
      <Kpi hl icon="cash" label={t('totalEarned')} value={money(a.earned, 0)} sub={`${a.days} ${t('days')}`} />
      <Kpi icon="coins" label={t('advancesGiven')} value={money(a.advances, 0)} />
      <Kpi icon="check" label={t('advancesDeducted')} value={money(a.deducted, 0)} />
      <Kpi icon="clock" label={t('advanceBalance')} value={<span className={a.advBalance > 0 ? 'neg' : ''}>{money(a.advBalance, 0)}</span>} />
    </div>
    <div className="card"><div className="card-h"><h3>{t('payHistory')}</h3></div><PayrollTable list={a.rows} /></div>
  </Page>;
}
