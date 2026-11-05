# Custom Bridal Quote Procedure

As of 2026-11-04 · Ludovick Bilodeau (walkthrough) · written up by Claude

Living copy: https://claude.ai/artifact/UjfxtTfqJPHyaco1fexG84

## Purpose and scope

This is the step-by-step for pricing a custom bridal request in the CrownRing web admin (Quotes module, Custom Bridal Quotes tab) so it can be followed by a new quoter or run by Claude. It was built by watching Ludovick quote a real retailer request (quote 101575, four rings) and then quoting a factory-made staff piece (quote 101587), on the Crown Samples and Friends and Family test accounts.

It covers cast bridal pieces (engagement rings with a customer or CrownRing center stone) and custom fashion pieces made by the factory. It does not yet cover the Regular Quotes tab (machine-made wedding and anniversary bands), which is planned to move under Custom Bridal.

## Before you start: read the request properly

Pull these facts out of the store's email before touching the system: the base style, the metals wanted, finger size, center stone (who supplies it, shape, weight, dimensions), every design change, every variation, whether diamonds are natural or lab, and whether a setting fee or a CAD is requested. Each metal × design combination becomes its own ring on the quote, entered one at a time.

Stores send either a SKU or a style code, and what they send is a starting point, not the answer. The quote must carry the colour and karat they actually want, which is often not what the code says.

| Code | Meaning |
| --- | --- |
| B552-02A, B552-02YA, B552-02RA, B552-02YWA | Style code: (no letter) white, Y yellow, R rose, YW two-tone |
| B552-02A-Lab | Lab-grown diamond version of the style; use it whenever the store asks for lab diamonds |
| B552-02WM-Lab-FCYA | SKU: W colour, then karat letter M = 14K, S = 18K, Z = platinum, N = to confirm; the quote stores the SKU |
| CUSTOM-FASHION-14K | Generic SKU for a factory-made fashion piece (also 10K, 18K, 925, Pt950) |

Example: the store wrote B552-02YM-FCYA (yellow, 14K) but asked for white gold and platinum with lab diamonds, so the rings were entered on B552-02A-Lab with the WM and WZ SKUs.

Sanity-check stone dimensions against the weight and flag anything odd. A 1.59 ct oval written as 9.55 x 6.62.40 is 9.55 × 6.62 × 4.40 mm, not 6.6 × 2.4; a 2.4 mm depth would be impossible for that weight.

## Step 1: create the quote

1. Quotes module, click "To Add a New Custom Bridal Quote". The Billing popup opens.
2. Type the account name; the search only lists active clients. Pick the account.
3. Shipping: pick the store's address. The dropdown shows blank labels today, so check with the account record if there is more than one. Staff (Friends and Family) quotes can leave it blank.
4. Contact Name and Contact Email are mandatory. The name is the person at the store who asked; the email list comes from the account's users (Add lets you type a new one).
5. Create. The quote header opens with billing and shipping, an ADD A RING button, and the email block (Email Comments, Include in email, SEND, COPY EMAIL).

The quote has no number until the first ring is saved; the header title then becomes "Custom Bridal Quote# 101575-Claude" (number plus requester).

## Step 2: add a ring, pick style, SKU, size, finishing

1. ADD A RING opens the ring editor in a new tab.
2. Enter style#: type the style code (B552-02A-Lab) and pick it from the list. Pick the SKU for the karat wanted (WM 14K, WS 18K, WZ platinum) and press OK. Everything else loads from that SKU's costing sheet: metal, colour, width, thickness, the default weight, the labor defaults and the side stones the style already has (for B552-02 the 16 × 0.9 mm hidden halo).
3. Size: the store's finger size. Pending is the default and blocks the Completed flag. For a necklace, size is the total chain length in inches (16+1+1 = 18).
4. Finishing: defaults to All High Polish for bridal; leave it unless the request says otherwise.
5. Optional ring name at top right. Use it for custom fashion pieces ("CUN00269 - Star of David L/Y necklace") so the header row is readable.
6. Check the metal block (Metal, Color, Width, Thickness). Click it to open Ring Details if something must change. CUSTOM-FASHION SKUs load with Color NONE, so set the colour there.

