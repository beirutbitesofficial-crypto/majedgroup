/* Majed Group — shell, router and shared UI helpers */
window.MG = window.MG || {};
MG.views = {};

const P = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
MG.icons = {
  home: P('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
  folder: P('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  calc: P('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2M8 18h2M12 18h4M16 11v4"/>'),
  pen: P('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
  chart: P('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  wallet: P('<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2z"/><circle cx="16" cy="14.5" r="1.2"/>'),
  gear: P('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  plus: P('<path d="M12 5v14M5 12h14"/>'),
  search: P('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  window: P('<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v18M4 9h16"/><path d="M8 14h2M14 14h2"/>'),
  gate: P('<path d="M3 21V6M21 21V6M3 6h18M3 10h18"/><path d="M7 10v11M11 10v11M13 10v11M17 10v11M12 6V3"/>'),
  user: P('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  phone: P('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  map: P('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  cal: P('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  trash: P('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  edit: P('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>'),
  print: P('<path d="M6 9V3h12v6M6 18H4v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7h-2"/><rect x="6" y="14" width="12" height="7"/>'),
  back: P('<path d="M15 18l-6-6 6-6"/>'),
  chevron: P('<path d="M9 18l6-6-6-6"/>'),
  sun: P('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: P('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
  globe: P('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  download: P('<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>'),
  upload: P('<path d="M12 20V8M6 14l6-6 6 6M4 4h16"/>'),
  scissors: P('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.1 8.1 20 20M8.1 15.9 20 4"/>'),
  image: P('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>'),
  cash: P('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>'),
  x: P('<path d="M6 6l12 12M18 6 6 18"/>'),
  list: P('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
  grid: P('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
  line: P('<path d="M5 19 19 5"/><circle cx="5" cy="19" r="1.5"/><circle cx="19" cy="5" r="1.5"/>'),
  rect: P('<rect x="4" y="6" width="16" height="12" rx="1"/>'),
  text: P('<path d="M5 6V4h14v2M12 4v16M9 20h6"/>'),
  eraser: P('<path d="M20 20H9l-5-5a2 2 0 0 1 0-2.8L13.2 3a2 2 0 0 1 2.8 0L21 8a2 2 0 0 1 0 2.8L12 20"/><path d="m7 10 7 7"/>'),
  undo: P('<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'),
  more: P('<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>'),
  ruler: P('<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>'),
  trend: P('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'),
  coins: P('<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.7-2.7-3-6-3"/>'),
  clock: P('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  copy: P('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
  users: P('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>'),
  hardhat: P('<path d="M3 18h18v-2a9 9 0 0 0-18 0z"/><path d="M10 7V5h4v2M12 7v5"/><path d="M2 18h20v2H2z"/>'),
  truck: P('<path d="M2 6h11v10H2zM13 10h4l4 4v2h-8"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'),
  book: P('<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5V4.5M8 7h8M8 11h6"/>'),
  shield: P('<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/>'),
  logout: P('<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>'),
  box: P('<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>'),
  fuel: P('<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M4 10h10"/><path d="M14 8h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V8l-3-3"/>'),
  bolt: P('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
  coffee: P('<path d="M4 9h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 2v4M12 2v4"/>'),
  doc: P('<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h8M9 17h6"/>'),
  bank: P('<path d="M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/>'),
  swap: P('<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>'),
  lock: P('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
  alert: P('<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>'),
  check: P('<path d="m5 12 5 5 9-10"/>'),
  t_sliding: P('<rect x="2" y="4" width="20" height="16" rx="1"/><rect x="4" y="6" width="9" height="12"/><rect x="11" y="6" width="9" height="12"/><path d="M6 12h4M18 12h-4"/>'),
  t_hinged: P('<rect x="2" y="4" width="20" height="16" rx="1"/><path d="M12 4v16"/><path d="M11 6 4 12l7 6M13 6l7 6-7 6" stroke-dasharray="2 2"/>'),
  t_fixed: P('<rect x="2" y="4" width="20" height="16" rx="1"/><rect x="4" y="6" width="16" height="12"/><path d="M11 10h2M10 14h4"/>'),
  t_door: P('<rect x="6" y="2" width="12" height="20" rx="1"/><rect x="8" y="4" width="8" height="16"/><path d="M15 12h1"/><path d="M3 22h18"/>'),
  t_custom: P('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/>'),
  t_gate: P('<path d="M2 21h20M3 21V5h8v16M13 21V5h8v16"/><path d="M5 5v16M7 5v16M9 5v16M15 5v16M17 5v16M19 5v16"/>'),
  t_irondoor: P('<rect x="6" y="2" width="12" height="20"/><rect x="8" y="4" width="8" height="5"/><rect x="8" y="11" width="8" height="9"/><path d="M3 22h18"/>'),
  t_railing: P('<path d="M2 6h20M3 6v14M21 6v14M12 6v14M2 20h20"/><path d="M6 6v14M9 6v14M15 6v14M18 6v14" stroke-width="1"/>'),
  t_guard: P('<rect x="3" y="3" width="18" height="18"/><path d="M7.5 3v18M12 3v18M16.5 3v18M3 12h18"/>'),
  t_pergola: P('<path d="M2 7h20M2 11h20"/><path d="M4 7v14M20 7v14M12 11v10"/><path d="M5 7l1-3M9 7l1-3M13 7l1-3M17 7l1-3"/>')
};
MG.ic = k => MG.icons[k] || '';

/* ---------- Theme ---------- */
MG.theme = function () { return document.documentElement.getAttribute('data-theme') || 'dark'; };
MG.toggleTheme = function (noShell) {
  const t = MG.theme() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('mg.theme', t); } catch (e) {}
  document.querySelector('meta[name=theme-color]').setAttribute('content', t === 'dark' ? '#0c0d10' : '#f5f1e8');
  if (noShell !== true) { MG.renderShell(); MG.route(); }
};
MG.toggleLang = function () { MG.setLang(MG.lang === 'ar' ? 'en' : 'ar'); MG.renderShell(); MG.route(); };

/* ---------- Shell ---------- */
// [key, icon, href, permission or null, group]
MG.nav = [
  ['dashboard', 'home', '#/', null, 'main'],
  ['projects', 'folder', '#/projects', null, 'main'],
  ['customers', 'users', '#/customers', 'customers', 'main'],
  ['calculator', 'calc', '#/calc', 'view.prices', 'main'],
  ['sketch', 'pen', '#/sketch', null, 'main'],
  ['expenses', 'wallet', '#/expenses', 'expenses', 'money'],
  ['workers', 'hardhat', '#/workers', 'workers', 'money'],
  ['suppliers', 'truck', '#/suppliers', 'suppliers', 'money'],
  ['accounting', 'book', '#/accounting', 'accounting', 'money'],
  ['reports', 'chart', '#/reports', 'reports', 'money'],
  ['users', 'shield', '#/users', 'users', 'admin'],
  ['settings', 'gear', '#/settings', 'settings', 'admin']
];
MG.navAllowed = n => !n[3] || MG.can(n[3]);
MG.brandHtml = function () {
  const c = MG.db.settings.company;
  const name = MG.lang === 'ar' ? (c.nameAr || c.name) : (c.name || c.nameAr);
  return `<div class="brand"><div class="brand-mark">M</div><div><div class="brand-name">${MG.esc(name)}</div><div class="brand-sub">${MG.t('appSub')}</div></div></div>`;
};
MG.renderShell = function () {
  if (!MG.user) return;
  const side = document.getElementById('sidebar');
  let lastGroup = '';
  const links = MG.nav.filter(MG.navAllowed).map(n => {
    const head = n[4] !== lastGroup ? `<div class="nav-group">${MG.t('grp_' + n[4])}</div>` : '';
    lastGroup = n[4];
    return head + `<a href="${n[2]}" data-nav="${n[0]}">${MG.ic(n[1])}<span>${MG.t(n[0])}</span></a>`;
  }).join('');
  side.innerHTML = MG.brandHtml() + (MG.canQuick() ? `<button class="btn btn-gold btn-block quick-btn" onclick="MG.quickAdd()">${MG.ic('plus')} ${MG.t('quickEntry')}</button>` : '') +
    `<nav class="nav">${links}</nav>
    <div class="sidebar-foot">
      <div class="user-chip"><div class="avatar">${MG.esc((MG.user.name || '?').trim().charAt(0).toUpperCase())}</div>
        <div style="min-width:0;cursor:pointer" onclick="MG.changePassword()" title="${MG.t('changePassword')}"><div class="u-name">${MG.esc(MG.user.name)}</div><div class="u-role">${MG.t('role_' + MG.user.role)}</div></div>
        <button class="btn btn-ghost btn-sm btn-icon" title="${MG.t('logout')}" onclick="MG.logout()">${MG.ic('logout')}</button></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-sm" style="flex:1" onclick="MG.toggleLang()">${MG.ic('globe')} ${MG.t('language')}</button>
        <button class="btn btn-sm btn-icon" title="${MG.t('theme')}" onclick="MG.toggleTheme()">${MG.ic(MG.theme() === 'dark' ? 'sun' : 'moon')}</button>
      </div>
    </div>`;
  const bn = [['dashboard', 'home', '#/'], ['projects', 'folder', '#/projects']];
  bn.push(MG.canQuick() ? ['quickEntry', 'plus', 'javascript:MG.quickAdd()', true] : ['sketch', 'pen', '#/sketch']);
  bn.push(MG.can('customers') ? ['customers', 'users', '#/customers'] : ['calculator', 'calc', '#/calc']);
  bn.push(['more', 'more', '#/more']);
  document.getElementById('bottomnav').innerHTML = bn.map(n => n[3]
    ? `<a href="${n[2]}" class="fab" data-nav="${n[0]}"><span class="ic">${MG.ic(n[1])}</span><span>${MG.t(n[0])}</span></a>`
    : `<a href="${n[2]}" data-nav="${n[0]}">${MG.ic(n[1])}<span>${MG.t(n[0])}</span></a>`).join('');
  MG.markNav();
};
MG.markNav = function () {
  const h = location.hash.replace(/^#\/?/, '').split('/')[0] || 'dashboard';
  const map = { '': 'dashboard', project: 'projects', calc: 'calculator', customer: 'customers', supplier: 'suppliers', worker: 'workers' };
  const key = map[h] || h;
  const inBottom = ['dashboard', 'projects', 'customers'];
  document.querySelectorAll('[data-nav]').forEach(a => {
    const k = a.getAttribute('data-nav');
    a.classList.toggle('active', k === key || (k === 'more' && !inBottom.includes(key) && a.closest('#bottomnav')));
  });
};

MG.page = function (title, sub, actions) {
  return `<div class="mobile-top">${MG.brandHtml()}<div style="display:flex;gap:6px">
      <button class="btn btn-sm btn-icon" onclick="MG.toggleLang()" title="${MG.t('language')}">${MG.ic('globe')}</button>
      <button class="btn btn-sm btn-icon" onclick="MG.toggleTheme()">${MG.ic(MG.theme() === 'dark' ? 'sun' : 'moon')}</button></div></div>
    <div class="topbar"><div><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div><div class="topbar-actions">${actions || ''}</div></div>`;
};

/* ---------- Router ---------- */
const ROUTES = {
  '': ['dashboard'], dashboard: ['dashboard'], projects: ['projects'], project: ['project'],
  calc: ['calculator', 'view.prices'], sketch: ['sketch'], reports: ['reports', 'reports'], expenses: ['expenses', 'expenses'],
  settings: ['settings', 'settings'], more: ['more'], customers: ['customers', 'customers'], customer: ['customer', 'customers'],
  suppliers: ['suppliers', 'suppliers'], supplier: ['supplier', 'suppliers'], workers: ['workers', 'workers'], worker: ['worker', 'workers'],
  accounting: ['accounting', 'accounting'], users: ['users', 'users']
};
MG.route = function () {
  if (!MG.user) return;
  const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const main = document.getElementById('main');
  const r = parts[0] || '';
  MG.closeModal(true);
  try {
    const def = ROUTES[r] || ROUTES[''];
    if (def[1] && !MG.can(def[1])) main.innerHTML = MG.page(MG.t('noAccess'), '') + `<div class="card empty">${MG.ic('shield')}<p>${MG.t('noAccessHint')}</p></div>`;
    else MG.views[def[0]](main, parts[1], parts[2]);
  } catch (e) { console.error(e); main.innerHTML = `<div class="card">Error: ${MG.esc(e.message)}</div>`; }
  MG.markNav();
  window.scrollTo(0, 0);
};
MG.go = function (h) { if (location.hash === h) MG.route(); else location.hash = h; };

let booted = false;
MG.boot = function () {
  MG.setLang(MG.lang);
  MG.renderShell();
  if (!booted) { window.addEventListener('hashchange', MG.route); booted = true; }
  MG.route();
};
MG.start = function () {
  MG.setLang(MG.lang);
  if (MG.db.users.length && MG.restoreSession()) {
    document.querySelector('.app').classList.remove('hide');
    document.getElementById('bottomnav').classList.remove('hide');
    MG.boot();
  } else MG.authScreen();
};

/* ---------- Money input (USD or LBP) ---------- */
MG.moneyInp = function (name, val, cur) {
  return `<div class="money-in"><input class="input" name="${name}" type="number" step="any" inputmode="decimal" min="0" value="${MG.esc(val == null ? '' : val)}">
    <select class="input" name="${name}__cur"><option value="USD" ${cur !== 'LBP' ? 'selected' : ''}>$ USD</option><option value="LBP" ${cur === 'LBP' ? 'selected' : ''}>ل.ل LBP</option></select></div>
    <div class="money-hint" data-hint="${name}"></div>`;
};
/* Reads a money field from formData: returns { usd, orig, cur, rate } */
MG.readMoney = function (v, name) {
  const cur = v[name + '__cur'] || 'USD', orig = parseFloat(v[name]) || 0, rate = MG.db.settings.rate || 89500;
  return { usd: Math.round(MG.toUsd(orig, cur, rate) * 100) / 100, orig, cur, rate };
};
document.addEventListener('input', e => {
  const box = e.target.closest && e.target.closest('.money-in');
  if (!box) return;
  const inp = box.querySelector('input'), sel = box.querySelector('select');
  const hint = box.parentElement.querySelector(`[data-hint="${inp.name}"]`);
  if (!hint) return;
  const v = parseFloat(inp.value) || 0;
  hint.textContent = !v ? '' : sel.value === 'LBP' ? '≈ ' + MG.money(MG.toUsd(v, 'LBP')) : '≈ ' + MG.lbp(v);
});
document.addEventListener('change', e => { if (e.target.closest && e.target.closest('.money-in')) e.target.dispatchEvent(new Event('input', { bubbles: true })); });

/* Blocks saving into a closed accounting period */
MG.guardDate = function (date) {
  if (MG.isLocked(date)) { MG.toast(MG.t('periodLocked') + ' ' + MG.db.settings.lockBefore, 'err'); return false; }
  return true;
};
MG.accountOpts = () => MG.db.accounts.map(a => [a.id, MG.nm(a.name)]);

/* ---------- Modal ---------- */
MG.modal = function (title, body, footer, opts) {
  opts = opts || {};
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-bg"><div class="modal ${opts.wide ? 'wide' : ''}">
    <div class="modal-h"><h2>${title}</h2><button class="btn btn-ghost btn-icon" data-close>${MG.ic('x')}</button></div>
    <div class="modal-b">${body}</div>${footer ? `<div class="modal-f">${footer}</div>` : ''}</div></div>`;
  const bg = root.firstElementChild;
  bg.addEventListener('mousedown', e => { if (e.target === bg) MG.closeModal(); });
  bg.querySelectorAll('[data-close]').forEach(b => b.onclick = () => MG.closeModal());
  document.body.style.overflow = 'hidden';
  const first = bg.querySelector('input:not([type=checkbox]),select,textarea');
  if (first && !opts.noFocus && window.innerWidth > 860) setTimeout(() => first.focus(), 50);
  return bg;
};
MG.closeModal = function () {
  document.getElementById('modal-root').innerHTML = '';
  document.body.style.overflow = '';
};
MG.confirm = function (msg, fn) {
  const m = MG.modal(MG.t('delete'), `<p style="margin:0">${msg}</p>`,
    `<button class="btn" data-close>${MG.t('cancel')}</button><button class="btn btn-gold" data-ok>${MG.t('delete')}</button>`, { noFocus: true });
  m.querySelector('[data-close]').onclick = () => MG.closeModal();
  m.querySelector('[data-ok]').onclick = () => { MG.closeModal(); fn(); };
};
MG.toast = function (msg, type) {
  const el = document.createElement('div');
  el.className = 'toast ' + (type || 'ok');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2400);
};

/* ---------- Form helpers ---------- */
MG.fld = function (label, input, cls) { return `<div class="field ${cls || ''}"><label>${label}</label>${input}</div>`; };
MG.inp = function (name, val, type, attrs) {
  return `<input class="input" name="${name}" type="${type || 'text'}" value="${MG.esc(val == null ? '' : val)}" ${type === 'number' ? 'inputmode="decimal" step="any"' : ''} ${attrs || ''}>`;
};
MG.sel = function (name, opts, val, attrs) {
  return `<select class="input" name="${name}" ${attrs || ''}>${opts.map(o => `<option value="${MG.esc(o[0])}" ${String(o[0]) === String(val) ? 'selected' : ''}>${MG.esc(o[1])}</option>`).join('')}</select>`;
};
MG.formData = function (root) {
  const o = {};
  root.querySelectorAll('[name]').forEach(el => {
    if (el.type === 'checkbox') o[el.name] = el.checked;
    else if (el.type === 'number') o[el.name] = el.value === '' ? '' : parseFloat(el.value);
    else o[el.name] = el.value;
  });
  return o;
};

MG.secTag = s => `<span class="tag tag-${s}">${MG.t(s)}</span>`;
MG.stTag = s => `<span class="tag st-${s}">${MG.t('st_' + s)}</span>`;
MG.statuses = ['quote', 'active', 'done', 'cancelled'];

/* ---------- Print ---------- */
MG.print = function (html) {
  const pa = document.getElementById('print-area');
  pa.innerHTML = html;
  setTimeout(() => { window.print(); }, 80);
};
MG.download = function (name, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: type || 'text/plain' }));
  a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
};
