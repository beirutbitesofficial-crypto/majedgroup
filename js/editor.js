/* Majed Group — item pricing editor (with live drawing) and the standalone calculator */
(function () {
  const t = MG.t, ic = MG.ic, esc = MG.esc, money = MG.money;

  function selOptions(kind) {
    const S = MG.db.settings;
    if (kind === 'sel:finish') return S.alu.finishes.map(x => [x.id, MG.nm(x.name) + ' — $' + x.price + '/kg']);
    if (kind === 'sel:glass') return S.alu.glass.map(x => [x.id, MG.nm(x.name) + ' — $' + x.price + '/m²']);
    if (kind === 'sel:iprof') return S.iron.profiles.map(x => [x.id, x.name + ' (' + x.kg + ' kg/m)']);
    if (kind === 'sel:roof') return S.iron.roofs.map(x => [x.id, MG.nm(x.name) + (x.price ? ' — $' + x.price + '/m²' : '')]);
    if (kind === 'sel:side') return [['right', t('right')], ['left', t('left')]];
    return [];
  }

  function fieldsHtml(item) {
    const spec = MG.itemTypes[item.section][item.type] || [];
    return spec.map(([key, kind, label]) => {
      if (kind === 'n') return MG.fld(t(label), MG.inp(key, item[key], 'number', 'min="0"'));
      if (kind === 'chk') return `<label class="check span2"><input type="checkbox" name="${key}" ${item[key] ? 'checked' : ''}> ${t(label)}</label>`;
      if (kind.startsWith('sel:')) return MG.fld(t(label), MG.sel(key, selOptions(kind), item[key]), kind === 'sel:side' ? '' : 'span2');
      return MG.fld(t(label), MG.inp(key, item[key]));
    }).join('');
  }

  const BD_KEYS = ['aluminum', 'glassC', 'steel', 'sheet', 'accessories', 'consumables', 'labor', 'paint', 'roof', 'extra'];

  function resultHtml(item, margin) {
    const c = MG.calcItem(item, margin);
    const max = Math.max(1, ...Object.values(c.breakdown));
    const bd = BD_KEYS.filter(k => c.breakdown[k] > 0.005).map(k =>
      `<div class="bd-row"><span>${t(k)}</span><div class="bd-bar"><i style="width:${c.breakdown[k] / max * 100}%"></i></div><span class="money">${money(c.breakdown[k])}</span></div>`).join('');
    const chips = [];
    if (c.area) chips.push(`${t('area')}<b class="num">${MG.fmt(c.area, 2)} m²</b>`);
    if (c.weight) chips.push(`${t('weight')}<b class="num">${MG.fmt(c.weight, 1)} kg</b>`);
    if (c.glassArea) chips.push(`${t('glassC')}<b class="num">${MG.fmt(c.glassArea, 2)} m²</b>`);
    if (item.section === 'alu' && c.area) chips.push(`${t('perM2')}<b class="money">${money(c.unitPrice / c.area, 0)}</b>`);
    if (item.section === 'iron' && c.weight) chips.push(`${t('perKg')}<b class="money">${money(c.unitPrice / c.weight, 2)}</b>`);
    const S = MG.db.settings;
    const pcs = c.pieces.length ? `<details style="margin-top:14px"><summary class="muted" style="cursor:pointer">${ic('scissors').replace('<svg', '<svg style="width:15px;vertical-align:-2px"')} ${t('pieces')} (${c.pieces.reduce((s, p) => s + p.count, 0)})</summary>
      <div class="table-wrap" style="margin-top:10px"><table class="t"><thead><tr><th>${t('profile')}</th><th></th><th>${t('cutLen')}</th><th>${t('count')}</th></tr></thead><tbody>
      ${c.pieces.map(p => `<tr><td>${esc(MG.nm((S[item.section].profiles.find(x => x.id === p.pid) || {}).name || p.pid))}</td><td class="muted">${MG.partName(p.part)}</td><td class="num">${p.len}</td><td class="num">× ${p.count}</td></tr>`).join('')}
      </tbody></table></div></details>` : '';
    return `<div class="price-box">
        <div class="price-main">
          <div><div class="l">${t('unitPrice')}</div><div class="v money">${money(c.unitPrice, 0)}</div></div>
          <div style="text-align:end"><div class="l">${t('total')} × ${c.qty}</div><div class="money" style="font-size:22px;font-weight:700">${money(c.total, 0)}</div>
            <div class="l">${t('cost')}: <span class="money">${money(c.totalCost, 0)}</span></div></div>
        </div>
        ${chips.length ? `<div class="chips">${chips.map(x => `<span class="chip">${x}</span>`).join('')}</div>` : ''}
        <div class="bd">${bd}</div>
      </div>${pcs}`;
  }

  /* Renders the editor into `root`. state = { item, margin, onChange } */
  MG.renderEditor = function (root, state) {
    const it = state.item;
    const types = Object.keys(MG.itemTypes[it.section]);
    root.innerHTML = `<div class="editor">
      <div>
        <div class="type-pick">${types.map(k => `<button type="button" data-type="${k}" class="${it.type === k ? 'on' : ''}">${ic('t_' + k)}<span>${t('t_' + k)}</span></button>`).join('')}</div>
        <div class="grid g2" id="ef">
          ${MG.fld(t('name'), MG.inp('name', it.name, 'text', `placeholder="${esc(t('t_' + it.type))}"`), 'span2')}
          ${fieldsHtml(it)}
          ${MG.fld(t('qty'), MG.inp('qty', it.qty, 'number', 'min="1"'))}
          ${MG.fld(t('extraCost'), MG.inp('extra', it.extra, 'number', 'min="0"'))}
          ${MG.fld(t('priceOverride'), MG.inp('price', it.price || '', 'number', `min="0" placeholder="${t('auto')}"`), 'span2')}
        </div>
      </div>
      <div>
        <div class="preview"><span class="pv-label">${t('livePreview')}</span><div id="pv"></div></div>
        <div id="res"></div>
      </div></div>`;
    const refresh = () => {
      root.querySelector('#pv').innerHTML = MG.drawItem(it);
      root.querySelector('#res').innerHTML = resultHtml(it, state.margin);
      if (state.priceEl) { const c = MG.calcItem(it, state.margin); state.priceEl.innerHTML = `${t('total')}: <b class="money">${money(c.total, 0)}</b>`; }
    };
    root.querySelector('#ef').addEventListener('input', () => {
      const v = MG.formData(root.querySelector('#ef'));
      Object.keys(v).forEach(k => { it[k] = v[k] === '' ? (k === 'name' ? '' : 0) : v[k]; });
      refresh(); state.onChange && state.onChange();
    });
    root.querySelector('#ef').addEventListener('change', () => root.querySelector('#ef').dispatchEvent(new Event('input')));
    root.querySelectorAll('[data-type]').forEach(b => b.onclick = () => {
      const nw = MG.newItem(it.section, b.dataset.type);
      ['name', 'qty', 'finish', 'glass', 'extra'].forEach(k => { if (it[k] != null && nw[k] !== undefined) nw[k] = it[k]; });
      if (it.w && nw.w !== undefined && b.dataset.type !== 'custom') { nw.w = it.w; nw.h = it.h; }
      Object.keys(it).forEach(k => { if (k !== 'id') delete it[k]; });
      Object.assign(it, nw, { id: it.id || nw.id });
      MG.renderEditor(root, state); state.onChange && state.onChange();
    });
    refresh();
  };

  /* Modal editor used inside a project */
  MG.itemEditor = function (opts) {
    const p = opts.project;
    const isNew = !opts.item;
    const item = isNew ? MG.newItem(opts.section, opts.section === 'alu' ? 'sliding' : 'gate') : JSON.parse(JSON.stringify(opts.item));
    const m = MG.modal((isNew ? t('addItem') : t('editItem')) + ' · ' + t(item.section), '<div id="ed"></div>',
      `<span id="lp" class="live-price"></span><button class="btn" data-close>${t('cancel')}</button><button class="btn btn-gold" id="ok">${ic('plus')} ${t('save')}</button>`, { wide: true });
    MG.renderEditor(m.querySelector('#ed'), { item, margin: p.margin, priceEl: m.querySelector('#lp') });
    m.querySelector('[data-close]').onclick = () => MG.closeModal();
    m.querySelector('#ok').onclick = () => {
      if (isNew) p.items.push(item);
      else { const i = p.items.findIndex(x => x.id === item.id); p.items[i] = item; }
      if (p.section !== 'mixed' && p.items.some(x => x.section !== p.section)) p.section = 'mixed';
      MG.save(); MG.closeModal(); MG.toast(t('saved')); MG.route();
    };
  };

  /* Standalone calculator page */
  const calcState = { alu: null, iron: null, margin: null };
  MG.views.calculator = function (el, section) {
    if (section !== 'iron') section = 'alu';
    if (!calcState[section]) calcState[section] = MG.newItem(section, section === 'alu' ? 'sliding' : 'gate');
    if (calcState.margin == null) calcState.margin = MG.db.settings.margin;
    const item = calcState[section];
    el.innerHTML = MG.page(t('calculator'), t('calcIntro'),
      `<div class="seg-ctl"><button data-s="alu" class="${section === 'alu' ? 'on' : ''}">${t('alu')}</button><button data-s="iron" class="${section === 'iron' ? 'on' : ''}">${t('iron')}</button></div>`) + `
      <div class="card">
        <div id="ed"></div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;margin-top:20px;padding-top:18px;border-top:1px solid var(--line)">
          <div style="width:160px">${MG.fld(t('margin'), MG.inp('cm', calcState.margin, 'number', 'id="cm"'))}</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn" id="rs">${ic('undo')} ${t('clear')}</button>
            <button class="btn btn-gold" id="ap">${ic('folder')} ${t('addToProject')}</button>
          </div>
        </div>
      </div>`;
    const state = { item, margin: calcState.margin };
    MG.renderEditor(el.querySelector('#ed'), state);
    el.querySelectorAll('[data-s]').forEach(b => b.onclick = () => MG.go('#/calc/' + b.dataset.s));
    el.querySelector('#cm').oninput = e => { calcState.margin = state.margin = parseFloat(e.target.value) || 0; el.querySelector('#ef').dispatchEvent(new Event('input')); };
    el.querySelector('#rs').onclick = () => { calcState[section] = null; MG.route(); };
    el.querySelector('#ap').onclick = () => pickProject(p => {
      const copy = JSON.parse(JSON.stringify(item)); copy.id = MG.uid();
      p.items.push(copy);
      if (p.section !== 'mixed' && p.section !== copy.section) p.section = p.items.every(x => x.section === copy.section) ? copy.section : 'mixed';
      MG.save(); MG.toast(t('added')); MG.go('#/project/' + p.id);
    });
  };

  function pickProject(cb) {
    const list = MG.db.projects.filter(p => p.status !== 'cancelled');
    const m = MG.modal(t('chooseProject'), `<div class="plist">
      <button class="btn btn-gold btn-block" id="nw">${t('createNew')}</button>
      ${list.map(p => `<div class="prow" data-id="${p.id}" style="grid-template-columns:1fr auto"><div><div class="prow-t">${esc(p.name || p.client || p.code)}</div>
        <div class="prow-m"><span class="num">${esc(p.code)}</span>${MG.stTag(p.status)}</div></div>${MG.secTag(p.section)}</div>`).join('')}</div>`, '', { noFocus: true });
    m.querySelector('#nw').onclick = () => { MG.closeModal(); MG.projectForm(null, cb); };
    m.querySelectorAll('[data-id]').forEach(r => r.onclick = () => { MG.closeModal(); cb(MG.getProject(r.dataset.id)); });
  }
})();
