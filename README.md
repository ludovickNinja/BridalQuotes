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
| Regular quote | `quoteEdit.html` | `quoteEdit.asp` — **not captured yet**, placeholder only |

Engine and data:

- `assets/js/pricing.js` — the pricing engine, a transcription of `loadTotals_binding()`. It reproduces every figure of the walkthrough: rings 57056/57069/57081/57085 ($883→$885, $968→$970, $878→$880, $963→$965, quote total $3,700, gross margin 41.9–42.0 %) and ring 57091 ($492.00 before duties, $890.77 sell, $1,265 CAD, lock $895).
- `assets/js/store.js` — records (quote, ring and its child records exactly as `save2quote` posts them), the seed, one transactional save per ring, the Completed / red "!" logic.
- `assets/js/data/lookups.js` — lookup tables read off the live dropdowns (69 ring sizes, 49 shapes, 74 diamond sizes with weights, qualities, setting styles and charges, placements, CAD tiers, customization sections, approval types…). Karats, colours and finishings are representative subsets of the 67 / 203 / 544 live entries.
- `assets/js/data/products.js` — the B552-02 family (incl. the observed PIDs 167161 / 197326 / 167163 / 167165), CUSTOM-FASHION-* (PID 136696) and the other generic customs, plus a few demo bridal styles so the style search has results. Each SKU carries its costing sheet (weight, labor lines, side-stone lines).
- `assets/js/data/accounts.js` — Crown Samples (2875), Friends and Family Montreal (2954) / USA (4546) and demo retailers.
- `assets/js/data/rates.js` — rates of 2026-11-04 (14K $78.04/g, Pt $49.84/g, FX 1.42, duties, markups).

## Deliberately not 1:1

Five things differ from the live system, all data-loss or display bugs listed in the system map; everything else (including "Retail x 2" multiplying by 1, the USD-only lock, size-pending blocking Completed, the SKIP that produces the red "!") is reproduced as is.

1. The labor **Chain** field is saved (live: lost on save, bug #1).
2. A ring is saved in **one** transaction instead of 15–30 sequential posts (bug #5); the quote is still created on the first ring save, as live.
3. Shipping addresses show their text instead of blank labels (bug #9); the duplicate/case-variant emails of the Friends and Family account are kept so the picker shows the problem.
4. The account smart search does not pass SQL from the browser (bug #10).
5. SEND does not actually email anything or build a PDF; it runs the same guards, simulates the `CBR_PDFready` polling, records the PDF in the ring's history and sets "Last Sent".

## Placeholders to replace with real exports

Marked in the data files: product images (SVG placeholders instead of `/images/xlarge/<sku>.jpg`), the costing sheets of the demo styles, prices per carat other than Lab VS1 melee ($120/ct observed), CAD-tier amounts other than tier 03 ($40 observed), the long karat/colour/finishing lists, stone colour names, modification names. The email and summary templates were not captured verbatim and are reconstructed from their content.

## Reference material from the walkthrough

- `docs/Custom-Bridal-Quote-Procedure.md` — how a quote is made today, with Ludovick's rules and worked examples (quotes 101575 and 101587).
- `docs/Quote-System-Map.md` — screens, data model, pricing formulas, endpoints, lookup tables, known bugs, improvement backlog, what is still to capture.
- `docs/walkthrough-captures.md` — raw page-by-page notes from the walkthrough.
- `reference/quoteCBR_inline.js` — the quote header page's JavaScript with an endpoint summary.
- `reference/images/` — the sample store request, the two reference photos, and the factory spec sheet for CUN00269 (copied to `assets/img/` for the seed data).

Living copies (editable, with the backlog tracker):
- Procedure: https://claude.ai/artifact/UjfxtTfqJPHyaco1fexG84
- System map: https://claude.ai/artifact/PuFTq4dT8FiVJLG2V2S4Zk

## Next

The backlog in the system map (fold Regular Quotes in as a product kind, contacts from the central list, server-side pricing with snapshots, one-step lock in both currencies, pending items as fields…) is what the second pass builds on top of this baseline.
