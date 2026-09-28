/* Money forms: customer receipts, expenses, fixed costs, supplier payments, wages, advances, transfers, owner */
import { useState } from 'react';
import { MG, t } from '../lib/index.js';
import { Icon, Modal, Field, Input, Select, Seg, MoneyInput, useForm, openModal, toast, guardDate, printDoc, DocHeader } from '../components/ui.jsx';

const N = v => parseFloat(v) || 0;
const money = (v, d) => MG.money(v, d);
const Foot = ({ close, save, extra }) => <>{extra}<button className="btn" onClick={close}>{t('cancel')}</button><button className="btn btn-gold" onClick={save}>{t('save')}</button></>;

/* ============ Customer receipt ============ */
export const openPayment = opts => openModal(close => <PaymentForm opts={opts || {}} close={close} />);

function PaymentForm({ opts, close }) {
  const p0 = opts.project, c0 = opts.customer || (p0 && MG.getCustomer(p0.customerId));
  const custOpts = MG.db.customers.map(c => [c.id, c.name]);
  const cid0 = c0 ? c0.id : (custOpts[0] || [''])[0];
  const balOf = (cid, pid) => { const p = pid && MG.getProject(pid); return p ? MG.projectTotals(p).balance : cid ? MG.customerAccount(cid).balance : 0; };
  const round = b => b > 0 ? String(Math.round(b * 100) / 100) : '';
  const [v, set, setV] = useForm({ customerId: cid0, projectId: p0 ? p0.id : '', amount: round(balOf(cid0, p0 && p0.id)), cur: 'USD', date: MG.today(), accountId: MG.db.accounts[0].id, method: 'cash', note: '' });
  if (!cid0 && !p0) { setTimeout(() => { close(); toast(t('addCustomerFirst'), 'err'); }); return null; }
  const projOpts = [['', t('onAccount')]].concat(MG.db.projects.filter(p => p.customerId === v.customerId && p.status !== 'cancelled')
    .map(p => [p.id, `${p.code} — ${p.name || ''} (${t('balance')} ${money(MG.projectTotals(p).balance, 0)})`]));

  const save = print => {
    const amt = MG.readMoney(v.amount, v.cur);
    if (!(amt.usd > 0)) return toast(t('enterAmount'), 'err');
    if (!guardDate(v.date)) return;
    const p = MG.getProject(v.projectId);
    const x = { id: MG.uid(), customerId: p0 ? p0.customerId : v.customerId, projectId: p ? p.id : null, date: v.date || MG.today(), amount: amt.usd, orig: amt.orig, cur: amt.cur, rate: amt.rate,
      accountId: v.accountId, method: v.method, note: v.note, by: MG.user.username, no: (MG.db.seq.rc = (MG.db.seq.rc || 0) + 1) };
    MG.db.payments.push(x);
    if (p && p.status === 'quote') p.status = 'active';
    MG.log('payment.add', money(x.amount) + ' — ' + ((MG.getCustomer(x.customerId) || {}).name || ''));
    MG.save(); close(); toast(t('saved'));
    if (print) printReceipt(x);
  };
  return <Modal title={t('addPayment')} onClose={close}
    footer={<Foot close={close} save={() => save(false)} extra={<button className="btn" onClick={() => save(true)}><Icon name="print" /> {t('saveAndPrint')}</button>} />}>
    <div className="grid g2">
      <Field label={t('client')} className="span2"><Select value={v.customerId} disabled={!!p0} options={custOpts.length ? custOpts : [[cid0, c0 ? c0.name : '']]}
        onChange={e => { const cid = e.target.value; setV(s => ({ ...s, customerId: cid, projectId: '', amount: round(balOf(cid)) })); }} /></Field>
      <Field label={t('project')} className="span2"><Select value={v.projectId} options={projOpts}
        onChange={e => { const pid = e.target.value; setV(s => ({ ...s, projectId: pid, amount: round(balOf(s.customerId, pid)) })); }} /></Field>
      <Field label={t('amount')}><MoneyInput value={v.amount} cur={v.cur} onValue={set('amount')} onCur={set('cur')} /></Field>
      <Field label={t('date')}><Input type="date" value={v.date} onChange={set('date')} /></Field>
      <Field label={t('cashAccount')}><Select value={v.accountId} onChange={set('accountId')} options={MG.accountOpts()} /></Field>
      <Field label={t('method')}><Select value={v.method} onChange={set('method')} options={[['cash', t('cash')], ['transfer', t('transfer')], ['cheque', t('cheque')], ['whish', 'Whish / OMT']]} /></Field>
      <Field label={t('notes')} className="span2"><Input value={v.note} onChange={set('note')} /></Field>
    </div>
  </Modal>;
}

