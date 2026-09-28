import { useState } from 'react';
import { MG, t } from '../lib/index.js';
import { Icon, Page, Search, Seg, Select } from '../components/ui.jsx';
import { ProjectRow } from '../components/tables.jsx';
import { openProjectForm } from '../forms/ProjectForm.jsx';
import { EmptyProjects } from './Dashboard.jsx';

const saved = { q: '', section: 'all', status: 'all', pay: 'all' };

export default function Projects() {
  const [f, setF] = useState(saved);
  const up = k => v => { saved[k] = v; setF({ ...saved }); };
  const q = f.q.trim().toLowerCase();
  const list = MG.db.projects.filter(p =>
    (f.section === 'all' || p.section === f.section) && (f.status === 'all' || p.status === f.status) &&
    (f.pay === 'all' || MG.payStatus(p) === f.pay) &&
    (!q || [p.name, MG.clientName(p), p.code, p.phone, p.location].join(' ').toLowerCase().includes(q)));
  return <Page title={t('projects')} sub={`${MG.db.projects.length} ${t('projects')}`}
    actions={MG.can('projects.edit') && <button className="btn btn-gold" onClick={() => openProjectForm()}><Icon name="plus" /> {t('newProject')}</button>}>
    <div className="filters">
      <Search value={f.q} onChange={up('q')} />
      <Seg value={f.section} onChange={up('section')} options={['all', 'alu', 'iron', 'mixed'].map(s => [s, t(s)])} />
      <Select style={{ width: 'auto' }} value={f.status} onChange={e => up('status')(e.target.value)} options={[['all', t('all')]].concat(MG.statuses.map(s => [s, t('st_' + s)]))} />
      {MG.can('view.prices') && <Select style={{ width: 'auto' }} value={f.pay} onChange={e => up('pay')(e.target.value)}
        options={[['all', t('payAll')], ['paid', t('pay_paid')], ['partial', t('pay_partial')], ['unpaid', t('pay_unpaid')]]} />}
    </div>
    {list.length ? <div className="plist">{list.map(p => <ProjectRow key={p.id} p={p} />)}</div>
      : MG.db.projects.length ? <div className="empty"><Icon name="search" /><p>—</p></div> : <EmptyProjects />}
  </Page>;
}
