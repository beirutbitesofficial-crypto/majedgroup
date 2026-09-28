import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MG, t } from '../lib/index.js';
import { Icon, Page, Seg, Field, Input, Modal, openModal, toast, canEditInvoice, StTag, SecTag, go } from '../components/ui.jsx';
import { Editor } from '../forms/ItemEditor.jsx';
import { openProjectForm } from '../forms/ProjectForm.jsx';

/* keeps what you typed when switching tabs or pages */
const memo = { alu: null, iron: null, margin: null };

function pickProject(cb) {
  openModal(close => <Modal title={t('chooseProject')} onClose={close}>
    <div className="plist">
      <button className="btn btn-gold btn-block" onClick={() => { close(); openProjectForm(null, cb); }}>{t('createNew')}</button>
      {MG.db.projects.filter(p => p.status !== 'cancelled').map(p =>
        <div key={p.id} className="prow" style={{ gridTemplateColumns: '1fr auto' }} onClick={() => { close(); cb(p); }}>
          <div><div className="prow-t">{p.name || MG.clientName(p) || p.code}</div><div className="prow-m"><span className="num">{p.code}</span><StTag s={p.status} /></div></div><SecTag s={p.section} /></div>)}
    </div></Modal>);
}

export default function Calculator() {
  const { section: sp } = useParams();
  const section = sp === 'iron' ? 'iron' : 'alu';
  const nav = useNavigate();
  if (!memo[section]) memo[section] = MG.newItem(section, section === 'alu' ? 'sliding' : 'gate');
  if (memo.margin == null) memo.margin = MG.db.settings.margin;
  const [item, setItemState] = useState(memo[section]);
  const [margin, setMargin] = useState(memo.margin);
  const cur = item.section === section ? item : memo[section];
  const setItem = f => setItemState(prev => { const base = prev.section === section ? prev : memo[section]; const n = typeof f === 'function' ? f(base) : f; memo[section] = n; return n; });

  const add = () => pickProject(p => {
    if (!canEditInvoice(p)) return;
    const copy = { ...JSON.parse(JSON.stringify(cur)), id: MG.uid() };
    p.items.push(copy);
    if (p.section !== 'mixed' && p.section !== copy.section) p.section = p.items.every(x => x.section === copy.section) ? copy.section : 'mixed';
    MG.log('item.add', p.code + ' — ' + MG.itemTitle(copy));
    MG.save(); toast(t('added')); go('/project/' + p.id);
  });

  return <Page title={t('calculator')} sub={t('calcIntro')}
    actions={<Seg value={section} onChange={s => nav('/calc/' + s)} options={[['alu', t('alu')], ['iron', t('iron')]]} />}>
    <div className="card">
      <Editor item={cur} setItem={setItem} margin={margin} />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
        <div style={{ width: 160 }}><Field label={t('margin')}><Input type="number" value={margin} onChange={e => { memo.margin = parseFloat(e.target.value) || 0; setMargin(memo.margin); }} /></Field></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => setItem(MG.newItem(section, section === 'alu' ? 'sliding' : 'gate'))}><Icon name="undo" /> {t('clear')}</button>
          <button className="btn btn-gold" onClick={add}><Icon name="folder" /> {t('addToProject')}</button>
        </div>
      </div>
    </div>
  </Page>;
}
