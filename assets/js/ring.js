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
  UI.adminBar('Custom Bridal — ring editor');
  $('#accName').textContent = acc ? acc.name : '';
  $('#spQuoteID').textContent = quote.quoteID; $('#spCBRID').textContent = ring ? ring.CBRID : 0;
  $('#lnkViewAs').onclick = e => { if (!ring || !ring.CBRID) { e.preventDefault(); alert('Save the ring first to preview it as the retailer sees it.'); } };
  if (ring && ring.CBRID) $('#lnkViewAs').href = 'summary.html?CBRUID=' + ring.CBRUID;
  const f = $('#f');
  f.ringName.addEventListener('change', () => { if (ring) ring.ringName = f.ringName.value; });

  // ---------- helpers ----------
  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  const setPath = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); const t = ks.reduce((a, k) => (a[k] == null ? (a[k] = {}) : a[k]), o); t[last] = v; };
  function sec(id, title, cls, sub) {
    const s = el('div', { class: 'section ' + (cls || ''), id });
    s.innerHTML = `<div class="sec-h"><span>${title}</span>${sub ? `<span class="sub">${sub}</span>` : ''}</div><div class="sec-b"></div>`;
    return s;
  }
  const body = s => s.querySelector('.sec-b');
  const inp = (path, type, attrs) => `<input type="${type === 'chk' ? 'checkbox' : type === 'num' ? 'number' : 'text'}" data-bind="${path}" data-type="${type}" ${attrs || ''} ${type === 'num' ? 'step="any"' : ''}>`;
  const sel = (path, list, extra, opts) => `<select data-bind="${path}" data-type="num" ${extra || ''}>${options(list, getPath(ring, path), opts)}</select>`;
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
    if (path === 'gold.karatID') { const k = LK.rec(LK.karats, v); ring.gold.rate = window.metalRatePerGram(k, R); ring.gold.loss = k ? k.loss : 12; hydrate($('#divGoldCharge')); }
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
    $('#divBlockImg1').classList.remove('ok'); $('#style1').readOnly = false; $('#style1').value = ''; f.PID.disabled = false; $('#divSKU').classList.add('hidden'); $('#lnkChangeSKU').classList.add('hidden'); $('#divStyleDetails').classList.add('hidden');
    $('#divGblContent').innerHTML = ''; $('#style1').focus();
  };
  function renderStyleBlock() {
    const p = PRODUCTS.byPID(ring.PID);
    $('#divBlockImg1').classList.add('ok');
    $('#style1').value = p.style; $('#style1').readOnly = true;
    f.PID.innerHTML = `<option value="${p.PID}">${esc(p.sku)}</option>`; f.PID.disabled = true; $('#divSKU').classList.remove('hidden'); $('#lnkChangeSKU').classList.remove('hidden');
    $('#divStyleDetails').classList.remove('hidden');
    $('#metalBlock').innerHTML = `<b>Metal:</b> ${esc(LK.name(LK.karats, ring.karatID))} &nbsp; <b>Color:</b> ${esc(LK.name(LK.colours, ring.colourID))} &nbsp; <b>Width:</b> ${esc(ring.ringMM)} &nbsp; <b>Thickness:</b> ${esc(ring.thickness)} &nbsp; <b>Thickness Bottom:</b> ${esc(ring.thicknessBottom)}${ring.isUpd ? ' <span class="small muted">(edited)</span>' : ''}`;
    const sizeRec = LK.ringSizes.find(s => s.value != null ? s.value === Number(ring.ringSize) : (Number(ring.ringSize) <= 0 && s.id === Number(ring.ringSize)));
    f.ringSize.innerHTML = options(LK.ringSizes, sizeRec ? sizeRec.id : -1);
    f.ringSize.onchange = () => { const s = LK.rec(LK.ringSizes, f.ringSize.value); ring.ringSize = s.value != null ? s.value : s.id; recalc(); };
    f.finishingID.innerHTML = options(LK.finishings, ring.finishingID); f.finishingID.onchange = () => { ring.finishingID = Number(f.finishingID.value); };
    $('#divProdImgs').innerHTML = ['side', 'top', 'persp', 'stack'].map(v => `<img src="${PRODUCTS.img(p, v)}" alt="${esc(p.img)} ${v}" title="/images/xlarge/${esc(p.img)}.jpg (${v})">`).join('');
    f.ringName.value = ring.ringName || '';
  }
  $('#metalBlock').onclick = () => {
    const box = UI.overlay('Ring Details', `<table class="form">
      <tr><td class="lbl">Metal</td><td><select name="ringKaratID">${options(LK.karats, ring.karatID)}</select></td></tr>
      <tr><td class="lbl">Color</td><td><select name="ringColourID">${options(LK.colours, ring.colourID)}</select></td></tr>
      <tr><td class="lbl">Width (mm)</td><td><input type="number" step="any" name="ringMM" class="num" value="${esc(ring.ringMM)}"></td></tr>
      <tr><td class="lbl">Thickness</td><td><input type="number" step="any" name="thickness" class="num" value="${esc(ring.thickness)}"></td></tr>
      <tr><td class="lbl">Thickness Bottom</td><td><input type="number" step="any" name="thicknessBottom" class="num" value="${esc(ring.thicknessBottom)}"></td></tr></table>
      <p class="small muted">CUSTOM-FASHION SKUs load with Color NONE and 0 width/thickness — set them here.</p>`, [
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
    const s = sec('divCustom', 'Customize', '', 'add a block per section to describe the design changes');
    body(s).innerHTML = `<div class="inline"><label>Section <select id="selModelType"><option value="">— choose —</option>${options(LK.modelTypes, '')}</select></label> <button type="button" class="small" id="btnAddCustom">Add block</button></div><div id="divCustomBlocks"></div>`;
    s.querySelector('#btnAddCustom').onclick = () => { const mt = Number(s.querySelector('#selModelType').value); if (!mt) return alert('Pick a section'); ring.custom.push({ ID: DB.nextCustomID(), modelTypeID: mt, style: '', PID: 0, isPIDImgMain: 0, isPIDImgAlt: 0, img: '', modifIDs: [], karatID: 0, colourID: 0, notes: '' }); renderCustom(); };
    setTimeout(renderCustom, 0);
    return s;
  }
  function renderCustom() {
    const c = $('#divCustomBlocks'); if (!c) return; c.innerHTML = '';
    ring.custom.forEach((b, i) => {
      const d = el('div', { class: 'custom-block' });
      d.innerHTML = `<div class="cb-h"><span>${esc(LK.name(LK.modelTypes, b.modelTypeID))}</span> <span class="small muted">block ${b.ID}</span><span class="rm" title="Remove block">✕</span></div>
        <div class="inline" style="margin:6px 0"><label>Reference style <input type="text" class="cstyle" style="width:160px" value="${esc(b.style)}" placeholder="style# search"></label>
          <select class="cpid" style="min-width:200px"><option value="0">— SKU —</option>${b.style ? PRODUCTS.skusOfStyle(b.style).map(p => `<option value="${p.PID}"${p.PID === b.PID ? ' selected' : ''}>${esc(p.sku)}</option>`).join('') : ''}</select>
          <label>Karat <select class="ckarat"><option value="0">—</option>${options(LK.karats, b.karatID)}</select></label>
          <label>Colour <select class="ccolour"><option value="0">—</option>${options(LK.colours, b.colourID)}</select></label>
          <label><input type="checkbox" class="cmain"${b.isPIDImgMain ? ' checked' : ''}> use main image</label><label><input type="checkbox" class="calt"${b.isPIDImgAlt ? ' checked' : ''}> use alt image</label></div>
        <div class="modifs">${[0, 1, 2, 3].map(k => `<select class="cmodif" data-k="${k}"><option value="0">— modification ${k + 1} —</option>${options(LK.modifications, b.modifIDs[k] || 0)}</select>`).join('')}</div>
        <textarea class="cnotes" rows="3" placeholder="Design notes, one change per line: * Change to Petal Basket Head">${esc(b.notes)}</textarea>
        <div class="dropzone cimg" style="margin-top:6px">${b.img ? `<img src="${b.img}">` : ''}Drop an image here or click${b.img ? ' <button type="button" class="small crm">remove</button>' : ''}</div>`;
      d.querySelector('.rm').onclick = () => { if (confirm('Remove this customization block?')) { ring.custom.splice(i, 1); renderCustom(); } };
      UI.smartSearch(d.querySelector('.cstyle'), PRODUCTS.searchStyles, x => x, style => { b.style = style; b.PID = 0; renderCustom(); });
      d.querySelector('.cpid').onchange = e => { b.PID = Number(e.target.value); };
      d.querySelector('.ckarat').onchange = e => { b.karatID = Number(e.target.value); };
      d.querySelector('.ccolour').onchange = e => { b.colourID = Number(e.target.value); };
      d.querySelector('.cmain').onchange = e => { b.isPIDImgMain = e.target.checked ? 1 : 0; };
      d.querySelector('.calt').onchange = e => { b.isPIDImgAlt = e.target.checked ? 1 : 0; };
      d.querySelectorAll('.cmodif').forEach(se => se.onchange = () => { b.modifIDs[Number(se.dataset.k)] = Number(se.value); });
      d.querySelector('.cnotes').onchange = e => { b.notes = e.target.value; };
      UI.dropzone(d.querySelector('.cimg'), src => { b.img = src; renderCustom(); });
      const rm = d.querySelector('.crm'); if (rm) rm.onclick = e => { e.stopPropagation(); b.img = ''; renderCustom(); };
      c.appendChild(d);
    });
  }

  // CENTER DIAMOND INFO
  function secCDI() { const s = sec('divCenterDiamondInfo', 'Center Diamond Info', 'pink'); setTimeout(renderCDI, 0); return s; }
  function renderCDI() {
    const s = $('#divCenterDiamondInfo'); if (!s) return;
    const prov = Number(ring.cdi.stoneProvider);
    s.classList.toggle('pink', prov === 1); s.classList.toggle('blue', prov === 2);
    body(s).innerHTML = `<div class="inline">
        <label>Stone Provider ${sel('cdi.stoneProvider', LK.stoneProviders.center)}</label>
        <label>Stone Category ${sel('cdi.stoneCatID', LK.stoneCategories)}</label>
        <label>Stone Type ${sel('cdi.stoneTypeID', LK.stoneTypes)}</label>
        <label>Stone Kind ${sel('cdi.stoneKindID', LK.stoneKinds)}</label>
        <label>Shape ${sel('cdi.shapeID', LK.shapes)}</label>
        <label>Notes ${inp('cdi.notes', 'str', 'maxlength="50" style="width:160px"')}</label></div>
      <div class="inline" style="margin-top:6px">
        <label>Stone Dimensions (mm) L ${inp('cdi.L', 'num', 'class="num"')} × W ${inp('cdi.W', 'num', 'class="num"')} × D ${inp('cdi.D', 'num', 'class="num"')}</label>
        <label>D.W ${inp('cdi.DW', 'num', 'class="num"')} ct</label>
        <label>${inp('cdi.isPending', 'chk')} Pending</label>
        <span class="small muted">customer's own stone stays type "Diamond"; untick Pending once dimensions and weight are known; sanity-check depth against weight</span></div>
      <div id="divAddlInfo" class="${prov === 2 ? '' : 'hidden'}" style="margin-top:8px;padding-top:8px;border-top:1px solid #c9d2dd">
        <div class="inline">
          <label>Size ${sel('cdi.sizeID', [{ id: 0, name: '—' }].concat(LK.diamondSizes))}</label>
          <label>Qty ${inp('cdi.qty', 'num', 'class="short"')}</label>
          <label>Quality ${sel('cdi.psID', LK.qualities.concat([{ id: LK.QUALITY_CUSTOM, name: 'Custom…' }]))}</label>
          <label class="${Number(ring.cdi.psID) === LK.QUALITY_CUSTOM ? '' : 'hidden'}">Custom quality ${inp('cdi.ps_custom', 'str', 'style="width:120px"')}</label>
          <label>Colour ${sel('cdi.colourID', LK.stoneColours)}</label>
          <label>Price per Ct ${inp('cdi.pricePerCarat', 'num', 'class="num"')}</label>
          <label>Cert ${sel('cdi.certID', LK.certs)}</label>
          <label>Stone Cost ${inp('cdi.stoneCost', 'num', 'class="num" placeholder="auto"')}</label></div>
        <div style="margin-top:4px"><label>Additional notes <input type="text" data-bind="cdi.addlNotes" data-type="str" style="width:60%"></label></div></div>
      ${prov === 0 ? '<p class="small muted">No center stone (N/A): the center-stone pending checks are skipped.</p>' : ''}`;
    hydrate(s);
  }

  // SETTING CENTER STONE INFO
  function secSCSI() {
    const s = sec('divSettingCenterStoneInfo', 'Setting Center Stone Info');
    const charge = LK.rec(LK.settingCharges, ring.scsi.settingChargeID);
    body(s).innerHTML = `<div class="inline"><b>SENDING STONE FOR SETTING?</b>
        <label><input type="radio" name="SCSI_send" value="1"> YES</label><label><input type="radio" name="SCSI_send" value="0"> NO</label><label><input type="radio" name="SCSI_send" value="-1"> PENDING</label></div>
      <div id="divSCSIDetails" class="inline ${Number(ring.scsi.sendStone4Setting) === 1 ? '' : 'hidden'}" style="margin-top:6px">
        <label>Contact Name ${inp('scsi.contactName', 'str', 'maxlength="50"')}</label>
        <label>Setting Charge ${sel('scsi.settingChargeID', LK.settingCharges, '', { label: c => c.cost == null ? c.name : `${c.name} $${c.cost}` })}</label>
        <label>Notes <button type="button" class="small" id="btnSCSINotes">${ring.scsi.notes ? 'edit' : 'add'}</button></label>
        <label>Setting Cost ${inp('scsi.settingCost', 'num', `class="num"${charge && charge.cost == null ? '' : ' readonly'}`)}</label>
        <label>${inp('scsi.isPending', 'chk')} Pending</label>
        <span class="small muted">"Center Stone" = $40, markup 2 → sells at $80; this is the store's "setting fee"</span></div>`;
    s.querySelectorAll('[name=SCSI_send]').forEach(r => { r.checked = Number(r.value) === Number(ring.scsi.sendStone4Setting); r.onchange = () => { ring.scsi.sendStone4Setting = Number(r.value); onChange('scsi.sendStone4Setting', ring.scsi.sendStone4Setting); recalc(); }; });
    s.querySelector('#btnSCSINotes').onclick = () => { const box = UI.overlay('Setting notes', `<textarea rows="5" style="width:100%">${esc(ring.scsi.notes)}</textarea>`, [{ label: 'Save', primary: true, onclick: () => { ring.scsi.notes = box.querySelector('textarea').value; UI.closeOverlay(); s.querySelector('#btnSCSINotes').textContent = ring.scsi.notes ? 'edit' : 'add'; } }, { label: 'Cancel', onclick: UI.closeOverlay }]); };
    return s;
  }

  // FANCY CENTER STONE PICTURE REQUIRED
  function secRequest() {
    const s = sec('divRequest', 'Fancy Center Stone Picture Required');
    body(s).innerHTML = `<div class="inline">Production is Requesting to see a Photo of the center stone before starting on the cad file:
        <label><input type="radio" name="isRequest_photo" value="0"> No</label><label><input type="radio" name="isRequest_photo" value="1"> Yes</label> <a class="action small" id="lnkExample">See Example</a></div>
      <div id="divRequestZones" class="${Number(ring.request.isPhoto) === 1 ? '' : 'hidden'}" style="margin-top:8px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="dropzone" id="divDD1"></div><div class="dropzone" id="divDD2"></div></div>
        <div class="inline" style="margin-top:6px"><label>${inp('request.validated', 'chk')} Photos validated</label><label>${inp('request.showClientPreview', 'chk')} Show in client preview</label></div></div>`;
    s.querySelectorAll('[name=isRequest_photo]').forEach(r => { r.checked = Number(r.value) === Number(ring.request.isPhoto); r.onchange = () => { ring.request.isPhoto = Number(r.value); onChange('request.isPhoto', ring.request.isPhoto); }; });
    [0, 1].forEach(i => { const z = s.querySelector('#divDD' + (i + 1)); const paint = () => { z.innerHTML = (ring.request.photos[i] ? `<img src="${ring.request.photos[i]}"><button type="button" class="small">remove</button> ` : '') + `Photo ${i + 1}: drop here or click`; const b = z.querySelector('button'); if (b) b.onclick = e => { e.stopPropagation(); ring.request.photos[i] = null; paint(); }; }; paint(); UI.dropzone(z, src => { ring.request.photos[i] = src; paint(); }); });
    s.querySelector('#lnkExample').onclick = () => UI.overlay('Example', '<p>Two clear photos of the loose stone (table up and side profile) on a plain background, with a ruler or gauge in frame.</p>');
    return s;
  }

  // GOLD CHARGE
  function secGold() {
    const s = sec('divGoldCharge', 'Gold Charge', '', `rate per gram as of ${esc(R.asOf)} — live in the real system, editable on the settings page here`);
    body(s).innerHTML = `<div class="lab-row">
      <div>Karat ${sel('gold.karatID', LK.karats)}</div>
      <div>Gold Cost Per Gram <span title="live metal rate for this karat">${inp('gold.rate', 'num', 'readonly')}</span></div>
      <div>Finished Gram Weight <span class="small muted">"Estimated" from the SKU — add metal for extra design</span>${inp('gold.weight', 'num', 'class="num"')}</div>
      <div>Gold Loss % ${inp('gold.loss', 'num', 'class="short"')}</div>
      <div>Extra charge Per Piece ${inp('gold.extra', 'num', 'class="num"')}</div>
      <div class="total">Total Gold Cost <input type="text" readonly data-calc="gold"></div></div>
      <p class="small muted">gold cost = rate × weight × (1 + loss%) + extra. Loss 12% karat gold, 20% platinum. Rule of thumb for a petal basket head: +0.3 g in 14K, +0.46 g in platinum.</p>`;
    return s;
  }

  // LABOR CHARGE
  function secLabor() {
    const s = sec('divLaborCharge', 'Labor Charge');
    const fields = [['costingLabor', 'Casting Labor'], ['rhodium', 'Rhodium'], ['polishing', 'Polishing'], ['laserEngraving', 'Laser Engraving'], ['extra1', 'Extra 1'], ['extra2', 'Extra 2'], ['handEngra', 'Hand Engra.'], ['millgrain', 'Millgrain'], ['CADFee', 'CAD Fee'], ['chainFee', 'Chain'], ['giftBox', 'Gift Box'], ['SPIFF', 'SPIFF'], ['eagleClaw', 'Eagle Claw']];
    body(s).innerHTML = `<div class="lab-row">${fields.map(([k, l]) => `<div>${l}${inp('labor.' + k, 'num')}</div>`).join('')}<div class="total">Total Labor Cost <input type="text" readonly data-calc="labor"></div></div>
      <p class="small muted">Loaded from the SKU's costing sheet. The live system never saves the Chain field (bug #1) — this POC does save it.</p>`;
    return s;
  }

  // SIDE DIAMOND INFO
  function secSide() {
    const s = sec('divSideDiamond', 'Side Diamond Info', '', 'one line per stone group; each group has its setting rows');
    body(s).innerHTML = `<div id="divSideGroups"></div><div class="inline"><button type="button" class="small" id="btnAddSide">+ stone group</button></div>
      <div class="right" style="margin-top:6px"><b>Qty <span data-calc="side.qty"></span> · <span data-calc="side.DW"></span> ct · Side Diamonds Total Cost $<span data-calc="side.cost"></span></b></div>`;
    s.querySelector('#btnAddSide').onclick = () => { const size = LK.diamondSizeByMM(0.9); ring.side.push({ sdID: Date.now() % 100000, provider: 2, stoneCatID: 1, stoneTypeID: 1, stoneKindID: 0, psID: 10, colourID: 36, shapeID: 1, sizeID: size.id, qty: 1, pricePerCarat: LK.pricePerCarat(10, size), settings: [{ sdsID: 1, qty: 1, settingStyleID: 0, settingLocationID: 0, settingCost: 1 }] }); renderSide(); };
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
      d.innerHTML = `<div class="sd-h"><span>Group ${i + 1}</span><span class="small muted">sdID ${g.sdID}</span><span class="rm" title="Remove group">✕</span></div><div class="sd-b">
        <div class="inline">
          <label>Provider ${sel(p + 'provider', LK.stoneProviders.side)}</label>
          <label>Cat. ${sel(p + 'stoneCatID', LK.stoneCategories)}</label>
          <label>Stone Type ${sel(p + 'stoneTypeID', LK.stoneTypes)}</label>
          <label>Kind ${sel(p + 'stoneKindID', LK.stoneKinds)}</label>
          <label>Quality ${sel(p + 'psID', LK.qualities)}</label>
          <label>Colour ${sel(p + 'colourID', LK.stoneColours)}</label>
          <label>Shape ${sel(p + 'shapeID', LK.sideShapes)}</label>
          <label>Dia. Size ${sel(p + 'sizeID', LK.diamondSizes)}</label>
          <label>Single Dia. W <input type="text" readonly class="short" value="${calc.singleWeight}"></label>
          <label>Qty ${inp(p + 'qty', 'num', 'class="short"')}</label>
          <label>Dia. W Ext. <input type="text" readonly class="short" value="${calc.DWext.toFixed(4)}"></label>
          <label>Price per Ct ${inp(p + 'pricePerCarat', 'num', 'class="num" readonly')}</label>
          <label>D. Cost <input type="text" readonly class="num" value="${n2(calc.dCost)}"></label>
          <label>Setting Cost <input type="text" readonly class="num" value="${n2(calc.settingTotal)}"></label>
          <label>Total D. Cost <input type="text" readonly class="num" value="${n2(calc.total)}"></label>
          <label>Selling Price <input type="text" readonly class="num" value="${n2(calc.total * markup)}"></label></div>
        <table class="set"><thead><tr><th>Qty</th><th>Size</th><th>Setting Style</th><th>Stone Placement</th><th>Setting Cost</th><th>Ext. Set Cost</th><th></th></tr></thead><tbody>
          ${g.settings.map((st, j) => { const sp = p + 'settings.' + j + '.'; const style = LK.rec(LK.settingStyles, st.settingStyleID); return `<tr>
            <td>${inp(sp + 'qty', 'num', 'class="short"')} <span class="sync" title="copy the group quantity" data-j="${j}">⟲</span></td><td>${esc(LK.name(LK.diamondSizes, g.sizeID))}</td>
            <td>${sel(sp + 'settingStyleID', LK.settingStyles, '', { label: x => x.cost == null ? x.name : `${x.name} $${x.cost}` })}</td>
            <td>${sel(sp + 'settingLocationID', LK.settingLocations)}</td>
            <td>${inp(sp + 'settingCost', 'num', `class="num"${style && style.cost == null ? '' : ' readonly'}`)}</td>
            <td>${n2(calc.rows[j].ext)}</td><td><span class="rm" data-j="${j}" title="remove row">✕</span></td></tr>`; }).join('')}
          <tr><td colspan="5" class="right"><b>Total</b></td><td><b>$${n2(calc.settingTotal)}</b></td><td><button type="button" class="small addrow">+ setting row</button></td></tr></tbody></table></div>`;
      d.querySelector('.sd-h .rm').onclick = () => { if (confirm('Remove this stone group?')) { ring.side.splice(i, 1); renderSide(); recalc(); } };
      d.querySelectorAll('.sync').forEach(x => x.onclick = () => { g.settings[Number(x.dataset.j)].qty = g.qty; renderSide(); recalc(); });
      d.querySelectorAll('td .rm').forEach(x => x.onclick = () => { g.settings.splice(Number(x.dataset.j), 1); renderSide(); recalc(); });
      d.querySelector('.addrow').onclick = () => { g.settings.push({ sdsID: g.settings.length + 1, qty: g.qty, settingStyleID: 0, settingLocationID: 0, settingCost: 1 }); renderSide(); recalc(); };
      c.appendChild(d);
    });
    hydrate(c);
  }

  // ADDITIONAL DIAMONDS
  function secAddl() {
    const s = sec('divAddlDiamond', 'Additional Diamonds', '', 'larger extra stones with their own cost, cert and setting; melee goes in Side Diamonds');
    body(s).innerHTML = `<div id="divAddlBlocks"></div><button type="button" class="small" id="btnAddAddl">+</button>
      <div id="divAddlDiamondSettingDetails" style="margin-top:10px;border-top:1px solid #ccc;padding-top:8px"></div>`;
    s.querySelector('#btnAddAddl').onclick = () => { ring.addl.push(DB.clone({ adID: 0, stoneProvider: 2, stoneCatID: 1, stoneTypeID: 1, stoneKindID: 0, shapeID: 1, sizeID: 0, qty: 1, psID: 10, colourID: 36, L: '', W: '', D: '', DW: 0, pricePerCarat: 0, certID: 0, stoneCost: '', settingStyleID: 0, settingLocationID: 0, notes: '', isPending: 0, markup: null })); ring.addl[ring.addl.length - 1].adID = Date.now() % 100000; renderAddl(); renderTotals(); };
    setTimeout(renderAddl, 0);
    return s;
  }
  function renderAddl() {
    const c = $('#divAddlBlocks'); if (!c) return; c.innerHTML = '';
    ring.addl.forEach((b, i) => {
      const p = 'addl.' + i + '.';
      const prov = Number(b.stoneProvider);
      const d = el('div', { class: 'addl-block ' + (prov === 1 ? 'customer' : prov === 2 ? 'crownring' : 'other') });
      d.innerHTML = `<div class="ab-h"><span>Additional Diamond ${i + 1}</span> <span class="small muted" style="margin-left:8px">adID ${b.adID}</span><span class="rm">✕</span></div><div class="ab-b">
        <div class="inline">
          <label>Provider ${sel(p + 'stoneProvider', LK.stoneProviders.addl)}</label><label>Cat. ${sel(p + 'stoneCatID', LK.stoneCategories)}</label><label>Type ${sel(p + 'stoneTypeID', LK.stoneTypes)}</label><label>Kind ${sel(p + 'stoneKindID', LK.stoneKinds)}</label>
          <label>Shape ${sel(p + 'shapeID', LK.shapes)}</label><label>Size ${sel(p + 'sizeID', [{ id: 0, name: '—' }].concat(LK.diamondSizes))}</label><label>Qty ${inp(p + 'qty', 'num', 'class="short"')}</label>
          <label>Quality ${sel(p + 'psID', LK.qualities)}</label><label>Colour ${sel(p + 'colourID', LK.stoneColours)}</label></div>
        <div class="inline" style="margin-top:4px">
          <label>Dimensions L ${inp(p + 'L', 'num', 'class="short"')} W ${inp(p + 'W', 'num', 'class="short"')} D ${inp(p + 'D', 'num', 'class="short"')}</label>
          <label>D.W ${inp(p + 'DW', 'num', 'class="short"')} ct</label><label>Price per Ct ${inp(p + 'pricePerCarat', 'num', 'class="num"')}</label>
          <label>Cert ${sel(p + 'certID', LK.certs)}</label><label>Stone Cost ${inp(p + 'stoneCost', 'num', 'class="num" placeholder="auto"')}</label>
          <label>Setting Style ${sel(p + 'settingStyleID', LK.settingStyles)}</label><label>Placement ${sel(p + 'settingLocationID', LK.settingLocations)}</label>
          <label>${inp(p + 'isPending', 'chk')} Pending</label></div>
        <div style="margin-top:4px"><label>Notes <input type="text" data-bind="${p}notes" data-type="str" style="width:60%"></label></div></div>`;
      d.querySelector('.rm').onclick = () => { if (confirm('Remove this additional diamond?')) { ring.addl.splice(i, 1); renderAddl(); recalc(); } };
      c.appendChild(d);
    });
    const ads = $('#divAddlDiamondSettingDetails');
    if (!ring.addl.length) ads.innerHTML = '<span class="small muted">No additional diamond — the setting block appears once a block is added.</span>';
    else ads.innerHTML = `<b>Additional Diamond Setting</b> &nbsp; SENDING STONE FOR SETTING?
        <label><input type="radio" name="ADS_send" value="1"> YES</label><label><input type="radio" name="ADS_send" value="0"> NO</label><label><input type="radio" name="ADS_send" value="-1"> PENDING</label>
        <div id="divADSDetails" class="inline ${Number(ring.ads.sendStone4Setting) === 1 ? '' : 'hidden'}" style="margin-top:6px">
          <label>Contact Name ${inp('ads.contactName', 'str')}</label><label>Qty ${inp('ads.qty', 'num', 'class="short"')}</label>
          <label>Setting Charge ${sel('ads.settingChargeID', LK.settingCharges, '', { label: x => x.cost == null ? x.name : `${x.name} $${x.cost}` })}</label>
          <label>Setting Cost ${inp('ads.settingCost', 'num', 'class="num"')}</label><label>${inp('ads.isPending', 'chk')} Pending</label></div>`;
    ads.querySelectorAll('[name=ADS_send]').forEach(r => { r.checked = Number(r.value) === Number(ring.ads.sendStone4Setting); r.onchange = () => { ring.ads.sendStone4Setting = Number(r.value); onChange('ads.sendStone4Setting', ring.ads.sendStone4Setting); recalc(); }; });
    hydrate(c); hydrate(ads);
  }

  // DESIGN APPROVAL (XtraBlock1)
  function secXtra() {
    const s = sec('divXtraBlock1', 'Design Approval');
    body(s).innerHTML = `<div class="inline"><b>Design needs approval?</b><label><input type="radio" name="isDesignNeedsApproval" value="1"> Yes</label><label><input type="radio" name="isDesignNeedsApproval" value="0"> No</label>
        <span class="small muted">Yes only when the store wants a CAD or rendering to show their customer; the CAD team then updates the weight and locks the price</span></div>
      <div id="divDesignDetails" class="${Number(ring.design.needsApproval) === 1 ? '' : 'hidden'}" style="margin-top:6px">
        <div class="inline"><label>${inp('design.approved4Prod', 'chk')} Design Approved for production</label><label>Enter name of last rendering ${inp('design.approved4ProdText', 'str', 'style="width:220px"')}</label></div>
        <div class="inline" style="margin-top:4px"><label>Priority ${sel('design.priority', LK.priorities)}</label><label>Date ${inp('design.date', 'str', 'type="date"')}</label><label>Time <select data-bind="design.time" data-type="str">${LK.timeSlots.map(t => `<option${t === ring.design.time ? ' selected' : ''}>${t}</option>`).join('')}</select></label></div>
        <div class="inline" style="margin-top:4px">Approval Request Type: ${LK.approvalRequestTypes.map(t => `<label><input type="checkbox" class="art" value="${t.id}"${(ring.design.requestTypes || []).includes(t.id) ? ' checked' : ''}> ${esc(t.name)}</label>`).join('')}</div></div>`;
    s.querySelectorAll('[name=isDesignNeedsApproval]').forEach(r => { r.checked = Number(r.value) === Number(ring.design.needsApproval); r.onchange = () => { ring.design.needsApproval = Number(r.value); onChange('design.needsApproval', ring.design.needsApproval); recalc(); }; });
    s.querySelectorAll('.art').forEach(c => c.onchange = () => { ring.design.requestTypes = $$('.art:checked', s).map(x => Number(x.value)); });
    s.querySelector('[data-bind="design.date"]').type = 'date';
    return s;
  }

  // OTHER FEE — CAD PRINT FEE
  function secOtherFee() {
    const s = sec('divOtherFeeSection', 'Other Fee — CAD Print Fee');
    body(s).innerHTML = `<div class="inline"><label>CAD print fee ${sel('otherFee.cadPrintFeeID', LK.cadPrintFees, '', { label: x => x.id === 0 ? 'None' : `${x.name} ($${x.cost})` })}</label>
      <label>Qty ${inp('otherFee.qty', 'num', 'class="short"')}</label><label>Fee Cost <input type="text" readonly class="num" data-calc="cad"></label><label>${inp('otherFee.isPending', 'chk')} Pending</label>
      <span class="small muted">skip when the factory already did the CAD</span></div>`;
    return s;
  }

  // TOTALS
  function secTotals() { const s = sec('divTotals', 'Totals'); body(s).innerHTML = '<div id="divTotalsBody"></div>'; setTimeout(renderTotals, 0); return s; }
  function renderTotals() {
    const c = $('#divTotalsBody'); if (!c || !ring) return;
    const t = PRICING.totals(ring, R);
    const mpath = { center: 'cdi.markup', setting: 'scsi.markup', ads: 'ads.markup', gold: 'gold.markup', labor: 'labor.markup', side: 'SD_markup', cad: 'otherFee.markup' };
    const cur = acc ? acc.currency : 'USD';
    c.innerHTML = `<table class="totals"><thead><tr><th></th><th>Cost</th><th>Duties</th><th>Final Cost</th><th>Markup</th><th>Sell USD</th></tr></thead><tbody>
      ${t.rows.map((r, i) => { const path = r.key.startsWith('addl') ? (ring.addl.length ? 'addl.' + r.key.slice(4) + '.markup' : null) : mpath[r.key]; return `<tr><td>${esc(r.label)}</td><td>$${n2(r.cost)}${r.qty > 1 ? ` <span class="small muted">× ${r.qty}</span>` : ''}</td><td>${r.duties}%</td><td>$${n2(r.final)}</td>
        <td>${path ? `<input type="number" step="any" class="markup" data-bind="${path}" data-type="num" value="${r.markup}">` : r.markup}</td><td>$${n2(r.sell)}${r.pending ? ' <span class="pend">(Pending)</span>' : ''}</td></tr>`; }).join('')}
      <tr class="tot"><td>TOTAL</td><td></td><td></td><td>$${n2(t.totalFinalCost)}</td><td></td><td>$${n2(t.sellRaw)}</td></tr></tbody></table>
      <div class="totals-foot">
        <div><span class="big">Sell: ${money(t.sellUSD)} USD</span> &nbsp; / &nbsp; <span class="big">${money(t.sellCAD)} CAD</span><br><label class="small">Exchange Rate <input type="number" step="any" class="short" data-bind="exchangeRate" data-type="num"></label>
          &nbsp; <label class="small">Retail x <input type="number" step="any" class="short" value="${t.retailRateLabel}" readonly title="label only — the live code multiplies by 1 (bug #3)"></label> Retail price: ${money(t.retailUSD)} USD / ${money(t.retailCAD)} CAD
          <br><label class="small">T USD <input type="number" step="any" class="short" data-bind="tarif" data-type="num">%</label> ${money(t.tarifPriceUSD)} &nbsp; <label class="small">Discount <input type="number" step="any" class="short" data-bind="discount" data-type="num">%</label> ${money(t.discountPriceUSD)}
          <br>Gross Margin <b>${n2(t.grossMargin)}</b> %</div>
        <div><b>Lock price</b> (click to edit; sell price rounded up to the nearest $5 → suggested <b>${money(PRICING.roundUp5(t.sellUSD))}</b>)<br>
          USD <span class="lockcell ${t.lockUSD > 0 ? 'locked' : ''}" id="lockUSD">${money(t.lockUSD)}</span> &nbsp; CAD <span class="lockcell ${t.lockCAD > 0 ? 'locked' : ''}" id="lockCAD">${money(t.lockCAD)}</span>
          <br><label class="small"><input type="checkbox" data-bind="isFinalPrice0" data-type="num"> Final Price: $0 (price on request)</label>
          <div class="small muted">Header shows the ${cur} price for this account.${cur === 'CAD' ? ' CAD lock is usually left at 0, so the header CAD figure floats with the exchange rate (bug #4).' : ''}</div>
          <div class="flags">${t.flags.map(esc).join('<br>')}</div></div></div>`;
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

  function secLinks() { const s = sec('divLinks', '3D Viewer Links'); body(s).innerHTML = `<div class="kv"><label>Link 1</label>${inp('link1', 'str', 'maxlength="500" style="width:100%"')}<label>Link 2</label>${inp('link2', 'str', 'maxlength="500" style="width:100%"')}</div>`; return s; }

  // RENDERING SECTION
  function secRendering() {
    const s = sec('divRendringSection', 'Rendering Section', '', 'reference photos: no boxes · CrownRing renderings / factory spec sheet: Show in Quote, Show in Job bag (max 2), Title image (max 2)');
    body(s).innerHTML = `<div id="divRendRows"></div><button type="button" class="small" id="btnAddRend">+</button><input type="file" id="fileRend" accept="image/*" multiple style="display:none">`;
    s.querySelector('#btnAddRend').onclick = () => s.querySelector('#fileRend').click();
    s.querySelector('#fileRend').onchange = async e => { for (const file of e.target.files) { const src = await UI.readImageFile(file, 900); ring.renderings.push({ rID: DB.nextRenderingID(), sorting: ring.renderings.length + 1, fileName: file.name, imgName: file.name, dateUpl: DB.today(), uploadedBy: DB.USER, isChecked: 0, isShowInJobbag: 0, isTitleImg: 0, src }); } e.target.value = ''; renderRend(); };
    setTimeout(renderRend, 0);
    return s;
  }
  function renderRend() {
    const c = $('#divRendRows'); if (!c) return;
    if (!ring.renderings.length) { c.innerHTML = '<p class="small muted">No image yet.</p>'; return; }
    c.innerHTML = `<table class="rend"><thead><tr><th>Preview</th><th>Filename</th><th>Upload Date</th><th>Uploaded by</th><th>Show in Quote</th><th>Show in Job bag</th><th>Title image</th><th></th></tr></thead><tbody>
      ${ring.renderings.map((r, i) => `<tr><td><a href="${r.src}" target="_blank"><img src="${r.src}" alt=""></a></td><td>${esc(r.fileName)}</td><td>${r.dateUpl}</td><td>${esc(r.uploadedBy)}</td>
        <td class="center"><input type="checkbox" data-i="${i}" data-k="isChecked"${r.isChecked ? ' checked' : ''}></td><td class="center"><input type="checkbox" data-i="${i}" data-k="isShowInJobbag"${r.isShowInJobbag ? ' checked' : ''}></td><td class="center"><input type="checkbox" data-i="${i}" data-k="isTitleImg"${r.isTitleImg ? ' checked' : ''}></td>
        <td><span class="rm danger" style="cursor:pointer" data-i="${i}">remove</span></td></tr>`).join('')}</tbody></table>`;
    c.querySelectorAll('input[type=checkbox]').forEach(cb => cb.onchange = () => { const r = ring.renderings[Number(cb.dataset.i)]; const k = cb.dataset.k; if (cb.checked && (k === 'isShowInJobbag' || k === 'isTitleImg') && ring.renderings.filter(x => x[k]).length >= 2) { cb.checked = false; return alert('Maximum 2 images can be ' + (k === 'isTitleImg' ? 'title images' : 'shown in the job bag')); } r[k] = cb.checked ? 1 : 0; });
    c.querySelectorAll('.rm').forEach(x => x.onclick = () => { ring.renderings.splice(Number(x.dataset.i), 1); renderRend(); });
  }

  function secPDF() { const s = sec('divPDFHistory', 'PDF History'); body(s).innerHTML = ring.pdfHistory && ring.pdfHistory.length ? `<table class="grid"><tr><th>File</th><th>Date</th><th>By</th><th>Retail</th></tr>${ring.pdfHistory.map(h => `<tr><td>${esc(h.fileName)}</td><td>${h.date}</td><td>${esc(h.by)}</td><td>${h.isRetail ? 'yes' : ''}</td></tr>`).join('')}</table>` : '<span class="small muted">No PDF generated for this ring yet.</span>'; return s; }
  function secNotes() { const s = sec('divNotes', 'Notes about this ring', '', 'customer-facing, shown on the summary page and the PDF'); body(s).innerHTML = `<textarea data-bind="note" data-type="str" rows="3"></textarea>`; return s; }
  function secAdminNote() { const s = sec('divAdminNote', 'Admin Notes'); body(s).innerHTML = `<textarea data-bind="adminNote" data-type="str" rows="3"></textarea>`; return s; }
  function secMatchBand() {
    const s = sec('divMatchBand', 'Matching Band');
    body(s).innerHTML = `<div class="inline">Is this band to match an existing Noam Carver engagement ring?<label><input type="radio" name="MB_isMatchRing" value="1"> Yes</label><label><input type="radio" name="MB_isMatchRing" value="0"> No</label></div>
      <div id="divMBDetails" class="inline ${Number(ring.matchBand.is) === 1 ? '' : 'hidden'}" style="margin-top:6px"><label>Provide ${sel('matchBand.type', LK.matchBandTypes)}</label>${inp('matchBand.val', 'str', 'style="width:200px"')}</div>`;
    s.querySelectorAll('[name=MB_isMatchRing]').forEach(r => { r.checked = Number(r.value) === Number(ring.matchBand.is); r.onchange = () => { ring.matchBand.is = Number(r.value); onChange('matchBand.is', ring.matchBand.is); }; });
    return s;
  }
  function secNtrnl() {
    const s = sec('divNtrnlNotes', 'Internal Production Notes', '', '5 lines of 110 characters, printed on the job bag');
    body(s).innerHTML = [0, 1, 2, 3, 4].map(i => `<input type="text" maxlength="110" data-bind="ntrnlNotes.${i}" data-type="str" style="width:100%;margin-bottom:4px">`).join('') + `<div style="margin-top:8px"><b>Invoices Instructions</b><textarea data-bind="invoiceInstructions" data-type="str" rows="2"></textarea></div>`;
    return s;
  }
  function secBtns() {
    const s = el('div', { class: 'panel', id: 'divCBRbtns' });
    s.innerHTML = `<div class="btn-row"><b>IS THIS QUOTE COMPLETED?</b> <span class="completed"><span class="no" id="cmpNo">NO</span><span class="yes" id="cmpYes">YES</span></span>
      <span style="margin-left:auto"></span>
      <button type="button" class="primary" id="btnSaveCont">SAVE &amp; CONTINUE</button><button type="button" class="primary" id="btnSaveExit">SAVE &amp; EXIT</button>
      <button type="button" id="btnPreview" ${ring.CBRID ? '' : 'disabled'}>View preview</button><button type="button" id="btnLog">Update Log</button></div>
      <div id="divSkipped" class="small danger"></div>`;
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
    const sc = $('[data-bind="cdi.stoneCost"]'); if (sc && Number(ring.cdi.stoneProvider) === 2 && (ring.cdi.stoneCost === '' || ring.cdi.stoneCost == null)) sc.placeholder = n2(PRICING.centerCost(ring.cdi));
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
