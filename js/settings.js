/* Majed Group — settings: company, price lists, backup */
(function () {
  const t = MG.t, ic = MG.ic, esc = MG.esc;

  function get(path) { return path.split('.').reduce((o, k) => o[k], MG.db.settings); }
  function set(path, v) { const ks = path.split('.'), last = ks.pop(); ks.reduce((o, k) => o[k], MG.db.settings)[last] = v; }

  function listTable(path, cols) {
    const arr = get(path);
    return `<div class="table-wrap ptable"><table class="t"><thead><tr>${cols.map(c => `<th>${c[1]}</th>`).join('')}<th></th></tr></thead><tbody>
      ${arr.map((row, i) => `<tr>${cols.map(c => `<td><input class="input" data-arr="${path}" data-i="${i}" data-k="${c[0]}" type="${c[2] || 'text'}" ${c[2] === 'number' ? 'step="any" inputmode="decimal"' : ''} value="${esc(row[c[0]])}"></td>`).join('')}
        <td class="r"><button class="btn btn-ghost btn-sm btn-icon btn-danger" data-rm="${path}" data-i="${i}">${ic('trash')}</button></td></tr>`).join('')}
      </tbody></table></div><button class="btn btn-sm" style="margin-top:10px" data-addrow="${path}">${ic('plus')} ${t('addRow')}</button>`;
  }
  function scalar(path, label, type) { return MG.fld(label, `<input class="input" data-path="${path}" type="${type || 'number'}" ${type ? '' : 'step="any" inputmode="decimal"'} value="${esc(get(path))}">`); }

  const usedCat = id => MG.db.expenses.some(x => x.category === id) || MG.db.recurring.some(x => x.category === id) || ['salary', 'labor', 'other'].includes(id);

  MG.views.settings = function (el) {
    const S = MG.db.settings;
    const aprof = [['', '—']].concat(S.alu.profiles.map(p => [p.id, p.name]));
    const sysRows = Object.keys(S.alu.systems).map(k => {
      const s = S.alu.systems[k];
      const pick = f => `<select class="input" data-sys="${k}" data-k="${f}">${aprof.map(o => `<option value="${esc(o[0])}" ${o[0] === s[f] ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
      return `<tr><td><b>${t('t_' + k)}</b></td><td>${pick('frame')}</td><td>${pick('sash')}</td><td>${pick('mullion')}</td><td>${pick('bead')}</td>
        <td><input class="input" type="number" step="any" data-sys="${k}" data-k="acc" value="${s.acc}"></td><td><input class="input" type="number" step="any" data-sys="${k}" data-k="labor" value="${s.labor}"></td></tr>`;
    }).join('');

    el.innerHTML = MG.page(t('settings'), '') + `
      <div class="card set-sec"><h3>${ic('user')} ${t('company')}</h3><div class="grid g4">
        ${scalar('company.nameAr', t('companyName') + ' (AR)', 'text')}${scalar('company.name', t('companyName') + ' (EN)', 'text')}
        ${scalar('company.phone', t('phone'), 'tel')}${scalar('company.address', t('address'), 'text')}
        ${scalar('currency', t('currency'), 'text')}${scalar('margin', t('defaultMargin'))}${scalar('vat', t('vat'))}${scalar('rate', t('exchangeRate') + ' (LBP)')}
      </div></div>

      <div class="card set-sec"><h3>${ic('wallet')} ${t('expenseCategories')}</h3>
        <p class="muted" style="margin-top:0;font-size:13px">${t('categoriesHint')}</p>
        <div class="table-wrap ptable"><table class="t"><thead><tr><th>${t('name')} (عربي / English)</th><th>${t('catGroup')}</th><th class="c">${t('quickEntry')}</th><th></th></tr></thead><tbody>
        ${S.categories.map((c, i) => `<tr><td><input class="input" data-cat="${i}" data-k="name" value="${esc(c.name)}"></td>
          <td><select class="input" data-cat="${i}" data-k="group"><option value="cogs" ${c.group === 'cogs' ? 'selected' : ''}>${t('cogs')}</option><option value="opex" ${c.group !== 'cogs' ? 'selected' : ''}>${t('opex')}</option></select></td>
          <td class="c"><input type="checkbox" data-cat="${i}" data-k="quick" ${c.quick ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--gold)"></td>
          <td class="r">${usedCat(c.id) ? '' : `<button class="btn btn-ghost btn-sm btn-icon btn-danger" data-rmcat="${i}">${ic('trash')}</button>`}</td></tr>`).join('')}
        </tbody></table></div><button class="btn btn-sm" style="margin-top:10px" id="addcat">${ic('plus')} ${t('addRow')}</button>
      </div>

      <div class="card set-sec"><h3>${ic('window')} ${t('aluPrices')}</h3>
        <div class="grid g3" style="margin-bottom:18px">${scalar('alu.barLength', t('barLength'))}${scalar('alu.waste', t('wastePct'))}${scalar('alu.netPrice', t('netPrice'))}</div>
        <div class="grid g2">
          <div><h4>${t('finishes')}</h4>${listTable('alu.finishes', [['name', t('name')], ['price', t('pricePerKg'), 'number']])}</div>
          <div><h4>${t('glassTypes')}</h4>${listTable('alu.glass', [['name', t('name')], ['price', t('pricePerM2'), 'number']])}</div>
        </div>
        <h4 style="margin-top:20px">${t('profiles')}</h4>${listTable('alu.profiles', [['name', t('name')], ['kg', t('kgPerM'), 'number']])}
        <h4 style="margin-top:20px">${t('systems')}</h4>
        <div class="table-wrap ptable"><table class="t"><thead><tr><th>${t('type')}</th><th>${MG.partName('frame')}</th><th>${MG.partName('sash')}</th><th>${MG.partName('mullion')}</th><th>${MG.partName('bead')}</th><th>${t('accPerSash')}</th><th>${t('laborM2')}</th></tr></thead><tbody>${sysRows}</tbody></table></div>
      </div>

      <div class="card set-sec"><h3>${ic('gate')} ${t('ironPrices')}</h3>
        <div class="grid g4" style="margin-bottom:18px">
          ${scalar('iron.steelPrice', t('steelPrice'))}${scalar('iron.sheetPrice', t('sheetPrice'))}${scalar('iron.labor', t('laborKg'))}${scalar('iron.paint', t('paintKg'))}
          ${scalar('iron.consumables', t('consumables') + ' %')}${scalar('iron.waste', t('wastePct'))}${scalar('iron.barLength', t('barLength'))}
        </div>
        <div class="grid g2">
          <div><h4>${t('profiles')}</h4>${listTable('iron.profiles', [['name', t('name')], ['kg', t('kgPerM'), 'number']])}</div>
          <div><h4>${t('roofTypes')}</h4>${listTable('iron.roofs', [['name', t('name')], ['price', t('pricePerM2'), 'number']])}</div>
        </div>
      </div>

      ${MG.can('users') ? `<div class="card set-sec"><h3>${ic('download')} ${t('backup')}</h3>
        <p class="muted" style="margin-top:0">${t('backupHint')}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-gold" id="ex">${ic('download')} ${t('exportData')}</button>
          <label class="btn">${ic('upload')} ${t('importData')}<input type="file" id="im" accept="application/json,.json" hidden></label>
          <button class="btn btn-danger" id="rp">${ic('undo')} ${t('resetPrices')}</button>
        </div>
      </div>` : ''}`;

    el.querySelectorAll('[data-path]').forEach(inp => inp.onchange = () => {
      set(inp.dataset.path, inp.type === 'number' ? (parseFloat(inp.value) || 0) : inp.value); MG.log('settings', inp.dataset.path + '=' + inp.value); MG.save(); MG.toast(t('saved'));
      if (inp.dataset.path.startsWith('company')) MG.renderShell();
    });
    el.querySelectorAll('[data-arr]').forEach(inp => inp.onchange = () => {
      get(inp.dataset.arr)[+inp.dataset.i][inp.dataset.k] = inp.type === 'number' ? (parseFloat(inp.value) || 0) : inp.value; MG.save(); MG.toast(t('saved'));
    });
    el.querySelectorAll('[data-sys]').forEach(inp => inp.onchange = () => {
      S.alu.systems[inp.dataset.sys][inp.dataset.k] = inp.type === 'number' ? (parseFloat(inp.value) || 0) : inp.value; MG.save(); MG.toast(t('saved'));
    });
    el.querySelectorAll('[data-addrow]').forEach(b => b.onclick = () => {
      const arr = get(b.dataset.addrow); arr.push({ id: MG.uid(), name: '', price: 0, kg: 0 }); MG.save(); MG.route();
    });
    el.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => MG.confirm(t('confirmDelete'), () => {
      get(b.dataset.rm).splice(+b.dataset.i, 1); MG.save(); MG.route();
    }));
    el.querySelectorAll('[data-cat]').forEach(inp => inp.onchange = () => {
      const c = S.categories[+inp.dataset.cat];
      c[inp.dataset.k] = inp.type === 'checkbox' ? inp.checked : inp.value;
      MG.log('settings.category', c.name); MG.save(); MG.toast(t('saved'));
    });
    el.querySelectorAll('[data-rmcat]').forEach(b => b.onclick = () => MG.confirm(t('confirmDelete'), () => { S.categories.splice(+b.dataset.rmcat, 1); MG.save(); MG.route(); }));
    el.querySelector('#addcat').onclick = () => { S.categories.push({ id: MG.uid(), name: '', group: 'opex', icon: 'wallet' }); MG.save(); MG.route(); };
    if (!MG.can('users')) return;
    el.querySelector('#ex').onclick = () => MG.download('majed-group-backup-' + MG.today() + '.json', JSON.stringify(MG.db, null, 1), 'application/json');
    el.querySelector('#im').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const d = JSON.parse(r.result);
          if (!d || !Array.isArray(d.projects) || !d.settings) throw new Error('bad');
          if (!confirm(t('importWarn'))) return;
          MG.migrate(d);
          if (!d.users.length) d.users = MG.db.users;
          localStorage.setItem('mg.db', JSON.stringify(d));
          MG.toast(t('imported')); setTimeout(() => location.reload(), 600);
        } catch (err) { MG.toast(t('badFile'), 'err'); }
      };
      r.readAsText(f);
    };
    el.querySelector('#rp').onclick = () => MG.confirm(t('resetPrices') + '?', () => {
      const d = MG.defaultSettings();
      S.alu = d.alu; S.iron = d.iron; MG.save(); MG.route();
    });
  };
})();