export function printReceipt(x) {
  const c = MG.getCustomer(x.customerId) || {}, p = x.projectId && MG.getProject(x.projectId), co = MG.db.settings.company;
  const acc = x.customerId ? MG.customerAccount(x.customerId) : null;
  const T = p && MG.projectTotals(p);
  printDoc(<div className="q">
    <DocHeader title={t('receiptTitle')} no={x.no ? 'RC-' + String(x.no).padStart(4, '0') : ''} date={x.date} />
    <div className="q-info"><div><b>{t('receivedFrom')}:</b>{c.name || ''}</div><div><b>{t('phone')}:</b><span className="num">{c.phone || ''}</span></div>
      <div><b>{t('project')}:</b>{p ? p.code + ' — ' + (p.name || '') : t('onAccount')}</div><div><b>{t('method')}:</b>{t(x.method || 'cash')}</div></div>
    <div style={{ border: '2px solid #b18a42', borderRadius: 12, padding: 18, textAlign: 'center', margin: '10px 0 18px' }}>
      <div style={{ color: '#6b6250' }}>{t('amountReceived')}</div>
      <div style={{ font: '800 30px Inter,sans-serif', color: '#7e5a20' }}>{money(x.amount)}</div>
      {x.cur === 'LBP' && <div className="num">{MG.fmt(x.orig, 0)} ل.ل @ {MG.fmt(x.rate, 0)}</div>}
      {x.note && <div style={{ marginTop: 6 }}>{x.note}</div>}</div>
    {T ? <div className="q-tot"><div><span>{t('grandTotal')}</span><span className="money">{money(T.total)}</span></div><div><span>{t('paid')}</span><span className="money">{money(T.paid)}</span></div><div className="g"><span>{t('balance')}</span><span className="money">{money(T.balance)}</span></div></div>
      : acc && <div className="q-tot"><div className="g"><span>{t('accountBalance')}</span><span className="money">{money(acc.balance)}</span></div></div>}
    <div className="q-foot"><div>{co.phone || ''}</div><div><div className="q-sign">{t('signature')} — {MG.lang === 'ar' ? co.nameAr || co.name : co.name}</div></div></div>
  </div>);
}

/* ============ Expense (also purchases from suppliers) ============ */
export const openExpense = ex => openModal(close => <ExpenseForm ex={ex || {}} close={close} />);

export function CatSelect({ value, onChange }) {
  const cats = MG.db.settings.categories;
  return <select className="input" value={value} onChange={onChange}>
    {['cogs', 'opex'].map(g => <optgroup key={g} label={t(g)}>{cats.filter(c => c.group === g).map(c => <option key={c.id} value={c.id}>{MG.nm(c.name)}</option>)}</optgroup>)}
  </select>;
}

