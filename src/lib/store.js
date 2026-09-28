import { MG } from './mg.js';
/* Majed Group — data store (localStorage) */

MG.uid = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
MG.today = function () { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

/* Expense categories. group: cogs = direct project cost, opex = running cost of the workshop */
MG.defaultCategories = function () {
  return [
    { id: 'material', name: 'بضاعة ألمنيوم / Aluminum stock', group: 'cogs', icon: 'box', quick: true },
    { id: 'iron', name: 'بضاعة حديد / Steel stock', group: 'cogs', icon: 'box' },
    { id: 'glass', name: 'زجاج / Glass', group: 'cogs', icon: 'window' },
    { id: 'accessories', name: 'إكسسوار وبراغي / Accessories & fixings', group: 'cogs', icon: 'box' },
    { id: 'paint', name: 'دهان وفرن / Paint & powder coating', group: 'cogs', icon: 'box' },
    { id: 'labor', name: 'يد عاملة على مشروع / Project labor', group: 'cogs', icon: 'user' },
    { id: 'subcontract', name: 'مقاول من الباطن / Subcontractor', group: 'cogs', icon: 'user' },
    { id: 'install', name: 'تركيب / Installation', group: 'cogs', icon: 'ruler' },
    { id: 'transport', name: 'نقل وتوصيل / Transport & delivery', group: 'cogs', icon: 'truck' },
    { id: 'salary', name: 'أجار شغيلة ورواتب / Wages & salaries', group: 'opex', icon: 'user', quick: true },
    { id: 'fuel', name: 'بنزين ومازوت / Fuel', group: 'opex', icon: 'fuel', quick: true },
    { id: 'rent', name: 'أجار المحل / Shop rent', group: 'opex', icon: 'home', quick: true },
    { id: 'utilities', name: 'موتور وكهرباء ومياه / Generator, power & water', group: 'opex', icon: 'bolt', quick: true },
    { id: 'phone', name: 'هاتف وإنترنت / Phone & internet', group: 'opex', icon: 'phone' },
    { id: 'tools', name: 'عدة ومعدات / Tools & equipment', group: 'opex', icon: 'gear' },
    { id: 'maintenance', name: 'صيانة / Maintenance', group: 'opex', icon: 'gear' },
    { id: 'car', name: 'سيارة وصيانتها / Vehicle', group: 'opex', icon: 'truck' },
    { id: 'hospitality', name: 'ضيافة وأكل / Food & hospitality', group: 'opex', icon: 'coffee' },
    { id: 'taxes', name: 'رسوم وضرائب / Fees & taxes', group: 'opex', icon: 'doc' },
    { id: 'bankfees', name: 'عمولات بنك وتحويل / Bank & transfer fees', group: 'opex', icon: 'bank' },
    { id: 'other', name: 'مصاريف أخرى / Other expenses', group: 'opex', icon: 'more', quick: true }
  ];
};

MG.defaultSettings = function () {
  return {
    company: { name: 'Majed Group', nameAr: 'مجموعة ماجد', phone: '', address: '' },
    currency: '$',
    margin: 30,
    vat: 0,
    rate: 89500,          // LBP per 1 USD
    lockBefore: '',       // accounting period lock: no edits dated on/before this date
    categories: MG.defaultCategories(),
    alu: {
      barLength: 600, waste: 8, netPrice: 9,
      profiles: [
        { id: 'sl-frame', name: 'إطار سحاب / Sliding frame', kg: 1.15 },
        { id: 'sl-sash', name: 'درفة سحاب / Sliding sash', kg: 0.95 },
        { id: 'hg-frame', name: 'إطار فتّاح / Casement frame', kg: 0.85 },
        { id: 'hg-sash', name: 'درفة فتّاح / Casement sash', kg: 0.98 },
        { id: 'door-sash', name: 'درفة باب / Door sash', kg: 1.45 },
        { id: 'mullion', name: 'قاطع (T) / Mullion', kg: 0.92 },
        { id: 'bead', name: 'كبس زجاج / Glazing bead', kg: 0.2 }
      ],
      finishes: [
        { id: 'natural', name: 'طبيعي / Mill finish', price: 5.5 },
        { id: 'white', name: 'أبيض / Powder white', price: 6.0 },
        { id: 'color', name: 'ألوان / RAL color', price: 6.5 },
        { id: 'wood', name: 'خشبي / Wood effect', price: 8.0 }
      ],
      glass: [
        { id: 'g4', name: '4 ملم شفاف / 4mm clear', price: 12 },
        { id: 'g6', name: '6 ملم شفاف / 6mm clear', price: 16 },
        { id: 'g6t', name: '6 ملم ملوّن / 6mm tinted', price: 20 },
        { id: 'g6f', name: '6 ملم مغبّش / 6mm frosted', price: 19 },
        { id: 'g8s', name: '8 ملم سيكوريت / 8mm tempered', price: 34 },
        { id: 'dbl', name: 'دبل 4+12+4 / Double glazed', price: 38 }
      ],
      systems: {
        sliding: { frame: 'sl-frame', sash: 'sl-sash', mullion: 'mullion', bead: '', acc: 14, labor: 14 },
        hinged: { frame: 'hg-frame', sash: 'hg-sash', mullion: 'mullion', bead: 'bead', acc: 20, labor: 16 },
        fixed: { frame: 'hg-frame', sash: '', mullion: 'mullion', bead: 'bead', acc: 3, labor: 10 },
        door: { frame: 'hg-frame', sash: 'door-sash', mullion: 'mullion', bead: 'bead', acc: 55, labor: 20 }
      }
    },
    iron: {
      barLength: 600, waste: 5, steelPrice: 1.15, sheetPrice: 1.25, labor: 1.3, paint: 0.3, consumables: 4,
      profiles: [
        { id: 'sq20', name: 'علبة 20×20×1.5', kg: 0.85 },
        { id: 'sq30', name: 'علبة 30×30×2', kg: 1.76 },
        { id: 'sq40', name: 'علبة 40×40×2', kg: 2.39 },
        { id: 'sq50', name: 'علبة 50×50×2', kg: 3.02 },
        { id: 'sq60', name: 'علبة 60×60×3', kg: 5.37 },
        { id: 'sq80', name: 'علبة 80×80×3', kg: 7.25 },
        { id: 'sq100', name: 'علبة 100×100×3', kg: 9.14 },
        { id: 're4020', name: 'مستطيل 40×20×1.5', kg: 1.34 },
        { id: 're6040', name: 'مستطيل 60×40×2', kg: 2.99 },
        { id: 'bar12', name: 'قضيب مربع مصمت 12', kg: 1.13 },
        { id: 'bar16', name: 'قضيب مربع مصمت 16', kg: 2.01 },
        { id: 'flat40', name: 'شريط 40×4', kg: 1.26 },
        { id: 'ang40', name: 'زاوية 40×40×4', kg: 2.42 }
      ],
      roofs: [
        { id: 'none', name: 'بدون / None', price: 0 },
        { id: 'sandwich', name: 'ساندويش بانل / Sandwich panel', price: 22 },
        { id: 'corr', name: 'صاج مموّج / Corrugated sheet', price: 9 },
        { id: 'poly', name: 'بولي كربونات / Polycarbonate', price: 14 }
      ]
    }
  };
};

MG.emptyDb = function () {
  return {
    version: 2, settings: MG.defaultSettings(), projects: [], payments: [], expenses: [], seq: {},
    customers: [], suppliers: [], supPayments: [], workers: [], payroll: [], transfers: [], equity: [], recurring: [],
    accounts: [{ id: 'cash', name: 'الصندوق / Cash box', type: 'cash', opening: 0 }, { id: 'bank', name: 'البنك / Bank', type: 'bank', opening: 0 }],
    users: [], log: []
  };
};

/* Bring older saved data up to the current structure without losing anything */
MG.migrate = function (d) {
  const def = MG.emptyDb();
  const ds = def.settings;
  d.settings = Object.assign(ds, d.settings || {});
  if (!Array.isArray(d.settings.categories) || !d.settings.categories.length) d.settings.categories = MG.defaultCategories();
  Object.keys(def).forEach(k => { if (d[k] == null) d[k] = def[k]; });
  if (!d.accounts.length) d.accounts = def.accounts;
  const acc0 = d.accounts[0].id;
  d.payments.forEach(x => { if (!x.accountId) x.accountId = acc0; });
  d.expenses.forEach(x => { if (!x.accountId) x.accountId = acc0; if (x.paid == null) x.paid = true; });
  // link free-text project clients to customer records
  d.projects.forEach(p => {
    if (p.customerId || !(p.client || '').trim()) return;
    const key = p.client.trim().toLowerCase();
    let c = d.customers.find(x => x.name.trim().toLowerCase() === key);
    if (!c) { c = { id: MG.uid(), name: p.client.trim(), phone: p.phone || '', address: p.location || '', notes: '', opening: 0, created: Date.now() }; d.customers.push(c); }
    p.customerId = c.id;
  });
  d.payments.forEach(x => { if (!x.customerId) { const p = d.projects.find(q => q.id === x.projectId); if (p) x.customerId = p.customerId || null; } });
  d.version = 2;
  return d;
};

MG.load = function () {
  try {
    const raw = localStorage.getItem('mg.db');
    if (raw) {
      return MG.migrate(JSON.parse(raw));
    }
  } catch (e) { console.error(e); }
  return MG.emptyDb();
};
MG.db = MG.load();
/* Replace all data (backup import) */
MG.replaceDb = function (d) { MG.db = MG.migrate(d); MG.save(); };

MG.save = function () {
  MG.db.__rev = (MG.db.__rev || 0) + 1;
  let ok = true;
  try { localStorage.setItem('mg.db', JSON.stringify(MG.db)); }
  catch (e) { MG.toast(MG.t('storageFull'), 'err'); ok = false; }
  MG.emit();
  return ok;
};

MG.nextCode = function (dateStr) {
  const y = (dateStr || MG.today()).slice(0, 4);
  MG.db.seq[y] = (MG.db.seq[y] || 0) + 1;
  return 'MG-' + y + '-' + String(MG.db.seq[y]).padStart(3, '0');
};

MG.getProject = function (id) { return MG.db.projects.find(p => p.id === id); };

MG.newProject = function (data) {
  const p = Object.assign({
    id: MG.uid(), code: '', name: '', client: '', phone: '', location: '', section: 'alu', status: 'quote',
    date: MG.today(), dueDate: '', margin: MG.db.settings.margin, discount: 0, vat: MG.db.settings.vat,
    items: [], sketches: [], notes: '', created: Date.now()
  }, data || {});
  if (!p.code) p.code = MG.nextCode(p.date);
  MG.db.projects.unshift(p);
  MG.save();
  return p;
};

/* A project that already has money recorded against it cannot be deleted — it must be cancelled,
   so the books never lose a receipt or an expense. */
MG.projectHasMoney = function (id) {
  return MG.db.payments.some(x => x.projectId === id) || MG.db.expenses.some(x => x.projectId === id) || MG.db.payroll.some(x => x.projectId === id);
};
MG.deleteProject = function (id) {
  if (MG.projectHasMoney(id)) return false;
  MG.db.projects = MG.db.projects.filter(p => p.id !== id);
  MG.save();
  return true;
};

MG.getCustomer = id => MG.db.customers.find(c => c.id === id);
MG.getSupplier = id => MG.db.suppliers.find(c => c.id === id);
MG.getWorker = id => MG.db.workers.find(c => c.id === id);
MG.getAccount = id => MG.db.accounts.find(c => c.id === id);
MG.getCategory = id => MG.db.settings.categories.find(c => c.id === id) || { id, name: id, group: 'opex' };
MG.findOrCreateCustomer = function (name, phone, address) {
  name = (name || '').trim();
  if (!name) return null;
  let c = MG.db.customers.find(x => x.name.trim().toLowerCase() === name.toLowerCase());
  if (!c) { c = { id: MG.uid(), name, phone: phone || '', address: address || '', notes: '', opening: 0, created: Date.now() }; MG.db.customers.push(c); }
  else if (phone && !c.phone) c.phone = phone;
  return c;
};

/* Is a date inside a locked (closed) accounting period? */
MG.isLocked = function (date) { const L = MG.db.settings.lockBefore; return !!(L && date && date <= L); };

/* Amount entry in USD or LBP. Returns USD value and keeps the original. */
MG.toUsd = function (amount, cur, rate) {
  amount = parseFloat(amount) || 0;
  if (cur === 'LBP') return amount / (parseFloat(rate) || MG.db.settings.rate || 89500);
  return amount;
};
MG.lbp = function (usd) { return Math.round((usd || 0) * (MG.db.settings.rate || 89500)).toLocaleString('en-US') + ' ل.ل'; };

MG.fmt = function (n, dec) {
  n = Number(n) || 0;
  const d = dec == null ? (Math.abs(n) >= 1000 ? 0 : 2) : dec;
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
};
MG.money = function (n, dec) { const s = MG.fmt(n, dec); return (n < 0 ? '-' : '') + MG.db.settings.currency + s.replace('-', ''); };
/* Names like "أبيض / Powder white" show only the part for the current language */
MG.nm = function (s) {
  s = String(s == null ? '' : s);
  const parts = s.split(' / ');
  if (parts.length < 2) return s;
  return MG.lang === 'ar' ? parts[0] : parts.slice(1).join(' / ');
};
MG.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); };
