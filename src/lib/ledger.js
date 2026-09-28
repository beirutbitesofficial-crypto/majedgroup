import { MG } from './mg.js';
/* Majed Group — double-entry accounting engine.
   Every business record (invoice, receipt, expense, purchase, wage, transfer, owner movement) is turned
   into a balanced journal entry. Statements are always derived from the journal, so they can never drift. */
(function () {
  const N = v => { v = parseFloat(v); return isFinite(v) ? v : 0; };
  const r2 = v => Math.round(v * 100) / 100;

  /* ---------- Chart of accounts ---------- */
  MG.coa = function () {
    const S = MG.db.settings, list = [];
    MG.db.accounts.forEach((a, i) => list.push({ id: 'acc:' + a.id, code: String(1010 + i), name: a.name, type: 'asset', cash: true }));
    list.push({ id: 'ar', code: '1100', name: 'ذمم الزبائن / Accounts receivable', type: 'asset' });
    list.push({ id: 'adv', code: '1200', name: 'سلف الشغيلة / Employee advances', type: 'asset' });
    list.push({ id: 'ap', code: '2100', name: 'ذمم الموردين / Accounts payable', type: 'liability' });
    list.push({ id: 'vat', code: '2200', name: 'ضريبة مستحقة TVA / VAT payable', type: 'liability' });
    list.push({ id: 'capital', code: '3100', name: 'رأس المال / Owner capital', type: 'equity' });
    list.push({ id: 'drawings', code: '3200', name: 'مسحوبات شخصية / Owner drawings', type: 'equity' });
    list.push({ id: 'opening', code: '3300', name: 'أرصدة افتتاحية / Opening balances', type: 'equity' });
    list.push({ id: 'rev:alu', code: '4100', name: 'مبيعات ألمنيوم / Aluminum sales', type: 'revenue' });
    list.push({ id: 'rev:iron', code: '4200', name: 'مبيعات حدادة / Metalwork sales', type: 'revenue' });
    list.push({ id: 'rev:other', code: '4900', name: 'إيرادات أخرى / Other income', type: 'revenue' });
    let ci = 0, oi = 0;
    S.categories.forEach(c => {
      const cogs = c.group === 'cogs';
      list.push({ id: 'exp:' + c.id, code: String(cogs ? 5100 + (ci++) * 10 : 6100 + (oi++) * 10), name: c.name, type: 'expense', group: cogs ? 'cogs' : 'opex' });
    });
    return list;
  };
  MG.accName = function (id) {
    const a = MG.coa().find(x => x.id === id);
    if (a) return MG.nm(a.name);
    if (id.startsWith('exp:')) return MG.nm(MG.getCategory(id.slice(4)).name);
    return id;
  };

  /* ---------- Journal ---------- */
  let cache = null, cacheKey = '';
  MG.journal = function () {
    const key = MG.db.__rev || 0;
    if (cache && cacheKey === key) return cache;
    const J = [], db = MG.db, S = db.settings;
    const open = S.openingDate || '2000-01-01';
    const add = (date, ref, desc, lines, src) => {
      lines = lines.filter(l => Math.abs(l.dr || 0) > 0.0001 || Math.abs(l.cr || 0) > 0.0001)
        .map(l => ({ acc: l.acc, dr: r2(l.dr || 0), cr: r2(l.cr || 0), party: l.party || null }));
      if (!lines.length) return;
      // absorb cent rounding so every entry balances exactly
      const d = r2(lines.reduce((s, l) => s + l.dr - l.cr, 0));
      if (d !== 0) { const big = lines.slice().sort((a, b) => (b.cr - a.cr))[0]; if (d > 0) big.cr = r2(big.cr + d); else big.dr = r2(big.dr - d); }
      J.push({ date, ref, desc, lines, src });
    };
    const cust = id => id ? { t: 'customer', id } : null;
    const sup = id => id ? { t: 'supplier', id } : null;
    const wrk = id => id ? { t: 'worker', id } : null;
    const OPN = MG.lang === 'ar' ? 'رصيد افتتاحي' : 'Opening balance';

    // opening balances
    db.accounts.forEach(a => { const v = N(a.opening); if (v) add(open, 'OB', OPN + ' — ' + MG.nm(a.name), v > 0 ? [{ acc: 'acc:' + a.id, dr: v }, { acc: 'opening', cr: v }] : [{ acc: 'opening', dr: -v }, { acc: 'acc:' + a.id, cr: -v }], { t: 'account', id: a.id }); });
    db.customers.forEach(c => { const v = N(c.opening); if (v) add(open, 'OB', OPN + ' — ' + c.name, v > 0 ? [{ acc: 'ar', dr: v, party: cust(c.id) }, { acc: 'opening', cr: v }] : [{ acc: 'opening', dr: -v }, { acc: 'ar', cr: -v, party: cust(c.id) }], { t: 'customer', id: c.id }); });
    db.suppliers.forEach(c => { const v = N(c.opening); if (v) add(open, 'OB', OPN + ' — ' + c.name, v > 0 ? [{ acc: 'opening', dr: v }, { acc: 'ap', cr: v, party: sup(c.id) }] : [{ acc: 'ap', dr: -v, party: sup(c.id) }, { acc: 'opening', cr: -v }], { t: 'supplier', id: c.id }); });

    // sales invoices: a project becomes revenue when it is contracted (in progress or completed)
    db.projects.forEach(p => {
      if (p.status !== 'active' && p.status !== 'done') return;
      const T = MG.projectTotals(p, true);
      if (!T.total) return;
      const f = T.subtotal ? T.net / T.subtotal : 0, sec = { alu: 0, iron: 0 };
      p.items.forEach((it, i) => { sec[it.section === 'iron' ? 'iron' : 'alu'] += T.rows[i].total * f; });
      add(p.date, p.code, (MG.lang === 'ar' ? 'فاتورة مشروع ' : 'Invoice ') + (p.name || p.code), [
        { acc: 'ar', dr: T.total, party: cust(p.customerId) },
        { acc: 'rev:alu', cr: sec.alu }, { acc: 'rev:iron', cr: sec.iron }, { acc: 'vat', cr: T.vatAmt }
      ], { t: 'project', id: p.id });
    });
    // customer receipts
    db.payments.forEach(x => {
      const p = x.projectId && MG.getProject(x.projectId);
      const cid = x.customerId || (p && p.customerId);
      add(x.date, p ? p.code : 'RC', (MG.lang === 'ar' ? 'قبض من ' : 'Receipt from ') + ((MG.getCustomer(cid) || {}).name || '') + (x.note ? ' — ' + x.note : ''),
        [{ acc: 'acc:' + x.accountId, dr: N(x.amount) }, { acc: 'ar', cr: N(x.amount), party: cust(cid) }], { t: 'payment', id: x.id });
    });
    // expenses & purchases
    db.expenses.forEach(x => {
      const cat = MG.getCategory(x.category || 'other');
      const p = x.projectId && MG.getProject(x.projectId);
      add(x.date, p ? p.code : 'EX', MG.nm(cat.name) + (x.note ? ' — ' + x.note : '') + (x.supplierId ? ' (' + ((MG.getSupplier(x.supplierId) || {}).name || '') + ')' : ''), [
        { acc: 'exp:' + cat.id, dr: N(x.amount), party: sup(x.supplierId) },
        x.paid === false ? { acc: 'ap', cr: N(x.amount), party: sup(x.supplierId) } : { acc: 'acc:' + x.accountId, cr: N(x.amount) }
      ], { t: 'expense', id: x.id });
    });
    db.supPayments.forEach(x => add(x.date, 'SP', (MG.lang === 'ar' ? 'دفعة للمورد ' : 'Paid supplier ') + ((MG.getSupplier(x.supplierId) || {}).name || '') + (x.note ? ' — ' + x.note : ''),
      [{ acc: 'ap', dr: N(x.amount), party: sup(x.supplierId) }, { acc: 'acc:' + x.accountId, cr: N(x.amount) }], { t: 'supPayment', id: x.id }));
    // payroll
    db.payroll.forEach(x => {
      const w = (MG.getWorker(x.workerId) || {}).name || '';
      if (x.type === 'advance') add(x.date, 'ADV', (MG.lang === 'ar' ? 'سلفة ' : 'Advance ') + w, [{ acc: 'adv', dr: N(x.amount), party: wrk(x.workerId) }, { acc: 'acc:' + x.accountId, cr: N(x.amount) }], { t: 'payroll', id: x.id });
      else {
        const gross = N(x.amount), ded = Math.min(N(x.deduct), gross);
        add(x.date, 'WG', (MG.lang === 'ar' ? 'أجرة ' : 'Wage ') + w + (x.days ? ' (' + x.days + (MG.lang === 'ar' ? ' يوم)' : ' days)') : ''), [
          { acc: 'exp:' + (x.projectId ? 'labor' : 'salary'), dr: gross, party: wrk(x.workerId) },
          { acc: 'acc:' + x.accountId, cr: gross - ded }, { acc: 'adv', cr: ded, party: wrk(x.workerId) }
        ], { t: 'payroll', id: x.id });
      }
    });
    // transfers between cash box / bank
    db.transfers.forEach(x => add(x.date, 'TR', (MG.lang === 'ar' ? 'تحويل: ' : 'Transfer: ') + MG.nm((MG.getAccount(x.from) || {}).name) + ' → ' + MG.nm((MG.getAccount(x.to) || {}).name),
      [{ acc: 'acc:' + x.to, dr: N(x.amount) }, { acc: 'acc:' + x.from, cr: N(x.amount) }], { t: 'transfer', id: x.id }));
    // owner & other income
    db.equity.forEach(x => {
      const v = N(x.amount), a = 'acc:' + x.accountId, note = x.note ? ' — ' + x.note : '';
      if (x.type === 'capital') add(x.date, 'CAP', MG.t('eq_capital') + note, [{ acc: a, dr: v }, { acc: 'capital', cr: v }], { t: 'equity', id: x.id });
      else if (x.type === 'drawing') add(x.date, 'DRW', MG.t('eq_drawing') + note, [{ acc: 'drawings', dr: v }, { acc: a, cr: v }], { t: 'equity', id: x.id });
      else add(x.date, 'INC', MG.t('eq_income') + note, [{ acc: a, dr: v }, { acc: 'rev:other', cr: v }], { t: 'equity', id: x.id });
    });

    J.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
    J.forEach((e, i) => { e.no = i + 1; });
    cache = J; cacheKey = key;
    return J;
  };

  /* Sum debits/credits per account for entries where from <= date < to (strings, either may be empty) */
  MG.sums = function (from, to, pred) {
    const res = {};
    MG.journal().forEach(e => {
      if (from && e.date < from) return;
      if (to && e.date >= to) return;
      e.lines.forEach(l => {
        if (pred && !pred(l, e)) return;
        const r = res[l.acc] = res[l.acc] || { dr: 0, cr: 0 };
        r.dr += l.dr; r.cr += l.cr;
      });
    });
    return res;
  };
  const natural = (type, s) => (type === 'asset' || type === 'expense') ? s.dr - s.cr : s.cr - s.dr;

  MG.trialBalance = function (from, to) {
    const s = MG.sums(from, to);
    return MG.coa().map(a => {
      const x = s[a.id] || { dr: 0, cr: 0 }, net = x.dr - x.cr;
      return Object.assign({}, a, { dr: x.dr, cr: x.cr, balDr: net > 0 ? net : 0, balCr: net < 0 ? -net : 0 });
    }).filter(a => a.dr || a.cr);
  };

  MG.incomeStatement = function (from, to) {
    const s = MG.sums(from, to), coa = MG.coa();
    const pick = f => coa.filter(f).map(a => ({ id: a.id, code: a.code, name: a.name, v: natural(a.type, s[a.id] || { dr: 0, cr: 0 }) })).filter(a => Math.abs(a.v) > 0.004);
    const revenue = pick(a => a.type === 'revenue'), cogs = pick(a => a.group === 'cogs'), opex = pick(a => a.group === 'opex');
    const sum = a => a.reduce((x, y) => x + y.v, 0);
    const R = sum(revenue), C = sum(cogs), O = sum(opex);
    return { revenue, cogs, opex, totalRevenue: R, totalCogs: C, gross: R - C, totalOpex: O, net: R - C - O };
  };

  MG.balanceSheet = function (asOf) {
    const to = asOf ? nextDay(asOf) : '';
    const s = MG.sums('', to), coa = MG.coa();
    const pick = type => coa.filter(a => a.type === type).map(a => ({ id: a.id, code: a.code, name: a.name, v: natural(a.type, s[a.id] || { dr: 0, cr: 0 }) })).filter(a => Math.abs(a.v) > 0.004);
    const assets = pick('asset'), liabilities = pick('liability'), equity = pick('equity');
    const pl = MG.incomeStatement('', to).net;
    const sum = a => a.reduce((x, y) => x + y.v, 0);
    const E = sum(equity) + pl;
    return { assets, liabilities, equity, earnings: pl, totalAssets: sum(assets), totalLiabilities: sum(liabilities), totalEquity: E };
  };

  /* Movements of one GL account (optionally one party) with running balance */
  MG.ledger = function (acc, from, to, party) {
    const a = MG.coa().find(x => x.id === acc) || { type: acc.startsWith('exp:') ? 'expense' : 'asset' };
    const debitNature = a.type === 'asset' || a.type === 'expense';
    let opening = 0; const rows = [];
    MG.journal().forEach(e => e.lines.forEach(l => {
      if (l.acc !== acc) return;
      if (party && !(l.party && l.party.t === party.t && l.party.id === party.id)) return;
      const d = debitNature ? l.dr - l.cr : l.cr - l.dr;
      if (from && e.date < from) { opening += d; return; }
      if (to && e.date >= to) return;
      rows.push({ date: e.date, ref: e.ref, desc: e.desc, dr: l.dr, cr: l.cr, src: e.src, no: e.no });
    }));
    let bal = opening;
    rows.forEach(r => { bal += debitNature ? r.dr - r.cr : r.cr - r.dr; r.bal = bal; });
    return { opening, rows, closing: bal, debitNature };
  };

  /* ---------- Party balances ---------- */
  MG.customerAccount = function (id) {
    const L = MG.ledger('ar', '', '', { t: 'customer', id });
    const invoiced = L.rows.reduce((s, r) => s + r.dr, 0), paid = L.rows.reduce((s, r) => s + r.cr, 0);
    const balance = r2(L.closing);
    let status;
    if (invoiced <= 0.004 && paid <= 0.004) status = 'none';
    else if (balance <= 0.5) status = balance < -0.5 ? 'credit' : 'paid';
    else if (paid > 0.004) status = 'partial';
    else status = 'unpaid';
    const today = MG.today();
    const overdue = MG.db.projects.some(p => p.customerId === id && (p.status === 'active' || p.status === 'done') && p.dueDate && p.dueDate < today && MG.projectTotals(p).balance > 0.5);
    return { invoiced, paid, balance, status, overdue, rows: L.rows };
  };
  MG.supplierAccount = function (id) {
    const L = MG.ledger('ap', '', '', { t: 'supplier', id });
    const purchased = L.rows.reduce((s, r) => s + r.cr, 0), paid = L.rows.reduce((s, r) => s + r.dr, 0);
    const cashPurchases = MG.db.expenses.filter(x => x.supplierId === id && x.paid !== false).reduce((s, x) => s + N(x.amount), 0);
    return { purchased, paid, balance: r2(L.closing), cashPurchases, rows: L.rows };
  };
  MG.workerAccount = function (id) {
    const pr = MG.db.payroll.filter(x => x.workerId === id);
    const earned = pr.filter(x => x.type !== 'advance').reduce((s, x) => s + N(x.amount), 0);
    const advances = pr.filter(x => x.type === 'advance').reduce((s, x) => s + N(x.amount), 0);
    const deducted = pr.filter(x => x.type !== 'advance').reduce((s, x) => s + Math.min(N(x.deduct), N(x.amount)), 0);
    const days = pr.reduce((s, x) => s + N(x.days), 0);
    return { earned, advances, deducted, advBalance: r2(advances - deducted), days, rows: pr.slice().sort((a, b) => a.date < b.date ? 1 : -1) };
  };
  MG.cashBalance = function (accountId, asOf) {
    return MG.ledger('acc:' + accountId, '', asOf ? nextDay(asOf) : '').closing;
  };

  function nextDay(d) { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + 1); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
  MG.nextDay = nextDay;
})();
