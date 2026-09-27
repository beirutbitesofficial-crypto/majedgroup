/* Majed Group — customers (who paid / partly paid / not paid), suppliers and workers */
(function () {
  const t = MG.t, ic = MG.ic, esc = MG.esc, money = MG.money;
  const N = v => parseFloat(v) || 0;

  const waLink = (phone, msg) => {
    let d = String(phone || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.startsWith('00')) d = d.slice(2);
    else if (d.startsWith('0')) d = '961' + d.slice(1);
    else if (d.length <= 8) d = '961' + d;
    return 'https://wa.me/' + d + '?text=' + encodeURIComponent(msg);
  };
  const reminderMsg = (c, bal) => MG.lang === 'ar'
    ? `مرحباً ${c.name}، نذكّركم بأن الرصيد المتبقي لدى ${MG.db.settings.company.nameAr || MG.db.settings.company.name} هو ${money(bal)}. شكراً لتعاملكم معنا.`
    : `Hello ${c.name}, a friendly reminder that your outstanding balance with ${MG.db.settings.company.name} is ${money(bal)}. Thank you.`;

  function statementTable(rows, opening, debitLabel, creditLabel) {
    if (!rows.length && !opening) return '<p class="muted">—</p>';
    let html = `<div class="table-wrap"><table class="t"><thead><tr><th>${t('date')}</th><th>${t('ref')}</th><th>${t('description')}</th><th class="r">${debitLabel}</th><th class="r">${creditLabel}</th><th class="r">${t('runningBalance')}</th></tr></thead><tbody>`;
    if (opening) html += `<tr><td></td><td></td><td class="muted">${t('openingBal')}</td><td></td><td></td><td class="r money">${money(opening)}</td></tr>`;
    html += rows.map(r => `<tr><td class="num">${esc(r.date)}</td><td class="num muted">${esc(r.ref)}</td><td>${esc(r.desc)}</td>
      <td class="r money">${r.dr ? money(r.dr) : ''}</td><td class="r money">${r.cr ? money(r.cr) : ''}</td><td class="r money"><b>${money(r.bal)}</b></td></tr>`).join('');
    const dr = rows.reduce((s, r) => s + r.dr, 0), cr = rows.reduce((s, r) => s + r.cr, 0);
    html += `</tbody><tfoot><tr><td colspan="3">${t('total')}</td><td class="r money">${money(dr)}</td><td class="r money">${money(cr)}</td><td class="r money">${money(rows.length ? rows[rows.length - 1].bal : opening)}</td></tr></tfoot></table></div>`;
    return html;
  }
  MG.statementTable = statementTable;

  /* ======================= CUSTOMERS ======================= */
  MG.totalReceivable = () => MG.db.customers.reduce((s, c) => s + Math.max(0, MG.customerAccount(c.id).balance), 0);

  MG.customerSummaryHtml = function () {
    const g = { paid: [0, 0], partial: [0, 0], unpaid: [0, 0], overdue: [0, 0] };
    MG.db.customers.forEach(c => {
      const a = MG.customerAccount(c.id);
      if (g[a.status]) { g[a.status][0]++; g[a.status][1] += a.balance; }
      if (a.overdue) { g.overdue[0]++; g.overdue[1] += a.balance; }
    });
    return `<div class="stat-tiles">${['paid', 'partial', 'unpaid', 'overdue'].map(k => `<a class="stat-tile st-${k}" href="#/customers" data-cf="${k}">
      <div class="st-n num">${g[k][0]}</div><div class="st-l">${t('pay_' + k)}</div>${k !== 'paid' ? `<div class="st-v money">${money(g[k][1], 0)}</div>` : '<div class="st-v">&nbsp;</div>'}</a>`).join('')}</div>`;
  };
  document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('[data-cf]'); if (a) cf.status = a.dataset.cf; });

  const cf = { q: '', status: 'all' };
  MG.views.customers = function (el) {
    const rows = MG.db.customers.map(c => ({ c, a: MG.customerAccount(c.id), n: MG.db.projects.filter(p => p.customerId === c.id).length }));
    const cnt = k => rows.filter(r => k === 'all' ? true : k === 'overdue' ? r.a.overdue : r.a.status === k).length;
    const sum = k => rows.filter(r => k === 'all' ? true : k === 'overdue' ? r.a.overdue : r.a.status === k).reduce((s, r) => s + Math.max(0, r.a.balance), 0);
    el.innerHTML = MG.page(t('customers'), `${rows.length} ${t('customers')} · ${t('outstanding')}: <span class="money">${money(sum('all'), 0)}</span>`,
      `${MG.can('payments.receive') ? `<button class="btn" id="rp">${ic('cash')} ${t('addPayment')}</button>` : ''}
       <button class="btn" id="pl">${ic('print')} ${t('print')}</button>
       <button class="btn btn-gold" id="nc">${ic('plus')} ${t('newCustomer')}</button>`) + `
      <div class="stat-tiles big" id="tiles">${['all', 'paid', 'partial', 'unpaid', 'overdue'].map(k => `<button class="stat-tile st-${k} ${cf.status === k ? 'on' : ''}" data-k="${k}">
        <div class="st-n num">${cnt(k)}</div><div class="st-l">${k === 'all' ? t('all') : t('pay_' + k)}</div><div class="st-v money">${k === 'paid' ? '' : money(sum(k), 0)}</div></button>`).join('')}</div>
      <div class="filters"><div class="search">${ic('search')}<input class="input" id="q" placeholder="${t('search')}" value="${esc(cf.q)}"></div></div>
      <div id="list"></div>`;
    const draw = () => {
      const q = cf.q.trim().toLowerCase();
      const list = rows.filter(r => (cf.status === 'all' || (cf.status === 'overdue' ? r.a.overdue : r.a.status === cf.status)) &&
        (!q || (r.c.name + ' ' + (r.c.phone || '') + ' ' + (r.c.address || '')).toLowerCase().includes(q)))
        .sort((a, b) => b.a.balance - a.a.balance);
      el.querySelector('#list').innerHTML = list.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>${t('client')}</th><th>${t('phone')}</th><th>${t('projects')}</th>
        <th class="r">${t('invoiced')}</th><th class="r">${t('paid')}</th><th class="r">${t('balance')}</th><th>${t('status')}</th><th></th></tr></thead><tbody>
        ${list.map(({ c, a, n }) => `<tr data-cid="${c.id}" style="cursor:pointer"><td><b>${esc(c.name)}</b>${a.overdue ? ` <span class="tag pay-overdue">${t('pay_overdue')}</span>` : ''}</td>
          <td class="num">${esc(c.phone || '')}</td><td class="num">${n}</td><td class="r money">${money(a.invoiced, 0)}</td><td class="r money">${money(a.paid, 0)}</td>
          <td class="r money"><b class="${a.balance > 0.5 ? 'neg' : a.balance < -0.5 ? 'pos' : ''}">${money(a.balance, 0)}</b></td><td>${MG.payTag(a.status === 'none' ? null : a.status)}</td>
          <td class="r">${a.balance > 0.5 && c.phone ? `<a class="btn btn-ghost btn-sm btn-icon wa" href="${waLink(c.phone, reminderMsg(c, a.balance))}" target="_blank" rel="noopener" title="WhatsApp" data-stop>${ic('phone')}</a>` : ''}</td></tr>`).join('')}
        </tbody></table></div>` : `<div class="card empty">${ic('users')}<p>${MG.db.customers.length ? '—' : t('noCustomers')}</p></div>`;
      el.querySelectorAll('[data-cid]').forEach(r => r.onclick = e => { if (!e.target.closest('[data-stop]')) MG.go('#/customer/' + r.dataset.cid); });
    };
    el.querySelectorAll('#tiles [data-k]').forEach(b => b.onclick = () => { cf.status = b.dataset.k; el.querySelectorAll('#tiles [data-k]').forEach(x => x.classList.toggle('on', x === b)); draw(); });
    el.querySelector('#q').oninput = e => { cf.q = e.target.value; draw(); };
    el.querySelector('#nc').onclick = () => MG.customerForm();
    const rp = el.querySelector('#rp'); if (rp) rp.onclick = () => MG.paymentForm({});
    el.querySelector('#pl').onclick = () => MG.print(`<div class="q">${MG.docHeader(t('receivablesReport'), '', MG.today())}
      <table><thead><tr><th>${t('client')}</th><th>${t('phone')}</th><th class="r">${t('invoiced')}</th><th class="r">${t('paid')}</th><th class="r">${t('balance')}</th><th>${t('status')}</th></tr></thead><tbody>
      ${rows.filter(r => r.a.status !== 'none').sort((a, b) => b.a.balance - a.a.balance).map(({ c, a }) => `<tr><td>${esc(c.name)}</td><td class="num">${esc(c.phone || '')}</td><td class="r money">${money(a.invoiced)}</td><td class="r money">${money(a.paid)}</td><td class="r money"><b>${money(a.balance)}</b></td><td>${t('pay_' + a.status)}${a.overdue ? ' · ' + t('pay_overdue') : ''}</td></tr>`).join('')}
      </tbody></table><div class="q-tot"><div class="g"><span>${t('outstanding')}</span><span class="money">${money(sum('all'))}</span></div></div></div>`);
    draw();
  };

  MG.customerForm = function (c, onSaved) {
    const isNew = !c;
    const d = c || { name: '', phone: '', address: '', notes: '', opening: 0 };
    const m = MG.modal(isNew ? t('newCustomer') : t('edit'), `<div class="grid g2">
      ${MG.fld(t('fullName'), MG.inp('name', d.name), 'span2')}
      ${MG.fld(t('phone'), MG.inp('phone', d.phone, 'tel'))}
      ${MG.fld(t('address'), MG.inp('address', d.address))}
      ${MG.can('accounting') ? MG.fld(t('openingDebt'), MG.inp('opening', d.opening || '', 'number'), 'span2') : ''}
      ${MG.fld(t('notes'), `<textarea class="input" name="notes">${esc(d.notes || '')}</textarea>`, 'span2')}</div>`,
      `<button class="btn" data-close>${t('cancel')}</button><button class="btn btn-gold" id="ok">${t('save')}</button>`);
    m.querySelector('[data-close]').onclick = () => MG.closeModal();
    m.querySelector('#ok').onclick = () => {
      const v = MG.formData(m);
      if (!v.name.trim()) return;
      if (v.opening === '' || v.opening == null) v.opening = d.opening || 0;
      const dup = MG.db.customers.find(x => x.name.trim().toLowerCase() === v.name.trim().toLowerCase() && x !== c);
      if (dup) { MG.toast(t('duplicateName'), 'err'); return; }
      let obj;
      if (isNew) { obj = Object.assign({ id: MG.uid(), created: Date.now() }, v); MG.db.customers.push(obj); }
      else { Object.assign(c, v); obj = c; MG.db.projects.forEach(p => { if (p.customerId === c.id) p.client = c.name; }); }
      MG.log(isNew ? 'customer.create' : 'customer.edit', obj.name);
      MG.save(); MG.closeModal(); MG.toast(t('saved'));
      if (onSaved) onSaved(obj); else if (isNew) MG.go('#/customer/' + obj.id); else MG.route();
    };
  };

  MG.views.customer = function (el, id) {
    const c = MG.getCustomer(id);
    if (!c) { MG.go('#/customers'); return; }
    const a = MG.customerAccount(c.id);
    const projects = MG.db.projects.filter(p => p.customerId === c.id);
    const pays = MG.db.payments.filter(x => x.customerId === c.id).sort((x, y) => x.date < y.date ? 1 : -1);
    const L = MG.ledger('ar', '', '', { t: 'customer', id: c.id });
    el.innerHTML = MG.page(esc(c.name), `${c.phone ? `<a class="num" href="tel:${esc(c.phone)}">${esc(c.phone)}</a>` : ''} ${c.address ? ' · ' + esc(c.address) : ''}`,
      `${a.balance > 0.5 && c.phone ? `<a class="btn" target="_blank" rel="noopener" href="${waLink(c.phone, reminderMsg(c, a.balance))}">${ic('phone')} ${t('whatsappReminder')}</a>` : ''}
       <button class="btn" id="ps">${ic('print')} ${t('statement')}</button>
       <button class="btn" id="ed">${ic('edit')} ${t('edit')}</button>
       ${MG.can('payments.receive') ? `<button class="btn btn-gold" id="rp">${ic('cash')} ${t('addPayment')}</button>` : ''}`).replace('<div class="topbar">', `<a href="#/customers" class="back">${ic('back')} ${t('customers')}</a><div class="topbar">`) + `
      <div class="kpis">
        ${MG.kpi(t('invoiced'), money(a.invoiced, 0), `${projects.length} ${t('projects')}`, 'doc', true)}
        ${MG.kpi(t('paid'), money(a.paid, 0), a.invoiced ? Math.round(a.paid / a.invoiced * 100) + '%' : '', 'cash')}
        ${MG.kpi(t('balance'), `<span class="${a.balance > 0.5 ? 'neg' : 'pos'}">${money(a.balance, 0)}</span>`, a.balance < -0.5 ? t('customerCredit') : '', 'clock')}
        ${MG.kpi(t('status'), MG.payTag(a.status === 'none' ? null : a.status) || '—', a.overdue ? `<span class="neg">${t('pay_overdue')}</span>` : '', 'shield')}
      </div>
      <div class="two-col">
        <div class="cards">
          <div class="card"><div class="card-h"><h3>${t('statement')}</h3></div>${statementTable(L.rows, L.opening, t('debit'), t('credit'))}</div>
          <div class="card"><div class="card-h"><h3>${t('payments')}</h3></div>${MG.paymentTable(pays, {})}</div>
        </div>
        <div class="cards"><div class="card"><div class="card-h"><h3>${t('projects')}</h3>${MG.can('projects.edit') ? `<button class="btn btn-sm" id="np">${ic('plus')} ${t('newProject')}</button>` : ''}</div>
          ${projects.length ? `<div class="plist">${projects.map(MG.projectRow).join('')}</div>` : '<p class="muted">—</p>'}</div>
          ${c.notes ? `<div class="card"><div class="card-h"><h3>${t('notes')}</h3></div><p style="margin:0;white-space:pre-wrap">${esc(c.notes)}</p></div>` : ''}
          ${MG.can('delete') && !projects.length && !pays.length ? `<button class="btn btn-danger" id="del">${ic('trash')} ${t('delete')}</button>` : ''}
        </div></div>`;
    el.querySelector('#ed').onclick = () => MG.customerForm(c);
    const rp = el.querySelector('#rp'); if (rp) rp.onclick = () => MG.paymentForm({ customer: c });
    const np = el.querySelector('#np'); if (np) np.onclick = () => MG.projectForm(null, null, c);
    const del = el.querySelector('#del'); if (del) del.onclick = () => MG.confirm(t('confirmDelete'), () => { MG.db.customers = MG.db.customers.filter(x => x !== c); MG.log('customer.delete', c.name); MG.save(); MG.go('#/customers'); });
    el.querySelectorAll('[data-pid]').forEach(r => r.onclick = () => MG.go('#/project/' + r.dataset.pid));
    MG.bindPaymentTable(el);
    el.querySelector('#ps').onclick = () => MG.print(`<div class="q">${MG.docHeader(t('statement'), '', MG.today())}
      <div class="q-info"><div><b>${t('client')}:</b>${esc(c.name)}</div><div><b>${t('phone')}:</b><span class="num">${esc(c.phone || '')}</span></div></div>
      ${statementTable(L.rows, L.opening, t('debit'), t('credit')).replace(/class="table-wrap"/, '')}
      <div class="q-tot"><div><span>${t('invoiced')}</span><span class="money">${money(a.invoiced)}</span></div><div><span>${t('paid')}</span><span class="money">${money(a.paid)}</span></div>
      <div class="g"><span>${t('balance')}</span><span class="money">${money(a.balance)}</span></div></div></div>`);
  };

  /* ======================= SUPPLIERS ======================= */
  MG.views.suppliers = function (el) {
    const rows = MG.db.suppliers.map(s => ({ s, a: MG.supplierAccount(s.id) })).sort((x, y) => y.a.balance - x.a.balance);
    const owed = rows.reduce((s, r) => s + Math.max(0, r.a.balance), 0);
    el.innerHTML = MG.page(t('suppliers'), `${t('weOwe')}: <span class="money">${money(owed, 0)}</span>`,
      `<button class="btn" id="pp">${ic('cash')} ${t('paySupplier')}</button><button class="btn" id="pu">${ic('box')} ${t('recordPurchase')}</button>
       <button class="btn btn-gold" id="ns">${ic('plus')} ${t('newSupplier')}</button>`) +
      (rows.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>${t('supplier')}</th><th>${t('phone')}</th><th class="r">${t('purchasesCredit')}</th><th class="r">${t('purchasesCash')}</th><th class="r">${t('paid')}</th><th class="r">${t('weOwe')}</th></tr></thead><tbody>
        ${rows.map(({ s, a }) => `<tr data-sid="${s.id}" style="cursor:pointer"><td><b>${esc(s.name)}</b>${s.kind ? ` <span class="muted">· ${esc(s.kind)}</span>` : ''}</td><td class="num">${esc(s.phone || '')}</td>
          <td class="r money">${money(a.purchased, 0)}</td><td class="r money">${money(a.cashPurchases, 0)}</td><td class="r money">${money(a.paid, 0)}</td><td class="r money"><b class="${a.balance > 0.5 ? 'neg' : ''}">${money(a.balance, 0)}</b></td></tr>`).join('')}
        </tbody></table></div>` : `<div class="card empty">${ic('truck')}<p>${t('noSuppliers')}</p></div>`);
    el.querySelector('#ns').onclick = () => MG.supplierForm();
    el.querySelector('#pu').onclick = () => MG.expenseForm({ category: 'material', paid: false });
    el.querySelector('#pp').onclick = () => MG.supplierPayForm({});
    el.querySelectorAll('[data-sid]').forEach(r => r.onclick = () => MG.go('#/supplier/' + r.dataset.sid));
  };

  MG.supplierForm = function (s, onSaved) {
    const isNew = !s;
    const d = s || { name: '', phone: '', kind: '', notes: '', opening: 0 };
    const m = MG.modal(isNew ? t('newSupplier') : t('edit'), `<div class="grid g2">
      ${MG.fld(t('fullName'), MG.inp('name', d.name), 'span2')}
      ${MG.fld(t('phone'), MG.inp('phone', d.phone, 'tel'))}
      ${MG.fld(t('supplierKind'), MG.inp('kind', d.kind, 'text', `placeholder="${MG.lang === 'ar' ? 'ألمنيوم، زجاج، حديد…' : 'Aluminum, glass, steel…'}"`))}
      ${MG.can('accounting') ? MG.fld(t('openingOwed'), MG.inp('opening', d.opening || '', 'number'), 'span2') : ''}
      ${MG.fld(t('notes'), `<textarea class="input" name="notes">${esc(d.notes || '')}</textarea>`, 'span2')}</div>`,
      `<button class="btn" data-close>${t('cancel')}</button><button class="btn btn-gold" id="ok">${t('save')}</button>`);
    m.querySelector('[data-close]').onclick = () => MG.closeModal();
    m.querySelector('#ok').onclick = () => {
      const v = MG.formData(m);
      if (!v.name.trim()) return;
      if (v.opening === '' || v.opening == null) v.opening = d.opening || 0;
      let obj;
      if (isNew) { obj = Object.assign({ id: MG.uid(), created: Date.now() }, v); MG.db.suppliers.push(obj); } else { Object.assign(s, v); obj = s; }
      MG.log(isNew ? 'supplier.create' : 'supplier.edit', obj.name);
      MG.save(); MG.closeModal(); MG.toast(t('saved'));
      if (onSaved) onSaved(obj); else MG.route();
    };
  };

  MG.supplierPayForm = function (opts) {
    if (!MG.db.suppliers.length) { MG.toast(t('noSuppliers'), 'err'); return; }
    const sid = opts.supplierId || MG.db.suppliers[0].id;
    const bal = MG.supplierAccount(sid).balance;
    const m = MG.modal(t('paySupplier'), `<div class="grid g2">
      ${MG.fld(t('supplier'), MG.sel('supplierId', MG.db.suppliers.map(s => [s.id, s.name + ' — ' + money(MG.supplierAccount(s.id).balance, 0)]), sid), 'span2')}
      ${MG.fld(t('amount'), MG.moneyInp('amount', bal > 0 ? bal : ''))}
      ${MG.fld(t('date'), MG.inp('date', MG.today(), 'date'))}
      ${MG.fld(t('cashAccount'), MG.sel('accountId', MG.accountOpts(), MG.db.accounts[0].id))}
      ${MG.fld(t('notes'), MG.inp('note', ''))}</div>`,
      `<button class="btn" data-close>${t('cancel')}</button><button class="btn btn-gold" id="ok">${t('save')}</button>`);
    m.querySelector('[data-close]').onclick = () => MG.closeModal();
    m.querySelector('[name=supplierId]').onchange = e => { const a = m.querySelector('[name=amount]'); const b = MG.supplierAccount(e.target.value).balance; a.value = b > 0 ? b : ''; a.dispatchEvent(new Event('input', { bubbles: true })); };
    m.querySelector('#ok').onclick = () => {
      const v = MG.formData(m), amt = MG.readMoney(v, 'amount');
      if (!(amt.usd > 0)) { MG.toast(t('enterAmount'), 'err'); return; }
      if (!MG.guardDate(v.date)) return;
      MG.db.supPayments.push({ id: MG.uid(), supplierId: v.supplierId, date: v.date || MG.today(), amount: amt.usd, orig: amt.orig, cur: amt.cur, rate: amt.rate, accountId: v.accountId, note: v.note, by: MG.user.username });
      MG.log('supplier.pay', money(amt.usd) + ' — ' + MG.getSupplier(v.supplierId).name);
      MG.save(); MG.closeModal(); MG.toast(t('saved')); MG.route();
    };
  };

  MG.views.supplier = function (el, id) {
    const s = MG.getSupplier(id);
    if (!s) { MG.go('#/suppliers'); return; }
    const a = MG.supplierAccount(s.id);
    const L = MG.ledger('ap', '', '', { t: 'supplier', id: s.id });
    const purchases = MG.db.expenses.filter(x => x.supplierId === s.id).sort((x, y) => x.date < y.date ? 1 : -1);
    const pays = MG.db.supPayments.filter(x => x.supplierId === s.id).sort((x, y) => x.date < y.date ? 1 : -1);
    el.innerHTML = MG.page(esc(s.name), `${esc(s.kind || '')} ${s.phone ? ' · <a class="num" href="tel:' + esc(s.phone) + '">' + esc(s.phone) + '</a>' : ''}`,
      `<button class="btn" id="ed">${ic('edit')} ${t('edit')}</button><button class="btn" id="pu">${ic('box')} ${t('recordPurchase')}</button>
       <button class="btn btn-gold" id="pp">${ic('cash')} ${t('paySupplier')}</button>`).replace('<div class="topbar">', `<a href="#/suppliers" class="back">${ic('back')} ${t('suppliers')}</a><div class="topbar">`) + `
      <div class="kpis">
        ${MG.kpi(t('purchasesCredit'), money(a.purchased, 0), '', 'box', true)}
        ${MG.kpi(t('purchasesCash'), money(a.cashPurchases, 0), '', 'cash')}
        ${MG.kpi(t('paid'), money(a.paid, 0), '', 'coins')}
        ${MG.kpi(t('weOwe'), `<span class="${a.balance > 0.5 ? 'neg' : 'pos'}">${money(a.balance, 0)}</span>`, '', 'clock')}
      </div>
      <div class="card" style="margin-bottom:18px"><div class="card-h"><h3>${t('statement')}</h3></div>${statementTable(L.rows, L.opening, t('paid'), t('purchasesCredit'))}</div>
      <div class="two-col"><div class="card"><div class="card-h"><h3>${t('purchases')}</h3></div>${MG.expenseTable(purchases, true)}</div>
        <div class="card"><div class="card-h"><h3>${t('payments')}</h3></div>
        ${pays.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>${t('date')}</th><th>${t('cashAccount')}</th><th>${t('notes')}</th><th class="r">${t('amount')}</th><th></th></tr></thead><tbody>
          ${pays.map(x => `<tr><td class="num">${esc(x.date)}</td><td>${esc(MG.nm((MG.getAccount(x.accountId) || {}).name || ''))}</td><td>${esc(x.note || '')}</td><td class="r money">${money(x.amount)}</td>
          <td class="r">${MG.can('delete') ? `<button class="btn btn-ghost btn-sm btn-icon btn-danger" data-dsp="${x.id}">${ic('trash')}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">—</p>'}</div></div>`;
    el.querySelector('#ed').onclick = () => MG.supplierForm(s);
    el.querySelector('#pu').onclick = () => MG.expenseForm({ supplierId: s.id, category: 'material', paid: false });
    el.querySelector('#pp').onclick = () => MG.supplierPayForm({ supplierId: s.id });
    el.querySelectorAll('[data-dsp]').forEach(b => b.onclick = () => {
      const x = MG.db.supPayments.find(y => y.id === b.dataset.dsp);
      if (!MG.guardDate(x.date)) return;
      MG.confirm(t('confirmDelete'), () => { MG.db.supPayments = MG.db.supPayments.filter(y => y !== x); MG.log('supplier.pay.delete', money(x.amount)); MG.save(); MG.route(); });
    });
    MG.bindExpenseTable(el);
  };

  /* ======================= WORKERS ======================= */
  MG.views.workers = function (el) {
    const ym = MG.today().slice(0, 7);
    const rows = MG.db.workers.map(w => {
      const a = MG.workerAccount(w.id);
      const month = MG.db.payroll.filter(x => x.workerId === w.id && x.type !== 'advance' && (x.date || '').startsWith(ym));
      return { w, a, mDays: month.reduce((s, x) => s + N(x.days), 0), mPaid: month.reduce((s, x) => s + N(x.amount), 0) };
    });
    el.innerHTML = MG.page(t('workers'), `${t('thisMonth')}: <span class="money">${money(rows.reduce((s, r) => s + r.mPaid, 0), 0)}</span>`,
      `<button class="btn" id="adv">${ic('coins')} ${t('giveAdvance')}</button><button class="btn" id="pw">${ic('cash')} ${t('payWage')}</button>
       <button class="btn btn-gold" id="nw">${ic('plus')} ${t('newWorker')}</button>`) +
      (rows.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>${t('worker')}</th><th>${t('phone')}</th><th>${t('wageRate')}</th><th class="r">${t('daysThisMonth')}</th><th class="r">${t('paidThisMonth')}</th><th class="r">${t('advanceBalance')}</th><th></th></tr></thead><tbody>
        ${rows.map(({ w, a, mDays, mPaid }) => `<tr data-wid="${w.id}" style="cursor:pointer${w.active === false ? ';opacity:.5' : ''}"><td><b>${esc(w.name)}</b>${w.job ? ` <span class="muted">· ${esc(w.job)}</span>` : ''}</td><td class="num">${esc(w.phone || '')}</td>
          <td><span class="money">${money(w.rate, 0)}</span> / ${t(w.wageType === 'monthly' ? 'perMonth' : 'perDay')}</td><td class="r num">${mDays || ''}</td><td class="r money">${money(mPaid, 0)}</td>
          <td class="r money ${a.advBalance > 0 ? 'neg' : ''}">${a.advBalance ? money(a.advBalance, 0) : '—'}</td>
          <td class="r"><button class="btn btn-sm" data-pay="${w.id}" data-stop>${t('payWage')}</button></td></tr>`).join('')}
        </tbody></table></div>` : `<div class="card empty">${ic('hardhat')}<p>${t('noWorkers')}</p></div>`);
    el.querySelector('#nw').onclick = () => MG.workerForm();
    el.querySelector('#pw').onclick = () => MG.wageForm({});
    el.querySelector('#adv').onclick = () => MG.advanceForm({});
    el.querySelectorAll('[data-pay]').forEach(b => b.onclick = () => MG.wageForm({ workerId: b.dataset.pay }));
    el.querySelectorAll('[data-wid]').forEach(r => r.onclick = e => { if (!e.target.closest('[data-stop]')) MG.go('#/worker/' + r.dataset.wid); });
  };

  MG.workerForm = function (w) {
    const isNew = !w;
    const d = w || { name: '', phone: '', job: '', wageType: 'daily', rate: '', active: true };
    const m = MG.modal(isNew ? t('newWorker') : t('edit'), `<div class="grid g2">
      ${MG.fld(t('fullName'), MG.inp('name', d.name), 'span2')}
      ${MG.fld(t('phone'), MG.inp('phone', d.phone, 'tel'))}
      ${MG.fld(t('job'), MG.inp('job', d.job, 'text', `placeholder="${MG.lang === 'ar' ? 'معلّم، مساعد، تركيب…' : 'Master, helper, installer…'}"`))}
      ${MG.fld(t('wageType'), MG.sel('wageType', [['daily', t('perDay')], ['monthly', t('perMonth')]], d.wageType))}
      ${MG.fld(t('wageRate') + ' ($)', MG.inp('rate', d.rate, 'number'))}
      <label class="check span2"><input type="checkbox" name="active" ${d.active !== false ? 'checked' : ''}> ${t('activeWorker')}</label></div>`,
      `<button class="btn" data-close>${t('cancel')}</button><button class="btn btn-gold" id="ok">${t('save')}</button>`);
    m.querySelector('[data-close]').onclick = () => MG.closeModal();
    m.querySelector('#ok').onclick = () => {
      const v = MG.formData(m);
      if (!v.name.trim()) return;
      if (isNew) MG.db.workers.push(Object.assign({ id: MG.uid(), created: Date.now() }, v)); else Object.assign(w, v);
      MG.log(isNew ? 'worker.create' : 'worker.edit', v.name);
      MG.save(); MG.closeModal(); MG.toast(t('saved')); MG.route();
    };
  };

  function workerOpts() { return MG.db.workers.filter(w => w.active !== false).map(w => [w.id, w.name]); }

  MG.wageForm = function (opts) {
    const ws = workerOpts();
    if (!ws.length) { MG.toast(t('noWorkers'), 'err'); return; }
    const wid = opts.workerId || ws[0][0];
    const projOpts = [['', t('generalWork')]].concat(MG.db.projects.filter(p => p.status === 'active' || p.status === 'quote').map(p => [p.id, p.code + ' — ' + (p.name || MG.clientName(p))]));
    const m = MG.modal(t('payWage'), `<div class="grid g2">
      ${MG.fld(t('worker'), MG.sel('workerId', ws, wid), 'span2')}
      ${MG.fld(t('days'), MG.inp('days', '', 'number', 'min="0" step="0.5"'))}
      ${MG.fld(t('amount'), MG.moneyInp('amount', ''))}
      ${MG.fld(t('deductAdvance'), MG.inp('deduct', '', 'number', 'min="0"'))}
      ${MG.fld(t('date'), MG.inp('date', MG.today(), 'date'))}
      ${MG.fld(t('project'), MG.sel('projectId', projOpts, opts.projectId || ''), 'span2')}
      ${MG.fld(t('cashAccount'), MG.sel('accountId', MG.accountOpts(), MG.db.accounts[0].id))}
      ${MG.fld(t('notes'), MG.inp('note', ''))}
      <div class="span2 wage-sum" id="ws"></div></div>`,
      `<button class="btn" data-close>${t('cancel')}</button><button class="btn btn-gold" id="ok">${t('save')}</button>`);
    m.querySelector('[data-close]').onclick = () => MG.closeModal();
    const q = n => m.querySelector(`[name=${n}]`);
    const upd = auto => {
      const w = MG.getWorker(q('workerId').value), a = MG.workerAccount(w.id);
      if (auto && w.wageType !== 'monthly' && N(q('days').value)) { q('amount').value = N(q('days').value) * N(w.rate); q('amount__cur').value = 'USD'; }
      if (auto === 'worker') { q('deduct').value = a.advBalance > 0 ? a.advBalance : ''; if (w.wageType === 'monthly') { q('amount').value = w.rate || ''; q('days').value = ''; } }
      const gross = MG.readMoney(MG.formData(m), 'amount').usd, ded = Math.min(N(q('deduct').value), gross);
      m.querySelector('#ws').innerHTML = `<div class="totals"><div class="trow"><span>${t('wageRate')}</span><span><span class="money">${money(w.rate, 0)}</span> / ${t(w.wageType === 'monthly' ? 'perMonth' : 'perDay')}</span></div>
        ${a.advBalance ? `<div class="trow"><span>${t('advanceBalance')}</span><span class="money neg">${money(a.advBalance)}</span></div>` : ''}
        <div class="trow"><span>${t('grossWage')}</span><span class="money">${money(gross)}</span></div>
        ${ded ? `<div class="trow"><span>${t('deductAdvance')}</span><span class="money">-${money(ded)}</span></div>` : ''}
        <div class="trow big"><span>${t('netPaid')}</span><span class="money">${money(gross - ded)}</span></div></div>`;
      q('amount').dispatchEvent(new Event('input', { bubbles: true }));
    };
    q('workerId').onchange = () => upd('worker');
    q('days').oninput = () => upd(true);
    q('amount').addEventListener('change', () => upd(false));
    q('deduct').oninput = () => upd(false);
    upd('worker');
    m.querySelector('#ok').onclick = () => {
      const v = MG.formData(m), amt = MG.readMoney(v, 'amount');
      if (!(amt.usd > 0)) { MG.toast(t('enterAmount'), 'err'); return; }
      if (!MG.guardDate(v.date)) return;
      MG.db.payroll.push({ id: MG.uid(), type: 'wage', workerId: v.workerId, projectId: v.projectId || null, date: v.date || MG.today(), days: N(v.days),
        amount: amt.usd, orig: amt.orig, cur: amt.cur, rate: amt.rate, deduct: Math.min(N(v.deduct), amt.usd), accountId: v.accountId, note: v.note, by: MG.user.username });
      MG.log('wage.add', money(amt.usd) + ' — ' + MG.getWorker(v.workerId).name);
      MG.save(); MG.closeModal(); MG.toast(t('saved')); MG.route();
    };
  };

  MG.advanceForm = function (opts) {
    const ws = workerOpts();
    if (!ws.length) { MG.toast(t('noWorkers'), 'err'); return; }
    const m = MG.modal(t('giveAdvance'), `<div class="grid g2">
      ${MG.fld(t('worker'), MG.sel('workerId', ws, opts.workerId || ws[0][0]), 'span2')}
      ${MG.fld(t('amount'), MG.moneyInp('amount', ''))}
      ${MG.fld(t('date'), MG.inp('date', MG.today(), 'date'))}
      ${MG.fld(t('cashAccount'), MG.sel('accountId', MG.accountOpts(), MG.db.accounts[0].id))}
      ${MG.fld(t('notes'), MG.inp('note', ''))}</div><p class="muted" style="font-size:12.5px">${t('advanceHint')}</p>`,
      `<button class="btn" data-close>${t('cancel')}</button><button class="btn btn-gold" id="ok">${t('save')}</button>`);
    m.querySelector('[data-close]').onclick = () => MG.closeModal();
    m.querySelector('#ok').onclick = () => {
      const v = MG.formData(m), amt = MG.readMoney(v, 'amount');
      if (!(amt.usd > 0)) { MG.toast(t('enterAmount'), 'err'); return; }
      if (!MG.guardDate(v.date)) return;
      MG.db.payroll.push({ id: MG.uid(), type: 'advance', workerId: v.workerId, date: v.date || MG.today(), amount: amt.usd, orig: amt.orig, cur: amt.cur, rate: amt.rate, accountId: v.accountId, note: v.note, by: MG.user.username });
      MG.log('advance.add', money(amt.usd) + ' — ' + MG.getWorker(v.workerId).name);
      MG.save(); MG.closeModal(); MG.toast(t('saved')); MG.route();
    };
  };

  MG.payrollTable = function (list, showWorker) {
    if (!list.length) return '<p class="muted">—</p>';
    return `<div class="table-wrap"><table class="t"><thead><tr><th>${t('date')}</th>${showWorker ? `<th>${t('worker')}</th>` : ''}<th>${t('type')}</th><th>${t('project')}</th><th class="r">${t('days')}</th><th class="r">${t('amount')}</th><th class="r">${t('deductAdvance')}</th><th></th></tr></thead><tbody>
      ${list.map(x => { const p = x.projectId && MG.getProject(x.projectId), w = MG.getWorker(x.workerId);
        return `<tr><td class="num">${esc(x.date)}</td>${showWorker ? `<td>${w ? `<a href="#/worker/${w.id}">${esc(w.name)}</a>` : ''}</td>` : ''}
        <td>${x.type === 'advance' ? `<span class="tag pay-partial">${t('advance')}</span>` : t('wage')}</td><td>${p ? `<a href="#/project/${p.id}">${esc(p.code)}</a>` : '<span class="muted">—</span>'}</td>
        <td class="r num">${x.days || ''}</td><td class="r money">${money(x.amount)}</td><td class="r money">${x.deduct ? money(x.deduct) : ''}</td>
        <td class="r">${MG.can('delete') ? `<button class="btn btn-ghost btn-sm btn-icon btn-danger" data-dpr="${x.id}">${ic('trash')}</button>` : ''}</td></tr>`; }).join('')}
      </tbody></table></div>`;
  };
  MG.bindPayrollTable = function (root) {
    root.querySelectorAll('[data-dpr]').forEach(b => b.onclick = () => {
      const x = MG.db.payroll.find(y => y.id === b.dataset.dpr);
      if (!MG.guardDate(x.date)) return;
      MG.confirm(t('confirmDelete'), () => { MG.db.payroll = MG.db.payroll.filter(y => y !== x); MG.log('payroll.delete', money(x.amount)); MG.save(); MG.route(); });
    });
  };

  MG.views.worker = function (el, id) {
    const w = MG.getWorker(id);
    if (!w) { MG.go('#/workers'); return; }
    const a = MG.workerAccount(w.id);
    el.innerHTML = MG.page(esc(w.name), `${esc(w.job || '')} · <span class="money">${money(w.rate, 0)}</span> / ${t(w.wageType === 'monthly' ? 'perMonth' : 'perDay')}`,
      `<button class="btn" id="ed">${ic('edit')} ${t('edit')}</button><button class="btn" id="adv">${ic('coins')} ${t('giveAdvance')}</button>
       <button class="btn btn-gold" id="pw">${ic('cash')} ${t('payWage')}</button>`).replace('<div class="topbar">', `<a href="#/workers" class="back">${ic('back')} ${t('workers')}</a><div class="topbar">`) + `
      <div class="kpis">
        ${MG.kpi(t('totalEarned'), money(a.earned, 0), `${a.days} ${t('days')}`, 'cash', true)}
        ${MG.kpi(t('advancesGiven'), money(a.advances, 0), '', 'coins')}
        ${MG.kpi(t('advancesDeducted'), money(a.deducted, 0), '', 'check')}
        ${MG.kpi(t('advanceBalance'), `<span class="${a.advBalance > 0 ? 'neg' : ''}">${money(a.advBalance, 0)}</span>`, '', 'clock')}
      </div>
      <div class="card"><div class="card-h"><h3>${t('payHistory')}</h3></div>${MG.payrollTable(a.rows, false)}</div>`;
    el.querySelector('#ed').onclick = () => MG.workerForm(w);
    el.querySelector('#pw').onclick = () => MG.wageForm({ workerId: w.id });
    el.querySelector('#adv').onclick = () => MG.advanceForm({ workerId: w.id });
    MG.bindPayrollTable(el);
  };
})();