function ExpenseForm({ ex, close }) {
  const isNew = !ex.id;
  const d = { date: MG.today(), category: 'material', amount: '', note: '', projectId: '', supplierId: '', accountId: MG.db.accounts[0].id, paid: true, ref: '', cur: 'USD', ...ex };
  if (!isNew && d.cur === 'LBP') d.amount = d.orig;
  const [v, set, setV] = useForm({ ...d, projectId: d.projectId || '', supplierId: d.supplierId || '' });
  const [sups, setSups] = useState(MG.db.suppliers.slice());
  const cat = MG.getCategory(v.category);
  const projOpts = [['', t('general')]].concat(MG.db.projects.filter(p => p.status !== 'cancelled' || p.id === d.projectId).map(p => [p.id, p.code + ' — ' + (p.name || MG.clientName(p))]));
  const onSup = e => {
    if (e.target.value !== '__new') return set('supplierId')(e);
    const name = window.prompt(t('newSupplier'));
    if (!name || !name.trim()) return;
    const s = { id: MG.uid(), name: name.trim(), phone: '', kind: '', notes: '', opening: 0, created: Date.now() };
    MG.db.suppliers.push(s); setSups(MG.db.suppliers.slice()); setV(x => ({ ...x, supplierId: s.id }));
  };
  const save = () => {
    const amt = MG.readMoney(v.amount, v.cur);
    if (!(amt.usd > 0)) return toast(t('enterAmount'), 'err');
    if (!v.paid && !v.supplierId) return toast(t('creditNeedsSupplier'), 'err');
    if (!guardDate(v.date) || (!isNew && !guardDate(ex.date))) return;
    const rec = { date: v.date || MG.today(), category: v.category, amount: amt.usd, orig: amt.orig, cur: amt.cur, rate: amt.rate, paid: v.paid,
      accountId: v.accountId, supplierId: v.supplierId || null, projectId: v.projectId || null, ref: v.ref, note: v.note };
    if (isNew) MG.db.expenses.push({ id: MG.uid(), by: MG.user.username, recurringId: ex.recurringId || null, ...rec });
    else Object.assign(MG.db.expenses.find(y => y.id === ex.id), rec);
    MG.log(isNew ? 'expense.add' : 'expense.edit', MG.nm(cat.name) + ' ' + money(amt.usd));
    MG.save(); close(); toast(t('saved'));
  };
  return <Modal title={(isNew ? t('addExpense') : t('edit')) + ' · ' + MG.nm(cat.name)} onClose={close} footer={<Foot close={close} save={save} />}>
    <div className="grid g2">
      <Field label={t('category')} className="span2"><CatSelect value={v.category} onChange={set('category')} /></Field>
      <Field label={t('amount')}><MoneyInput value={v.amount} cur={v.cur} onValue={set('amount')} onCur={set('cur')} /></Field>
      <Field label={t('date')}><Input type="date" value={v.date} onChange={set('date')} /></Field>
      <Seg style={{ display: 'flex' }} value={v.paid ? '1' : '0'} onChange={x => setV(s => ({ ...s, paid: x === '1' }))}
        options={[['1', <><Icon name="cash" /> {t('paidNow')}</>], ['0', <><Icon name="clock" /> {t('onCredit')}</>]]} />
      <span />
      {v.paid && <Field label={t('cashAccount')}><Select value={v.accountId} onChange={set('accountId')} options={MG.accountOpts()} /></Field>}
      <Field label={t('supplier')}><Select value={v.supplierId} onChange={onSup} options={[['', '—']].concat(sups.map(s => [s.id, s.name])).concat([['__new', t('newSupplier') + '…']])} /></Field>
      <Field label={t('project')} className="span2"><Select value={v.projectId} onChange={set('projectId')} options={projOpts} /></Field>
      <Field label={t('invoiceRef')}><Input value={v.ref} onChange={set('ref')} /></Field>
      <Field label={t('notes')}><Input value={v.note} onChange={set('note')} /></Field>
      {!v.paid && <p className="muted span2" style={{ fontSize: 12.5, margin: 0 }}>{t('creditHint')}</p>}
    </div>
  </Modal>;
}

/* ============ Fixed monthly costs ============ */
export const openRecurring = r => openModal(close => <RecurringForm r={r} close={close} />);
function RecurringForm({ r, close }) {
  const isNew = !r;
  const [v, set] = useForm(r ? { ...r } : { category: 'rent', amount: '', day: 1, accountId: MG.db.accounts[0].id, note: '', active: true });
  const save = () => {
    if (!(N(v.amount) > 0)) return toast(t('enterAmount'), 'err');
    const data = { ...v, amount: N(v.amount), day: Math.min(28, Math.max(1, N(v.day) || 1)) };
    if (isNew) MG.db.recurring.push({ id: MG.uid(), ...data }); else Object.assign(r, data);
    MG.save(); close(); toast(t('saved'));
  };
  const remove = () => { MG.db.recurring = MG.db.recurring.filter(x => x !== r); MG.save(); close(); };
  return <Modal title={t('fixedCost')} onClose={close}
    footer={<Foot close={close} save={save} extra={!isNew && <button className="btn btn-danger" style={{ marginInlineEnd: 'auto' }} onClick={remove}><Icon name="trash" /></button>} />}>
    <div className="grid g2">
      <Field label={t('category')} className="span2"><CatSelect value={v.category} onChange={set('category')} /></Field>
      <Field label={t('amount') + ' ($)'}><Input type="number" value={v.amount} onChange={set('amount')} /></Field>
      <Field label={t('dueDay')}><Input type="number" min="1" max="28" value={v.day} onChange={set('day')} /></Field>
      <Field label={t('cashAccount')}><Select value={v.accountId} onChange={set('accountId')} options={MG.accountOpts()} /></Field>
      <Field label={t('notes')}><Input value={v.note} onChange={set('note')} placeholder={MG.lang === 'ar' ? 'مثال: أجار المحل – صاحب الملك' : 'e.g. Shop rent – landlord'} /></Field>
      <label className="check span2"><input type="checkbox" checked={v.active !== false} onChange={set('active')} /> {t('activeWorker')}</label>
    </div>
  </Modal>;
}
export function recordRecurring(r) {
  const ym = MG.today().slice(0, 7), day = String(Math.min(28, Math.max(1, r.day || 1))).padStart(2, '0');
  const date = (ym + '-' + day) > MG.today() ? MG.today() : ym + '-' + day;
  openExpense({ category: r.category, amount: r.amount, accountId: r.accountId || MG.db.accounts[0].id, note: r.note, date, recurringId: r.id, supplierId: r.supplierId || '' });
}

