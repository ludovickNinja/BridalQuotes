/* BridalQuotes POC — rates and configuration the live system pulls on every page load
 * Observed on 2026-11-04: 14K $78.04/g (75.22 the day before), Platinum $49.84/g, exchange rate 1.42,
 * duties 6.5% on gold / labor / side diamonds and 0% elsewhere, markups 1.4 center stone, 2 center-stone
 * setting, 1.7 elsewhere (additional diamond default was 1.7 one day and 2 the next), retail rate label "x 2".
 * Editable on settings.html; stored copy lives in localStorage (see store.js).
 */
window.DEFAULT_RATES = {
  asOf: '2026-11-04',
  goldPerGramPure: 133.7886,        // 24K per gram (14K 78.0433 / 0.58333)
  platinumPerGram: 49.8346,         // per gram for Platinum 950 (displayed 49.84)
  palladiumPerGram: 45.0,
  silverPerGram: 1.65,
  otherPerGram: 5.0,
  exchangeRate: 1.42,               // USD → CAD
  tarif: 0,                         // "T USD" % on the totals table
  discount: 0,                      // applied at order time, 0 on quotes
  retailRate: 2,                    // label says "Retail x 2"; the live code multiplies by 1 (bug #3)
  retailRateApplied: 1,
  duties: { center: 0, setting: 0, side: 6.5, addl: 0, ads: 0, gold: 6.5, labor: 6.5, cad: 0 },
  markups: { center: 1.4, setting: 2, side: 1.7, addl: 1.7, ads: 1.7, gold: 1.7, labor: 1.7, cad: 1.7 },
  expiryDays: 15,
  extensionDays: 15
};

// metal rate per gram for a karat record, given a rates object
window.metalRatePerGram = function (karat, rates) {
  if (!karat) return 0;
  switch (karat.group) {
    case 'gold': return Math.round(rates.goldPerGramPure * karat.purity * 100000000) / 100000000;
    case 'platinum': return rates.platinumPerGram;
    case 'palladium': return rates.palladiumPerGram;
    case 'silver': return rates.silverPerGram;
    default: return rates.otherPerGram;
  }
};
