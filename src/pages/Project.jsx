/* Project workspace: items (pricing + drawings), cut list, money, sketches, quotation */
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { MG, t } from '../lib/index.js';
import { Icon, Svg, Kpi, Page, Tabs, SecTag, StTag, PayTag, Field, Input, Select, Totals, Empty, openModal, Modal, confirmBox, toast, guardDate, canEditInvoice, printDoc } from '../components/ui.jsx';
import { PaymentTable, ExpenseTable, PayrollTable, CutList, QuoteDoc } from '../components/tables.jsx';
import { openItemEditor } from '../forms/ItemEditor.jsx';
import { openProjectForm } from '../forms/ProjectForm.jsx';
import { openPayment, openExpense } from '../forms/money.jsx';

const money = (v, d) => MG.money(v, d);

export default function Project() {
  const { id, tab: tabParam } = useParams();
  const nav = useNavigate();
  const p = MG.getProject(id);
  if (!p) return <Navigate to="/projects" replace />;
  const T = MG.projectTotals(p);
  const canP = MG.can('view.prices'), canC = MG.can('view.costs'), canE = MG.can('projects.edit');
  const pays = MG.db.payments.filter(x => x.projectId === p.id).length;
  const costs = MG.db.expenses.filter(x => x.projectId === p.id).length + MG.db.payroll.filter(x => x.projectId === p.id).length;
  const tabs = [['items', 'grid', t('items'), p.items.length], ['cut', 'scissors', t('cutList')]];
  if (canP && (MG.can('payments.receive') || MG.can('expenses'))) tabs.push(['finance', 'cash', t('payments'), pays + (canC ? costs : 0)]);
  tabs.push(['sketches', 'pen', t('sketches'), (p.sketches || []).length]);
  if (canP) tabs.push(['quote', 'print', t('quote')]);
  const tab = tabs.some(x => x[0] === tabParam) ? tabParam : 'items';
  const client = MG.clientName(p);

  const setStatus = e => {
    const inv = s => s === 'active' || s === 'done';
    if ((inv(p.status) || inv(e.target.value)) && !guardDate(p.date)) return;
    MG.log('project.status', p.code + ': ' + p.status + ' → ' + e.target.value);
    p.status = e.target.value; MG.save();
  };
  const del = () => {
    if (MG.projectHasMoney(p.id)) return toast(t('cantDeleteMoney'), 'err');
    confirmBox(t('confirmDelete'), () => { MG.deleteProject(p.id); MG.log('project.delete', p.code); MG.save(); toast(t('deleted')); nav('/projects'); });
  };

  return <Page back={<Link to="/projects" className="back"><Icon name="back" /> {t('projects')}</Link>}
    title={<span style={{ display: 'inline-flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>{p.name || client || p.code} <SecTag s={p.section} /><StTag s={p.status} /></span>}
    sub={<div className="phead-meta" style={{ marginTop: 6 }}>
      <span className="num">#{p.code}</span>
      {client && <span><Icon name="user" />{p.customerId && MG.can('customers') ? <Link to={'/customer/' + p.customerId}>{client}</Link> : client}</span>}
      {p.phone && <span><Icon name="phone" /><a href={'tel:' + p.phone} className="num">{p.phone}</a></span>}
      {p.location && <span><Icon name="map" />{p.location}</span>}
      <span><Icon name="cal" /><span className="num">{p.date}</span>{p.dueDate && <> → <span className="num">{p.dueDate}</span></>}</span></div>}
    actions={<>
      {canE && <Select style={{ width: 'auto' }} value={p.status} onChange={setStatus} options={MG.statuses.map(s => [s, t('st_' + s)])} />}
      {canE && <button className="btn" onClick={() => openProjectForm(p)}><Icon name="edit" /> {t('edit')}</button>}
      {MG.can('delete') && <button className="btn btn-icon btn-danger" title={t('delete')} onClick={del}><Icon name="trash" /></button>}</>}>
    {canP && <div className="kpis">
      <Kpi hl icon="coins" label={t('grandTotal')} value={money(T.total, 0)} sub={canC ? <>{t('estCost')}: <span className="money">{money(T.estCost, 0)}</span></> : <PayTag s={MG.payStatus(p, T)} />} />
      <Kpi icon="cash" label={t('paid')} value={money(T.paid, 0)} sub={<>{T.total ? Math.round(T.paid / T.total * 100) : 0}% {canC && <PayTag s={MG.payStatus(p, T)} />}</>} />
      <Kpi icon="clock" label={t('balance')} value={<span className={T.balance > 0.5 ? '' : 'pos'}>{money(T.balance, 0)}</span>}
        sub={canC ? <>{t('actualCost')}: <span className="money">{money(T.actual, 0)}</span></> : (p.dueDate ? t('dueDate') + ' ' + p.dueDate : '')} />
      {canC && <Kpi icon="trend" label={t('profit')} value={<span className={T.profit >= 0 ? 'pos' : 'neg'}>{money(T.profit, 0)}</span>} sub={t('margin2') + ': ' + (T.net > 0 ? Math.round(T.profit / T.net * 100) : 0) + '%'} />}
    </div>}
    <Tabs tabs={tabs} value={tab} onChange={k => nav('/project/' + p.id + '/' + k)} />
    {tab === 'items' && <ItemsTab p={p} T={T} />}
    {tab === 'cut' && <><div className="card-h"><h3>{t('cutList')}</h3><button className="btn btn-sm" onClick={() => printDoc(<div className="q"><CutList items={p.items} plain /></div>)}><Icon name="print" /> {t('print')}</button></div><CutList items={p.items} /></>}
    {tab === 'finance' && <FinanceTab p={p} T={T} />}
    {tab === 'sketches' && <SketchesTab p={p} />}
    {tab === 'quote' && <><div className="card-h"><h3>{t('quote')}</h3><button className="btn btn-gold" onClick={() => printDoc(<QuoteDoc p={p} />)}><Icon name="print" /> {t('print')} / PDF</button></div>
      <div style={{ background: '#fff', borderRadius: 16, padding: 'clamp(14px,3vw,36px)', overflowX: 'auto', boxShadow: 'var(--shadow)' }}><QuoteDoc p={p} /></div></>}
  </Page>;
}

function ItemsTab({ p, T }) {
  const canP = MG.can('view.prices'), canE = MG.can('projects.edit') && canP;
  const dup = it => { if (!canEditInvoice(p)) return; const i = p.items.indexOf(it); p.items.splice(i + 1, 0, { ...JSON.parse(JSON.stringify(it)), id: MG.uid() }); MG.save(); };
  const remove = it => canEditInvoice(p) && confirmBox(t('confirmDelete'), () => { p.items = p.items.filter(x => x !== it); MG.save(); });
  const setNum = k => e => { if (!canEditInvoice(p)) return; p[k] = parseFloat(e.target.value) || 0; MG.log('project.edit', p.code + ' ' + k + '=' + p[k]); MG.save(); };
  return <div className="two-col">
    <div>
      <div className="card-h"><h3>{t('items')}</h3>{canE && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className={'btn btn-sm ' + (p.section !== 'iron' ? 'btn-gold' : '')} onClick={() => openItemEditor(p, 'alu')}><Icon name="plus" /> {t('alu')}</button>
        <button className={'btn btn-sm ' + (p.section === 'iron' ? 'btn-gold' : '')} onClick={() => openItemEditor(p, 'iron')}><Icon name="plus" /> {t('iron')}</button></div>}</div>
      {p.items.length ? <div className="items">{p.items.map((it, i) => {
        const c = T.rows[i], dims = MG.itemDims(it);
        return <div className="item-card" key={it.id}>
          <Svg className="item-draw" html={MG.drawItem(it)} onClick={() => canE && openItemEditor(p, it.section, it)} />
          <div className="item-body">
            <div className="item-top"><div className="item-t">{MG.itemTitle(it)}</div><SecTag s={it.section} /></div>
            <div className="item-meta">{t('t_' + it.type)} · <span className="num">{dims}</span>{dims ? ' ' + t('cm') : ''} · {t('qty')} <span className="num">{c.qty}</span></div>
            {canP && <div className="item-meta">{t('unitPrice')}: <span className="money">{money(c.unitPrice, 0)}</span>{MG.can('view.costs') && <> · {t('cost')}: <span className="money">{money(c.unitCost, 0)}</span></>}</div>}
          </div>
          {canP && <div className="item-foot"><div className="item-price money">{money(c.total, 0)}</div>{canE && <div>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => dup(it)}><Icon name="copy" /></button>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openItemEditor(p, it.section, it)}><Icon name="edit" /></button>
            <button className="btn btn-ghost btn-sm btn-icon btn-danger" onClick={() => remove(it)}><Icon name="trash" /></button></div>}</div>}
        </div>;
      })}</div> : <Empty icon="ruler" text={t('noItems')} />}
    </div>
    {canP && <div><div className="card" style={{ position: 'sticky', top: 20 }}>
      <div className="card-h"><h3>{t('total')}</h3></div>
      <div className="grid g3" style={{ marginBottom: 16 }}>
        {['margin', 'discount', 'vat'].map(k => <Field key={k + p[k]} label={t(k)}><input className="input" type="number" step="any" inputMode="decimal" defaultValue={p[k]} readOnly={!canE} onBlur={canE ? setNum(k) : undefined} /></Field>)}
      </div>
      <Totals rows={[MG.can('view.costs') && [t('estCost'), money(T.estCost)], [t('subtotal'), money(T.subtotal)],
        T.discount ? [t('discount'), '-' + money(T.discount)] : null, T.vatAmt ? [t('vat'), money(T.vatAmt)] : null,
        T.weight ? [t('weight'), MG.fmt(T.weight, 1) + ' kg'] : null]} big={[t('grandTotal'), money(T.total)]} />
      <Link className="btn btn-block" style={{ marginTop: 16 }} to={'/project/' + p.id + '/quote'}><Icon name="print" /> {t('quote')}</Link>
    </div></div>}
  </div>;
}

function FinanceTab({ p, T }) {
  const by = (a, b) => a.date < b.date ? 1 : -1;
  const pays = MG.db.payments.filter(x => x.projectId === p.id).sort(by);
  const exps = MG.db.expenses.filter(x => x.projectId === p.id).sort(by);
  const wages = MG.db.payroll.filter(x => x.projectId === p.id && x.type !== 'advance');
  const canC = MG.can('view.costs');
  return <div className="two-col">
    <div className="cards">
      <div className="card"><div className="card-h"><h3>{t('payments')}</h3>{MG.can('payments.receive') && <button className="btn btn-sm btn-gold" onClick={() => openPayment({ project: p })}><Icon name="plus" /> {t('addPayment')}</button>}</div>
        <PaymentTable list={pays} showProject={false} /></div>
      {MG.can('expenses') && <div className="card"><div className="card-h"><h3>{t('projectCosts')}</h3><button className="btn btn-sm" onClick={() => openExpense({ projectId: p.id })}><Icon name="plus" /> {t('addExpense')}</button></div>
        <ExpenseTable list={exps} />
        {wages.length > 0 && <><h4 style={{ margin: '18px 0 10px' }}>{t('wagesOnProject')}</h4><PayrollTable list={wages} showWorker /></>}</div>}
    </div>
    <div><div className="card">
      <div className="card-h"><h3>{t('projectAccount')}</h3><PayTag s={MG.payStatus(p, T)} /></div>
      <Totals rows={[[t('grandTotal'), money(T.total)], [t('paid'), money(T.paid), 'pos'], [t('balance'), money(T.balance)],
        canC && [t('estCost'), money(T.estCost)], canC && [t('actualCost'), money(T.actual)]]}
        big={canC && [t('profit'), money(T.profit), T.profit >= 0 ? 'pos' : 'neg']} />
      {canC && <p className="muted" style={{ fontSize: 12.5, margin: '12px 0 0' }}>{t('profitHint')}</p>}
    </div></div>
  </div>;
}

function SketchesTab({ p }) {
  const sk = p.sketches || [];
  const view = s => openModal(close => <Modal wide title={p.name} onClose={close}><img src={s.data} alt="" style={{ width: '100%', background: '#fff', borderRadius: 12 }} /></Modal>);
  const remove = s => confirmBox(t('confirmDelete'), () => { p.sketches = p.sketches.filter(x => x !== s); MG.save(); });
  return <>
    <div className="card-h"><h3>{t('sketches')}</h3><Link className="btn btn-sm btn-gold" to={'/sketch/' + p.id}><Icon name="pen" /> {t('newSketch')}</Link></div>
    {sk.length ? <div className="sketch-grid">{sk.map(s => <div className="sketch-card" key={s.id}><img src={s.data} alt="" onClick={() => view(s)} />
      <div className="f"><span>{s.name} <span className="muted num">{s.date}</span></span>
        <span><a className="btn btn-ghost btn-sm btn-icon" download={(s.name || 'sketch') + '.png'} href={s.data}><Icon name="download" /></a>
          <button className="btn btn-ghost btn-sm btn-icon btn-danger" onClick={() => remove(s)}><Icon name="trash" /></button></span></div></div>)}</div>
      : <Empty icon="pen" text={t('noSketches')} />}
  </>;
}
