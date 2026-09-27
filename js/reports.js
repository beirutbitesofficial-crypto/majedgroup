/* Majed Group — monthly & yearly reports, charts and expenses */
(function () {
  const t = MG.t, ic = MG.ic, esc = MG.esc, money = MG.money;
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const CATS = ['material', 'labor', 'transport', 'install', 'rent', 'salary', 'utilities', 'tools', 'other'];

  MG.periodStats = function (from, to) {
    const a = iso(from), b = iso(to), inR = s => s && s >= a && s < b;
    const res = { sales: 0, gross: 0, count: 0, collected: 0, expenses: 0, pipeline: 0, quotes: 0,
      sec: { alu: 0, iron: 0 }, secCollected: { alu: 0, iron: 0, mixed: 0 }, cats: {}, projects: [] };
    MG.db.projects.forEach(p => {
      if (!inR(p.date)) return;
      const T = MG.projectTotals(p);
      if (p.status === 'active' || p.status === 'done') {
        res.sales += T.net; res.gross += T.net - T.estCost; res.count++;
        const f = T.subtotal > 0 ? T.net / T.subtotal : 0;
        p.items.forEach((it, i) => { res.sec[it.section] += T.rows[i].total * f; });
        res.projects.push({ p, T });
      } else if (p.status === 'quote') { res.pipeline += T.net; res.quotes++; res.projects.push({ p, T }); }
    });
    MG.db.payments.forEach(x => {
      if (!inR(x.date)) return;
      res.collected += +x.amount || 0;
      const p = MG.getProject(x.projectId); if (p) res.secCollected[p.section] += +x.amount || 0;
    });
    MG.db.expenses.forEach(x => {
      if (!inR(x.date)) return;
      res.expenses += +x.amount || 0;
      res.cats[x.category || 'other'] = (res.cats[x.category || 'other'] || 0) + (+x.amount || 0);
    });
    return res;
  };

  MG.trendChart = function (year, hlMonth) {
    const months = [...Array(12).keys()].map(m => MG.periodStats(new Date(year, m, 1), new Date(year, m + 1, 1)));
    const W = 720, H = 250, pl = 50, pr = 10, pt = 14, pb = 28;
    const max = Math.max(100, ...months.map(s => Math.max(s.sales, s.expenses, s.collected)));
    const step = niceStep(max / 4), top = Math.ceil(max / step) * step;
    const cw = (W - pl - pr) / 12, bw = Math.min(18, cw * 0.3);
    const y = v => pt + (H - pt - pb) * (1 - v / top);
    const names = MG.monthNames();
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" direction="ltr"><defs><linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1d9a4"/><stop offset="1" stop-color="#a57c34"/></linearGradient></defs>`;
    for (let v = 0; v <= top; v += step) s += `<line class="gl" x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end">${short(v)}</text>`;
    months.forEach((m, i) => {
      const cx = pl + cw * i + cw / 2;
      if (hlMonth === i) s += `<rect x="${pl + cw * i + 2}" y="${pt}" width="${cw - 4}" height="${H - pt - pb}" rx="8" fill="rgba(212,175,106,.08)"/>`;
      s += `<rect class="b-sales" x="${cx - bw - 1}" y="${y(m.sales)}" width="${bw}" height="${Math.max(0, y(0) - y(m.sales))}" rx="3"><title>${t('sales')}: ${money(m.sales, 0)}</title></rect>`;
      s += `<rect class="b-exp" x="${cx + 1}" y="${y(m.expenses)}" width="${bw}" height="${Math.max(0, y(0) - y(m.expenses))}" rx="3"><title>${t('expensesT')}: ${money(m.expenses, 0)}</title></rect>`;
      s += `<text x="${cx}" y="${H - 8}" text-anchor="middle">${MG.lang === 'ar' ? i + 1 : names[i].slice(0, 3)}</text>`;
    });
    s += `<polyline class="l-col" points="${months.map((m, i) => `${pl + cw * i + cw / 2},${y(m.collected)}`).join(' ')}"/>`;
    months.forEach((m, i) => { s += `<circle class="d-col" cx="${pl + cw * i + cw / 2}" cy="${y(m.collected)}" r="3.2"><title>${t('collected')}: ${money(m.collected, 0)}</title></circle>`; });
    s += `<line class="ax" x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}"/></svg>`;
    return s + `<div class="legend" style="margin-top:8px"><span><i style="background:var(--gold)"></i>${t('sales')}</span><span><i style="background:var(--iron)"></i>${t('expensesT')}</span><span><i style="background:var(--ok);border-radius:50%"></i>${t('collected')}</span></div>`;
  };
  function niceStep(v) { const p = Math.pow(10, Math.floor(Math.log10(v || 1))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
  function short(v) { return v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : String(v); }

  MG.sectionSplit = function (st) {
    const tot = st.sec.alu + st.sec.iron;
    const pa = tot ? st.sec.alu / tot * 100 : 50;
    return `<div class="split"><i style="width:${pa}%;background:var(--alu)"></i><i style="width:${100 - pa}%;background:var(--iron)"></i></div>
      <div class="totals">
        <div class="trow"><span>${MG.secTag('alu')}</span><span class="money">${money(st.sec.alu, 0)} <span class="muted">· ${tot ? Math.round(pa) : 0}%</span></span></div>
        <div class="trow"><span>${MG.secTag('iron')}</span><span class="money">${money(st.sec.iron, 0)} <span class="muted">· ${tot ? Math.round(100 - pa) : 0}%</span></span></div>
        <div class="trow big"><span>${t('sales')}</span><span class="money">${money(tot, 0)}</span></div>
      </div>`;
  };

  /* ---------------- Reports view ---------------- */
  const rs = { mode: 'monthly', year: new Date().getFullYear(), month: new Date().getMonth() };
  MG.views.reports = function (el) {
    const years = new Set([new Date().getFullYear()]);
    MG.db.projects.forEach(p => p.date && years.add(+p.date.slice(0, 4)));
    MG.db.payments.concat(MG.db.expenses).forEach(x => x.date && years.add(+x.date.slice(0, 4)));
    const from = rs.mode === 'monthly' ? new Date(rs.year, rs.month, 1) : new Date(rs.year, 0, 1);
    const to = rs.mode === 'monthly' ? new Date(rs.year, rs.month + 1, 1) : new Date(rs.year + 1, 0, 1);
    const st = MG.periodStats(from, to);
    const title = rs.mode === 'monthly' ? MG.monthNames()[rs.month] + ' ' + rs.year : String(rs.year);
    const catMax = Math.max(1, ...Object.values(st.cats));
    const contracted = st.projects.filter(x => x.p.status !== 'quote');

    el.innerHTML = MG.page(t('reports'), title, `
      <div class="seg-ctl" id="md"><button data-v="monthly" class="${rs.mode === 'monthly' ? 'on' : ''}">${t('monthly')}</button><button data-v="yearly" class="${rs.mode === 'yearly' ? 'on' : ''}">${t('yearly')}</button></div>
      ${rs.mode === 'monthly' ? MG.sel('m', MG.monthNames().map((n, i) => [i, n]), rs.month, 'id="m" style="width:auto"') : ''}
      ${MG.sel('y', [...years].sort((a, b) => b - a).map(y => [y, y]), rs.year, 'id="y" style="width:auto"')}
      <button class="btn" id="csv">${ic('download')} ${t('exportCsv')}</button>
      <button class="btn btn-gold" id="pr">${ic('print')} ${t('print')}</button>`) + `<div id="rep">
      <div class="kpis">
        <div class="kpi hl"><div class="kpi-l">${ic('trend')}${t('sales')}</div><div class="kpi-v money">${money(st.sales, 0)}</div><div class="kpi-s">${st.count} ${t('projects')} · ${t('avgProject')} <span class="money">${money(st.count ? st.sales / st.count : 0, 0)}</span></div></div>
        <div class="kpi"><div class="kpi-l">${ic('coins')}${t('collected')}</div><div class="kpi-v money">${money(st.collected, 0)}</div><div class="kpi-s">${t('pipeline')}: <span class="money">${money(st.pipeline, 0)}</span> (${st.quotes})</div></div>
        <div class="kpi"><div class="kpi-l">${ic('wallet')}${t('expensesT')}</div><div class="kpi-v money">${money(st.expenses, 0)}</div><div class="kpi-s">${t('netCash')}: <span class="money ${st.collected - st.expenses >= 0 ? 'pos' : 'neg'}">${money(st.collected - st.expenses, 0)}</span></div></div>
        <div class="kpi"><div class="kpi-l">${ic('chart')}${t('grossProfit')}</div><div class="kpi-v money ${st.gross >= 0 ? 'pos' : 'neg'}">${money(st.gross, 0)}</div><div class="kpi-s">${t('margin2')}: ${st.sales ? Math.round(st.gross / st.sales * 100) : 0}%</div></div>
      </div>
      <div class="two-col" style="margin-bottom:18px">
        <div class="card"><div class="card-h"><h3>${t('monthlyTrend')} · ${rs.year}</h3></div>${MG.trendChart(rs.year, rs.mode === 'monthly' ? rs.month : null)}</div>
        <div class="cards">
          <div class="card"><div class="card-h"><h3>${t('bySection')}</h3></div>${MG.sectionSplit(st)}</div>
          <div class="card"><div class="card-h"><h3>${t('expensesByCat')}</h3></div>
            ${Object.keys(st.cats).length ? `<div class="bd">${Object.entries(st.cats).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
              `<div class="bd-row"><span>${t('c_' + k)}</span><div class="bd-bar"><i style="width:${v / catMax * 100}%;background:var(--iron)"></i></div><span class="money">${money(v, 0)}</span></div>`).join('')}</div>` : '<p class="muted">—</p>'}
          </div>
        </div>
      </div>
      <div class="card"><div class="card-h"><h3>${t('projectsInPeriod')}</h3></div>
        ${st.projects.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>${t('code')}</th><th>${t('project')}</th><th>${t('client')}</th><th>${t('section')}</th><th>${t('status')}</th>
          <th class="r">${t('total')}</th><th class="r">${t('paid')}</th><th class="r">${t('balance')}</th><th class="r">${t('profit')}</th></tr></thead><tbody>
          ${st.projects.map(({ p, T }) => `<tr style="cursor:pointer" data-pid="${p.id}"><td class="num">${esc(p.code)}</td><td>${esc(p.name)}</td><td>${esc(p.client)}</td><td>${MG.secTag(p.section)}</td><td>${MG.stTag(p.status)}</td>
            <td class="r money">${money(T.total, 0)}</td><td class="r money">${money(T.paid, 0)}</td><td class="r money">${money(T.balance, 0)}</td><td class="r money ${T.profit >= 0 ? 'pos' : 'neg'}">${money(T.profit, 0)}</td></tr>`).join('')}
          </tbody><tfoot><tr><td colspan="5">${t('total')} (${t('st_active')} + ${t('st_done')})</td>
            <td class="r money">${money(sum(contracted, x => x.T.total), 0)}</td><td class="r money">${money(sum(contracted, x => x.T.paid), 0)}</td>
            <td class="r money">${money(sum(contracted, x => x.T.balance), 0)}</td><td class="r money">${money(sum(contracted, x => x.T.profit), 0)}</td></tr></tfoot></table></div>` : '<p class="muted">—</p>'}
      </div></div>`;

    el.querySelectorAll('#md button').forEach(b => b.onclick = () => { rs.mode = b.dataset.v; MG.route(); });
    const m = el.querySelector('#m'); if (m) m.onchange = e => { rs.month = +e.target.value; MG.route(); };
    el.querySelector('#y').onchange = e => { rs.year = +e.target.value; MG.route(); };
    el.querySelectorAll('[data-pid]').forEach(r => r.onclick = () => MG.go('#/project/' + r.dataset.pid));
    el.querySelector('#pr').onclick = () => {
      const c = MG.db.settings.company;
      MG.print(`<div class="q"><div class="q-head"><div class="q-brand"><div class="q-mark">M</div><div><div class="q-name">${esc(MG.lang === 'ar' ? c.nameAr || c.name : c.name)}</div><div class="q-sub">${t('appSub')}</div></div></div>
        <div class="q-title"><h1>${t('reports')}</h1><div>${t(rs.mode)} · ${title}</div></div></div>
        <table><tbody>
          <tr><td>${t('sales')}</td><td class="r money">${money(st.sales)}</td><td>${t('alu')}</td><td class="r money">${money(st.sec.alu)}</td></tr>
          <tr><td>${t('collected')}</td><td class="r money">${money(st.collected)}</td><td>${t('iron')}</td><td class="r money">${money(st.sec.iron)}</td></tr>
          <tr><td>${t('expensesT')}</td><td class="r money">${money(st.expenses)}</td><td>${t('pipeline')}</td><td class="r money">${money(st.pipeline)}</td></tr>
          <tr><td><b>${t('netCash')}</b></td><td class="r money"><b>${money(st.collected - st.expenses)}</b></td><td><b>${t('grossProfit')}</b></td><td class="r money"><b>${money(st.gross)}</b></td></tr>
        </tbody></table>
        <h3 style="margin:22px 0 8px">${t('expensesByCat')}</h3>
        <table><tbody>${Object.entries(st.cats).map(([k, v]) => `<tr><td>${t('c_' + k)}</td><td class="r money">${money(v)}</td></tr>`).join('') || '<tr><td>—</td></tr>'}</tbody></table>
        <h3 style="margin:22px 0 8px">${t('projectsInPeriod')}</h3>
        <table><thead><tr><th>${t('code')}</th><th>${t('project')}</th><th>${t('client')}</th><th>${t('status')}</th><th class="r">${t('total')}</th><th class="r">${t('paid')}</th><th class="r">${t('balance')}</th></tr></thead>
        <tbody>${st.projects.map(({ p, T }) => `<tr><td class="num">${esc(p.code)}</td><td>${esc(p.name)}</td><td>${esc(p.client)}</td><td>${t('st_' + p.status)}</td><td class="r money">${money(T.total)}</td><td class="r money">${money(T.paid)}</td><td class="r money">${money(T.balance)}</td></tr>`).join('')}</tbody></table></div>`);
    };
    el.querySelector('#csv').onclick = () => {
      const rows = [['code', 'project', 'client', 'section', 'status', 'date', 'total', 'paid', 'balance', 'est_cost', 'actual_expenses', 'profit']];
      st.projects.forEach(({ p, T }) => rows.push([p.code, p.name, p.client, p.section, p.status, p.date, T.total.toFixed(2), T.paid.toFixed(2), T.balance.toFixed(2), T.estCost.toFixed(2), T.actual.toFixed(2), T.profit.toFixed(2)]));
      rows.push([]);
      rows.push(['sales', st.sales.toFixed(2)], ['collected', st.collected.toFixed(2)], ['expenses', st.expenses.toFixed(2)], ['gross_profit', st.gross.toFixed(2)]);
      const csv = '﻿' + rows.map(r => r.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\n');
      MG.download('majed-report-' + (rs.mode === 'monthly' ? rs.year + '-' + String(rs.month + 1).padStart(2, '0') : rs.year) + '.csv', csv, 'text/csv');
    };
  };
  function sum(a, f) { return a.reduce((s, x) => s + f(x), 0); }

  /* ---------------- Expenses ---------------- */
  MG.expenseTable = function (list, showProject) {
    if (!list.length) return '<p class="muted">—</p>';
    const total = list.reduce((s, x) => s + (+x.amount || 0), 0);
    return `<div class="table-wrap"><table class="t"><thead><tr><th>${t('date')}</th><th>${t('category')}</th>${showProject ? `<th>${t('expenseProject')}</th>` : ''}<th>${t('notes')}</th><th class="r">${t('amount')}</th><th></th></tr></thead><tbody>
      ${list.map(x => { const p = x.projectId && MG.getProject(x.projectId); return `<tr><td class="num">${esc(x.date)}</td><td>${t('c_' + (x.category || 'other'))}</td>
        ${showProject ? `<td>${p ? `<a href="#/project/${p.id}/finance">${esc(p.name || p.code)}</a>` : `<span class="muted">${t('general')}</span>`}</td>` : ''}
        <td>${esc(x.note || '')}</td><td class="r money">${money(x.amount)}</td>
        <td class="r" style="white-space:nowrap"><button class="btn btn-ghost btn-sm btn-icon" data-ee="${x.id}">${ic('edit')}</button><button class="btn btn-ghost btn-sm btn-icon btn-danger" data-de="${x.id}">${ic('trash')}</button></td></tr>`; }).join('')}
      </tbody><tfoot><tr><td colspan="${showProject ? 4 : 3}">${t('total')}</td><td class="r money">${money(total)}</td><td></td></tr></tfoot></table></div>`;
  };
  MG.bindExpenseTable = function (root) {
    root.querySelectorAll('[data-de]').forEach(b => b.onclick = () => MG.confirm(t('confirmDelete'), () => {
      MG.db.expenses = MG.db.expenses.filter(x => x.id !== b.dataset.de); MG.save(); MG.route();
    }));
    root.querySelectorAll('[data-ee]').forEach(b => b.onclick = () => MG.expenseForm(MG.db.expenses.find(x => x.id === b.dataset.ee)));
  };
  MG.expenseForm = function (ex) {
    const isNew = !ex || !ex.id;
    const d = Object.assign({ date: MG.today(), category: 'material', amount: '', note: '', projectId: '' }, ex || {});
    const projOpts = [['', t('general')]].concat(MG.db.projects.map(p => [p.id, p.code + ' — ' + (p.name || p.client || '')]));
    const m = MG.modal(t('addExpense'), `<div class="grid g2">
      ${MG.fld(t('amount'), MG.inp('amount', d.amount, 'number'))}
      ${MG.fld(t('date'), MG.inp('date', d.date, 'date'))}
      ${MG.fld(t('category'), MG.sel('category', CATS.map(c => [c, t('c_' + c)]), d.category))}
      ${MG.fld(t('expenseProject'), MG.sel('projectId', projOpts, d.projectId || ''))}
      ${MG.fld(t('notes'), MG.inp('note', d.note), 'span2')}</div>`,
      `<button class="btn" data-close>${t('cancel')}</button><button class="btn btn-gold" id="ok">${t('save')}</button>`);
    m.querySelector('[data-close]').onclick = () => MG.closeModal();
    m.querySelector('#ok').onclick = () => {
      const v = MG.formData(m);
      if (!(v.amount > 0)) return;
      v.projectId = v.projectId || null;
      if (isNew) MG.db.expenses.push(Object.assign({ id: MG.uid() }, v));
      else Object.assign(ex, v);
      MG.save(); MG.closeModal(); MG.toast(t('saved')); MG.route();
    };
  };

  const ef = { month: MG.today().slice(0, 7) };
  MG.views.expenses = function (el) {
    const list = MG.db.expenses.filter(x => !ef.month || (x.date || '').startsWith(ef.month)).sort((a, b) => a.date < b.date ? 1 : -1);
    el.innerHTML = MG.page(t('expenses'), '', `<input type="month" class="input" id="mf" value="${ef.month}" style="width:auto">
      <button class="btn btn-gold" id="ae">${ic('plus')} ${t('addExpense')}</button>`) + `<div class="card">${MG.expenseTable(list, true)}</div>`;
    el.querySelector('#ae').onclick = () => MG.expenseForm();
    el.querySelector('#mf').onchange = e => { ef.month = e.target.value; MG.route(); };
    MG.bindExpenseTable(el);
  };
})();
