/* Pricing editor with live technical drawing, cost breakdown and cut pieces */
import { useState } from 'react';
import { MG, t } from '../lib/index.js';
import { Icon, Svg, Modal, Field, Input, Select, openModal, toast, canEditInvoice } from '../components/ui.jsx';

const BD_KEYS = ['aluminum', 'glassC', 'steel', 'sheet', 'accessories', 'consumables', 'labor', 'paint', 'roof', 'extra'];

function selOptions(kind) {
  const S = MG.db.settings;
  if (kind === 'sel:finish') return S.alu.finishes.map(x => [x.id, MG.nm(x.name) + ' — $' + x.price + '/kg']);
  if (kind === 'sel:glass') return S.alu.glass.map(x => [x.id, MG.nm(x.name) + ' — $' + x.price + '/m²']);
  if (kind === 'sel:iprof') return S.iron.profiles.map(x => [x.id, x.name + ' (' + x.kg + ' kg/m)']);
  if (kind === 'sel:roof') return S.iron.roofs.map(x => [x.id, MG.nm(x.name) + (x.price ? ' — $' + x.price + '/m²' : '')]);
  if (kind === 'sel:side') return [['right', t('right')], ['left', t('left')]];
  return [];
}

function Result({ item, margin }) {
  const c = MG.calcItem(item, margin), money = MG.money;
  const max = Math.max(1, ...Object.values(c.breakdown));
  const chips = [];
  if (c.area) chips.push([t('area'), MG.fmt(c.area, 2) + ' m²']);
  if (c.weight) chips.push([t('weight'), MG.fmt(c.weight, 1) + ' kg']);
  if (c.glassArea) chips.push([t('glassC'), MG.fmt(c.glassArea, 2) + ' m²']);
  if (item.section === 'alu' && c.area) chips.push([t('perM2'), money(c.unitPrice / c.area, 0)]);
  if (item.section === 'iron' && c.weight) chips.push([t('perKg'), money(c.unitPrice / c.weight, 2)]);
  const S = MG.db.settings;
  return <>
    <div className="price-box">
      <div className="price-main">
        <div><div className="l">{t('unitPrice')}</div><div className="v money">{money(c.unitPrice, 0)}</div></div>
        <div style={{ textAlign: 'end' }}><div className="l">{t('total')} × {c.qty}</div><div className="money" style={{ fontSize: 22, fontWeight: 700 }}>{money(c.total, 0)}</div>
          {MG.can('view.costs') && <div className="l">{t('cost')}: <span className="money">{money(c.totalCost, 0)}</span></div>}</div>
      </div>
      {chips.length > 0 && <div className="chips">{chips.map(x => <span className="chip" key={x[0]}>{x[0]}<b className="num">{x[1]}</b></span>)}</div>}
      {MG.can('view.costs') && <div className="bd">{BD_KEYS.filter(k => c.breakdown[k] > 0.005).map(k =>
        <div className="bd-row" key={k}><span>{t(k)}</span><div className="bd-bar"><i style={{ width: c.breakdown[k] / max * 100 + '%' }} /></div><span className="money">{money(c.breakdown[k])}</span></div>)}</div>}
    </div>
    {c.pieces.length > 0 && <details style={{ marginTop: 14 }}>
      <summary className="muted" style={{ cursor: 'pointer' }}><Icon name="scissors" style={{ width: 15, verticalAlign: -2 }} /> {t('pieces')} ({c.pieces.reduce((s, p) => s + p.count, 0)})</summary>
      <div className="table-wrap" style={{ marginTop: 10 }}><table className="t"><thead><tr><th>{t('profile')}</th><th></th><th>{t('cutLen')}</th><th>{t('count')}</th></tr></thead><tbody>
        {c.pieces.map((p, i) => <tr key={i}><td>{MG.nm((S[item.section].profiles.find(x => x.id === p.pid) || {}).name || p.pid)}</td><td className="muted">{MG.partName(p.part)}</td><td className="num">{p.len}</td><td className="num">× {p.count}</td></tr>)}
      </tbody></table></div></details>}
  </>;
}

