/*
 * The inline <head> script of the language gate (see lib/language-gate.ts). Kept apart, without "use client",
 * so the server root layout can embed it as a plain string.
 */

export const LANG_KEY = "d2s:lang";
/** How long after a choice the next page still plays the "enter" opening (ms). */
const ENTER_WINDOW = 8000;

export const GATE_SCRIPT = `(function(){try{
var d=document.documentElement,l=location,q=new URLSearchParams(l.search);
var p=l.pathname.replace(/\\/+$/,"")||"/";
var cur=(p==="/en"||p.indexOf("/en/")===0)?"en":"fr";
var raw=null;try{raw=localStorage.getItem("${LANG_KEY}")}catch(e){}
var s=raw?String(raw).split("|"):[];var lang=(s[0]==="fr"||s[0]==="en")?s[0]:null;var at=+s[1]||0;
var same=false;try{same=!!document.referrer&&new URL(document.referrer).origin===l.origin}catch(e){}
if(lang&&same&&lang!==cur){lang=cur;at=0;try{localStorage.setItem("${LANG_KEY}",cur+"|0")}catch(e){}}
if(p!=="/"&&p!=="/en")return;
if(q.has("langue")){d.dataset.langGate="open";return}
var ua=navigator.userAgent||"";
if(q.get("capture")==="1"||navigator.webdriver||/bot|crawl|spider|slurp|lighthouse|headless|facebookexternalhit|embedly|whatsapp|telegram|preview/i.test(ua)){d.dataset.langGate="skip";return}
if(lang){
if(p==="/"&&lang==="en"&&!same){d.dataset.langGate="skip";l.replace("/en"+l.search+l.hash);return}
d.dataset.langGate=(lang===cur&&Date.now()-at<${ENTER_WINDOW})?"enter":"skip";return}
d.dataset.langGate="open";
}catch(e){}})();`;