/* ============ Supplier payment ============ */
export function openSupplierPay(opts) {
  if (!MG.db.suppliers.length) return toast(t('noSuppliers'), 'err');
  openModal(close => <SupplierPay opts={opts || {}} close={close} />);
}
function SupplierPay({ opts, close }) {
  const sid = opts.supplierId || MG.db.suppliers[0].id;
  const bal = id => { const b = MG.supplierAccount(id).balance; return b > 0 ? String(b) : ''; };
  const [v, set, setV] = useForm({ supplierId: sid, amount: bal(sid), cur: 'USD', date: MG.today(), accountId: MG.db.accounts[0].id, note: '' });
  const save = () => {
    const amt = MG.readMoney(v.amount, v.cur);
    if (!(amt.usd > 0)) return toast(t('enterAmount'), 'err');
    if (!guardDate(v.date)) return;
    MG.db.supPayments.push({ id: MG.uid(), supplierId: v.supplierId, date: v.date || MG.today(), amount: amt.usd, orig: amt.orig, cur: amt.cur, rate: amt.rate, accountId: v.accountId, note: v.note, by: MG.user.username });
    MG.log('supplier.pay', money(amt.usd) + ' — ' + MG.getSupplier(v.supplierId).name);
    MG.save(); close(); toast(t('saved'));
  };
  return <Modal title={t('paySupplier')} onClose={close} footer={<Foot close={close} save={save} />}>
    <div className="grid g2">
      <Field label={t('supplier')} className="span2"><Select value={v.supplierId} options={MG.db.suppliers.map(s => [s.id, s.name + ' — ' + money(MG.supplierAccount(s.id).balance, 0)])}
        onChange={e => { const id = e.target.value; setV(s => ({ ...s, supplierId: id, amount: bal(id) })); }} /></Field>
      <Field label={t('amount')}><MoneyInput value={v.amount} cur={v.cur} onValue={set('amount')} onCur={set('cur')} /></Field>
      <Field label={t('date')}><Input type="date" value={v.date} onChange={set('date')} /></Field>
      <Field label={t('cashAccount')}><Select value={v.accountId} onChange={set('accountId')} options={MG.accountOpts()} /></Field>
      <Field label={t('notes')}><Input value={v.note} onChange={set('note')} /></Field>
    </div>
  </Modal>;
}

