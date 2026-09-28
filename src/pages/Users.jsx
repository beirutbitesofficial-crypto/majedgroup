import { useState } from 'react';
import { MG, t } from '../lib/index.js';
import { Icon, Page, Search } from '../components/ui.jsx';
import { openUser, ROLE_KEYS } from '../forms/parties.jsx';

export default function Users() {
  const [q, setQ] = useState('');
  const lq = q.toLowerCase();
  const log = MG.db.log.filter(l => !lq || (l.user + ' ' + l.action + ' ' + l.detail).toLowerCase().includes(lq)).slice(0, 300);
  const when = ts => new Date(ts).toLocaleString('en-GB');
  return <Page title={t('users')} sub={`${MG.db.users.length} ${t('users')}`} actions={<button className="btn btn-gold" onClick={() => openUser()}><Icon name="plus" /> {t('newUser')}</button>}>
    <div className="two-col" style={{ marginBottom: 18 }}>
      <div className="card"><div className="card-h"><h3>{t('users')}</h3></div>
        <div className="table-wrap"><table className="t"><thead><tr><th>{t('fullName')}</th><th>{t('username')}</th><th>{t('role')}</th><th>{t('lastLogin')}</th><th></th></tr></thead><tbody>
          {MG.db.users.map(u => <tr key={u.id} style={{ opacity: u.active === false ? .45 : 1 }}>
            <td><b>{u.name}</b>{u.id === MG.user.id && <> <span className="tag pay-paid">{t('you')}</span></>}{u.active === false && <> <span className="tag pay-unpaid">{t('disabled')}</span></>}</td>
            <td className="num">{u.username}</td><td><span className={'tag role-' + u.role}>{t('role_' + u.role)}</span></td>
            <td className="num muted">{u.lastLogin ? when(u.lastLogin) : '—'}</td>
            <td className="r"><button className="btn btn-ghost btn-sm btn-icon" onClick={() => openUser(u)}><Icon name="edit" /></button></td></tr>)}
        </tbody></table></div></div>
      <div className="card"><div className="card-h"><h3>{t('permissions')}</h3></div>
        <div className="table-wrap"><table className="t perm"><thead><tr><th></th>{ROLE_KEYS.map(r => <th key={r} className="c">{t('role_' + r)}</th>)}</tr></thead><tbody>
          {MG.PERMS.map(p => <tr key={p}><td>{t('perm_' + p.replace('.', '_'))}</td>{ROLE_KEYS.map(r => <td key={r} className="c">{MG.ROLES[r].includes(p) ? <span className="pos"><Icon name="check" /></span> : <span className="muted">—</span>}</td>)}</tr>)}
        </tbody></table></div></div>
    </div>
    <div className="card"><div className="card-h"><h3>{t('auditLog')}</h3><div style={{ maxWidth: 280, flex: 1 }}><Search value={q} onChange={setQ} /></div></div>
      <p className="muted" style={{ marginTop: 0, fontSize: 12.5 }}>{t('auditHint')}</p>
      {log.length ? <div className="table-wrap" style={{ maxHeight: 480, overflow: 'auto' }}><table className="t"><thead><tr><th>{t('time')}</th><th>{t('username')}</th><th>{t('action')}</th><th>{t('description')}</th></tr></thead><tbody>
        {log.map((l, i) => <tr key={i}><td className="num muted" style={{ whiteSpace: 'nowrap' }}>{when(l.ts)}</td><td className="num">{l.user}</td><td><code>{l.action}</code></td><td>{l.detail}</td></tr>)}
      </tbody></table></div> : <p className="muted">—</p>}</div>
  </Page>;
}
