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
    location.hash = '#/';
    MG.start();
  };

  MG.createUser = function (data) {
    const salt = MG.uid();
    const u = { id: MG.uid(), name: data.name, username: data.username.trim().toLowerCase(), role: data.role || 'sales',
      salt, pass: MG.hashPass(salt, data.password), active: true, created: Date.now() };
    MG.db.users.push(u);
    return u;
  };
  MG.setPassword = function (u, pass) { u.salt = MG.uid(); u.pass = MG.hashPass(u.salt, pass); };

  /* ---------- Login / first-run screens ---------- */
  MG.authScreen = function () {
    const t = MG.t, ic = MG.ic;
    const setup = !MG.db.users.length;
    document.querySelector('.app').classList.add('hide');
    document.getElementById('bottomnav').classList.add('hide');
    let box = document.getElementById('auth');
    if (!box) { box = document.createElement('div'); box.id = 'auth'; document.body.insertBefore(box, document.body.firstChild); }
    const c = MG.db.settings.company;
    box.innerHTML = `<div class="auth-wrap">
      <div class="auth-card">
        <div class="auth-top">
          <button class="btn btn-sm btn-ghost" id="al">${ic('globe')} ${t('language')}</button>
          <button class="btn btn-sm btn-ghost btn-icon" id="at">${ic(MG.theme() === 'dark' ? 'sun' : 'moon')}</button>
        </div>
        <div class="auth-brand"><div class="brand-mark big">M</div>
          <h1>${MG.esc(MG.lang === 'ar' ? (c.nameAr || c.name) : (c.name || c.nameAr))}</h1><div class="brand-sub">${t('appSub')}</div></div>
        <h2 class="auth-title">${setup ? t('setupTitle') : t('login')}</h2>
        ${setup ? `<p class="muted auth-p">${t('setupHint')}</p>` : ''}
        <form id="af" class="grid" autocomplete="on">
          ${setup ? MG.fld(t('fullName'), MG.inp('name', '', 'text', 'required autocomplete="name"')) : ''}
          ${MG.fld(t('username'), MG.inp('username', '', 'text', 'required autocomplete="username" autocapitalize="off" dir="ltr"'))}
          ${MG.fld(t('password'), MG.inp('password', '', 'password', 'required autocomplete="' + (setup ? 'new-password' : 'current-password') + '" dir="ltr"'))}
          ${setup ? MG.fld(t('confirmPassword'), MG.inp('password2', '', 'password', 'required autocomplete="new-password" dir="ltr"')) : `<label class="check"><input type="checkbox" name="remember" checked> ${t('rememberMe')}</label>`}
          <div class="auth-err" id="ae"></div>
          <button class="btn btn-gold btn-block" type="submit" style="min-height:48px">${setup ? t('createAdmin') : t('login')}</button>
        </form>
      </div></div>`;
    box.querySelector('#al').onclick = () => { MG.setLang(MG.lang === 'ar' ? 'en' : 'ar'); MG.authScreen(); };
    box.querySelector('#at').onclick = () => { MG.toggleTheme(true); MG.authScreen(); };
    box.querySelector('#af').onsubmit = e => {
      e.preventDefault();
      const v = MG.formData(e.target), err = box.querySelector('#ae');
      const uname = (v.username || '').trim().toLowerCase();
      if (setup) {
        if (!v.name || !uname) { err.textContent = t('fillAll'); return; }
        if ((v.password || '').length < 4) { err.textContent = t('passShort'); return; }
        if (v.password !== v.password2) { err.textContent = t('passMismatch'); return; }
        const u = MG.createUser({ name: v.name, username: uname, password: v.password, role: 'admin' });
        MG.user = u; MG.log('setup', u.username); MG.save();
        try { localStorage.setItem('mg.session', u.id); } catch (x) {}
      } else {
        const u = MG.db.users.find(x => x.username === uname);
        if (!u || u.active === false || u.pass !== MG.hashPass(u.salt, v.password || '')) {
          err.textContent = t('badLogin'); MG.user = null; MG.log('login.failed', uname); MG.save(); return;
        }
        MG.user = u; u.lastLogin = Date.now(); MG.log('login'); MG.save();
        try { (v.remember ? localStorage : sessionStorage).setItem('mg.session', u.id); } catch (x) {}
      }
      box.remove();
      document.querySelector('.app').classList.remove('hide');
      document.getElementById('bottomnav').classList.remove('hide');
      MG.boot();
    };
  };
})();
