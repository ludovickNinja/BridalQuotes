/* BridalQuotes POC — product catalogue with bridal costing sheets
 * Mirrors what the live system returns from CBR_SM_style (style search), CBR_getSKUDD (style → SKUs)
 * and loadBlockImg_styleDetails / loadGoldCharge / loadLaborCharge / loadSideDiamond (the SKU's costing sheet).
 * Observed: B552-02A-Lab family (PIDs 167161 / 197326 / 167163 / 167165), CUSTOM-FASHION-14K (PID 136696).
 * Everything else is demo data in the same shape, to be replaced by an export of the product database.
 */
window.PRODUCTS = (function () {
  const BRIDAL_LABOR = { costingLabor: 5, rhodium: 5, polishing: 20, laserEngraving: 1.5, extra1: 0, extra2: 0, handEngra: 0, millgrain: 0, CADFee: 15, chainFee: 0, giftBox: 1.25, SPIFF: 29.5, eagleClaw: 1 }; // = 78.25
  const CUSTOM_LABOR = { costingLabor: 20, rhodium: 2.6, polishing: 15, laserEngraving: 1.5, extra1: 0, extra2: 0, handEngra: 0, millgrain: 0, CADFee: 0, chainFee: 0, giftBox: 1.25, SPIFF: 25, eagleClaw: 0 }; // = 65.35
  const BAND_LABOR = { costingLabor: 4, rhodium: 3, polishing: 12, laserEngraving: 1.5, extra1: 0, extra2: 0, handEngra: 0, millgrain: 0, CADFee: 0, chainFee: 0, giftBox: 1.25, SPIFF: 12, eagleClaw: 0 };

  // side-stone costing line of B552-02: the 16 × 0.9 mm hidden halo (bcdcid 248220 observed; provider "Crown (Studio Stock)", colour id 36 = blank default)
  const halo = (psID) => [{ bcdcID: 248220, provider: 'Crown (Studio Stock)', stoneCatID: 1, stoneTypeID: 1, stoneKindID: 0, psID, colourID: 36, shapeID: 1, sizeMM: 0.9, qty: 16,
    settings: [{ qty: 16, settingStyleID: 0, settingLocationID: 0, settingCost: 1 }] }];

  const products = [];
  let pid = 180000;
  function sku(style, code, karatID, colourID, opts) {
    const p = Object.assign({
      PID: opts && opts.PID || pid++,
      style, sku: code, karatID, colourID,
      brand: 'NOAM CARVER BRIDAL-BRIDAL',
      ringMM: 1.6, thickness: 1.7, thicknessBottom: 1.7,
      weight: 3.2, labor: BRIDAL_LABOR, side: [], img: style.replace(/-Lab$/, ''), altimg: null,
      defaultFinishingID: 28
    }, opts || {});
    products.push(p);
    return p;
  }

  // ---- B552-02 family (Noam Carver). A/B = head variant (to confirm); -Lab = lab-grown melee ----
  const b552 = { ringMM: 1.6, thickness: 1.7, thicknessBottom: 1.7, altimg: 'B552-02WS-FCYA' };
  const W = { M: [2, 1, 3.2], N: [2, 1, 3.2], S: [3, 1, 3.67], Z: [17, 20, 5.44] }; // karat letter → [karatID (live: 14K 2, 18K 3, Platinum 950 17), colourID, default weight]; N = to confirm, treated as 14K
  function family(style, colourLetter, colourID, lab, variant) {
    Object.entries(W).forEach(([k, [karatID, cID, weight]]) => {
      if (k === 'N' && !lab) return;                 // WN only seen on the Lab style
      if (karatID === 17 && colourLetter !== 'W') return; // platinum only in white
      const code = `B552-02${colourLetter}${k}${lab ? '-Lab' : ''}-FCYA`;
      const observed = { 'B552-02WM-Lab-FCYA': 167161, 'B552-02WN-Lab-FCYA': 197326, 'B552-02WS-Lab-FCYA': 167163, 'B552-02WZ-Lab-FCYA': 167165 }[code];
      sku(style, code, karatID, karatID === 17 ? 20 : colourID, Object.assign({}, b552, { PID: observed, weight, side: halo(lab ? 10 : 4), variant }));
    });
  }
  [['B552-02A', 'W', 1], ['B552-02YA', 'Y', 2], ['B552-02RA', 'R', 16], ['B552-02YWA', 'YW', 5]].forEach(([s, l, c]) => { family(s, l, c, false, 'A'); family(s + '-Lab', l, c, true, 'A'); });
  [['B552-02B', 'W', 1], ['B552-02YB', 'Y', 2], ['B552-02RB', 'R', 16]].forEach(([s, l, c]) => family(s, l, c, false, 'B'));

  // ---- a few more bridal styles so the style search feels real (demo data) ----
  function simpleFamily(style, weight14, side, extra) {
    [['WM', 2, 1, weight14], ['WS', 3, 1, weight14 * 1.15], ['WZ', 17, 20, weight14 * 1.7], ['YM', 2, 2, weight14], ['RM', 2, 16, weight14]].forEach(([code, kID, cID, w]) => {
      sku(style, `${style.replace(/A$/, '')}${code}-FCYA`, kID, cID, Object.assign({ weight: Math.round(w * 100) / 100, side }, extra || {}));
    });
  }
  simpleFamily('B027-01A', 2.9, []);
  simpleFamily('B140-01A', 3.6, [{ provider: 'Crown (Studio Stock)', stoneCatID: 1, stoneTypeID: 1, stoneKindID: 0, psID: 4, colourID: 7, shapeID: 1, sizeMM: 1.2, qty: 22, settings: [{ qty: 22, settingStyleID: 2, settingLocationID: 4, settingCost: 1 }] }]);
  simpleFamily('B512-01A', 3.1, [{ provider: 'Crown (Studio Stock)', stoneCatID: 1, stoneTypeID: 1, stoneKindID: 0, psID: 4, colourID: 7, shapeID: 1, sizeMM: 1.0, qty: 18, settings: [{ qty: 18, settingStyleID: 0, settingLocationID: 2, settingCost: 1 }] }]);
  simpleFamily('B224-02A', 4.2, [{ provider: 'Crown (Studio Stock)', stoneCatID: 1, stoneTypeID: 1, stoneKindID: 0, psID: 4, colourID: 7, shapeID: 1, sizeMM: 1.5, qty: 30, settings: [{ qty: 30, settingStyleID: 8, settingLocationID: 4, settingCost: 1.5 }] }]);

  // ---- generic custom templates ----
  const CUSTOM = { brand: 'NOAM CARVER FINE JEWELRY-CUSTOM', ringMM: 0, thickness: 0, thicknessBottom: 0, weight: 5.75, labor: CUSTOM_LABOR, side: [], img: 'CUSTOM', defaultFinishingID: 28 };
  [['10K', 1], ['14K', 2], ['18K', 3], ['925', 81], ['Pt950', 17]].forEach(([k, kID]) => {
    sku('CUSTOM-FASHION', `CUSTOM-FASHION-${k}`, kID, 20, Object.assign({}, CUSTOM, { PID: k === '14K' ? 136696 : undefined }));
  });
  ['CUSTOM-BRIDAL', 'CUSTOM-ATELIER', 'CUSTOM-BR', 'CUSTOM-CR', 'CUSTOM-CX', 'CUSTOM-GLOW', 'CUSTOM-LUNA', 'CUSTOM-MC', 'CUSTOM-MF', 'CUSTOM-NCM', 'CUSTOM-STACKABLE', 'CUSTOM-STUDIO', 'Custom'].forEach(style => {
    [['14K', 2], ['18K', 3], ['Pt950', 17]].forEach(([k, kID]) => sku(style, `${style.toUpperCase()}-${k}`, kID, 20, Object.assign({}, CUSTOM, { brand: style === 'CUSTOM-BRIDAL' ? 'NOAM CARVER BRIDAL-CUSTOM' : CUSTOM.brand, labor: style === 'CUSTOM-BRIDAL' ? BRIDAL_LABOR : CUSTOM_LABOR })));
  });

  // ---- CrownRing machine-made bands: the Regular Quotes flow prices these from the B2B catalogue (b2bPrice = unit price in USD) ----
  // WB-046D4W-M10 observed on quote 101610: 4 MM, 14K White, diamond band, unit $1,944.10, retail = quoted price × 2.2
  const band = (style, code, kID, cID, mm, price, brand, extra) => sku(style, code, kID, cID, Object.assign({ brand: brand || 'CROWNRING-WEDDING BANDS', ringMM: mm, thickness: 1.9, thicknessBottom: 1.9, weight: mm * 1.3, labor: BAND_LABOR, img: style, defaultFinishingID: 28, b2bPrice: price }, extra || {}));
  band('WB-046D4W', 'WB-046D4W-M10', 2, 1, 4, 1944.10, 'CROWNRING-DIAMOND', { thickness: 2.5, thicknessBottom: 2.5 });
  band('WB-046D4W', 'WB-046D4W-M10Y', 2, 2, 4, 1944.10, 'CROWNRING-DIAMOND', { thickness: 2.5, thicknessBottom: 2.5 });
  band('WB-046D4W', 'WB-046D4W-S10', 3, 1, 4, 2510.00, 'CROWNRING-DIAMOND', { thickness: 2.5, thicknessBottom: 2.5 });
  band('WB-046D4W', 'WB-046D4W-Z10', 17, 20, 4, 3120.00, 'CROWNRING-DIAMOND', { thickness: 2.5, thicknessBottom: 2.5 });
  band('WB-040D4W', 'WB-040D4W-M10', 2, 1, 4, 1710.00, 'CROWNRING-DIAMOND', { thickness: 2.3, thicknessBottom: 2.3 });
  [['CR-6MM-COMFORT', 6, 1250], ['CR-4MM-COMFORT', 4, 890], ['CR-5MM-DOME', 5, 980], ['CR-8MM-FLAT', 8, 1620]].forEach(([style, mm, price]) => {
    [['14K', 2, 1], ['18K', 3, 1], ['Pt950', 17, 20]].forEach(([k, kID, cID]) => band(style, `${style}-${k}`, kID, cID, mm, k === '14K' ? price : k === '18K' ? Math.round(price * 1.3) : Math.round(price * 1.9)));
  });

  // product images: the live system serves /images/xlarge/<style>.jpg plus three alternate views under /carlex/images/alt1-3/;
  // the POC links to them on crownring.com and falls back to an SVG placeholder when an image is missing (generic customs, demo styles)
  const LIVE = 'https://www.crownring.com';
  function liveImg(p, variant) {
    if (!p.altimg && p.img === 'CUSTOM') return null;
    if (variant === 'side' || !variant) return `${LIVE}/images/xlarge/${p.img}.jpg`;
    const alt = { top: 'alt1', persp: 'alt2', stack: 'alt3' }[variant];
    return alt && p.altimg ? `${LIVE}/carlex/images/${alt}/carlex-ring-wedding-bands-${p.altimg}.jpg` : null;
  }
  const imgCache = {};
  function placeholderImg(code, variant) {
    const key = code + '|' + (variant || '');
    if (imgCache[key]) return imgCache[key];
    const label = code.replace(/-/g, '‑');
    const v = variant || 'side';
    const shapes = {
      side: '<ellipse cx="100" cy="118" rx="62" ry="40" fill="none" stroke="#9a8f80" stroke-width="9"/><ellipse cx="100" cy="72" rx="20" ry="13" fill="#e9f3fb" stroke="#8aa" stroke-width="2"/>',
      top: '<circle cx="100" cy="105" r="58" fill="none" stroke="#9a8f80" stroke-width="9"/><circle cx="100" cy="105" r="18" fill="#e9f3fb" stroke="#8aa" stroke-width="2"/>',
      persp: '<ellipse cx="100" cy="115" rx="60" ry="26" fill="none" stroke="#9a8f80" stroke-width="9" transform="rotate(-18 100 115)"/><ellipse cx="128" cy="78" rx="18" ry="12" fill="#e9f3fb" stroke="#8aa" stroke-width="2"/>',
      stack: '<ellipse cx="100" cy="100" rx="60" ry="24" fill="none" stroke="#9a8f80" stroke-width="8"/><ellipse cx="100" cy="124" rx="60" ry="24" fill="none" stroke="#b8ad9e" stroke-width="8"/>'
    }[v] || '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f7f6f3"/>${shapes}<text x="100" y="186" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">${label}</text></svg>`;
    return (imgCache[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  }

  const byPID = {};
  products.forEach(p => { byPID[p.PID] = p; });
  const styles = [...new Set(products.map(p => p.style))].sort();

  return {
    all: products,
    styles,
    byPID: id => byPID[Number(id)],
    bySKU: code => products.find(p => p.sku === code),
    searchStyles: q => { q = (q || '').trim().toLowerCase(); return q ? styles.filter(s => s.toLowerCase().includes(q)).slice(0, 25) : []; },
    skusOfStyle: style => products.filter(p => p.style === style),
    searchBands: q => { q = (q || '').trim().toLowerCase(); return q ? products.filter(p => p.b2bPrice != null && (p.sku.toLowerCase().includes(q) || p.style.toLowerCase().includes(q))).slice(0, 25) : []; },
    img: (p, variant) => liveImg(p, variant) || placeholderImg(p.img || p.sku, variant),
    placeholder: (p, variant) => placeholderImg(p.img || p.sku, variant),
    laborTotal: l => Object.values(l).reduce((a, b) => a + (Number(b) || 0), 0)
  };
})();
