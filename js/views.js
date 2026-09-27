/* Majed Group — dashboard, projects list and project workspace */
(function () {
  const t = MG.t, ic = MG.ic, esc = MG.esc, money = MG.money;

  /* ---------------- Dashboard ---------------- */
  MG.views.dashboard = function (el) {
    const now = new Date(), y = now.getFullYear(), m = now.getMonth();
    const hello = (MG.lang === 'ar' ? 'أهلاً ' : 'Welcome, ') + esc((MG.user.name || '').split(' ')[0]);
    const dateStr = now.toLocaleDateString(MG.lang === 'ar' ? 'ar-LB' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const recent = MG.db.projects.filter(p => p.status !== 'cancelled').slice(0, 6);
    const fin = MG.can('accounting') || MG.can('reports');
    let html = MG.page(hello, dateStr,
      (MG.can('view.prices') ? `<a class="btn" href="#/calc">${ic('calc')} ${t('calculator')}</a>` : '') +
      (MG.can('projects.edit') ? `<button class="btn btn-gold" id="np">${ic('plus')} ${t('newProject')}</button>` : ''));

    if (fin) {
      const month = MG.periodStats(new Date(y, m, 1), new Date(y, m + 1, 1));
      html += `<div class="kpis">
        ${kpi(t('sales') + ' · ' + t('thisMonth'), money(month.sales, 0), `${month.count} ${t('projects')}`, 'trend', true)}
        ${kpi(t('collected') + ' · ' + t('thisMonth'), money(month.collected, 0), t('expensesT') + ': ' + money(month.expenses, 0), 'coins')}
        ${kpi(t('netProfit') + ' · ' + t('thisMonth'), `<span class="${month.net >= 0 ? 'pos' : 'neg'}">${money(month.net, 0)}</span>`, t('netCash') + ': ' + money(month.cashIn - month.cashOut, 0), 'chart')}
        ${kpi(t('outstanding'), money(MG.totalReceivable(), 0), `<a href="#/customers">${t('customers')} ${ic('chevron').replace('<svg', '<svg class="flip" style="width:12px;vertical-align:-2px"')}</a>`, 'clock')}
      </div>`;
    }
    html += `<div class="two-col"><div class="cards">`;
    if (fin) html += `<div class="card"><div class="card-h"><h3>${t('monthlyTrend')} · ${y}</h3><a href="#/reports" class="btn btn-sm btn-ghost">${t('reports')}</a></div>${MG.trendChart(y)}</div>`;
    html += `<div class="card"><div class="card-h"><h3>${t('recentProjects')}</h3><a href="#/projects" class="btn btn-sm btn-ghost">${t('viewAll')}</a></div>
        ${recent.length ? `<div class="plist">${recent.map(projectRow).join('')}</div>` : emptyProjects()}</div></div><div class="cards">`;
    if (MG.canQuick()) html += `<div class="card"><div class="card-h"><h3>${t('quickEntry')}</h3></div>${MG.quickTiles(true)}</div>`;
    if (MG.can('accounting')) html += `<div class="card"><div class="card-h"><h3>${t('cashPosition')}</h3><a href="#/accounting" class="btn btn-sm btn-ghost">${t('accounting')}</a></div>
        <div class="totals">${MG.db.accounts.map(a => `<div class="trow"><span>${ic(a.type === 'bank' ? 'bank' : 'wallet').replace('<svg', '<svg style="width:15px;vertical-align:-3px;color:var(--gold)"')} ${esc(MG.nm(a.name))}</span><span class="money">${money(MG.cashBalance(a.id))}</span></div>`).join('')}
        <div class="trow big"><span>${t('total')}</span><span class="money">${money(MG.db.accounts.reduce((s, a) => s + MG.cashBalance(a.id), 0))}</span></div></div></div>`;
    if (MG.can('customers') && MG.can('view.prices')) html += `<div class="card"><div class="card-h"><h3>${t('customerStatus')}</h3><a href="#/customers" class="btn btn-sm btn-ghost">${t('viewAll')}</a></div>${MG.customerSummaryHtml()}</div>`;
    if (MG.can('expenses')) { const due = MG.recurringDue(); if (due.length) html += `<div class="card"><div class="card-h"><h3>${t('fixedDue')}</h3><a href="#/expenses" class="btn btn-sm btn-ghost">${t('expenses')}</a></div>${MG.recurringDueHtml(due)}</div>`; }
    if (!MG.can('view.prices')) html += `<div class="card"><div class="card-h"><h3>${t('quickActions')}</h3></div><a class="btn btn-block" href="#/sketch">${ic('pen')} ${t('sketch')}</a></div>`;
    html += `</div></div>`;
    el.innerHTML = html;
    const np = el.querySelector('#np'); if (np) np.onclick = () => MG.projectForm();
    el.querySelectorAll('[data-pid]').forEach(r => r.onclick = () => MG.go('#/project/' + r.dataset.pid));
    MG.bindQuickTiles(el); MG.bindRecurring(el);
  };

  function kpi(label, value, sub, icon, hl) {
    return `<div class="kpi ${hl ? 'hl' : ''}"><div class="kpi-l">${ic(icon)}${label}</div><div class="kpi-v money">${value}</div><div class="kpi-s">${sub}</div></div>`;
  }
  MG.kpi = kpi;
  function emptyProjects() {
    return `<div class="empty">${ic('folder')}<h3>${t('noProjects')}</h3><p>${t('startFirst')}</p>
      ${MG.can('projects.edit') ? `<button class="btn btn-gold" onclick="MG.projectForm()">${ic('plus')} ${t('newProject')}</button>` : ''}</div>`;
  }
  /* An invoiced project dated inside a closed period cannot change amount */
  MG.canEditInvoice = p => !((p.status === 'active' || p.status === 'done') && !MG.guardDate(p.date));
  /* paid / partial / unpaid for a contracted project */
  MG.payStatus = function (p, T) {
    if (p.status !== 'active' && p.status !== 'done') return null;
    T = T || MG.projectTotals(p);
    if (T.total <= 0.004) return null;
    if (T.balance <= 0.5) return 'paid';
    return T.paid > 0.004 ? 'partial' : 'unpaid';
  };
  MG.payTag = s => s ? `<span class="tag pay-${s}">${t('pay_' + s)}</span>` : '';
  MG.clientName = p => { const c = p.customerId && MG.getCustomer(p.customerId); return c ? c.name : (p.client || ''); };
  function projectRow(p) {
    const T = MG.projectTotals(p);
    const pct = T.total > 0 ? Math.min(100, T.paid / T.total * 100) : 0;
    const icon = p.section === 'iron' ? 'gate' : p.section === 'mixed' ? 'grid' : 'window';
    const client = MG.clientName(p);
    return `<div class="prow" data-pid="${p.id}">
      <div class="picon ${p.section}">${ic(icon)}</div>
      <div style="min-width:0"><div class="prow-t">${esc(p.name || client || p.code)}</div>
        <div class="prow-m"><span class="num">${esc(p.code)}</span>${client ? `<span>${esc(client)}</span>` : ''}${MG.stTag(p.status)}${MG.can('view.prices') ? MG.payTag(MG.payStatus(p, T)) : ''}</div></div>
      ${MG.can('view.prices') ? `<div class="prow-v"><div class="money">${money(T.total, 0)}</div>
        <div><div class="small">${t('paid')} ${Math.round(pct)}%</div><div class="progress"><i style="width:${pct}%"></i></div></div></div>` : '<div></div>'}
    </div>`;
  }
  MG.projectRow = projectRow;

  /* ---------------- Projects list ---------------- */
  let pf = { q: '', section: 'all', status: 'all', pay: 'all' };
  MG.views.projects = function (el) {
    el.innerHTML = MG.page(t('projects'), `${MG.db.projects.length} ${t('projects')}`,
      MG.can('projects.edit') ? `<button class="btn btn-gold" id="np">${ic('plus')} ${t('newProject')}</button>` : '') + `
      <div class="filters">
        <div class="search">${ic('search')}<input class="input" id="q" placeholder="${t('search')}" value="${esc(pf.q)}"></div>
        <div class="seg-ctl" id="fsec">${['all', 'alu', 'iron', 'mixed'].map(s => `<button data-v="${s}" class="${pf.section === s ? 'on' : ''}">${t(s)}</button>`).join('')}</div>
        ${MG.sel('fst', [['all', t('all')]].concat(MG.statuses.map(s => [s, t('st_' + s)])), pf.status, 'id="fst" style="width:auto"')}
        ${MG.can('view.prices') ? MG.sel('fpay', [['all', t('payAll')], ['paid', t('pay_paid')], ['partial', t('pay_partial')], ['unpaid', t('pay_unpaid')]], pf.pay, 'id="fpay" style="width:auto"') : ''}
      </div>
      <div id="plist"></div>`;
    const draw = () => {
      const q = pf.q.trim().toLowerCase();
      const list = MG.db.projects.filter(p =>
        (pf.section === 'all' || p.section === pf.section) && (pf.status === 'all' || p.status === pf.status) &&
        (pf.pay === 'all' || MG.payStatus(p) === pf.pay) &&
        (!q || [p.name, MG.clientName(p), p.code, p.phone, p.location].join(' ').toLowerCase().includes(q)));
      const box = el.querySelector('#plist');
      box.innerHTML = list.length ? `<div class="plist">${list.map(projectRow).join('')}</div>` : (MG.db.projects.length ? `<div class="empty">${ic('search')}<p>—</p></div>` : emptyProjects());
      box.querySelectorAll('[data-pid]').forEach(r => r.onclick = () => MG.go('#/project/' + r.dataset.pid));
    };
    const np = el.querySelector('#np'); if (np) np.onclick = () => MG.projectForm();
    const fp = el.querySelector('#fpay'); if (fp) fp.onchange = e => { pf.pay = e.target.value; draw(); };
    el.querySelector('#q').oninput = e => { pf.q = e.target.value; draw(); };
    el.querySelectorAll('#fsec button').forEach(b => b.onclick = () => { pf.section = b.dataset.v; el.querySelectorAll('#fsec button').forEach(x => x.classList.toggle('on', x === b)); draw(); });
    el.querySelector('#fst').onchange = e => { pf.status = e.target.value; draw(); };
    draw();
  };

  /* ---------------- Project form ---------------- */
  MG.projectForm = function (p, onSaved, cust) {
    const isNew = !p;
    const d = Object.assign({}, p || { section: 'alu', status: 'quote', date: MG.today() });
    if (isNew && cust) { d.customerId = cust.id; d.location = cust.address || ''; }
    if (d.customerId) { const c = MG.getCustomer(d.customerId); if (c) { d.client = c.name; d.phone = d.phone || c.phone; } }
    const m = MG.modal(isNew ? t('newProject') : t('editProject'), `
      <div class="grid g2">
        ${MG.fld(t('project'), MG.inp('name', d.name, 'text', 'placeholder="' + (MG.lang === 'ar' ? 'مثال: فيلا الحازمية' : 'e.g. Hazmieh villa') + '"'), 'span2')}
        ${MG.fld(t('client'), MG.inp('client', d.client, 'text', 'list="custlist" autocomplete="off"') + `<datalist id="custlist">${MG.db.customers.map(c => `<option value="${esc(c.name)}">${esc(c.phone || '')}</option>`).join('')}</datalist>`)}
        ${MG.fld(t('phone'), MG.inp('phone', d.phone, 'tel'))}
        ${MG.fld(t('location'), MG.inp('location', d.location), 'span2')}
        ${MG.fld(t('section'), MG.sel('section', [['alu', t('alu')], ['iron', t('iron')], ['mixed', t('mixed')]], d.section))}
        ${MG.fld(t('status'), MG.sel('status', MG.statuses.map(s => [s, t('st_' + s)]), d.status))}
        ${MG.fld(t('date'), MG.inp('date', d.date, 'date'))}
        ${MG.fld(t('dueDate'), MG.inp('dueDate', d.dueDate, 'date'))}
        ${MG.fld(t('notes'), `<textarea class="input" name="notes">${esc(d.notes || '')}</textarea>`, 'span2')}
      </div>`,
      `<button class="btn" data-close>${t('cancel')}</button><button class="btn btn-gold" id="ok">${t('save')}</button>`);
    m.querySelector('[data-close]').onclick = () => MG.closeModal();
    m.querySelector('[name=client]').onchange = e => {
      const c = MG.db.customers.find(x => x.name.trim().toLowerCase() === e.target.value.trim().toLowerCase());
      if (c && !m.querySelector('[name=phone]').value) m.querySelector('[name=phone]').value = c.phone || '';
      if (c && !m.querySelector('[name=location]').value) m.querySelector('[name=location]').value = c.address || '';
    };
    m.querySelector('#ok').onclick = () => {
      const v = MG.formData(m);
      if (!v.date) v.date = MG.today();
      const wasInvoiced = p && (p.status === 'active' || p.status === 'done');
      if ((wasInvoiced && !MG.guardDate(p.date)) || ((v.status === 'active' || v.status === 'done') && !MG.guardDate(v.date))) return;
      const c = MG.findOrCreateCustomer(v.client, v.phone, v.location);
      v.customerId = c ? c.id : null;
      let proj;
      if (isNew) { proj = MG.newProject(v); MG.log('project.create', proj.code); }
      else { Object.assign(p, v); proj = p; MG.log('project.edit', p.code); MG.save(); }
      MG.closeModal();
      MG.toast(t('saved'));
      if (onSaved) onSaved(proj);
      else if (isNew) MG.go('#/project/' + proj.id);
      else MG.route();
    };
  };

  /* ---------------- Project workspace ---------------- */
  MG.views.project = function (el, id, tab) {
    const p = MG.getProject(id);
    if (!p) { MG.go('#/projects'); return; }
    tab = tab || 'items';
    const T = MG.projectTotals(p);
    const pays = MG.db.payments.filter(x => x.projectId === p.id);
    const exps = MG.db.expenses.filter(x => x.projectId === p.id).length + MG.db.payroll.filter(x => x.projectId === p.id).length;
    const canP = MG.can('view.prices'), canC = MG.can('view.costs'), canE = MG.can('projects.edit');
    const tabs = [['items', 'grid', t('items'), p.items.length], ['cut', 'scissors', t('cutList')]];
    if (canP && (MG.can('payments.receive') || MG.can('expenses'))) tabs.push(['finance', 'cash', t('payments'), pays.length + (canC ? exps : 0)]);
    tabs.push(['sketches', 'pen', t('sketches'), (p.sketches || []).length]);
    if (canP) tabs.push(['quote', 'print', t('quote')]);
    if (!tabs.some(x => x[0] === tab)) tab = 'items';
    const client = MG.clientName(p);
    el.innerHTML = `
      ${MG.page('', '', '').replace('<div class="topbar"><div><h1></h1></div><div class="topbar-actions"></div></div>', '')}
      <a href="#/projects" class="back">${ic('back')} ${t('projects')}</a>
      <div class="phead" style="margin-bottom:22px">
        <div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><h1 style="font-size:clamp(24px,3vw,32px)">${esc(p.name || p.client || p.code)}</h1>${MG.secTag(p.section)}${MG.stTag(p.status)}</div>
          <div class="phead-meta">
            <span class="num">#${esc(p.code)}</span>
            ${client ? `<span>${ic('user')}${p.customerId && MG.can('customers') ? `<a href="#/customer/${p.customerId}">${esc(client)}</a>` : esc(client)}</span>` : ''}
            ${p.phone ? `<span>${ic('phone')}<a href="tel:${esc(p.phone)}" class="num">${esc(p.phone)}</a></span>` : ''}
            ${p.location ? `<span>${ic('map')}${esc(p.location)}</span>` : ''}
            <span>${ic('cal')}<span class="num">${esc(p.date)}</span>${p.dueDate ? ` → <span class="num">${esc(p.dueDate)}</span>` : ''}</span>
          </div>
        </div>
        <div class="topbar-actions">
          ${canE ? MG.sel('st', MG.statuses.map(s => [s, t('st_' + s)]), p.status, 'id="st" style="width:auto"') : ''}
          ${canE ? `<button class="btn" id="ed">${ic('edit')} ${t('edit')}</button>` : ''}
          ${MG.can('delete') ? `<button class="btn btn-icon btn-danger" id="del" title="${t('delete')}">${ic('trash')}</button>` : ''}
        </div>
      </div>
      ${canP ? `<div class="kpis">
        <div class="kpi hl"><div class="kpi-l">${ic('coins')}${t('grandTotal')}</div><div class="kpi-v money">${money(T.total, 0)}</div><div class="kpi-s">${canC ? `${t('estCost')}: <span class="money">${money(T.estCost, 0)}</span>` : MG.payTag(MG.payStatus(p, T))}</div></div>
        <div class="kpi"><div class="kpi-l">${ic('cash')}${t('paid')}</div><div class="kpi-v money">${money(T.paid, 0)}</div><div class="kpi-s">${T.total ? Math.round(T.paid / T.total * 100) : 0}% ${canC ? MG.payTag(MG.payStatus(p, T)) : ''}</div></div>
        <div class="kpi"><div class="kpi-l">${ic('clock')}${t('balance')}</div><div class="kpi-v money ${T.balance > 0.5 ? '' : 'pos'}">${money(T.balance, 0)}</div><div class="kpi-s">${canC ? `${t('actualCost')}: <span class="money">${money(T.actual, 0)}</span>` : (p.dueDate ? t('dueDate') + ' ' + esc(p.dueDate) : '')}</div></div>
        ${canC ? `<div class="kpi"><div class="kpi-l">${ic('trend')}${t('profit')}</div><div class="kpi-v money ${T.profit >= 0 ? 'pos' : 'neg'}">${money(T.profit, 0)}</div><div class="kpi-s">${t('margin2')}: ${T.net > 0 ? Math.round(T.profit / T.net * 100) : 0}%</div></div>` : ''}
      </div>` : ''}
      <div class="tabs">${tabs.map(x => `<button data-tab="${x[0]}" class="${tab === x[0] ? 'on' : ''}">${ic(x[1])}${x[2]}${x[3] ? ` <span class="badge">${x[3]}</span>` : ''}</button>`).join('')}</div>
      <div id="tab"></div>`;
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => MG.go('#/project/' + p.id + '/' + b.dataset.tab));
    const ed = el.querySelector('#ed'); if (ed) ed.onclick = () => MG.projectForm(p);
    const st = el.querySelector('#st');
    if (st) st.onchange = e => {
      const inv = s => s === 'active' || s === 'done';
      if ((inv(p.status) || inv(e.target.value)) && !MG.guardDate(p.date)) { e.target.value = p.status; return; }
      MG.log('project.status', p.code + ': ' + p.status + ' → ' + e.target.value);
      p.status = e.target.value; MG.save(); MG.route();
    };
    const del = el.querySelector('#del');
    if (del) del.onclick = () => {
      if (MG.projectHasMoney(p.id)) { MG.toast(t('cantDeleteMoney'), 'err'); return; }
      MG.confirm(t('confirmDelete'), () => { MG.deleteProject(p.id); MG.log('project.delete', p.code); MG.save(); MG.toast(t('deleted')); MG.go('#/projects'); });
    };
    const box = el.querySelector('#tab');
    ({ items: tabItems, cut: tabCut, finance: tabFinance, sketches: tabSketches, quote: tabQuote }[tab] || tabItems)(box, p, T);
  };

  function tabItems(box, p, T) {
    const rows = T.rows;
    box.innerHTML = `<div class="two-col">
      <div>
        <div class="card-h"><h3>${t('items')}</h3>${MG.can('projects.edit') && MG.can('view.prices') ? `<div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-sm ${p.section !== 'iron' ? 'btn-gold' : ''}" data-add="alu">${ic('plus')} ${t('alu')}</button>
          <button class="btn btn-sm ${p.section === 'iron' ? 'btn-gold' : ''}" data-add="iron">${ic('plus')} ${t('iron')}</button></div>` : ''}</div>
        ${p.items.length ? `<div class="items">${p.items.map((it, i) => {
          const c = rows[i];
          return `<div class="item-card">
            <div class="item-draw" data-edit="${it.id}">${MG.drawItem(it)}</div>
            <div class="item-body">
              <div class="item-top"><div class="item-t">${esc(MG.itemTitle(it))}</div>${MG.secTag(it.section)}</div>
              <div class="item-meta">${t('t_' + it.type)} · <span class="num">${MG.itemDims(it)}</span>${MG.itemDims(it) ? ' ' + t('cm') : ''} · ${t('qty')} <span class="num">${c.qty}</span></div>
              ${MG.can('view.prices') ? `<div class="item-meta">${t('unitPrice')}: <span class="money">${money(c.unitPrice, 0)}</span>${MG.can('view.costs') ? ` · ${t('cost')}: <span class="money">${money(c.unitCost, 0)}</span>` : ''}</div>` : ''}
            </div>
            ${MG.can('view.prices') ? `<div class="item-foot"><div class="item-price money">${money(c.total, 0)}</div>${MG.can('projects.edit') ? `<div>
              <button class="btn btn-ghost btn-sm btn-icon" data-dup="${it.id}" title="copy">${ic('copy')}</button>
              <button class="btn btn-ghost btn-sm btn-icon" data-edit="${it.id}">${ic('edit')}</button>
              <button class="btn btn-ghost btn-sm btn-icon btn-danger" data-del="${it.id}">${ic('trash')}</button></div>` : ''}</div>` : ''}
          </div>`;
        }).join('')}</div>` : `<div class="card empty">${ic('ruler')}<p>${t('noItems')}</p></div>`}
      </div>
      ${MG.can('view.prices') ? `<div><div class="card" style="position:sticky;top:20px">
        <div class="card-h"><h3>${t('total')}</h3></div>
        <div class="grid g3" style="margin-bottom:16px" id="pm">
          ${MG.fld(t('margin'), MG.inp('margin', p.margin, 'number'))}
          ${MG.fld(t('discount'), MG.inp('discount', p.discount, 'number'))}
          ${MG.fld(t('vat'), MG.inp('vat', p.vat, 'number'))}
        </div>
        <div class="totals">
          ${MG.can('view.costs') ? `<div class="trow"><span>${t('estCost')}</span><span class="money">${money(T.estCost)}</span></div>` : ''}
          <div class="trow"><span>${t('subtotal')}</span><span class="money">${money(T.subtotal)}</span></div>
          ${T.discount ? `<div class="trow"><span>${t('discount')}</span><span class="money">-${money(T.discount)}</span></div>` : ''}
          ${T.vatAmt ? `<div class="trow"><span>${t('vat')}</span><span class="money">${money(T.vatAmt)}</span></div>` : ''}
          ${T.weight ? `<div class="trow"><span>${t('weight')}</span><span class="num">${MG.fmt(T.weight, 1)} kg</span></div>` : ''}
          <div class="trow big"><span>${t('grandTotal')}</span><span class="money">${money(T.total)}</span></div>
        </div>
        <button class="btn btn-block" style="margin-top:16px" onclick="MG.go('#/project/${p.id}/quote')">${ic('print')} ${t('quote')}</button>
      </div></div>` : ''}</div>`;
    box.querySelectorAll('[data-add]').forEach(b => b.onclick = () => MG.itemEditor({ project: p, section: b.dataset.add }));
    box.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => MG.itemEditor({ project: p, item: p.items.find(x => x.id === b.dataset.edit) }));
    box.querySelectorAll('[data-dup]').forEach(b => b.onclick = () => {
      if (!MG.canEditInvoice(p)) return;
      const i = p.items.findIndex(x => x.id === b.dataset.dup);
      const c = JSON.parse(JSON.stringify(p.items[i])); c.id = MG.uid();
      p.items.splice(i + 1, 0, c); MG.save(); MG.route();
    });
    box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => MG.canEditInvoice(p) && MG.confirm(t('confirmDelete'), () => {
      p.items = p.items.filter(x => x.id !== b.dataset.del); MG.save(); MG.route();
    }));
    box.querySelectorAll('#pm input').forEach(inp => {
      if (!MG.can('projects.edit')) { inp.readOnly = true; return; }
      inp.onchange = () => {
        if (!MG.canEditInvoice(p)) { inp.value = p[inp.name]; return; }
        p[inp.name] = parseFloat(inp.value) || 0; MG.log('project.edit', p.code + ' ' + inp.name + '=' + p[inp.name]); MG.save(); MG.route();
      };
    });
  }

  MG.cutListHtml = function (items) {
    const groups = MG.cutList(items);
    if (!groups.length) return `<div class="card empty">${ic('scissors')}<p>${t('noCut')}</p></div>`;
    return `<p class="muted" style="margin-top:0">${t('cutHint')}</p>` + groups.map(g => `
      <div class="card cut-group">
        <div class="cut-head"><div><h3 style="font-size:17px">${esc(MG.nm(g.name))}</h3><div class="muted" style="font-size:12.5px">${t(g.section)} · ${t('barLen')} <span class="num">${g.barLen}</span> ${t('cm')}</div></div>
          <div class="cut-stats"><span class="chip">${t('barsToBuy')}<b class="num">${g.bars.length}</b></span>
          <span class="chip">${t('usedLen')}<b class="num">${MG.fmt(g.usedLen / 100, 2)} m</b></span>
          <span class="chip">${t('waste')}<b class="num">${MG.fmt(g.waste, 1)}%</b></span>
          <span class="chip">${t('weight')}<b class="num">${MG.fmt(g.weight, 1)} kg</b></span></div></div>
        <div class="table-wrap" style="margin-bottom:14px"><table class="t"><thead><tr><th>${t('cutLen')} (${t('cm')})</th><th>${t('count')}</th><th>${t('description')}</th></tr></thead>
          <tbody>${g.summary.map(s => `<tr><td class="num"><b>${s.len}</b></td><td class="num">× ${s.count}</td><td>${esc(s.label)}</td></tr>`).join('')}</tbody></table></div>
        ${MG.drawBars(g)}
      </div>`).join('');
  };

  function tabCut(box, p) {
    box.innerHTML = `<div class="card-h"><h3>${t('cutList')}</h3><button class="btn btn-sm" id="pr">${ic('print')} ${t('print')}</button></div>` + MG.cutListHtml(p.items);
    box.querySelector('#pr').onclick = () => MG.print(`<div class="q">${quoteHeader(p, t('cutList'))}${MG.cutListHtml(p.items).replace(/class="card /g, 'class="')}</div>`);
  }

  function tabFinance(box, p, T) {
    const pays = MG.db.payments.filter(x => x.projectId === p.id).sort((a, b) => a.date < b.date ? 1 : -1);
    const exps = MG.db.expenses.filter(x => x.projectId === p.id).sort((a, b) => a.date < b.date ? 1 : -1);
    const wages = MG.db.payroll.filter(x => x.projectId === p.id && x.type !== 'advance');
    const canC = MG.can('view.costs');
    box.innerHTML = `<div class="two-col">
      <div class="cards">
        <div class="card"><div class="card-h"><h3>${t('payments')}</h3>${MG.can('payments.receive') ? `<button class="btn btn-sm btn-gold" id="ap">${ic('plus')} ${t('addPayment')}</button>` : ''}</div>
          ${MG.paymentTable(pays, { project: false })}</div>
        ${MG.can('expenses') ? `<div class="card"><div class="card-h"><h3>${t('projectCosts')}</h3><button class="btn btn-sm" id="ae">${ic('plus')} ${t('addExpense')}</button></div>
          ${MG.expenseTable(exps, false)}
          ${wages.length ? `<h4 style="margin:18px 0 10px">${t('wagesOnProject')}</h4>${MG.payrollTable(wages, true)}` : ''}</div>` : ''}
      </div>
      <div><div class="card">
        <div class="card-h"><h3>${t('projectAccount')}</h3>${MG.payTag(MG.payStatus(p, T))}</div>
        <div class="totals">
          <div class="trow"><span>${t('grandTotal')}</span><span class="money">${money(T.total)}</span></div>
          <div class="trow"><span>${t('paid')}</span><span class="money pos">${money(T.paid)}</span></div>
          <div class="trow"><span>${t('balance')}</span><span class="money">${money(T.balance)}</span></div>
          ${canC ? `<div class="trow"><span>${t('estCost')}</span><span class="money">${money(T.estCost)}</span></div>
          <div class="trow"><span>${t('actualCost')}</span><span class="money">${money(T.actual)}</span></div>
          <div class="trow big"><span>${t('profit')}</span><span class="money ${T.profit >= 0 ? 'pos' : 'neg'}">${money(T.profit)}</span></div>` : ''}
        </div>
        ${canC ? `<p class="muted" style="font-size:12.5px;margin:12px 0 0">${t('profitHint')}</p>` : ''}</div></div></div>`;
    const ap = box.querySelector('#ap'); if (ap) ap.onclick = () => MG.paymentForm({ project: p });
    const ae = box.querySelector('#ae'); if (ae) ae.onclick = () => MG.expenseForm({ projectId: p.id });
    MG.bindPaymentTable(box); MG.bindExpenseTable(box); MG.bindPayrollTable(box);
  }

  /* ---------------- Customer receipts ---------------- */
  MG.paymentTable = function (list, opts) {
    opts = opts || {};
    if (!list.length) return '<p class="muted">—</p>';
    const total = list.reduce((s, x) => s + (+x.amount || 0), 0);
    return `<div class="table-wrap"><table class="t"><thead><tr><th>${t('date')}</th>${opts.customer ? `<th>${t('client')}</th>` : ''}${opts.project !== false ? `<th>${t('project')}</th>` : ''}<th>${t('cashAccount')}</th><th>${t('notes')}</th><th class="r">${t('amount')}</th><th></th></tr></thead><tbody>
      ${list.map(x => { const p = x.projectId && MG.getProject(x.projectId), c = MG.getCustomer(x.customerId || (p && p.customerId));
        return `<tr><td class="num">${esc(x.date)}</td>${opts.customer ? `<td>${c ? `<a href="#/customer/${c.id}">${esc(c.name)}</a>` : '—'}</td>` : ''}
        ${opts.project !== false ? `<td>${p ? `<a href="#/project/${p.id}/finance">${esc(p.name || p.code)}</a>` : `<span class="muted">${t('onAccount')}</span>`}</td>` : ''}
        <td>${esc(MG.nm((MG.getAccount(x.accountId) || {}).name || ''))} <span class="muted">· ${t(x.method || 'cash')}</span></td><td>${esc(x.note || '')}</td>
        <td class="r money">${money(x.amount)}${x.cur === 'LBP' ? `<div class="muted num" style="font-size:11px">${MG.fmt(x.orig, 0)} ل.ل</div>` : ''}</td>
        <td class="r" style="white-space:nowrap"><button class="btn btn-ghost btn-sm btn-icon" data-rcpt="${x.id}" title="${t('receipt')}">${ic('print')}</button>
        ${MG.can('delete') ? `<button class="btn btn-ghost btn-sm btn-icon btn-danger" data-dp="${x.id}">${ic('trash')}</button>` : ''}</td></tr>`; }).join('')}
      </tbody><tfoot><tr><td colspan="${2 + (opts.customer ? 1 : 0) + (opts.project !== false ? 1 : 0)}">${t('total')}</td><td class="r money">${money(total)}</td><td></td></tr></tfoot></table></div>`;
  };
  MG.bindPaymentTable = function (root) {
    root.querySelectorAll('[data-dp]').forEach(b => b.onclick = () => {
      const x = MG.db.payments.find(y => y.id === b.dataset.dp);
      if (!MG.guardDate(x.date)) return;
      MG.confirm(t('confirmDelete'), () => {
        MG.db.payments = MG.db.payments.filter(y => y.id !== x.id);
        MG.log('payment.delete', money(x.amount) + ' ' + x.date); MG.save(); MG.route();
      });
    });
    root.querySelectorAll('[data-rcpt]').forEach(b => b.onclick = () => MG.printReceipt(MG.db.payments.find(y => y.id === b.dataset.rcpt)));
  };
  MG.paymentForm = function (opts) {
    opts = opts || {};
    const p0 = opts.project, c0 = opts.customer || (p0 && MG.getCustomer(p0.customerId));
    const custOpts = MG.db.customers.map(c => [c.id, c.name]);
    if (!custOpts.length && !p0) { MG.toast(t('addCustomerFirst'), 'err'); return; }
    const projOptsFor = cid => [['', t('onAccount')]].concat(MG.db.projects.filter(p => p.customerId === cid && p.status !== 'cancelled')
      .map(p => { const T = MG.projectTotals(p); return [p.id, `${p.code} — ${p.name || ''} (${t('balance')} ${money(T.balance, 0)})`]; }));
    const cid0 = c0 ? c0.id : custOpts[0][0];
    const bal0 = p0 ? MG.projectTotals(p0).balance : MG.customerAccount(cid0).balance;
    const m = MG.modal(t('addPayment'), `<div class="grid g2">
      ${MG.fld(t('client'), MG.sel('customerId', custOpts.length ? custOpts : [[cid0, c0 ? c0.name : '']], cid0, p0 ? 'disabled' : ''), 'span2')}
      ${MG.fld(t('project'), MG.sel('projectId', projOptsFor(cid0), p0 ? p0.id : ''), 'span2')}
      ${MG.fld(t('amount'), MG.moneyInp('amount', bal0 > 0 ? Math.round(bal0 * 100) / 100 : ''))}
      ${MG.fld(t('date'), MG.inp('date', MG.today(), 'date'))}
      ${MG.fld(t('cashAccount'), MG.sel('accountId', MG.accountOpts(), MG.db.accounts[0].id))}
      ${MG.fld(t('method'), MG.sel('method', [['cash', t('cash')], ['transfer', t('transfer')], ['cheque', t('cheque')], ['whish', 'Whish / OMT']], 'cash'))}
      ${MG.fld(t('notes'), MG.inp('note', ''), 'span2')}</div>`,
      `<button class="btn" data-close>${t('cancel')}</button><button class="btn" id="okp">${ic('print')} ${t('saveAndPrint')}</button><button class="btn btn-gold" id="ok">${t('save')}</button>`);
    m.querySelector('[data-close]').onclick = () => MG.closeModal();
    const cs = m.querySelector('[name=customerId]'), ps = m.querySelector('[name=projectId]');
    cs.onchange = () => { ps.innerHTML = projOptsFor(cs.value).map(o => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join(''); };
    ps.onchange = () => {
      const p = MG.getProject(ps.value); const bal = p ? MG.projectTotals(p).balance : MG.customerAccount(cs.value).balance;
      const a = m.querySelector('[name=amount]'); a.value = bal > 0 ? Math.round(bal * 100) / 100 : ''; a.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const save = print => {
      const v = MG.formData(m), amt = MG.readMoney(v, 'amount');
      if (!(amt.usd > 0)) { MG.toast(t('enterAmount'), 'err'); return; }
      const date = v.date || MG.today();
      if (!MG.guardDate(date)) return;
      const p = MG.getProject(v.projectId);
      const x = { id: MG.uid(), customerId: p0 ? p0.customerId : cs.value, projectId: p ? p.id : null, date, amount: amt.usd, orig: amt.orig, cur: amt.cur, rate: amt.rate,
        accountId: v.accountId, method: v.method, note: v.note, by: MG.user.username, no: (MG.db.seq.rc = (MG.db.seq.rc || 0) + 1) };
      MG.db.payments.push(x);
      if (p && p.status === 'quote') { p.status = 'active'; if (!p.date) p.date = date; }
      MG.log('payment.add', money(x.amount) + ' — ' + ((MG.getCustomer(x.customerId) || {}).name || ''));
      MG.save(); MG.closeModal(); MG.toast(t('saved')); MG.route();
      if (print) MG.printReceipt(x);
    };
    m.querySelector('#ok').onclick = () => save(false);
    m.querySelector('#okp').onclick = () => save(true);
  };
  MG.printReceipt = function (x) {
    const c = MG.getCustomer(x.customerId) || {}, p = x.projectId && MG.getProject(x.projectId), co = MG.db.settings.company;
    const acc = x.customerId ? MG.customerAccount(x.customerId) : null;
    MG.print(`<div class="q">${MG.docHeader(t('receiptTitle'), (x.no ? 'RC-' + String(x.no).padStart(4, '0') : ''), x.date)}
      <div class="q-info"><div><b>${t('receivedFrom')}:</b>${esc(c.name || '')}</div><div><b>${t('phone')}:</b><span class="num">${esc(c.phone || '')}</span></div>
        <div><b>${t('project')}:</b>${p ? esc(p.code + ' — ' + (p.name || '')) : t('onAccount')}</div><div><b>${t('method')}:</b>${t(x.method || 'cash')}</div></div>
      <div style="border:2px solid #b18a42;border-radius:12px;padding:18px;text-align:center;margin:10px 0 18px">
        <div style="color:#6b6250">${t('amountReceived')}</div>
        <div style="font:800 30px Inter,sans-serif;color:#7e5a20">${money(x.amount)}</div>
        ${x.cur === 'LBP' ? `<div class="num">${MG.fmt(x.orig, 0)} ل.ل @ ${MG.fmt(x.rate, 0)}</div>` : ''}
        ${x.note ? `<div style="margin-top:6px">${esc(x.note)}</div>` : ''}</div>
      ${p ? (() => { const T = MG.projectTotals(p); return `<div class="q-tot"><div><span>${t('grandTotal')}</span><span class="money">${money(T.total)}</span></div><div><span>${t('paid')}</span><span class="money">${money(T.paid)}</span></div><div class="g"><span>${t('balance')}</span><span class="money">${money(T.balance)}</span></div></div>`; })()
        : acc ? `<div class="q-tot"><div class="g"><span>${t('accountBalance')}</span><span class="money">${money(acc.balance)}</span></div></div>` : ''}
      <div class="q-foot"><div>${esc(co.phone || '')}</div><div><div class="q-sign">${t('signature')} — ${esc(MG.lang === 'ar' ? co.nameAr || co.name : co.name)}</div></div></div></div>`);
  };

  function tabSketches(box, p) {
    const sk = p.sketches || [];
    box.innerHTML = `<div class="card-h"><h3>${t('sketches')}</h3><a class="btn btn-sm btn-gold" href="#/sketch/${p.id}">${ic('pen')} ${t('newSketch')}</a></div>
      ${sk.length ? `<div class="sketch-grid">${sk.map(s => `<div class="sketch-card"><img src="${s.data}" alt="" data-view="${s.id}">
        <div class="f"><span>${esc(s.name || '')} <span class="muted num">${esc(s.date || '')}</span></span>
        <span><a class="btn btn-ghost btn-sm btn-icon" download="${esc((s.name || 'sketch') + '.png')}" href="${s.data}">${ic('download')}</a>
        <button class="btn btn-ghost btn-sm btn-icon btn-danger" data-ds="${s.id}">${ic('trash')}</button></span></div></div>`).join('')}</div>`
        : `<div class="card empty">${ic('pen')}<p>${t('noSketches')}</p></div>`}`;
    box.querySelectorAll('[data-view]').forEach(img => img.onclick = () => MG.modal(esc(p.name), `<img src="${img.src}" style="width:100%;background:#fff;border-radius:12px">`, '', { wide: true }));
    box.querySelectorAll('[data-ds]').forEach(b => b.onclick = () => MG.confirm(t('confirmDelete'), () => {
      p.sketches = p.sketches.filter(x => x.id !== b.dataset.ds); MG.save(); MG.route();
    }));
  }

  /* ---------------- Quotation ---------------- */
  MG.docHeader = function (title, no, date) {
    const c = MG.db.settings.company;
    return `<div class="q-head"><div class="q-brand"><div class="q-mark">M</div><div><div class="q-name">${esc(MG.lang === 'ar' ? (c.nameAr || c.name) : (c.name || c.nameAr))}</div>
      <div class="q-sub">${t('appSub')}</div><div style="font-size:11.5px;color:#6b6250">${esc(c.phone || '')} ${c.address ? ' · ' + esc(c.address) : ''}</div></div></div>
      <div class="q-title"><h1>${title}</h1>${no ? `<div class="num">${t('quoteNo')} ${esc(no)}</div>` : ''}<div class="num">${esc(date || MG.today())}</div></div></div>`;
  };
  function quoteHeader(p, title) {
    const c = MG.db.settings.company;
    return `<div class="q-head"><div class="q-brand"><div class="q-mark">M</div><div><div class="q-name">${esc(MG.lang === 'ar' ? (c.nameAr || c.name) : (c.name || c.nameAr))}</div>
      <div class="q-sub">${t('appSub')}</div><div style="font-size:11.5px;color:#6b6250">${esc(c.phone || '')} ${c.address ? ' · ' + esc(c.address) : ''}</div></div></div>
      <div class="q-title"><h1>${title}</h1><div class="num">${t('quoteNo')} ${esc(p.code)}</div><div class="num">${esc(MG.today())}</div></div></div>`;
  }
  MG.quoteHtml = function (p) {
    const T = MG.projectTotals(p);
    return `<div class="q">${quoteHeader(p, t('quoteTitle'))}
      <div class="q-info">
        <div><b>${t('client')}:</b>${esc(MG.clientName(p))}</div><div><b>${t('phone')}:</b><span class="num">${esc(p.phone || '')}</span></div>
        <div><b>${t('project')}:</b>${esc(p.name || '')}</div><div><b>${t('location')}:</b>${esc(p.location || '')}</div>
      </div>
      <table><thead><tr><th>#</th><th>${t('drawing')}</th><th>${t('description')}</th><th>${t('dims')} (${t('cm')})</th><th class="r">${t('qty')}</th><th class="r">${t('unitPrice')}</th><th class="r">${t('total')}</th></tr></thead>
      <tbody>${p.items.map((it, i) => {
        const c = T.rows[i], S = MG.db.settings;
        const extra = it.section === 'alu' && it.type !== 'custom'
          ? [(S.alu.finishes.find(f => f.id === it.finish) || {}).name, (S.alu.glass.find(g => g.id === it.glass) || {}).name].filter(Boolean).map(MG.nm).join(' · ')
          : '';
        return `<tr><td>${i + 1}</td><td><div class="qd">${MG.drawItem(it)}</div></td>
          <td><b>${esc(MG.itemTitle(it))}</b><div style="font-size:11.5px;color:#6b6250">${t('t_' + it.type)}${extra ? ' · ' + esc(extra) : ''}</div></td>
          <td class="num">${MG.itemDims(it)}</td><td class="r num">${c.qty}</td><td class="r money">${money(c.unitPrice, 0)}</td><td class="r money"><b>${money(c.total, 0)}</b></td></tr>`;
      }).join('')}</tbody></table>
      <div class="q-tot">
        <div><span>${t('subtotal')}</span><span class="money">${money(T.subtotal)}</span></div>
        ${T.discount ? `<div><span>${t('discount')}</span><span class="money">-${money(T.discount)}</span></div>` : ''}
        ${T.vatAmt ? `<div><span>${t('vat')} ${p.vat}%</span><span class="money">${money(T.vatAmt)}</span></div>` : ''}
        <div class="g"><span>${t('grandTotal')}</span><span class="money">${money(T.total)}</span></div>
      </div>
      <div class="q-foot"><div><b>${t('terms')}</b><p>${t('termsText')}</p><p>${t('validity')}</p>${p.notes ? `<p>${esc(p.notes)}</p>` : ''}</div>
        <div><div class="q-sign">${t('signature')} — ${t('client')}</div></div></div></div>`;
  };

  function tabQuote(box, p) {
    box.innerHTML = `<div class="card-h"><h3>${t('quote')}</h3><button class="btn btn-gold" id="pr">${ic('print')} ${t('print')} / PDF</button></div>
      <div style="background:#fff;border-radius:16px;padding:clamp(14px,3vw,36px);overflow-x:auto;box-shadow:var(--shadow)">${MG.quoteHtml(p)}</div>`;
    box.querySelector('#pr').onclick = () => MG.print(MG.quoteHtml(p));
  }

  /* ---------------- More (mobile) ---------------- */
  MG.views.more = function (el) {
    const skip = ['dashboard', 'projects', 'customers'];
    const items = MG.nav.filter(n => MG.navAllowed(n) && !skip.includes(n[0]));
    el.innerHTML = MG.page(t('more'), '') + `<div class="plist">${items
      .map(n => `<a class="prow" href="${n[2]}" style="grid-template-columns:52px 1fr auto"><div class="picon mixed">${ic(n[1])}</div><div class="prow-t">${t(n[0])}</div><div class="flip muted" style="width:20px">${ic('chevron')}</div></a>`).join('')}
      <button class="prow" onclick="MG.changePassword()" style="grid-template-columns:52px 1fr;text-align:start;font:inherit"><div class="picon mixed">${ic('lock')}</div><div class="prow-t">${t('changePassword')}</div></button>
      <button class="prow" onclick="MG.logout()" style="grid-template-columns:52px 1fr;text-align:start;font:inherit"><div class="picon iron">${ic('logout')}</div><div><div class="prow-t">${t('logout')}</div><div class="prow-m">${esc(MG.user.name)} · ${t('role_' + MG.user.role)}</div></div></button></div>`;
  };
})();
