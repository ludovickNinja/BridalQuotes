/* BridalQuotes POC — pricing engine
 * A faithful, pure-function transcription of loadTotals_binding() and the per-section cost fields of the
 * live ring editor (quote_customBridal.asp). Same formulas, same rounding, same defaults:
 *
 *   goldCost        = ratePerGram × finishedGramWeight × (1 + loss%) + extraChargePerPiece
 *   laborCost       = Σ labor fields
 *   side group      = singleWeight × qty × pricePerCarat + Σ setting rows (qty × settingCost)
 *   center stone    = stoneCost (Crownring-supplied: weight × price per carat; customer stone: 0)
 *   final(row)      = cost × (1 + duties/100) × qty
 *   sell(row)       = cost × (1 + duties/100) × markup × qty
 *   sell USD        = round(Σ sell)            sell CAD = round(Σ sell × exchangeRate)
 *   retail          = (lock > 0 ? lock : sell) × retailRateApplied(=1) × (1 + tarif%) × (1 − discount%)
 *   gross margin %  = (Σ sell − Σ final) / Σ sell × 100
 */
window.PRICING = (function () {
  const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
  const num = n => Number(n) || 0;

  function goldCost(g) {
    return r2(num(g.rate) * num(g.weight) * (1 + num(g.loss) / 100) + num(g.extra));
  }
  function laborCost(l) {
    return r2(['costingLabor', 'rhodium', 'polishing', 'laserEngraving', 'extra1', 'extra2', 'handEngra', 'millgrain', 'CADFee', 'chainFee', 'giftBox', 'SPIFF', 'eagleClaw']
      .reduce((a, k) => a + num(l[k]), 0));
  }
  function sideGroup(g) {
    const size = LK.rec(LK.diamondSizes, g.sizeID);
    const singleWeight = size ? size.weight : 0;
    const DWext = singleWeight * num(g.qty);
    const dCost = DWext * num(g.pricePerCarat);
    const rows = (g.settings || []).map(s => Object.assign({}, s, { ext: num(s.qty) * num(s.settingCost) }));
    const settingTotal = rows.reduce((a, s) => a + s.ext, 0);
    return { singleWeight, DWext: Math.round(DWext * 10000) / 10000, dCost: r2(dCost), rows, settingTotal: r2(settingTotal), total: r2(dCost + settingTotal) };
  }
  function sideTotals(side) {
    let qty = 0, DW = 0, cost = 0;
    (side || []).forEach(g => { const c = sideGroup(g); qty += num(g.qty); DW += c.DWext; cost += c.total; });
    return { qty, DW: Math.round(DW * 10000) / 10000, cost: r2(cost) };
  }
  function centerCost(cdi) {
    if (!cdi || cdi.stoneProvider !== 'Crownring') return 0; // only a Crownring-supplied stone carries a cost
    if (cdi.stoneCost != null && cdi.stoneCost !== '') return r2(cdi.stoneCost);
    return r2(num(cdi.DW) * num(cdi.pricePerCarat) * (num(cdi.qty) || 1));
  }
  function addlCost(b) {
    if (b.stoneProvider === 'Customer' || b.stoneProvider === '') return 0; // customer stone
    if (b.stoneCost != null && b.stoneCost !== '') return r2(b.stoneCost);
    return r2(num(b.DW) * num(b.pricePerCarat));
  }

  function totals(ring, rates) {
    const R = rates || window.DEFAULT_RATES;
    const d = Object.assign({}, R.duties, ring.duties || {});
    const m = Object.assign({}, R.markups);
    const gold = goldCost(ring.gold || {});
    const labor = laborCost(ring.labor || {});
    const side = sideTotals(ring.side);
    const center = centerCost(ring.cdi);
    const scsi = (ring.scsi && num(ring.scsi.sendStone4Setting) === 1) ? r2(ring.scsi.settingCost) : 0;
    const cad = ring.otherFee ? r2(num(ring.otherFee.cost) * (num(ring.otherFee.qty) || 1)) : 0;
    const ads = (ring.ads && num(ring.ads.sendStone4Setting) === 1) ? r2(num(ring.ads.settingCost) * (num(ring.ads.qty) || 1)) : 0;

    const rows = [];
    const push = (key, label, cost, duties, markup, qty, extra) => {
      const final = cost * (1 + duties / 100) * qty;
      const sell = cost * (1 + duties / 100) * markup * qty;
      rows.push(Object.assign({ key, label, cost: r2(cost), duties, markup: num(markup), qty, final: r2(final), sell: r2(sell), _final: final, _sell: sell }, extra || {}));
    };
    push('center', 'Center Diamond', center, d.center, ring.cdi && ring.cdi.markup != null ? ring.cdi.markup : m.center, 1, { pending: !!(ring.cdi && ring.cdi.isPending && ring.cdi.stoneProvider !== '') });
    push('setting', 'Setting Center Stone', scsi, d.setting, ring.scsi && ring.scsi.markup != null ? ring.scsi.markup : m.setting, 1, { pending: !!(ring.scsi && num(ring.scsi.sendStone4Setting) === -1 && ring.cdi && ring.cdi.stoneProvider !== '') });
    (ring.addl || []).forEach((b, i) => push('addl' + i, 'Additional Diamond ' + (i + 1), addlCost(b), d.addl, b.markup != null ? b.markup : m.addl, num(b.qty) || 1, { pending: !!b.isPending, adID: b.adID }));
    if (!ring.addl || !ring.addl.length) push('addl0', 'Additional Diamond 1', 0, d.addl, m.addl, 1);
    push('ads', 'Additional Diamond Setting', ads, d.ads, ring.ads && ring.ads.markup != null ? ring.ads.markup : m.ads, 1, { pending: !!(ring.ads && ring.ads.isPending) });
    push('gold', 'Gold Charge', gold, d.gold, ring.gold && ring.gold.markup != null ? ring.gold.markup : m.gold, 1);
    push('labor', 'Labor Charge', labor, d.labor, ring.labor && ring.labor.markup != null ? ring.labor.markup : m.labor, 1);
    push('side', 'Side Diamonds', side.cost, d.side, ring.SD_markup != null ? ring.SD_markup : m.side, 1);
    push('cad', 'Cad Print Fee', cad, d.cad, ring.otherFee && ring.otherFee.markup != null ? ring.otherFee.markup : m.cad, 1, { pending: !!(ring.otherFee && ring.otherFee.isPending) });

    const totalFinalCost = r2(rows.reduce((a, r) => a + r._final, 0));
    const sellRaw = rows.reduce((a, r) => a + r._sell, 0);
    const fx = ring.exchangeRate != null && ring.exchangeRate !== '' ? num(ring.exchangeRate) : R.exchangeRate;
    const isFinalPrice0 = !!ring.isFinalPrice0;
    const sellUSD = isFinalPrice0 ? 0 : Math.round(sellRaw);
    const sellCAD = isFinalPrice0 ? 0 : Math.round(sellRaw * fx);
    const tarif = ring.tarif != null && ring.tarif !== '' ? num(ring.tarif) : R.tarif;
    const discount = ring.discount != null && ring.discount !== '' ? num(ring.discount) : R.discount;
    const lockUSD = num(ring.lockPriceUSD), lockCAD = num(ring.lockPriceCAD);
    const retailMult = R.retailRateApplied == null ? 1 : R.retailRateApplied;
    const baseUSD = lockUSD > 0 ? lockUSD : sellUSD;
    const baseCAD = lockCAD > 0 ? lockCAD : sellCAD;
    const retailUSD = r2(baseUSD * retailMult * (1 + tarif / 100) * (1 - discount / 100));
    const retailCAD = r2(baseCAD * retailMult * (1 + tarif / 100) * (1 - discount / 100));
    const tarifPriceUSD = r2(sellUSD * (1 + tarif / 100));
    const discountPriceUSD = r2(tarifPriceUSD * (1 - discount / 100));
    const grossMargin = sellUSD > 0 ? r2((sellUSD - totalFinalCost) / sellUSD * 100) : 0;

    const flags = [];
    if (num(ring.ringSize) === -1 || ring.ringSize == null) flags.push('* Size Pending');
    if (num(ring.design && ring.design.needsApproval) === 1 && !(ring.design && ring.design.approved4Prod)) flags.push('* Pending design approval');
    rows.filter(r => r.pending).forEach(r => flags.push('* ' + r.label + ' Pending'));

    return {
      rows, gold, labor, side, center, scsi, cad, ads,
      totalFinalCost, sellRaw: r2(sellRaw), sellUSD, sellCAD, fx, tarif, discount, retailUSD, retailCAD,
      tarifPriceUSD, discountPriceUSD, grossMargin, lockUSD, lockCAD, retailRateLabel: R.retailRate, flags
    };
  }

  // Ludovick's lock rule: sell price rounded up to the nearest $5
  const roundUp5 = n => Math.ceil((Number(n) || 0) / 5) * 5;

  return { goldCost, laborCost, sideGroup, sideTotals, centerCost, addlCost, totals, roundUp5, r2 };
})();
