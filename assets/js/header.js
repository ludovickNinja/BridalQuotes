/* Custom Bridal Quote header — stand-in for /_admin/quoteCBR.asp (see reference/quoteCBR_inline.js for the original behaviour) */
(function () {
  const { $, $$, esc, money, el, qs, accountName } = UI;
  const quoteID = Number(qs('quoteID') || 0);
  let quote = quoteID ? DB.quote(quoteID) : null;
  const isDraft = !quote;
  if (isDraft) {
    const d = DB.draft();
    if (!d) { alert('No quote in progress — start from the quote list.'); location.href = 'index.html?viewCBR=1'; return; }
    quote = Object.assign({ quoteID: 0, dateQuoted: DB.today(), expiry: DB.addDays(DB.today(), DB.rates().expiryDays), lastSent: null, status: 'pending', userID: DB.USER }, d);
  }
  const acc = ACCOUNTS.byID(quote.uaID);
  const cur = acc ? acc.currency : 'USD';
  UI.adminBar('Custom Bridal Quote');

  // ---- header ----
  $('#title').textContent = quote.quoteID ? `Custom Bridal Quote# ${quote.quoteID}-${quote.ctName}` : 'Custom Bridal Quote';
  $('#dates').textContent = quote.quoteID ? `Quoted ${quote.dateQuoted} · Expiry ${quote.expiry}${quote.lastSent ? ' · Last sent ' + quote.lastSent : ''}` : 'New quote — not saved until the first ring is saved';
  const ship = acc && acc.shipping.find(s => s.shippingID === Number(quote.shippingID));
  $('#divBilling').innerHTML = `${esc(quote.ctName)}<br><a href="#" id="lnkAcc">${esc(acc ? acc.name : '')}</a><br>${esc(acc ? acc.billing : '')}<br>${esc(acc ? acc.phone : '')}<br><span class="small muted">currency ${cur}</span>`;
  $('#divShipping').innerHTML = `${esc(quote.ctName)}<br>${esc(acc ? acc.name : '')}<br>${ship ? esc(ship.address) : '<span class="muted">(no shipping address selected)</span>'}`;
  $('#lnkAcc').onclick = e => { e.preventDefault(); UI.overlay('Account ' + (acc ? acc.uaID : ''), `<p>userAccountEdit.asp?recID=${acc ? acc.uaID : ''} is outside the quote module; in the POC the account record is read-only.</p><pre>${esc(JSON.stringify(acc, null, 1))}</pre>`); };
  $('#btnLogAs').onclick = () => UI.overlay('Log As', `<p>In the live system this impersonates the retailer on the B2B site (home_act.asp act=log2B2B → /b2b/index.asp) to see the quote as the store does.</p><p>The POC equivalent is the customer summary page: ${DB.rings(quote.quoteID).map(r => `<a href="summary.html?CBRUID=${r.CBRUID}" target="_blank">Ref# ${r.CBRID}</a>`).join(' · ') || '(no ring yet)'}</p>`);

  const banner = [];
  if (quote.status === 'approved') banner.push('This quote has been <b>approved by the client</b>' + (quote.approvalDismissed ? ' (approval dismissed)' : '') + '.');
  if (quote.status === 'converted') banner.push('This quote has been <b>converted to an order</b>.');
  if (quote.quoteID && DB.isExpired(quote) && quote.status !== 'converted') banner.push(`This quote <b>expired on ${quote.expiry}</b>. Extend it from the list or unlock and relock the rings at today's metal price.`);
  if (quote.isReplacement) banner.push('Replacement quote.'); if (quote.isRepair) banner.push('Repair quote.');
  if (banner.length) { $('#divBanner').innerHTML = banner.join(' '); $('#divBanner').classList.remove('hidden'); }
  if (quote.status === 'approved' && !quote.approvalDismissed) $('#btnDismiss').classList.remove('hidden');

  // ---- email block ----
  const f = $('#f');
  f.quoteID.value = quote.quoteID; f.uaID.value = quote.uaID; f.shippingID.value = quote.shippingID || 0;
  f.comments.value = quote.comments || ''; f.isCommIncludEmail.checked = !!quote.isCommIncludEmail; f.ctName.value = quote.ctName || '';
  f.internalComments.value = quote.internalComments || ''; $('#divInternalComments').innerHTML = quote.internalComments || '<span class="muted">(none)</span>';
  let emails = (quote.ctEmails || []).slice();
  function confirmEmails_loadDD() {
    $('#divNotifEmailList').innerHTML = emails.map((e, i) => `<span class="badge">${esc(e)} <a class="action" data-i="${i}">✕</a></span> `).join('');
    f.ctEmails.value = emails.join(';');
    $$('#divNotifEmailList a').forEach(a => a.onclick = () => { emails.splice(Number(a.dataset.i), 1); confirmEmails_loadDD(); quoteCBRUpd(1); });
    $('#emailPick').innerHTML = '<option value=""></option>' + (acc ? acc.emails : []).map(e => `<option value="${esc(e)}">${esc(e)}</option>`).join('');
  }
  confirmEmails_loadDD();
  $('#emailPick').onchange = e => { const v = e.target.value.trim(); if (v && !emails.includes(v)) { emails.push(v); confirmEmails_loadDD(); quoteCBRUpd(1); } };
  $('#btnAddEmail').onclick = () => { const v = prompt('Email address:'); if (!v) return; if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]{2,}[.][a-zA-Z]{2,}$/.test(v)) return alert('Please enter a valid email'); if (acc && !acc.emails.includes(v)) acc.emails.push(v); emails.push(v); confirmEmails_loadDD(); quoteCBRUpd(1); };
  ['comments', 'isCommIncludEmail', 'ctName'].forEach(n => f[n].addEventListener('change', () => quoteCBRUpd(1)));

  function readForm() {
    quote.comments = f.comments.value; quote.isCommIncludEmail = f.isCommIncludEmail.checked ? 1 : 0; quote.ctName = f.ctName.value; quote.ctEmails = emails.slice(); quote.internalComments = f.internalComments.value;
  }
  function quoteCBRUpd(noReload, nocheck) {
    readForm();
    if (!nocheck && !quote.ctName.replace(/\s/g, '')) return alert('Contact Name is required');
    if (noReload) UI.updBan('updating...');
    if (isDraft) DB.setDraft(quote); else DB.saveQuote(quote);
    if (noReload) setTimeout(() => UI.updBan('saving...'), 300); else location.reload();
  }
  $('#btnSave').onclick = () => quoteCBRUpd(0);
  $('#btnIntComm').onclick = () => {
    const box = UI.overlay('Admin Internal Comments', `<p class="small muted">CKEditor 5 in the live system; plain HTML/text here.</p><textarea rows="10" style="width:100%">${esc(quote.internalComments || '')}</textarea>`, [
      { label: 'Save', primary: true, onclick: () => { f.internalComments.value = box.querySelector('textarea').value; $('#divInternalComments').innerHTML = f.internalComments.value || '<span class="muted">(none)</span>'; UI.closeOverlay(); quoteCBRUpd(1, 1); } }, { label: 'Cancel', onclick: UI.closeOverlay }], { width: '700px' });
  };
  $('#btnDismiss').onclick = () => { if (confirm("Are you sure you want to dismiss this quote's approval?")) { quote.approvalDismissed = 1; DB.saveQuote(quote); location.reload(); } };
  $('#btnDeleteQuote').onclick = () => { if (isDraft) { DB.setDraft(null); location.href = 'index.html?viewCBR=1'; return; } if (confirm('Delete quote ' + quote.quoteID + ' and all its rings?')) { DB.deleteQuote(quote.quoteID); location.href = 'index.html?viewCBR=1'; } };

  // ---- ring rows ----
  function CBR_edit(CBRID) { readForm(); if (isDraft) DB.setDraft(quote); window.open(`ring.html?quoteID=${quote.quoteID}&CBRID=${CBRID || 0}`, '_blank'); }
  $('#btnAddRing').onclick = () => CBR_edit(0);
  function renderRows() {
    const rings = DB.rings(quote.quoteID);
    $('#divContentGnrl').classList.toggle('hidden', !rings.length);
    $('#tblCt').classList.toggle('hidden', !rings.length && isDraft);
    const rows = $('#divRows'); rows.innerHTML = '';
    rings.forEach(r => {
      const p = PRODUCTS.byPID(r.PID);
      const locked = DB.currency(quote.quoteID) === 'CAD' ? (r.lockPriceCAD > 0 ? r.lockPriceCAD : (r.lockPriceUSD > 0 ? r.lockPriceUSD : 0)) : r.lockPriceUSD;
      const row = el('div', { class: 'tr' + (r.isEnabled === 0 ? ' inactive' : r.isEnabled === -1 ? ' pendingrow' : ''), 'data-cbrid': r.CBRID, 'data-islockedprice': r.lockPriceUSD > 0 ? r.lockPriceUSD : 0 });
      const prev = t => t ? ` <span class="small muted">— ${esc(t.length > 40 ? t.slice(0, 40) + '…' : t)}</span>` : '';
      row.innerHTML = `
        <div><select name="isEnabled"><option value="1"${r.isEnabled === 1 ? ' selected' : ''}>Active</option><option value="0"${r.isEnabled === 0 ? ' selected' : ''}>Inactive</option><option value="-1"${r.isEnabled === -1 ? ' selected' : ''}>Pending</option></select></div>
        <div><img class="thumb" src="${p ? PRODUCTS.img(p, 'side') : ''}" alt=""></div>
        <div class="desc">${r.ringName ? '<b>' + esc(r.ringName) + '</b><br>' : ''}<span class="small muted">${esc(p ? p.brand : '')}</span><br><span class="sku">${esc(p ? p.sku : '?')}-C</span> &nbsp; <span class="small">Ref#: ${r.CBRID}</span>
          ${r.isApproved === 1 ? ' <span class="badge yes">ACCEPTED</span>' : r.isApproved === 0 ? ' <span class="badge no">DECLINED</span>' : ''}
          <div class="links"><a class="action" data-act="dup">Duplicate</a><a href="summary.html?CBRUID=${r.CBRUID}" target="_blank">Preview</a><a class="action" data-act="note">Ring Notes</a>${prev(r.note)}<a class="action" data-act="ntrnl">Production Notes</a>${prev((r.ntrnlNotes || []).filter(Boolean).join(' / '))}<a class="action" data-act="admin">Admin Notes</a>${prev(r.adminNote)}<a class="action" data-act="links">Viewer Links</a>${prev([r.link1, r.link2].filter(Boolean).join(' '))}<a class="action" data-act="accept">Accept / Decline</a></div></div>
        <div>${esc(LK.name(LK.karats, r.karatID))}<br>${esc(LK.name(LK.colours, r.colourID))}</div>
        <div>Size: ${r.ringSize === -1 ? '<span class="danger">Pending</span>' : r.ringSize === 0 ? 'N/A' : esc(r.ringSize)}</div>
        <div><input type="number" name="qty" min="1" value="${r.qty}" class="short"></div>
        <div>${r.status ? '<span class="badge yes">Completed YES</span>' : '<span class="badge no">Completed NO</span>'}${DB.pendingItems(r).length && r.status ? '<span class="tooltip bang">!<span class="tip">' + DB.pendingItems(r).map(esc).join('<br>') + '</span></span>' : ''}</div>
        <div><a class="action" data-act="edit">Edit</a></div>
        <div class="price">${money(DB.ringPrice(r), cur)}${locked ? '' : '<br><span class="small danger">not locked</span>'}</div>
        <div class="rm" title="Remove" data-act="del">✕</div>`;
      row.querySelector('[name=isEnabled]').onchange = e => { r.isEnabled = Number(e.target.value); DB.saveRing(r); renderRows(); };
      row.querySelector('[name=qty]').onchange = e => { r.qty = Math.max(1, Number(e.target.value) || 1); DB.saveRing(r); renderRows(); };
      row.querySelectorAll('[data-act]').forEach(a => a.onclick = () => rowAction(a.dataset.act, r));
      rows.appendChild(row);
    });
    $('#divTotal').textContent = money(DB.quoteTotal(quote.quoteID), cur);
    const pdfs = rings.flatMap(r => (r.pdfHistory || []).map(h => `${h.date} · Ref# ${r.CBRID} · ${h.fileName}${h.isRetail ? ' (retail)' : ''}`));
    $('#divPdfHist').innerHTML = pdfs.length ? '<b>PDF history</b><br>' + pdfs.map(esc).join('<br>') : '';
  }
  function rowAction(act, r) {
    if (act === 'edit') return CBR_edit(r.CBRID);
    if (act === 'del') { if (confirm('Are you sure you want to delete this ring?')) { DB.deleteRing(r.CBRID); renderRows(); } return; }
    if (act === 'note') return textModal('Notes about this ring (customer-facing)', r.note, v => { r.note = v; DB.saveRing(r); renderRows(); });
    if (act === 'admin') return textModal('Admin Notes', r.adminNote, v => { r.adminNote = v; DB.saveRing(r); renderRows(); });
    if (act === 'ntrnl') {
      const box = UI.overlay('Production Notes (5 lines of 110 characters)', [0, 1, 2, 3, 4].map(i => `<input type="text" name="ntrnlNote" maxlength="110" style="width:100%;margin-bottom:4px" value="${esc((r.ntrnlNotes || [])[i] || '')}">`).join(''), [
        { label: 'Save', primary: true, onclick: () => { r.ntrnlNotes = $$('[name=ntrnlNote]', box).map(i => i.value); DB.saveRing(r); UI.closeOverlay(); renderRows(); } }, { label: 'Cancel', onclick: UI.closeOverlay }], { width: '700px' });
      return;
    }
    if (act === 'links') {
      const box = UI.overlay('Viewer Links (3D viewer)', `<table class="form"><tr><td class="lbl">Link 1</td><td><input type="text" name="link1" maxlength="500" style="width:460px" value="${esc(r.link1)}"></td></tr><tr><td class="lbl">Link 2</td><td><input type="text" name="link2" maxlength="500" style="width:460px" value="${esc(r.link2)}"></td></tr></table>`, [
        { label: 'Save', primary: true, onclick: () => { r.link1 = UI.val(box, 'link1'); r.link2 = UI.val(box, 'link2'); DB.saveRing(r); UI.closeOverlay(); renderRows(); } }, { label: 'Cancel', onclick: UI.closeOverlay }]);
      return;
    }
    if (act === 'accept') {
      const box = UI.overlay('Accept / Decline ring ' + r.CBRID, `<select name="isApproved"><option value="">—</option><option value="1"${r.isApproved === 1 ? ' selected' : ''}>Accept</option><option value="0"${r.isApproved === 0 ? ' selected' : ''}>Decline</option></select>`, [
        { label: 'Save', primary: true, onclick: () => { const v = UI.val(box, 'isApproved'); r.isApproved = v === '' ? null : Number(v); DB.saveRing(r); UI.closeOverlay(); renderRows(); } }, { label: 'Cancel', onclick: UI.closeOverlay }]);
      return;
    }
    if (act === 'dup') {
      const box = UI.overlay('Duplicate Ring', `<table class="form">
        <tr><td class="lbl">New Ring Name</td><td><input type="text" name="ringName" maxlength="50" style="width:300px" value="${esc(r.ringName)}"></td></tr>
        <tr><td class="lbl">Destination</td><td><label><input type="radio" name="isNewQuote" value="0" checked> Add to this quote</label><br><label><input type="radio" name="isNewQuote" value="1"> Create Replacement quote</label><br><label><input type="radio" name="isNewQuote" value="2"> Create Repair quote</label></td></tr>
        <tr><td></td><td><label><input type="checkbox" name="CopyImageRenderings"> Copy Image Renderings</label></td></tr></table>
        <p class="small muted">Duplicate is for same-SKU variants; a metal change is a different SKU, so add a new ring instead.</p>`, [
        { label: 'Duplicate', primary: true, onclick: () => {
          const mode = Number(box.querySelector('[name=isNewQuote]:checked').value);
          const nr = DB.duplicateRing(r.CBRID, UI.val(box, 'ringName'), mode, box.querySelector('[name=CopyImageRenderings]').checked);
          UI.closeOverlay();
          if (mode > 0) { if (confirm(`Ring duplicated into new quote # ${nr.quoteID}. Open it now?`)) location.href = 'quote.html?quoteID=' + nr.quoteID; }
          else renderRows();
        } }, { label: 'Cancel', onclick: UI.closeOverlay }]);
    }
  }
  function textModal(title, value, onSave) {
    const box = UI.overlay(title, `<textarea rows="6" style="width:100%">${esc(value || '')}</textarea>`, [{ label: 'Save', primary: true, onclick: () => { onSave(box.querySelector('textarea').value); UI.closeOverlay(); } }, { label: 'Cancel', onclick: UI.closeOverlay }], { width: '640px' });
  }

  // ---- send / copy email (CBR_createPDF → CBR_PDFready polling → CBR_sendEmail) ----
  function guards() {
    const rings = DB.rings(quote.quoteID);
    if (!rings.some(r => r.isEnabled === 1)) { alert('Please select at least one ring to include in the quote'); return null; }
    if (rings.some(r => r.isEnabled === 1 && !(r.lockPriceUSD > 0))) { alert('Please ensure that all active references have a price locked'); return null; }
    return rings;
  }
  function CBR_createPDF(isRetail, isNot4Send) {
    const rings = guards(); if (!rings) return;
    readForm(); if (!quote.ctName.trim()) return alert('Contact Name is required'); if (!emails.length && !isNot4Send) return alert('Please add at least one email address');
    DB.saveQuote(quote);
    const fileName = `CBR_${quote.quoteID}_${DB.today().replace(/-/g, '')}_${DB.nextPdfID()}.pdf`;
    const prog = $('#divSendProgress'); prog.classList.remove('hidden'); const bar = prog.querySelector('.progress div');
    let i = 0;
    const poll = () => { // CBR_PDFready: every 4 s up to 20 times in the live system; 400 ms here
      i++; bar.style.width = Math.min(100, i * 25) + '%'; $('#divSendMsg').textContent = `Building PDF ${fileName} … (poll ${i})`;
      if (i < 4) return setTimeout(poll, 400);
      $('#divSendMsg').textContent = 'OK! PDF ready.';
      rings.filter(r => r.isEnabled === 1).forEach(r => { r.pdfHistory = r.pdfHistory || []; r.pdfHistory.push({ fileName, date: DB.today(), by: DB.USER, isRetail: isRetail ? 1 : 0 }); DB.saveRing(r); });
      CBR_PDFsend(fileName, isRetail, isNot4Send, rings);
    };
    setTimeout(poll, 300);
  }
  function CBR_PDFsend(fileName, isRetail, isNot4Send, rings) {
    const mail = EMAIL.build(quote, rings, { isRetail, fileName });
    if (isNot4Send) {
      $('#divSendProgress').classList.add('hidden');
      const box = UI.overlay('Email (copy to your mail client)', `<div id="divEmail2copy">${mail.html}</div>`, [
        { label: 'Copy', primary: true, onclick: () => { const r = document.createRange(); r.selectNodeContents(box.querySelector('#divEmail2copy')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); try { document.execCommand('copy'); UI.updBan('copied'); } catch (e) { alert('Copy failed'); } s.removeAllRanges(); } },
        { label: 'Close', onclick: UI.closeOverlay }], { width: '820px' });
      return;
    }
    quote.lastSent = DB.today(); DB.saveQuote(quote);
    UI.overlay('Email sent', `<p class="ok"><b>Thank you, email has been sent</b> to ${esc(emails.join('; '))} (simulated — nothing leaves the browser).</p>${mail.html}`, [{ label: 'OK', primary: true, onclick: () => location.reload() }], { width: '820px' });
  }
  $('#btnSend').onclick = () => CBR_createPDF(0, 0);
  $('#btnCopy').onclick = () => CBR_createPDF(0, 1);
  // CBR_copyForm(0,1) — the retail-priced variant is commented out in the live page; kept reachable via shift+click
  $('#btnCopy').addEventListener('click', e => { if (e.shiftKey) { e.stopImmediatePropagation(); CBR_createPDF(1, 1); } }, true);

  // refresh when the ring editor tab saves (window.opener.quoteCBRUpd(0,1) in the live system)
  window.quoteCBRUpd = (noReload, nocheck, newQuoteID) => { if (isDraft && newQuoteID) location.href = 'quote.html?quoteID=' + newQuoteID; else location.reload(); };
  window.addEventListener('storage', e => { if (e.key === 'bq_db_v1' && !document.querySelector('#divOverlay')) { if (isDraft) { const d = DB.draft(); if (!d) { const latest = DB.quotes().slice().sort((a, b) => b.quoteID - a.quoteID)[0]; if (latest) location.href = 'quote.html?quoteID=' + latest.quoteID; } } else location.reload(); } });
  renderRows();
})();
