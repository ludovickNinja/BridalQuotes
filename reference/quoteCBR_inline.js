// Inline script from /_admin/quoteCBR.asp (CBR quote editor, header-level), captured 2026-11-03 09:34.
// Server-rendered values: quoteID=0 (new quote not yet persisted), uaID=2875, ctEmails="ludovick@crownring.com".
// Endpoints (all POST unless noted):
//   quote_act.asp?act=quoteCBRUpd            $("#f").serialize()             save header (ctName, ctEmails, comments, isCommIncludEmail); reload quoteCBR.asp?quoteID=N
//   quote_act.asp?act=CBR_isEnabled          {CBRID,isEnabled: 1|0|-1}       ring row toggle (1 active, -1 = yellow tint, 0 = grey tint)
//   quote_act.asp?act=CBR_qtyUpd             {CBRID,qty}
//   quote_act.asp?act=CBR_delete             {CBRID,quoteID}
//   quote_act.asp?act=CBR_createPDF&quoteID  {CBRIDs, isRetail?}             -> returns fileName; requires >=1 enabled ring and all rows data-isLockedPrice=1
//   quote_act.asp?act=CBR_PDFready&quoteID   fileName                         polls every 4s up to 20x until "OK!"
//   quote_act.asp?act=CBR_sendEmail&quoteID  $("#f").serialize() [+isNot4Send=1&isRetail=x for "copy" variant]
//   quote_act.asp?act=CBR_noteUpd            CBRID, note                      customer-facing note per ring
//   quote_act.asp?act=CBR_ntrnlNoteUpd       ntrnlNote x5 (max 110 chars each), CBRID   "Production Notes" (5 lines)
//   quote_act.asp?act=CBR_adminNoteUpd       CBRID, adminNote
//   quote_act.asp?act=CBR_linksUpd           CBRID, link1, link2              "Viewer Links" (3D viewer links)
//   quote_act.asp?act=CBR_dismissApproval    quoteID
//   quote_act.asp?act=CBR_acceptDecline_upd  CBRID, isApproved 0|1           per-ring ACCEPTED/DECLINED
//   quote_act.asp?act=quoteInternalComments_Upd&quoteID  internalComments (CKEditor HTML)  "Admin Internal Comments"
//   quote_act.asp?act=CBR_CBQ_addEmail       uaID, email                      add a notification email to the account
//   quote_customBridal_act.asp act=CBR_duplicateRing_form&CBRID  -> form; then act=CBR_duplicateRing_roots (+isNewQuote 0|1|2, ringName) -> returns quoteID
//   quote_customBridal.asp?quoteID=N&CBRID=M  (form f POST)                  ring editor page (CBR_edit)
//   /b2b/_cart.asp?act=confirmEmails_form    uaID                            email picker (shared with B2B cart)
// Row DOM contract: div.tr[data-CBRID][data-isLockedPrice] inside #divContentGnrl; per-row [name=isEnabled] select, [name=qty], data-note, data-adminNote, data-link1/2.

