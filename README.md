# BridalQuotes — POC for the new CrownRing quote tool

A static GitHub Pages rebuild of the Custom Bridal quoting tool (crownring.com/_admin, Quotes module), built from the walkthrough of Nov 2–4 2026. This first pass is a **1:1 clone** of the current behaviour — same screens, same fields and options, same section order, same pricing math and the same quirks — so it can serve as the baseline for the improved quote experience.

## Run it

- GitHub Pages: Settings → Pages → Source "Deploy from a branch", branch `main`, folder `/ (root)`. The site is then at `https://<user>.github.io/BridalQuotes/`.
- Locally: open `index.html` through any static server (`python -m http.server` in this folder, then http://localhost:8000/). Opening the files directly from disk also works in most browsers, but the ring editor tab then cannot refresh the quote header tab.

Everything is plain HTML/CSS/JS with no build step and no dependencies. The "database" is one JSON document in the browser's localStorage, seeded with the two quotes entered during the walkthrough; Rates & Settings has Export / Import / Reset.

## What is in it

| Screen | File | Stand-in for |
| --- | --- | --- |
| Quote list, two tabs, filters, paging, legend, delete, 15-day extension, export | `index.html` + `assets/js/list.js` | `quote.asp` |
| Billing overlay (account smart search → shipping, contact name, contact emails) | in `list.js` | `quote_customBridal_act.asp` act=bridalQuote_add |
| Quote header: billing/shipping, ADD A RING, ring rows (status, qty, Duplicate, Preview, Ring/Production/Admin notes, Viewer links, Accept/Decline), total, email block, SEND (PDF build + polling + email), COPY EMAIL, admin internal comments, dismiss approval | `quote.html` + `assets/js/header.js`, `assets/js/email.js` | `quoteCBR.asp`, `quote_act.asp` |
| Ring editor: style search → SKU → OK, style details + Ring Details popup, size, finishing, Customize blocks, Center Diamond Info, Setting Center Stone, Fancy photo request, Gold, Labor, Side diamonds (groups + setting rows), Additional diamonds + setting, Design approval, CAD print fee, Totals (duties, markups, lock, retail, tariff, discount, gross margin, final price $0), 3D viewer links, Rendering section, PDF history, notes, matching band, production notes, invoice instructions, Completed NO/YES with the pending-item checks and SKIP, SAVE & CONTINUE / SAVE & EXIT, View preview, Update Log | `ring.html` + `assets/js/ring.js` | `quote_customBridal.asp` (loadingStep state machine) |
| Customer-facing summary per ring (+ a button to simulate the store's B2B approval and the conversion to order) | `summary.html` | `/quote_custom_summary.asp?CBRUID=` |
| Rates & settings (metal rates, exchange rate, duties, markups, validity) and demo-data export/import/reset | `settings.html` | server-side configuration |
| Regular quote: billing/shipping, ADD A QUOTE (catalogue search), lines with size / qty / quoted price / discount / note / Completed, Remove All, contact block, Subtotal / Total / Retail (× 2.2), Preview, Send/resend, Update, Reset | `quoteEdit.html` | `quoteEdit.asp` (captured read-only on 2026-11-05, see `docs/capture-2026-11-05.md`) |
| Job bag preview per ring (production sheet) | `jobbag.html` | `JobBagpdf/` via `html2PDF_txt()` — layout not captured, same data |

Engine and data:

- `assets/js/pricing.js` — the pricing engine, a transcription of `loadTotals_binding()`. It reproduces every figure of the walkthrough: rings 57056/57069/57081/57085 ($883→$885, $968→$970, $878→$880, $963→$965, quote total $3,700, gross margin 41.9–42.0 %) and ring 57091 ($492.00 before duties, $890.77 sell, $1,265 CAD, lock $895).
- `assets/js/store.js` — records (quote, ring and its child records exactly as `save2quote` posts them), the seed, one transactional save per ring, the Completed / red "!" logic.
- `assets/js/data/live-lookups.json` + `live-lookups.js` — every option list of the live ring editor, exported from the DOM on 2026-11-05 with the real IDs, labels and data-costs (67 karats, 202 colours, 544 finishings, 69 sizes, 49 + 22 shapes, 74 diamond sizes, qualities, 61 stone colours, setting styles / locations / charges, 19 CAD tiers with their amounts, 40 modifications with image paths, 57 time slots). `lookups.js` builds the tables from it and adds what the DOM does not expose (metal purity and loss by karat name, stone weight per size, prices per carat).
- `assets/js/data/products.js` — the B552-02 family (incl. the observed PIDs 167161 / 197326 / 167163 / 167165), CUSTOM-FASHION-* (PID 136696) and the other generic customs, a few demo bridal styles so the style search has results, and the CrownRing bands with a B2B price for the regular flow (WB-046D4W-M10 at $1,944.10 as observed). Each SKU carries its costing sheet (weight, labor lines, side-stone lines). Product images are linked from crownring.com (`/images/xlarge/<style>.jpg` and the three alternate views) with an SVG fallback.
- `assets/js/data/accounts.js` — Crown Samples (2875), Friends and Family Montreal (2954) / USA (4546) and demo retailers.
- `assets/js/data/rates.js` — rates of 2026-11-04 (14K $78.04/g, Pt $49.84/g, FX 1.42, duties, markups).

## Look and feel

The POC looks like the current web admin (crownring.com/_admin), so a quoter can move between the two without relearning anything. `assets/css/app.css` is a transcription of the admin's own styles (b2b/styles.css, the inline style blocks of quote.asp / quoteCBR.asp / quote_customBridal.asp and the computed styles read on 2026-11-05): Verdana 11px on white, the centered `#tblGlobalContent` with the grey logo strip and "WEB ADMINISTRATION", the black HOME / MENU / LOGOUT bar with "Today is …", the 3px dark bar on the left of the content, the quote list with its grey header row, alternating rows, legend colours (converted #ebeeff, approved #f0d9d9, pending #f0f0f0) and the two tabs, the ring editor with the red rounded style box, the pink / grey / green section boxes, labels above the fields, the totals table (dark "Metal:" header, grey sell column, blue TOTAL, orange gross margin, blue lock cell), the YES / NO Completed toggle and the SAVE & CONTINUE / SAVE & EXIT buttons.

The admin's background strips, logo and icons (plus / minus / edit, note.svg, icon.remove.gif, plus.gif, tab_bkg.gif, the Quick-Add button background) are linked straight from crownring.com, as are the product images; they load without a login. Each has a plain fallback (text, or an inline SVG for the icons) for machines that cannot reach crownring.com. Only the customer-facing summary and the job bag preview, which are not admin screens, keep their own simple layout. No web fonts, no build step.

## Deliberately not 1:1

Five things differ from the live system, all data-loss or display bugs listed in the system map; everything else (including "Retail x 2" multiplying by 1, the USD-only lock, size-pending blocking Completed, the SKIP that produces the red "!") is reproduced as is. The POC is meant to be a 1:1 of the current quote system without its bugs, so anything else that differs is a bug of the POC — please report it.

1. The labor **Chain** field is saved (live: lost on save, bug #1).
2. A ring is saved in **one** transaction instead of 15–30 sequential posts (bug #5); the quote is still created on the first ring save, as live.
3. Shipping addresses show their text instead of blank labels (bug #9); the duplicate/case-variant emails of the Friends and Family account are kept so the picker shows the problem.
4. The account smart search does not pass SQL from the browser (bug #10).
5. SEND does not actually email anything or build a PDF; it runs the same guards, simulates the `CBR_PDFready` polling, records the PDF in the ring's history and sets "Last Sent".

## Placeholders to replace with real exports

Marked in the data files: the costing sheets of the demo styles and bands, the stone weight per diamond size (sieve chart), prices per carat other than Lab VS1 melee ($120/ct observed), the certs list and the approval-request-type IDs, the regular-quote cost form. The email, summary and job-bag templates were not captured verbatim and are reconstructed from their content.

## Reference material from the walkthrough

- `docs/Custom-Bridal-Quote-Procedure.md` — how a quote is made today, with Ludovick's rules and worked examples (quotes 101575 and 101587).
- `docs/Quote-System-Map.md` — screens, data model, pricing formulas, endpoints, lookup tables, known bugs, improvement backlog, what is still to capture.
- `docs/walkthrough-captures.md` — raw page-by-page notes from the walkthrough.
- `docs/capture-2026-11-05.md` — second read-only visit: the Regular quote screen (quoteEdit.asp), the lookup-table export, and layout details of the live screens.
- `reference/quoteCBR_inline.js` — the quote header page's JavaScript with an endpoint summary.
- `reference/images/` — the sample store request, the two reference photos, and the factory spec sheet for CUN00269 (copied to `assets/img/` for the seed data).

Living copies (editable, with the backlog tracker):
- Procedure: https://claude.ai/artifact/UjfxtTfqJPHyaco1fexG84
- System map: https://claude.ai/artifact/PuFTq4dT8FiVJLG2V2S4Zk

## Next

The backlog in the system map (fold Regular Quotes in as a product kind, contacts from the central list, server-side pricing with snapshots, one-step lock in both currencies, pending items as fields…) is what the second pass builds on top of this baseline.
