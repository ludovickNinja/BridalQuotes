/* BridalQuotes POC — lookup tables
 * Read off the live dropdowns of crownring.com/_admin (walkthrough Nov 2–4 2026, see docs/).
 * Where the live list is huge (karats 67, colours 203, finishings 544) only a representative
 * subset is typed here; IDs marked "observed" were seen in the live DOM, the others are
 * placeholders until the tables are exported from the current database.
 */
window.LK = (function () {
  const LK = {};

  // ---- Metal / karat (live list has 67 entries). 14K = id 2 observed. ----
  LK.karats = [
    { id: 1,  name: '10K',               group: 'gold',  purity: 0.4167, loss: 12 },
    { id: 2,  name: '14K',               group: 'gold',  purity: 0.5833, loss: 12 },
    { id: 3,  name: '18K',               group: 'gold',  purity: 0.75,   loss: 12 },
    { id: 4,  name: '19K',               group: 'gold',  purity: 0.7917, loss: 12 },
    { id: 5,  name: '22K',               group: 'gold',  purity: 0.9167, loss: 12 },
    { id: 6,  name: '24K',               group: 'gold',  purity: 1,      loss: 12 },
    { id: 7,  name: 'Platinum 950',      group: 'platinum', purity: 0.95, loss: 20 },
    { id: 8,  name: 'Palladium 950',     group: 'palladium', purity: 0.95, loss: 15 },
    { id: 9,  name: 'Silver 925',        group: 'silver', purity: 0.925, loss: 12 },
    { id: 10, name: 'Tantalum',          group: 'other', purity: 1, loss: 0 },
    { id: 11, name: 'Cobalt',            group: 'other', purity: 1, loss: 0 },
    { id: 12, name: 'Titanium',          group: 'other', purity: 1, loss: 0 },
    { id: 13, name: 'Tungsten',          group: 'other', purity: 1, loss: 0 },
    { id: 14, name: '14K / Platinum 950', group: 'gold', purity: 0.5833, loss: 12 },
    { id: 15, name: '18K / Platinum 950', group: 'gold', purity: 0.75, loss: 12 },
    { id: 16, name: '14K / Ceramic',     group: 'gold', purity: 0.5833, loss: 12 },
    { id: 17, name: '14K / Carbon Fiber', group: 'gold', purity: 0.5833, loss: 12 },
    { id: 18, name: 'N (to confirm)',    group: 'gold',  purity: 0.5833, loss: 12 } // karat code N seen on B552-02WN — meaning not confirmed
  ];

  // ---- Colour (live list has 203). White = 1 and NONE = 20 observed. ----
  LK.colours = [
    { id: 1,  name: 'White' }, { id: 2, name: 'Yellow' }, { id: 3, name: 'Rose' },
    { id: 4,  name: 'Yellow/White' }, { id: 5, name: 'White/Yellow' }, { id: 6, name: 'Rose/White' },
    { id: 7,  name: 'White/Rose' }, { id: 8, name: 'Yellow/Rose' }, { id: 9, name: 'Rose/Yellow' },
    { id: 10, name: 'Black' }, { id: 11, name: 'White/Yellow/Rose' }, { id: 12, name: 'Yellow/White/Yellow' },
    { id: 13, name: 'White/Rose/White' }, { id: 14, name: 'Rose/White/Rose' }, { id: 15, name: 'Green' },
    { id: 16, name: 'Grey' }, { id: 17, name: 'White/Black' }, { id: 18, name: 'Yellow/Black' },
    { id: 19, name: 'Rose/Black' }, { id: 20, name: 'NONE' }
  ];

  // ---- Finishing (live list has 544, mostly wedding-band finishes). All High Polish = 28 observed. ----
  LK.finishings = [
    { id: 0, name: 'None' },
    { id: 28, name: 'All High Polish' },
    { id: 1, name: 'All Satin' }, { id: 2, name: 'All Brushed' }, { id: 3, name: 'All Matte' },
    { id: 4, name: 'All Sandblast' }, { id: 5, name: 'All Hammered' }, { id: 6, name: 'All Stone Finish' },
    { id: 7, name: 'Satin Center / High Polish Edges' }, { id: 8, name: 'Brushed Center / High Polish Edges' },
    { id: 9, name: 'Hammered Center / High Polish Edges' }, { id: 10, name: 'High Polish Center / Satin Edges' },
    { id: 11, name: 'Florentine' }, { id: 12, name: 'Wire Brush' }, { id: 13, name: 'Bark' },
    { id: 14, name: 'Crosshatch' }, { id: 15, name: 'Rock Finish' }, { id: 16, name: 'Linen' },
    { id: 17, name: 'Sand Finish' }, { id: 18, name: 'Ice Finish' }, { id: 19, name: 'Wood Grain' },
    { id: 20, name: 'High Polish / Satin Alternating' }, { id: 21, name: 'Brushed / Polished Alternating' },
    { id: 22, name: 'Matte Center / Polished Rails' }, { id: 23, name: 'Satin Dome' }, { id: 24, name: 'Polished Dome' },
    { id: 25, name: 'Satin Flat' }, { id: 26, name: 'Polished Flat' }, { id: 27, name: 'Mixed (see notes)' }
  ];

  // ---- Ring size: Pending -1, N/A 0, 1.5 … 16.75 by 0.25, then 17, 18, 20, 22, 24 (69 entries) ----
  LK.ringSizes = (function () {
    const out = [{ id: -1, name: 'Pending' }, { id: 0, name: 'N/A' }];
    let id = 1;
    for (let s = 1.5; s <= 16.75 + 1e-9; s += 0.25) out.push({ id: id++, name: String(Math.round(s * 100) / 100), value: Math.round(s * 100) / 100 });
    [17, 18, 20, 22, 24].forEach(s => out.push({ id: id++, name: String(s), value: s }));
    return out;
  })();
  LK.ringSizeByValue = v => LK.ringSizes.find(s => s.value === Number(v));

  // ---- Stones ----
  LK.stoneCategories = [{ id: 1, name: 'Diamond' }, { id: 2, name: 'Gemstone' }];
  LK.stoneTypes = [{ id: 18, name: 'Black' }, { id: 17, name: 'Colored' }, { id: 1, name: 'Diamond' }, { id: 2, name: 'Lab Grown' }];
  LK.stoneKinds = [{ id: 0, name: 'None' }];
  LK.stoneProviders = { // center stone
    center: [{ id: 0, name: 'N/A' }, { id: 1, name: 'Customer' }, { id: 2, name: 'Crownring' }],
    side:   [{ id: 1, name: 'Customer' }, { id: 2, name: 'Crownring' }, { id: 3, name: 'Crown (Studio Stock)' }],
    addl:   [{ id: 1, name: 'Customer' }, { id: 2, name: 'Crownring' }, { id: 3, name: 'Crown (Studio Stock)' }, { id: 4, name: 'Other supplier' }]
  };

  // 49 center-stone shapes as listed in the live image dropdown (Round = 1, Oval = 16 observed)
  const shapeNames = ['Ashoka', 'Asscher', 'Baguette', 'Bullet', 'Cadillac', 'Carré', 'Coffin', 'Cushion', 'Duchess', 'Dutch Marquise',
    'Elongated Cushion', 'Elongated Radiant', 'Emerald', 'Emerald - Portrait', 'Half-Moon', 'Heart', 'Hexagon', 'Kite', 'Lozenge', 'Marquise',
    'Moval', 'Octogon', 'Other', 'Oval', 'Oval Cabochon', 'Pear', 'Princess', 'Radiant', 'Radiant (2)', 'Rhombus',
    'Rose Cut CU', 'Rose Cut OV', 'Rose Cut RD', 'Rough', 'Round', 'Round - Cabochon', 'Round - Old European', 'Round - Old Full Cut',
    'Round - Portrait', 'Round - Single cut', 'Round - Swiss cut', 'Sakura', 'Shield', 'Step Marquise', 'Tapered Baguette',
    'Trapezoid (Step)', 'Trapezoid Brilliant', 'Triangle', 'Trillion'];
  LK.shapes = (function () {
    let next = 2;
    return shapeNames.map(n => {
      if (n === 'Round') return { id: 1, name: n };
      if (n === 'Oval') return { id: 16, name: n };
      while (next === 16) next++;
      return { id: next++, name: n };
    });
  })();
  // side-stone shape list is the 22-entry subset
  const sideShapeNames = ['Round', 'Oval', 'Pear', 'Marquise', 'Princess', 'Baguette', 'Tapered Baguette', 'Emerald', 'Cushion', 'Radiant',
    'Trillion', 'Half-Moon', 'Heart', 'Asscher', 'Hexagon', 'Kite', 'Trapezoid (Step)', 'Bullet', 'Triangle', 'Lozenge', 'Shield', 'Other'];
  LK.sideShapes = sideShapeNames.map(n => LK.shapes.find(s => s.name === n));

  // Diamond size → single-stone weight (ct). 0.9 mm = 0.003 ct observed; 3.4 mm = 0.1575 derived from quote 101587.
  const mmSizes = [
    [0.8, 0.0025], [0.9, 0.003], [1.0, 0.005], [1.1, 0.006], [1.15, 0.007], [1.2, 0.008], [1.25, 0.009], [1.3, 0.01], [1.35, 0.011], [1.4, 0.012],
    [1.45, 0.013], [1.5, 0.015], [1.55, 0.017], [1.6, 0.02], [1.65, 0.022], [1.7, 0.025], [1.75, 0.027], [1.8, 0.028], [1.85, 0.029], [1.9, 0.03],
    [1.95, 0.032], [2.0, 0.035], [2.1, 0.04], [2.2, 0.045], [2.3, 0.05], [2.4, 0.055], [2.5, 0.06], [2.6, 0.07], [2.7, 0.08], [2.75, 0.085],
    [2.8, 0.09], [2.9, 0.10], [3.0, 0.11], [3.1, 0.12], [3.2, 0.13], [3.25, 0.135], [3.3, 0.14], [3.4, 0.15758], [3.5, 0.17], [3.6, 0.19],
    [3.7, 0.20], [3.75, 0.21], [3.8, 0.22], [3.9, 0.24], [4.0, 0.25], [4.25, 0.30], [4.5, 0.36], [4.75, 0.42], [5.0, 0.49], [5.25, 0.56],
    [5.5, 0.65], [5.75, 0.74], [6.0, 0.85], [6.5, 1.08], [7.0, 1.35], [7.5, 1.65], [8.0, 2.02]
  ];
  const ctSizes = [0.25, 0.30, 0.40, 0.50, 0.60, 0.70, 0.75, 0.80, 0.90, 1.00, 1.25, 1.50, 1.75, 2.00, 2.50, 3.00];
  LK.diamondSizes = (function () {
    const out = [];
    let id = 1;
    mmSizes.forEach(([mm, ct]) => out.push({ id: id++, name: String(mm), mm, weight: ct }));
    ctSizes.forEach(ct => out.push({ id: id++, name: ct.toFixed(2) + ' ct (certified)', weight: ct, certified: true }));
    out.push({ id: id++, name: 'One Of Kind', weight: 0 });
    return out;
  })();
  LK.diamondSizeByMM = mm => LK.diamondSizes.find(s => s.mm === Number(mm));

  // Quality (psID). psID 8 = custom (hidden). Lab VS1 = 10 observed.
  LK.qualities = [
    { id: 1, name: 'I1' }, { id: 2, name: 'SI3-I1' }, { id: 3, name: 'SI2' }, { id: 4, name: 'SI1' },
    { id: 5, name: 'CZ', isCost0Allowed: true }, { id: 6, name: 'VS1' }, { id: 10, name: 'Lab VS1' }
  ];
  LK.QUALITY_CUSTOM = 8;

  // Stone colour (live list has 61). id 36 = default on the Lab VS1 costing line (observed id, name assumed).
  LK.stoneColours = [
    { id: 1, name: 'D' }, { id: 2, name: 'E' }, { id: 3, name: 'F' }, { id: 4, name: 'G' }, { id: 5, name: 'H' }, { id: 6, name: 'I' },
    { id: 7, name: 'J' }, { id: 8, name: 'K' }, { id: 9, name: 'L' }, { id: 10, name: 'M' }, { id: 11, name: 'DEF' }, { id: 12, name: 'EF' },
    { id: 13, name: 'FG' }, { id: 14, name: 'GH' }, { id: 15, name: 'HI' }, { id: 16, name: 'IJ' }, { id: 17, name: 'JK' }, { id: 18, name: 'KL' },
    { id: 36, name: 'G-H (lab)' }, { id: 37, name: 'D-F (lab)' }, { id: 38, name: 'E-F (lab)' },
    { id: 40, name: 'Blue' }, { id: 41, name: 'Pink' }, { id: 42, name: 'Green' }, { id: 43, name: 'Red' }, { id: 44, name: 'Yellow' },
    { id: 45, name: 'Champagne' }, { id: 46, name: 'Black' }, { id: 47, name: 'Salt & Pepper' }, { id: 48, name: 'Teal' }, { id: 49, name: 'Purple' },
    { id: 50, name: 'Peach' }, { id: 51, name: 'White (opal/moissanite)' }, { id: 52, name: 'Other' }
  ];

  // Setting style (9) — per-stone cost
  LK.settingStyles = [
    { id: -2, name: 'None', cost: 0 },
    { id: 0, name: 'Default', cost: 1 },
    { id: 1, name: 'French pave', cost: 1.5 },
    { id: 2, name: 'Glow', cost: 4 },
    { id: 3, name: 'Hand pave add on', cost: 5 },
    { id: 4, name: 'My Caroline', cost: 3 },
    { id: 5, name: 'Pave', cost: 1 },
    { id: 6, name: 'Stackable / Studio', cost: 0.7 },
    { id: -1, name: 'Other Charge', cost: null }
  ];

  // Stone placement / setting location (12). Bridge = 11 observed.
  LK.settingLocations = [
    { id: 0, name: 'Default' }, { id: 1, name: 'Band' }, { id: 2, name: 'Basket' }, { id: 11, name: 'Bridge' },
    { id: 3, name: 'Gallery' }, { id: 4, name: 'Halo' }, { id: 5, name: 'Head' }, { id: 6, name: 'Peekaboo' },
    { id: 7, name: 'Shank' }, { id: 8, name: 'Side stone' }, { id: 9, name: 'Prongs' }, { id: 10, name: 'Other' }
  ];

  // Center-stone setting charge (9) — observed ids and costs
  LK.settingCharges = [
    { id: 0, name: 'None', cost: 0 },
    { id: 13, name: 'Center Stone', cost: 40 },
    { id: 18, name: 'CrownRing Providing', cost: 0 },
    { id: 8, name: 'Customer Providing', cost: 10 },
    { id: 14, name: 'Glow', cost: 4 },
    { id: 4, name: 'Melees', cost: 1 },
    { id: 9, name: 'Stackable / Studio', cost: 0.7 },
    { id: 16, name: 'Volume Providing', cost: 5 },
    { id: -1, name: 'Other Charge', cost: null }
  ];

  // CAD print fee tiers (19). Only "03. Frankenstein / Simple ER" = $40 was observed; other amounts are placeholders.
  LK.cadPrintFees = [
    { id: 0, name: 'None', cost: 0 },
    { id: 1, name: '01. Brainpower', cost: 20 },
    { id: 2, name: '02. CAD Required / Basic Band', cost: 30 },
    { id: 3, name: '03. Frankenstein / Simple ER', cost: 40 },
    { id: 4, name: '04. Lil Spicy', cost: 55 },
    { id: 5, name: '05. Med. Spicy', cost: 70 },
    { id: 6, name: '06. Spicy', cost: 85 },
    { id: 7, name: '07. Legit Spicy', cost: 100 },
    { id: 8, name: '08. Extra Spicy', cost: 125 },
    { id: 9, name: '09. Deluxe', cost: 150 },
    { id: 10, name: '10. Extra Deluxe', cost: 200 },
    { id: 11, name: '11. Rina Extra Fee', cost: 25 },
    { id: 12, name: '20+ Refs of the SAME', cost: 15 },
    { id: 13, name: 'Client is an Engineer or Surgeon', cost: 75 },
    { id: 14, name: 'Dodgie is annoying fee', cost: 10, joke: true },
    { id: 15, name: 'When Vicky is tired', cost: 20, joke: true },
    { id: 16, name: 'Rush CAD', cost: 60 },
    { id: 17, name: 'Re-do CAD', cost: 30 },
    { id: 18, name: 'Viewer project', cost: 50 }
  ];

  // Customization sections (modelTypeID observed)
  LK.modelTypes = [
    { id: 5, name: 'Gallery' }, { id: 3, name: 'Head' }, { id: 4, name: 'Shank' }, { id: 7, name: 'Band' },
    { id: 10, name: 'Pendant' }, { id: 11, name: 'Bracelet' }, { id: 12, name: 'Earrings' }, { id: 13, name: 'Other' }
  ];
  LK.DEFAULT_MODEL_TYPE = 1; // "Default Model" (hidden modelTypeID1 on the main style block)

  // Modification options (live list has 41 with images) — representative subset
  LK.modifications = [
    { id: 1, name: 'Petal Basket Head' }, { id: 2, name: 'Hidden Halo' }, { id: 3, name: 'Diamonds on Bridge' },
    { id: 4, name: 'Cathedral Shank' }, { id: 5, name: 'Split Shank' }, { id: 6, name: 'Tapered Shank' },
    { id: 7, name: 'Pave Shank' }, { id: 8, name: 'Knife Edge Shank' }, { id: 9, name: 'Bezel Setting' },
    { id: 10, name: '4 Prong Head' }, { id: 11, name: '6 Prong Head' }, { id: 12, name: 'Double Claw Prongs' },
    { id: 13, name: 'Milgrain Edge' }, { id: 14, name: 'Open Gallery' }, { id: 15, name: 'Closed Gallery' },
    { id: 16, name: 'Peekaboo Stones' }, { id: 17, name: 'Bypass Shank' }, { id: 18, name: 'Twisted Shank' },
    { id: 19, name: 'Euro Shank' }, { id: 20, name: 'Comfort Fit' }
  ];

  // Design approval request types (8)
  LK.approvalRequestTypes = [
    { id: 1, name: 'CLIQ' }, { id: 2, name: 'Matching Sample' }, { id: 3, name: 'Need Factory Quote' }, { id: 4, name: 'Renderings' },
    { id: 5, name: 'Stone Count / Weight' }, { id: 6, name: 'Vadim Prepping' }, { id: 7, name: 'Viewer Project' }, { id: 8, name: 'Wax' }
  ];
  LK.priorities = [{ id: 1, name: 'High' }, { id: 2, name: 'Medium' }, { id: 3, name: 'Low' }];
  // 57 time slots from 08:00 AM in 15-minute steps
  LK.timeSlots = (function () {
    const out = [];
    for (let m = 8 * 60; m <= 22 * 60; m += 15) {
      const h = Math.floor(m / 60), mm = m % 60;
      const h12 = ((h + 11) % 12) + 1, ap = h < 12 ? 'AM' : 'PM';
      out.push(String(h12).padStart(2, '0') + ':' + String(mm).padStart(2, '0') + ap);
    }
    return out;
  })();

  LK.certs = [{ id: 0, name: 'None' }, { id: 1, name: 'GIA' }, { id: 2, name: 'IGI' }, { id: 3, name: 'GCAL' }, { id: 4, name: 'AGS' },
    { id: 5, name: 'HRD' }, { id: 6, name: 'EGL' }, { id: 7, name: 'Other' }];

  LK.matchBandTypes = [{ id: 1, name: 'Serial#' }, { id: 2, name: 'Invoice#' }, { id: 3, name: 'PO#' }, { id: 4, name: 'Web#' }];

  // Price per carat by quality (bridalCost_getPricePerCarat). Lab VS1 melee = $120/ct observed; others placeholders.
  LK.pricePerCarat = function (psID, sizeRec) {
    const base = { 1: 150, 2: 200, 3: 280, 4: 350, 5: 5, 6: 450, 10: 120 }[Number(psID)];
    if (base == null) return 0;
    if (sizeRec && sizeRec.certified) return base * 4; // certified center-size goods priced differently — placeholder
    return base;
  };

  // helpers
  LK.name = (list, id) => { const r = list.find(x => x.id === Number(id)); return r ? r.name : ''; };
  LK.rec = (list, id) => list.find(x => x.id === Number(id));
  return LK;
})();
