/* The quote email as the server builds it for CBR_sendEmail / COPY EMAIL (isRetail toggles the retail-priced variant).
 * The live template was not captured verbatim; this reproduces its content: greeting, the quoter's comments
 * (when "Include in email" is ticked), one line per active ring with a link to its customer summary page, the expiry. */
window.EMAIL = (function () {
  const { esc, money } = UI;
  function build(quote, rings, opts) {
    opts = opts || {};
    const acc = ACCOUNTS.byID(quote.uaID); const cur = acc ? acc.currency : 'USD';
    const active = rings.filter(r => r.isEnabled === 1);
    const base = location.href.replace(/[^/]*$/, '');
    let rows = '';
    active.forEach(r => {
      const p = PRODUCTS.byPID(r.PID);
      const t = PRICING.totals(r, DB.rates());
      let price = DB.ringPrice(r);
      if (opts.isRetail) price = cur === 'CAD' ? t.retailCAD : t.retailUSD;
      rows += `<tr><td>${r.CBRID}</td><td>${esc(r.ringName || (p ? p.sku + '-C' : ''))}${r.ringName && p ? '<br><span style="color:#666">' + esc(p.sku) + '-C</span>' : ''}</td>
        <td>${esc(LK.name(LK.karats, r.karatID))} ${esc(LK.name(LK.colours, r.colourID))}</td><td>${r.ringSize === -1 ? 'Pending' : r.ringSize === 0 ? 'N/A' : esc(r.ringSize)}</td><td>${r.qty}</td>
        <td style="text-align:right">${money(price, cur)}</td><td><a href="${base}summary.html?CBRUID=${r.CBRUID}">view</a></td></tr>`;
    });
    const total = active.reduce((a, r) => a + (opts.isRetail ? (cur === 'CAD' ? PRICING.totals(r, DB.rates()).retailCAD : PRICING.totals(r, DB.rates()).retailUSD) : DB.ringPrice(r)) * (r.qty || 1), 0);
    const subject = `CrownRing Custom Bridal Quote# ${quote.quoteID}${quote.ctName ? ' - ' + quote.ctName : ''}`;
    const html = `<div class="email-preview">
      <p><b>Subject:</b> ${esc(subject)}<br><b>To:</b> ${esc((quote.ctEmails || []).join('; '))}</p>
      <p>Hello ${esc(quote.ctName || '')},</p>
      <p>Please find below your Custom Bridal quote # ${quote.quoteID}${opts.isRetail ? ' (retail pricing)' : ''}.</p>
      ${quote.isCommIncludEmail && quote.comments ? `<p>${esc(quote.comments).replace(/\n/g, '<br>')}</p>` : ''}
      <table><thead><tr><th>Ref#</th><th>Ring</th><th>Metal</th><th>Size</th><th>Qty</th><th>Price (${cur})</th><th></th></tr></thead><tbody>${rows}</tbody>
      <tfoot><tr><td colspan="5" style="text-align:right"><b>Total</b></td><td style="text-align:right"><b>${money(total, cur)}</b></td><td></td></tr></tfoot></table>
      <p>This quote is valid until <b>${quote.expiry}</b>. Prices are locked until then; after that date the quote is re-priced at the metal rate of the day.</p>
      <p>Once your customer approves, please mark the quote "Approved by client" on your CrownRing B2B account and we will convert it to an order.</p>
      <p>Thank you,<br>CrownRing Bridal House · Noam Carver<br>${esc(DB.USER)}</p>
      <p style="color:#888;font-size:11px">Attachment: ${esc(opts.fileName || `CBR_${quote.quoteID}.pdf`)}</p>
    </div>`;
    return { subject, html };
  }
  return { build };
})();
