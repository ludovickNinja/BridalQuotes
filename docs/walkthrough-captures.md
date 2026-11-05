# Screen 01 — Quote Module list (`/_admin/quote.asp`)

Captured 2026-11-02 19:12 (America/Toronto). Classic ASP admin ("WEB ADMINISTRATION"), jQuery 1.3.2 + jQuery 3.7.1 + jquery.tools overlay, LogRocket.

## Ludovick's narration
- Lists all quotes under two categories (two tabs): **Quotes** (regular) and **Custom Bridal Quotes**.
- Regular quotes: wedding bands from CR, anniversary bands — built for machine-made products.
- Custom Bridal quotes: built for cast bridal pieces, exposes many more options.
- Future direction: fit both under the Custom Bridal Quote.
- Company column = Account (contact on file) - person at the store who requested the quote.
- Status "Approved by client" = the retailer (store) flags it once they have the end consumer's approval; CrownRing then converts the quote into an order ("Converted to Order").

## Layout
- Header: HOME / MENU / LOGOUT / (logged-in user). Date stamp.
- Legend (top right): Converted to Order / Approved by client / Pending (row colouring).
- "To Add a New Quote, Click Here" -> `quoteEdit.asp` (regular)
- "To Add a New Custom Bridal Quote, Click Here" -> JS `bridalQuote_add()` -> POST `quote_customBridal_act.asp` act=bridalQuote_add, renders an overlay (jquery.tools overlay in #divOverlay).
- Filters: Quote# | Ref# (CBRID) | Company name (smart search `smSearch.js` / `QS_billing_smartSearch.js`) | dateQuotedFrom | dateQuotedTo | [ ] View Converted Quotes | [ ] View Expired Quotes | Ok | Reset
- Pager (page select + >>), `chgPg(n)` posts hidden pgActu.
- Tabs: Quotes | Custom Bridal Quotes (hidden `viewCBR` toggles).

### Regular Quotes tab columns
checkbox | Quote# | Company name (Account (contact) - end customer) | User ID (staff) | Date quoted | Expiry date | Edit | Preview
- Edit -> `quoteEdit.asp?quoteID=NNNNNN`
- Preview -> `previewQuote(id)` -> POST `quote_act.asp?act=previewQuote` body quoteID=... -> HTML in overlay
- Expiry = date quoted + 15 days. `addExtended(id)` -> POST `quote_act.asp?act=addExtended` extends expiry by 15 days.
- Delete -> `delItem(id)` posts form f with act=delete, recID=id.
- Sort -> `sortBy(col)` hidden orderBy.

### Custom Bridal Quotes tab columns
checkbox | Quote# | Company name | User ID | Start Date | Last Sent | Expiry date | Completed (YES/NO) | Edit
- Red "!" next to Completed=YES: hover tooltip lists details still missing even though the quote was marked complete, e.g. "Ref# 56874 / Center Stone Dimensions: PENDING / Sending Center Stone For Setting: PENDING". (Ref# = CBRID, separate from Quote#.)
- Observed pattern: rows with Last Sent blank + Completed YES (+ often "!") vs rows with Last Sent filled + Completed NO.
- "Export Bridal Quotes" button -> `XportCBR()` posts selected quoteIDs to `quote_act.asp` act=XportCBR (new window).
- CBR preview: `previewCBRQuote(QUID)` -> opens `/quote_custom_summary.asp?QUID=...` (public-facing summary, not under /_admin).
- Quote numbers are shared across both types (same sequence: 101460 CBR, 101461 regular).
- ~4 pages regular (40/page) vs 19 pages CBR with the default filter.

## Form `f` (POST quote.asp)
hidden: recID, act, filtre, pgActu, kw, company, viewCBR, orderBy
text: SM_val (quote#), CBRID (ref#), SM_val (company smart search)
date: dateQuotedFrom, dateQuotedTo
checkbox: viewConverted, viewExpired

## Endpoints seen so far
- GET  /_admin/quote.asp (list), POST same (filters/paging/delete)
- GET  /_admin/quoteEdit.asp?quoteID=N (regular quote edit)
- POST /_admin/quote_act.asp?act=previewQuote | addExtended | XportCBR
- POST /_admin/quote_customBridal_act.asp act=bridalQuote_add
- POST /_admin/home_act.asp (logs_form, globalLogAs)
- GET  /quote_custom_summary.asp?QUID=N (CBR summary)
- Shared scripts: /ScriptLibrary/smSearch.js, /ScriptLibrary/QS_billing_smartSearch.js, dhtmlgoodies_calendar

## Capture notes
- javascript_tool output is blocked when it contains `?x=` patterns and truncates ~1KB; workaround: inject a <pre id=claudeDump> and read it with get_page_text.
- Network tracking started after the page loaded; refresh needed to see list-page requests.
# Screen 02 — New Custom Bridal Quote: "Billing" overlay

Triggered by "To Add a New Custom Bridal Quote, Click Here" -> `bridalQuote_add()` -> POST `quote_customBridal_act.asp` act=bridalQuote_add -> HTML overlay.

## Overlay HTML (verbatim)
```html
<form id="fUpd" action="quoteCBR.asp" method="post">
  <input type="hidden" name="ctEmails">
  <div>Billing</div>
  <div id="td_FilterCompany">
    <input type="hidden" name="uaID" id="uaID">
    <input type="text" name="SM_val" id="SM_val" class="hmSearchField" autocomplete="off"
      onkeyup="getSelectContent($(this).parent().attr('id'), $(this).val(), 'userAccount_act.asp', 'SM_company', $(this).prev().attr('name'), ' and clientStatus=\'Active Client\'');"
      placeholder="Enter Company Name here">
    <div id="divSelectSmartSearch"></div>
  </div>
</form>
<input type="button" value="Create" onclick="validForm();" style="display:none;">
<input type="button" value="Close" onclick="window.closeOverlay();">
```

## After selecting an account (test account "Crown Samples (Cora)", uaID=2875)
Overlay expands with:
- **Shipping**: `<select name="shippingID">` populated from the account's shipping addresses (here one option, id 4554, blank label).
- **Contact Name**: `<input name="ctName" maxlength=50>` — the store person requesting.
- **Contact Email / Send quote to**: select of the account's user emails (for the test account these are crownring.com staff addresses) + "Add" (`confirmEmails_form()`) which appends to `#divNotifEmailList` and hidden `ctEmails`.
- "Create" button now visible -> `validForm()` -> POST `quoteCBR.asp` {uaID, shippingID, ctName, ctEmails}.
- Smart search returns options via `selectContentGetValue('td_FilterCompany', idx, uaID, 'uaID')`.

## Ludovick's notes
- Contact Name and Contact Email are mandatory to continue.
- Shipping is empty only because this is a test account; real accounts have addresses on file.
- IMPROVEMENT (rebuild): pull contact name + email from the centralized contact list instead of typing them by hand each time.

## Behaviour
- Step 1 of a new CBR quote = pick the billing account (retailer). Smart search against `userAccount_act.asp` (act SM_company), filtered to `clientStatus='Active Client'`; selection fills hidden `uaID` (user account ID).
- Hidden `ctEmails` field (contact emails, presumably populated on selection).
- Submits POST to `quoteCBR.asp` (the CBR quote editor) with uaID. "Create" button hidden — probably selection auto-submits via validForm().
- NOTE: the smart-search SQL fragment is passed from the client (`' and clientStatus=...'`) — injection-prone; do not replicate in the rebuild.
# Screen 03 — Custom Bridal Quote header page (`/_admin/quoteCBR.asp`)

Reached via POST from the Billing overlay {uaID, shippingID, ctName, ctEmails}. Captured 2026-11-03 09:34, empty (no rings yet). Full inline JS in `src/quoteCBR_inline.js`.

## Key facts
- `quoteID=0` at this point: the quote is NOT persisted yet. Every endpoint is called with quoteID=0 until a ring is added / header saved (server presumably creates the quote on first write and the page reloads with the real quoteID).
- Page: 348 KB, of which ~304 KB is inline CSS (CKEditor 5 superbuild styles). Real content ~40 KB.
- Stack on this page: jQuery 1.11.3 + migrate, CKEditor 5 41.3.1 (admin internal comments), jQuery 3.7.1 + jquery.tools overlay, Google Analytics ga.js, LogRocket.

## Layout (blank state)
- Title "Custom Bridal Quote", "» back to quote list" (posts viewCBR=1 to quote.asp so the CBR tab is selected).
- Blue banner div (empty now; probably status/approval messages later).
- Billing block: contact name (Cora), account name, address, phone. Shipping block: same, account name links to `userAccountEdit.asp?recID=<uaID>`.
- "Log As" -> `globalLogAs('log2B2B','/b2b/index.asp','{GUID}')` -> impersonate the retailer in the B2B site (form fLogAs posts username/password to ../b2b/).
- Button **ADD A RING** -> `CBR_edit()` -> form f (target=_blank) POST `quote_customBridal.asp?quoteID=0&CBRID=undefined` => the ring editor opens in a NEW TAB.
- `#divContentGnrl` (hidden while empty): ring rows (div.tr) + footer row with **Total: $0.00**.
- Hidden-while-empty block `#tblCt`: Email Comments (textarea `comments`) + [ ] Include in email (`isCommIncludEmail`), Name (`ctName`), Email list (`ctEmails` ";"-joined + add/remove), hidden `createNewPDF` (checked by default), buttons **SEND** (createNewPDF ? CBR_createPDF() : CBR_PDFsend()), **COPY EMAIL** (`CBR_copyForm(0)`; a retail-priced variant `CBR_copyForm(0,1)` is commented out), note "all selected rings will be sent to the client".
- `#divButtons` **Save Quote** -> `quoteCBRUpd()`.
- Header fields auto-save on change via `quoteCBRUpd(1)` (banner "updating.../saving...").

## Form f (POST quote_customBridal.asp, target _blank)
hidden quoteID, CBRID, uaID, shippingID | comments | isCommIncludEmail | ctName | ctEmails | createNewPDF

## Ring-row contract (from JS; rows not yet seen)
`div.tr[data-CBRID][data-isLockedPrice=0|1]` with: image (hover zoom), `[name=isEnabled]` select (1 active / -1 yellow / 0 grey), `[name=qty]`, customer note (data-note), production notes (5 x 110 chars), admin note, viewer links (link1/link2), duplicate ring (same quote or new quote), accept/decline per ring (ACCEPTED/DECLINED), dismiss approval (quote-level), edit (CBR_edit), delete.

## Send flow (from JS)
1. Guards: at least one ring with isEnabled=1; every row must have `data-isLockedPrice=1` ("Please ensure that all active references have a price locked").
2. POST CBR_createPDF {CBRIDs} -> fileName; poll CBR_PDFready every 4 s (max 20) until "OK!".
3. POST CBR_sendEmail with the whole form -> "Thank you, email has been sent" -> reload. Sets "Last Sent" on the list.
4. COPY EMAIL = same two calls with isNot4Send=1, renders the email HTML in a modal for clipboard copy.

## Header page with one saved ring (Quote #101575, captured 2026-11-04)
Title becomes "Custom Bridal Quote# 101575-Claude" (quote# + requester name). Ring row (`div.tr[data-cbrid=57056][data-islockedprice=885]` — note data-isLockedPrice holds the locked USD amount, 0 when unlocked):
- status select Active(1) / Inactive(0) / Pending(-1)
- brand line "NOAM CARVER BRIDAL-BRIDAL", SKU shown as **B552-02WM-Lab-FCYA-C** (a "-C" suffix is appended = Custom), Ref#: 57056
- links: Duplicate · Preview (`/quote_custom_summary.asp?CBRUID=<32-hex>`) · Ring Notes · Production Notes · Admin Notes · Viewer Links (each shows a preview of the note text)
- Completed YES/NO badge
- 14K · White · Size: 4.5 · Qty [1] · **$885.00** (locked price) · remove icon
- Footer Total: $885.00
Below: Email Comments + "Include in email", Name, Email list, SEND / COPY EMAIL, "Please note that all selected rings will be sent to the client"; right: Admin Internal Comments [Add/Edit].

## Duplicate Ring modal (CBR_duplicateRing_form)
Fields: New Ring Name (ringName, 50) · isNewQuote: **Add to this quote (0)** / Create Replacement quote (1) / Create Repair quote (2) · ☐ Copy Image Renderings (CopyImageRenderings=1) · Duplicate / Cancel.
Ludovick: not used for the platinum version because the SKU itself changes (WM → WZ); duplicate is for same-SKU variants. Replacement/Repair quote = duplicates the ring into a brand-new quote flagged as replacement or repair.

## Endpoints (all under /_admin/)
See `src/quoteCBR_inline.js` header comment for the full list with payloads.
# Screen 04 — Custom Bridal ring editor (`/_admin/quote_customBridal.asp?quoteID=N&CBRID=M`)

Opened in a new tab from ADD A RING (form f POST, target _blank). Captured blank 2026-11-03 10:06 (quoteID=0, CBRID=undefined → treated as 0). 90 KB inline JS analysed below (full text was read; key parts summarised).

Libs: jQuery 3.7.1, jquery.tools overlay, smSearch.js (style# smart search), custom_upload.js (drag-and-drop image upload), marghoobsuleman jquery.dd (image dropdowns), jquery-confirm 3.3.2.

## Blank state
- Title "Custom Bridal", right column: **View As** link, account name (Crown Samples), Quote#: 0, Ref#: 0 (CBRID), "Enter a name for this custom Ring (Optional)" → `[name=ringName]`.
- Red-bordered block = `#divImg > #divBlockImg1.divBlockImg` with a single **Enter style#** input (smart search) → picks a product (`[name=PID]` select, SKU).
- Everything else is loaded lazily, section by section, driven by a hidden `[name=loadingStep]` state machine once a SKU is validated (`validSKU()`).

## Section load order (loadingStep state machine)
Each step POSTs `/_admin/quote_customBridal_act.asp` with `act=<name>&CBRID=..` and appends an HTML block to `#divGblContent`:

| step | act | block | purpose |
|---|---|---|---|
| — | loadImg (sessionID) | #divImg | style/SKU picker + image blocks (loadBlockImg ID=1; extra image blocks via #divBlockImg_plus, max ~15) |
| validSKU | loadBlockImg_styleDetails (PID) | #divStyleDetails | metal / karat / colour / ring MM / thickness / thicknessBottom of the chosen SKU (data-karatID, data-colourID, data-ringMM, data-thickness, data-thicknessBottom, data-isUpd); shows ring size + finishing selects |
| 0 | loadTotals (uaID, quoteID, CBRID, curr=USD, PID) | #divTotals | pricing table (hidden until end; moved to bottom at step 11) |
| .5 | loadCustom | #divCustom | customization blocks: modelType → style → SKU (CBR_getSKUDD), karat/colour (CBR_getKaratColourDD), up to 4 "modif" option images per block, notes, drag-drop image |
| 1 | loadCenterDiamondInfo (PID) | #divCenterDiamondInfo | center stone: stoneProvider (Customer / Crownring / supplier…), stoneCat/Type/Kind, shape, size, qty, psID (8 = custom), colour, dimensions L/W/D, isPending, diamondWeight, pricePerCarat, cert, addlNotes, stoneCost |
| 2 | loadSettingCenterStoneInfo (stoneProvider) | #divSettingCenterStoneInfo | SCSI_sendStone4Setting (-1 pending / 0 / 1), contactName, settingChargeID → settingCost, notes, isPending |
| 3→4 | loadRequest | #divRequest | isRequest_photo (fancy photos), isFancyPhotoValidated, isShowNclientPreview, two image drop zones (#divDD1/#divDD2) |
| 5 | loadGoldCharge (PID, gold_karatID) | #divGoldCharge | gold_karatID, finishedGramWeight, goldLoss, extraChargePerPiece → goldCost (with info tooltips) |
| 6 | loadLaborCharge (PID) | #divLaborCharge | costingLabor, rhodium, polishing, laserEngraving, extra1, extra2, handEngra, millgrain, CADFee, FCYFee, giftBox, SPIFF, eagleClaw → laborCost |
| 7 | loadSideDiamond + loadSideDiamondDetails (PID) | #divSideDiamond | N side-diamond groups (data-sdID): provider, cat/type/kind, psID, colour, shape, size, qty, pricePerCarat; each with setting rows (data-sdsID): qty, settingStyleID (data-settingCost), settingLocationID, settingCost. Footer: total qty / DWE / Side Diamonds Total Cost |
| 8 | loadAddlDiamond + loadAddlDiamondDetails (PID, adID) | #divAddlDiamond | additional diamonds (data-adID), same fields as center stone + settingStyle/Location, cert, markup per block; provider colours the block (Customer white / Crownring #d8e0e9 / other #abc0e0); #divAddlDiamondSettingDetails: ADS_sendStone4Setting, contactName, qty, settingChargeID, settingCost, isPending |
| 9 | loadXtraBlock1 | #divXtraBlock1 | isDesignNeedsApproval, isDesignApproved4Prod (+text, priority, date, time, ARTIDs) |
| 11 | loadOtherFeeSection | #divOtherFeeSection | cadPrintFeeID → cadPrintCost (OF_CADPrint_loadDD), isPending; then #divTotals is moved to the bottom and `loadTotals_binding()` runs |
| 11.5 | (client) | 3D Viewer Links | link1, link2 (max 500) |
| 12 | loadRendringSection (sessionID) | #divRendringSection | rendering images table: fileName, imgName, dateUpl, isChecked, isShowInJobbag (max 2), isTitleImg (max 2) |
| 13 | loadPDFHistory (quoteID, CBRID) | | PDFs previously sent |
| 14 | (client) | #divNotes | `note` — "Notes about this ring" (customer-facing) |
| 14.5 | (client) | #divAdminNote | `adminNote` |
| 15 | loadMatchBand | #divMatchBand | MB_isMatchRing, MB_type, MB_val (matching wedding band) |
| 16 | (client) | #divNtrnlNotes, #divNvoiceInstr | 5 × ntrnlNote (110 chars) "Internal Production Notes"; invoiceInstructions |
| 50 | (client) | #divCBRbtns | "IS THIS QUOTE COMPLETED? NO/YES", SAVE & CONTINUE, SAVE & EXIT, View preview (`/quote_custom_summary.asp?CBRUID=<guid>`), Update Log (logs_form section "CBR Item Details[CBRID]") |

Pending-item validation when clicking YES (completed): Ring Size PENDING (blocks outright), Finishing None, Center stone Dimensions PENDING (unless SKU ends with "B" or starts with "ST"), Sending Center Stone For Setting PENDING, Setting Center Diamond Stone PENDING, Fancy Photos NOT VALIDATED, Additional Diamond Setting PENDING. Anything except ring size can be SKIPped (jquery-confirm) — which is how rows end up Completed=YES with the red "!" on the list.

## Pricing model (loadTotals_binding) — all client side
`#divTotals` has one row per cost component: trCenterdiamond, trSettingCenterStone, trSideDiamonds, trAddlDiamond (1..n, clones), trAddlDiamondSetting, trGoldCharge, trLaborCharge, trCadPrintFee. Columns: `td.subCost` (cost, data-qty for addl rows), `.duties` (%), `.markup` (input, multiplier), `td.finalCost`, `td.sell`.

```
finalCost(row) = subCost × (1 + duties/100) × qty
TotalFinalCost = Σ finalCost                          (#divTotalFinalCost)
sell(row)      = subCost × (1 + duties/100) × markup × qty
FinalSell USD  = Σ sell  (rounded to $0)             (#divFinalSell.USD)
FinalSell CAD  = FinalSell USD × exchangeRate         (#divExchRate)
base           = lockPrice > 0 ? lockPrice : FinalSell
RetailPrice    = base × retailRate(=1) × (1 + tarif/100) × (1 − discount/100)    (#divRetailPrice, per currency)
TarifPrice     = FinalSell × (1 + tarif/100);  DiscountPrice = TarifPrice × (1 − discount/100)
Gross Margin % = (FinalSell USD − TotalFinalCost) / FinalSell USD × 100
isFinalPrice0  = checkbox that zeroes FinalSell/Tarif/Discount (price-on-request?)
```
- Markup inputs are per component (CDI_markup, SCSI_markup, SD_markup, AD markup per block, ADS_markup, gold_markup, labor_markup, CADPF_markup); changing one re-triggers that section's cost field → recompute.
- Price helpers: `productEdit_act.asp?act=bridalCost_getPricePerCarat` (stoneCat/Type/Kind, shape, size, psID → $/ct), `rawDiamondCosts_act.asp act=getDiamondWeight` (size → ct). `productEdit_bridalCosting.asp?recID=PID` = the product's bridal costing sheet (viewBridalDetails shows it read-only in an overlay).
- Lookup-table admin modals (add/edit/delete inline): DDcert (certs), AC_DDSettingLocation (setting locations), DDSettingStyle (setting styles w/ data-settingCost), ADS_DDSettingCharge (setting charges), OF_CADPrint (CAD print fees).
- Lock price: `#trLP #divLockPrice.USD/.CAD` — list page requires every ring `data-isLockedPrice=1` before sending.

## save2quote() — persisted ring payload (act=save2quote)
Header: PID, ringSize, finishingID, ringName, ringKaratID, ringColourID, ringMM, thickness, thicknessBottom (only if data-isUpd=1 else 0), link1, link2, note, adminNote, ntrnlNote[5], invoiceInstructions, priceCAD, priceUSD, finalCost, lockPriceUSD, lockPriceCAD, retailRate, exchangeRate, discount, isFinalPrice0, status (completed NO/YES), SD_markup,
CDI_* (center diamond: stoneProvider, stoneCatID, stoneTypeID, stoneKindID, diamondShapeID, notes, stoneDimensionL/W/D, isPending, diamondSizeID, qty, psID, ps_custom, colourID, DW, pricePerCarat, addlNotes, certID, stoneCost, markup),
SCSI_* (sendStone4Setting, contactName, settingChargeID, notes, settingCost, isPending, markup),
ADS_* (sendStone4Setting, contactName, qty, settingChargeID, settingCost, isPending, markup),
isRequest_photo, isFancyPhotoValidated, isShowNclientPreview,
gold_* (karatID, finishedGramWeight, goldLoss, extraChargePerPiece, cost, markup),
labor_* (costingLabor, rhodium, polishing, laserEngraving, extra1, extra2, handEngra, millgrain, CADFee, FCYFee, giftBox, SPIFF, eagleClaw, cost, markup),
isDesignNeedsApproval, isDesignApproved4Prod(+_text,_priority,_date,_time,_ARTIDs),
MB_isMatchRing, MB_type, MB_val,
+ CBRID, quoteID, sessionID, uaID, odID (order ID, 0), shippingID.
Returns the new CBRID, then a chain of follow-up posts: save2quote_img_cleanup / save2quote_img (extra image blocks: sorting, imgID, PID, modelTypeID, imgName) / save2quote_fancyImg / save2quote_custom (per customization block: ID, modelTypeID, style, PID, isPIDImgMain/Alt, img, modifIDs, karatID, colourID, notes) / save2quote_addlDiamond_cleanup + save2quote_addlDiamond (per block) / save2quote_sideDiamond_cleanup + save2quote_sideDiamond + save2quote_sideDiamondSettings_cleanup + save2quote_sideDiamondSettings / save2quote_otherFee / save2quote_rendering_cleanup + save2quote_rendering / finally `save2quote_()` → sets CBRID on the opener's form, calls `window.opener.quoteCBRUpd(0,1)` to refresh the header page (this is what persists the quote and assigns the quoteID), then either reloads the editor (SAVE & CONTINUE) or closes the tab (SAVE & EXIT).
=> ~15–30 sequential POSTs per save, fire-and-forget with setTimeout ordering; a rebuild should make this one transactional save.

## Implied data model (tables)
quote (quoteID, uaID, shippingID, ctName, ctEmails, comments, isCommIncludEmail, internalComments, dates, status) 1—n CBR ring (CBRID, CBRUID guid, PID, ringName, size, finishing, metal overrides, prices, lock prices, rates, status/completed, notes ×4, links, matchband, design approval, isEnabled, qty, isApproved)
ring 1—1 centerDiamond, 1—1 settingCenterStone, 1—1 addlDiamondSetting, 1—n addlDiamond, 1—n sideDiamond (1—n sideDiamondSettings), 1—n customization block (modelType, style, SKU, modifIDs, image), 1—n image block, 1—n rendering image, 1—n otherFee, 1—n PDF history, 1—n update log.
Lookups: products (PID/SKU, bridal costing), stoneCat/Type/Kind, diamondShape, diamondSize (→ weight), psID (price source? 8=custom), colour, cert, settingStyle, settingLocation, settingCharge, cadPrintFee, karat, finishing, modelType, modif options, exchange rate, duties, tarif, retail rate.

## Other
- JobBag PDF: `html2PDF_txt()` posts to `JobBagpdf/` with IDs[] — production job bag per ring.
- Images: /images/xlarge/<sku>.jpg, /images/customBridalRing/modif/, /images/customBridalRing/tmp/ (session-scoped uploads keyed by sessionID = userID_date.time).
- "View As": lets admin see the retailer-facing version.
# Sample request used for the walkthrough (screenshot: assets/sample_request_B552.png)

Store email, verbatim gist:
- "Can we modify style **B552-02YM-FCYA**. I have attached photos below"
- Client wants pricing in **white gold and platinum**
- Finger size **4.5**
- Center stone **1.59 ct oval, 9.55 × 6.62 × 4.40 mm** (written "9.55x6.62.40") — customer-supplied stone
- Add a **petal basket head** (photo 1: petal/leaf prongs cradling the oval, plain shank)
- Two variations: (a) normal **hidden halo in the head**, (b) **diamonds on the bridge** (photo 2: diamond-set bridge under the head) — **all diamonds lab**
- Include the **setting fee** in the quote

Implied combinations: 2 metals × 2 variations = 4 priced configurations.
Ludovick: one configuration is entered at a time (one ring per combination). Walkthrough starts with variation (a) hidden halo in **14K** (white gold).
# Step — Style code selection (ring editor, block #divBlockImg1)

## Ludovick's rules
- The store may give either a **SKU** or a **Style Code**. Don't blindly reuse what they typed: the quote must carry the **correct colour and karat** for what they actually want.
- Sample request SKU `B552-02YM-FCYA`: `YM` = Yellow, 14K. But the first reference is wanted in **14K White**, so the style code to use is **`B552-02A`** (A = white); the **karat** is then chosen in the next dropdown.
- Typing "B552-02" in the style# smart search lists: B552-02A, B552-02A-Lab, B552-02B, B552-02RA, B552-02RA-Lab, B552-02RB, B552-02YA, B552-02YA-Lab, B552-02YB, B552-02YWA, B552-02YWA-Lab.
  - colour prefix letters: (none)=white, R=rose, Y=yellow, YW=yellow/white two-tone
  - A vs B suffix: TBD (ask) — possibly natural vs ? / or head variant
  - `-Lab` suffix: lab-grown diamond version of the style. Store asked for all lab diamonds → use **B552-02A-Lab** for this request.

## Karat / SKU step (after style code)
Picking `B552-02A-Lab` fills the SKU select `[name=PID]` with the karat variants of that style:
- `B552-02WM-Lab-FCYA` (PID 167161) — W = white, M = 14K (per Ludovick: YM = yellow 14K)
- `B552-02WS-Lab-FCYA` (PID 167163) — S = 18K
- `B552-02WZ-Lab-FCYA` (PID 167165) — Z = Platinum (the platinum references for this request will use this one)
- all share data-img B552-02A.jpg, data-altimg B552-02WS-FCYA
- `FCYA` suffix = ? (fancy / centre-stone code — ask)
Then **OK** → `validSKU()` (locks the SKU select, loads style details + all sections). "change" link re-opens the style search.
=> SKU nomenclature: `<style>-<variant><colour><karat>[-Lab]-<suffix>`; the quote stores the PID (SKU), not the style code.

## Mechanics
- Style search: `getSelectContent('divStyle1', val, '/_admin/quote_act.asp?act=CBR_SM_style', 'CBR_SM_style', 'style1')` → hidden `style1`; then a SKU select `[name=PID]` (div.divSKU) is filled via `quote_act.asp?act=CBR_getSKUDD` (style → PIDs with data-img), and `validSKU()` locks it and loads the rest of the page.
- Hidden `modelTypeID1` select (Default Model).
- Size select `[name=ringSize]`: -1 Pending, 0 N/A, 1.5 … 16.75 in 0.25 steps, then 17, 18, 20, 22, 24.
- Finishing select `[name=finishingID]`: 0 None + ~500 finishing names (mostly wedding-band finishes; default set from `#defaultFinishingID` data-ID once style details load). Bridal default is presumably "All High Polish" (id 28) — confirm.
- Extra image blocks (#divBlockImg_plus) for reference photos; "remove" button for drag-drop images.
# Ring editor after SKU validation — B552-02WM-Lab-FCYA (PID 167161), 14K White, blank request

Captured 2026-11-03 ~10:10. Everything below is what the system pre-fills from the SKU's bridal costing sheet before any manual input.

## Style block (#divBlockImg1)
- Style details from SKU: **Metal: 14K · Color: White · Width: 1.6 · Thickness: 1.7 · Thickness Bottom: 1.7** (data-karatID/colourID/ringMM/thickness/thicknessBottom; data-isUpd=0 unless edited via the style-details form).
- 4 product images shown (side, top, perspective, stacked).
- Size: **Pending** (default). Finishing: **All High Polish** (default from #defaultFinishingID).
- Customize: section select → Gallery(5) / Head(3) / Shank(4) / Band(7) / Pendant(10) / Bracelet(11) / Earrings(12) / Other(13). Each adds a customization block (style search → SKU → karat/colour, up to 4 "modif" images, notes, drop image).

## CENTER DIAMOND INFO (#divCenterDiamondInfo) — pink box = customer stone
Defaults: Stone Provider **Customer** (options: N/A, Customer, Crownring) · Stone Category Diamond(1)/Gemstone(2) · Stone Type Black(18)/Colored(17)/**Diamond(1)**/Lab Grown(2) · Stone Kind None(0) · Shape **Oval** (49 shapes, image dropdown) · Notes (50) · Stone Dimensions L × W × D · D.W 0 ct · **Pending ☑**.
Shapes list: Ashoka, Asscher, Baguette, Bullet, Cadillac, Carré, Coffin, Cushion, Duchess, Dutch Marquise, Elongated Cushion, Elongated Radiant, Emerald, Emerald - Portrait, Half-Moon, Heart, Hexagon, Kite, Lozenge, Marquise, Moval, Octogon, Other, Oval(16), Oval Cabochon, Pear, Princess, Radiant, Radiant(dup), Rhombus, Rose Cut CU/OV/RD, Rough, Round, Round - Cabochon / Old European / Old Full Cut / Portrait / Single cut / Swiss cut, Sakura, Shield, Step Marquise, Tapered Baguette, Trapezoid (Step), Trapezoid Brilliant, Triangle, Trillion.
`#divAddlInfo` is filled by `loadCenterDiamond_addlInfo` when provider changes (Crownring-supplied stone → size/qty/quality/colour/price-per-carat/cert/cost fields).

## SETTING CENTER STONE INFO (#divSettingCenterStoneInfo)
"SENDING STONE FOR SETTING?" YES(1) / NO(0) / **PENDING(-1)** default. Hidden until YES: Contact Name, Setting Charge select (None 0 · Center Stone(13) $40 · CrownRing Providing(18) $0 · Customer Providing(8) $10 · Glow(14) $4 · Melees(4) $1 · Stackable / Studio(9) $0.70 · Volume Providing(16) $5 · Other Charge(-1)), Notes (modal), Setting Cost (readonly, from data-settingcost), Pending.

## Fancy Center Stone Picture Required (#divRequest)
"Production is Requesting to see a Photo of the center stone before starting on the cad file" No(0)/Yes(1); two drag-drop photo zones; ☐ Photos validated; ☐ Show in client preview. "See Example".

## GOLD CHARGE (#divGoldCharge)
Karat select (67 metal options incl. 10K, 14K, 18K, 19K, 22K, Platinum 950, Palladium 950, mixed metals, Tantalum…) default **14K(2)**; changing karat reloads the block (`loadGoldCharge(karatID)`).
Gold Cost Per Gram **75.22** (hidden goldCostPerGram=75.22211732 — live metal rate for 14K) · Finished Gram Weight **3.2** "Estimated" · Gold Loss% **12** · Extra charge Per Piece 0 → Total Gold Cost **269.60**.
Check: 75.22211732 × 3.2 × 1.12 = 269.60 ✓  ⇒ goldCost = rate × weight × (1 + loss%) + extra.

## LABOR CHARGE (#divLaborCharge)
Casting Labor 5 · Rhodium 5 · Polishing 20 · Laser Engraving 1.5 · Extra 1 0 · Extra 2 0 · Hand Engra. 0 · Millgrain 0 · CAD Fee 15 · Chain 0 · Gift Box 1.25 · SPIFF 29.5 · Eagle Claw 1 → Total Labor Cost **78.25** (= plain sum ✓).

## SIDE DIAMOND INFO (#divSideDiamond) — from the SKU's costing (data-bcdcid=248220)
Group 1: Provider **Crown (Studio Stock)** (Customer / Crownring / Crown (Studio Stock)) · Diamond · Stone Type Diamond · Kind None · Quality **Lab VS1(10)** (I1, SI3-I1, SI2, SI1, CZ, VS1, Lab VS1 — psID, data-iscost0allowed) · Colour (61 options; selected id 36) · Shape **Round** (22) · Dia. Size **0.9** (74 sizes incl. certified ct sizes and "One Of Kind") · Single Dia. W 0.003 · Qty **16** · Dia. W Ext. 0.0480 · Price per Ct **120.00** (readonly, from bridalCost_getPricePerCarat) · D. Cost 5.76 · Setting Cost 16.00 · Total D. Cost 21.76 · Selling Price 36.99.
  Setting row: Qty 16 · size 0.9 · Setting Style **Default(0)** $1 (None, French pave $1.5, Glow $4, Hand pave add on $5, My Caroline $3, Pave $1, Stackable / Studio $0.70, Other Charge) · Stone Placement **Default** (Band, Basket, Bridge, Default, Gallery, Halo, Head, Peekaboo, Shank, Side stone) · Setting Cost 1 · Ext. Set Cost 16 · Total $16.
Footer: Qty 16 · 0.0480 ct · Side Diamonds Total Cost $21.76.
Formulas: DWext = singleWeight × qty; D.Cost = DWext × pricePerCt; setting ext = qty × settingCost; total = D.Cost + setting.

## ADDITIONAL DIAMONDS (#divAddlDiamond) — empty, "+" adds a block (hidden halo / bridge diamonds will go here or in side diamonds — confirm).

## Design approval (#divXtraBlock1)
Design needs approval? Yes / **No**. Design Approved for production ☐ (+ "Enter name of last rendering"). Priority High/Medium/Low. Date (today), Time (57 slots, 08:00AM), Approval Request Type multi: CLIQ, Matching Sample, Need Factory Quote, Renderings, Stone Count / Weight, Vadim Prepping, Viewer Project, Wax.

## OTHER FEE — CAD PRINT FEE (#divOtherFeeSection)
select (None; 01. Brainpower; 02. CAD Required / Basic Band; 03. Frankenstein / Simple ER; 04. Lil Spicy; 05. Med. Spicy; 06. Spicy; 07. Legit Spicy; 08. Extra Spicy; 09. Deluxe; 10. Extra Deluxe; 11. Rina Extra Fee; 20+ Refs of the SAME; Client is an Engineer or Surgeon; + joke fees) → Fee Cost (qty × data-cost) · Pending.

## TOTALS (#divTotals) — default state
| row | cost | duties | final | markup | sell USD |
|---|---|---|---|---|---|
| Center Diamond | $0 | 0% | $0 | 1.4 | $0 (Pending) |
| Setting Center Stone | $0 | 0% | $0 | 2 | $0 |
| Additional Diamond 1 | $0 | 0% | $0 | 1.7 | $0 |
| Additional Diamond Setting | $0 | 0% | $0 | 1.7 | $0 |
| Gold Charge | $269.60 | 6.5% | $287.12 | 1.7 | $488.11 |
| Labor Charge | $78.25 | 6.5% | $83.34 | 1.7 | $141.67 |
| Side Diamonds | $21.76 | 6.5% | $23.17 | 1.7 | $39.40 |
| Cad Print Fee | $0 | 0% | $0 | 1.7 | $0 |
TOTAL final cost $393.63 · Sell **$669 USD** / **$950 CAD** (Exchange Rate 1.42) · Retail ×2 (data-rate=2, editable) · T USD 0% · Discount 0% · Gross Margin 41.16 · Lock price $0.00 USD / CAD (click to edit) · ☐ Final Price: $0 · flags "* Size Pending", "* Pending design approval".
Default markups: diamonds 1.4 (center), 2 (center setting), 1.7 everything else. Duties 6.5% on gold/labor/side diamonds, 0% on center stone & setting & CAD fee.

## Bottom blocks
3D Viewer Links (link1, link2) · RENDERING SECTION (empty, "+") · PDF History (empty) · Notes about this ring · Admin Notes · Matching Band: "Is this band to match an existing Noam Carver engagement ring?" Yes/**No**, provide Serial# / Invoice# / PO# / Web# · Internal Production Notes (5 lines) · Invoices Instructions · IS THIS QUOTE COMPLETED? **NO**/YES · SAVE & CONTINUE · SAVE & EXIT.
# Ring editor — filled in by Ludovick and saved (Quote #101575, Ref/CBRID 57056)

Captured 2026-11-04 after SAVE & CONTINUE (page reloaded as `quote_customBridal.asp?quoteID=101575&CBRID=57056`; header tab is now `quoteCBR.asp?quoteID=101575`). Quote number is assigned on the first ring save.

## What Ludovick entered (vs. defaults in 07)
- Style B552-02A-Lab → SKU B552-02WM-Lab-FCYA (PID 167161). Style details unchanged (14K White 1.6/1.7/1.7), now data-isUpd=1.
- Ring name: blank.
- **Size: shows "Pending" after reload; Finishing: shows "None" after reload** (was All High Polish before save). → Ask: did the 4.5 not stick, or not entered? Possible persistence/reload bug — totals still flag "* Size Pending".
- **Customize → Head block** (data-modeltypeid=3, id 73969): no style/SKU/modification picked; notes:
  `* Change to Petal Basket Head`
  `* Keep Hidden Halo`
  (The base style B552-02 already has the hidden halo — the 16 × 0.9 mm side stones from the SKU costing ARE the hidden halo. Petal basket head is an instruction to CAD, priced via extra gold, not via an additional-diamond block.)
- **Center stone**: Customer · Diamond · Diamond (not "Lab Grown" — customer's own stone) · Oval · dimensions **9.55 × 6.6 × 2.4** · D.W **1.59** ct · Pending **unchecked**.
  → Flag: request said "9.55x6.62.40"; 2.4 mm depth is implausible for a 1.59 ct oval (~4.0–4.4 mm expected). Probably 6.62 × 4.40.
- **Setting center stone**: Sending stone for setting **YES** · Setting Charge **Center Stone ($40)** · contact name blank · cost 40 · markup 2 → sell $80. (Store asked for setting fee included.)
- Fancy photo request: No.
- **Gold**: 14K · rate now **78.04 $/g** (was 75.22 yesterday — live metal price, changes daily) · Finished Gram Weight **3.5** (was 3.2; "added a bit of gold for the extra design on the head") · loss 12% → **305.93**.
- Labor: unchanged 78.25.
- Side diamonds: unchanged (16 × 0.9 mm Lab VS1, $21.76), now persisted as sdID 80779.
- Additional diamonds: none.
- Design needs approval: **No** (rule: set **Yes** when the store wants a CAD/rendering to show their customer; CAD team then updates the weight and locks the price when done. No CAD requested here → quoter prices and locks directly).
- **CAD PRINT FEE: 03. Frankenstein / Simple ER → $40** (markup 1.7 → $68).
- Totals: cost **$512.33** · sell **$883 USD / $1,254 CAD** · gross margin 41.98 · **Lock price USD $885.00** (CAD lock $0) · Retail price shows $885.00 (= lock price; retailRate multiplier is hard-coded 1 in JS despite "Retail x 2" label).
  → Rule to confirm: lock price = sell price rounded up to a "clean" number ($883 → $885)?
- Notes / admin notes / production notes: blank. IS THIS QUOTE COMPLETED? **YES**. "View preview" button appeared (CBRUID now exists).

## Ludovick's answers
- Size 4.5 and Finishing "All High Polish" ARE set — they populate late (async) after the page load; my dump read the selects before they were filled. Not a bug, but a rebuild should load the ring in one shot.
- Stone depth: 4.40 makes more sense; **rule: sanity-check stone dimensions vs. weight and flag anything out of the ordinary** before quoting.
- **Lock price rule: round the computed sell price up to the nearest $5.**
- **Why lock: the quote is valid 2 weeks (expiry = quoted + 15 days); locking shields it from metal-market fluctuation. After expiry, unlock and relock at that day's price.**

## Observed system behaviours
- Save = many sequential POSTs; page reloads with real IDs. Header tab refreshed via window.opener.
- Metal rate is pulled live each page load → an unlocked quote's price drifts day to day; the lock price is what protects the quoted number.
- Additional Diamond default markup now shows 2 (data-markup=2) — differs from the 1.7 seen on the blank editor yesterday; markup defaults may come from account/date config.
# Ring 2 — variation 1 (hidden halo) in Platinum, entered by Claude (Ref# 57069)

Done 2026-11-04 on Quote #101575 (test account Crown Samples), reviewed by Ludovick at the pause point.

## Steps performed (this is the procedure, as executed)
1. Header page → ADD A RING (new tab).
2. Style search "B552-02A-Lab" → pick. SKU dropdown now listed WM (14K), **WN** (PID 197326, new karat code — ask), WS (18K), WZ (Platinum). Chose **B552-02WZ-Lab-FCYA** (PID 167165) → OK. Sections loaded in ~15 s.
3. SKU defaults for platinum: Metal Platinum 950 · Color NONE · 1.6/1.7/1.7 · Finishing All High Polish · Gold line: **$49.84/g, 5.44 g estimated, loss 20%** (vs 12% for gold) → $325.32 · labor 78.25 · side stones 16 × 0.9 mm Lab VS1 $21.76 · sell before edits $770.
4. Size 4.5. Center stone: Customer / Diamond / Diamond / Oval / 9.55 × 6.62 × 4.40 / 1.59 ct / Pending unchecked.
5. Sending stone for setting YES → Setting Charge "Center Stone" ($40).
6. Customize → Head block, notes "* Change to Petal Basket Head / * Keep Hidden Halo" (no style/SKU/modif picked).
7. CAD PRINT FEE "03. Frankenstein / Simple ER" → $40.
8. Weight bump for petal head: 5.44 → **5.9 g** (Ludovick's 14K bump was +0.3 g; ×~1.5 for platinum density ≈ +0.46 g). Ludovick: "looks good". Gold → $352.83.
9. Rendering section → "+" → uploaded the store's reference photo (petal basket head, cropped from the request email). **Rule: reference photos get NO boxes ticked (Show in Quote / Show in Job bag / Title image) — those are for CrownRing renderings.** Second photo (diamond bridge) reserved for variation 2.
10. Totals: cost $562.27 · sell **$968 USD / $1,374 CAD** · GM 41.9% → **lock USD $970** (round up to nearest $5). CAD lock left $0 (as Ludovick did).
11. Design needs approval: No (no CAD requested). IS THIS QUOTE COMPLETED → YES (validation passed, no pending items). SAVE & CONTINUE.
12. Result: Ref# 57069, header row "B552-02WZ-Lab-FCYA-C · Platinum 950 · NONE · Size 4.5 · $970.00 · Completed YES". Quote total now $1,855.00 (885 + 970).

## Mechanics learned
- Lock price is an inline edit (`lockPrice_edit`): click the USD lock cell → input → on change it rewrites the cell and retriggers retail calc. Requires finishedGramWeight > 0.
- Rendering upload: "+" posts `rendringSection_addForm()` → overlay with `<form id=f_karim action="custombridal_rs" enctype=multipart/form-data><input type=file name="files[]" multiple>`; on change it uploads via ajax and the row appears immediately (Preview, Filename, Upload Date, Uploaded by, Show in Quote, Show in Job bag (limit 2), Title image (limit 2), remove). Rows are then persisted by save2quote_rendering with sorting/isChecked/isShowInJobbag/isTitleImg.
- Completed=YES validation passed silently because size, finishing, stone dims, stone-for-setting were all set.
- Platinum: loss% default 20 vs 12 for karat gold; "colour" is NONE; same markups (1.7) and duties (6.5%).

## Open questions for Ludovick
- Karat code **N** (B552-02WN) = ? (10K?)
- Should CAD lock price also be set, or is USD lock enough (CAD retail then floats with the exchange rate)?
- When a quote has several rings, is "Email Comments" used to explain the variations to the store?
# Ring 3 — variation 2 (diamonds on the bridge, no hidden halo) in 14K White, entered by Claude (Ref# 57081)

## Ludovick's rules for this variation
- **Re-purpose the SKU's existing side-diamond line** (don't delete/add): update the **stone count to match the reference image (14)**, set placement **Bridge**.
- **Melee setting cost stays $1/stone** (Default setting style).
- **Stones on a bridge are usually 0.9 mm.**

## What was entered
- Style B552-02A-Lab → SKU B552-02WM-Lab-FCYA (14K White). Size 4.5, All High Polish.
- Center stone: Customer oval 9.55 × 6.62 × 4.40, 1.59 ct, not pending. Sending stone YES, Center Stone charge $40.
- Head block notes: "* Change to Petal Basket Head / * No hidden halo - diamonds on the bridge instead".
- Gold: 14K @ 78.04 $/g, 3.5 g (same +0.3 g head bump as ring 1), 12% → $305.93. Labor $78.25.
- Side diamonds: 14 × 0.9 mm Lab VS1 Round @ $120/ct → 0.042 ct, D. cost $5.04 + setting 14 × $1 = $19.04. Setting row placement = Bridge (id 11).
- CAD print fee 03 → $40. Design approval: No.
- Rendering: uploaded reference photo 2 (diamond bridge), no boxes ticked.
- Totals: cost $509.44 · sell **$878 USD / $1,247 CAD** · GM 41.98 → **lock $880**. Completed YES. Saved.
- Quote #101575 now: 57056 (14K hidden halo) $885 · 57069 (Pt hidden halo) $970 · 57081 (14K bridge) $880 · **Total $2,735.00**.

## Notes
- Changing the side-diamond group qty does NOT auto-sync the setting-row qty; both must be set (there is a "sync" icon on the setting row).
- `settingLocationID` select gets re-rendered by `AC_DDSettingLocation_loadDD()` after qty changes — set placement last.
- Ring 4 (Ref# 57085): variation 2 in Platinum — WZ SKU, 5.9 g, 14 × 0.9 mm bridge line, photo 2, cost $559.38, sell $963 → lock **$965**, completed, SAVE & EXIT (closes the editor tab).
- **Quote #101575 complete: 4 rings, total $3,700.00** (885 + 970 + 880 + 965). Not yet sent.
# Request type 2 — Custom fashion piece (factory-made), Friends & Family — Quote #101587, Ref# 57091

Spec sheet: assets/spec_sheet_CUN00269.jpg (factory CAD sheet: CUN00269, Star of David + "L" + "Y" + 2 bezel stations on Cable30 chain, 16+1+1 in, 9 mm lobster, 14KT(W) 2.14 g without chain, 38 lab VS stones 0.462 ctw: 2×3.35 bezel, 6×1.10, 6×1.00, 24×0.90 prong; CAD designer Anish).

## Ludovick's rules (internal / factory-made job)
- Account: "Friends and Family (CrownRing Staff) Montreal" (uaID 2954); contact Ilan; **shipping left blank** for this quote.
- Style: **CUSTOM-FASHION** (one SKU per metal: -10K, -14K, -18K, -925, -Pt950) → CUSTOM-FASHION-14K (PID 136696). Other generic customs exist: Custom, CUSTOM-ATELIER/-BR/-BRIDAL/-CR/-CX/-GLOW/-LUNA/-MC/-MF/-NCM/-STACKABLE/-STUDIO.
- **Set the metal colour** in the "Ring Details" popup (click the metal block) — the template loads with Color NONE; width/thickness stay 0.
- **Size = total chain length in inches** (16+1+1 → 18).
- Customize block (Pendant — there is no "Necklace" section; Pendant/Bracelet/Earrings/Other): paste the factory spec text. Normally not done for a customer, acceptable for an internal job:
  `New style # CUN00269 - (Cable30 chain with lobster lock ) / Gold @ 4131- $ 492 / METAL KT - 14KT WHITE / METAL WT: 2.14gm ( Without chain ) / DIAMOND – LAB VS / DIAMOND WT. 0.462 CTW`
- **Factory price rule: the system's cost BEFORE duties (gold + labor + diamonds) must be ≥ the factory's price in USD ($492, quoted at gold $4131).**
- Gold: 14K, weight **2.14 g** (metal only) → $187.05 at today's rate.
- **Diamonds entered as side-diamond lines** (provider Crownring, Lab VS1): 2 × 3.4 mm (no 3.35 in list), 6 × 1.1, 6 × 1.0, 24 × 0.9 → $92.38 / 0.453 ct. Bezel vs prong not represented (setting style Default $1).
- Labor: template defaults (casting 20, rhodium 2.6, polishing 15, laser 1.5, gift box 1.25, SPIFF 25) + **CAD Fee $40** (labor field) + remainder to reach $492 (**$107.22**, intended for "Chain" → moved to **Extra 1**, see bug) = $212.57.
- No CAD Print Fee line (factory did the CAD). Design approval: No.
- **Friends & Family: no discount at quote stage** (discounts applied at order time); Ilan gets no discount.
- **Spec sheet uploaded to Rendering with all three boxes ticked: Show in Quote, Show in Job bag, Title image** (unlike customer reference photos → none).
- Lock USD $895 (sell $890.76). CAD lock left $0 → for this Canadian account the header shows the floating CAD price ($1,265 at 1.42). Open question: CAD lock rule.
- Completed YES, SAVE & CONTINUE. Header: "CUN00269 - Star of David L/Y necklace · NOAM CARVER FINE JEWELRY-CUSTOM · CUSTOM-FASHION-14K-C · 14K White · Size 18 · $1,265.00".

## BUG found in the live system
`save2quote()` never sends the labor **Chain** field: it serializes `labor_FCYFee` from `[name=FCYFee]` (field does not exist) and omits `[name=chainFee]`. Any amount typed in Chain is lost on save (verified: reload showed chainFee=0, laborCost recomputed 212.57 → 105.35). Workaround: use Extra 1. Fix: send `labor_chainFee` and persist it server-side; audit old quotes for lost chain amounts.

## Other observations
- Email picker for this account lists ~60 addresses with many duplicates / case variants (ilan@ ×4, jennifer.lavigne@ ×5, brian.bv@ ×7) → dedupe/normalise contacts in the rebuild.
- Shipping select shows blank labels for the 4 addresses → show the address text.
- `file_upload` into the rendering form worked with a freshly attached file.
