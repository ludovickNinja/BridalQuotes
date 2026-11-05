/* BridalQuotes POC — shared UI helpers (stand-ins for jquery.tools overlay, jquery-confirm, smSearch.js, custom_upload.js) */
window.UI = (function () {
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n, cur) => (cur ? cur + ' ' : '$') + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money0 = n => '$' + Math.round(Number(n) || 0).toLocaleString('en-US');
  const n2 = n => (Number(n) || 0).toFixed(2);
  const qs = k => new URLSearchParams(location.search).get(k);
  const fmtDate = iso => iso ? iso : '';

  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'style') e.style.cssText = v; else if (v != null) e.setAttribute(k, v);
    });
    (children || []).forEach(c => { if (c == null) return; e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function options(list, selected, opts) {
    opts = opts || {};
    return list.map(o => `<option value="${esc(o.id)}"${String(o.id) === String(selected) ? ' selected' : ''}${opts.data ? opts.data(o) : ''}>${esc(opts.label ? opts.label(o) : o.name)}</option>`).join('');
  }
  function val(root, name) { const f = root.querySelector(`[name="${name}"]`); if (!f) return undefined; if (f.type === 'checkbox') return f.checked ? 1 : 0; return f.value; }
  function num(root, name) { const v = val(root, name); return v === '' || v == null ? 0 : Number(v); }

  // admin bar shared by every screen
  function adminBar(title) {
    const bar = el('div', { class: 'admin-bar' });
    bar.innerHTML = `<span class="brand">WEB ADMINISTRATION</span> <a href="index.html">HOME</a> <a href="index.html">MENU</a> <a href="settings.html">RATES &amp; SETTINGS</a> <a href="#" onclick="return false">LOGOUT</a>
      <span class="poc" title="Static proof of concept — data lives in this browser only">POC</span>
      <span class="right">${esc(title || '')} · ${esc(DB.USER)} · ${esc(new Date().toISOString().slice(0, 10))}</span>`;
    document.body.prepend(bar);
  }

  // ---- overlay / modal ----
  function overlay(title, bodyHTML, buttons, opts) {
    closeOverlay();
    const bg = el('div', { class: 'overlay-bg', id: 'divOverlay' });
    const box = el('div', { class: 'overlay', style: opts && opts.width ? 'width:' + opts.width : '' });
    box.innerHTML = `<div class="ov-h"><span>${esc(title)}</span><span class="x" title="Close">✕</span></div><div class="ov-b">${bodyHTML}</div><div class="ov-f"></div>`;
    const foot = box.querySelector('.ov-f');
    (buttons || [{ label: 'Close', onclick: closeOverlay }]).forEach(b => foot.appendChild(el('button', { class: b.primary ? 'primary' : (b.danger ? 'danger' : ''), onclick: () => b.onclick && b.onclick(box) }, [b.label])));
    box.querySelector('.x').onclick = closeOverlay;
    bg.appendChild(box); document.body.appendChild(bg);
    return box;
  }
  function closeOverlay() { const o = $('#divOverlay'); if (o) o.remove(); }
  function confirmBox(title, text, buttons) { // jquery-confirm stand-in: buttons [{label, onclick}]
    return overlay(title, `<div style="min-width:360px">${text}</div>`, buttons.map(b => Object.assign({}, b, { onclick: () => { closeOverlay(); b.onclick && b.onclick(); } })));
  }
  function updBan(text) { let b = $('#divUpdBan'); if (!b) { b = el('div', { class: 'updban', id: 'divUpdBan' }); document.body.appendChild(b); } b.textContent = text; b.style.display = ''; clearTimeout(b._t); b._t = setTimeout(() => { b.style.display = 'none'; }, 900); }

  // ---- smart search (smSearch.js stand-in): input + dropdown of results, onPick(item) ----
  function smartSearch(input, searchFn, labelFn, onPick) {
    const wrap = input.parentElement.classList.contains('smart') ? input.parentElement : (() => { const w = el('div', { class: 'smart' }); input.replaceWith(w); w.appendChild(input); return w; })();
    let res = wrap.querySelector('.results'); if (!res) { res = el('div', { class: 'results hidden' }); wrap.appendChild(res); }
    input.setAttribute('autocomplete', 'off');
    input.addEventListener('input', () => {
      const items = searchFn(input.value);
      res.innerHTML = '';
      if (!items.length) { res.classList.add('hidden'); return; }
      items.forEach(it => res.appendChild(el('div', { text: labelFn(it), onmousedown: ev => { ev.preventDefault(); res.classList.add('hidden'); onPick(it); } })));
      res.classList.remove('hidden');
    });
    input.addEventListener('blur', () => setTimeout(() => res.classList.add('hidden'), 150));
    input.addEventListener('focus', () => { if (res.children.length) res.classList.remove('hidden'); });
  }

  // ---- image intake (custom_upload.js stand-in): file → downscaled JPEG data URL (keeps localStorage small) ----
  function readImageFile(file, maxPx) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, (maxPx || 700) / Math.max(img.width, img.height));
          const c = document.createElement('canvas'); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.75));
        };
        img.onerror = reject; img.src = fr.result;
      };
      fr.onerror = reject; fr.readAsDataURL(file);
    });
  }
  function dropzone(zone, onImage) {
    const inp = el('input', { type: 'file', accept: 'image/*', style: 'display:none' });
    zone.appendChild(inp);
    zone.addEventListener('click', e => { if (e.target.tagName !== 'BUTTON') inp.click(); });
    inp.addEventListener('change', async () => { if (inp.files[0]) onImage(await readImageFile(inp.files[0]), inp.files[0].name); inp.value = ''; });
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('over'));
    zone.addEventListener('drop', async e => { e.preventDefault(); zone.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) onImage(await readImageFile(f), f.name); });
  }

  function statusClass(q) { return q.status === 'converted' ? 'converted' : q.status === 'approved' ? 'approved' : 'pending'; }
  function statusLabel(q) { return q.status === 'converted' ? 'Converted to Order' : q.status === 'approved' ? 'Approved by client' : 'Pending'; }
  function accountName(uaID) { const a = ACCOUNTS.byID(uaID); return a ? a.name : '(unknown account ' + uaID + ')'; }

  return { $, $$, esc, money, money0, n2, qs, fmtDate, el, options, val, num, adminBar, overlay, closeOverlay, confirmBox, updBan, smartSearch, readImageFile, dropzone, statusClass, statusLabel, accountName };
})();