/* ============ Wages & advances ============ */
export function openWage(opts) {
  if (!MG.workerOpts().length) return toast(t('noWorkers'), 'err');
  openModal(close => <WageForm opts={opts || {}} close={close} />);
}
function WageForm({ opts, close }) {
  const ws = MG.workerOpts();
  const init = wid => {
    const w = MG.getWorker(wid), a = MG.workerAccount(wid);
    return { deduct: a.advBalance > 0 ? String(a.advBalance) : '', amount: w.wageType === 'monthly' ? String(w.rate || '') : '', days: '' };
  };
  const wid0 = opts.workerId || ws[0][0];
  const [v, set, setV] = useForm({ workerId: wid0, cur: 'USD', date: MG.today(), projectId: opts.projectId || '', accountId: MG.db.accounts[0].id, note: '', ...init(wid0) });
  const w = MG.getWorker(v.workerId), a = MG.workerAccount(w.id);
  const gross = MG.readMoney(v.amount, v.cur).usd, ded = Math.min(N(v.deduct), gross);
  const projOpts = [['', t('generalWork')]].concat(MG.db.projects.filter(p => p.status === 'active' || p.status === 'quote').map(p => [p.id, p.code + ' — ' + (p.name || MG.clientName(p))]));
  const onDays = e => { const d = e.target.value; setV(s => ({ ...s, days: d, ...(w.wageType !== 'monthly' && N(d) ? { amount: String(N(d) * N(w.rate)), cur: 'USD' } : {}) })); };
  const save = () => {
    const amt = MG.readMoney(v.amount, v.cur);
    if (!(amt.usd > 0)) return toast(t('enterAmount'), 'err');
    if (!guardDate(v.date)) return;
    MG.db.payroll.push({ id: MG.uid(), type: 'wage', workerId: v.workerId, projectId: v.projectId || null, date: v.date || MG.today(), days: N(v.days),
      amount: amt.usd, orig: amt.orig, cur: amt.cur, rate: amt.rate, deduct: Math.min(N(v.deduct), amt.usd), accountId: v.accountId, note: v.note, by: MG.user.username });
    MG.log('wage.add', money(amt.usd) + ' — ' + w.name);
    MG.save(); close(); toast(t('saved'));
  };
  return <Modal title={t('payWage')} onClose={close} footer={<Foot close={close} save={save} />}>
    <div className="grid g2">
      <Field label={t('worker')} className="span2"><Select value={v.workerId} options={ws} onChange={e => { const id = e.target.value; setV(s => ({ ...s, workerId: id, ...init(id) })); }} /></Field>
      <Field label={t('days')}><Input type="number" min="0" step="0.5" value={v.days} onChange={onDays} /></Field>
      <Field label={t('amount')}><MoneyInput value={v.amount} cur={v.cur} onValue={set('amount')} onCur={set('cur')} /></Field>
      <Field label={t('deductAdvance')}><Input type="number" min="0" value={v.deduct} onChange={set('deduct')} /></Field>
      <Field label={t('date')}><Input type="date" value={v.date} onChange={set('date')} /></Field>
      <Field label={t('project')} className="span2"><Select value={v.projectId} onChange={set('projectId')} options={projOpts} /></Field>
      <Field label={t('cashAccount')}><Select value={v.accountId} onChange={set('accountId')} options={MG.accountOpts()} /></Field>
      <Field label={t('notes')}><Input value={v.note} onChange={set('note')} /></Field>
      <div className="span2 wage-sum"><div className="totals">
        <div className="trow"><span>{t('wageRate')}</span><span><span className="money">{money(w.rate, 0)}</span> / {t(w.wageType === 'monthly' ? 'perMonth' : 'perDay')}</span></div>
        {a.advBalance > 0 && <div className="trow"><span>{t('advanceBalance')}</span><span className="money neg">{money(a.advBalance)}</span></div>}
        <div className="trow"><span>{t('grossWage')}</span><span className="money">{money(gross)}</span></div>
        {ded > 0 && <div className="trow"><span>{t('deductAdvance')}</span><span className="money">-{money(ded)}</span></div>}
        <div className="trow big"><span>{t('netPaid')}</span><span className="money">{money(gross - ded)}</span></div>
      </div></div>
    </div>
  </Modal>;
}

export function openAdvance(opts) {
  if (!MG.workerOpts().length) return toast(t('noWorkers'), 'err');
  openModal(close => <AdvanceForm opts={opts || {}} close={close} />);
}
function AdvanceForm({ opts, close }) {
  const ws = MG.workerOpts();
  const [v, set] = useForm({ workerId: opts.workerId || ws[0][0], amount: '', cur: 'USD', date: MG.today(), accountId: MG.db.accounts[0].id, note: '' });
  const save = () => {
    const amt = MG.readMoney(v.amount, v.cur);
    if (!(amt.usd > 0)) return toast(t('enterAmount'), 'err');
    if (!guardDate(v.date)) return;
    MG.db.payroll.push({ id: MG.uid(), type: 'advance', workerId: v.workerId, date: v.date || MG.today(), amount: amt.usd, orig: amt.orig, cur: amt.cur, rate: amt.rate, accountId: v.accountId, note: v.note, by: MG.user.username });
    MG.log('advance.add', money(amt.usd) + ' — ' + MG.getWorker(v.workerId).name);
    MG.save(); close(); toast(t('saved'));
  };
  return <Modal title={t('giveAdvance')} onClose={close} footer={<Foot close={close} save={save} />}>
    <div className="grid g2">
      <Field label={t('worker')} className="span2"><Select value={v.workerId} onChange={set('workerId')} options={ws} /></Field>
      <Field label={t('amount')}><MoneyInput value={v.amount} cur={v.cur} onValue={set('amount')} onCur={set('cur')} /></Field>
      <Field label={t('date')}><Input type="date" value={v.date} onChange={set('date')} /></Field>
      <Field label={t('cashAccount')}><Select value={v.accountId} onChange={set('accountId')} options={MG.accountOpts()} /></Field>
      <Field label={t('notes')}><Input value={v.note} onChange={set('note')} /></Field>
    </div>
    <p className="muted" style={{ fontSize: 12.5 }}>{t('advanceHint')}</p>
  </Modal>;
}

