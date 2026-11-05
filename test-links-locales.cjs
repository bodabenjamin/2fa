const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
require('./totp.js');require('./auth-session.js');require('./links.js');require('./i18n.js');
const publicKey='GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const langs=Object.keys(AuthMessages),required=Object.keys(AuthMessages.en);
assert.equal(langs.length,59);
for(const lang of langs){assert.deepEqual(Object.keys(AuthMessages[lang]),required);for(const text of Object.values(AuthMessages[lang])){assert.equal(typeof text,'string');assert(text.trim().length>0);}assert.equal(AuthMessages[lang].remaining.split('{s}').length,2);}
const html=fs.readFileSync('./index.html','utf8');
for(const [,key]of html.matchAll(/data-i18n="([^"]+)"/g))assert(required.includes(key),key);
for(const lang of langs){const url=AuthLinks.create('https://example.test/auth?old=1#old',publicKey,lang);assert.equal(new URL(url).search,'');assert.equal(AuthLinks.read(new URL(url).hash).key,publicKey);assert.equal(AuthLinks.read(new URL(url).hash).lang,lang);}
const uri='otpauth://totp/Public%3ATest?secret='+publicKey+'&algorithm=SHA256&digits=8&period=60';
assert.equal(AuthLinks.read(new URL(AuthLinks.create('https://example.test/',uri,'hi')).hash).key,uri);
assert.equal(AuthLinks.read('#'+publicKey).key,publicKey);assert.equal(AuthLinks.read('#secret='+publicKey).key,publicKey);
assert.equal(AuthLinks.language(['xx','fr-CA'],langs),'fr');assert.equal(AuthLinks.language(['hi-IN'],langs),'hi');assert.equal(AuthLinks.language(['zh-Hant'],langs),'zh-Hant');assert.equal(AuthLinks.language(['xx'],langs),'en');assert.throws(()=>AuthLinks.read('#%XX'));
for(const pref of ['zh-TW','zh-HK','zh-MO','zh_Hant_TW'])assert.equal(AuthLinks.language([pref],langs),'zh-Hant');
for(const pref of ['zh-CN','zh-SG','zh-Hans-TW'])assert.equal(AuthLinks.language([pref],langs),'zh');
for(const pref of ['pa-PK','pa-Arab-PK','pa_Arab'])assert.equal(AuthLinks.language([pref],langs),'pa-Arab');
for(const pref of ['pa-IN','pa-Guru-PK','pa'])assert.equal(AuthLinks.language([pref],langs),'pa');
for(const [pref,lang]of [['te-IN','te'],['kn-IN','kn'],['ml-IN','ml'],['my-MM','my'],['km-KH','km'],['lo-LA','lo']])assert.equal(AuthLinks.language([pref],langs),lang);
assert.equal(AuthLinks.language(['sr-Cyrl-RS'],langs),'sr-Cyrl');assert.equal(AuthLinks.language(['SR_cYrL'],langs),'sr-Cyrl');assert.equal(AuthLinks.language(['sr-Latn-RS'],langs),'sr');assert.equal(AuthLinks.language(['sk-SK'],langs),'sk');assert.equal(AuthLinks.language(['nb-NO'],langs),'no');assert.equal(AuthLinks.language(['nn-NO'],langs),'no');assert.equal(AuthLinks.language(['tl-PH'],langs),'fil');assert.equal(AuthLinks.language(['iw-IL'],langs),'he');
class Element{constructor(){this.value='';this.textContent='';this.hidden=false;this.disabled=false;this.type='password';this.dataset={};this.events={};this.attributes={};const classes=new Set();this.classList={toggle(c,force){if(force===undefined)force=!classes.has(c);if(force)classes.add(c);else classes.delete(c);},add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)};}setAttribute(k,v){this.attributes[k]=v;}addEventListener(k,fn){this.events[k]=fn;}append(){}focus(){}reset(){elements.secret.value='';}}
const elements=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
let current=new URL('http://127.0.0.1:8793/#key='+publicKey+'&lang=fr'),controllerNow=49,intervalCallback;const clipboard=[];
const context={AuthSession:class extends AuthSession{constructor(){super(TotpCore,()=>controllerNow);}},TotpCore,AuthLinks,AuthMessages,AuthGeo:{detectCountry:async()=>null,countryLanguage:()=>null},crypto:globalThis.crypto,URL,URLSearchParams,encodeURIComponent,
 document:{getElementById:id=>{assert(elements[id],id);return elements[id];},createElement:()=>new Element(),querySelectorAll:()=>[],documentElement:{},addEventListener(){},hidden:false},
 navigator:{languages:['en'],clipboard:{writeText:async text=>clipboard.push(text)}},
 location:{get href(){return current.href},get hash(){return current.hash},get pathname(){return current.pathname},get search(){return current.search}},history:{replaceState(_a,_b,url){current=new URL(url,current);}},
 setTimeout:()=>1,clearTimeout(){},setInterval(fn){intervalCallback=fn;},addEventListener(){}};
