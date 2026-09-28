import { MG, t } from '../lib/index.js';
import { Modal, Field, Input, Select, useForm, openModal, toast, guardDate, go } from '../components/ui.jsx';

export function openProjectForm(p, onSaved, cust) {
  openModal(close => <ProjectForm p={p} onSaved={onSaved} cust={cust} close={close} />);
}

function ProjectForm({ p, onSaved, cust, close }) {
  const isNew = !p;
  const d = { ...(p || { section: 'alu', status: 'quote', date: MG.today(), name: '', client: '', phone: '', location: '', dueDate: '', notes: '' }) };
  if (isNew && cust) { d.customerId = cust.id; d.location = cust.address || ''; }
  if (d.customerId) { const c = MG.getCustomer(d.customerId); if (c) { d.client = c.name; d.phone = d.phone || c.phone; } }
  const [v, set, setV] = useForm(d);

  const onClient = e => {
    const name = e.target.value;
    const c = MG.db.customers.find(x => x.name.trim().toLowerCase() === name.trim().toLowerCase());
    setV(s => ({ ...s, client: name, phone: s.phone || (c ? c.phone || '' : ''), location: s.location || (c ? c.address || '' : '') }));
  };

  const save = () => {
    const date = v.date || MG.today();
    const inv = s => s === 'active' || s === 'done';
    if ((p && inv(p.status) && !guardDate(p.date)) || (inv(v.status) && !guardDate(date))) return;
    const c = MG.findOrCreateCustomer(v.client, v.phone, v.location);
    const data = { name: v.name, client: v.client, phone: v.phone, location: v.location, section: v.section, status: v.status, date, dueDate: v.dueDate, notes: v.notes, customerId: c ? c.id : null };
    let proj;
    if (isNew) { proj = MG.newProject(data); MG.log('project.create', proj.code); }
    else { Object.assign(p, data); proj = p; MG.log('project.edit', p.code); }
    MG.save(); close(); toast(t('saved'));
    if (onSaved) onSaved(proj); else if (isNew) go('/project/' + proj.id);
  };

  return <Modal title={isNew ? t('newProject') : t('editProject')} onClose={close}
    footer={<><button className="btn" onClick={close}>{t('cancel')}</button><button className="btn btn-gold" onClick={save}>{t('save')}</button></>}>
    <div className="grid g2">
      <Field label={t('project')} className="span2"><Input value={v.name} onChange={set('name')} placeholder={MG.lang === 'ar' ? 'مثال: فيلا الحازمية' : 'e.g. Hazmieh villa'} /></Field>
      <Field label={t('client')}><Input value={v.client} onChange={onClient} list="custlist" autoComplete="off" />
        <datalist id="custlist">{MG.db.customers.map(c => <option key={c.id} value={c.name}>{c.phone || ''}</option>)}</datalist></Field>
      <Field label={t('phone')}><Input type="tel" value={v.phone} onChange={set('phone')} /></Field>
      <Field label={t('location')} className="span2"><Input value={v.location} onChange={set('location')} /></Field>
      <Field label={t('section')}><Select value={v.section} onChange={set('section')} options={[['alu', t('alu')], ['iron', t('iron')], ['mixed', t('mixed')]]} /></Field>
      <Field label={t('status')}><Select value={v.status} onChange={set('status')} options={MG.statuses.map(s => [s, t('st_' + s)])} /></Field>
      <Field label={t('date')}><Input type="date" value={v.date} onChange={set('date')} /></Field>
      <Field label={t('dueDate')}><Input type="date" value={v.dueDate} onChange={set('dueDate')} /></Field>
      <Field label={t('notes')} className="span2"><textarea className="input" value={v.notes || ''} onChange={set('notes')} /></Field>
    </div>
  </Modal>;
}
