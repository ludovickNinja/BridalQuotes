/* BridalQuotes POC — lookup tables
 * Built from live-lookups.js, the option lists read off the live ring editor (crownring.com/_admin/quote_customBridal.asp)
 * on 2026-11-05: every ID, label and data-cost is the one the server uses. What the DOM does not expose is derived here
 * and marked as such: metal purity / loss by karat name, the stone weight per diamond size, prices per carat.
 */
window.LK = (function () {
  const L = window.LIVE_LOOKUPS;
  const LK = {};
  const idOf = v => (v === '' || v == null) ? '' : (isNaN(Number(v)) ? v : Number(v));
  const simple = arr => arr.map(([id, name]) => ({ id: idOf(id), name }));

  // ---- Metal / karat (67, live IDs). Purity, group and loss derived from the name. ----
  LK.karats = L.karatID.map(([id, name]) => {
    const k = name.match(/(\d{2})\s*k/i);
    let group = 'other', purity = 1, loss = 0;
    if (/^Platinum/i.test(name)) { group = 'platinum'; purity = 0.95; loss = 20; }
    else if (/^Palladium/i.test(name)) { group = 'palladium'; purity = 0.95; loss = 15; }
    else if (k) { group = 'gold'; purity = Number(k[1]) / 24; loss = 12; }
    else if (/Silver/i.test(name)) { group = 'silver'; purity = 0.925; loss = 12; }
    else if (/^NONE$/i.test(name)) { group = 'none'; purity = 0; loss = 0; }
    return { id: Number(id), name, group, purity: Math.round(purity * 10000) / 10000, loss };
  });
  LK.KARAT_14K = 2; LK.KARAT_18K = 3; LK.KARAT_10K = 1; LK.KARAT_PT = 17; LK.KARAT_NONE = 94; LK.KARAT_SILVER = 81;

  // ---- Colour (202 live + the "Color" placeholder the Ring Details form shows) ----
  LK.colours = simple(L.colourID);
  LK.COLOUR_WHITE = 1; LK.COLOUR_YELLOW = 2; LK.COLOUR_ROSE = 16; LK.COLOUR_YW = 5; LK.COLOUR_NONE = 20;

  // ---- Finishing (544 live). All High Polish = 28 is the bridal default. ----
  LK.finishings = simple(L.finishingID);
  LK.FINISHING_HP = 28;

  // ---- Ring size (69 live): value is the size itself; Pending = -1, N/A = 0 ----
  LK.ringSizes = L.ringSize.map(([v, name]) => ({ id: Number(v), name, value: Number(v) > 0 ? Number(v) : null }));
  LK.ringSizeByValue = v => LK.ringSizes.find(s => s.id === Number(v));

  // ---- Stones ----
  LK.stoneCategories = simple(L.stoneCatID);
  LK.stoneTypes = simple(L.stoneTypeID);
  LK.stoneTypesSide = simple(L.stoneTypeIDSide);
  LK.stoneKinds = simple(L.stoneKindID);
  LK.stoneProviders = { center: L.stoneProviderCenter.map(([id, name]) => ({ id, name })), side: L.stoneProviderSide.map(([id, name]) => ({ id, name })), addl: L.stoneProviderSide.map(([id, name]) => ({ id, name })) };
  LK.PROVIDER_NA = ''; LK.PROVIDER_CUSTOMER = 'Customer'; LK.PROVIDER_CROWNRING = 'Crownring'; LK.PROVIDER_STUDIO = 'Crown (Studio Stock)';
  LK.shapes = simple(L.diamondShapeID);          // 49, image dropdown in the live editor
  LK.sideShapes = simple(L.diamondShapeIDSide);  // 22
  LK.SHAPE_ROUND = 1; LK.SHAPE_OVAL = 16;

  // Diamond size (74 live IDs). The single-stone weight comes from rawDiamondCosts_act.asp getDiamondWeight in the live
  // system; here it is a sieve chart keyed by mm (0.9 mm = 0.003 ct observed, 3.4 mm = 0.15758 ct derived from quote 101587).
  const mmWeight = [
    [0.8, 0.0025], [0.9, 0.003], [1.0, 0.005], [1.1, 0.006], [1.2, 0.008], [1.25, 0.009], [1.3, 0.01], [1.35, 0.011], [1.4, 0.012], [1.5, 0.015],
    [1.6, 0.02], [1.65, 0.022], [1.7, 0.025], [1.75, 0.027], [1.8, 0.028], [1.85, 0.029], [1.9, 0.03], [2.0, 0.035], [2.1, 0.04], [2.2, 0.045],
    [2.3, 0.05], [2.4, 0.055], [2.5, 0.06], [2.6, 0.07], [2.7, 0.08], [2.8, 0.09], [2.9, 0.10], [3.0, 0.11], [3.1, 0.12], [3.2, 0.13],
    [3.3, 0.14], [3.4, 0.15758], [3.5, 0.17], [3.6, 0.19], [3.65, 0.195], [3.7, 0.20], [3.8, 0.22], [3.85, 0.23], [3.9, 0.24], [4.0, 0.25],
    [4.1, 0.27], [4.2, 0.29], [4.3, 0.31], [4.4, 0.33], [4.5, 0.36], [4.6, 0.38], [4.7, 0.41], [4.8, 0.44], [4.9, 0.46], [5.0, 0.49],
    [5.2, 0.55], [5.4, 0.62], [5.5, 0.65], [5.6, 0.69], [5.7, 0.72], [5.75, 0.74], [6.0, 0.85], [6.4, 1.03], [6.5, 1.08], [7.0, 1.35], [7.3, 1.52], [8.0, 2.02]
  ];
  const weightForMM = mm => { const hit = mmWeight.find(([m]) => Math.abs(m - mm) < 1e-9); if (hit) return hit[1]; let best = mmWeight[0]; mmWeight.forEach(r => { if (Math.abs(r[0] - mm) < Math.abs(best[0] - mm)) best = r; }); return best[1]; };
  LK.diamondSizes = L.diamondSizeID.map(([id, name]) => {
    const cert = name.match(/Certified - ([\d.]+)ct/);
    if (cert) return { id: idOf(id), name, weight: Number(cert[1]), certified: true };
    if (/One Of Kind/i.test(name)) return { id: idOf(id), name, weight: 0, oneOfKind: true };
    const mm = parseFloat(name);
    return { id: idOf(id), name, mm, weight: weightForMM(mm) };
  });
  LK.diamondSizeByMM = mm => LK.diamondSizes.find(s => s.mm != null && Math.abs(s.mm - Number(mm)) < 1e-9 && /^[\d.]+$/.test(s.name));

  // Quality (psID, live): I1 1, SI3-I1 9, SI2 2, SI1 3, CZ 7 (cost 0 allowed), VS1 4, Lab VS1 10; psID 8 = custom (hidden)
  LK.qualities = L.psID.map(([id, name, c0]) => ({ id: Number(id), name, isCost0Allowed: c0 === '1' }));
  LK.QUALITY_CUSTOM = 8; LK.QUALITY_LAB_VS1 = 10; LK.QUALITY_VS1 = 4;

  // Stone colour (61 live; id 36 is the blank default on costing lines)
  LK.stoneColours = L.stoneColourID.map(([id, name]) => ({ id: Number(id), name: name || '(default)' }));
  LK.STONE_COLOUR_DEFAULT = 36;

  LK.settingStyles = L.settingStyleID.map(([id, name, cost]) => ({ id: idOf(id), name, cost: id === '-1' ? null : Number(cost) }));
  LK.settingLocations = simple(L.settingLocationID);
  LK.LOCATION_DEFAULT = 0; LK.LOCATION_BRIDGE = 11;
  LK.settingCharges = L.settingChargeID.map(([id, name, cost]) => ({ id: idOf(id), name, cost: id === '-1' ? null : Number(cost) }));
  LK.CHARGE_CENTER_STONE = 13;
  LK.cadPrintFees = L.cadPrintFeeID.map(([id, name, cost]) => ({ id: idOf(id), name, cost: Number(cost), joke: /annoying|Sara is here|is mad|is tired/.test(name) }));
  LK.CAD_FEE_03 = 5;

  LK.modelTypes = simple(L.modelTypeID);
  LK.DEFAULT_MODEL_TYPE = 1; // "Default Model" (hidden modelTypeID1 on the main style block)
  LK.modifications = L.modifID.map(([id, name, img]) => ({ id: Number(id), name, img: 'https://www.crownring.com/images/customBridalRing/modif/' + img }));

  LK.approvalRequestTypes = [ // ARTIDs multi-select (8, captured on the walkthrough; IDs not exposed on a saved ring)
    { id: 1, name: 'CLIQ' }, { id: 2, name: 'Matching Sample' }, { id: 3, name: 'Need Factory Quote' }, { id: 4, name: 'Renderings' },
    { id: 5, name: 'Stone Count / Weight' }, { id: 6, name: 'Vadim Prepping' }, { id: 7, name: 'Viewer Project' }, { id: 8, name: 'Wax' }];
  LK.priorities = [{ id: 1, name: 'High' }, { id: 2, name: 'Medium' }, { id: 3, name: 'Low' }];
  LK.timeSlots = L.timeSlots.map(([v, label]) => ({ id: v, name: label })); // 57, "12:00AM" for noon as live
  LK.certs = [{ id: 0, name: 'None' }, { id: 1, name: 'GIA' }, { id: 2, name: 'IGI' }, { id: 3, name: 'GCAL' }, { id: 4, name: 'AGS' }, { id: 5, name: 'HRD' }, { id: 6, name: 'EGL' }, { id: 7, name: 'Other' }]; // DDcert admin list not captured
  LK.matchBandTypes = L.MB_type.map(([id, name]) => ({ id, name }));

  // Price per carat (productEdit_act.asp bridalCost_getPricePerCarat): Lab VS1 melee $120/ct observed; the others are placeholders
  LK.pricePerCarat = function (psID, sizeRec) {
    const base = { 1: 150, 9: 200, 2: 280, 3: 350, 7: 5, 4: 450, 10: 120 }[Number(psID)];
    if (base == null) return 0;
    if (sizeRec && sizeRec.certified) return base * 4;
    return base;
  };

  // helpers (IDs can be numbers, '' or strings such as "OfK1" / "Customer")
  LK.rec = (list, id) => list.find(x => String(x.id) === String(id == null ? '' : id));
  LK.name = (list, id) => { const r = LK.rec(list, id); return r ? r.name : ''; };
  return LK;
})();
