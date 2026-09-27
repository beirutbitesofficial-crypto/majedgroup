/* Majed Group — dashboard, projects list and project workspace */
(function () {
  const t = MG.t, ic = MG.ic, esc = MG.esc, money = MG.money;

  /* ---------------- Dashboard ---------------- */
  MG.views.dashboard = function (el) {
    const now = new Date(), y = now.getFullYear(), m = now.getMonth();
    const month = MG.periodStats(new Date(y, m, 1), new Date(y, m + 1, 1));
    const year = MG.periodStats(new Date(y, 0, 1), new Date(y + 1, 0, 1));
    const receivable = MG.db.projects.filter(p => p.status === 'active' || p.status === 'done')
      .reduce((s, p) => s + Math.max(0, MG.projectTotals(p).balance), 0);
    const active = MG.db.projects.filter(p => p.status === 'active').length;
    const recent = MG.db.projects.slice(0, 6);
    const hello = MG.lang === 'ar' ? 'أهلاً بك' : 'Welcome back';
    const dateStr = now.toLocaleDateString(MG.lang === 'ar' ? 'ar-LB' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    el.innerHTML = MG.page(hello, dateStr,
      `<a class="btn" href="#/calc">${ic('calc')} ${t('calculator')}</a><button class="btn btn-gold" id="np">${ic('plus')} ${t('newProject')}</button>`) + `
      <div class="kpis">
        ${kpi(t('sales') + ' · ' + t('thisMonth'), money(month.sales, 0), `${month.count} ${t('projects')}`, 'trend', true)}
        ${kpi(t('collected') + ' · ' + t('thisMonth'), money(month.collected, 0), t('expensesT') + ': ' + money(month.expenses, 0), 'coins')}
        ${kpi(t('netCash') + ' · ' + t('thisMonth'), `<span class="${month.collected - month.expenses >= 0 ? '' : 'neg'}">${money(month.collected - month.expenses, 0)}</span>`, t('grossProfit') + ': ' + money(month.gross, 0), 'wallet')}
        ${kpi(t('outstanding'), money(receivable, 0), `${active} ${t('activeProjects')}`, 'clock')}
      </div>
      <div class="two-col">
        <div class="cards">
          <div class="card">
            <div class="card-h"><h3>${t('monthlyTrend')} · ${y}</h3><a href="#/reports" class="btn btn-sm btn-ghost">${t('reports')} ${ic('chevron').replace('<svg', '<svg class="flip"')}</a></div>
            ${MG.trendChart(y)}
          </div>
          <div class="card">
            <div class="card-h"><h3>${t('recentProjects')}</h3><a href="#/projects" class="btn btn-sm btn-ghost">${t('viewAll')}</a></div>
            ${recent.length ? `<div class="plist">${recent.map(projectRow).join('')}</div>` : emptyProjects()}
          </div>
        </div>
        <div class="cards">
          <div class="card">
            <div class="card-h"><h3>${t('quickActions')}</h3></div>
            <div class="grid" style="gap:10px">
              <a class="btn btn-block" href="#/calc/alu" style="justify-content:flex-start">${ic('window')} ${t('priceAlu')}</a>
              <a class="btn btn-block" href="#/calc/iron" style="justify-content:flex-start">${ic('gate')} ${t('priceIron')}</a>
              <a class="btn btn-block" href="#/sketch" style="justify-content:flex-start">${ic('pen')} ${t('sketch')}</a>
              <a class="btn btn-block" href="#/expenses" style="justify-content:flex-start">${ic('wallet')} ${t('addExpense')}</a>
            </div>
          </div>
          <div class="card">
            <div class="card-h"><h3>${t('bySection')} · ${y}</h3></div>
            ${MG.sectionSplit(year)}
          </div>
        </div>
      </div>`;
    el.querySelector('#np').onclick = () => MG.projectForm();
    el.querySelectorAll('[data-pid]').forEach(r => r.onclick = () => MG.go('#/project/' + r.dataset.pid));
  };

  function kpi(label, value, sub, icon, hl) {
    return `<div class="kpi ${hl ? 'hl' : ''}"><div class="kpi-l">${ic(icon)}${label}</div><div class="kpi-v money">${value}</div><div class="kpi-s">${sub}</div></div>`;
  }
  function emptyProjects() {
    return `<div class="empty">${ic('folder')}<h3>${t('noProjects')}</h3><p>${t('startFirst')}</p>
      <button class="btn btn-gold" onclick="MG.projectForm()">${ic('plus')} ${t('newProject')}</button></div>`;
  }
  function projectRow(p) {
    const T = MG.projectTotals(p);
    const pct = T.total > 0 ? Math.min(100, T.paid / T.total * 100) : 0;
    const icon = p.section === 'iron' ? 'gate' : p.section === 'mixed' ? 'grid' : 'window';
    return `<div class="prow" data-pid="${p.id}">
      <div class="picon ${p.section}">${ic(icon)}</div>
      <div style="min-width:0"><div class="prow-t">${esc(p.name || p.client || p.code)}</div>
        <div class="prow-m"><span class="num">${esc(p.code)}</span>${p.client ? `<span>${esc(p.client)}</span>` : ''}${MG.stTag(p.status)}</div></div>
      <div class="prow-v"><div class="money">${money(T.total, 0)}</div>
        <div><div class="small">${t('paid')} ${Math.round(pct)}%</div><div class="progress"><i style="width:${pct}%"></i></div></div></div>
    </div>`;
  }
  MG.projectRow = projectRow;

  /* ---------------- Projects list ---------------- */
  let pf = { q: '', section: 'all', status: 'all' };
  MG.views.projects = function (el) {
    el.innerHTML = MG.page(t('projects'), `${MG.db.projects.length} ${t('projects')}`,
      `<button class="btn btn-gold" id="np">${ic('plus')} ${t('newProject')}</button>`) + `
      <div class="filters">
        <div class="search">${ic('search')}<input class="input" id="q" placeholder="${t('search')}" value="${esc(pf.q)}"></div>
        <div class="seg-ctl" id="fsec">${['all', 'alu', 'iron', 'mixed'].map(s => `<button data-v="${s}" class="${pf.section === s ? 'on' : ''}">${t(s)}</button>`).join('')}</div>
        ${MG.sel('fst', [['all', t('all')]].concat(MG.statuses.map(s => [s, t('st_' + s)])), pf.status, 'id="fst" style="width:auto"')}
      </div>
      <div id="plist"></div>`;
    const draw = () => {
      const q = pf.q.trim().toLowerCase();
      const list = MG.db.projects.filter(p =>
        (pf.section === 'all' || p.section === pf.section) && (pf.status === 'all' || p.status === pf.status) &&
        (!q || [p.name, p.client, p.code, p.phone, p.location].join(' ').toLowerCase().includes(q)));
      const box = el.querySelector('#plist');
      box.innerHTML = list.length ? `<div class="plist">${list.map(projectRow).join('')}</div>` : (MG.db.projects.length ? `<div class="empty">${ic('search')}<p>—</p></div>` : emptyProjects());
      box.querySelectorAll('[data-pid]').forEach(r => r.onclick = () => MG.go('#/project/' + r.dataset.pid));
    };
    el.querySelector('#np').onclick = () => MG.projectForm();
    el.querySelector('#q').oninput = e => { pf.q = e.target.value; draw(); };
    el.querySelectorAll('#fsec button').forEach(b => b.onclick = () => { pf.section = b.dataset.v; el.querySelectorAll('#fsec button').forEach(x => x.classList.toggle('on', x === b)); draw(); });
    el.querySelector('#fst').onchange = e => { pf.status = e.target.value; draw(); };
    draw();
  };

  /* ---------------- Project form ---------------- */
  MG.projectForm = function (p, onSaved) {
    const isNew = !p;
    const d = p || { section: 'alu', status: 'quote', date: MG.today() };
    const m = MG.modal(isNew ? t('newProject') : t('editProject'), `
      <div class="grid g2">
        ${MG.fld(t('project'), MG.inp('name', d.name, 'text', 'placeholder="' + (MG.lang === 'ar' ? 'مثال: فيلا الحازمية' : 'e.g. Hazmieh villa') + '"'), 'span2')}
        ${MG.fld(t('client'), MG.inp('client', d.client))}
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
    m.querySelector('#ok').onclick = () => {
      const v = MG.formData(m);
      if (!v.date) v.date = MG.today();
      let proj;
      if (isNew) proj = MG.newProject(v);
      else { Object.assign(p, v); proj = p; MG.save(); }
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
    const T = MG.projectTotals(p);
    const pays = MG.db.payments.filter(x => x.projectId === p.id);
    const exps = MG.db.expenses.filter(x => x.projectId === p.id);
    const tabs = [['items', 'grid', t('items'), p.items.length], ['cut', 'scissors', t('cutList')], ['finance', 'cash', t('payments'), pays.length + exps.length],
      ['sketches', 'pen', t('sketches'), (p.sketches || []).length], ['quote', 'print', t('quote')]];
    el.innerHTML = `
      ${MG.page('', '', '').replace('<div class="topbar"><div><h1></h1></div><div class="topbar-actions"></div></div>', '')}
      <a href="#/projects" class="back">${ic('back')} ${t('projects')}</a>
      <div class="phead" style="margin-bottom:22px">
        <div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><h1 style="font-size:clamp(24px,3vw,32px)">${esc(p.name || p.client || p.code)}</h1>${MG.secTag(p.section)}${MG.stTag(p.status)}</div>
          <div class="phead-meta">
            <span class="num">#${esc(p.code)}</span>
            ${p.client ? `<span>${ic('user')}${esc(p.client)}</span>` : ''}
            ${p.phone ? `<span>${ic('phone')}<a href="tel:${esc(p.phone)}" class="num">${esc(p.phone)}</a></span>` : ''}
            ${p.location ? `<span>${ic('map')}${esc(p.location)}</span>` : ''}
            <span>${ic('cal')}<span class="num">${esc(p.date)}</span>${p.dueDate ? ` → <span class="num">${esc(p.dueDate)}</span>` : ''}</span>
          </div>
        </div>
        <div class="topbar-actions">
          ${MG.sel('st', MG.statuses.map(s => [s, t('st_' + s)]), p.status, 'id="st" style="width:auto"')}
          <button class="btn" id="ed">${ic('edit')} ${t('edit')}</button>
          <button class="btn btn-icon btn-danger" id="del" title="${t('delete')}">${ic('trash')}</button>
        </div>
      </div>
      <div class="kpis">
        <div class="kpi hl"><div class="kpi-l">${ic('coins')}${t('grandTotal')}</div><div class="kpi-v money">${money(T.total, 0)}</div><div class="kpi-s">${t('estCost')}: <span class="money">${money(T.estCost, 0)}</span></div></div>
        <div class="kpi"><div class="kpi-l">${ic('cash')}${t('paid')}</div><div class="kpi-v money">${money(T.paid, 0)}</div><div class="kpi-s">${T.total ? Math.round(T.paid / T.total * 100) : 0}%</div></div>
        <div class="kpi"><div class="kpi-l">${ic('clock')}${t('balance')}</div><div class="kpi-v money ${T.balance > 0.5 ? '' : 'pos'}">${money(T.balance, 0)}</div><div class="kpi-s">${t('actualCost')}: <span class="money">${money(T.actual, 0)}</span></div></div>
        <div class="kpi"><div class="kpi-l">${ic('trend')}${t('profit')}</div><div class="kpi-v money ${T.profit >= 0 ? 'pos' : 'neg'}">${money(T.profit, 0)}</div><div class="kpi-s">${t('margin2')}: ${T.net > 0 ? Math.round(T.profit / T.net * 100) : 0}%</div></div>
      </div>
      <div class="tabs">${tabs.map(x => `<button data-tab="${x[0]}" class="${tab === x[0] ? 'on' : ''}">${ic(x[1])}${x[2]}${x[3] ? ` <span class="badge">${x[3]}</span>` : ''}</button>`).join('')}</div>
      <div id="tab"></div>`;
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => MG.go('#/project/' + p.id + '/' + b.dataset.tab));
    el.querySelector('#ed').onclick = () => MG.projectForm(p);
    el.querySelector('#st').onchange = e => { p.status = e.target.value; MG.save(); MG.route(); };
    el.querySelector('#del').onclick = () => MG.confirm(t('confirmDelete'), () => { MG.deleteProject(p.id); MG.toast(t('deleted')); MG.go('#/projects'); });
    const box = el.querySelector('#tab');
    ({ items: tabItems, cut: tabCut, finance: tabFinance, sketches: tabSketches, quote: tabQuote }[tab] || tabItems)(box, p, T);
  };

  function tabItems(box, p, T) {
    const rows = T.rows;
    box.innerHTML = `<div class="two-col">
      <div>
        <div class="card-h"><h3>${t('items')}</h3><div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-sm ${p.section !== 'iron' ? 'btn-gold' : ''}" data-add="alu">${ic('plus')} ${t('alu')}</button>
          <button class="btn btn-sm ${p.section === 'iron' ? 'btn-gold' : ''}" data-add="iron">${ic('plus')} ${t('iron')}</button></div></div>
        ${p.items.length ? `<div class="items">${p.items.map((it, i) => {
          const c = rows[i];
          return `<div class="item-card">
            <div class="item-draw" data-edit="${it.id}">${MG.drawItem(it)}</div>
            <div class="item-body">
              <div class="item-top"><div class="item-t">${esc(MG.itemTitle(it))}</div>${MG.secTag(it.section)}</div>
              <div class="item-meta">${t('t_' + it.type)} · <span class="num">${MG.itemDims(it)}</span>${MG.itemDims(it) ? ' ' + t('cm') : ''} · ${t('qty')} <span class="num">${c.qty}</span></div>
              <div class="item-meta">${t('unitPrice')}: <span class="money">${money(c.unitPrice, 0)}</span> · ${t('cost')}: <span class="money">${money(c.unitCost, 0)}</span></div>
            </div>
            <div class="item-foot"><div class="item-price money">${money(c.total, 0)}</div><div>
              <button class="btn btn-ghost btn-sm btn-icon" data-dup="${it.id}" title="copy">${ic('copy')}</button>
              <button class="btn btn-ghost btn-sm btn-icon" data-edit="${it.id}">${ic('edit')}</button>
              <button class="btn btn-ghost btn-sm btn-icon btn-danger" data-del="${it.id}">${ic('trash')}</button></div></div>
          </div>`;
        }).join('')}</div>` : `<div class="card empty">${ic('ruler')}<p>${t('noItems')}</p></div>`}
      </div>
      <div><div class="card" style="position:sticky;top:20px">
        <div class="card-h"><h3>${t('total')}</h3></div>
        <div class="grid g3" style="margin-bottom:16px" id="pm">
          ${MG.fld(t('margin'), MG.inp('margin', p.margin, 'number'))}
          ${MG.fld(t('discount'), MG.inp('discount', p.discount, 'number'))}
          ${MG.fld(t('vat'), MG.inp('vat', p.vat, 'number'))}
        </div>
        <div class="totals">
          <div class="trow"><span>${t('estCost')}</span><span class="money">${money(T.estCost)}</span></div>
          <div class="trow"><span>${t('subtotal')}</span><span class="money">${money(T.subtotal)}</span></div>
          ${T.discount ? `<div class="trow"><span>${t('discount')}</span><span class="money">-${money(T.discount)}</span></div>` : ''}
          ${T.vatAmt ? `<div class="trow"><span>${t('vat')}</span><span class="money">${money(T.vatAmt)}</span></div>` : ''}
          ${T.weight ? `<div class="trow"><span>${t('weight')}</span><span class="num">${MG.fmt(T.weight, 1)} kg</span></div>` : ''}
          <div class="trow big"><span>${t('grandTotal')}</span><span class="money">${money(T.total)}</span></div>
        </div>
        <button class="btn btn-block" style="margin-top:16px" onclick="MG.go('#/project/${p.id}/quote')">${ic('print')} ${t('quote')}</button>
      </div></div></div>`;
    box.querySelectorAll('[data-add]').forEach(b => b.onclick = () => MG.itemEditor({ project: p, section: b.dataset.add }));
    box.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => MG.itemEditor({ project: p, item: p.items.find(x => x.id === b.dataset.edit) }));
    box.querySelectorAll('[data-dup]').forEach(b => b.onclick = () => {
      const i = p.items.findIndex(x => x.id === b.dataset.dup);
      const c = JSON.parse(JSON.stringify(p.items[i])); c.id = MG.uid();
      p.items.splice(i + 1, 0, c); MG.save(); MG.route();
    });
    box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => MG.confirm(t('confirmDelete'), () => {
      p.items = p.items.filter(x => x.id !== b.dataset.del); MG.save(); MG.route();
    }));
    box.querySelectorAll('#pm input').forEach(inp => inp.onchange = () => { p[inp.name] = parseFloat(inp.value) || 0; MG.save(); MG.route(); });
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
    box.innerHTML = `<div class="two-col">
      <div class="cards">
        <div class="card"><div class="card-h"><h3>${t('payments')}</h3><button class="btn btn-sm btn-gold" id="ap">${ic('plus')} ${t('addPayment')}</button></div>
          ${pays.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>${t('date')}</th><th>${t('method')}</th><th>${t('notes')}</th><th class="r">${t('amount')}</th><th></th></tr></thead><tbody>
          ${pays.map(x => `<tr><td class="num">${esc(x.date)}</td><td>${t(x.method || 'cash')}</td><td>${esc(x.note || '')}</td><td class="r money">${money(x.amount)}</td>
            <td class="r"><button class="btn btn-ghost btn-sm btn-icon btn-danger" data-dp="${x.id}">${ic('trash')}</button></td></tr>`).join('')}
          </tbody><tfoot><tr><td colspan="3">${t('total')}</td><td class="r money">${money(T.paid)}</td><td></td></tr></tfoot></table></div>` : `<p class="muted">—</p>`}
        </div>
        <div class="card"><div class="card-h"><h3>${t('expensesT')}</h3><button class="btn btn-sm" id="ae">${ic('plus')} ${t('addExpense')}</button></div>
          ${MG.expenseTable(exps, false)}
        </div>
      </div>
      <div><div class="card">
        <div class="card-h"><h3>${t('periodSummary')}</h3></div>
        <div class="totals">
          <div class="trow"><span>${t('grandTotal')}</span><span class="money">${money(T.total)}</span></div>
          <div class="trow"><span>${t('paid')}</span><span class="money pos">${money(T.paid)}</span></div>
          <div class="trow"><span>${t('balance')}</span><span class="money">${money(T.balance)}</span></div>
          <div class="trow"><span>${t('estCost')}</span><span class="money">${money(T.estCost)}</span></div>
          <div class="trow"><span>${t('actualCost')}</span><span class="money">${money(T.actual)}</span></div>
          <div class="trow big"><span>${t('profit')}</span><span class="money ${T.profit >= 0 ? 'pos' : 'neg'}">${money(T.profit)}</span></div>
        </div></div></div></div>`;
    box.querySelector('#ap').onclick = () => MG.paymentForm(p);
    box.querySelector('#ae').onclick = () => MG.expenseForm({ projectId: p.id });
    box.querySelectorAll('[data-dp]').forEach(b => b.onclick = () => MG.confirm(t('confirmDelete'), () => {
      MG.db.payments = MG.db.payments.filter(x => x.id !== b.dataset.dp); MG.save(); MG.route();
    }));
    MG.bindExpenseTable(box);
  }

  MG.paymentForm = function (p) {
    const T = MG.projectTotals(p);
    const m = MG.modal(t('addPayment'), `<div class="grid g2">
      ${MG.fld(t('amount'), MG.inp('amount', T.balance > 0 ? Math.round(T.balance) : '', 'number'))}
      ${MG.fld(t('date'), MG.inp('date', MG.today(), 'date'))}
      ${MG.fld(t('method'), MG.sel('method', [['cash', t('cash')], ['transfer', t('transfer')], ['cheque', t('cheque')]], 'cash'))}
      ${MG.fld(t('notes'), MG.inp('note', ''))}</div>`,
      `<button class="btn" data-close>${t('cancel')}</button><button class="btn btn-gold" id="ok">${t('save')}</button>`);
    m.querySelector('[data-close]').onclick = () => MG.closeModal();
    m.querySelector('#ok').onclick = () => {
      const v = MG.formData(m);
      if (!(v.amount > 0)) return;
      MG.db.payments.push({ id: MG.uid(), projectId: p.id, date: v.date || MG.today(), amount: v.amount, method: v.method, note: v.note });
      if (p.status === 'quote') p.status = 'active';
      MG.save(); MG.closeModal(); MG.toast(t('saved')); MG.route();
    };
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
        <div><b>${t('client')}:</b>${esc(p.client || '')}</div><div><b>${t('phone')}:</b><span class="num">${esc(p.phone || '')}</span></div>
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
    el.innerHTML = MG.page(t('more'), '') + `<div class="plist">${[['sketch', 'pen', '#/sketch'], ['expenses', 'wallet', '#/expenses'], ['settings', 'gear', '#/settings'], ['projects', 'folder', '#/projects']]
      .map(n => `<a class="prow" href="${n[2]}" style="grid-template-columns:52px 1fr auto"><div class="picon mixed">${ic(n[1])}</div><div class="prow-t">${t(n[0])}</div><div class="flip muted" style="width:20px">${ic('chevron')}</div></a>`).join('')}</div>`;
  };
})();
