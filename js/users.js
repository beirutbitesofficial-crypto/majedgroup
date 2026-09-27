/* Majed Group — user management, permissions matrix and audit log */
(function () {
  const t = MG.t, ic = MG.ic, esc = MG.esc;
  const ROLE_KEYS = ['admin', 'accountant', 'sales', 'worker'];

  MG.views.users = function (el) {
    const lq = (MG.__logq || '').toLowerCase();
    const log = MG.db.log.filter(l => !lq || (l.user + ' ' + l.action + ' ' + l.detail).toLowerCase().includes(lq)).slice(0, 300);
    el.innerHTML = MG.page(t('users'), `${MG.db.users.length} ${t('users')}`, `<button class="btn btn-gold" id="nu">${ic('plus')} ${t('newUser')}</button>`) + `
      <div class="two-col" style="margin-bottom:18px">
        <div class="card"><div class="card-h"><h3>${t('users')}</h3></div>
          <div class="table-wrap"><table class="t"><thead><tr><th>${t('fullName')}</th><th>${t('username')}</th><th>${t('role')}</th><th>${t('lastLogin')}</th><th></th></tr></thead><tbody>
          ${MG.db.users.map(u => `<tr style="${u.active === false ? 'opacity:.45' : ''}"><td><b>${esc(u.name)}</b>${u.id === MG.user.id ? ` <span class="tag pay-paid">${t('you')}</span>` : ''}${u.active === false ? ` <span class="tag pay-unpaid">${t('disabled')}</span>` : ''}</td>
            <td class="num">${esc(u.username)}</td><td><span class="tag role-${u.role}">${t('role_' + u.role)}</span></td>
            <td class="num muted">${u.lastLogin ? new Date(u.lastLogin).toLocaleString('en-GB') : '—'}</td>
            <td class="r"><button class="btn btn-ghost btn-sm btn-icon" data-eu="${u.id}">${ic('edit')}</button></td></tr>`).join('')}
          </tbody></table></div></div>
        <div class="card"><div class="card-h"><h3>${t('permissions')}</h3></div>
          <div class="table-wrap"><table class="t perm"><thead><tr><th></th>${ROLE_KEYS.map(r => `<th class="c">${t('role_' + r)}</th>`).join('')}</tr></thead><tbody>
          ${MG.PERMS.map(p => `<tr><td>${t('perm_' + p.replace('.', '_'))}</td>${ROLE_KEYS.map(r => `<td class="c">${MG.ROLES[r].includes(p) ? `<span class="pos">${ic('check')}</span>` : '<span class="muted">—</span>'}</td>`).join('')}</tr>`).join('')}
          </tbody></table></div></div>
      </div>
      <div class="card"><div class="card-h"><h3>${t('auditLog')}</h3><div class="search" style="max-width:280px">${ic('search')}<input class="input" id="lq" placeholder="${t('search')}" value="${esc(MG.__logq || '')}"></div></div>
        <p class="muted" style="margin-top:0;font-size:12.5px">${t('auditHint')}</p>
        ${log.length ? `<div class="table-wrap" style="max-height:480px;overflow:auto"><table class="t"><thead><tr><th>${t('time')}</th><th>${t('username')}</th><th>${t('action')}</th><th>${t('description')}</th></tr></thead><tbody>
          ${log.map(l => `<tr><td class="num muted" style="white-space:nowrap">${new Date(l.ts).toLocaleString('en-GB')}</td><td class="num">${esc(l.user)}</td><td><code>${esc(l.action)}</code></td><td>${esc(l.detail)}</td></tr>`).join('')}
        </tbody></table></div>` : '<p class="muted">—</p>'}</div>`;
    el.querySelector('#nu').onclick = () => userForm();
    el.querySelectorAll('[data-eu]').forEach(b => b.onclick = () => userForm(MG.db.users.find(u => u.id === b.dataset.eu)));
    el.querySelector('#lq').onchange = e => { MG.__logq = e.target.value; MG.route(); };
  };

  function userForm(u) {
    const isNew = !u;
    const d = u || { name: '', username: '', role: 'sales', active: true };
    const m = MG.modal(isNew ? t('newUser') : t('edit'), `<div class="grid g2">
      ${MG.fld(t('fullName'), MG.inp('name', d.name), 'span2')}
      ${MG.fld(t('username'), MG.inp('username', d.username, 'text', 'dir="ltr" autocapitalize="off" autocomplete="off"'))}
      ${MG.fld(t('role'), MG.sel('role', ROLE_KEYS.map(r => [r, t('role_' + r)]), d.role))}
      ${MG.fld(isNew ? t('password') : t('newPasswordOpt'), MG.inp('password', '', 'password', 'dir="ltr" autocomplete="new-password"'), 'span2')}
      <label class="check span2"><input type="checkbox" name="active" ${d.active !== false ? 'checked' : ''}> ${t('accountActive')}</label>
      <p class="muted span2" id="rd" style="font-size:12.5px;margin:0"></p></div>`,
      `<button class="btn" data-close>${t('cancel')}</button><button class="btn btn-gold" id="ok">${t('save')}</button>`);
    const rd = () => { m.querySelector('#rd').textContent = t('roleDesc_' + m.querySelector('[name=role]').value); };
    m.querySelector('[name=role]').onchange = rd; rd();
    m.querySelector('[data-close]').onclick = () => MG.closeModal();
    m.querySelector('#ok').onclick = () => {
      const v = MG.formData(m);
      const uname = (v.username || '').trim().toLowerCase();
      if (!v.name.trim() || !uname) { MG.toast(t('fillAll'), 'err'); return; }
      if (MG.db.users.some(x => x.username === uname && x !== u)) { MG.toast(t('usernameTaken'), 'err'); return; }
      if ((isNew || v.password) && (v.password || '').length < 4) { MG.toast(t('passShort'), 'err'); return; }
      const admins = MG.db.users.filter(x => x.role === 'admin' && x.active !== false && x !== u).length;
      if (!admins && (v.role !== 'admin' || !v.active)) { MG.toast(t('needOneAdmin'), 'err'); return; }
      if (isNew) { MG.createUser({ name: v.name.trim(), username: uname, password: v.password, role: v.role }).active = v.active; MG.log('user.create', uname + ' (' + v.role + ')'); }
      else {
        Object.assign(u, { name: v.name.trim(), username: uname, role: v.role, active: v.active });
        if (v.password) { MG.setPassword(u, v.password); MG.log('user.password', uname); }
        MG.log('user.edit', uname + ' (' + v.role + (v.active ? '' : ', disabled') + ')');
        if (u.id === MG.user.id) MG.user = u;
      }
      MG.save(); MG.closeModal(); MG.toast(t('saved')); MG.renderShell(); MG.route();
    };
  }

  MG.changePassword = function () {
    const m = MG.modal(t('changePassword'), `<div class="grid">
      ${MG.fld(t('currentPassword'), MG.inp('old', '', 'password', 'dir="ltr" autocomplete="current-password"'))}
      ${MG.fld(t('password'), MG.inp('p1', '', 'password', 'dir="ltr" autocomplete="new-password"'))}
      ${MG.fld(t('confirmPassword'), MG.inp('p2', '', 'password', 'dir="ltr" autocomplete="new-password"'))}</div>`,
      `<button class="btn" data-close>${t('cancel')}</button><button class="btn btn-gold" id="ok">${t('save')}</button>`);
    m.querySelector('[data-close]').onclick = () => MG.closeModal();
    m.querySelector('#ok').onclick = () => {
      const v = MG.formData(m), u = MG.user;
      if (u.pass !== MG.hashPass(u.salt, v.old || '')) { MG.toast(t('badLogin'), 'err'); return; }
      if ((v.p1 || '').length < 4) { MG.toast(t('passShort'), 'err'); return; }
      if (v.p1 !== v.p2) { MG.toast(t('passMismatch'), 'err'); return; }
      MG.setPassword(u, v.p1); MG.log('user.password', u.username); MG.save(); MG.closeModal(); MG.toast(t('saved'));
    };
  };
})();
