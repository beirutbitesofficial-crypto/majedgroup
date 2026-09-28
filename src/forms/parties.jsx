/* Forms for people and accounts: customers, suppliers, workers, cash accounts, users */
import { MG, t } from '../lib/index.js';
import { Modal, Field, Input, Select, Check, useForm, openModal, toast, guardDate, go } from '../components/ui.jsx';

const N = v => parseFloat(v) || 0;
const Foot = ({ close, save }) => <><button className="btn" onClick={close}>{t('cancel')}</button><button className="btn btn-gold" onClick={save}>{t('save')}</button></>;

export const openCustomer = (c, onSaved) => openModal(close => <CustomerForm c={c} onSaved={onSaved} close={close} />);
function CustomerForm({ c, onSaved, close }) {
  const isNew = !c;
  const [v, set] = useForm(c ? { ...c } : { name: '', phone: '', address: '', notes: '', opening: '' });
  const save = () => {
    if (!v.name.trim()) return;
    if (MG.db.customers.some(x => x.name.trim().toLowerCase() === v.name.trim().toLowerCase() && x !== c)) return toast(t('duplicateName'), 'err');
    const data = { name: v.name.trim(), phone: v.phone, address: v.address, notes: v.notes, opening: N(v.opening) };
    if (N(data.opening) !== N(c && c.opening) && !guardDate(MG.db.settings.openingDate || '2000-01-01')) return;
    let obj;
    if (isNew) { obj = { id: MG.uid(), created: Date.now(), ...data }; MG.db.customers.push(obj); }
    else { Object.assign(c, data); obj = c; MG.db.projects.forEach(p => { if (p.customerId === c.id) p.client = c.name; }); }
    MG.log(isNew ? 'customer.create' : 'customer.edit', obj.name);
    MG.save(); close(); toast(t('saved'));
    if (onSaved) onSaved(obj); else if (isNew) go('/customer/' + obj.id);
  };
  return <Modal title={isNew ? t('newCustomer') : t('edit')} onClose={close} footer={<Foot close={close} save={save} />}>
    <div className="grid g2">
      <Field label={t('fullName')} className="span2"><Input value={v.name} onChange={set('name')} /></Field>
      <Field label={t('phone')}><Input type="tel" value={v.phone} onChange={set('phone')} /></Field>
      <Field label={t('address')}><Input value={v.address} onChange={set('address')} /></Field>
      {MG.can('accounting') && <Field label={t('openingDebt')} className="span2"><Input type="number" value={v.opening || ''} onChange={set('opening')} /></Field>}
      <Field label={t('notes')} className="span2"><textarea className="input" value={v.notes || ''} onChange={set('notes')} /></Field>
    </div>
  </Modal>;
}

export const openSupplier = s => openModal(close => <SupplierForm s={s} close={close} />);
function SupplierForm({ s, close }) {
  const isNew = !s;
  const [v, set] = useForm(s ? { ...s } : { name: '', phone: '', kind: '', notes: '', opening: '' });
  const save = () => {
    if (!v.name.trim()) return;
    const data = { name: v.name.trim(), phone: v.phone, kind: v.kind, notes: v.notes, opening: N(v.opening) };
    if (N(data.opening) !== N(s && s.opening) && !guardDate(MG.db.settings.openingDate || '2000-01-01')) return;
    if (isNew) MG.db.suppliers.push({ id: MG.uid(), created: Date.now(), ...data }); else Object.assign(s, data);
    MG.log(isNew ? 'supplier.create' : 'supplier.edit', data.name);
    MG.save(); close(); toast(t('saved'));
  };
  return <Modal title={isNew ? t('newSupplier') : t('edit')} onClose={close} footer={<Foot close={close} save={save} />}>
    <div className="grid g2">
      <Field label={t('fullName')} className="span2"><Input value={v.name} onChange={set('name')} /></Field>
      <Field label={t('phone')}><Input type="tel" value={v.phone} onChange={set('phone')} /></Field>
      <Field label={t('supplierKind')}><Input value={v.kind} onChange={set('kind')} placeholder={MG.lang === 'ar' ? 'ألمنيوم، زجاج، حديد…' : 'Aluminum, glass, steel…'} /></Field>
      {MG.can('accounting') && <Field label={t('openingOwed')} className="span2"><Input type="number" value={v.opening || ''} onChange={set('opening')} /></Field>}
      <Field label={t('notes')} className="span2"><textarea className="input" value={v.notes || ''} onChange={set('notes')} /></Field>
    </div>
  </Modal>;
}