The SKU dropdown and the style search are two different things: the quote stores the SKU, and the style search is only the way to reach it.

## Step 3: center stone and setting

Center Diamond Info (pink box = customer stone): Stone Provider Customer, Crownring or N/A; category, type (Diamond, Lab Grown, Colored, Black), shape (49 shapes), dimensions L × W × D in mm, weight in ct, and a Pending checkbox. Fill the dimensions and weight from the request and untick Pending once they are known. A customer's own stone stays "Diamond" even on a lab quote; the Lab Grown type is for stones CrownRing supplies.

Setting Center Stone Info: answer "Sending stone for setting?" Yes, No or Pending. Yes reveals the Setting Charge dropdown; "Center Stone" is the normal choice and carries a $40 cost with a markup of 2 (sells at $80). The store's "please include the setting fee" means exactly this.

Fancy Center Stone Picture Required: set Yes only when production needs a photo of the stone before CAD (fancy shapes); the two drop zones take the photos and "Photos validated" must be ticked before the ring can be Completed.

For a piece with no center stone (fashion necklace), leave provider N/A; the Pending checks for the center stone are then skipped.

## Step 4: customization, gold, labor, side diamonds, fees, photos

**Customize.** Pick a section (Head, Shank, Gallery, Band, Pendant, Bracelet, Earrings, Other) to add a block, and write the design instructions in its notes, one change per line: "* Change to Petal Basket Head" / "* Keep Hidden Halo". The block can also reference another CrownRing style and up to four modification images; a plain note is enough for most requests. There is no Necklace section; use Pendant.

**Gold charge.** The karat comes from the SKU and the rate per gram is live (14K was $75.22 one day and $78.04 the next; platinum $49.84). Loss is 12% for karat gold and 20% for platinum. The weight is the SKU's estimate; add metal for extra design, as a judgment call: +0.3 g on 3.2 g in 14K for a petal basket head, about +0.46 g in platinum for the same volume (platinum is roughly 1.5 × denser). Gold cost = rate × weight × (1 + loss%) + extra charge.

**Labor charge.** Loaded from the SKU (bridal: casting 5, rhodium 5, polishing 20, laser 1.50, CAD fee 15, gift box 1.25, SPIFF 29.50, eagle claw 1 = $78.25). Change individual lines only when the job needs it. Do not use the Chain field: it is not saved by the current system (see gotchas); use Extra 1 instead.

**Side diamonds.** Each line is one stone group: provider, quality (Lab VS1 for lab jobs), shape, size, quantity, and a setting row with setting style, stone placement and a per-stone setting cost. The system prices at $120/ct for lab melee and $1 per stone to set. Rules of thumb: bridge stones are 0.9 mm; melee setting stays at $1; when a design moves the stones (hidden halo to bridge), re-purpose the SKU's existing line (count from the reference photo, placement Bridge) rather than adding a line. Set the quantity on the stone row and on its setting row, then the placement last (the placement list rebuilds after a quantity change).

**Additional diamonds.** For larger extra stones that need their own cost, cert and setting (block with its own markup). Not needed when the extra stones are melee.

**Other fee: CAD print fee.** Pick the complexity tier (03. Frankenstein / Simple ER = $40 for a modified engagement ring). Skip it when the factory already did the CAD.

**Design needs approval.** Set Yes only when the store wants a CAD or rendering to show their customer; the CAD team then updates the weight and locks the price when done. Otherwise No, and the quoter prices and locks directly.

**Rendering section.** Upload the store's reference photos here (one per variation). For a customer's inspiration photo tick nothing. For a factory spec sheet on a staff job tick all three: Show in Quote, Show in Job bag, Title image.

## Step 5: pricing, lock, completed, save

