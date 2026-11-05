/* Custom Bridal ring editor — stand-in for /_admin/quote_customBridal.asp
 * Section order, fields and defaults follow the loadingStep state machine of the live page (see docs/walkthrough-captures.md, Screen 04).
 * All pricing math is in pricing.js; this file only renders sections, binds inputs to the ring record and saves it in one go. */
(function () {
  const { $, $$, esc, money, n2, el, options, qs } = UI;
  const quoteID = Number(qs('quoteID') || 0), CBRID0 = Number(qs('CBRID') || 0);
  const quote = quoteID ? DB.quote(quoteID) : (DB.draft() ? Object.assign({ quoteID: 0 }, DB.draft()) : null);
  if (!quote) { alert('No quote in progress — start from the quote list.'); location.href = 'index.html?viewCBR=1'; return; }
  const acc = ACCOUNTS.byID(quote.uaID);
  const R = DB.rates();
  let ring = CBRID0 ? DB.ring(CBRID0) : null;
  if (CBRID0 && !ring) { alert('Ring ' + CBRID0 + ' not found'); location.href = 'quote.html?quoteID=' + quoteID; return; }
  let original = ring ? DB.clone(ring) : null;
  UI.adminBar('Custom Bridal', { editor: true });
  $('#accName').textContent = acc ? acc.name : '';
  $('#spQuoteID').textContent = quote.quoteID; $('#spCBRID').textContent = ring ? ring.CBRID : 0;
  $('#lnkViewAs').onclick = e => { if (!ring || !ring.CBRID) { e.preventDefault(); alert('Save the ring first to preview it as the retailer sees it.'); } };
  if (ring && ring.CBRID) $('#lnkViewAs').href = 'summary.html?CBRUID=' + ring.CBRUID;
  $('#btnQuotePreview').onclick = () => { if (!ring || !ring.CBRID) return alert('Save the ring first.'); window.open('summary.html?CBRUID=' + ring.CBRUID, '_blank'); };
  $('#btnJobBag').onclick = () => { if (!ring || !ring.CBRID) return alert('Save the ring first.'); window.open('jobbag.html?CBRID=' + ring.CBRID, '_blank'); };
  const f = $('#f');
  f.ringName.addEventListener('change', () => { if (ring) ring.ringName = f.ringName.value; });

  // ---------- helpers ----------
  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  const setPath = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); const t = ks.reduce((a, k) => (a[k] == null ? (a[k] = {}) : a[k]), o); t[last] = v; };
  function sec(id, title, cls, opts) {
    opts = opts || {};
    const s = el('div', { class: 'section ' + (cls || ''), id });
    s.innerHTML = `<div class="sec-h"><span>${title}</span>${opts.plus ? `<span class="ico plus" id="${opts.plus}" title="${opts.plusTitle || 'add'}"></span>` : ''}${opts.sub ? `<span class="sub">${opts.sub}</span>` : ''}</div><div class="sec-b"></div>`;
    return s;
  }
  const body = s => s.querySelector('.sec-b');
  const inp = (path, type, attrs) => `<input type="${type === 'chk' ? 'checkbox' : type === 'num' ? 'number' : 'text'}" data-bind="${path}" data-type="${type}" ${attrs || ''} ${type === 'num' ? 'step="any"' : ''}>`;
  const sel = (path, list, extra, opts, type) => `<select data-bind="${path}" data-type="${type || 'num'}" ${extra || ''}>${options(list, getPath(ring, path), opts)}</select>`;
  function hydrate(root) { // write current ring values into bound inputs, then listen
    $$('[data-bind]', root).forEach(e => {
      const v = getPath(ring, e.dataset.bind);
      if (e.type === 'checkbox') e.checked = !!Number(v); else if (e.tagName === 'SELECT') { if (v != null) e.value = String(v); } else e.value = v == null ? (e.getAttribute('value') || '') : v;
      if (e._bound) return; e._bound = true;
      e.addEventListener('change', () => {
        let nv = e.type === 'checkbox' ? (e.checked ? 1 : 0) : e.value;
        if (e.dataset.type === 'num' && nv !== '') nv = Number(nv);
        setPath(ring, e.dataset.bind, nv);
        onChange(e.dataset.bind, nv, e);
        recalc();
      });
    });
  }
  function onChange(path, v, e) {
    if (path === 'gold.karatID') { const k = LK.rec(LK.karats, v); ring.gold.rate = window.metalRatePerGram(k, R); ring.gold.loss = k ? k.loss : 12; hydrate($('#divGoldCharge')); const gr = $('[data-calc="goldRate"]'); if (gr) gr.textContent = n2(ring.gold.rate); }
    if (path === 'scsi.settingChargeID') { const c = LK.rec(LK.settingCharges, v); ring.scsi.settingCost = c && c.cost != null ? c.cost : ring.scsi.settingCost; const ci = $('[data-bind="scsi.settingCost"]'); if (ci) { ci.readOnly = !(c && c.cost == null); } hydrate($('#divSettingCenterStoneInfo')); }
    if (path === 'scsi.sendStone4Setting') $('#divSCSIDetails').classList.toggle('hidden', Number(v) !== 1);
    if (path === 'ads.settingChargeID') { const c = LK.rec(LK.settingCharges, v); ring.ads.settingCost = c && c.cost != null ? c.cost : ring.ads.settingCost; hydrate($('#divAddlDiamondSettingDetails')); }
    if (path === 'ads.sendStone4Setting') $('#divADSDetails').classList.toggle('hidden', Number(v) !== 1);
    if (path === 'otherFee.cadPrintFeeID') { const c = LK.rec(LK.cadPrintFees, v); ring.otherFee.cost = c ? c.cost : 0; hydrate($('#divOtherFeeSection')); }
    if (path === 'cdi.stoneProvider') renderCDI();
    if (path === 'cdi.sizeID') { const s = LK.rec(LK.diamondSizes, v); if (s && s.weight) ring.cdi.DW = s.weight; ring.cdi.pricePerCarat = LK.pricePerCarat(ring.cdi.psID, s); ring.cdi.stoneCost = ''; hydrate($('#divCenterDiamondInfo')); }
    if (path === 'cdi.psID') { ring.cdi.pricePerCarat = LK.pricePerCarat(v, LK.rec(LK.diamondSizes, ring.cdi.sizeID)); ring.cdi.stoneCost = ''; const pc = $('[data-bind="cdi.ps_custom"]'); if (pc) pc.parentElement.classList.toggle('hidden', Number(v) !== LK.QUALITY_CUSTOM); hydrate($('#divCenterDiamondInfo')); }
    if (path === 'cdi.DW' || path === 'cdi.pricePerCarat' || path === 'cdi.qty') { ring.cdi.stoneCost = ''; }
    if (path === 'request.isPhoto') $('#divRequestZones').classList.toggle('hidden', Number(v) !== 1);
    if (path === 'design.needsApproval') $('#divDesignDetails').classList.toggle('hidden', Number(v) !== 1);
    if (path === 'matchBand.is') $('#divMBDetails').classList.toggle('hidden', Number(v) !== 1);
    if (path === 'isFinalPrice0' || path === 'exchangeRate' || path === 'tarif' || path === 'discount') { /* totals only */ }
    const m = path.match(/^side\.(\d+)\.(\w+)$/);
    if (m) { const g = ring.side[m[1]]; if (m[2] === 'psID' || m[2] === 'sizeID') g.pricePerCarat = LK.pricePerCarat(g.psID, LK.rec(LK.diamondSizes, g.sizeID)); if (m[2] === 'qty') { /* setting rows keep their own qty (live behaviour); placement list is rebuilt */ renderSide(); } else if (m[2] === 'psID') renderSide(); }
    const ms = path.match(/^side\.(\d+)\.settings\.(\d+)\.(\w+)$/);
    if (ms) { const s = ring.side[ms[1]].settings[ms[2]]; if (ms[3] === 'settingStyleID') { const st = LK.rec(LK.settingStyles, s.settingStyleID); if (st && st.cost != null) s.settingCost = st.cost; } renderSide(); }
    const ma = path.match(/^addl\.(\d+)\.(\w+)$/);
    if (ma) { const b = ring.addl[ma[1]]; if (ma[2] === 'sizeID') { const s = LK.rec(LK.diamondSizes, b.sizeID); if (s && s.weight) b.DW = s.weight; } if (['sizeID', 'psID'].includes(ma[2])) { b.pricePerCarat = LK.pricePerCarat(b.psID, LK.rec(LK.diamondSizes, b.sizeID)); b.stoneCost = ''; } if (['DW', 'pricePerCarat', 'qty'].includes(ma[2])) b.stoneCost = ''; if (['stoneProvider', 'sizeID', 'psID'].includes(ma[2])) renderAddl(); else hydrate($('#divAddlDiamond')); }
  }

  // ---------- style block (#divBlockImg1) ----------
  UI.smartSearch($('#style1'), PRODUCTS.searchStyles, s => s, style => {
    $('#style1').value = style;
    const skus = PRODUCTS.skusOfStyle(style);
    f.PID.innerHTML = skus.map(p => `<option value="${p.PID}" data-img="${esc(p.img)}" data-altimg="${esc(p.altimg || '')}">${esc(p.sku)}</option>`).join('');
    $('#divSKU').classList.remove('hidden');
  });
  $('#btnValidSKU').onclick = validSKU;
  function validSKU() {
    const p = PRODUCTS.byPID(f.PID.value); if (!p) return alert('Please pick a SKU');
    const prev = ring;
    ring = DB.newRingFromProduct(p, quote.quoteID, R); ring.ringName = f.ringName.value;
    if (prev && prev.CBRID) { Object.assign(ring, { CBRID: prev.CBRID, CBRUID: prev.CBRUID, note: prev.note, adminNote: prev.adminNote, ntrnlNotes: prev.ntrnlNotes, renderings: prev.renderings, pdfHistory: prev.pdfHistory, log: prev.log, custom: prev.custom }); } else original = null;
    renderStyleBlock(); loadSections();
  }
  $('#lnkChangeSKU').onclick = () => {
    if (ring && ring.CBRID && !confirm('Changing the SKU reloads every section from the new costing sheet. Continue?')) return;
    $('#divBlockImg1').classList.remove('ok'); $('#style1').readOnly = false; $('#style1').value = ''; f.PID.disabled = false; $('#divSKU').classList.add('hidden'); $('#lnkChangeSKU').classList.add('hidden'); $('#divStyleDetails').classList.add('hidden'); $('#divSizeRow').classList.add('hidden');
    $('#divGblContent').innerHTML = ''; $('#style1').focus();
  };
  function renderStyleBlock() {
    const p = PRODUCTS.byPID(ring.PID);
    $('#divBlockImg1').classList.add('ok');
    $('#style1').value = p.style; $('#style1').readOnly = true;
    f.PID.innerHTML = `<option value="${p.PID}">${esc(p.sku)}</option>`; f.PID.disabled = true; $('#divSKU').classList.remove('hidden'); $('#lnkChangeSKU').classList.remove('hidden');
    $('#divStyleDetails').classList.remove('hidden'); $('#divSizeRow').classList.remove('hidden');
    $('#metalBlock').innerHTML = `<b>Metal</b>: ${esc(LK.name(LK.karats, ring.karatID))}<br><b>Color</b>: ${esc(LK.name(LK.colours, ring.colourID))}<br><b>Width</b>: ${esc(ring.ringMM)}<br><b>Thickness</b>: ${esc(ring.thickness)}<br><b>Thickness Bottom</b>: ${esc(ring.thicknessBottom)}`;
    const sizeRec = LK.ringSizes.find(s => s.value != null ? s.value === Number(ring.ringSize) : (Number(ring.ringSize) <= 0 && s.id === Number(ring.ringSize)));
    f.ringSize.innerHTML = options(LK.ringSizes, sizeRec ? sizeRec.id : -1);
    f.ringSize.onchange = () => { const s = LK.rec(LK.ringSizes, f.ringSize.value); ring.ringSize = s.value != null ? s.value : s.id; recalc(); };
    f.finishingID.innerHTML = options(LK.finishings, ring.finishingID); f.finishingID.onchange = () => { ring.finishingID = Number(f.finishingID.value); };
    $('#divProdImgs').innerHTML = ['side', 'top', 'persp', 'stack'].map(v => `<img src="${PRODUCTS.img(p, v)}" data-fallback="${PRODUCTS.placeholder(p, v)}" onerror="if(this.src!==this.dataset.fallback)this.src=this.dataset.fallback" alt="" title="${esc(PRODUCTS.img(p, v))}">`).join('');
    f.ringName.value = ring.ringName || '';
  }
  $('#metalBlock').onclick = () => {
    const box = UI.overlay('Ring Details', `<table class="form">
      <tr><td class="lbl">Metal</td><td><select name="ringKaratID">${options(LK.karats, ring.karatID)}</select></td></tr>
      <tr><td class="lbl">Color</td><td><select name="ringColourID">${options(LK.colours, ring.colourID)}</select></td></tr>
      <tr><td class="lbl">Width (mm)</td><td><input type="number" step="any" name="ringMM" class="num" value="${esc(ring.ringMM)}"></td></tr>
      <tr><td class="lbl">Thickness</td><td><input type="number" step="any" name="thickness" class="num" value="${esc(ring.thickness)}"></td></tr>
      <tr><td class="lbl">Thickness Bottom</td><td><input type="number" step="any" name="thicknessBottom" class="num" value="${esc(ring.thicknessBottom)}"></td></tr></table>
`, [
      { label: 'Save', primary: true, onclick: () => { ring.karatID = UI.num(box, 'ringKaratID'); ring.colourID = UI.num(box, 'ringColourID'); ring.ringMM = UI.num(box, 'ringMM'); ring.thickness = UI.num(box, 'thickness'); ring.thicknessBottom = UI.num(box, 'thicknessBottom'); ring.isUpd = 1; UI.closeOverlay(); renderStyleBlock(); } },
      { label: 'Cancel', onclick: UI.closeOverlay }]);
  };

  // ---------- sections ----------
  const STEPS = [
    ['0.5', 'loadCustom', secCustom], ['1', 'loadCenterDiamondInfo', secCDI], ['2', 'loadSettingCenterStoneInfo', secSCSI], ['4', 'loadRequest', secRequest],
    ['5', 'loadGoldCharge', secGold], ['6', 'loadLaborCharge', secLabor], ['7', 'loadSideDiamond', secSide], ['8', 'loadAddlDiamond', secAddl],
    ['9', 'loadXtraBlock1', secXtra], ['11', 'loadOtherFeeSection', secOtherFee], ['11', 'loadTotals', secTotals], ['11.5', 'viewer links', secLinks],
    ['12', 'loadRendringSection', secRendering], ['13', 'loadPDFHistory', secPDF], ['14', 'notes', secNotes], ['14.5', 'admin note', secAdminNote],
    ['15', 'loadMatchBand', secMatchBand], ['16', 'production notes', secNtrnl], ['50', 'buttons', secBtns]
  ];
  function loadSections() {
    const c = $('#divGblContent'); c.innerHTML = '';
    let i = 0;
    const next = () => {
      if (i >= STEPS.length) { f.loadingStep.value = '50'; $('#divLoadState').textContent = ''; recalc(); return; }
      const [step, act, fn] = STEPS[i++]; f.loadingStep.value = step; $('#divLoadState').textContent = `loading… step ${step} (${act})`;
      const s = fn(); if (s) { c.appendChild(s); hydrate(s); }
      setTimeout(next, 25);
    };
    next();
  }

  // CUSTOMIZE
  function secCustom() {
    const s = sec('divCustom', '', 'plain');
    s.querySelector('.sec-h').remove();
    body(s).innerHTML = `<div style="margin:0 0 8px"><b>Customize</b> <select id="selModelType"><option value="">Choose Section</option>${options(LK.modelTypes, '')}</select></div><div id="divCustomBlocks"></div>`;
    s.querySelector('#selModelType').onchange = () => { const mt = Number(s.querySelector('#selModelType').value); if (!mt) return; ring.custom.push({ ID: DB.nextCustomID(), modelTypeID: mt, style: '', PID: 0, isPIDImgMain: 0, isPIDImgAlt: 0, img: '', modifIDs: [], karatID: 0, colourID: 0, notes: '' }); s.querySelector('#selModelType').value = ''; renderCustom(); };
    setTimeout(renderCustom, 0);
    return s;
  }
  function renderCustom() {
    const c = $('#divCustomBlocks'); if (!c) return; c.innerHTML = '';
    ring.custom.forEach((b, i) => {
      const d = el('div', { class: 'custom-block' });
      d.innerHTML = `<div class="cb-h"><span>${esc(LK.name(LK.modelTypes, b.modelTypeID))}</span><span class="rm" title="Remove block">del</span></div>
        <div class="inline"><input type="text" class="cstyle hmSearchField" value="${esc(b.style)}" placeholder="Enter style#">
          <select class="cpid"><option value="0"></option>${b.style ? PRODUCTS.skusOfStyle(b.style).map(p => `<option value="${p.PID}"${p.PID === b.PID ? ' selected' : ''}>${esc(p.sku)}</option>`).join('') : ''}</select>
          <select class="ckarat"><option value="0">Metal</option>${options(LK.karats, b.karatID)}</select>
          <select class="ccolour"><option value="0">Color</option>${options(LK.colours, b.colourID)}</select>
          <label><input type="checkbox" class="cmain"${b.isPIDImgMain ? ' checked' : ''}> main image</label><label><input type="checkbox" class="calt"${b.isPIDImgAlt ? ' checked' : ''}> alt image</label></div>
        <div class="modifs">${[0, 1, 2, 3].map(k => { const m = LK.rec(LK.modifications, b.modifIDs[k]); return `<select class="cmodif" data-k="${k}"><option value="0">Select Modification</option>${options(LK.modifications, b.modifIDs[k] || 0)}</select>${m ? `<img src="${m.img}" alt="" onerror="this.style.display='none'">` : ''}`; }).join('')}</div>
        <textarea class="cnotes" placeholder="Enter notes">${esc(b.notes)}</textarea>
        <div class="dropzone cimg">${b.img ? `<img src="${b.img}">` : ''}Drop image here${b.img ? ' <button type="button" class="crm">remove</button>' : ''}</div>`;
      d.querySelector('.rm').onclick = () => { if (confirm('Remove this customization block?')) { ring.custom.splice(i, 1); renderCustom(); } };
      UI.smartSearch(d.querySelector('.cstyle'), PRODUCTS.searchStyles, x => x, style => { b.style = style; b.PID = 0; renderCustom(); });
      d.querySelector('.cpid').onchange = e => { b.PID = Number(e.target.value); };
      d.querySelector('.ckarat').onchange = e => { b.karatID = Number(e.target.value); };
      d.querySelector('.ccolour').onchange = e => { b.colourID = Number(e.target.value); };
      d.querySelector('.cmain').onchange = e => { b.isPIDImgMain = e.target.checked ? 1 : 0; };
      d.querySelector('.calt').onchange = e => { b.isPIDImgAlt = e.target.checked ? 1 : 0; };
      d.querySelectorAll('.cmodif').forEach(se => se.onchange = () => { b.modifIDs[Number(se.dataset.k)] = Number(se.value); renderCustom(); });
      d.querySelector('.cnotes').onchange = e => { b.notes = e.target.value; };
      UI.dropzone(d.querySelector('.cimg'), src => { b.img = src; renderCustom(); });
      const rm = d.querySelector('.crm'); if (rm) rm.onclick = e => { e.stopPropagation(); b.img = ''; renderCustom(); };
      c.appendChild(d);
    });
  }

  // CENTER DIAMOND INFO
  function secCDI() { const s = sec('divCenterDiamondInfo', 'CENTER DIAMOND INFO', 'pink'); setTimeout(renderCDI, 0); return s; }
  function renderCDI() {
    const s = $('#divCenterDiamondInfo'); if (!s) return;
    const prov = ring.cdi.stoneProvider;
    s.classList.toggle('pink', prov === 'Customer'); s.classList.toggle('blue', prov === 'Crownring');
    body(s).innerHTML = `<div class="inline">
        <label>Stone Provider ${sel('cdi.stoneProvider', LK.stoneProviders.center, '', null, 'str')}</label>
        <label>Stone Category ${sel('cdi.stoneCatID', LK.stoneCategories)}</label>
        <label>Stone Type ${sel('cdi.stoneTypeID', LK.stoneTypes)}</label>
        <label>Stone Kind ${sel('cdi.stoneKindID', LK.stoneKinds)}</label>
        <label>Shape ${sel('cdi.shapeID', LK.shapes)}</label>
        <label>Notes ${inp('cdi.notes', 'str', 'maxlength="50" style="width:120px"')}</label>
        <label>Stone Dimensions <span class="nowrap">${inp('cdi.L', 'num', 'class="short"')} x ${inp('cdi.W', 'num', 'class="short"')} x ${inp('cdi.D', 'num', 'class="short"')}</span></label>
        <label>D.W <span class="nowrap">${inp('cdi.DW', 'num', 'class="short"')} ct</span></label>
        <label style="margin-left:auto">Pending ${inp('cdi.isPending', 'chk')}</label></div>
      <div id="divAddlInfo" class="${prov === 'Crownring' ? '' : 'hidden'}" style="margin-top:4px;padding-top:4px;border-top:1px solid #ccc">
        <div class="inline">
          <label>Size ${sel('cdi.sizeID', [{ id: '', name: '—' }].concat(LK.diamondSizes), '', null, 'str')}</label>
          <label>Qty ${inp('cdi.qty', 'num', 'class="short"')}</label>
          <label>Quality ${sel('cdi.psID', LK.qualities.concat([{ id: LK.QUALITY_CUSTOM, name: 'Custom…' }]))}</label>
          <label class="${Number(ring.cdi.psID) === LK.QUALITY_CUSTOM ? '' : 'hidden'}">Custom quality ${inp('cdi.ps_custom', 'str', 'style="width:120px"')}</label>
          <label>Colour ${sel('cdi.colourID', LK.stoneColours)}</label>
          <label>Price per Ct ${inp('cdi.pricePerCarat', 'num', 'class="num"')}</label>
          <label>Cert ${sel('cdi.certID', LK.certs)}</label>
          <label>Stone Cost ${inp('cdi.stoneCost', 'num', 'class="num" placeholder="auto"')}</label></div>
        <div style="margin:4px 5px"><label>Additional notes <input type="text" data-bind="cdi.addlNotes" data-type="str" style="width:60%"></label></div></div>`;
    hydrate(s);
  }

  // SETTING CENTER STONE INFO
  function secSCSI() {
    const s = sec('divSettingCenterStoneInfo', 'SETTING CENTER STONE INFO', 'pink');
    const charge = LK.rec(LK.settingCharges, ring.scsi.settingChargeID);
    body(s).innerHTML = `<div class="inline"><span class="lbl">SENDING STONE FOR SETTING?
        <input type="radio" name="SCSI_send" value="1"> YES <input type="radio" name="SCSI_send" value="0"> NO <input type="radio" name="SCSI_send" value="-1"> PENDING</span>
      <span id="divSCSIDetails" class="inline ${Number(ring.scsi.sendStone4Setting) === 1 ? '' : 'hidden'}" style="margin-left:auto;padding:0">
        <label>Contact Name ${inp('scsi.contactName', 'str', 'maxlength="50"')}</label>
        <label>Setting Charge ${sel('scsi.settingChargeID', LK.settingCharges, '', null, 'str')}</label>
        <label>Notes <span class="ico edit" id="btnSCSINotes" title="${esc(ring.scsi.notes || 'notes')}"></span></label>
        <label><span class="danger">Setting Cost</span> ${inp('scsi.settingCost', 'num', `class="short"${charge && charge.cost == null ? '' : ' readonly'}`)}</label>
        <label>Pending ${inp('scsi.isPending', 'chk')}</label></span></div>`;
    s.querySelectorAll('[name=SCSI_send]').forEach(r => { r.checked = Number(r.value) === Number(ring.scsi.sendStone4Setting); r.onchange = () => { ring.scsi.sendStone4Setting = Number(r.value); onChange('scsi.sendStone4Setting', ring.scsi.sendStone4Setting); recalc(); }; });
    s.querySelector('#btnSCSINotes').onclick = () => { const box = UI.overlay('Setting notes', `<textarea rows="5" style="width:100%">${esc(ring.scsi.notes)}</textarea>`, [{ label: 'Save', primary: true, onclick: () => { ring.scsi.notes = box.querySelector('textarea').value; UI.closeOverlay(); s.querySelector('#btnSCSINotes').title = ring.scsi.notes || 'notes'; } }, { label: 'Cancel', onclick: UI.closeOverlay }]); };
    return s;
  }

  // FANCY CENTER STONE PICTURE REQUIRED
  function secRequest() {
    const s = sec('divRequest', 'FANCY CENTER STONE PICTURE REQUIRED', 'grey');
    body(s).innerHTML = `<div class="inline"><span class="lbl">Production is Requesting to see a Photo of the center stone before starting on the cad file:
        <input type="radio" name="isRequest_photo" value="0"> No <input type="radio" name="isRequest_photo" value="1"> Yes</span> <a class="action" id="lnkExample" style="color:#5b73f5;align-self:center">See Example</a></div>
      <div id="divRequestZones" class="${Number(ring.request.isPhoto) === 1 ? '' : 'hidden'}" style="padding:5px">
        <div style="display:grid;grid-template-columns:150px 150px;gap:10px"><div class="dropzone" id="divDD1"></div><div class="dropzone" id="divDD2"></div></div>
        <div class="inline"><label>Photos validated ${inp('request.validated', 'chk')}</label><label>Show in client preview ${inp('request.showClientPreview', 'chk')}</label></div></div>`;
    s.querySelectorAll('[name=isRequest_photo]').forEach(r => { r.checked = Number(r.value) === Number(ring.request.isPhoto); r.onchange = () => { ring.request.isPhoto = Number(r.value); onChange('request.isPhoto', ring.request.isPhoto); }; });
    [0, 1].forEach(i => { const z = s.querySelector('#divDD' + (i + 1)); const paint = () => { z.innerHTML = (ring.request.photos[i] ? `<img src="${ring.request.photos[i]}"><button type="button" class="small">remove</button> ` : '') + `Photo ${i + 1}: drop here or click`; const b = z.querySelector('button'); if (b) b.onclick = e => { e.stopPropagation(); ring.request.photos[i] = null; paint(); }; }; paint(); UI.dropzone(z, src => { ring.request.photos[i] = src; paint(); }); });
    s.querySelector('#lnkExample').onclick = () => UI.overlay('Example', '<p>Two clear photos of the loose stone (table up and side profile) on a plain background, with a ruler or gauge in frame.</p>');
    return s;
  }

  // GOLD CHARGE
  function secGold() {
    const s = sec('divGoldCharge', 'GOLD CHARGE', 'grey');
    body(s).innerHTML = `<div class="lab-row">
      <div>Karat ${sel('gold.karatID', LK.karats, 'style="width:180px"')}</div>
      <div>Gold Cost Per Gram <span data-calc="goldRate" title="rate per gram as of ${esc(R.asOf)} — live in the real system, editable on the settings page here" style="display:block;padding:6px 0">${n2(ring.gold.rate)}</span></div>
      <div>Finished Gram Weight <span>${inp('gold.weight', 'num', 'class="short"')} <span style="color:#5b73f5;font-size:10px">Estimated</span></span></div>
      <div>Gold Loss% ${inp('gold.loss', 'num', 'class="short"')}</div>
      <div>Extra charge Per Piece ${inp('gold.extra', 'num', 'class="short"')}</div>
      <div class="total"><span class="blueLbl">Total Gold Cost</span><input type="text" readonly data-calc="gold"></div></div>`;
    return s;
  }

  // LABOR CHARGE
  function secLabor() {
    const s = sec('divLaborCharge', 'LABOR CHARGE', 'grey');
    const fields = [['costingLabor', 'Casting Labor'], ['rhodium', 'Rhodium'], ['polishing', 'Polishing'], ['laserEngraving', 'Laser Engraving'], ['extra1', 'Extra 1'], ['extra2', 'Extra 2'], ['handEngra', 'Hand Engra.'], ['millgrain', 'Millgrain'], ['CADFee', 'CAD Fee'], ['chainFee', 'Chain'], ['giftBox', 'Gift Box'], ['SPIFF', 'SPIFF'], ['eagleClaw', 'Eagle Claw']];
    body(s).innerHTML = `<div class="lab-row" style="max-width:640px">${fields.map(([k, l]) => `<div>${l}${inp('labor.' + k, 'num')}</div>`).join('')}</div>
      <div class="lab-row" style="justify-content:flex-end"><div class="total"><span class="blueLbl">Total Labor Cost</span><input type="text" readonly data-calc="labor"></div></div>`;
    return s;
  }

  // SIDE DIAMOND INFO
  function secSide() {
    const s = sec('divSideDiamond', 'SIDE DIAMOND INFO', 'grey', { plus: 'btnAddSide', plusTitle: 'add a stone group' });
    body(s).innerHTML = `<div id="divSideGroups"></div>
      <div class="right" style="margin:6px 10px 2px">Qty:<span data-calc="side.qty"></span> &nbsp; <span data-calc="side.DW"></span> &nbsp;&nbsp;&nbsp; Side Diamonds Total Cost: $<span data-calc="side.cost"></span></div>`;
    s.querySelector('#btnAddSide').onclick = () => { const size = LK.diamondSizeByMM(0.9); ring.side.push({ sdID: Date.now() % 100000, provider: 'Crownring', stoneCatID: 1, stoneTypeID: 1, stoneKindID: 0, psID: 10, colourID: 36, shapeID: 1, sizeID: size.id, qty: 1, pricePerCarat: LK.pricePerCarat(10, size), settings: [{ sdsID: 1, qty: 1, settingStyleID: 0, settingLocationID: 0, settingCost: 1 }] }); renderSide(); };
    setTimeout(renderSide, 0);
    return s;
  }
  function renderSide() {
    const c = $('#divSideGroups'); if (!c) return; c.innerHTML = '';
    const markup = ring.SD_markup != null ? ring.SD_markup : R.markups.side;
    ring.side.forEach((g, i) => {
      const calc = PRICING.sideGroup(g);
      const d = el('div', { class: 'sd-group' });
      const p = 'side.' + i + '.';
      d.innerHTML = `<div class="sd-b"><div style="display:flex;align-items:flex-end"><div style="font-size:17px;padding:5px 8px">${i + 1}</div>
        <div class="inline">
          <label>Provider ${sel(p + 'provider', LK.stoneProviders.side, '', null, 'str')}</label>
          <label>Cat. ${sel(p + 'stoneCatID', LK.stoneCategories)}</label>
          <label>Stone Type ${sel(p + 'stoneTypeID', LK.stoneTypesSide)}</label>
          <label>Kind ${sel(p + 'stoneKindID', LK.stoneKinds)}</label>
          <label>Quality ${sel(p + 'psID', LK.qualities)}</label>
          <label>Colour ${sel(p + 'colourID', LK.stoneColours)}</label>
          <label>Shape ${sel(p + 'shapeID', LK.sideShapes)}</label>
          <label>Dia. Size ${sel(p + 'sizeID', LK.diamondSizes, '', null, 'str')}</label>
          <label>Single Dia. W <input type="text" readonly class="short" value="${calc.singleWeight}"></label>
          <label>Qty ${inp(p + 'qty', 'num', 'class="short"')}</label>
          <label>Dia. W Ext. <input type="text" readonly class="short" value="${calc.DWext.toFixed(4)}"></label>
          <label>Price per Ct ${inp(p + 'pricePerCarat', 'num', 'class="num" readonly')}</label>
          <label>D. Cost <input type="text" readonly class="num" value="${n2(calc.dCost)}"></label>
          <label>Setting Cost <input type="text" readonly class="num" value="${n2(calc.settingTotal)}"></label>
          <label>Total D. Cost <input type="text" readonly class="num" value="${n2(calc.total)}"></label>
          <label>Selling Price <input type="text" readonly class="num" value="${n2(calc.total * markup)}"></label></div><span class="ico minus rmGroup" title="remove this group" style="margin:0 5px 10px"></span></div>
        <table class="set"><thead><tr><th>Qty</th><th>Size</th><th>Setting Style</th><th>Stone Placement</th><th>Setting Cost</th><th>Ext. Set Cost</th><th></th></tr></thead><tbody>
          ${g.settings.map((st, j) => { const sp = p + 'settings.' + j + '.'; const style = LK.rec(LK.settingStyles, st.settingStyleID); return `<tr>
            <td>${inp(sp + 'qty', 'num', 'class="short"')} <span class="sync" title="copy the group quantity" data-j="${j}">⟲</span></td><td>${esc(LK.name(LK.diamondSizes, g.sizeID))}</td>
            <td>${sel(sp + 'settingStyleID', LK.settingStyles, '', { label: x => x.cost == null ? x.name : `${x.name} $${x.cost}` }, 'str')}</td>
            <td>${sel(sp + 'settingLocationID', LK.settingLocations, '', null, 'str')}</td>
            <td>${inp(sp + 'settingCost', 'num', `class="num"${style && style.cost == null ? '' : ' readonly'}`)}</td>
            <td>${n2(calc.rows[j].ext)}</td><td><span class="rm" data-j="${j}" title="remove row" style="cursor:pointer;color:#5b73f5">x</span></td></tr>`; }).join('')}
          <tr><td colspan="5" class="right"><b>Total</b></td><td><b>$${n2(calc.settingTotal)}</b></td><td><span class="ico plus addrow" title="add a setting row"></span></td></tr></tbody></table></div>`;
      d.querySelector('.rmGroup').onclick = () => { if (confirm('Remove this stone group?')) { ring.side.splice(i, 1); renderSide(); recalc(); } };
      d.querySelectorAll('.sync').forEach(x => x.onclick = () => { g.settings[Number(x.dataset.j)].qty = g.qty; renderSide(); recalc(); });
      d.querySelectorAll('td .rm').forEach(x => x.onclick = () => { g.settings.splice(Number(x.dataset.j), 1); renderSide(); recalc(); });
      d.querySelector('.addrow').onclick = () => { g.settings.push({ sdsID: g.settings.length + 1, qty: g.qty, settingStyleID: 0, settingLocationID: 0, settingCost: 1 }); renderSide(); recalc(); };
      c.appendChild(d);
    });
    hydrate(c);
  }

  // ADDITIONAL DIAMONDS
  function secAddl() {
    const s = sec('divAddlDiamond', 'ADDITIONAL DIAMONDS', 'plain', { plus: 'btnAddAddl', plusTitle: 'add an additional diamond' });
    body(s).innerHTML = `<div id="divAddlBlocks"></div><div id="divAddlDiamondSettingDetails"></div>`;
    s.querySelector('#btnAddAddl').onclick = () => { ring.addl.push(DB.clone({ adID: 0, stoneProvider: 'Crownring', stoneCatID: 1, stoneTypeID: 1, stoneKindID: 0, shapeID: 1, sizeID: '', qty: 1, psID: 10, colourID: 36, L: '', W: '', D: '', DW: 0, pricePerCarat: 0, certID: 0, stoneCost: '', settingStyleID: 0, settingLocationID: 0, notes: '', isPending: 0, markup: null })); ring.addl[ring.addl.length - 1].adID = Date.now() % 100000; renderAddl(); renderTotals(); };
    setTimeout(renderAddl, 0);
    return s;
  }
  function renderAddl() {
    const c = $('#divAddlBlocks'); if (!c) return; c.innerHTML = '';
    ring.addl.forEach((b, i) => {
      const p = 'addl.' + i + '.';
      const prov = b.stoneProvider;
      const d = el('div', { class: 'addl-block ' + (prov === 'Customer' ? 'customer' : prov === 'Crownring' ? 'crownring' : 'other') });
      d.innerHTML = `<div class="ab-h"><span>Additional Diamond ${i + 1}</span><span class="rm">del</span></div><div class="ab-b">
        <div class="inline">
          <label>Provider ${sel(p + 'stoneProvider', LK.stoneProviders.addl, '', null, 'str')}</label><label>Cat. ${sel(p + 'stoneCatID', LK.stoneCategories)}</label><label>Type ${sel(p + 'stoneTypeID', LK.stoneTypes)}</label><label>Kind ${sel(p + 'stoneKindID', LK.stoneKinds)}</label>
          <label>Shape ${sel(p + 'shapeID', LK.shapes)}</label><label>Size ${sel(p + 'sizeID', [{ id: '', name: '—' }].concat(LK.diamondSizes), '', null, 'str')}</label><label>Qty ${inp(p + 'qty', 'num', 'class="short"')}</label>
          <label>Quality ${sel(p + 'psID', LK.qualities)}</label><label>Colour ${sel(p + 'colourID', LK.stoneColours)}</label></div>
        <div class="inline" style="margin-top:4px">
          <label>Dimensions L ${inp(p + 'L', 'num', 'class="short"')} W ${inp(p + 'W', 'num', 'class="short"')} D ${inp(p + 'D', 'num', 'class="short"')}</label>
          <label>D.W ${inp(p + 'DW', 'num', 'class="short"')} ct</label><label>Price per Ct ${inp(p + 'pricePerCarat', 'num', 'class="num"')}</label>
          <label>Cert ${sel(p + 'certID', LK.certs)}</label><label>Stone Cost ${inp(p + 'stoneCost', 'num', 'class="num" placeholder="auto"')}</label>
          <label>Setting Style ${sel(p + 'settingStyleID', LK.settingStyles, '', null, 'str')}</label><label>Placement ${sel(p + 'settingLocationID', LK.settingLocations, '', null, 'str')}</label>
          <label>Pending ${inp(p + 'isPending', 'chk')}</label></div>
        <div style="margin:4px 5px"><label>Notes <input type="text" data-bind="${p}notes" data-type="str" style="width:60%"></label></div></div>`;
      d.querySelector('.rm').onclick = () => { if (confirm('Remove this additional diamond?')) { ring.addl.splice(i, 1); renderAddl(); recalc(); } };
      c.appendChild(d);
    });
    const ads = $('#divAddlDiamondSettingDetails');
    if (!ring.addl.length) ads.innerHTML = '';
    else ads.innerHTML = `<div class="section pink" style="margin-top:10px"><div class="sec-h" style="margin:10px 0"><span>ADDITIONAL DIAMOND SETTING</span></div><div class="sec-b"><div class="inline"><span class="lbl">SENDING STONE FOR SETTING?
        <input type="radio" name="ADS_send" value="1"> YES <input type="radio" name="ADS_send" value="0"> NO <input type="radio" name="ADS_send" value="-1"> PENDING</span>
        <span id="divADSDetails" class="inline ${Number(ring.ads.sendStone4Setting) === 1 ? '' : 'hidden'}" style="margin-left:auto;padding:0">
          <label>Contact Name ${inp('ads.contactName', 'str')}</label><label>Qty ${inp('ads.qty', 'num', 'class="short"')}</label>
          <label>Setting Charge ${sel('ads.settingChargeID', LK.settingCharges, '', null, 'str')}</label>
          <label>Setting Cost ${inp('ads.settingCost', 'num', 'class="short"')}</label><label>Pending ${inp('ads.isPending', 'chk')}</label></span></div></div></div>`;
    ads.querySelectorAll('[name=ADS_send]').forEach(r => { r.checked = Number(r.value) === Number(ring.ads.sendStone4Setting); r.onchange = () => { ring.ads.sendStone4Setting = Number(r.value); onChange('ads.sendStone4Setting', ring.ads.sendStone4Setting); recalc(); }; });
    hydrate(c); hydrate(ads);
  }

  // DESIGN APPROVAL (XtraBlock1)
  function secXtra() {
    const s = sec('divXtraBlock1', '', 'xtra'); s.querySelector('.sec-h').remove();
    body(s).innerHTML = `<div>Design needs approval? <input type="radio" name="isDesignNeedsApproval" value="1"> <b>Yes</b> <input type="radio" name="isDesignNeedsApproval" value="0"> <b>No</b></div>
      <div id="divDesignDetails" class="${Number(ring.design.needsApproval) === 1 ? '' : 'hidden'}" style="margin-top:6px">
        <div style="margin:6px 0">${inp('design.approved4Prod', 'chk')} Design Approved for production &nbsp; Enter name of last rendering ${inp('design.approved4ProdText', 'str', 'style="width:220px"')}</div>
        <div style="margin:6px 0">Priority ${sel('design.priority', LK.priorities)} &nbsp; Date ${inp('design.date', 'str', 'type="date"')} &nbsp; Time <select data-bind="design.time" data-type="str">${options(LK.timeSlots, ring.design.time)}</select></div>
        <div style="margin:6px 0">Approval Request Type: <select multiple size="4" id="selART" style="vertical-align:top">${LK.approvalRequestTypes.map(t => `<option value="${t.id}"${(ring.design.requestTypes || []).includes(t.id) ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}</select></div></div>`;
    s.querySelectorAll('[name=isDesignNeedsApproval]').forEach(r => { r.checked = Number(r.value) === Number(ring.design.needsApproval); r.onchange = () => { ring.design.needsApproval = Number(r.value); onChange('design.needsApproval', ring.design.needsApproval); recalc(); }; });
    s.querySelector('#selART').onchange = e => { ring.design.requestTypes = [...e.target.selectedOptions].map(o => Number(o.value)); };
    s.querySelector('[data-bind="design.date"]').type = 'date';
    return s;
  }

  // OTHER FEE — CAD PRINT FEE
  function secOtherFee() {
    const s = sec('divOtherFeeSection', 'OTHER FEE', 'green');
    body(s).innerHTML = `<div class="inline"><span class="lbl">CAD PRINT FEE</span> ${sel('otherFee.cadPrintFeeID', LK.cadPrintFees, 'style="align-self:center"', null, 'str')}
      <label>Qty ${inp('otherFee.qty', 'num', 'class="short"')}</label><label>Fee Cost <input type="text" readonly class="short" data-calc="cad"></label><label style="margin-left:auto">Pending ${inp('otherFee.isPending', 'chk')}</label></div>`;
    return s;
  }

  // TOTALS
  function secTotals() { const s = sec('divTotals', '', 'plain'); s.querySelector('.sec-h').remove(); body(s).innerHTML = '<div id="divTotalsBody"></div>'; setTimeout(renderTotals, 0); return s; }
  function renderTotals() {
    const c = $('#divTotalsBody'); if (!c || !ring) return;
    const t = PRICING.totals(ring, R);
    const mpath = { center: 'cdi.markup', setting: 'scsi.markup', ads: 'ads.markup', gold: 'gold.markup', labor: 'labor.markup', side: 'SD_markup', cad: 'otherFee.markup' };
    const cur = acc ? acc.currency : 'USD';
    const karatName = LK.name(LK.karats, ring.gold.karatID);
    const rows = t.rows.filter(r => !(r.key.startsWith('addl') && !ring.addl.length) && !(r.key === 'ads' && !ring.addl.length));
    c.innerHTML = `
      <table class="totals"><thead><tr><th class="metal">Metal: ${esc(karatName)}</th><th>Cost</th><th>Duties</th><th>Final Cost</th><th>Markup</th><th>Sell Price USD</th></tr></thead><tbody>
      ${rows.map(r => { const path = r.key.startsWith('addl') ? 'addl.' + r.key.slice(4) + '.markup' : mpath[r.key]; return `<tr><td>${esc(r.label)}</td><td>$${r.cost ? n2(r.cost) : '0'}${r.qty > 1 ? ` <span class="small">x${r.qty}</span>` : ''}</td><td>${r.duties}%</td><td>$${r.final ? n2(r.final) : '0'}</td>
        <td>${path ? `<input type="number" step="any" class="markup" data-bind="${path}" data-type="num" value="${r.markup}">` : r.markup}</td><td>$${r.sell ? n2(r.sell) : '0'}${r.pending ? ' <span class="danger small">(Pending)</span>' : ''}</td></tr>`; }).join('')}
      <tr class="sep"><td colspan="6"></td></tr>
      <tr class="tot"><td>TOTAL</td><td></td><td></td><td>$${n2(t.totalFinalCost)}</td><td></td><td>$${Math.round(t.sellRaw).toLocaleString('en-US')}</td></tr>
      ${cur === 'CAD' ? `<tr class="cad"><td>TOTAL CAD</td><td></td><td>x <input type="number" step="any" class="short" data-bind="exchangeRate" data-type="num"></td><td></td><td></td><td>$${t.sellCAD.toLocaleString('en-US')}</td></tr>` : ''}
      <tr class="big"><td></td><td></td><td></td><td class="right">T USD</td><td><input type="number" step="any" class="short" data-bind="tarif" data-type="num">%</td><td>${money(t.tarifPriceUSD)}</td></tr>
      <tr class="big"><td></td><td></td><td></td><td class="right">Discount</td><td><input type="number" step="any" class="short" data-bind="discount" data-type="num">%</td><td>${money(t.discountPriceUSD)}</td></tr>
      <tr class="gm"><td></td><td></td><td></td><td colspan="2" class="right gmv">Gross Margin: ${n2(t.grossMargin)}</td><td><span class="lockcell ${t.lockUSD > 0 ? 'locked' : ''}" id="lockUSD" title="Lock price USD — click to edit">${money(t.lockUSD)}</span>${cur === 'CAD' ? ` <span class="lockcell ${t.lockCAD > 0 ? 'locked' : ''}" id="lockCAD" title="Lock price CAD — click to edit">${money(t.lockCAD)} CAD</span>` : ''}</td></tr>
      </tbody></table>
      <div class="totalsSide"><label class="fp"><input type="checkbox" data-bind="isFinalPrice0" data-type="num"> Final Price: $0</label>
        <div style="margin-top:12px">Retail x <input type="number" step="any" class="short" value="${t.retailRateLabel}" readonly title="label only — the live code multiplies by 1 (bug #3)"> : ${money(t.retailUSD)}${cur === 'CAD' ? ' / ' + money(t.retailCAD) + ' CAD' : ''}</div>
        ${cur === 'CAD' ? '' : `<div class="small muted" style="margin-top:6px">Exchange rate <input type="number" step="any" class="short" data-bind="exchangeRate" data-type="num"> → ${money(t.sellCAD)} CAD</div>`}
        <div class="flags">${t.flags.map(esc).join('<br>')}</div></div>`;
    hydrate(c);
    if (lockEditing) mountLockInput(lockEditing.k);
    if (!c._lockBound) { // mousedown + delegation: the same click may first commit a field (blur → change → re-render) and must still open the lock editor
      c._lockBound = true;
      c.addEventListener('mousedown', e => {
        const cell = e.target.closest('.lockcell'); if (!cell) return;
        e.preventDefault();
        const k = cell.id === 'lockUSD' ? 'USD' : 'CAD';
        if (!(Number(ring.gold.weight) > 0)) return alert('Please enter the finished gram weight before locking the price');
        lockEditing = { k, value: Number(ring['lockPrice' + k]) || '' };
        mountLockInput(k);
      });
    }
  }
  let lockEditing = null;
  function mountLockInput(k) {
    const cell = $('#lock' + k); if (!cell) return;
    const i = el('input', { type: 'number', step: 'any', class: 'num w', id: 'lockInput' + k, value: lockEditing.value });
    cell.replaceWith(i); i.focus();
    i.addEventListener('input', () => { if (lockEditing) lockEditing.value = i.value; });
    const done = () => { if (!lockEditing || lockEditing.k !== k || !i.isConnected) return; lockEditing = null; ring['lockPrice' + k] = Number(i.value) || 0; renderTotals(); };
    i.addEventListener('change', done); i.addEventListener('blur', done); i.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); done(); } });
  }

  function secLinks() { const s = sec('divLinks', '3D Viewer Links', 'plain'); body(s).innerHTML = `${inp('link1', 'str', 'maxlength="500" style="width:100%;box-sizing:border-box;margin-bottom:4px"')}${inp('link2', 'str', 'maxlength="500" style="width:100%;box-sizing:border-box"')}`; return s; }

  // RENDERING SECTION
  function secRendering() {
    const s = sec('divRendringSection', 'RENDERING SECTION', 'grey', { plus: 'btnAddRend', plusTitle: 'add images' });
    body(s).innerHTML = `<div id="divRendRows"></div><input type="file" id="fileRend" accept="image/*" multiple style="display:none">`;
    s.querySelector('#btnAddRend').onclick = () => s.querySelector('#fileRend').click();
    s.querySelector('#fileRend').onchange = async e => { for (const file of e.target.files) { const src = await UI.readImageFile(file, 900); ring.renderings.push({ rID: DB.nextRenderingID(), sorting: ring.renderings.length + 1, fileName: file.name, imgName: file.name, dateUpl: DB.today(), uploadedBy: DB.USER, isChecked: 0, isShowInJobbag: 0, isTitleImg: 0, src }); } e.target.value = ''; renderRend(); };
    setTimeout(renderRend, 0);
    return s;
  }
  function renderRend() {
    const c = $('#divRendRows'); if (!c) return;
    if (!ring.renderings.length) { c.innerHTML = '<div style="padding:10px;font-style:italic">No image</div>'; return; }
    c.innerHTML = `<table class="rend"><thead><tr><th>Preview</th><th>Filename</th><th>Upload Date</th><th>Uploaded by</th><th>Show in Quote</th><th>Show in Job bag<br>(limit to 2)</th><th>Title image<br>(limit to 2)</th><th></th></tr></thead><tbody>
      ${ring.renderings.map((r, i) => `<tr><td><a href="${r.src}" target="_blank"><img src="${r.src}" alt=""></a></td><td>${esc(r.fileName)}</td><td>${String(r.dateUpl).replace(/-/g, '/')}</td><td>${esc(r.uploadedBy)}</td>
        <td class="center"><input type="checkbox" data-i="${i}" data-k="isChecked"${r.isChecked ? ' checked' : ''}></td><td class="center"><input type="checkbox" data-i="${i}" data-k="isShowInJobbag"${r.isShowInJobbag ? ' checked' : ''}></td><td class="center"><input type="checkbox" data-i="${i}" data-k="isTitleImg"${r.isTitleImg ? ' checked' : ''}></td>
        <td><span class="rm" data-i="${i}">remove</span></td></tr>`).join('')}</tbody></table>`;
    c.querySelectorAll('input[type=checkbox]').forEach(cb => cb.onchange = () => { const r = ring.renderings[Number(cb.dataset.i)]; const k = cb.dataset.k; if (cb.checked && (k === 'isShowInJobbag' || k === 'isTitleImg') && ring.renderings.filter(x => x[k]).length >= 2) { cb.checked = false; return alert('Maximum 2 images can be ' + (k === 'isTitleImg' ? 'title images' : 'shown in the job bag')); } r[k] = cb.checked ? 1 : 0; });
    c.querySelectorAll('.rm').forEach(x => x.onclick = () => { ring.renderings.splice(Number(x.dataset.i), 1); renderRend(); });
  }

  function secPDF() { const s = sec('divPDFHistory', 'PDF History', 'plain'); body(s).innerHTML = `<div class="pdfHist">${ring.pdfHistory && ring.pdfHistory.length ? ring.pdfHistory.map(h => `${esc(h.fileName)} — ${h.date} — ${esc(h.by)}${h.isRetail ? ' (retail)' : ''}`).join('<br>') : 'PDF History empty'}</div>`; return s; }
  function secNotes() { const s = sec('divNotes', 'Notes about this ring', 'plain'); body(s).innerHTML = `<div class="notesBox"><textarea data-bind="note" data-type="str"></textarea></div>`; return s; }
  function secAdminNote() { const s = sec('divAdminNote', 'Admin Notes', 'plain'); body(s).innerHTML = `<div class="notesBox"><textarea data-bind="adminNote" data-type="str"></textarea></div>`; return s; }
  function secMatchBand() {
    const s = sec('divMatchBand', 'Matching Band', 'green');
    body(s).innerHTML = `<div class="inline"><span class="lbl">Is this band to match an existing Noam Carver engagement ring? <input type="radio" name="MB_isMatchRing" value="1"> Yes <input type="radio" name="MB_isMatchRing" value="0"> No</span>
      <span id="divMBDetails" class="inline ${Number(ring.matchBand.is) === 1 ? '' : 'hidden'}" style="padding:0"><label>Provide ${sel('matchBand.type', LK.matchBandTypes, '', null, 'str')}</label><label>&nbsp;${inp('matchBand.val', 'str', 'style="width:200px"')}</label></span></div>`;
    s.querySelectorAll('[name=MB_isMatchRing]').forEach(r => { r.checked = Number(r.value) === Number(ring.matchBand.is); r.onchange = () => { ring.matchBand.is = Number(r.value); onChange('matchBand.is', ring.matchBand.is); }; });
    return s;
  }
  function secNtrnl() {
    const hasN = (ring.ntrnlNotes || []).some(Boolean), hasI = !!ring.invoiceInstructions;
    const s = sec('divNtrnlNotes', 'Internal Production Notes', 'plain', { plus: 'tglNtrnl', plusTitle: 'show / hide' });
    body(s).innerHTML = `<div class="ntrnl${hasN ? '' : ' hidden'}" id="divNtrnlBody">${[0, 1, 2, 3, 4].map(i => `<input type="text" maxlength="110" data-bind="ntrnlNotes.${i}" data-type="str">`).join('')}</div>
      <div class="sec-h" style="margin:20px 0 10px"><span>Invoices Instructions</span><span class="ico plus" id="tglNvoice" title="show / hide"></span></div>
      <div class="notesBox${hasI ? '' : ' hidden'}" id="divNvoiceBody"><textarea data-bind="invoiceInstructions" data-type="str" style="height:60px"></textarea></div>`;
    s.querySelector('#tglNtrnl').onclick = () => s.querySelector('#divNtrnlBody').classList.toggle('hidden');
    s.querySelector('#tglNvoice').onclick = () => s.querySelector('#divNvoiceBody').classList.toggle('hidden');
    return s;
  }
  function secBtns() {
    const s = el('div', { id: 'divCBRbtns' });
    s.innerHTML = `<div class="q">IS THIS QUOTE COMPLETED?</div><div class="completed"><span class="no" id="cmpNo">NO</span><span class="yes" id="cmpYes">YES</span></div>
      <div id="divSkipped" class="small danger"></div>
      <div class="saveRow"><div class="saves"><button type="button" class="btSave" id="btnSaveCont">SAVE &amp; CONTINUE</button><button type="button" class="btSave exit" id="btnSaveExit">SAVE &amp; EXIT</button></div>
      <div style="text-align:right"><button type="button" class="btPreview plain" id="btnPreview" ${ring.CBRID ? '' : 'disabled'}>View preview</button><br><a class="action small" id="btnLog" style="color:#5b73f5;display:inline-block;margin-top:6px">Update Log</a></div></div>`;
    const paint = () => { s.querySelector('#cmpNo').classList.toggle('on', !ring.status); s.querySelector('#cmpYes').classList.toggle('on', !!ring.status); s.querySelector('#divSkipped').innerHTML = ring.status && ring.completedSkipped && ring.completedSkipped.length ? 'Completed with skipped checks: ' + ring.completedSkipped.map(esc).join(' · ') : ''; };
    s.querySelector('#cmpNo').onclick = () => { ring.status = 0; ring.completedSkipped = []; paint(); };
    s.querySelector('#cmpYes').onclick = () => {
      const items = DB.pendingItems(ring);
      if (items.includes('Ring Size: PENDING')) return alert('Ring Size is PENDING — select the size before marking the quote completed.');
      if (!items.length) { ring.status = 1; ring.completedSkipped = []; paint(); return; }
      UI.confirmBox('Pending items', `<p>The following details are still pending:</p><ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul><p>SKIP marks the ring Completed anyway (it then shows a red "!" on the quote list).</p>`,
        [{ label: 'Go back', onclick: () => {} }, { label: 'SKIP', danger: true, onclick: () => { ring.status = 1; ring.completedSkipped = items; paint(); } }]);
    };
    paint();
    s.querySelector('#btnSaveCont').onclick = () => save2quote(false);
    s.querySelector('#btnSaveExit').onclick = () => save2quote(true);
    s.querySelector('#btnPreview').onclick = () => window.open('summary.html?CBRUID=' + ring.CBRUID, '_blank');
    s.querySelector('#btnLog').onclick = () => UI.overlay(`Update Log — CBR Item Details[${ring.CBRID}]`, ring.log && ring.log.length ? `<table class="grid"><tr><th>Date</th><th>By</th><th>Field</th><th>From</th><th>To</th></tr>${ring.log.slice().reverse().map(l => `<tr><td>${esc(l.date)}</td><td>${esc(l.by)}</td><td>${esc(l.field)}</td><td>${esc(l.from)}</td><td>${esc(l.to)}</td></tr>`).join('')}</table>` : '<p class="muted">No change logged yet.</p>', null, { width: '760px' });
    return s;
  }

  // ---------- recompute readonly fields and the totals table ----------
  function recalc() {
    if (!ring) return;
    const t = PRICING.totals(ring, R);
    const set = (k, v) => $$(`[data-calc="${k}"]`).forEach(e => { if (e.tagName === 'INPUT') e.value = v; else e.textContent = v; });
    set('gold', n2(t.gold)); set('labor', n2(t.labor)); set('cad', n2(t.cad)); set('side.qty', t.side.qty); set('side.DW', t.side.DW.toFixed(4)); set('side.cost', n2(t.side.cost));
    const sc = $('[data-bind="cdi.stoneCost"]'); if (sc && ring.cdi.stoneProvider === 'Crownring' && (ring.cdi.stoneCost === '' || ring.cdi.stoneCost == null)) sc.placeholder = n2(PRICING.centerCost(ring.cdi));
    // side groups' readonly columns
    const groups = $$('#divSideGroups .sd-group');
    ring.side.forEach((g, i) => { const d = groups[i]; if (!d) return; const c = PRICING.sideGroup(g); const ro = d.querySelectorAll('.inline input[readonly]'); if (ro.length >= 6) { ro[0].value = c.singleWeight; ro[1].value = c.DWext.toFixed(4); ro[3].value = n2(c.dCost); ro[4].value = n2(c.settingTotal); ro[5].value = n2(c.total); ro[6] && (ro[6].value = n2(c.total * (ring.SD_markup != null ? ring.SD_markup : R.markups.side))); } });
    renderTotals();
  }

  // ---------- save ----------
  function flatten(o, prefix, out) {
    out = out || {};
    Object.entries(o || {}).forEach(([k, v]) => {
      const p = prefix ? prefix + '.' + k : k;
      if (['log', 'pdfHistory', 'src', 'photos', 'dateUpdated', 'priceUSD', 'priceCAD', 'finalCost', 'img', 'completedSkipped'].includes(k)) return;
      if (v && typeof v === 'object') flatten(v, p, out); else out[p] = v;
    });
    return out;
  }
  function save2quote(exit) {
    if (!ring) return alert('Please select a style and SKU first');
    ring.ringName = f.ringName.value;
    if (original) { const a = flatten(original), b = flatten(ring); Object.keys(Object.assign({}, a, b)).forEach(k => DB.log(ring, k, a[k], b[k])); }
    else DB.log(ring, 'ring', '', 'created from SKU ' + (PRODUCTS.byPID(ring.PID) || {}).sku);
    const saved = DB.saveRing(ring);
    original = DB.clone(saved);
    try { if (window.opener && window.opener.quoteCBRUpd) window.opener.quoteCBRUpd(0, 1, saved.quoteID); } catch (e) { /* cross-tab refresh also happens through the storage event */ }
    if (exit) { window.close(); setTimeout(() => { location.href = 'quote.html?quoteID=' + saved.quoteID; }, 300); }
    else location.href = `ring.html?quoteID=${saved.quoteID}&CBRID=${saved.CBRID}`;
  }

  // ---------- boot ----------
  if (ring) { renderStyleBlock(); loadSections(); }
  else $('#style1').focus();
})();
