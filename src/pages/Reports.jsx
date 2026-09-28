import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MG, t } from '../lib/index.js';
import { Icon, Page, Seg, Select, Totals, SecTag, StTag, PayTag, printDoc, DocHeader, go } from '../components/ui.jsx';
import { TrendChart, SectionSplit, IncomeStatement } from '../components/tables.jsx';

const money = (v, d) => MG.money(v, d);
const saved = { mode: 'monthly', year: new Date().getFullYear(), month: new Date().getMonth() };
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);

export default function Reports() {
  const [rs, setRs] = useState(saved);
  const up = (k, v) => { saved[k] = v; setRs({ ...saved }); };
  const years = new Set([new Date().getFullYear()]);
  MG.journal().forEach(e => e.date && e.date > '2000' && years.add(+e.date.slice(0, 4)));
  MG.db.projects.forEach(p => p.date && years.add(+p.date.slice(0, 4)));
  const from = rs.mode === 'monthly' ? new Date(rs.year, rs.month, 1) : new Date(rs.year, 0, 1);
  const to = rs.mode === 'monthly' ? new Date(rs.year, rs.month + 1, 1) : new Date(rs.year + 1, 0, 1);
  const st = MG.periodStats(from, to);
  const title = rs.mode === 'monthly' ? MG.monthNames()[rs.month] + ' ' + rs.year : String(rs.year);
  const catMax = Math.max(1, ...Object.values(st.cats));
  const contracted = st.projects.filter(x => x.p.status !== 'quote');
  const [a, b] = [MG.iso(from), MG.iso(to)];

  const print = () => printDoc(<div className="q"><DocHeader title={t('reports')} date={t(rs.mode) + ' · ' + title} />
    <table><tbody>
      <tr><td>{t('sales')}</td><td className="r money">{money(st.sales)}</td><td>{t('alu')}</td><td className="r money">{money(st.sec.alu)}</td></tr>
      <tr><td>{t('collected')}</td><td className="r money">{money(st.collected)}</td><td>{t('iron')}</td><td className="r money">{money(st.sec.iron)}</td></tr>
      <tr><td>{t('cashIn')}</td><td className="r money">{money(st.cashIn)}</td><td>{t('cashOut')}</td><td className="r money">{money(st.cashOut)}</td></tr>
      <tr><td>{t('pipeline')}</td><td className="r money">{money(st.pipeline)}</td><td><b>{t('netProfit')}</b></td><td className="r money"><b>{money(st.net)}</b></td></tr>
    </tbody></table>
    <h3 style={{ margin: '22px 0 8px' }}>{t('incomeStatement')}</h3><IncomeStatement from={a} to={b} />
    <h3 style={{ margin: '22px 0 8px' }}>{t('projectsInPeriod')}</h3>
    <table><thead><tr><th>{t('code')}</th><th>{t('project')}</th><th>{t('client')}</th><th>{t('status')}</th><th className="r">{t('total')}</th><th className="r">{t('paid')}</th><th className="r">{t('balance')}</th></tr></thead>
      <tbody>{st.projects.map(({ p, T }) => <tr key={p.id}><td className="num">{p.code}</td><td>{p.name}</td><td>{MG.clientName(p)}</td><td>{t('st_' + p.status)}</td>
        <td className="r money">{money(T.total)}</td><td className="r money">{money(T.paid)}</td><td className="r money">{money(T.balance)}</td></tr>)}</tbody></table></div>);

  const csv = () => {
    const rows = [['code', 'project', 'client', 'section', 'status', 'date', 'total', 'paid', 'balance', 'est_cost', 'actual_cost', 'profit']];
    st.projects.forEach(({ p, T }) => rows.push([p.code, p.name, MG.clientName(p), p.section, p.status, p.date, T.total.toFixed(2), T.paid.toFixed(2), T.balance.toFixed(2), T.estCost.toFixed(2), T.actual.toFixed(2), T.profit.toFixed(2)]));
    rows.push([], ['sales', st.sales.toFixed(2)], ['other_income', st.otherIncome.toFixed(2)], ['cogs', st.cogs.toFixed(2)], ['opex', st.opex.toFixed(2)], ['net_profit', st.net.toFixed(2)],
      ['collected', st.collected.toFixed(2)], ['cash_in', st.cashIn.toFixed(2)], ['cash_out', st.cashOut.toFixed(2)], []);
    Object.entries(st.cats).forEach(([k, v]) => rows.push(['expense', MG.nm(MG.getCategory(k).name), v.toFixed(2)]));
    MG.downloadCsv('majed-report-' + (rs.mode === 'monthly' ? rs.year + '-' + String(rs.month + 1).padStart(2, '0') : rs.year) + '.csv', rows);
  };

  return <Page title={t('reports')} sub={title} actions={<>
    <Seg value={rs.mode} onChange={v => up('mode', v)} options={[['monthly', t('monthly')], ['yearly', t('yearly')]]} />
    {rs.mode === 'monthly' && <Select style={{ width: 'auto' }} value={rs.month} onChange={e => up('month', +e.target.value)} options={MG.monthNames().map((n, i) => [i, n])} />}
    <Select style={{ width: 'auto' }} value={rs.year} onChange={e => up('year', +e.target.value)} options={[...years].sort((x, y) => y - x).map(y => [y, y])} />
    <button className="btn" onClick={csv}><Icon name="download" /> {t('exportCsv')}</button>
    <button className="btn btn-gold" onClick={print}><Icon name="print" /> {t('print')}</button></>}>
    <div className="kpis">
      <div className="kpi hl"><div className="kpi-l"><Icon name="trend" />{t('sales')}</div><div className="kpi-v money">{money(st.sales, 0)}</div>
        <div className="kpi-s">{st.count} {t('projects')} · {t('avgProject')} <span className="money">{money(st.count ? st.sales / st.count : 0, 0)}</span></div></div>
      <div className="kpi"><div className="kpi-l"><Icon name="coins" />{t('collected')}</div><div className="kpi-v money">{money(st.collected, 0)}</div>
        <div className="kpi-s">{t('pipeline')}: <span className="money">{money(st.pipeline, 0)}</span> ({st.quotes})</div></div>
      <div className="kpi"><div className="kpi-l"><Icon name="wallet" />{t('expensesT')}</div><div className="kpi-v money">{money(st.expenses, 0)}</div>
        <div className="kpi-s">{t('netCash')}: <span className={'money ' + (st.cashIn - st.cashOut >= 0 ? 'pos' : 'neg')}>{money(st.cashIn - st.cashOut, 0)}</span></div></div>
      <div className="kpi"><div className="kpi-l"><Icon name="chart" />{t('netProfit')}</div><div className={'kpi-v money ' + (st.net >= 0 ? 'pos' : 'neg')}>{money(st.net, 0)}</div>
        <div className="kpi-s">{t('margin2')}: {st.sales ? Math.round(st.net / st.sales * 100) : 0}% · {t('grossProfitAcc')} <span className="money">{money(st.gross, 0)}</span></div></div>
    </div>
    <div className="two-col" style={{ marginBottom: 18 }}>
      <div className="cards">
        <div className="card"><div className="card-h"><h3>{t('monthlyTrend')} · {rs.year}</h3></div><TrendChart year={rs.year} hlMonth={rs.mode === 'monthly' ? rs.month : null} /></div>
        <div className="card"><div className="card-h"><h3>{t('incomeStatement')}</h3>{MG.can('accounting') && <Link className="btn btn-sm btn-ghost" to="/accounting/pl">{t('accounting')}</Link>}</div><IncomeStatement from={a} to={b} /></div>
      </div>
      <div className="cards">
        <div className="card"><div className="card-h"><h3>{t('bySection')}</h3></div><SectionSplit st={st} /></div>
        <div className="card"><div className="card-h"><h3>{t('expensesByCat')}</h3></div>
          {Object.keys(st.cats).length ? <div className="bd">{Object.entries(st.cats).sort((x, y) => y[1] - x[1]).map(([k, v]) =>
            <div className="bd-row" key={k}><span>{MG.nm(MG.getCategory(k).name)}</span><div className="bd-bar"><i style={{ width: Math.max(0, v) / catMax * 100 + '%', background: 'var(--iron)' }} /></div><span className="money">{money(v, 0)}</span></div>)}</div>
            : <p className="muted">—</p>}</div>
        <div className="card"><div className="card-h"><h3>{t('cashFlow')}</h3></div>
          <Totals rows={[[t('cashIn'), money(st.cashIn), 'pos'], [t('cashOut'), money(st.cashOut), 'neg']]} big={[t('netCash'), money(st.cashIn - st.cashOut)]} /></div>
      </div>
    </div>
    <div className="card"><div className="card-h"><h3>{t('projectsInPeriod')}</h3></div>
      {st.projects.length ? <div className="table-wrap"><table className="t"><thead><tr><th>{t('code')}</th><th>{t('project')}</th><th>{t('client')}</th><th>{t('section')}</th><th>{t('status')}</th>
        <th className="r">{t('total')}</th><th className="r">{t('paid')}</th><th className="r">{t('balance')}</th><th className="r">{t('profit')}</th></tr></thead><tbody>
        {st.projects.map(({ p, T }) => <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => go('/project/' + p.id)}><td className="num">{p.code}</td><td>{p.name}</td><td>{MG.clientName(p)}</td>
          <td><SecTag s={p.section} /></td><td><StTag s={p.status} /> <PayTag s={MG.payStatus(p, T)} /></td>
          <td className="r money">{money(T.total, 0)}</td><td className="r money">{money(T.paid, 0)}</td><td className="r money">{money(T.balance, 0)}</td><td className={'r money ' + (T.profit >= 0 ? 'pos' : 'neg')}>{money(T.profit, 0)}</td></tr>)}
      </tbody><tfoot><tr><td colSpan={5}>{t('total')} ({t('st_active')} + {t('st_done')})</td>
        <td className="r money">{money(sum(contracted, x => x.T.total), 0)}</td><td className="r money">{money(sum(contracted, x => x.T.paid), 0)}</td>
        <td className="r money">{money(sum(contracted, x => x.T.balance), 0)}</td><td className="r money">{money(sum(contracted, x => x.T.profit), 0)}</td></tr></tfoot></table></div>
        : <p className="muted">—</p>}
    </div>
  </Page>;
}
