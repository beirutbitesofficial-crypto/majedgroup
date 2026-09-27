/* Majed Group — expenses (easy entry, fixed monthly costs) and the quick-entry panel */
(function () {
  const t = MG.t, ic = MG.ic, esc = MG.esc, money = MG.money;
  const N = v => parseFloat(v) || 0;

  const catOptions = sel => {
    const cats = MG.db.settings.categories;
    const grp = g => cats.filter(c => c.group === g).map(c => `<option value="${esc(c.id)}" ${c.id === sel ? 'selected' : ''}>${esc(MG.nm(c.name))}</option>`).join('');
    return `<select class="input" name="category"><optgroup label="${esc(t('cogs'))}">${grp('cogs')}</optgroup><optgroup label="${esc(t('opex'))}">${grp('opex')}</optgroup></select>`;
  };

  /* ---------- Expense form ---------- */
  MG.expenseForm = function (ex) {
    ex = ex || {};
    const isNew = !ex.id;
    const d = Object.assign({ date: MG.today(), category: 'material', amount: '', note: '', projectId: '', supplierId: '', accountId: MG.db.accounts[0].id, paid: true, ref: '' }, ex);
    if (!isNew && !MG.guardDate(d.date)) return;
    const cat = MG.getCategory(d.category);
    const projOpts = [['', t('general')]].concat(MG.db.projects.filter(p => p.status !== 'cancelled' || p.id === d.projectId).map(p => [p.id, p.code + ' — ' + (p.name || MG.clientName(p))]));
    const supOpts = [['', '—']].concat(MG.db.suppliers.map(s => [s.id, s.name])).concat([['__new', t('newSupplier') + '…']]);
    const m = MG.modal((isNew ? t('addExpense') : t('edit')) + ' · ' + esc(MG.nm(cat.name)), `<div class="grid g2">
      ${MG.fld(t('category'), catOptions(d.category), 'span2')}
      ${MG.fld(t('amount'), MG.moneyInp('amount', isNew ? d.amount : (d.cur === 'LBP' ? d.orig : d.amount), d.cur))}
      ${MG.fld(t('date'), MG.inp('date', d.date, 'date'))}
      <div class="span2 seg-ctl" id="pd" style="display:flex"><button type="button" data-v="1" class="${d.paid !== false ? 'on' : ''}" style="flex:1">${ic('cash')} ${t('paidNow')}</button><button type="button" data-v="0" class="${d.paid === false ? 'on' : ''}" style="flex:1">${ic('clock')} ${t('onCredit')}</button></div>
      <div class="field" id="accf">${`<label>${t('cashAccount')}</label>` + MG.sel('accountId', MG.accountOpts(), d.accountId)}</div>
      ${MG.fld(t('supplier'), MG.sel('supplierId', supOpts, d.supplierId || ''))}
      ${MG.fld(t('project'), MG.sel('projectId', projOpts, d.projectId || ''), 'span2')}
      ${MG.fld(t('invoiceRef'), MG.inp('ref', d.ref))}
      ${MG.fld(t('notes'), MG.inp('note', d.note))}
      <p class="muted span2" id="hint" style="font-size:12.5px;margin:0"></p></div>`,
      `<button class="btn" data-close>${t('cancel')}</button><button class="btn btn-gold" id="ok">${t('save')}</button>`);
    let paid = d.paid !== false;
    const upd = () => {
      m.querySelector('#accf').style.display = paid ? '' : 'none';
      m.querySelector('#hint').textContent = paid ? '' : t('creditHint');
    };
    m.querySelectorAll('#pd button').forEach(b => b.onclick = () => { paid = b.dataset.v === '1'; m.querySelectorAll('#pd button').forEach(x => x.classList.toggle('on', x === b)); upd(); });
    m.querySelector('[name=supplierId]').onchange = e => {
      if (e.target.value !== '__new') return;
      const name = prompt(t('newSupplier'));
      if (!name || !name.trim()) { e.target.value = ''; return; }
      const s = { id: MG.uid(), name: name.trim(), phone: '', kind: '', notes: '', opening: 0, created: Date.now() };
      MG.db.suppliers.push(s);
      const o = document.createElement('option'); o.value = s.id; o.textContent = s.name; e.target.insertBefore(o, e.target.lastElementChild); e.target.value = s.id;
    };
    m.querySelector('[name=category]').onchange = e => { m.querySelector('.modal-h h2').textContent = (isNew ? t('addExpense') : t('edit')) + ' · ' + MG.nm(MG.getCategory(e.target.value).name); };
    upd();
    m.querySelector('[data-close]').onclick = () => MG.closeModal();
    m.querySelector('#ok').onclick = () => {
      const v = MG.formData(m), amt = MG.readMoney(v, 'amount');
      if (!(amt.usd > 0)) { MG.toast(t('enterAmount'), 'err'); return; }
      if (!paid && !v.supplierId) { MG.toast(t('creditNeedsSupplier'), 'err'); return; }
      if (!MG.guardDate(v.date)) return;
      const rec = { date: v.date || MG.today(), category: v.category, amount: amt.usd, orig: amt.orig, cur: amt.cur, rate: amt.rate, paid,
        accountId: v.accountId, supplierId: v.supplierId === '__new' ? null : (v.supplierId || null), projectId: v.projectId || null, ref: v.ref, note: v.note };
      if (isNew) {
        const x = Object.assign({ id: MG.uid(), by: MG.user.username, recurringId: ex.recurringId || null }, rec);
        MG.db.expenses.push(x);
        MG.log('expense.add', MG.nm(MG.getCategory(x.category).name) + ' ' + money(x.amount));
      } else {
        const x = MG.db.expenses.find(y => y.id === ex.id);
        Object.assign(x, rec);
        MG.log('expense.edit', MG.nm(MG.getCategory(x.category).name) + ' ' + money(x.amount));
      }
      MG.save(); MG.closeModal(); MG.toast(t('saved')); MG.route();
    };
  };

  MG.expenseTable = function (list, showProject) {
    if (!list.length) return '<p class="muted">—</p>';
    const total = list.reduce((s, x) => s + N(x.amount), 0);
    return `<div class="table-wrap"><table class="t"><thead><tr><th>${t('date')}</th><th>${t('category')}</th>${showProject ? `<th>${t('project')}</th>` : ''}<th>${t('supplier')}</th><th>${t('notes')}</th><th>${t('payment')}</th><th class="r">${t('amount')}</th><th></th></tr></thead><tbody>
      ${list.map(x => { const p = x.projectId && MG.getProject(x.projectId), s = x.supplierId && MG.getSupplier(x.supplierId), c = MG.getCategory(x.category || 'other');
        return `<tr><td class="num">${esc(x.date)}</td><td><span class="cat-dot ${c.group}"></span>${esc(MG.nm(c.name))}</td>
        ${showProject ? `<td>${p ? `<a href="#/project/${p.id}/finance">${esc(p.code)}</a>` : `<span class="muted">${t('general')}</span>`}</td>` : ''}
        <td>${s ? `<a href="#/supplier/${s.id}">${esc(s.name)}</a>` : ''}</td><td>${esc(x.note || '')}${x.ref ? ` <span class="muted num">#${esc(x.ref)}</span>` : ''}</td>
        <td>${x.paid === false ? `<span class="tag pay-unpaid">${t('onCredit')}</span>` : esc(MG.nm((MG.getAccount(x.accountId) || {}).name || ''))}</td>
        <td class="r money">${money(x.amount)}${x.cur === 'LBP' ? `<div class="muted num" style="font-size:11px">${MG.fmt(x.orig, 0)} ل.ل</div>` : ''}</td>
        <td class="r" style="white-space:nowrap"><button class="btn btn-ghost btn-sm btn-icon" data-ee="${x.id}">${ic('edit')}</button>${MG.can('delete') ? `<button class="btn btn-ghost btn-sm btn-icon btn-danger" data-de="${x.id}">${ic('trash')}</button>` : ''}</td></tr>`; }).join('')}
      </tbody><tfoot><tr><td colspan="${showProject ? 6 : 5}">${t('total')}</td><td class="r money">${money(total)}</td><td></td></tr></tfoot></table></div>`;
  };
  MG.bindExpenseTable = function (root) {
    root.querySelectorAll('[data-de]').forEach(b => b.onclick = () => {
      const x = MG.db.expenses.find(y => y.id === b.dataset.de);
      if (!MG.guardDate(x.date)) return;
      MG.confirm(t('confirmDelete'), () => {
        MG.db.expenses = MG.db.expenses.filter(y => y !== x);
        MG.log('expense.delete', MG.nm(MG.getCategory(x.category).name) + ' ' + money(x.amount) + ' ' + x.date); MG.save(); MG.route();
      });
    });
    root.querySelectorAll('[data-ee]').forEach(b => b.onclick = () => MG.expenseForm(MG.db.expenses.find(x => x.id === b.dataset.ee)));
  };

  /* ---------- Fixed monthly costs (rent, generator, internet…) ---------- */
  MG.recurringDue = function () {
    const ym = MG.today().slice(0, 7);
    return MG.db.recurring.filter(r => r.active !== false && !MG.db.expenses.some(x => x.recurringId === r.id && (x.date || '').startsWith(ym)));
  };
  MG.recurringDueHtml = function (list) {
    return `<div class="totals">${list.map(r => `<div class="trow" style="align-items:center"><span>${esc(MG.nm(MG.getCategory(r.category).name))}${r.note ? ` <span class="muted">· ${esc(r.note)}</span>` : ''}
      <div class="muted" style="font-size:12px">${t('dueDay')} ${r.day || 1}</div></span>
      <span style="display:flex;gap:8px;align-items:center"><span class="money">${money(r.amount, 0)}</span><button class="btn btn-sm btn-gold" data-rec="${r.id}">${ic('check')} ${t('record')}</button></span></div>`).join('')}</div>`;
  };
  MG.bindRecurring = function (root) {
    root.querySelectorAll('[data-rec]').forEach(b => b.onclick = () => {
      const r = MG.db.recurring.find(x => x.id === b.dataset.rec);
      const ym = MG.today().slice(0, 7), day = String(Math.min(28, Math.max(1, r.day || 1))).padStart(2, '0');
      const date = (ym + '-' + day) > MG.today() ? MG.today() : ym + '-' + day;
      MG.expenseForm({ category: r.category, amount: r.amount, accountId: r.accountId || MG.db.accounts[0].id, note: r.note, date, recurringId: r.id, supplierId: r.supplierId || '' });
    });
  };
  MG.recurringForm = function (r) {
    const isNew = !r;
    const d = r || { category: 'rent', amount: '', day: 1, accountId: MG.db.accounts[0].id, note: '', active: true };
    const m = MG.modal(t('fixedCost'), `<div class="grid g2">
      ${MG.fld(t('category'), catOptions(d.category), 'span2')}
      ${MG.fld(t('amount') + ' ($)', MG.inp('amount', d.amount, 'number'))}
      ${MG.fld(t('dueDay'), MG.inp('day', d.day, 'number', 'min="1" max="28"'))}
      ${MG.fld(t('cashAccount'), MG.sel('accountId', MG.accountOpts(), d.accountId))}
      ${MG.fld(t('notes'), MG.inp('note', d.note, 'text', `placeholder="${MG.lang === 'ar' ? 'مثال: أجار المحل – صاحب الملك' : 'e.g. Shop rent – landlord'}"`))}
      <label class="check span2"><input type="checkbox" name="active" ${d.active !== false ? 'checked' : ''}> ${t('activeWorker')}</label></div>`,
      `${!isNew ? `<button class="btn btn-danger" id="rm" style="margin-inline-end:auto">${ic('trash')}</button>` : ''}<button class="btn" data-close>${t('cancel')}</button><button class="btn btn-gold" id="ok">${t('save')}</button>`);
    m.querySelector('[data-close]').onclick = () => MG.closeModal();
    const rm = m.querySelector('#rm'); if (rm) rm.onclick = () => { MG.db.recurring = MG.db.recurring.filter(x => x !== r); MG.save(); MG.closeModal(); MG.route(); };
    m.querySelector('#ok').onclick = () => {
      const v = MG.formData(m);
      if (!(v.amount > 0)) { MG.toast(t('enterAmount'), 'err'); return; }
      if (isNew) MG.db.recurring.push(Object.assign({ id: MG.uid() }, v)); else Object.assign(r, v);
      MG.save(); MG.closeModal(); MG.toast(t('saved')); MG.route();
    };
  };

  /* ---------- Quick entry ---------- */
  MG.canQuick = () => MG.can('expenses') || MG.can('payments.receive');
  MG.quickTiles = function (compact) {
    const tiles = [];
    if (MG.can('payments.receive')) tiles.push(['pay', 'cash', t('qReceive'), 'gold']);
    if (MG.can('expenses')) MG.db.settings.categories.filter(c => c.quick).forEach(c => tiles.push(['exp:' + c.id, c.icon || 'wallet', MG.nm(c.name)]));
    if (MG.can('workers') && !(MG.can('expenses') && MG.getCategory('salary').quick)) tiles.push(['wage', 'hardhat', t('payWage')]);
    if (!compact) {
      if (MG.can('workers')) tiles.push(['adv', 'coins', t('giveAdvance')]);
      if (MG.can('suppliers')) { tiles.push(['purchase', 'box', t('recordPurchase')]); tiles.push(['suppay', 'truck', t('paySupplier')]); }
      if (MG.can('expenses')) tiles.push(['exp:', 'wallet', t('otherExpense')]);
      if (MG.can('accounting')) { tiles.push(['transfer', 'swap', t('transfer2')]); tiles.push(['drawing', 'user', t('eq_drawing')]); tiles.push(['capital', 'bank', t('eq_capital')]); }
      if (MG.can('projects.edit')) tiles.push(['project', 'folder', t('newProject')]);
    }
    return `<div class="qtiles ${compact ? 'compact' : ''}">${tiles.map(x => `<button class="qtile ${x[3] || ''}" data-q="${x[0]}">${ic(x[1])}<span>${esc(x[2])}</span></button>`).join('')}</div>`;
  };
  MG.bindQuickTiles = function (root) {
    root.querySelectorAll('[data-q]').forEach(b => b.onclick = () => {
      const q = b.dataset.q;
      MG.closeModal();
      if (q === 'pay') MG.paymentForm({});
      else if (q === 'wage') MG.wageForm({});
      else if (q === 'adv') MG.advanceForm({});
      else if (q === 'purchase') MG.expenseForm({ category: 'material', paid: false });
      else if (q === 'suppay') MG.supplierPayForm({});
      else if (q === 'transfer') MG.transferForm();
      else if (q === 'drawing' || q === 'capital') MG.equityForm(q);
      else if (q === 'project') MG.projectForm();
      else if (q.startsWith('exp:')) {
        const cat = q.slice(4);
        if (cat === 'salary' && MG.can('workers') && MG.db.workers.some(w => w.active !== false)) MG.wageForm({});
        else MG.expenseForm(cat ? { category: cat } : {});
      }
    });
  };
  MG.quickAdd = function () {
    const m = MG.modal(t('quickEntry'), MG.quickTiles(false), '', { noFocus: true });
    MG.bindQuickTiles(m);
  };

  /* ---------- Expenses page ---------- */
  const ef = { month: MG.today().slice(0, 7), cat: '', q: '' };
  MG.views.expenses = function (el) {
    const list = MG.db.expenses.filter(x => (!ef.month || (x.date || '').startsWith(ef.month)) && (!ef.cat || x.category === ef.cat) &&
      (!ef.q || [x.note, x.ref, (MG.getSupplier(x.supplierId) || {}).name].join(' ').toLowerCase().includes(ef.q.toLowerCase())))
      .sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
    const wages = MG.db.payroll.filter(x => x.type !== 'advance' && (!ef.month || (x.date || '').startsWith(ef.month)));
    const byCat = {};
    list.forEach(x => { byCat[x.category] = (byCat[x.category] || 0) + N(x.amount); });
    if (!ef.cat || ef.cat === 'salary') wages.forEach(x => { const k = x.projectId ? 'labor' : 'salary'; if (!ef.cat || ef.cat === k) byCat[k] = (byCat[k] || 0) + N(x.amount); });
    const total = Object.values(byCat).reduce((s, v) => s + v, 0), max = Math.max(1, ...Object.values(byCat));
    const due = MG.recurringDue();
    el.innerHTML = MG.page(t('expenses'), `${ef.month ? MG.monthNames()[+ef.month.slice(5) - 1] + ' ' + ef.month.slice(0, 4) : t('all')} · <span class="money">${money(total, 0)}</span>`,
      `<input type="month" class="input" id="mf" value="${ef.month}" style="width:auto">
       <button class="btn" id="csv">${ic('download')} CSV</button>
       <button class="btn btn-gold" id="ae">${ic('plus')} ${t('addExpense')}</button>`) + `
      <div class="card" style="margin-bottom:18px"><div class="card-h"><h3>${t('quickEntry')}</h3><span class="muted" style="font-size:13px">${t('quickHint')}</span></div>${MG.quickTiles(true)}</div>
      <div class="two-col" style="margin-bottom:18px">
        <div class="card"><div class="card-h"><h3>${t('expensesByCat')}</h3>
          <select class="input" id="cf" style="width:auto;min-height:36px;padding:6px 10px"><option value="">${t('all')}</option>${MG.db.settings.categories.map(c => `<option value="${c.id}" ${ef.cat === c.id ? 'selected' : ''}>${esc(MG.nm(c.name))}</option>`).join('')}</select></div>
          ${Object.keys(byCat).length ? `<div class="bd">${Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="bd-row"><span>${esc(MG.nm(MG.getCategory(k).name))}</span><div class="bd-bar"><i style="width:${v / max * 100}%;background:var(--iron)"></i></div><span class="money">${money(v, 0)}</span></div>`).join('')}
          <div class="trow big" style="display:flex;justify-content:space-between;margin-top:8px"><span>${t('total')}</span><span class="money">${money(total)}</span></div></div>` : '<p class="muted">—</p>'}
          ${wages.length ? `<p class="muted" style="font-size:12.5px;margin:12px 0 0">${t('wagesIncluded')} <a href="#/workers">${t('workers')}</a></p>` : ''}
        </div>
        <div class="card"><div class="card-h"><h3>${t('fixedCosts')}</h3><button class="btn btn-sm" id="nr">${ic('plus')} ${t('add')}</button></div>
          ${due.length ? `<div class="alert">${ic('alert')} ${t('fixedDue')}</div>${MG.recurringDueHtml(due)}` : ''}
          ${MG.db.recurring.length ? `<div class="totals" style="margin-top:12px">${MG.db.recurring.map(r => `<div class="trow" style="cursor:pointer;${r.active === false ? 'opacity:.5' : ''}" data-er="${r.id}"><span>${esc(MG.nm(MG.getCategory(r.category).name))} ${r.note ? `<span class="muted">· ${esc(r.note)}</span>` : ''}</span><span class="money">${money(r.amount, 0)} <span class="muted">/ ${t('month')}</span></span></div>`).join('')}</div>`
            : `<p class="muted" style="margin:0">${t('fixedHint')}</p>`}
        </div>
      </div>
      <div class="filters"><div class="search">${ic('search')}<input class="input" id="q" placeholder="${t('search')}" value="${esc(ef.q)}"></div></div>
      <div class="card">${MG.expenseTable(list, true)}</div>`;
    el.querySelector('#ae').onclick = () => MG.expenseForm();
    el.querySelector('#nr').onclick = () => MG.recurringForm();
    el.querySelector('#mf').onchange = e => { ef.month = e.target.value; MG.route(); };
    el.querySelector('#cf').onchange = e => { ef.cat = e.target.value; MG.route(); };
    el.querySelector('#q').onchange = e => { ef.q = e.target.value; MG.route(); };
    el.querySelectorAll('[data-er]').forEach(r => r.onclick = () => MG.recurringForm(MG.db.recurring.find(x => x.id === r.dataset.er)));
    el.querySelector('#csv').onclick = () => MG.downloadCsv('majed-expenses-' + (ef.month || 'all') + '.csv',
      [['date', 'category', 'group', 'amount_usd', 'original', 'currency', 'paid', 'account', 'supplier', 'project', 'invoice', 'note']].concat(list.map(x => {
        const c = MG.getCategory(x.category);
        return [x.date, MG.nm(c.name), c.group, N(x.amount).toFixed(2), x.orig || x.amount, x.cur || 'USD', x.paid === false ? 'credit' : 'paid', MG.nm((MG.getAccount(x.accountId) || {}).name || ''),
          (MG.getSupplier(x.supplierId) || {}).name || '', (MG.getProject(x.projectId) || {}).code || '', x.ref || '', x.note || ''];
      })));
    MG.bindQuickTiles(el); MG.bindRecurring(el); MG.bindExpenseTable(el);
  };
})();
