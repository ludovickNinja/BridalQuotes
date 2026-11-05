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

  // side-stone costing line of B552-02: the 16 × 0.9 mm hidden halo (bcdcid 248220 observed)
  const halo = (psID) => [{ bcdcID: 248220, provider: 3, stoneCatID: 1, stoneTypeID: 1, stoneKindID: 0, psID, colourID: 36, shapeID: 1, sizeMM: 0.9, qty: 16,
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
  const W = { M: [2, 1, 3.2], N: [18, 1, 3.2], S: [3, 1, 3.67], Z: [7, 20, 5.44] }; // karat letter → [karatID, colourID, default weight]
  function family(style, colourLetter, colourID, lab, variant) {
    Object.entries(W).forEach(([k, [karatID, cID, weight]]) => {
      if (karatID === 18 && !lab) return;            // WN only seen on the Lab style
      if (karatID === 7 && colourLetter !== 'W') return; // platinum only in white
      const code = `B552-02${colourLetter}${k}${lab ? '-Lab' : ''}-FCYA`;
      const observed = { 'B552-02WM-Lab-FCYA': 167161, 'B552-02WN-Lab-FCYA': 197326, 'B552-02WS-Lab-FCYA': 167163, 'B552-02WZ-Lab-FCYA': 167165 }[code];
      sku(style, code, karatID, karatID === 7 ? 20 : colourID, Object.assign({}, b552, { PID: observed, weight, side: halo(lab ? 10 : 6), variant }));
    });
  }
  [['B552-02A', 'W', 1], ['B552-02YA', 'Y', 2], ['B552-02RA', 'R', 3], ['B552-02YWA', 'YW', 4]].forEach(([s, l, c]) => { family(s, l, c, false, 'A'); family(s + '-Lab', l, c, true, 'A'); });
  [['B552-02B', 'W', 1], ['B552-02YB', 'Y', 2], ['B552-02RB', 'R', 3]].forEach(([s, l, c]) => family(s, l, c, false, 'B'));

  // ---- a few more bridal styles so the style search feels real (demo data) ----
  function simpleFamily(style, weight14, side, extra) {
    [['WM', 2, 1, weight14], ['WS', 3, 1, weight14 * 1.15], ['WZ', 7, 20, weight14 * 1.7], ['YM', 2, 2, weight14], ['RM', 2, 3, weight14]].forEach(([code, kID, cID, w]) => {
      sku(style, `${style.replace(/A$/, '')}${code}-FCYA`, kID, cID, Object.assign({ weight: Math.round(w * 100) / 100, side }, extra || {}));
    });
  }
  simpleFamily('B027-01A', 2.9, []);
  simpleFamily('B140-01A', 3.6, [{ provider: 3, stoneCatID: 1, stoneTypeID: 1, stoneKindID: 0, psID: 6, colourID: 14, shapeID: 1, sizeMM: 1.2, qty: 22, settings: [{ qty: 22, settingStyleID: 5, settingLocationID: 7, settingCost: 1 }] }]);
  simpleFamily('B512-01A', 3.1, [{ provider: 3, stoneCatID: 1, stoneTypeID: 1, stoneKindID: 0, psID: 6, colourID: 14, shapeID: 1, sizeMM: 1.0, qty: 18, settings: [{ qty: 18, settingStyleID: 0, settingLocationID: 4, settingCost: 1 }] }]);
  simpleFamily('B224-02A', 4.2, [{ provider: 3, stoneCatID: 1, stoneTypeID: 1, stoneKindID: 0, psID: 6, colourID: 14, shapeID: 1, sizeMM: 1.5, qty: 30, settings: [{ qty: 30, settingStyleID: 1, settingLocationID: 7, settingCost: 1.5 }] }]);

  // ---- generic custom templates ----
  const CUSTOM = { brand: 'NOAM CARVER FINE JEWELRY-CUSTOM', ringMM: 0, thickness: 0, thicknessBottom: 0, weight: 5.75, labor: CUSTOM_LABOR, side: [], img: 'CUSTOM', defaultFinishingID: 28 };
  [['10K', 1], ['14K', 2], ['18K', 3], ['925', 9], ['Pt950', 7]].forEach(([k, kID]) => {
    sku('CUSTOM-FASHION', `CUSTOM-FASHION-${k}`, kID, 20, Object.assign({}, CUSTOM, { PID: k === '14K' ? 136696 : undefined }));
  });
  ['CUSTOM-BRIDAL', 'CUSTOM-ATELIER', 'CUSTOM-BR', 'CUSTOM-CR', 'CUSTOM-CX', 'CUSTOM-GLOW', 'CUSTOM-LUNA', 'CUSTOM-MC', 'CUSTOM-MF', 'CUSTOM-NCM', 'CUSTOM-STACKABLE', 'CUSTOM-STUDIO', 'Custom'].forEach(style => {
    [['14K', 2], ['18K', 3], ['Pt950', 7]].forEach(([k, kID]) => sku(style, `${style.toUpperCase()}-${k}`, kID, 20, Object.assign({}, CUSTOM, { brand: style === 'CUSTOM-BRIDAL' ? 'NOAM CARVER BRIDAL-CUSTOM' : CUSTOM.brand, labor: style === 'CUSTOM-BRIDAL' ? BRIDAL_LABOR : CUSTOM_LABOR })));
  });

  // ---- a couple of CrownRing machine-made bands (these belong to the Regular Quotes flow; here only so the search is not empty) ----
  [['CR-6MM-COMFORT', 6], ['CR-4MM-COMFORT', 4]].forEach(([style, mm]) => {
    [['14K', 2], ['18K', 3]].forEach(([k, kID]) => sku(style, `${style}-${k}`, kID, 1, { brand: 'CROWNRING-WEDDING BANDS', ringMM: mm, thickness: 1.9, thicknessBottom: 1.9, weight: mm * 1.3, labor: BAND_LABOR, img: 'CR-BAND', defaultFinishingID: 1 }));
  });

  // placeholder product image (the live system serves /images/xlarge/<sku>.jpg)
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
    img: (p, variant) => placeholderImg(p.img || p.sku, variant),
    laborTotal: l => Object.values(l).reduce((a, b) => a + (Number(b) || 0), 0)
  };
})();
