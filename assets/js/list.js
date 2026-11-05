/* Quote list — stand-in for /_admin/quote.asp (two tabs, filters, paging, delete, preview, extension, export) */
(function () {
  const { $, $$, esc, money, el, qs, accountName, statusClass } = UI;
  UI.adminBar('Quotes');
  const viewCBR = qs('viewCBR') == null ? 0 : Number(qs('viewCBR'));
  $('#tab' + (viewCBR ? 'CBR' : 'Reg')).classList.add('on');
  const PAGE = 40;
  let page = 1, orderBy = { col: 'quoteID', dir: -1 };
  let companyFilterID = null;

  UI.smartSearch($('#company'), q => ACCOUNTS.search(q), a => a.name, a => { $('#company').value = a.name; companyFilterID = a.uaID; });
  $('#company').addEventListener('input', () => { companyFilterID = null; });

  function filters() {
    const f = $('#f');
    return { quoteID: UI.val(f, 'SM_val').trim(), CBRID: UI.val(f, 'CBRID').trim(), company: $('#company').value.trim().toLowerCase(), from: UI.val(f, 'dateQuotedFrom'), to: UI.val(f, 'dateQuotedTo'), viewConverted: UI.val(f, 'viewConverted'), viewExpired: UI.val(f, 'viewExpired') };
  }
  function rowsCBR() {
    const F = filters();
    return DB.quotes().filter(q => {
      if (F.quoteID && String(q.quoteID) !== F.quoteID) return false;
      if (F.CBRID && !DB.rings(q.quoteID).some(r => String(r.CBRID) === F.CBRID)) return false;
      if (companyFilterID && q.uaID !== companyFilterID) return false; else if (F.company && !accountName(q.uaID).toLowerCase().includes(F.company)) return false;
      if (F.from && q.dateQuoted < F.from) return false;
      if (F.to && q.dateQuoted > F.to) return false;
      if (!F.viewConverted && q.status === 'converted') return false;
      if (!F.viewExpired && DB.isExpired(q) && q.status !== 'converted') return false;
      return true;
    });
  }
  function rowsReg() {
    const F = filters();
    return DB.regularQuotes().filter(q => {
      if (F.quoteID && String(q.quoteID) !== F.quoteID) return false;
      if (F.company && !accountName(q.uaID).toLowerCase().includes(F.company)) return false;
      if (F.from && q.dateQuoted < F.from) return false;
      if (F.to && q.dateQuoted > F.to) return false;
      if (!F.viewConverted && q.status === 'converted') return false;
      if (!F.viewExpired && DB.isExpired(q) && q.status !== 'converted') return false;
      return true;
    });
  }
  function sortRows(rows) {
    const k = orderBy.col;
    return rows.slice().sort((a, b) => { const x = k === 'company' ? accountName(a.uaID) : a[k], y = k === 'company' ? accountName(b.uaID) : b[k]; return (x > y ? 1 : x < y ? -1 : 0) * orderBy.dir; });
  }
  function sortBy(col) { if (orderBy.col === col) orderBy.dir *= -1; else orderBy = { col, dir: 1 }; render(); }

  function render() {
    const all = sortRows(viewCBR ? rowsCBR() : rowsReg());
    const pages = Math.max(1, Math.ceil(all.length / PAGE));
    if (page > pages) page = pages;
    $('#pgSel').innerHTML = Array.from({ length: pages }, (_, i) => `<option value="${i + 1}"${i + 1 === page ? ' selected' : ''}>${i + 1}</option>`).join('');
    $('#pgInfo').textContent = `${all.length} quote${all.length === 1 ? '' : 's'} · page ${page} of ${pages}`;
    const rows = all.slice((page - 1) * PAGE, page * PAGE);
    const th = (label, col) => `<th class="sort" data-col="${col}">${label}${orderBy.col === col ? (orderBy.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`;
    let html;
    if (viewCBR) {
      html = `<table class="grid"><thead><tr><th><input type="checkbox" id="chkAll"></th>${th('Quote#', 'quoteID')}${th('Company name', 'company')}<th>User ID</th>${th('Start Date', 'dateQuoted')}${th('Last Sent', 'lastSent')}${th('Expiry date', 'expiry')}<th>Completed</th><th>Edit</th><th></th></tr></thead><tbody>`;
      rows.forEach(q => {
        const c = DB.quoteCompleted(q.quoteID);
        const bang = c.yes && c.missing.length ? `<span class="tooltip bang">!<span class="tip">${c.missing.map(m => `Ref# ${m.CBRID}<br>${m.items.map(esc).join('<br>')}`).join('<hr>')}</span></span>` : '';
        const exp = DB.isExpired(q) && q.status !== 'converted';
        html += `<tr class="${statusClass(q)}${exp ? ' expired' : ''}" data-id="${q.quoteID}">
          <td><input type="checkbox" class="sel" value="${q.quoteID}"></td>
          <td><a href="quote.html?quoteID=${q.quoteID}">${q.quoteID}</a>${q.isReplacement ? ' <span class="badge">Replacement</span>' : ''}${q.isRepair ? ' <span class="badge">Repair</span>' : ''}</td>
          <td>${esc(accountName(q.uaID))} <span class="muted">(${esc(q.ctName)})</span></td>
          <td>${esc(q.userID)}</td><td>${q.dateQuoted}</td><td>${q.lastSent || ''}</td>
          <td>${q.expiry}${exp ? ' <span class="danger small">expired</span> <a class="action small" data-act="extend">+15 days</a>' : ''}</td>
          <td>${c.yes ? '<span class="badge yes">YES</span>' : '<span class="badge no">NO</span>'}${bang}</td>
          <td><a href="quote.html?quoteID=${q.quoteID}">Edit</a> · <a class="action" data-act="previewCBR">Preview</a></td>
          <td><a class="action danger" data-act="delete" title="Delete">✕</a></td></tr>`;
      });
    } else {
      html = `<table class="grid"><thead><tr><th><input type="checkbox" id="chkAll"></th>${th('Quote#', 'quoteID')}${th('Company name', 'company')}<th>User ID</th>${th('Date quoted', 'dateQuoted')}${th('Expiry date', 'expiry')}<th>Edit</th><th>Preview</th><th></th></tr></thead><tbody>`;
      rows.forEach(q => {
        const exp = DB.isExpired(q) && q.status !== 'converted';
        html += `<tr class="${statusClass(q)}${exp ? ' expired' : ''}" data-id="${q.quoteID}"><td><input type="checkbox" class="sel" value="${q.quoteID}"></td>
          <td>${q.quoteID}</td><td>${esc(accountName(q.uaID))} <span class="muted">(${esc(q.endCustomer)})</span></td><td>${esc(q.userID)}</td><td>${q.dateQuoted}</td>
          <td>${q.expiry}${exp ? ' <span class="danger small">expired</span>' : ''}</td>
          <td><a href="quoteEdit.html?quoteID=${q.quoteID}">Edit</a></td><td><a class="action" data-act="previewReg">Preview</a></td><td><a class="action danger" data-act="deleteReg">✕</a></td></tr>`;
      });
    }
    html += '</tbody></table>';
    if (!rows.length) html += '<p class="muted">No quotes match the current filters.</p>';
    $('#divList').innerHTML = html;
    $$('#divList th.sort').forEach(h => h.onclick = () => sortBy(h.dataset.col));
    const all_ = $('#chkAll'); if (all_) all_.onchange = () => $$('.sel').forEach(c => { c.checked = all_.checked; });
    $$('#divList a.action').forEach(a => a.onclick = () => action(a.dataset.act, Number(a.closest('tr').dataset.id)));
  }

  function action(act, id) {
    if (act === 'delete') { if (confirm('Are you sure you want to delete quote ' + id + '?')) { DB.deleteQuote(id); render(); } }
    else if (act === 'deleteReg') { alert('Regular quotes are read-only in this POC (flow not captured yet).'); }
    else if (act === 'extend') { DB.extendQuote(id); render(); }
    else if (act === 'previewCBR') { const rings = DB.rings(id); if (!rings.length) return alert('This quote has no ring yet.'); window.open('summary.html?CBRUID=' + rings[0].CBRUID, '_blank'); }
    else if (act === 'previewReg') { UI.overlay('Quote preview (regular)', '<p class="muted">The regular quote preview (quote_act.asp act=previewQuote) was not captured in the walkthrough. See docs/Quote-System-Map.md → "Still to capture".</p>'); }
  }

  // Billing overlay → creates the draft quote (bridalQuote_add)
  function bridalQuote_add() {
    const box = UI.overlay('Billing', `
      <table class="form">
        <tr><td class="lbl req">Company</td><td><div id="td_FilterCompany"><input type="hidden" name="uaID"><input type="text" name="SM_val" id="SM_val" style="width:320px" placeholder="Enter Company Name here"></div></td></tr>
      </table>
      <div id="divAfter" class="hidden">
        <table class="form">
          <tr><td class="lbl">Shipping</td><td><select name="shippingID" style="min-width:320px"></select></td></tr>
          <tr><td class="lbl req">Contact Name</td><td><input type="text" name="ctName" maxlength="50" style="width:320px"></td></tr>
          <tr><td class="lbl req">Contact Email / Send quote to</td><td><select name="emailPick" style="min-width:250px"></select> <button type="button" class="small" id="btnAddEmail">Add</button><div id="divNotifEmailList" class="small" style="margin-top:4px"></div><input type="hidden" name="ctEmails"></td></tr>
        </table>
      </div>`, [
      { label: 'Create', primary: true, onclick: validForm },
      { label: 'Close', onclick: UI.closeOverlay }
    ], { width: '640px' });
    const createBtn = box.querySelector('.ov-f button.primary'); createBtn.style.display = 'none';
    const emails = [];
    const renderEmails = () => { box.querySelector('#divNotifEmailList').innerHTML = emails.map((e, i) => `<span class="badge">${esc(e)} <a class="action" data-i="${i}">✕</a></span> `).join(''); box.querySelector('[name=ctEmails]').value = emails.join(';'); box.querySelectorAll('#divNotifEmailList a').forEach(a => a.onclick = () => { emails.splice(Number(a.dataset.i), 1); renderEmails(); }); };
    UI.smartSearch(box.querySelector('#SM_val'), q => ACCOUNTS.search(q), a => a.name, a => {
      box.querySelector('#SM_val').value = a.name; box.querySelector('[name=uaID]').value = a.uaID;
      box.querySelector('[name=shippingID]').innerHTML = '<option value="0"></option>' + a.shipping.map(s => `<option value="${s.shippingID}">${esc(s.address)}</option>`).join('');
      box.querySelector('[name=emailPick]').innerHTML = '<option value=""></option>' + a.emails.map(e => `<option value="${esc(e)}">${esc(e)}</option>`).join('');
      box.querySelector('#divAfter').classList.remove('hidden'); createBtn.style.display = '';
    });
    box.querySelector('[name=emailPick]').onchange = e => { const v = e.target.value.trim(); if (v && !emails.includes(v)) { emails.push(v); renderEmails(); } };
    box.querySelector('#btnAddEmail').onclick = () => { const v = prompt('Email address to add to this account:'); if (!v) return; if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]{2,}[.][a-zA-Z]{2,}$/.test(v)) return alert('Please enter a valid email'); emails.push(v); renderEmails(); const a = ACCOUNTS.byID(box.querySelector('[name=uaID]').value); if (a && !a.emails.includes(v)) a.emails.push(v); };
    function validForm() {
      const uaID = Number(box.querySelector('[name=uaID]').value); const ctName = box.querySelector('[name=ctName]').value.trim();
      if (!uaID) return alert('Please select a company');
      if (!ctName) return alert('Contact Name is required');
      if (!emails.length) return alert('Contact Email is required');
      DB.setDraft({ uaID, shippingID: Number(box.querySelector('[name=shippingID]').value) || 0, ctName, ctEmails: emails.slice(), comments: '', isCommIncludEmail: 1, internalComments: '' });
      location.href = 'quote.html?quoteID=0';
    }
  }

  $('#lnkAddCBR').onclick = e => { e.preventDefault(); bridalQuote_add(); };
  $('#btnOk').onclick = () => { page = 1; render(); };
  $('#btnReset').onclick = () => { $('#f').reset(); companyFilterID = null; page = 1; render(); };
  $('#pgSel').onchange = e => { page = Number(e.target.value); render(); };
  $('#pgNext').onclick = () => { page++; render(); };
  $('#btnExport').onclick = () => {
    const ids = $$('.sel:checked').map(c => Number(c.value)); if (!ids.length) return alert('Select at least one quote to export');
    const lines = [['Quote#', 'Company', 'Contact', 'Start Date', 'Last Sent', 'Expiry', 'Status', 'Ref#', 'SKU', 'Ring name', 'Metal', 'Colour', 'Size', 'Qty', 'Lock USD', 'Sell USD', 'Sell CAD', 'Completed']];
    ids.forEach(id => { const q = DB.quote(id); DB.rings(id).forEach(r => { const p = PRODUCTS.byPID(r.PID); lines.push([q.quoteID, accountName(q.uaID), q.ctName, q.dateQuoted, q.lastSent || '', q.expiry, q.status, r.CBRID, p ? p.sku + '-C' : '', r.ringName, LK.name(LK.karats, r.karatID), LK.name(LK.colours, r.colourID), r.ringSize, r.qty, r.lockPriceUSD, r.priceUSD, r.priceCAD, r.status ? 'YES' : 'NO']); }); });
    const csv = lines.map(l => l.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = el('a', { href: 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv), download: 'bridal_quotes_export.csv' }); document.body.appendChild(a); a.click(); a.remove();
  };
  window.addEventListener('storage', e => { if (e.key === 'bq_db_v1') location.reload(); });
  render();
})();