/* Controlled editor: item + setItem come from the parent */
export function Editor({ item, setItem, margin }) {
  const spec = MG.itemTypes[item.section][item.type] || [];
  const upd = (k, val) => setItem(it => ({ ...it, [k]: val }));
  const num = k => e => upd(k, e.target.value === '' ? 0 : parseFloat(e.target.value));
  const changeType = type => setItem(it => {
    const nw = MG.newItem(it.section, type);
    ['name', 'qty', 'finish', 'glass', 'extra'].forEach(k => { if (it[k] != null && nw[k] !== undefined) nw[k] = it[k]; });
    if (it.w && nw.w !== undefined && type !== 'custom') { nw.w = it.w; nw.h = it.h; }
    return { ...nw, id: it.id || nw.id };
  });
  return <div className="editor">
    <div>
      <div className="type-pick">{Object.keys(MG.itemTypes[item.section]).map(k =>
        <button type="button" key={k} className={item.type === k ? 'on' : ''} onClick={() => changeType(k)}><Icon name={'t_' + k} /><span>{t('t_' + k)}</span></button>)}</div>
      <div className="grid g2">
        <Field label={t('name')} className="span2"><Input value={item.name} onChange={e => upd('name', e.target.value)} placeholder={t('t_' + item.type)} /></Field>
        {spec.map(([key, kind, label]) => {
          if (kind === 'n') return <Field key={key} label={t(label)}><Input type="number" min="0" value={item[key]} onChange={num(key)} /></Field>;
          if (kind === 'chk') return <label key={key} className="check span2"><input type="checkbox" checked={!!item[key]} onChange={e => upd(key, e.target.checked)} /> {t(label)}</label>;
          return <Field key={key} label={t(label)} className={kind === 'sel:side' ? '' : 'span2'}><Select value={item[key]} onChange={e => upd(key, e.target.value)} options={selOptions(kind)} /></Field>;
        })}
        <Field label={t('qty')}><Input type="number" min="1" value={item.qty} onChange={num('qty')} /></Field>
        <Field label={t('extraCost')}><Input type="number" min="0" value={item.extra} onChange={num('extra')} /></Field>
        <Field label={t('priceOverride')} className="span2"><Input type="number" min="0" value={item.price || ''} placeholder={t('auto')} onChange={num('price')} /></Field>
      </div>
    </div>
    <div>
      <div className="preview"><span className="pv-label">{t('livePreview')}</span><Svg html={MG.drawItem(item)} className="pv" /></div>
      <Result item={item} margin={margin} />
    </div>
  </div>;
}

export function openItemEditor(project, section, existing) {
  openModal(close => <ItemModal project={project} section={section} existing={existing} close={close} />);
}

function ItemModal({ project: p, section, existing, close }) {
  const isNew = !existing;
  const [item, setItem] = useState(() => isNew ? MG.newItem(section, section === 'alu' ? 'sliding' : 'gate') : JSON.parse(JSON.stringify(existing)));
  const c = MG.calcItem(item, p.margin);
  const save = () => {
    if (!canEditInvoice(p)) return;
    MG.log(isNew ? 'item.add' : 'item.edit', p.code + ' — ' + MG.itemTitle(item));
    if (isNew) p.items.push(item); else p.items[p.items.findIndex(x => x.id === item.id)] = item;
    if (p.section !== 'mixed' && p.items.some(x => x.section !== p.section)) p.section = 'mixed';
    MG.save(); close(); toast(t('saved'));
  };
  return <Modal wide onClose={close} title={(isNew ? t('addItem') : t('editItem')) + ' · ' + t(item.section)}
    footer={<><span className="live-price">{t('total')}: <b className="money">{MG.money(c.total, 0)}</b></span>
      <button className="btn" onClick={close}>{t('cancel')}</button><button className="btn btn-gold" onClick={save}><Icon name="plus" /> {t('save')}</button></>}>
    <Editor item={item} setItem={setItem} margin={p.margin} />
  </Modal>;
}
