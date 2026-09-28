import { Link } from 'react-router-dom';
import { MG, t } from '../lib/index.js';
import { Icon, Page, openModal } from '../components/ui.jsx';
import { NAV, navAllowed } from '../components/Shell.jsx';
import ChangePassword from '../forms/ChangePassword.jsx';

export default function More() {
  const skip = ['dashboard', 'projects', 'customers'];
  return <Page title={t('more')}>
    <div className="plist">
      {NAV.filter(n => navAllowed(n) && !skip.includes(n[0])).map(n => <Link key={n[0]} className="prow" to={n[2]} style={{ gridTemplateColumns: '52px 1fr auto' }}>
        <div className="picon mixed"><Icon name={n[1]} /></div><div className="prow-t">{t(n[0])}</div><div className="flip muted" style={{ width: 20 }}><Icon name="chevron" /></div></Link>)}
      <button className="prow" onClick={() => openModal(c => <ChangePassword close={c} />)} style={{ gridTemplateColumns: '52px 1fr', textAlign: 'start', font: 'inherit' }}>
        <div className="picon mixed"><Icon name="lock" /></div><div className="prow-t">{t('changePassword')}</div></button>
      <button className="prow" onClick={MG.logout} style={{ gridTemplateColumns: '52px 1fr', textAlign: 'start', font: 'inherit' }}>
        <div className="picon iron"><Icon name="logout" /></div><div><div className="prow-t">{t('logout')}</div><div className="prow-m">{MG.user.name} · {t('role_' + MG.user.role)}</div></div></button>
    </div>
  </Page>;
}