/* ============ Treasury: transfers & owner ============ */
export function openTransfer() {
  if (MG.db.accounts.length < 2) return toast(t('needTwoAccounts'), 'err');
  openModal(close => <TransferForm close={close} />);
}
function TransferForm({ close }) {
  const opts = MG.accountOpts();
  const [v, set] = useForm({ from: opts[0][0], to: opts[1][0], amount: '', cur: 'USD', date: MG.today(), note: '' });
  const save = () => {
    const amt = MG.readMoney(v.amount, v.cur);
    if (!(amt.usd > 0) || v.from === v.to) return toast(t('enterAmount'), 'err');
    if (!guardDate(v.date)) return;
    MG.db.transfers.push({ id: MG.uid(), from: v.from, to: v.to, date: v.date || MG.today(), amount: amt.usd, orig: amt.orig, cur: amt.cur, rate: amt.rate, note: v.note, by: MG.user.username });
    MG.log('transfer.add', money(amt.usd)); MG.save(); close(); toast(t('saved'));
  };
  return <Modal title={t('transfer2')} onClose={close} footer={<Foot close={close} save={save} />}>
    <div className="grid g2">
      <Field label={t('fromAcc')}><Select value={v.from} onChange={set('from')} options={opts} /></Field>
      <Field label={t('toAcc')}><Select value={v.to} onChange={set('to')} options={opts} /></Field>
      <Field label={t('amount')}><MoneyInput value={v.amount} cur={v.cur} onValue={set('amount')} onCur={set('cur')} /></Field>
      <Field label={t('date')}><Input type="date" value={v.date} onChange={set('date')} /></Field>
      <Field label={t('notes')} className="span2"><Input value={v.note} onChange={set('note')} /></Field>
    </div>
  </Modal>;
}

export const openEquity = type => openModal(close => <EquityForm type={type} close={close} />);
function EquityForm({ type, close }) {
  const [v, set] = useForm({ type: type || 'drawing', amount: '', cur: 'USD', date: MG.today(), accountId: MG.db.accounts[0].id, note: '' });
  const save = () => {
    const amt = MG.readMoney(v.amount, v.cur);
    if (!(amt.usd > 0)) return toast(t('enterAmount'), 'err');
    if (!guardDate(v.date)) return;
    MG.db.equity.push({ id: MG.uid(), type: v.type, accountId: v.accountId, date: v.date || MG.today(), amount: amt.usd, orig: amt.orig, cur: amt.cur, rate: amt.rate, note: v.note, by: MG.user.username });
    MG.log('equity.' + v.type, money(amt.usd)); MG.save(); close(); toast(t('saved'));
  };
  return <Modal title={t('ownerEntry')} onClose={close} footer={<Foot close={close} save={save} />}>
    <div className="grid g2">
      <Field label={t('type')} className="span2"><Select value={v.type} onChange={set('type')} options={[['drawing', t('eq_drawing')], ['capital', t('eq_capital')], ['income', t('eq_income')]]} /></Field>
      <Field label={t('amount')}><MoneyInput value={v.amount} cur={v.cur} onValue={set('amount')} onCur={set('cur')} /></Field>
      <Field label={t('date')}><Input type="date" value={v.date} onChange={set('date')} /></Field>
      <Field label={t('cashAccount')}><Select value={v.accountId} onChange={set('accountId')} options={MG.accountOpts()} /></Field>
      <Field label={t('notes')}><Input value={v.note} onChange={set('note')} /></Field>
      <p className="muted span2" style={{ fontSize: 12.5, margin: 0 }}>{t('ownerHint')}</p>
    </div>
  </Modal>;
}