vm.runInNewContext(fs.readFileSync('./app.js','utf8'),context);
(async()=>{
 for(let n=0;n<100&&elements.code.disabled;n++)await new Promise(r=>setTimeout(r,2));
 assert.equal(context.document.documentElement.lang,'fr');assert.equal(elements.code.textContent,'287 082');assert(!current.hash.includes(publicKey));
 await elements.code.onclick();assert.deepEqual(clipboard,['287082']);assert.equal(elements.toast.textContent,AuthMessages.fr.copied);assert.equal(elements['copy-label'].textContent,AuthMessages.fr.copied);
 await elements.copy.onclick();assert.deepEqual(clipboard,['287082','287082']);assert.equal(elements.toast.textContent,AuthMessages.fr.copied);
 for(const lang of langs){
  elements.language.value=lang;elements.language.onchange();
  assert.equal(context.document.documentElement.lang,lang==='sr'?'sr-Latn':lang);
  assert.equal(context.document.documentElement.dir,['ar','he','fa','ur','pa-Arab'].includes(lang)?'rtl':'ltr');
  assert.equal(elements.secret.placeholder,AuthMessages[lang].placeholder);
  assert.equal(elements.code.textContent,'287 082');
  assert.equal(elements['generate-label'].textContent,AuthMessages[lang].generate);
  assert.equal(elements.timer.textContent,AuthMessages[lang].remaining.replace('{s}',11));
  assert.equal(elements['key-count'].textContent,AuthMessages[lang].charCount.replace('{n}',32));
  const before=clipboard.length;await elements.code.onclick();assert.equal(clipboard.length,before+1);assert.equal(clipboard.at(-1),'287082');assert.equal(elements.toast.textContent,AuthMessages[lang].copied);assert.equal(elements['copy-label'].textContent,AuthMessages[lang].copied);
 }
 assert.equal(elements['expiry-status'].textContent,'');assert.equal(elements['timer-seconds'].textContent,'11');
 controllerNow=50;intervalCallback();await new Promise(r=>setImmediate(r));
 assert(elements.result.classList.contains('warning'));assert(!elements.result.classList.contains('urgent'));assert.equal(elements['timer-seconds'].textContent,'10');assert.equal(elements['expiry-status'].textContent,AuthMessages[langs.at(-1)].expiresSoon);
 controllerNow=55;intervalCallback();await new Promise(r=>setImmediate(r));
 assert(elements.result.classList.contains('urgent'));assert(!elements.result.classList.contains('warning'));assert.equal(elements['timer-seconds'].textContent,'5');assert.equal(elements['expiry-status'].textContent,AuthMessages[langs.at(-1)].expiresNow);
 controllerNow=60;intervalCallback();for(let n=0;n<100&&(elements.code.disabled||elements.code.textContent==='287 082');n++)await new Promise(r=>setTimeout(r,2));
 assert(!elements.result.classList.contains('urgent'));assert(!elements.result.classList.contains('warning'));assert.equal(elements['timer-seconds'].textContent,'30');assert.equal(elements['timer-ring'].attributes['stroke-dashoffset'],'0');assert.equal(elements['expiry-status'].textContent,'');assert.notEqual(elements.code.textContent,'287 082');assert(!elements.copy.disabled);
 elements.language.value='hu';elements.language.onchange();await elements.code.onclick();assert.equal(elements.toast.textContent,'Kimásolva!');
 const freshCode=elements.code.textContent;context.navigator.clipboard.writeText=async()=>{throw Error('clipboard denied');};await elements.code.onclick();assert.equal(elements.toast.textContent,AuthMessages.hu.copyFailed);assert.equal(elements.code.textContent,freshCode);
 for(const [value,count,state]of [[publicKey.match(/.{4}/g).join(' - '),32,'valid'],['JBSWY3DPEHPK3PXP',16,'valid'],[uri,32,'valid'],['0123456789012345',16,'incomplete']]){elements.secret.value=value;elements.secret.events.input();assert.equal(elements['key-count'].textContent,'Karakterek: '+count);assert.equal(elements['key-stats'].attributes['data-state'],state);assert.equal(elements.secret.value,value);}
 for(const lang of langs){
  elements.language.value=lang;elements.language.onchange();
  for(const [count,state,message,param,limit]of [[15,'short','keyTooShort','{min}',16],[1025,'long','keyTooLong','{max}',1024]]){
   elements.secret.value='A'.repeat(count);elements.secret.events.input();assert.equal(elements['key-stats'].attributes['data-state'],state);assert.equal(elements['key-feedback'].textContent,AuthMessages[lang][message].replace(param,limit));assert(!elements['key-feedback'].hidden);assert.equal(elements.secret.attributes['aria-invalid'],'true');assert(elements.generate.disabled);assert(elements.code.disabled);
  }
 }
 elements.language.value='hu';elements.language.onchange();
 for(const count of [16,32,1024]){elements.secret.value='A'.repeat(count);elements.secret.events.input();assert(elements['key-feedback'].hidden);assert(!elements.generate.disabled);assert.equal(elements.secret.attributes['aria-invalid'],'false');}
 elements.secret.value='otpauth://totp/Public?secret='+'A'.repeat(15);elements.secret.events.input();assert.equal(elements['key-count'].textContent,'Karakterek: 15');assert.equal(elements['key-stats'].attributes['data-state'],'short');
 elements['auth-form'].events.submit({preventDefault(){}});await new Promise(r=>setImmediate(r));assert(elements.code.disabled);assert(elements.copy.disabled);assert(elements.generate.disabled);
 elements.secret.value='A'.repeat(17);elements.secret.events.input();assert.equal(elements['key-feedback'].textContent,AuthMessages.hu.invalid);assert(elements.generate.disabled);
 elements.reset.onclick();assert.equal(elements['key-count'].textContent,'Karakterek: 0');assert.equal(elements['key-stats'].attributes['data-state'],'empty');assert.equal(elements['timer-seconds'].textContent,'—');assert.equal(elements['expiry-status'].textContent,'');assert(elements['key-feedback'].hidden);assert.equal(elements.secret.attributes['aria-invalid'],'false');
 elements.secret.value='bad';elements.secret.events.input();assert.equal(elements.code.disabled,true);assert.equal(elements.copy.disabled,true);
 console.log('PASS: 59 complete locale dictionaries, links/locales/RTL/clipboard, character counts, 59-language short/long warnings, length boundaries, URI-secret length, invalid-length submission blocking, warning at 10s, urgent at 5s, fresh-code reset and clearing. DOM controller tested with a fixture, not a real browser.');
})().catch(e=>{console.error(e);process.exitCode=1;});
