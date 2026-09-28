import { Link, useParams, Navigate } from 'react-router-dom';
import { MG, t } from '../lib/index.js';
import { Icon, Page, Kpi, Empty, confirmBox, guardDate, go } from '../components/ui.jsx';
import { ExpenseTable, StatementTable } from '../components/tables.jsx';
import { openExpense, openSupplierPay } from '../forms/money.jsx';
import { openSupplier } from '../forms/parties.jsx';

const money = (v, d) => MG.money(v, d);

export function Suppliers() {
  const rows = MG.db.suppliers.map(s => ({ s, a: MG.supplierAccount(s.id) })).sort((x, y) => y.a.balance - x.a.balance);
  const owed = rows.reduce((s, r) => s + Math.max(0, r.a.balance), 0);
  return <Page title={t('suppliers')} sub={<>{t('weOwe')}: <span className="money">{money(owed, 0)}</span></>}
    actions={<><button className="btn" onClick={() => openSupplierPay({})}><Icon name="cash" /> {t('paySupplier')}</button>
      <button className="btn" onClick={() => openExpense({ category: 'material', paid: false })}><Icon name="box" /> {t('recordPurchase')}</button>
      <button className="btn btn-gold" onClick={() => openSupplier()}><Icon name="plus" /> {t('newSupplier')}</button></>}>
    {rows.length ? <div className="table-wrap"><table className="t"><thead><tr><th>{t('supplier')}</th><th>{t('phone')}</th><th className="r">{t('purchasesCredit')}</th>
      <th className="r">{t('purchasesCash')}</th><th className="r">{t('paid')}</th><th className="r">{t('weOwe')}</th></tr></thead><tbody>
      {rows.map(({ s, a }) => <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => go('/supplier/' + s.id)}><td><b>{s.name}</b>{s.kind && <span className="muted"> · {s.kind}</span>}</td>
        <td className="num">{s.phone}</td><td className="r money">{money(a.purchased, 0)}</td><td className="r money">{money(a.cashPurchases, 0)}</td><td className="r money">{money(a.paid, 0)}</td>
        <td className="r money"><b className={a.balance > 0.5 ? 'neg' : ''}>{money(a.balance, 0)}</b></td></tr>)}
    </tbody></table></div> : <Empty icon="truck" text={t('noSuppliers')} />}
  </Page>;
}

export function Supplier() {
  const { id } = useParams();
  const s = MG.getSupplier(id);
  if (!s) return <Navigate to="/suppliers" replace />;
  const a = MG.supplierAccount(s.id);
  const L = MG.ledger('ap', '', '', { t: 'supplier', id: s.id });
  const by = (x, y) => x.date < y.date ? 1 : -1;
  const purchases = MG.db.expenses.filter(x => x.supplierId === s.id).sort(by);
  const pays = MG.db.supPayments.filter(x => x.supplierId === s.id).sort(by);
  const delPay = x => { if (!guardDate(x.date)) return; confirmBox(t('confirmDelete'), () => { MG.db.supPayments = MG.db.supPayments.filter(y => y !== x); MG.log('supplier.pay.delete', money(x.amount)); MG.save(); }); };
  return <Page back={<Link to="/suppliers" className="back"><Icon name="back" /> {t('suppliers')}</Link>} title={s.name}
    sub={<>{s.kind}{s.phone && <> · <a className="num" href={'tel:' + s.phone}>{s.phone}</a></>}</>}
    actions={<><button className="btn" onClick={() => openSupplier(s)}><Icon name="edit" /> {t('edit')}</button>
      <button className="btn" onClick={() => openExpense({ supplierId: s.id, category: 'material', paid: false })}><Icon name="box" /> {t('recordPurchase')}</button>
      <button className="btn btn-gold" onClick={() => openSupplierPay({ supplierId: s.id })}><Icon name="cash" /> {t('paySupplier')}</button></>}>
    <div className="kpis">
      <Kpi hl icon="box" label={t('purchasesCredit')} value={money(a.purchased, 0)} />
      <Kpi icon="cash" label={t('purchasesCash')} value={money(a.cashPurchases, 0)} />
      <Kpi icon="coins" label={t('paid')} value={money(a.paid, 0)} />
      <Kpi icon="clock" label={t('weOwe')} value={<span className={a.balance > 0.5 ? 'neg' : 'pos'}>{money(a.balance, 0)}</span>} />
    </div>
    <div className="card" style={{ marginBottom: 18 }}><div className="card-h"><h3>{t('statement')}</h3></div>
      <StatementTable rows={L.rows} opening={L.opening} debitLabel={t('paid')} creditLabel={t('purchasesCredit')} /></div>
    <div className="two-col">
      <div className="card"><div className="card-h"><h3>{t('purchases')}</h3></div><ExpenseTable list={purchases} showProject /></div>
      <div className="card"><div className="card-h"><h3>{t('payments')}</h3></div>
        {pays.length ? <div className="table-wrap"><table className="t"><thead><tr><th>{t('date')}</th><th>{t('cashAccount')}</th><th>{t('notes')}</th><th className="r">{t('amount')}</th><th></th></tr></thead><tbody>
          {pays.map(x => <tr key={x.id}><td className="num">{x.date}</td><td>{MG.nm((MG.getAccount(x.accountId) || {}).name || '')}</td><td>{x.note}</td><td className="r money">{money(x.amount)}</td>
            <td className="r">{MG.can('delete') && <button className="btn btn-ghost btn-sm btn-icon btn-danger" onClick={() => delPay(x)}><Icon name="trash" /></button>}</td></tr>)}
        </tbody></table></div> : <p className="muted">—</p>}</div>
    </div>
  </Page>;
}
