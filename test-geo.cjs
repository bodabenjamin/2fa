const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
require('./links.js');require('./geo.js');require('./totp.js');require('./auth-session.js');require('./i18n.js');
const supported=Object.keys(AuthMessages),fixture='GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const settle=async()=>{for(let n=0;n<15;n++)await new Promise(r=>setImmediate(r));};

function harness({country=Promise.resolve('HU'),preferences=['en'],hash='#key='+fixture+'&lang=fr'}={}){
 class Element{constructor(){this.value='';this.textContent='';this.hidden=false;this.disabled=false;this.type='text';this.events={};this.attributes={};this.classList={toggle(){},add(){},remove(){}};}setAttribute(k,v){this.attributes[k]=v;}addEventListener(k,f){this.events[k]=f;}append(){}focus(){}reset(){elements.secret.value='';}}
 const html=fs.readFileSync('./index.html','utf8');
 const elements=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
 let current=new URL('https://example.test/'+hash),calls=0;const events={};
 const context={AuthSession:class extends AuthSession{constructor(){super(TotpCore,()=>59);}},TotpCore,AuthLinks,AuthMessages,
  AuthGeo:{countryLanguage:AuthGeo.countryLanguage,detectCountry:()=>{calls++;return country;}},
  crypto:globalThis.crypto,URL,URLSearchParams,encodeURIComponent,
  navigator:{languages:preferences,clipboard:{writeText:async()=>{}}},
  document:{getElementById:id=>{assert(elements[id],id);return elements[id];},createElement:()=>new Element(),querySelectorAll:()=>[],documentElement:{},addEventListener(){},hidden:false},
  location:{get href(){return current.href},get hash(){return current.hash},get pathname(){return current.pathname},get search(){return current.search}},
  history:{replaceState(_a,_b,url){current=new URL(url,current);}},
  setTimeout:()=>1,clearTimeout(){},setInterval(){},addEventListener(name,fn){events[name]=fn;}};
 vm.runInNewContext(fs.readFileSync('./app.js','utf8'),context);
 return {context,elements,events,setHash(hash){current.hash=hash;events.hashchange();},get calls(){return calls;}};
}

(async()=>{
 for(const [country,language]of Object.entries({HU:'hu',RO:'ro',SK:'sk',CZ:'cs',RS:'sr',HR:'hr',FR:'fr',DE:'de',IT:'it',ES:'es',IN:'hi',CN:'zh',TW:'zh-Hant',PK:'ur',SA:'ar',KE:'sw',JP:'ja'}))assert.equal(AuthGeo.countryLanguage(country,['xx'],supported),language,country);
 assert.equal(AuthGeo.countryLanguage('CA',['fr-CA'],supported),'fr');
 assert.equal(AuthGeo.countryLanguage('BE',['de-DE'],supported),'de');
 assert.equal(AuthGeo.countryLanguage('IN',['ta-IN'],supported),'ta');
 assert.equal(AuthGeo.countryLanguage('PK',['pa-PK'],supported),'pa-Arab');
 assert.equal(AuthGeo.countryLanguage('hu',['fr'],supported),'hu');
 assert.equal(AuthGeo.countryLanguage('IS',['hu'],supported),'en');
 for(const invalid of [null,undefined,'','HUN','<script>',123])assert.equal(AuthGeo.countryLanguage(invalid,['hu'],supported),null);
 let requests=0;
 assert.equal(await AuthGeo.detectCountry({fetcher:async(url,options)=>{
  requests++;assert.equal(url,'https://api.country.is/');assert.equal(new URL(url).search,'');
  assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer');assert.equal(options.cache,'no-store');assert.equal(options.redirect,'error');
  assert.equal(options.method,'GET');assert.equal(options.body,undefined);assert.equal(options.headers,undefined);
  assert(!JSON.stringify(options).includes(fixture));return {ok:true,json:async()=>({country:'hu',ip:'public-fixture-unused'})};
 }}),'HU');assert.equal(requests,1);
 assert.equal(await AuthGeo.detectCountry({fetcher:async()=>{throw Error('offline');}}),null);
 assert.equal(await AuthGeo.detectCountry({fetcher:async()=>({ok:false,status:429})}),null);
 for(const data of [null,{}, {country:null},{country:'HUN'}, {country:'<img>'}])assert.equal(await AuthGeo.detectCountry({fetcher:async()=>({ok:true,json:async()=>data})}),null);
 assert.equal(await AuthGeo.detectCountry({fetcher:async()=>({ok:true,json:async()=>{throw Error('bad JSON');}})}),null);
 assert.equal(await AuthGeo.detectCountry({fetcher:null}),null);
 let aborted=false;
 assert.equal(await AuthGeo.detectCountry({timeoutMs:10,fetcher:(_url,options)=>{options.signal.addEventListener('abort',()=>{aborted=true;});return new Promise(()=>{});}}),null);
 assert(aborted);
 // Also bound a response whose body never completes.
 assert.equal(await AuthGeo.detectCountry({timeoutMs:10,fetcher:async()=>({ok:true,json:()=>new Promise(()=>{})})}),null);
 const h=harness({country:Promise.resolve('HU'),preferences:['de']});await settle();
 assert.equal(h.context.document.documentElement.lang,'hu');assert.equal(h.elements.code.textContent,'287 082');assert.equal(h.calls,1);
 h.setHash('key='+fixture+'&lang=fr');await settle();assert.equal(h.context.document.documentElement.lang,'hu');assert.equal(h.calls,1);
 const late=deferred(),manual=harness({country:late.promise});
 manual.elements.language.value='sk';manual.elements.language.onchange();late.resolve('FR');await settle();
 assert.equal(manual.context.document.documentElement.lang,'sk');
 manual.setHash('key='+fixture+'&lang=de');await settle();assert.equal(manual.context.document.documentElement.lang,'sk');
 const rtl=harness({country:Promise.resolve('SA')});await settle();assert.equal(rtl.context.document.documentElement.lang,'ar');assert.equal(rtl.context.document.documentElement.dir,'rtl');
 const offline=harness({country:Promise.resolve(null)});await settle();assert.equal(offline.context.document.documentElement.lang,'fr');assert.equal(offline.elements.code.textContent,'287 082');
 const browser=harness({country:Promise.resolve(null),preferences:['ro'],hash:''});await settle();assert.equal(browser.context.document.documentElement.lang,'ro');
 const english=harness({country:Promise.resolve('IS'),preferences:['hu'],hash:''});await settle();assert.equal(english.context.document.documentElement.lang,'en');
 const html=fs.readFileSync('./index.html','utf8');
 assert(html.includes("connect-src https://api.country.is;"));assert(html.indexOf('src="geo.js"')<html.indexOf('src="app.js"'));
 console.log('PASS: IP country priority over browser/link, multilingual countries, manual-choice race, hash changes, RTL, fallback, timeout/abort, malformed/rate-limited responses, one constant credential-free/referrer-free request with no key/code, unchanged TOTP. Controller tested with a DOM fixture.');
})().catch(e=>{console.error(e);process.exitCode=1;});
