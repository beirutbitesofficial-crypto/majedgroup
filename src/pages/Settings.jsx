/* Settings: company, expense categories, price lists, backup */
import { MG, t } from '../lib/index.js';
import { Icon, Page, Field, confirmBox, toast } from '../components/ui.jsx';

const N = v => parseFloat(v) || 0;
const get = path => path.split('.').reduce((o, k) => o[k], MG.db.settings);
const set = (path, v) => { const ks = path.split('.'), last = ks.pop(); ks.reduce((o, k) => o[k], MG.db.settings)[last] = v; };
const persist = label => { MG.log('settings', label); MG.save(); toast(t('saved')); };

function Scalar({ path, label, type }) {
  return <Field label={label}><input className="input" key={path + String(get(path))} type={type || 'number'} step="any" defaultValue={get(path)}
    onChange={e => { set(path, (type || 'number') === 'number' ? N(e.target.value) : e.target.value); }} onBlur={e => persist(path + '=' + e.target.value)} /></Field>;
}

function ListTable({ path, cols }) {
  const arr = get(path);
  return <>
    <div className="table-wrap ptable"><table className="t"><thead><tr>{cols.map(c => <th key={c[0]}>{c[1]}</th>)}<th></th></tr></thead><tbody>
      {arr.map((row, i) => <tr key={row.id || i}>{cols.map(c => <td key={c[0]}><input className="input" type={c[2] || 'text'} step="any" defaultValue={row[c[0]]}
        onChange={e => { row[c[0]] = c[2] === 'number' ? N(e.target.value) : e.target.value; }} onBlur={() => persist(path)} /></td>)}
        <td className="r"><button className="btn btn-ghost btn-sm btn-icon btn-danger" onClick={() => confirmBox(t('confirmDelete'), () => { arr.splice(i, 1); MG.save(); })}><Icon name="trash" /></button></td></tr>)}
    </tbody></table></div>
    <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => { arr.push({ id: MG.uid(), name: '', price: 0, kg: 0 }); MG.save(); }}><Icon name="plus" /> {t('addRow')}</button>
  </>;
}

const usedCat = id => MG.db.expenses.some(x => x.category === id) || MG.db.recurring.some(x => x.category === id) || ['salary', 'labor', 'other'].includes(id);

