/* Majed Group — accounting: treasury, journal, general ledger, trial balance, income statement, balance sheet */
(function () {
  const t = MG.t, ic = MG.ic, esc = MG.esc, money = MG.money;
  const N = v => parseFloat(v) || 0;
  const today = () => MG.today();
  const ym = () => today().slice(0, 7);

  const ar = { from: ym() + '-01', to: today(), acc: 'acc:cash' };
  function presets() {
    const d = new Date(), y = d.getFullYear(), m = d.getMonth();
    const f = (a, b) => [MG.iso(a), MG.iso(new Date(b.getTime() - 86400000))];
    return [
      ['thisMonth', f(new Date(y, m, 1), new Date(y, m + 1, 1))],
      ['lastMonth', f(new Date(y, m - 1, 1), new Date(y, m, 1))],
      ['thisYear', f(new Date(y, 0, 1), new Date(y + 1, 0, 1))],
      ['lastYear', f(new Date(y - 1, 0, 1), new Date(y, 0, 1))]
    ];
  }
  function rangeBar(asOfOnly) {
    return `<div class="filters range-bar">
      ${asOfOnly ? '' : `<label class="muted">${t('fromDate')}</label><input type="date" class="input" id="rf" value="${ar.from}" style="width:auto">`}
      <label class="muted">${asOfOnly ? t('asOf') : t('toDate')}</label><input type="date" class="input" id="rt" value="${ar.to}" style="width:auto">
      ${asOfOnly ? '' : `<div class="seg-ctl">${presets().map(p => `<button data-pr="${p[1].join('|')}" class="${ar.from === p[1][0] && ar.to === p[1][1] ? 'on' : ''}">${t(p[0])}</button>`).join('')}</div>`}
    </div>`;
  }
  function bindRange(el) {
    const rf = el.querySelector('#rf'), rt = el.querySelector('#rt');
    if (rf) rf.onchange = () => { ar.from = rf.value; MG.route(); };
    if (rt) rt.onchange = () => { ar.to = rt.value; MG.route(); };
    el.querySelectorAll('[data-pr]').forEach(b => b.onclick = () => { [ar.from, ar.to] = b.dataset.pr.split('|'); MG.route(); });
  }
  const toEx = () => ar.to ? MG.nextDay(ar.to) : '';

  MG.views.accounting = function (el, tab) {
    tab = tab || 'treasury';
    const tabs = [['treasury', 'wallet', t('treasury')], ['pl', 'chart', t('incomeStatement')], ['bs', 'book', t('balanceSheet')], ['trial', 'list', t('trialBalance')],
      ['ledger', 'doc', t('generalLedger')], ['journal', 'book', t('journalBook')], ['close', 'lock', t('periodClose')]];
    const J = MG.journal();
    const tb = MG.trialBalance();
    const dr = tb.reduce((s, a) => s + a.dr, 0), cr = tb.reduce((s, a) => s + a.cr, 0);
    const balanced = Math.abs(dr - cr) < 0.01;
    el.innerHTML = MG.page(t('accounting'), `${J.length} ${t('entries')} · <span class="${balanced ? 'pos' : 'neg'}">${balanced ? '✓ ' + t('booksBalanced') : '✗ ' + t('booksNotBalanced')}</span>`,
      `<button class="btn" id="tr">${ic('swap')} ${t('transfer2')}</button><button class="btn" id="eq">${ic('user')} ${t('ownerEntry')}</button>`) +
      `<div class="tabs">${tabs.map(x => `<button data-tab="${x[0]}" class="${tab === x[0] ? 'on' : ''}">${ic(x[1])}${x[2]}</button>`).join('')}</div><div id="tab"></div>`;
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => MG.go('#/accounting/' + b.dataset.tab));
    el.querySelector('#tr').onclick = () => MG.transferForm();
    el.querySelector('#eq').onclick = () => MG.equityForm('drawing');
    const box = el.querySelector('#tab');
    ({ treasury, pl, bs, trial, ledger, journal, close }[tab] || treasury)(box);
    bindRange(box);
  };

  /* ---------- Treasury ---------- */
  function treasury(box) {
    const moves = MG.db.transfers.map(x => ({ x, k: 'transfer' })).concat(MG.db.equity.map(x => ({ x, k: 'equity' }))).sort((a, b) => a.x.date < b.x.date ? 1 : -1);
    box.innerHTML = `<div class="acc-cards">${MG.db.accounts.map(a => {
      const L = MG.ledger('acc:' + a.id, ym() + '-01', '');
      return `<a class="kpi ${a.type === 'cash' ? 'hl' : ''}" href="#/accounting/ledger" data-acc="acc:${a.id}"><div class="kpi-l">${ic(a.type === 'bank' ? 'bank' : 'wallet')}${esc(MG.nm(a.name))}</div>
        <div class="kpi-v money">${money(MG.cashBalance(a.id))}</div>
        <div class="kpi-s">${t('thisMonth')}: <span class="pos">+${money(L.rows.reduce((s, r) => s + r.dr, 0), 0)}</span> / <span class="neg">-${money(L.rows.reduce((s, r) => s + r.cr, 0), 0)}</span></div></a>`;
    }).join('')}</div>
    <div class="two-col" style="margin-top:18px">
      <div class="card"><div class="card-h"><h3>${t('transfersOwner')}</h3></div>
        ${moves.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>${t('date')}</th><th>${t('type')}</th><th>${t('description')}</th><th class="r">${t('amount')}</th><th></th></tr></thead><tbody>
        ${moves.map(({ x, k }) => `<tr><td class="num">${esc(x.date)}</td><td>${k === 'transfer' ? t('transfer2') : t('eq_' + x.type)}</td>
          <td>${k === 'transfer' ? esc(MG.nm((MG.getAccount(x.from) || {}).name) + ' → ' + MG.nm((MG.getAccount(x.to) || {}).name)) : esc(MG.nm((MG.getAccount(x.accountId) || {}).name))} ${x.note ? `<span class="muted">· ${esc(x.note)}</span>` : ''}</td>
          <td class="r money">${money(x.amount)}</td><td class="r">${MG.can('delete') ? `<button class="btn btn-ghost btn-sm btn-icon btn-danger" data-dm="${k}:${x.id}">${ic('trash')}</button>` : ''}</td></tr>`).join('')}
        </tbody></table></div>` : `<p class="muted">${t('transfersHint')}</p>`}</div>
      <div class="card"><div class="card-h"><h3>${t('cashAccounts')}</h3><button class="btn btn-sm" id="na">${ic('plus')} ${t('add')}</button></div>
        <div class="table-wrap"><table class="t"><thead><tr><th>${t('name')}</th><th>${t('type')}</th><th class="r">${t('openingBal')}</th><th></th></tr></thead><tbody>
        ${MG.db.accounts.map(a => `<tr><td>${esc(MG.nm(a.name))}</td><td>${t(a.type === 'bank' ? 'bankAcc' : 'cashBox')}</td><td class="r money">${money(a.opening || 0)}</td>
          <td class="r"><button class="btn btn-ghost btn-sm btn-icon" data-ea="${a.id}">${ic('edit')}</button></td></tr>`).join('')}</tbody></table></div>
        <p class="muted" style="font-size:12.5px;margin:12px 0 0">${t('openingHint')} <b class="num">${esc(MG.db.settings.openingDate || '—')}</b></p></div>
    </div>`;
    box.querySelectorAll('[data-acc]').forEach(a => a.onclick = e => { e.preventDefault(); ar.acc = a.dataset.acc; ar.from = ym() + '-01'; ar.to = today(); MG.go('#/accounting/ledger'); });
    box.querySelector('#na').onclick = () => accountForm();
    box.querySelectorAll('[data-ea]').forEach(b => b.onclick = () => accountForm(MG.getAccount(b.dataset.ea)));
    box.querySelectorAll('[data-dm]').forEach(b => b.onclick = () => {
      const [k, id] = b.dataset.dm.split(':'), coll = k === 'transfer' ? 'transfers' : 'equity';
      const x = MG.db[coll].find(y => y.id === id);
      if (!MG.guardDate(x.date)) return;
      MG.confirm(t('confirmDelete'), () => { MG.db[coll] = MG.db[coll].filter(y => y !== x); MG.log(k + '.delete', money(x.amount)); MG.save(); MG.route(); });
    });
  }
  function accountForm(a) {
    const isNew = !a;
    const d = a || { name: '', type: 'cash', opening: 0 };
    const m = MG.modal(t('cashAccounts'), `<div class="grid g2">
      ${MG.fld(t('name'), MG.inp('name', d.name), 'span2')}
      ${MG.fld(t('type'), MG.sel('type', [['cash', t('cashBox')], ['bank', t('bankAcc')]], d.type))}
      ${MG.fld(t('openingBal') + ' ($)', MG.inp('opening', d.opening, 'number'))}</div>`,
      `<button class="btn" data-close>${t('cancel')}</button><button class="btn btn-gold" id="ok">${t('save')}</button>`);
    m.querySelector('[data-close]').onclick = () => MG.closeModal();
    m.querySelector('#ok').onclick = () => {
      const v = MG.formData(m);
      if (!v.name.trim()) return;
      v.opening = N(v.opening);
      if ((isNew ? v.opening : v.opening !== N(d.opening)) && !MG.guardDate(MG.db.settings.openingDate || '2000-01-01')) return;
      if (isNew) MG.db.accounts.push(Object.assign({ id: MG.uid() }, v)); else Object.assign(a, v);
      MG.log('account.' + (isNew ? 'create' : 'edit'), v.name); MG.save(); MG.closeModal(); MG.route();
    };
  }

  MG.transferForm = function () {
    if (MG.db.accounts.length < 2) { MG.toast(t('needTwoAccounts'), 'err'); return; }
    const opts = MG.accountOpts();
    const m = MG.modal(t('transfer2'), `<div class="grid g2">
      ${MG.fld(t('fromAcc'), MG.sel('from', opts, opts[0][0]))}${MG.fld(t('toAcc'), MG.sel('to', opts, opts[1][0]))}
      ${MG.fld(t('amount'), MG.moneyInp('amount', ''))}${MG.fld(t('date'), MG.inp('date', today(), 'date'))}
      ${MG.fld(t('notes'), MG.inp('note', ''), 'span2')}</div>`,
      `<button class="btn" data-close>${t('cancel')}</button><button class="btn btn-gold" id="ok">${t('save')}</button>`);
    m.querySelector('[data-close]').onclick = () => MG.closeModal();
    m.querySelector('#ok').onclick = () => {
      const v = MG.formData(m), amt = MG.readMoney(v, 'amount');
      if (!(amt.usd > 0) || v.from === v.to) { MG.toast(t('enterAmount'), 'err'); return; }
      if (!MG.guardDate(v.date)) return;
      MG.db.transfers.push({ id: MG.uid(), from: v.from, to: v.to, date: v.date || today(), amount: amt.usd, orig: amt.orig, cur: amt.cur, rate: amt.rate, note: v.note, by: MG.user.username });
      MG.log('transfer.add', money(amt.usd)); MG.save(); MG.closeModal(); MG.toast(t('saved')); MG.route();
    };
  };
  MG.equityForm = function (type) {
    const m = MG.modal(t('ownerEntry'), `<div class="grid g2">
      ${MG.fld(t('type'), MG.sel('type', [['drawing', t('eq_drawing')], ['capital', t('eq_capital')], ['income', t('eq_income')]], type || 'drawing'), 'span2')}
      ${MG.fld(t('amount'), MG.moneyInp('amount', ''))}${MG.fld(t('date'), MG.inp('date', today(), 'date'))}
      ${MG.fld(t('cashAccount'), MG.sel('accountId', MG.accountOpts(), MG.db.accounts[0].id))}${MG.fld(t('notes'), MG.inp('note', ''))}
      <p class="muted span2" style="font-size:12.5px;margin:0">${t('ownerHint')}</p></div>`,
      `<button class="btn" data-close>${t('cancel')}</button><button class="btn btn-gold" id="ok">${t('save')}</button>`);
    m.querySelector('[data-close]').onclick = () => MG.closeModal();
    m.querySelector('#ok').onclick = () => {
      const v = MG.formData(m), amt = MG.readMoney(v, 'amount');
      if (!(amt.usd > 0)) { MG.toast(t('enterAmount'), 'err'); return; }
      if (!MG.guardDate(v.date)) return;
      MG.db.equity.push({ id: MG.uid(), type: v.type, accountId: v.accountId, date: v.date || today(), amount: amt.usd, orig: amt.orig, cur: amt.cur, rate: amt.rate, note: v.note, by: MG.user.username });
      MG.log('equity.' + v.type, money(amt.usd)); MG.save(); MG.closeModal(); MG.toast(t('saved')); MG.route();
    };
  };

  /* ---------- Income statement ---------- */
  function pl(box) {
    box.innerHTML = rangeBar() + `<div class="card statement"><div class="card-h"><h3>${t('incomeStatement')}</h3><span class="muted num">${ar.from} → ${ar.to}</span>
      <button class="btn btn-sm" id="pp">${ic('print')} ${t('print')}</button></div>${MG.plHtml(ar.from, toEx())}</div>`;
    box.querySelector('#pp').onclick = () => MG.print(`<div class="q">${MG.docHeader(t('incomeStatement'), '', ar.from + ' → ' + ar.to)}${MG.plHtml(ar.from, toEx())}</div>`);
  }

  /* ---------- Balance sheet ---------- */
  function bsHtml() {
    const B = MG.balanceSheet(ar.to);
    const rows = list => list.map(a => `<div class="trow"><span><span class="muted num" style="font-size:12px">${a.code}</span> ${esc(MG.nm(a.name))}</span><span class="money">${money(a.v)}</span></div>`).join('') || '<div class="trow muted"><span>—</span></div>';
    const ok = Math.abs(B.totalAssets - B.totalLiabilities - B.totalEquity) < 0.01;
    return `<div class="grid g2" style="gap:18px;align-items:start">
      <div class="totals pl"><div class="pl-h">${t('assets')}</div>${rows(B.assets)}<div class="trow big"><span>${t('totalAssets')}</span><span class="money">${money(B.totalAssets)}</span></div></div>
      <div class="totals pl"><div class="pl-h">${t('liabilities')}</div>${rows(B.liabilities)}<div class="trow sub"><span>${t('totalLiabilities')}</span><span class="money">${money(B.totalLiabilities)}</span></div>
        <div class="pl-h">${t('equityT')}</div>${rows(B.equity)}<div class="trow"><span>${t('retainedEarnings')}</span><span class="money ${B.earnings >= 0 ? 'pos' : 'neg'}">${money(B.earnings)}</span></div>
        <div class="trow sub"><span>${t('totalEquity')}</span><span class="money">${money(B.totalEquity)}</span></div>
        <div class="trow big"><span>${t('totalLE')}</span><span class="money">${money(B.totalLiabilities + B.totalEquity)}</span></div></div></div>
      <p class="${ok ? 'pos' : 'neg'}" style="margin:14px 0 0;font-weight:600">${ok ? '✓ ' + t('bsBalanced') : '✗ ' + t('booksNotBalanced')}</p>`;
  }
  function bs(box) {
    box.innerHTML = rangeBar(true) + `<div class="card statement"><div class="card-h"><h3>${t('balanceSheet')}</h3><span class="muted num">${t('asOf')} ${ar.to}</span>
      <button class="btn btn-sm" id="pp">${ic('print')} ${t('print')}</button></div>${bsHtml()}</div>`;
    box.querySelector('#pp').onclick = () => MG.print(`<div class="q">${MG.docHeader(t('balanceSheet'), '', t('asOf') + ' ' + ar.to)}${bsHtml()}</div>`);
  }

  /* ---------- Trial balance ---------- */
  function trialHtml() {
    const rows = MG.trialBalance('', toEx());
    const s = k => rows.reduce((x, a) => x + a[k], 0);
    return `<div class="table-wrap"><table class="t"><thead><tr><th>${t('code')}</th><th>${t('account')}</th><th class="r">${t('debit')}</th><th class="r">${t('credit')}</th><th class="r">${t('balDebit')}</th><th class="r">${t('balCredit')}</th></tr></thead><tbody>
      ${rows.map(a => `<tr data-acc="${a.id}" style="cursor:pointer"><td class="num">${a.code}</td><td>${esc(MG.nm(a.name))}</td><td class="r money">${money(a.dr)}</td><td class="r money">${money(a.cr)}</td>
        <td class="r money">${a.balDr ? money(a.balDr) : ''}</td><td class="r money">${a.balCr ? money(a.balCr) : ''}</td></tr>`).join('')}
      </tbody><tfoot><tr><td colspan="2">${t('total')}</td><td class="r money">${money(s('dr'))}</td><td class="r money">${money(s('cr'))}</td><td class="r money">${money(s('balDr'))}</td><td class="r money">${money(s('balCr'))}</td></tr></tfoot></table></div>`;
  }
  function trial(box) {
    box.innerHTML = rangeBar(true) + `<div class="card"><div class="card-h"><h3>${t('trialBalance')}</h3><span class="muted num">${t('asOf')} ${ar.to}</span>
      <button class="btn btn-sm" id="pp">${ic('print')} ${t('print')}</button></div>${trialHtml()}</div>`;
    box.querySelectorAll('[data-acc]').forEach(r => r.onclick = () => { ar.acc = r.dataset.acc; MG.go('#/accounting/ledger'); });
    box.querySelector('#pp').onclick = () => MG.print(`<div class="q">${MG.docHeader(t('trialBalance'), '', t('asOf') + ' ' + ar.to)}${trialHtml()}</div>`);
  }

  /* ---------- General ledger ---------- */
  function ledger(box) {
    const coa = MG.coa();
    if (!coa.some(a => a.id === ar.acc)) ar.acc = coa[0].id;
    const L = MG.ledger(ar.acc, ar.from, toEx());
    const html = () => MG.statementTable(L.rows, L.opening, t('debit'), t('credit'));
    box.innerHTML = rangeBar() + `<div class="card"><div class="card-h"><select class="input" id="la" style="max-width:420px">${['asset', 'liability', 'equity', 'revenue', 'expense'].map(ty =>
      `<optgroup label="${t('type_' + ty)}">${coa.filter(a => a.type === ty).map(a => `<option value="${a.id}" ${a.id === ar.acc ? 'selected' : ''}>${a.code} — ${esc(MG.nm(a.name))}</option>`).join('')}</optgroup>`).join('')}</select>
      <button class="btn btn-sm" id="pp">${ic('print')} ${t('print')}</button></div>
      <div class="chips" style="margin:0 0 14px"><span class="chip">${t('openingBal')}<b class="money">${money(L.opening)}</b></span><span class="chip">${t('closingBal')}<b class="money">${money(L.closing)}</b></span></div>
      ${html()}</div>`;
    box.querySelector('#la').onchange = e => { ar.acc = e.target.value; MG.route(); };
    box.querySelector('#pp').onclick = () => MG.print(`<div class="q">${MG.docHeader(t('generalLedger') + ' — ' + esc(MG.accName(ar.acc)), '', ar.from + ' → ' + ar.to)}${html()}</div>`);
  }

  /* ---------- Journal ---------- */
  function journalHtml(list) {
    return `<div class="table-wrap"><table class="t jr"><thead><tr><th>#</th><th>${t('date')}</th><th>${t('ref')}</th><th>${t('account')}</th><th class="r">${t('debit')}</th><th class="r">${t('credit')}</th></tr></thead><tbody>
      ${list.map(e => `<tr class="jr-h"><td class="num muted">${e.no}</td><td class="num">${esc(e.date)}</td><td class="num muted">${esc(e.ref)}</td><td colspan="3"><b>${esc(e.desc)}</b></td></tr>` +
        e.lines.map(l => `<tr><td></td><td></td><td></td><td class="${l.cr ? 'jr-cr' : ''}">${esc(MG.accName(l.acc))}</td><td class="r money">${l.dr ? money(l.dr) : ''}</td><td class="r money">${l.cr ? money(l.cr) : ''}</td></tr>`).join('')).join('')}
      </tbody><tfoot><tr><td colspan="4">${t('total')}</td><td class="r money">${money(list.reduce((s, e) => s + e.lines.reduce((x, l) => x + l.dr, 0), 0))}</td><td class="r money">${money(list.reduce((s, e) => s + e.lines.reduce((x, l) => x + l.cr, 0), 0))}</td></tr></tfoot></table></div>`;
  }
  function journal(box) {
    const list = MG.journal().filter(e => e.date >= ar.from && e.date < toEx());
    box.innerHTML = rangeBar() + `<div class="card"><div class="card-h"><h3>${t('journalBook')} <span class="muted" style="font-size:14px">(${list.length})</span></h3>
      <div style="display:flex;gap:8px"><button class="btn btn-sm" id="csv">${ic('download')} CSV</button><button class="btn btn-sm" id="pp">${ic('print')} ${t('print')}</button></div></div>
      <p class="muted" style="margin-top:0;font-size:12.5px">${t('journalHint')}</p>${list.length ? journalHtml(list) : '<p class="muted">—</p>'}</div>`;
    box.querySelector('#pp').onclick = () => MG.print(`<div class="q">${MG.docHeader(t('journalBook'), '', ar.from + ' → ' + ar.to)}${journalHtml(list)}</div>`);
    box.querySelector('#csv').onclick = () => {
      const coa = MG.coa(), code = id => (coa.find(a => a.id === id) || {}).code || '';
      const rows = [['entry', 'date', 'ref', 'description', 'account_code', 'account', 'debit', 'credit']];
      list.forEach(e => e.lines.forEach(l => rows.push([e.no, e.date, e.ref, e.desc, code(l.acc), MG.accName(l.acc), l.dr.toFixed(2), l.cr.toFixed(2)])));
      MG.downloadCsv('majed-journal-' + ar.from + '_' + ar.to + '.csv', rows);
    };
  }

  /* ---------- Period close ---------- */
  function close(box) {
    const S = MG.db.settings;
    box.innerHTML = `<div class="two-col"><div class="card"><div class="card-h"><h3>${ic('lock').replace('<svg', '<svg style="width:18px;vertical-align:-3px;color:var(--gold)"')} ${t('periodClose')}</h3></div>
      <p class="muted" style="margin-top:0">${t('lockHint')}</p>
      <div class="grid g2">${MG.fld(t('lockBefore'), MG.inp('lockBefore', S.lockBefore, 'date', MG.can('users') ? '' : 'disabled'))}
        ${MG.fld(t('openingDate'), MG.inp('openingDate', S.openingDate || '', 'date', MG.can('users') ? '' : 'disabled'))}</div>
      ${MG.can('users') ? `<button class="btn btn-gold" id="sv" style="margin-top:14px">${t('save')}</button>` : `<p class="muted">${t('adminOnly')}</p>`}</div>
      <div class="card"><div class="card-h"><h3>${t('exchangeRate')}</h3></div><p class="muted" style="margin-top:0">${t('rateHint')}</p>
        ${MG.fld('1 USD = LBP', MG.inp('rate', S.rate, 'number'))}<button class="btn" id="svr" style="margin-top:14px">${t('save')}</button></div></div>`;
    const sv = box.querySelector('#sv');
    if (sv) sv.onclick = () => {
      const lb = box.querySelector('[name=lockBefore]').value, od = box.querySelector('[name=openingDate]').value;
      S.lockBefore = lb; S.openingDate = od;
      MG.log('period.lock', lb || '—'); MG.save(); MG.toast(t('saved')); MG.route();
    };
    box.querySelector('#svr').onclick = () => { S.rate = N(box.querySelector('[name=rate]').value) || S.rate; MG.log('rate', S.rate); MG.save(); MG.toast(t('saved')); };
  }
})();
