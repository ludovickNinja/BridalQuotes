/* BridalQuotes POC — persistence layer
 * The live system keeps quotes, rings and their child records in SQL behind Classic ASP handlers.
 * This POC is a static GitHub Pages site, so the "database" is one JSON document in localStorage,
 * seeded with the two quotes entered during the walkthrough (101575 and 101587) plus a few rows to
 * exercise the list page. Quote numbers and ring refs (CBRID) continue the live sequences.
 */
window.DB = (function () {
  const KEY = 'bq_db_v1';
  const USER = 'Claude';
  const today = () => new Date().toISOString().slice(0, 10);
  const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const guid = () => 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () => (Math.random() * 16 | 0).toString(16));
  const clone = o => JSON.parse(JSON.stringify(o));

  // ---------- blank records ----------
  function blankCDI() {
    return { stoneProvider: 1, stoneCatID: 1, stoneTypeID: 1, stoneKindID: 0, shapeID: 16, notes: '', L: '', W: '', D: '', isPending: 1,
      sizeID: 0, qty: 1, psID: 10, ps_custom: '', colourID: 36, DW: 0, pricePerCarat: 0, addlNotes: '', certID: 0, stoneCost: '', markup: null };
  }
  function blankSCSI() { return { sendStone4Setting: -1, contactName: '', settingChargeID: 0, settingCost: 0, notes: '', isPending: 0, markup: null }; }
  function blankADS() { return { sendStone4Setting: -1, contactName: '', qty: 1, settingChargeID: 0, settingCost: 0, isPending: 0, markup: null }; }
  function blankAddl(adID) {
    return { adID, stoneProvider: 2, stoneCatID: 1, stoneTypeID: 1, stoneKindID: 0, shapeID: 1, sizeID: 0, qty: 1, psID: 10, colourID: 36,
      L: '', W: '', D: '', DW: 0, pricePerCarat: 0, certID: 0, stoneCost: '', settingStyleID: 0, settingLocationID: 0, notes: '', isPending: 0, markup: null };
  }
  function sideFromCosting(c, ids) {
    const size = LK.diamondSizeByMM(c.sizeMM) || LK.diamondSizes[0];
    return {
      sdID: ids.sd++, provider: c.provider, stoneCatID: c.stoneCatID, stoneTypeID: c.stoneTypeID, stoneKindID: c.stoneKindID,
      psID: c.psID, colourID: c.colourID, shapeID: c.shapeID, sizeID: size.id, qty: c.qty, pricePerCarat: LK.pricePerCarat(c.psID, size),
      settings: c.settings.map(s => ({ sdsID: ids.sds++, qty: s.qty, settingStyleID: s.settingStyleID, settingLocationID: s.settingLocationID, settingCost: s.settingCost }))
    };
  }

  // a new ring as the editor builds it once a SKU is validated (loadBlockImg_styleDetails + loadGoldCharge + loadLaborCharge + loadSideDiamond)
  function newRingFromProduct(p, quoteID, rates) {
    const R = rates || DB.rates();
    const karat = LK.rec(LK.karats, p.karatID);
    const ids = { sd: 1, sds: 1 };
    return {
      CBRID: 0, CBRUID: guid(), quoteID: quoteID || 0, PID: p.PID, ringName: '', ringSize: -1, finishingID: p.defaultFinishingID == null ? 28 : p.defaultFinishingID,
      karatID: p.karatID, colourID: p.colourID, ringMM: p.ringMM, thickness: p.thickness, thicknessBottom: p.thicknessBottom, isUpd: 0,
      isEnabled: 1, qty: 1, status: 0, isApproved: null,
      priceUSD: 0, priceCAD: 0, finalCost: 0, lockPriceUSD: 0, lockPriceCAD: 0, retailRate: R.retailRate, exchangeRate: R.exchangeRate, tarif: R.tarif, discount: R.discount, isFinalPrice0: 0,
      note: '', adminNote: '', ntrnlNotes: ['', '', '', '', ''], invoiceInstructions: '', link1: '', link2: '',
      custom: [], images: [],
      cdi: blankCDI(), scsi: blankSCSI(),
      request: { isPhoto: 0, validated: 0, showClientPreview: 0, photos: [null, null] },
      gold: { karatID: p.karatID, rate: window.metalRatePerGram(karat, R), weight: p.weight, loss: karat ? karat.loss : 12, extra: 0, markup: null },
      labor: Object.assign({}, p.labor, { markup: null }),
      side: (p.side || []).map(c => sideFromCosting(c, ids)), SD_markup: null,
      addl: [], ads: blankADS(),
      design: { needsApproval: 0, approved4Prod: 0, approved4ProdText: '', priority: 2, date: today(), time: '08:00AM', requestTypes: [] },
      otherFee: { cadPrintFeeID: 0, qty: 1, cost: 0, isPending: 0, markup: null },
      renderings: [], pdfHistory: [], matchBand: { is: 0, type: 1, val: '' }, log: [],
      dateCreated: today(), dateUpdated: today(), completedSkipped: []
    };
  }

  // ---------- seed ----------
  function seed() {
    const R = clone(window.DEFAULT_RATES);
    const db = { quotes: [], rings: [], regularQuotes: [], seq: { quote: 101588, ring: 57092, custom: 73970, rendering: 9001, pdf: 1 }, rates: R, draft: null, log: [] };

    function mkQuote(q) {
      const dq = q.dateQuoted || today();
      db.quotes.push(Object.assign({ quoteID: 0, uaID: 0, shippingID: 0, ctName: '', ctEmails: [], comments: '', isCommIncludEmail: 1, internalComments: '',
        dateQuoted: dq, expiry: addDays(dq, R.expiryDays), lastSent: null, status: 'pending', userID: USER, approvalDismissed: 0, isReplacement: 0, isRepair: 0 }, q));
    }
    function mkRing(sku, quoteID, CBRID, mod) {
      const p = PRODUCTS.bySKU(sku);
      const r = newRingFromProduct(p, quoteID, R);
      r.CBRID = CBRID; r.quoteID = quoteID;
      r.gold.rate = p.karatID === 7 ? 49.8346 : p.karatID === 2 ? 78.0433 : r.gold.rate; // live rates on 2026-11-04 (displayed 49.84 / 78.04)
      mod(r);
      const t = PRICING.totals(r, R);
      r.priceUSD = t.sellUSD; r.priceCAD = t.sellCAD; r.finalCost = t.totalFinalCost;
      db.rings.push(r);
      return r;
    }
    const centerOval = r => { Object.assign(r.cdi, { stoneProvider: 1, stoneCatID: 1, stoneTypeID: 1, shapeID: 16, L: 9.55, W: 6.62, D: 4.40, DW: 1.59, isPending: 0 }); };
    const settingYes = r => { Object.assign(r.scsi, { sendStone4Setting: 1, settingChargeID: 13, settingCost: 40 }); };
    const cad03 = r => { Object.assign(r.otherFee, { cadPrintFeeID: 3, cost: 40 }); };
    const headBlock = (r, notes) => { r.custom.push({ ID: 73969 + r.custom.length, modelTypeID: 3, style: '', PID: 0, isPIDImgMain: 0, isPIDImgAlt: 0, img: '', modifIDs: [], karatID: 0, colourID: 0, notes }); };
    const bridge = r => { r.side[0].qty = 14; r.side[0].settings[0].qty = 14; r.side[0].settings[0].settingLocationID = 11; };
    const rendering = (r, fileName, src, flags) => r.renderings.push(Object.assign({ rID: db.seq.rendering++, sorting: r.renderings.length + 1, fileName, imgName: fileName, dateUpl: '2026-11-04', uploadedBy: USER, isChecked: 0, isShowInJobbag: 0, isTitleImg: 0, src }, flags || {}));

    // ---- Quote 101575 — Crown Samples, store request on B552-02 (4 rings) ----
    mkQuote({ quoteID: 101575, uaID: 2875, shippingID: 4554, ctName: 'Claude', ctEmails: ['ludovick@crownring.com'], dateQuoted: '2026-11-04',
      comments: 'Two variations as requested: hidden halo in the head, or diamonds on the bridge. All lab diamonds. Setting fee included.',
      internalComments: '<p>Store sent SKU B552-02YM-FCYA but wants white gold and platinum, all lab → entered on B552-02A-Lab.</p>' });
    mkRing('B552-02WM-Lab-FCYA', 101575, 57056, r => { r.ringSize = 4.5; centerOval(r); settingYes(r); cad03(r); headBlock(r, '* Change to Petal Basket Head\n* Keep Hidden Halo'); r.gold.weight = 3.5; r.lockPriceUSD = 885; r.status = 1; });
    mkRing('B552-02WZ-Lab-FCYA', 101575, 57069, r => { r.ringSize = 4.5; centerOval(r); settingYes(r); cad03(r); headBlock(r, '* Change to Petal Basket Head\n* Keep Hidden Halo'); r.gold.weight = 5.9; r.lockPriceUSD = 970; r.status = 1; rendering(r, 'B552_ref1_petal_basket_head.jpg', 'assets/img/B552_ref1_petal_basket_head.jpg'); });
    mkRing('B552-02WM-Lab-FCYA', 101575, 57081, r => { r.ringSize = 4.5; centerOval(r); settingYes(r); cad03(r); headBlock(r, '* Change to Petal Basket Head\n* No hidden halo - diamonds on the bridge instead'); r.gold.weight = 3.5; bridge(r); r.lockPriceUSD = 880; r.status = 1; rendering(r, 'B552_ref2_diamonds_on_bridge.jpg', 'assets/img/B552_ref2_diamonds_on_bridge.jpg'); });
    mkRing('B552-02WZ-Lab-FCYA', 101575, 57085, r => { r.ringSize = 4.5; centerOval(r); settingYes(r); cad03(r); headBlock(r, '* Change to Petal Basket Head\n* No hidden halo - diamonds on the bridge instead'); r.gold.weight = 5.9; bridge(r); r.lockPriceUSD = 965; r.status = 1; rendering(r, 'B552_ref2_diamonds_on_bridge.jpg', 'assets/img/B552_ref2_diamonds_on_bridge.jpg'); });

    // ---- Quote 101587 — Friends and Family, factory-made custom fashion piece CUN00269 ----
    mkQuote({ quoteID: 101587, uaID: 2954, shippingID: 0, ctName: 'Ilan', ctEmails: ['ilan@crownring.com'], dateQuoted: '2026-11-04' });
    mkRing('CUSTOM-FASHION-14K', 101587, 57091, r => {
      r.ringName = 'CUN00269 - Star of David L/Y necklace'; r.ringSize = 18; r.colourID = 1; r.isUpd = 1;
      r.cdi.stoneProvider = 0; r.cdi.isPending = 0;
      r.custom.push({ ID: 73975, modelTypeID: 10, style: '', PID: 0, isPIDImgMain: 0, isPIDImgAlt: 0, img: '', modifIDs: [], karatID: 0, colourID: 0,
        notes: 'New style # CUN00269 - (Cable30 chain with lobster lock )\nGold @ 4131- $ 492\nMETAL KT - 14KT WHITE\nMETAL WT: 2.14gm ( Without chain )\nDIAMOND – LAB VS\nDIAMOND WT. 0.462 CTW' });
      r.gold.weight = 2.14;
      Object.assign(r.labor, { CADFee: 40, extra1: 107.22 });
      const ids = { sd: 1, sds: 1 };
      r.side = [[3.4, 2], [1.1, 6], [1.0, 6], [0.9, 24]].map(([mm, qty]) => sideFromCosting({ provider: 2, stoneCatID: 1, stoneTypeID: 1, stoneKindID: 0, psID: 10, colourID: 36, shapeID: 1, sizeMM: mm, qty, settings: [{ qty, settingStyleID: 0, settingLocationID: 0, settingCost: 1 }] }, ids));
      r.lockPriceUSD = 895; r.status = 1;
      rendering(r, 'spec_sheet_CUN00269.jpg', 'assets/img/spec_sheet_CUN00269.jpg', { isChecked: 1, isShowInJobbag: 1, isTitleImg: 1 });
    });

    // ---- filler quotes for the list page ----
    const ago = n => addDays(today(), -n); // filler rows are dated relative to today so the list always shows every status
    mkQuote({ quoteID: 101532, uaID: 3103, shippingID: 7301, ctName: 'David', ctEmails: ['david@samplefinejewelry.example'], dateQuoted: ago(8) });
    mkRing('B140-01WM-FCYA', 101532, 57030, r => { r.ringSize = 6; r.cdi.isPending = 1; r.status = 0; });
    mkQuote({ quoteID: 101460, uaID: 4546, shippingID: 6101, ctName: 'Sam', ctEmails: ['usa@crownring.com'], dateQuoted: ago(5), lastSent: ago(4), status: 'approved' });
    mkRing('B512-01WS-FCYA', 101460, 56990, r => { r.ringSize = 7; centerOval(r); settingYes(r); r.lockPriceUSD = 1120; r.status = 1; r.isApproved = 1; });
    mkQuote({ quoteID: 101301, uaID: 3102, shippingID: 7201, ctName: 'Priya', ctEmails: ['priya@demojewelers.example'], dateQuoted: ago(46), lastSent: ago(45), status: 'converted' });
    mkRing('B027-01YM-FCYA', 101301, 56870, r => { r.ringSize = 5.5; r.cdi.stoneProvider = 0; r.cdi.isPending = 0; r.lockPriceUSD = 640; r.lockPriceCAD = 910; r.status = 1; });
    mkQuote({ quoteID: 101120, uaID: 3101, shippingID: 7101, ctName: 'Marie-Ève', ctEmails: ['marie-eve@bijouteriedemo.example'], dateQuoted: ago(66) });
    mkRing('B224-02WM-FCYA', 101120, 56874, r => { r.ringSize = 6.5; r.cdi.isPending = 1; r.scsi.sendStone4Setting = -1; r.lockPriceUSD = 1450; r.status = 1; r.completedSkipped = ['Center Stone Dimensions: PENDING', 'Sending Center Stone For Setting: PENDING']; });

    // regular quotes tab (not walked through — list rows only)
    db.regularQuotes = [
      { quoteID: 101461, uaID: 3102, endCustomer: 'J. Smith', userID: 'Vicky', dateQuoted: ago(3), status: 'pending' },
      { quoteID: 101402, uaID: 3101, endCustomer: 'Famille Tremblay', userID: 'Dodgie', dateQuoted: ago(10), status: 'approved' },
      { quoteID: 101377, uaID: 3103, endCustomer: 'M. Chen', userID: 'Vicky', dateQuoted: ago(40), status: 'converted' }
    ].map(q => Object.assign(q, { expiry: addDays(q.dateQuoted, R.expiryDays) }));
    return db;
  }

  // ---------- load / save ----------
  let db = null;
  function load() {
    if (db) return db;
    try { const raw = localStorage.getItem(KEY); if (raw) db = JSON.parse(raw); } catch (e) { db = null; }
    if (!db) { db = seed(); save(); }
    return db;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { console.error('localStorage write failed', e); alert('Could not save: browser storage is full or blocked. Remove some rendering images or export/reset the demo data.'); } }

  const DB = {
    USER, today, addDays, guid, clone, newRingFromProduct,
    reset() { db = seed(); save(); },
    raw() { return load(); },
    rates() { return load().rates; },
    saveRates(r) { load().rates = r; save(); },
    export() { return JSON.stringify(load(), null, 1); },
    import(json) { db = JSON.parse(json); save(); },

    quotes() { return load().quotes; },
    regularQuotes() { return load().regularQuotes; },
    quote(id) { return load().quotes.find(q => q.quoteID === Number(id)); },
    rings(quoteID) { return load().rings.filter(r => r.quoteID === Number(quoteID)).sort((a, b) => a.CBRID - b.CBRID); },
    ring(CBRID) { return load().rings.find(r => r.CBRID === Number(CBRID)); },
    ringByUID(uid) { return load().rings.find(r => r.CBRUID === uid); },
    quoteTotal(quoteID) { return this.rings(quoteID).filter(r => r.isEnabled === 1).reduce((a, r) => a + this.ringPrice(r) * (r.qty || 1), 0); },
    // what the header row shows: the account's currency; USD lock, else floating sell (CAD lock is rarely set — bug #4)
    ringPrice(r) {
      const q = this.quote(r.quoteID); const acc = q && ACCOUNTS.byID(q.uaID);
      const cur = acc ? acc.currency : 'USD';
      return cur === 'CAD' ? (r.lockPriceCAD > 0 ? r.lockPriceCAD : r.priceCAD) : (r.lockPriceUSD > 0 ? r.lockPriceUSD : r.priceUSD);
    },
    currency(quoteID) { const q = this.quote(quoteID); const acc = q && ACCOUNTS.byID(q.uaID); return acc ? acc.currency : 'USD'; },

    // draft quote from the Billing overlay (quoteID stays 0 until the first ring is saved — as in the live system)
    draft() { return load().draft; },
    setDraft(d) { load().draft = d; save(); },
    createQuoteFromDraft() {
      const d = load().draft; if (!d) return null;
      const id = load().seq.quote++;
      const dq = today();
      const q = { quoteID: id, uaID: d.uaID, shippingID: d.shippingID || 0, ctName: d.ctName || '', ctEmails: d.ctEmails || [], comments: d.comments || '', isCommIncludEmail: d.isCommIncludEmail == null ? 1 : d.isCommIncludEmail,
        internalComments: d.internalComments || '', dateQuoted: dq, expiry: addDays(dq, load().rates.expiryDays), lastSent: null, status: 'pending', userID: USER, approvalDismissed: 0, isReplacement: d.isReplacement || 0, isRepair: d.isRepair || 0 };
      load().quotes.push(q); load().draft = null; save();
      return q;
    },
    saveQuote(q) { const list = load().quotes; const i = list.findIndex(x => x.quoteID === q.quoteID); if (i >= 0) list[i] = q; else list.push(q); save(); },
    deleteQuote(id) { const d = load(); d.quotes = d.quotes.filter(q => q.quoteID !== Number(id)); d.rings = d.rings.filter(r => r.quoteID !== Number(id)); save(); },
    extendQuote(id) { const q = this.quote(id); if (q) { q.expiry = addDays(q.expiry, load().rates.extensionDays); save(); } },

    nextCustomID() { return load().seq.custom++; },
    nextRenderingID() { return load().seq.rendering++; },
    nextPdfID() { return load().seq.pdf++; },

    // one transactional save (the live editor does 15–30 sequential posts)
    saveRing(ring) {
      const d = load();
      if (!ring.quoteID || ring.quoteID === 0) { const q = this.createQuoteFromDraft(); if (!q) throw new Error('No draft quote to attach this ring to'); ring.quoteID = q.quoteID; }
      if (!ring.CBRID) ring.CBRID = d.seq.ring++;
      if (!ring.CBRUID) ring.CBRUID = guid();
      const t = PRICING.totals(ring, d.rates);
      ring.priceUSD = t.sellUSD; ring.priceCAD = t.sellCAD; ring.finalCost = t.totalFinalCost; ring.dateUpdated = today();
      const i = d.rings.findIndex(r => r.CBRID === ring.CBRID);
      if (i >= 0) d.rings[i] = ring; else d.rings.push(ring);
      save();
      return ring;
    },
    deleteRing(CBRID) { const d = load(); d.rings = d.rings.filter(r => r.CBRID !== Number(CBRID)); save(); },
    duplicateRing(CBRID, ringName, isNewQuote, copyRenderings) {
      const d = load(); const src = this.ring(CBRID); if (!src) return null;
      const r = clone(src); r.CBRID = d.seq.ring++; r.CBRUID = guid(); r.ringName = ringName || ''; r.isApproved = null; r.pdfHistory = []; r.log = []; r.dateCreated = today();
      if (!copyRenderings) r.renderings = [];
      if (Number(isNewQuote) > 0) {
        const q0 = this.quote(src.quoteID); const id = d.seq.quote++; const dq = today();
        const q = Object.assign(clone(q0), { quoteID: id, dateQuoted: dq, expiry: addDays(dq, d.rates.expiryDays), lastSent: null, status: 'pending', approvalDismissed: 0, isReplacement: Number(isNewQuote) === 1 ? 1 : 0, isRepair: Number(isNewQuote) === 2 ? 1 : 0, comments: '', internalComments: '' });
        d.quotes.push(q); r.quoteID = id;
      }
      d.rings.push(r); save();
      return r;
    },

    // "Completed" column and the red "!" tooltip on the list
    pendingItems(r) {
      const items = [];
      const p = PRODUCTS.byPID(r.PID); const skuCode = p ? p.sku : '';
      if (Number(r.ringSize) === -1) items.push('Ring Size: PENDING');
      if (Number(r.finishingID) === 0) items.push('Finishing: None');
      const skipStone = /B$/.test(skuCode.replace(/-FCYA$/, '').replace(/-Lab$/, '')) || /^ST/.test(skuCode);
      if (Number(r.cdi.stoneProvider) !== 0 && !skipStone) {
        if (r.cdi.isPending || !r.cdi.L || !r.cdi.W || !r.cdi.D) items.push('Center Stone Dimensions: PENDING');
        if (Number(r.scsi.sendStone4Setting) === -1) items.push('Sending Center Stone For Setting: PENDING');
        if (Number(r.scsi.sendStone4Setting) === 1 && (r.scsi.isPending || Number(r.scsi.settingChargeID) === 0)) items.push('Setting Center Diamond Stone: PENDING');
      }
      if (Number(r.request.isPhoto) === 1 && !r.request.validated) items.push('Fancy Photos: NOT VALIDATED');
      if (r.addl.length && Number(r.ads.sendStone4Setting) === -1) items.push('Additional Diamond Setting: PENDING');
      return items;
    },
    quoteCompleted(quoteID) {
      const rings = this.rings(quoteID).filter(r => r.isEnabled !== 0);
      if (!rings.length) return { yes: false, missing: [] };
      const yes = rings.every(r => r.status === 1);
      const missing = [];
      rings.filter(r => r.status === 1).forEach(r => { const items = this.pendingItems(r); if (items.length) missing.push({ CBRID: r.CBRID, items }); });
      return { yes, missing };
    },
    isExpired(q) { return q.expiry < today(); },
    log(ring, field, from, to) { ring.log = ring.log || []; if (String(from) !== String(to)) ring.log.push({ date: new Date().toISOString().slice(0, 16).replace('T', ' '), by: USER, field, from: String(from == null ? '' : from), to: String(to == null ? '' : to) }); }
  };
  return DB;
})();
