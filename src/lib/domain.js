/* Business helpers shared by several screens (no UI code here) */
import { MG } from './mg.js';

const N = v => parseFloat(v) || 0;

MG.statuses = ['quote', 'active', 'done', 'cancelled'];
MG.iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
MG.accountOpts = () => MG.db.accounts.map(a => [a.id, MG.nm(a.name)]);
MG.clientName = p => { const c = p.customerId && MG.getCustomer(p.customerId); return c ? c.name : (p.client || ''); };

/* paid / partial / unpaid for a contracted project */
MG.payStatus = function (p, T) {
  if (p.status !== 'active' && p.status !== 'done') return null;
  T = T || MG.projectTotals(p);
  if (T.total <= 0.004) return null;
  if (T.balance <= 0.5) return 'paid';
  return T.paid > 0.004 ? 'partial' : 'unpaid';
};

MG.totalReceivable = () => MG.db.customers.reduce((s, c) => s + Math.max(0, MG.customerAccount(c.id).balance), 0);

/* Money typed in USD or LBP → { usd, orig, cur, rate } */
MG.readMoney = function (value, cur) {
  const rate = MG.db.settings.rate || 89500, orig = N(value);
  return { usd: Math.round(MG.toUsd(orig, cur || 'USD', rate) * 100) / 100, orig, cur: cur || 'USD', rate };
};

/* Fixed monthly costs not yet recorded this month */
MG.recurringDue = function () {
  const ym = MG.today().slice(0, 7);
  return MG.db.recurring.filter(r => r.active !== false && !MG.db.expenses.some(x => x.recurringId === r.id && (x.date || '').startsWith(ym)));
};

MG.customerSummary = function () {
  const g = { paid: [0, 0], partial: [0, 0], unpaid: [0, 0], overdue: [0, 0] };
  MG.db.customers.forEach(c => {
    const a = MG.customerAccount(c.id);
    if (g[a.status]) { g[a.status][0]++; g[a.status][1] += a.balance; }
    if (a.overdue) { g.overdue[0]++; g.overdue[1] += a.balance; }
  });
  return g;
};

/* Management figures for a period — all derived from the journal */
MG.periodStats = function (from, to) {
  const a = MG.iso(from), b = MG.iso(to), inR = s => s && s >= a && s < b;
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

MG.workerOpts = () => MG.db.workers.filter(w => w.active !== false).map(w => [w.id, w.name]);

MG.waLink = (phone, msg) => {
  let d = String(phone || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '961' + d.slice(1);
  else if (d.length <= 8) d = '961' + d;
  return 'https://wa.me/' + d + '?text=' + encodeURIComponent(msg);
};
MG.reminderMsg = (c, bal) => MG.lang === 'ar'
  ? `مرحباً ${c.name}، نذكّركم بأن الرصيد المتبقي لدى ${MG.db.settings.company.nameAr || MG.db.settings.company.name} هو ${MG.money(bal)}. شكراً لتعاملكم معنا.`
  : `Hello ${c.name}, a friendly reminder that your outstanding balance with ${MG.db.settings.company.name} is ${MG.money(bal)}. Thank you.`;

MG.download = function (name, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: type || 'text/plain' }));
  a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
};
MG.downloadCsv = function (name, rows) {
  const csv = '﻿' + rows.map(r => r.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\n');
  MG.download(name, csv, 'text/csv');
};