export const openWorker = w => openModal(close => <WorkerForm w={w} close={close} />);
function WorkerForm({ w, close }) {
  const isNew = !w;
  const [v, set] = useForm(w ? { ...w } : { name: '', phone: '', job: '', wageType: 'daily', rate: '', active: true });
  const save = () => {
    if (!v.name.trim()) return;
    const data = { ...v, name: v.name.trim(), rate: N(v.rate) };
    if (isNew) MG.db.workers.push({ id: MG.uid(), created: Date.now(), ...data }); else Object.assign(w, data);
    MG.log(isNew ? 'worker.create' : 'worker.edit', data.name);
    MG.save(); close(); toast(t('saved'));
  };
  return <Modal title={isNew ? t('newWorker') : t('edit')} onClose={close} footer={<Foot close={close} save={save} />}>
    <div className="grid g2">
      <Field label={t('fullName')} className="span2"><Input value={v.name} onChange={set('name')} /></Field>
      <Field label={t('phone')}><Input type="tel" value={v.phone} onChange={set('phone')} /></Field>
      <Field label={t('job')}><Input value={v.job} onChange={set('job')} placeholder={MG.lang === 'ar' ? 'معلّم، مساعد، تركيب…' : 'Master, helper, installer…'} /></Field>
      <Field label={t('wageType')}><Select value={v.wageType} onChange={set('wageType')} options={[['daily', t('perDay')], ['monthly', t('perMonth')]]} /></Field>
      <Field label={t('wageRate') + ' ($)'}><Input type="number" value={v.rate} onChange={set('rate')} /></Field>
      <Check className="span2" checked={v.active !== false} onChange={set('active')}>{t('activeWorker')}</Check>
    </div>
  </Modal>;
}

export const openAccount = a => openModal(close => <AccountForm a={a} close={close} />);
function AccountForm({ a, close }) {
  const isNew = !a;
  const [v, set] = useForm(a ? { ...a } : { name: '', type: 'cash', opening: 0 });
  const save = () => {
    if (!v.name.trim()) return;
    const opening = N(v.opening);
    if ((isNew ? opening : opening !== N(a.opening)) && !guardDate(MG.db.settings.openingDate || '2000-01-01')) return;
    if (isNew) MG.db.accounts.push({ id: MG.uid(), name: v.name, type: v.type, opening }); else Object.assign(a, { name: v.name, type: v.type, opening });
    MG.log('account.' + (isNew ? 'create' : 'edit'), v.name); MG.save(); close();
  };
  return <Modal title={t('cashAccounts')} onClose={close} footer={<Foot close={close} save={save} />}>
    <div className="grid g2">
      <Field label={t('name')} className="span2"><Input value={v.name} onChange={set('name')} /></Field>
      <Field label={t('type')}><Select value={v.type} onChange={set('type')} options={[['cash', t('cashBox')], ['bank', t('bankAcc')]]} /></Field>
      <Field label={t('openingBal') + ' ($)'}><Input type="number" value={v.opening} onChange={set('opening')} /></Field>
    </div>
  </Modal>;
}

const ROLE_KEYS = ['admin', 'accountant', 'sales', 'worker'];
export const openUser = u => openModal(close => <UserForm u={u} close={close} />);
function UserForm({ u, close }) {
  const isNew = !u;
  const [v, set] = useForm(u ? { name: u.name, username: u.username, role: u.role, active: u.active !== false, password: '' } : { name: '', username: '', role: 'sales', active: true, password: '' });
  const save = () => {
    const uname = (v.username || '').trim().toLowerCase();
    if (!v.name.trim() || !uname) return toast(t('fillAll'), 'err');
    if (MG.db.users.some(x => x.username === uname && x !== u)) return toast(t('usernameTaken'), 'err');
    if ((isNew || v.password) && (v.password || '').length < 4) return toast(t('passShort'), 'err');
    const admins = MG.db.users.filter(x => x.role === 'admin' && x.active !== false && x !== u).length;
    if (!admins && (v.role !== 'admin' || !v.active)) return toast(t('needOneAdmin'), 'err');
    if (isNew) { MG.createUser({ name: v.name.trim(), username: uname, password: v.password, role: v.role }).active = v.active; MG.log('user.create', uname + ' (' + v.role + ')'); }
    else {
      Object.assign(u, { name: v.name.trim(), username: uname, role: v.role, active: v.active });
      if (v.password) { MG.setPassword(u, v.password); MG.log('user.password', uname); }
      MG.log('user.edit', uname + ' (' + v.role + (v.active ? '' : ', disabled') + ')');
    }
    MG.save(); close(); toast(t('saved'));
  };
  return <Modal title={isNew ? t('newUser') : t('edit')} onClose={close} footer={<Foot close={close} save={save} />}>
    <div className="grid g2">
      <Field label={t('fullName')} className="span2"><Input value={v.name} onChange={set('name')} /></Field>
      <Field label={t('username')}><Input dir="ltr" autoCapitalize="off" autoComplete="off" value={v.username} onChange={set('username')} /></Field>
      <Field label={t('role')}><Select value={v.role} onChange={set('role')} options={ROLE_KEYS.map(r => [r, t('role_' + r)])} /></Field>
      <Field label={isNew ? t('password') : t('newPasswordOpt')} className="span2"><Input type="password" dir="ltr" autoComplete="new-password" value={v.password} onChange={set('password')} /></Field>
      <Check className="span2" checked={v.active} onChange={set('active')}>{t('accountActive')}</Check>
      <p className="muted span2" style={{ fontSize: 12.5, margin: 0 }}>{t('roleDesc_' + v.role)}</p>
    </div>
  </Modal>;
}
export { ROLE_KEYS };
