import { MG, t } from '../lib/index.js';
import { Modal, Field, Input, useForm, toast } from '../components/ui.jsx';

export default function ChangePassword({ close }) {
  const [v, set] = useForm({ old: '', p1: '', p2: '' });
  const save = () => {
    const u = MG.user;
    if (u.pass !== MG.hashPass(u.salt, v.old || '')) return toast(t('badLogin'), 'err');
    if ((v.p1 || '').length < 4) return toast(t('passShort'), 'err');
    if (v.p1 !== v.p2) return toast(t('passMismatch'), 'err');
    MG.setPassword(u, v.p1); MG.log('user.password', u.username); MG.save(); close(); toast(t('saved'));
  };
  return <Modal title={t('changePassword')} onClose={close}
    footer={<><button className="btn" onClick={close}>{t('cancel')}</button><button className="btn btn-gold" onClick={save}>{t('save')}</button></>}>
    <div className="grid">
      <Field label={t('currentPassword')}><Input type="password" dir="ltr" value={v.old} onChange={set('old')} /></Field>
      <Field label={t('password')}><Input type="password" dir="ltr" value={v.p1} onChange={set('p1')} /></Field>
      <Field label={t('confirmPassword')}><Input type="password" dir="ltr" value={v.p2} onChange={set('p2')} /></Field>
    </div>
  </Modal>;
}
