import { useState } from 'react';
import { MG, t } from '../lib/index.js';
import { Icon, Field } from '../components/ui.jsx';

/* First run creates the admin account; afterwards it is the sign-in screen */
export default function Auth() {
  const setup = !MG.db.users.length;
  const [v, setV] = useState({ name: '', username: '', password: '', password2: '', remember: true });
  const [err, setErr] = useState('');
  const set = k => e => setV(s => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const c = MG.db.settings.company;

  const submit = e => {
    e.preventDefault();
    if (setup) {
      if (!v.name.trim() || !v.username.trim()) return setErr(t('fillAll'));
      if (v.password.length < 4) return setErr(t('passShort'));
      if (v.password !== v.password2) return setErr(t('passMismatch'));
      MG.setupAdmin(v.name.trim(), v.username, v.password);
    } else if (!MG.login(v.username, v.password, v.remember)) setErr(t('badLogin'));
  };

  return <div className="auth-wrap"><div className="auth-card">
    <div className="auth-top">
      <button className="btn btn-sm btn-ghost" onClick={MG.toggleLang}><Icon name="globe" /> {t('language')}</button>
      <button className="btn btn-sm btn-ghost btn-icon" onClick={MG.toggleTheme}><Icon name={MG.theme() === 'dark' ? 'sun' : 'moon'} /></button>
    </div>
    <div className="auth-brand"><div className="brand-mark big">M</div>
      <h1>{MG.lang === 'ar' ? (c.nameAr || c.name) : (c.name || c.nameAr)}</h1><div className="brand-sub">{t('appSub')}</div></div>
    <h2 className="auth-title">{setup ? t('setupTitle') : t('login')}</h2>
    {setup && <p className="muted auth-p">{t('setupHint')}</p>}
    <form className="grid" onSubmit={submit} autoComplete="on">
      {setup && <Field label={t('fullName')}><input className="input" name="name" value={v.name} onChange={set('name')} autoComplete="name" /></Field>}
      <Field label={t('username')}><input className="input" name="username" dir="ltr" autoCapitalize="off" autoComplete="username" value={v.username} onChange={set('username')} /></Field>
      <Field label={t('password')}><input className="input" name="password" type="password" dir="ltr" autoComplete={setup ? 'new-password' : 'current-password'} value={v.password} onChange={set('password')} /></Field>
      {setup
        ? <Field label={t('confirmPassword')}><input className="input" name="password2" type="password" dir="ltr" autoComplete="new-password" value={v.password2} onChange={set('password2')} /></Field>
        : <label className="check"><input type="checkbox" checked={v.remember} onChange={set('remember')} /> {t('rememberMe')}</label>}
      <div className="auth-err">{err}</div>
      <button className="btn btn-gold btn-block" type="submit" style={{ minHeight: 48 }}>{setup ? t('createAdmin') : t('login')}</button>
    </form>
  </div></div>;
}