export default function Settings() {
  const S = MG.db.settings;
  const aprof = [['', '—']].concat(S.alu.profiles.map(p => [p.id, MG.nm(p.name)]));
  const exportData = () => MG.download('majed-group-backup-' + MG.today() + '.json', JSON.stringify(MG.db, null, 1), 'application/json');
  const importData = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!d || !Array.isArray(d.projects) || !d.settings) throw new Error('bad');
        if (!window.confirm(t('importWarn'))) return;
        const users = MG.db.users;
        MG.migrate(d); if (!d.users.length) d.users = users;
        MG.replaceDb(d); MG.log('backup.import'); MG.save(); toast(t('imported'));
      } catch (err) { toast(t('badFile'), 'err'); }
    };
    r.readAsText(f);
  };
  const resetPrices = () => confirmBox(t('resetPrices') + '?', () => { const d = MG.defaultSettings(); S.alu = d.alu; S.iron = d.iron; persist('reset prices'); }, t('resetPrices'));

  return <Page title={t('settings')}>
    <div className="card set-sec"><h3><Icon name="user" /> {t('company')}</h3><div className="grid g4">
      <Scalar path="company.nameAr" label={t('companyName') + ' (AR)'} type="text" /><Scalar path="company.name" label={t('companyName') + ' (EN)'} type="text" />
      <Scalar path="company.phone" label={t('phone')} type="tel" /><Scalar path="company.address" label={t('address')} type="text" />
      <Scalar path="currency" label={t('currency')} type="text" /><Scalar path="margin" label={t('defaultMargin')} />
      <Scalar path="vat" label={t('vat')} /><Scalar path="rate" label={t('exchangeRate') + ' (LBP)'} />
    </div></div>

    <div className="card set-sec"><h3><Icon name="wallet" /> {t('expenseCategories')}</h3>
      <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>{t('categoriesHint')}</p>
      <div className="table-wrap ptable"><table className="t"><thead><tr><th>{t('name')} (عربي / English)</th><th>{t('catGroup')}</th><th className="c">{t('quickEntry')}</th><th></th></tr></thead><tbody>
        {S.categories.map((c, i) => <tr key={c.id}>
          <td><input className="input" defaultValue={c.name} onChange={e => { c.name = e.target.value; }} onBlur={() => persist('category ' + c.name)} /></td>
          <td><select className="input" value={c.group} onChange={e => { c.group = e.target.value; persist('category ' + c.name); }}>
            <option value="cogs">{t('cogs')}</option><option value="opex">{t('opex')}</option></select></td>
          <td className="c"><input type="checkbox" checked={!!c.quick} onChange={e => { c.quick = e.target.checked; persist('category ' + c.name); }} style={{ width: 20, height: 20, accentColor: 'var(--gold)' }} /></td>
          <td className="r">{!usedCat(c.id) && <button className="btn btn-ghost btn-sm btn-icon btn-danger" onClick={() => confirmBox(t('confirmDelete'), () => { S.categories.splice(i, 1); MG.save(); })}><Icon name="trash" /></button>}</td></tr>)}
      </tbody></table></div>
      <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => { S.categories.push({ id: MG.uid(), name: '', group: 'opex', icon: 'wallet' }); MG.save(); }}><Icon name="plus" /> {t('addRow')}</button>
    </div>

    <div className="card set-sec"><h3><Icon name="window" /> {t('aluPrices')}</h3>
      <div className="grid g3" style={{ marginBottom: 18 }}><Scalar path="alu.barLength" label={t('barLength')} /><Scalar path="alu.waste" label={t('wastePct')} /><Scalar path="alu.netPrice" label={t('netPrice')} /></div>
      <div className="grid g2">
        <div><h4>{t('finishes')}</h4><ListTable path="alu.finishes" cols={[['name', t('name')], ['price', t('pricePerKg'), 'number']]} /></div>
        <div><h4>{t('glassTypes')}</h4><ListTable path="alu.glass" cols={[['name', t('name')], ['price', t('pricePerM2'), 'number']]} /></div>
      </div>
      <h4 style={{ marginTop: 20 }}>{t('profiles')}</h4><ListTable path="alu.profiles" cols={[['name', t('name')], ['kg', t('kgPerM'), 'number']]} />
      <h4 style={{ marginTop: 20 }}>{t('systems')}</h4>
      <div className="table-wrap ptable"><table className="t"><thead><tr><th>{t('type')}</th>{['frame', 'sash', 'mullion', 'bead'].map(k => <th key={k}>{MG.partName(k)}</th>)}<th>{t('accPerSash')}</th><th>{t('laborM2')}</th></tr></thead><tbody>
        {Object.keys(S.alu.systems).map(k => { const s = S.alu.systems[k]; return <tr key={k}><td><b>{t('t_' + k)}</b></td>
          {['frame', 'sash', 'mullion', 'bead'].map(f => <td key={f}><select className="input" value={s[f] || ''} onChange={e => { s[f] = e.target.value; persist('system ' + k); }}>
            {aprof.map(o => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select></td>)}
          {['acc', 'labor'].map(f => <td key={f}><input className="input" type="number" step="any" defaultValue={s[f]} onChange={e => { s[f] = N(e.target.value); }} onBlur={() => persist('system ' + k)} /></td>)}</tr>; })}
      </tbody></table></div>
    </div>

    <div className="card set-sec"><h3><Icon name="gate" /> {t('ironPrices')}</h3>
      <div className="grid g4" style={{ marginBottom: 18 }}>
        <Scalar path="iron.steelPrice" label={t('steelPrice')} /><Scalar path="iron.sheetPrice" label={t('sheetPrice')} /><Scalar path="iron.labor" label={t('laborKg')} /><Scalar path="iron.paint" label={t('paintKg')} />
        <Scalar path="iron.consumables" label={t('consumables') + ' %'} /><Scalar path="iron.waste" label={t('wastePct')} /><Scalar path="iron.barLength" label={t('barLength')} />
      </div>
      <div className="grid g2">
        <div><h4>{t('profiles')}</h4><ListTable path="iron.profiles" cols={[['name', t('name')], ['kg', t('kgPerM'), 'number']]} /></div>
        <div><h4>{t('roofTypes')}</h4><ListTable path="iron.roofs" cols={[['name', t('name')], ['price', t('pricePerM2'), 'number']]} /></div>
      </div>
    </div>

    {MG.can('users') && <div className="card set-sec"><h3><Icon name="download" /> {t('backup')}</h3>
      <p className="muted" style={{ marginTop: 0 }}>{t('backupHint')}</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-gold" onClick={exportData}><Icon name="download" /> {t('exportData')}</button>
        <label className="btn"><Icon name="upload" /> {t('importData')}<input type="file" accept="application/json,.json" hidden onChange={importData} /></label>
        <button className="btn btn-danger" onClick={resetPrices}><Icon name="undo" /> {t('resetPrices')}</button>
      </div></div>}
  </Page>;
}
