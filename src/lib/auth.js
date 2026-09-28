import { MG } from './mg.js';
/* Majed Group — users, roles, login and audit log */
(function () {
  /* Compact SHA-256 (works everywhere, including when opened from file://) */
  function sha256(ascii) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    const maxWord = Math.pow(2, 32); let result = '', words = [], i, j;
    const asciiBitLength = ascii.length * 8;
    let hash = sha256.h = sha256.h || [], k = sha256.k = sha256.k || [], primeCounter = k.length;
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (Math.pow(candidate, .5) * maxWord) | 0;
        k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    hash = hash.slice(0, 8);
    ascii += '\x80';
    while (ascii.length % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) { j = ascii.charCodeAt(i); words[i >> 2] |= j << ((3 - i) % 4) * 8; }
    words[words.length] = ((asciiBitLength / maxWord) | 0); words[words.length] = (asciiBitLength);
    for (j = 0; j < words.length;) {
      const w = words.slice(j, j += 16), oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        const temp1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] +
          (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        const temp2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash); hash[4] = (hash[4] + temp1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) { const b = (hash[i] >> (j * 8)) & 255; result += ((b < 16) ? 0 : '') + b.toString(16); }
    return result;
  }
  const utf8 = s => unescape(encodeURIComponent(s));
  MG.hashPass = (salt, pass) => sha256(utf8(salt + '::' + pass));

  /* ---------- Roles ---------- */
  MG.PERMS = ['view.prices', 'view.costs', 'projects.edit', 'payments.receive', 'expenses', 'accounting', 'reports',
    'customers', 'suppliers', 'workers', 'settings', 'delete', 'users'];
  MG.ROLES = {
    admin: MG.PERMS.slice(),
    accountant: ['view.prices', 'view.costs', 'projects.edit', 'payments.receive', 'expenses', 'accounting', 'reports', 'customers', 'suppliers', 'workers', 'settings', 'delete'],
    sales: ['view.prices', 'projects.edit', 'payments.receive', 'customers'],
    worker: []
  };

  MG.user = null;
  MG.can = function (perm) {
    if (!MG.user) return false;
    return (MG.ROLES[MG.user.role] || []).includes(perm);
  };

  MG.log = function (action, detail) {
    MG.db.log.unshift({ ts: Date.now(), user: MG.user ? MG.user.username : '-', action, detail: detail || '' });
    if (MG.db.log.length > 3000) MG.db.log.length = 3000;
  };

  function readSession() {
    try { return sessionStorage.getItem('mg.session') || localStorage.getItem('mg.session'); } catch (e) { return null; }
  }
  MG.restoreSession = function () {
    const id = readSession();
    const u = id && MG.db.users.find(x => x.id === id && x.active !== false);
    MG.user = u || null;
    return !!u;
  };
  MG.logout = function () {
    MG.log('logout');
    MG.save();
    try { sessionStorage.removeItem('mg.session'); localStorage.removeItem('mg.session'); } catch (e) {}
    MG.user = null;
    MG.emit();
  };
  /* Returns the user on success, null on failure */
  MG.login = function (username, password, remember) {
    const uname = (username || '').trim().toLowerCase();
    const u = MG.db.users.find(x => x.username === uname);
    if (!u || u.active === false || u.pass !== MG.hashPass(u.salt, password || '')) {
      MG.user = null; MG.log('login.failed', uname); MG.save(); return null;
    }
    MG.user = u; u.lastLogin = Date.now(); MG.log('login');
    try { (remember ? localStorage : sessionStorage).setItem('mg.session', u.id); } catch (x) {}
    MG.save();
    return u;
  };
  MG.setupAdmin = function (name, username, password) {
    const u = MG.createUser({ name, username: username.trim().toLowerCase(), password, role: 'admin' });
    MG.user = u; MG.log('setup', u.username);
    try { localStorage.setItem('mg.session', u.id); } catch (x) {}
    MG.save();
    return u;
  };

  MG.createUser = function (data) {
    const salt = MG.uid();
    const u = { id: MG.uid(), name: data.name, username: data.username.trim().toLowerCase(), role: data.role || 'sales',
      salt, pass: MG.hashPass(salt, data.password), active: true, created: Date.now() };
    MG.db.users.push(u);
    return u;
  };
  MG.setPassword = function (u, pass) { u.salt = MG.uid(); u.pass = MG.hashPass(u.salt, pass); };
})();
