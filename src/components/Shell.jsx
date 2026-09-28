import { Link, useLocation } from 'react-router-dom';
import { MG, t } from '../lib/index.js';
import { Icon, Brand, openModal } from './ui.jsx';
import QuickAdd from '../forms/QuickAdd.jsx';
import ChangePassword from '../forms/ChangePassword.jsx';

// [key, icon, path, permission, group]
export const NAV = [
  ['dashboard', 'home', '/', null, 'main'],
  ['projects', 'folder', '/projects', null, 'main'],
  ['customers', 'users', '/customers', 'customers', 'main'],
  ['calculator', 'calc', '/calc', 'view.prices', 'main'],
  ['sketch', 'pen', '/sketch', null, 'main'],
  ['expenses', 'wallet', '/expenses', 'expenses', 'money'],
  ['workers', 'hardhat', '/workers', 'workers', 'money'],
  ['suppliers', 'truck', '/suppliers', 'suppliers', 'money'],
  ['accounting', 'book', '/accounting', 'accounting', 'money'],
  ['reports', 'chart', '/reports', 'reports', 'money'],
  ['users', 'shield', '/users', 'users', 'admin'],
  ['settings', 'gear', '/settings', 'settings', 'admin']
];
export const navAllowed = n => !n[3] || MG.can(n[3]);
export const canQuick = () => MG.can('expenses') || MG.can('payments.receive');
export const openQuick = () => openModal(close => <QuickAdd close={close} />);

/* which nav item a path belongs to */
function section(path) {
  const h = path.split('/')[1] || '';
  return { '': 'dashboard', project: 'projects', calc: 'calculator', customer: 'customers', supplier: 'suppliers', worker: 'workers' }[h] || h;
}

export function Sidebar() {
  const loc = useLocation(), cur = section(loc.pathname);
  let last = '';
  return <aside className="sidebar">
    <Brand />
    {canQuick() && <button className="btn btn-gold btn-block quick-btn" onClick={openQuick}><Icon name="plus" /> {t('quickEntry')}</button>}
    <nav className="nav">{NAV.filter(navAllowed).map(n => {
      const head = n[4] !== last ? <div className="nav-group">{t('grp_' + n[4])}</div> : null;
      last = n[4];
      return <div key={n[0]}>{head}<Link to={n[2]} className={cur === n[0] ? 'active' : ''}><Icon name={n[1]} /><span>{t(n[0])}</span></Link></div>;
    })}</nav>
    <div className="sidebar-foot">
      <div className="user-chip">
        <div className="avatar">{(MG.user.name || '?').trim().charAt(0).toUpperCase()}</div>
        <div style={{ minWidth: 0, cursor: 'pointer' }} title={t('changePassword')} onClick={() => openModal(c => <ChangePassword close={c} />)}>
          <div className="u-name">{MG.user.name}</div><div className="u-role">{t('role_' + MG.user.role)}</div></div>
        <button className="btn btn-ghost btn-sm btn-icon" title={t('logout')} onClick={MG.logout}><Icon name="logout" /></button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-sm" style={{ flex: 1 }} onClick={MG.toggleLang}><Icon name="globe" /> {t('language')}</button>
        <button className="btn btn-sm btn-icon" title={t('theme')} onClick={MG.toggleTheme}><Icon name={MG.theme() === 'dark' ? 'sun' : 'moon'} /></button>
      </div>
    </div>
  </aside>;
}

export function BottomNav() {
  const loc = useLocation(), cur = section(loc.pathname);
  const inBottom = ['dashboard', 'projects', 'customers', 'calculator'];
  const items = [['dashboard', 'home', '/'], ['projects', 'folder', '/projects']];
  items.push(canQuick() ? ['quickEntry', 'plus', null] : ['sketch', 'pen', '/sketch']);
  items.push(MG.can('customers') ? ['customers', 'users', '/customers'] : ['calculator', 'calc', '/calc']);
  items.push(['more', 'more', '/more']);
  return <nav className="bottomnav">{items.map(n => n[2] === null
    ? <a key={n[0]} className="fab" onClick={openQuick}><span className="ic"><Icon name={n[1]} /></span><span>{t(n[0])}</span></a>
    : <Link key={n[0]} to={n[2]} className={(cur === n[0] || (n[0] === 'more' && !inBottom.includes(cur))) ? 'active' : ''}><Icon name={n[1]} /><span>{t(n[0])}</span></Link>)}</nav>;
}
