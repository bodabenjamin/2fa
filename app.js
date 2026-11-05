'use strict';
(() => {
const $=id=>document.getElementById(id),session=new AuthSession(),messages=AuthMessages;
const supported=Object.keys(messages);
let locale=AuthLinks.language(navigator.languages||[navigator.language],supported);
let countryLocale=null,manuallyChosen=false;
let busy=false,formVersion=0,errorKey='',toastTimer,copyTimer;
let keyFormatValid=false;
const t=key=>messages[locale][key];
for(const code of supported){const option=document.createElement('option');option.value=code;option.lang=code==='sr'?'sr-Latn':code;option.textContent=messages[code].native;$('language').append(option);}
function error(key){errorKey=key;$('error').textContent=key?t(key):'';$('secret').setAttribute('aria-invalid',String(Boolean(key)));}
function announce(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2600);}
function renderKeyGuide(){
 const raw=$('secret').value.trim();let value=raw,valid=false,config;
 if(/^otpauth:/i.test(raw)){try{value=new URL(raw).searchParams.get('secret')||'';}catch{value='';}}
 const count=Array.from(value.replace(/[\s-]/g,'').replace(/=+$/,'')).length;
 try{if(raw){config=TotpCore.parse(raw);valid=true;}}catch{}finally{config?.bytes?.fill(0);}
 keyFormatValid=valid;
 const issue=!raw?'':count<TotpCore.limits.minKeyCharacters?'keyTooShort':count>TotpCore.limits.maxKeyCharacters?'keyTooLong':!valid?'invalid':'';
 $('key-feedback').textContent=issue?t(issue).replace('{min}',String(TotpCore.limits.minKeyCharacters)).replace('{max}',String(TotpCore.limits.maxKeyCharacters)):'';
 $('key-feedback').hidden=!issue;
 $('secret').setAttribute('aria-invalid',String(Boolean(issue)||Boolean(errorKey)));
 $('key-count').textContent=t('charCount').replace('{n}',String(count));
 $('key-stats').setAttribute('data-state',!raw?'empty':valid?'valid':issue==='keyTooShort'?'short':issue==='keyTooLong'?'long':'incomplete');
}
function render(){
 const s=session.snapshot;
 $('code').textContent=s.code?s.code.slice(0,s.code.length/2)+' '+s.code.slice(s.code.length/2):'••• •••';
 $('code').disabled=!s.code;$('code').setAttribute('aria-label',t('copy')+(s.code?': '+s.code:''));
 $('code').classList.toggle('eight-digits',s.digits===8);
 const hasCode=Boolean(s.code),urgent=hasCode&&s.remaining<=Math.min(5,Math.ceil(s.period/6));
 const warning=hasCode&&!urgent&&s.remaining<=Math.min(10,Math.ceil(s.period/3));
 $('result').classList.toggle('has-code',hasCode);$('result').classList.toggle('urgent',urgent);$('result').classList.toggle('warning',warning);
 $('timer-seconds').textContent=hasCode?String(s.remaining):'—';
 $('timer-ring').setAttribute('stroke-dashoffset',hasCode?String(100*(1-s.remaining/s.period)):'100');
 const expiry=urgent?t('expiresNow'):warning?t('expiresSoon'):'';
 if($('expiry-status').textContent!==expiry)$('expiry-status').textContent=expiry;
 $('live').hidden=!s.code;$('copy').disabled=!s.code;$('reset').hidden=!s.active;$('share').hidden=!s.active;
 $('progress').max=s.period;$('progress').value=s.active?s.remaining:0;
 $('progress').setAttribute('aria-label',s.active?t('remaining').replace('{s}',s.remaining):t('waiting'));
 $('timer').textContent=!s.active?t('waiting'):!s.code?t('refreshing'):t('remaining').replace('{s}',s.remaining);
 $('generate').disabled=busy||Boolean($('secret').value.trim()&&!keyFormatValid);$('generate-label').textContent=t(busy?'generating':'generate');
}
function translate(){
 document.documentElement.lang=locale==='sr'?'sr-Latn':locale;
 document.documentElement.dir=['ar','he','fa','ur','pa-Arab'].includes(locale)?'rtl':'ltr';document.title=t('title')+' · 2FA Auth';
 document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n);});
 $('secret').placeholder=t('placeholder');$('language-label').textContent=t('languageLabel');$('language').value=locale;
 $('reveal').setAttribute('aria-label',t($('secret').type==='password'?'show':'hide'));
 $('auth-card').setAttribute('aria-label',t('title'));$('copy-label').textContent=t('copy');error(errorKey);renderKeyGuide();render();
}
function invalidate(){formVersion++;session.clear();busy=false;clearTimeout(copyTimer);$('copy-label').textContent=t('copy');error('');renderKeyGuide();render();}
$('secret').addEventListener('input',invalidate);
$('reveal').onclick=()=>{const show=$('secret').type==='password';$('secret').type=show?'text':'password';$('reveal').setAttribute('aria-pressed',String(show));$('reveal').setAttribute('aria-label',t(show?'hide':'show'));};
$('language').onchange=()=>{if(supported.includes($('language').value)){manuallyChosen=true;locale=$('language').value;translate();}};
async function generate(){
 invalidate();if(!keyFormatValid)return;const version=formVersion;busy=true;render();
 try{
  if(!globalThis.crypto?.subtle){error('crypto');return;}
  if($('secret').value.length>4096){error('invalid');return;}
  const ok=await session.start($('secret').value);
  if(!ok||version!==formVersion)return;
  $('secret').type='text';$('reveal').setAttribute('aria-pressed','true');$('reveal').setAttribute('aria-label',t('hide'));
 }catch{if(version!==formVersion)return;session.clear();error('invalid');}
 finally{if(version===formVersion){busy=false;render();}}
}
$('auth-form').addEventListener('submit',event=>{event.preventDefault();void generate();});
async function copyCode(){
 const version=formVersion;
 try{
  let s=session.snapshot;
  if(!s.code){await session.refresh();s=session.snapshot;render();}
  if(version!==formVersion||!s.code)return;
  await navigator.clipboard.writeText(s.code);
  if(version!==formVersion)return;
  $('copy-label').textContent=t('copied');announce(t('copied'));
  clearTimeout(copyTimer);copyTimer=setTimeout(()=>{$('copy-label').textContent=t('copy');},2000);
 }catch{announce(t('copyFailed'));}
}
$('copy').onclick=copyCode;$('code').onclick=copyCode;
$('share-link').onclick=async()=>{
 if(!session.snapshot.active)return;
 try{
  const url=AuthLinks.create(location.href,$('secret').value,locale);
  await navigator.clipboard.writeText(url);announce(t('linkCopied'));
 }catch{announce(t('copyFailed'));}
};
function reset(){invalidate();$('auth-form').reset();$('secret').type='text';$('reveal').setAttribute('aria-pressed','true');$('reveal').setAttribute('aria-label',t('hide'));renderKeyGuide();render();}
$('reset').onclick=()=>{reset();$('secret').focus();};
async function tick(){try{await session.refresh();render();}catch{session.clear();error('invalid');render();}}
setInterval(()=>{void tick();},200);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void tick();});
addEventListener('pagehide',()=>{reset();$('toast').textContent='';$('toast').classList.remove('visible');});
async function readLink(){
 try{
  const link=AuthLinks.read(location.hash);
  if(link.lang&&!countryLocale&&!manuallyChosen)locale=AuthLinks.language([link.lang],supported);
  translate();
  if(!link.key)return;
  // A fragment never goes to the HTTP server. Remove it from the address after import.
  try{history.replaceState(null,'',location.pathname+location.search+(link.lang?'#lang='+encodeURIComponent(locale):''));}catch{}
  $('secret').value=link.key;
  await generate();
 }catch{translate();error('invalid');}
}
addEventListener('hashchange',()=>{void readLink();});
translate();void readLink();
// Code generation never waits for location. An IP result takes priority over the
// initial browser/link language, but a deliberate manual selection always wins.
void AuthGeo.detectCountry().then(country=>{
 const detected=AuthGeo.countryLanguage(country,navigator.languages||[navigator.language],supported);
 if(!detected)return;
 countryLocale=detected;
 if(!manuallyChosen){locale=detected;translate();}
}).catch(()=>{});
})();

