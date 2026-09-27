/* Majed Group — monthly & yearly management reports (all figures come from the journal) */
(function () {
  const t = MG.t, ic = MG.ic, esc = MG.esc, money = MG.money;
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  MG.iso = iso;

  MG.periodStats = function (from, to) {
    const a = iso(from), b = iso(to), inR = s => s && s >= a && s < b;
    const S = MG.sums(a, b);
    const nat = (id, credit) => { const x = S[id] || { dr: 0, cr: 0 }; return credit ? x.cr - x.dr : x.dr - x.cr; };
    const res = { sec: { alu: nat('rev:alu', 1), iron: nat('rev:iron', 1) }, otherIncome: nat('rev:other', 1), cats: {}, projects: [], count: 0, pipeline: 0, quotes: 0 };
    res.sales = res.sec.alu + res.sec.iron;
    res.cogs = 0; res.opex = 0;
    MG.db.settings.categories.forEach(c => {
      const v = nat('exp:' + c.id);
      if (Math.abs(v) > 0.004) { res.cats[c.id] = v; if (c.group === 'cogs') res.cogs += v; else res.opex += v; }
    });
    res.expenses = res.cogs + res.opex;
    res.gross = res.sales - res.cogs;
    res.net = res.sales + res.otherIncome - res.expenses;
    // cash movement (all cash/bank accounts, transfers and opening balances excluded)
    res.cashIn = 0; res.cashOut = 0; res.collected = 0;
    MG.journal().forEach(e => {
      if (!inR(e.date) || e.src.t === 'transfer' || e.ref === 'OB') return;
      e.lines.forEach(l => { if (l.acc.startsWith('acc:')) { res.cashIn += l.dr; res.cashOut += l.cr; if (e.src.t === 'payment') res.collected += l.dr; } });
    });
    MG.db.projects.forEach(p => {
      if (!inR(p.date)) return;
      const T = MG.projectTotals(p);
      if (p.status === 'active' || p.status === 'done') { res.count++; res.projects.push({ p, T }); }
      else if (p.status === 'quote') { res.pipeline += T.net; res.quotes++; res.projects.push({ p, T }); }
    });
    return res;
  };

  MG.trendChart = function (year, hlMonth) {
    const months = [...Array(12).keys()].map(m => MG.periodStats(new Date(year, m, 1), new Date(year, m + 1, 1)));
    const W = 720, H = 250, pl = 50, pr = 10, pt = 14, pb = 28;
    const max = Math.max(100, ...months.map(s => Math.max(s.sales, s.expenses, s.collected)));
    const step = niceStep(max / 4), top = Math.ceil(max / step) * step;
    const cw = (W - pl - pr) / 12, bw = Math.min(18, cw * 0.3);
    const y = v => pt + (H - pt - pb) * (1 - Math.max(0, v) / top);
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

  /* Income statement block (used by reports and accounting) */
  MG.plHtml = function (from, to) {
    const P = MG.incomeStatement(from, to);
    const rows = list => list.map(a => `<div class="trow"><span><span class="muted num" style="font-size:12px">${a.code}</span> ${esc(MG.nm(a.name))}</span><span class="money">${money(a.v)}</span></div>`).join('') || `<div class="trow muted"><span>—</span><span></span></div>`;
    const pct = v => P.totalRevenue ? ` <span class="muted">(${Math.round(v / P.totalRevenue * 100)}%)</span>` : '';
    return `<div class="totals pl">
      <div class="pl-h">${t('revenue')}</div>${rows(P.revenue)}
      <div class="trow sub"><span>${t('totalRevenue')}</span><span class="money">${money(P.totalRevenue)}</span></div>
      <div class="pl-h">${t('cogs')}</div>${rows(P.cogs)}
      <div class="trow sub"><span>${t('totalCogs')}</span><span class="money">${money(P.totalCogs)}</span></div>
      <div class="trow sub"><span><b>${t('grossProfitAcc')}</b>${pct(P.gross)}</span><span class="money"><b>${money(P.gross)}</b></span></div>
      <div class="pl-h">${t('opex')}</div>${rows(P.opex)}
      <div class="trow sub"><span>${t('totalOpex')}</span><span class="money">${money(P.totalOpex)}</span></div>
      <div class="trow big"><span>${t('netProfit')}${pct(P.net)}</span><span class="money ${P.net >= 0 ? 'pos' : 'neg'}">${money(P.net)}</span></div>
    </div>`;
  };

  /* ---------------- Reports view ---------------- */
  const rs = { mode: 'monthly', year: new Date().getFullYear(), month: new Date().getMonth() };
  MG.views.reports = function (el) {
    const years = new Set([new Date().getFullYear()]);
    MG.journal().forEach(e => e.date && e.date > '2000' && years.add(+e.date.slice(0, 4)));
    MG.db.projects.forEach(p => p.date && years.add(+p.date.slice(0, 4)));
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
      <button class="btn btn-gold" id="pr">${ic('print')} ${t('print')}</button>`) + `
      <div class="kpis">
        <div class="kpi hl"><div class="kpi-l">${ic('trend')}${t('sales')}</div><div class="kpi-v money">${money(st.sales, 0)}</div><div class="kpi-s">${st.count} ${t('projects')} · ${t('avgProject')} <span class="money">${money(st.count ? st.sales / st.count : 0, 0)}</span></div></div>
        <div class="kpi"><div class="kpi-l">${ic('coins')}${t('collected')}</div><div class="kpi-v money">${money(st.collected, 0)}</div><div class="kpi-s">${t('pipeline')}: <span class="money">${money(st.pipeline, 0)}</span> (${st.quotes})</div></div>
        <div class="kpi"><div class="kpi-l">${ic('wallet')}${t('expensesT')}</div><div class="kpi-v money">${money(st.expenses, 0)}</div><div class="kpi-s">${t('netCash')}: <span class="money ${st.cashIn - st.cashOut >= 0 ? 'pos' : 'neg'}">${money(st.cashIn - st.cashOut, 0)}</span></div></div>
        <div class="kpi"><div class="kpi-l">${ic('chart')}${t('netProfit')}</div><div class="kpi-v money ${st.net >= 0 ? 'pos' : 'neg'}">${money(st.net, 0)}</div><div class="kpi-s">${t('margin2')}: ${st.sales ? Math.round(st.net / st.sales * 100) : 0}% · ${t('grossProfitAcc')} <span class="money">${money(st.gross, 0)}</span></div></div>
      </div>
      <div class="two-col" style="margin-bottom:18px">
        <div class="cards">
          <div class="card"><div class="card-h"><h3>${t('monthlyTrend')} · ${rs.year}</h3></div>${MG.trendChart(rs.year, rs.mode === 'monthly' ? rs.month : null)}</div>
          <div class="card"><div class="card-h"><h3>${t('incomeStatement')}</h3><a class="btn btn-sm btn-ghost" href="#/accounting/pl">${t('accounting')}</a></div>${MG.plHtml(iso(from), iso(to))}</div>
        </div>
        <div class="cards">
          <div class="card"><div class="card-h"><h3>${t('bySection')}</h3></div>${MG.sectionSplit(st)}</div>
          <div class="card"><div class="card-h"><h3>${t('expensesByCat')}</h3></div>
            ${Object.keys(st.cats).length ? `<div class="bd">${Object.entries(st.cats).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
              `<div class="bd-row"><span>${esc(MG.nm(MG.getCategory(k).name))}</span><div class="bd-bar"><i style="width:${Math.max(0, v) / catMax * 100}%;background:var(--iron)"></i></div><span class="money">${money(v, 0)}</span></div>`).join('')}</div>` : '<p class="muted">—</p>'}
          </div>
          <div class="card"><div class="card-h"><h3>${t('cashFlow')}</h3></div><div class="totals">
            <div class="trow"><span>${t('cashIn')}</span><span class="money pos">${money(st.cashIn)}</span></div>
            <div class="trow"><span>${t('cashOut')}</span><span class="money neg">${money(st.cashOut)}</span></div>
            <div class="trow big"><span>${t('netCash')}</span><span class="money">${money(st.cashIn - st.cashOut)}</span></div></div></div>
        </div>
      </div>
      <div class="card"><div class="card-h"><h3>${t('projectsInPeriod')}</h3></div>
        ${st.projects.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>${t('code')}</th><th>${t('project')}</th><th>${t('client')}</th><th>${t('section')}</th><th>${t('status')}</th>
          <th class="r">${t('total')}</th><th class="r">${t('paid')}</th><th class="r">${t('balance')}</th><th class="r">${t('profit')}</th></tr></thead><tbody>
          ${st.projects.map(({ p, T }) => `<tr style="cursor:pointer" data-pid="${p.id}"><td class="num">${esc(p.code)}</td><td>${esc(p.name)}</td><td>${esc(MG.clientName(p))}</td><td>${MG.secTag(p.section)}</td><td>${MG.stTag(p.status)} ${MG.payTag(MG.payStatus(p, T))}</td>
            <td class="r money">${money(T.total, 0)}</td><td class="r money">${money(T.paid, 0)}</td><td class="r money">${money(T.balance, 0)}</td><td class="r money ${T.profit >= 0 ? 'pos' : 'neg'}">${money(T.profit, 0)}</td></tr>`).join('')}
          </tbody><tfoot><tr><td colspan="5">${t('total')} (${t('st_active')} + ${t('st_done')})</td>
            <td class="r money">${money(sum(contracted, x => x.T.total), 0)}</td><td class="r money">${money(sum(contracted, x => x.T.paid), 0)}</td>
            <td class="r money">${money(sum(contracted, x => x.T.balance), 0)}</td><td class="r money">${money(sum(contracted, x => x.T.profit), 0)}</td></tr></tfoot></table></div>` : '<p class="muted">—</p>'}
      </div>`;

    el.querySelectorAll('#md button').forEach(b => b.onclick = () => { rs.mode = b.dataset.v; MG.route(); });
    const m = el.querySelector('#m'); if (m) m.onchange = e => { rs.month = +e.target.value; MG.route(); };
    el.querySelector('#y').onchange = e => { rs.year = +e.target.value; MG.route(); };
    el.querySelectorAll('[data-pid]').forEach(r => r.onclick = () => MG.go('#/project/' + r.dataset.pid));
    el.querySelector('#pr').onclick = () => MG.print(`<div class="q">${MG.docHeader(t('reports'), '', t(rs.mode) + ' · ' + title)}
        <table><tbody>
          <tr><td>${t('sales')}</td><td class="r money">${money(st.sales)}</td><td>${t('alu')}</td><td class="r money">${money(st.sec.alu)}</td></tr>
          <tr><td>${t('collected')}</td><td class="r money">${money(st.collected)}</td><td>${t('iron')}</td><td class="r money">${money(st.sec.iron)}</td></tr>
          <tr><td>${t('cashIn')}</td><td class="r money">${money(st.cashIn)}</td><td>${t('cashOut')}</td><td class="r money">${money(st.cashOut)}</td></tr>
          <tr><td>${t('pipeline')}</td><td class="r money">${money(st.pipeline)}</td><td><b>${t('netProfit')}</b></td><td class="r money"><b>${money(st.net)}</b></td></tr>
        </tbody></table>
        <h3 style="margin:22px 0 8px">${t('incomeStatement')}</h3>${MG.plHtml(iso(from), iso(to))}
        <h3 style="margin:22px 0 8px">${t('projectsInPeriod')}</h3>
        <table><thead><tr><th>${t('code')}</th><th>${t('project')}</th><th>${t('client')}</th><th>${t('status')}</th><th class="r">${t('total')}</th><th class="r">${t('paid')}</th><th class="r">${t('balance')}</th></tr></thead>
        <tbody>${st.projects.map(({ p, T }) => `<tr><td class="num">${esc(p.code)}</td><td>${esc(p.name)}</td><td>${esc(MG.clientName(p))}</td><td>${t('st_' + p.status)}</td><td class="r money">${money(T.total)}</td><td class="r money">${money(T.paid)}</td><td class="r money">${money(T.balance)}</td></tr>`).join('')}</tbody></table></div>`);
    el.querySelector('#csv').onclick = () => {
      const rows = [['code', 'project', 'client', 'section', 'status', 'date', 'total', 'paid', 'balance', 'est_cost', 'actual_cost', 'profit']];
      st.projects.forEach(({ p, T }) => rows.push([p.code, p.name, MG.clientName(p), p.section, p.status, p.date, T.total.toFixed(2), T.paid.toFixed(2), T.balance.toFixed(2), T.estCost.toFixed(2), T.actual.toFixed(2), T.profit.toFixed(2)]));
      rows.push([]);
      rows.push(['sales', st.sales.toFixed(2)], ['other_income', st.otherIncome.toFixed(2)], ['cogs', st.cogs.toFixed(2)], ['opex', st.opex.toFixed(2)], ['net_profit', st.net.toFixed(2)],
        ['collected', st.collected.toFixed(2)], ['cash_in', st.cashIn.toFixed(2)], ['cash_out', st.cashOut.toFixed(2)]);
      rows.push([]);
      Object.entries(st.cats).forEach(([k, v]) => rows.push(['expense', MG.nm(MG.getCategory(k).name), v.toFixed(2)]));
      MG.downloadCsv('majed-report-' + (rs.mode === 'monthly' ? rs.year + '-' + String(rs.month + 1).padStart(2, '0') : rs.year) + '.csv', rows);
    };
  };
  function sum(a, f) { return a.reduce((s, x) => s + f(x), 0); }
  MG.downloadCsv = function (name, rows) {
    const csv = '﻿' + rows.map(r => r.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\n');
    MG.download(name, csv, 'text/csv');
  };
})();