The totals table recomputes as you type. Each line is cost × (1 + duties) × markup; duties are 6.5% on gold, labor and side diamonds and 0% on the center stone, its setting and the CAD print fee. Default markups are 1.7 on everything except the center stone (1.4) and the center-stone setting (2). The USD sell price is the sum of the lines; CAD is USD × the exchange rate shown (1.42). Gross margin should land around 41 to 42% on a normal bridal job.

| Line | Cost | Duties | Markup |
| --- | --- | --- | --- |
| Center diamond | stone cost | 0% | 1.4 |
| Setting center stone | setting charge | 0% | 2 |
| Gold charge | rate × g × (1 + loss) | 6.5% | 1.7 |
| Labor charge | sum of labor fields | 6.5% | 1.7 |
| Side diamonds | stones + setting | 6.5% | 1.7 |
| Additional diamonds / setting | per block | 0% | 1.7 to 2 |
| CAD print fee | tier | 0% | 1.7 |

Lock the price: click the USD lock cell, type the sell price rounded up to the nearest $5 ($883 becomes $885, $968 becomes $970). The lock holds the quote through its two-week validity so metal-market moves do not change it; after expiry, unlock and relock at that day's price. The quote cannot be sent while any active ring is unlocked. Open point: for Canadian accounts the header shows the CAD figure, and the CAD lock was left at $0 in the walkthrough; confirm whether CAD should be locked too.

Is this quote completed? Set YES when every detail is in. The system checks ring size (blocks outright), finishing, center stone dimensions, stone-for-setting, fancy photo validation and additional diamond setting; anything except size can be skipped, which is what puts a red "!" next to Completed on the quote list. Then SAVE & CONTINUE (stay in the editor) or SAVE & EXIT (closes the tab). The quote header refreshes with the ring row, its locked price and the quote number.

## Variations and multi-ring quotes

One ring per metal × design combination, entered in full each time. Two metals and two designs make four rings on the same quote; the header lists them with their locked prices and a total.

A metal change means a different SKU (WM to WZ), so do not use Duplicate for it; add a new ring and re-enter. Platinum loads its own weight estimate (5.44 g against 3.2 g for 14K on B552-02) and 20% loss, and colour becomes NONE.

Duplicate is for same-SKU variants. It asks for a new ring name, whether to add to this quote or create a Replacement or Repair quote, and whether to copy the renderings.

A design variation reuses the base ring and changes the notes and the stone lines. Hidden halo to diamonds-on-the-bridge on B552-02: notes "* No hidden halo - diamonds on the bridge instead", side line changed from 16 × 0.9 mm placement Default to 14 × 0.9 mm placement Bridge, bridge photo attached.

## Request type: factory-made custom fashion piece (Friends and Family)

The factory sends a CAD spec sheet with style number, metal weight without chain, the diamond table (sieve, mm size, quantity, weight, setting), the finding and a price at a stated gold rate. The quote exists so the order can be placed; the differences from a bridal ring are:

1. Style CUSTOM-FASHION, SKU for the metal (CUSTOM-FASHION-14K). Set the colour in Ring Details; name the ring with the factory style number.
2. Size = chain length in inches. Customize block (Pendant) = the factory spec text pasted as is, which is acceptable for an internal job and not done for a customer.
3. Gold weight = the sheet's metal weight (2.14 g, without chain).
4. Diamonds go in Side Diamond Info, one line per sieve size, provider Crownring, Lab VS1 (2 × 3.4, 6 × 1.1, 6 × 1.0, 24 × 0.9; the list has no 3.35, take 3.4).
5. Pricing rule: the system's cost before duties (gold + labor + diamonds) must be at or above the factory price in USD. With a $492 factory price the lines came to $344.78, so add the CAD fee ($40 in the labor CAD Fee field) and put the remainder ($107.22) in Extra 1 (meant for Chain, which does not save). No CAD print fee line.
6. No discount at quote time; discounts are applied when the order is placed, and Ilan gets none. Markup stays 1.7.
7. Spec sheet uploaded in Rendering with Show in Quote, Show in Job bag and Title image all ticked.
8. Lock (round up to $5), Completed YES, save.

