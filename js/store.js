/* Majed Group — data store (localStorage) */
window.MG = window.MG || {};

MG.uid = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
MG.today = function () { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

MG.defaultSettings = function () {
  return {
    company: { name: 'Majed Group', nameAr: 'مجموعة ماجد', phone: '', address: '' },
    currency: '$',
    margin: 30,
    vat: 0,
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
  return { version: 1, settings: MG.defaultSettings(), projects: [], payments: [], expenses: [], seq: {} };
};

MG.db = (function () {
  try {
    const raw = localStorage.getItem('mg.db');
    if (raw) {
      const d = JSON.parse(raw);
      const def = MG.emptyDb();
      d.settings = Object.assign(def.settings, d.settings || {});
      d.projects = d.projects || []; d.payments = d.payments || []; d.expenses = d.expenses || []; d.seq = d.seq || {};
      return d;
    }
  } catch (e) { console.error(e); }
  return MG.emptyDb();
})();

MG.save = function () {
  try { localStorage.setItem('mg.db', JSON.stringify(MG.db)); return true; }
  catch (e) { MG.toast && MG.toast(MG.t('storageFull'), 'err'); return false; }
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

MG.deleteProject = function (id) {
  MG.db.projects = MG.db.projects.filter(p => p.id !== id);
  MG.db.payments = MG.db.payments.filter(x => x.projectId !== id);
  MG.db.expenses = MG.db.expenses.filter(x => x.projectId !== id);
  MG.save();
};

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