$(document).ready(function(){
confirmEmails_loadDD();
var xtbEmails = "ludovick@crownring.com".split(";");
for (var xi=0;xi<xtbEmails.length;xi++){
if ($("#divNotifEmail select option[value='"+xtbEmails[xi]+"']").length==0) $("#divNotifEmail select").append("<option value=\""+xtbEmails[xi]+"\">"+xtbEmails[xi]+"</option>");
$("#divNotifEmail select").val(xtbEmails[xi]).trigger("change");
}
$("#f [name=ctName], #f [name=ctEmails], #f [name=comments], #f [name=isCommIncludEmail]").bind("change",function(){ quoteCBRUpd(1); });
$("#f .tr [name=isEnabled]").bind("change",function(){
$(this).closest(".tr").css({backgroundColor:($(this).val()==1?"":($(this).val()==-1?"rgba(255,248,175,.2)":"rgba(217,217,217,.2)"))});
$.post("quote_act.asp?act=CBR_isEnabled", {CBRID:$(this).closest(".tr").attr("data-CBRID"),isEnabled:Number($(this).val())}, function(xresp){}, "html");
}).trigger("change");
$("#f .tr [name=qty]").bind("change",function(){
$.post("quote_act.asp?act=CBR_qtyUpd", {CBRID:$(this).closest(".tr").attr("data-CBRID"),qty:$(this).val()}, function(xresp){ quoteCBRUpd(0,1); }, "html");
});
$("#f .tr > div > img:first").bind("mouseover",function(){ /* hover zoom of ring image */ }).bind("mouseout",function(){ $(this).next().remove(); });
});
function confirmEmails_form(){ $.post("/b2b/_cart.asp?act=confirmEmails_form", "uaID="+$("#fUpd [name=uaID]").val(), function(xhtml){ /* modal */ }, "html"); }
function confirmEmails_upd(){
var xemail = $("#fUpd [name=email]").val();
if (/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]{2,}[.][a-zA-Z]{2,}$/.exec(xemail)==null) alert("Please enter a valid email");
else{ $.post("quote_act.asp?act=CBR_CBQ_addEmail", "uaID=2875&email="+xemail, function(xhtml){}, "html"); $("#divNotifEmail select").append("<option value=\""+xemail+"\">"+xemail+"</option>"); $("body #divTmp").remove(); }
}
function confirmEmails_loadDD(){ /* maintains #divNotifEmailList and hidden [name=ctEmails] = "a@x;b@y" */ }
function quoteCBRUpd(xnoReload, xnocheck){
if (!xnocheck==1 && $("[name=ctName]").val().replace(/\s/g,"")==""){ alert("Contact Name is required"); }
else{
if (xnoReload==1) $("#divUpdBan").fadeIn();
$.post("quote_act.asp?act=quoteCBRUpd", $("#f").serialize(), function(html) {
if (xnoReload==1) $("#divUpdBan span").html("saving...").closest("#divUpdBan").delay(500).fadeOut();
else $("#f").attr({"action":"quoteCBR.asp?quoteID=0","target":"_self"}).submit();
}, "html");
}
}
function CBR_edit(xCBRID){ $("#f [name=CBRID]").val(xCBRID).parent().attr({"action":"quote_customBridal.asp?quoteID=0&CBRID="+xCBRID}).submit(); }
function CBR_delete(xCBRID){ if (confirm("Are you sure you want to delete this ring?")){ $.post("quote_act.asp?act=CBR_delete", {CBRID:xCBRID,quoteID:0}, function(xresp){ $("#f [name=CBRID]").remove(); quoteCBRUpd(); }, "html"); } }
function CBR_createPDF(){
if ($("#divContentGnrl .tr > div:first-child [name=isEnabled] option[value='1']:selected").length==0) alert("Please select at least one ring to include in the quote");
else if ($("#divContentGnrl .tr[data-isLockedPrice=0]").length>0) alert("Please ensure that all active references have a price locked");
else{ /* collect enabled CBRIDs -> POST CBR_createPDF -> CBR_PDFready(fileName,0,0) -> then CBR_PDFsend() */ }
}
function CBR_PDFready(xfileName,xi,xisEmail){ /* poll quote_act.asp?act=CBR_PDFready&quoteID=0 fileName=... every 4s, max 20 tries; on "OK!" -> CBR_PDFsend() */ }
function CBR_PDFsend(){ /* same guards; POST quote_act.asp?act=CBR_sendEmail&quoteID=0 with $("#f").serialize(); shows "Thank you, email has been sent"; reload */ }
function CBR_noteEdit(xthis){ /* modal textarea name=note (customer note) -> CBR_noteUpd(CBRID) */ }
function CBR_noteUpd(xCBRID){ $.post("quote_act.asp?act=CBR_noteUpd", "CBRID="+xCBRID+"&note="+encodeURIComponent($("#divTmp textarea").val()), function(){ reload(); }, "html"); }
function CBR_ntrnlNoteEdit(xthis){ /* modal "Production Notes": 5 x <input name=ntrnlNote maxlength=110> (stored newline-joined in data-note) -> CBR_ntrnlNoteUpd */ }
function CBR_ntrnlNoteUpd(xCBRID){ $.post("quote_act.asp?act=CBR_ntrnlNoteUpd", $("#divTmp *").serialize()+"&CBRID="+xCBRID, function(){ reload(); }, "html"); }
function CBR_adminNoteEdit(xthis){ /* modal textarea adminNote -> CBR_adminNoteUpd */ }
function CBR_adminNoteUpd(xCBRID){ $.post("quote_act.asp?act=CBR_adminNoteUpd", "CBRID="+xCBRID+"&adminNote="+encodeURIComponent($("#divTmp textarea").val()), function(){ reload(); }, "html"); }
function CBR_linksEdit(xthis){ /* modal "Viewer Links": link1, link2 (max 500) -> CBR_linksUpd */ }
function CBR_linksUpd(xCBRID){ $.post("quote_act.asp?act=CBR_linksUpd", "CBRID="+xCBRID+"&link1=..&link2=..", function(){ reload(); }, "html"); }
function CBR_duplicateRing_form(xCBRID){ /* POST quote_customBridal_act.asp act=CBR_duplicateRing_form&CBRID -> modal #fUpd with ringName + isNewQuote radio (0 same quote | 1 | 2 new quote variants); Duplicate -> act=CBR_duplicateRing_roots -> returns quoteID; link to quoteCBR.asp?quoteID=N */ }
function dismissApproval(){ if (confirm("Are you sure you want to dismiss this quote's approval?")){ $.post("quote_act.asp?act=CBR_dismissApproval", "quoteID=0", function(){ reload(); }, "html"); } }
function CBR_acceptDecline_form(xthis){ /* modal select Decline(0)/Accept(1), current from row text ACCEPTED/DECLINED -> CBR_acceptDecline_upd */ }
function CBR_acceptDecline_upd(xCBRID){ $.post("quote_act.asp?act=CBR_acceptDecline_upd", "CBRID="+xCBRID+"&isApproved="+$("#divTmp select").val(), function(){ reload(); }, "html"); }
function CBR_copyForm(xCBRID,xisRetail){ /* same guards as PDF; POST CBR_createPDF {CBRIDs,isRetail} and CBR_sendEmail + isNot4Send=1&isRetail=x -> renders the email HTML in a modal with a Copy button (clipboard). isRetail toggles wholesale vs retail-priced version. */ }
function CBR_copyLink(xselector){ /* document.execCommand("copy") of #divEmail2copy */ }
function quoteInternalComm_edit(){ /* CKEditor 5 modal "Admin Internal Comments" -> quoteInternalComments_Upd */ }
function quoteInternalComments_Upd(){ $.post("quote_act.asp?act=quoteInternalComments_Upd&quoteID=0", "internalComments="+encodeURIComponent(ckEdtr.getData())); $("#f [name=internalComments]").val(ckEdtr.getData()); $("#f #divInternalComments").html(ckEdtr.getData()); window.closeOverlay(); }
// reload() above stands for: $("#f").attr({"action":"quoteCBR.asp?quoteID=0","target":"_self"}).submit();