## Sending the quote and what happens after

On the quote header, every ring marked Active is included; set a ring to Inactive or Pending to leave it out. Email Comments (with "Include in email" ticked) go into the message; Admin Internal Comments stay internal. SEND builds a PDF of the active rings (every one must have a locked price), waits for it, then emails the contact addresses; "Last Sent" on the quote list fills in. COPY EMAIL renders the same email for pasting into another mail client. Preview on a ring row opens the customer-facing summary page.

The quote expires 15 days after it is quoted. The store marks it Approved by client once their end customer agrees; CrownRing then converts the quote to an order (rows turn blue on the list). Expired quotes can be extended by 15 days from the list, or unlocked and relocked at the current metal price. Per-ring Accept / Decline and Dismiss approval live on the header rows.

## Rules of thumb and gotchas

- The style code the store types is never the answer; set colour, karat and Lab yourself.
- One ring per metal and per design; metal change = new ring, not Duplicate.
- Customer stone stays type Diamond; untick Pending once dimensions and weight are in; sanity-check depth against weight.
- Setting fee requested = Sending stone YES + Center Stone charge ($40, markup 2).
- Extra metal for a modified head: about +0.3 g in 14K, +0.46 g in platinum.
- Bridge stones 0.9 mm; melee setting $1 per stone; count stones from the reference photo.
- Set stone quantity on the stone row and on its setting row; choose placement last.
- Lock = sell price rounded up to the nearest $5; relock after the 15-day expiry.
- Completed YES needs size, finishing and stone details; a skipped check shows as a red "!" on the list.
- Reference photos: no boxes. Factory spec sheet on staff jobs: all three boxes.
- The Chain field in labor is not saved; put chain cost in Extra 1 until the bug is fixed.
- Size and Finishing fill in a second late after a reload; wait before reading them.
- Design needs approval = Yes only when a CAD is requested; the CAD team then owns weight and lock.
- Discounts are applied at order time, not on the quote.
- Metal rates move daily (14K went from $75.22 to $78.04 overnight); an unlocked quote drifts.

## Worked examples

Quote 101575 (Crown Samples test account): store asks to modify B552-02YM-FCYA with a petal basket head for a customer's 1.59 ct oval (9.55 × 6.62 × 4.40), size 4.5, two variations (hidden halo, diamonds on the bridge), in white gold and platinum, all lab, setting fee included. Rates on the day: 14K $78.04/g, platinum $49.84/g, exchange 1.42.

| Ref | Ring | Gold | Labor | Stones | Setting | CAD | Cost | Sell USD | Lock |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 57056 | 14K hidden halo | 3.5 g, $305.93 | $78.25 | 16 × 0.9, $21.76 | $40 | $40 | $512.33 | $883 | $885 |
| 57069 | Pt hidden halo | 5.9 g, $352.83 | $78.25 | 16 × 0.9, $21.76 | $40 | $40 | $562.27 | $968 | $970 |
| 57081 | 14K bridge | 3.5 g, $305.93 | $78.25 | 14 × 0.9, $19.04 | $40 | $40 | $509.44 | $878 | $880 |
| 57085 | Pt bridge | 5.9 g, $352.83 | $78.25 | 14 × 0.9, $19.04 | $40 | $40 | $559.38 | $963 | $965 |

Quote total $3,700. Gross margin 41.9 to 42.0% on each ring.

Quote 101587 (Friends and Family, Ilan): factory spec CUN00269, Star of David with L and Y initials and two bezel stations on a Cable30 chain, 16+1+1 inches, 14K white 2.14 g, 38 lab VS stones 0.462 ctw, factory price $492 at gold 4131. Entered as CUSTOM-FASHION-14K, size 18, gold $187.05, four stone lines $92.38, labor $212.57 (defaults $65.35 + CAD $40 + $107.22 in Extra 1) = $492.00 before duties; sell $890.76 USD / $1,265 CAD, locked $895 USD.
