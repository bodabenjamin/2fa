(function () {
  'use strict';
  const endpoint='https://api.country.is/';
  const countries=Object.create(null);
  function group(codes,languages){for(const code of codes.split(' '))countries[code]=languages;}
  group('HU',['hu']);group('RO MD',['ro']);group('SK',['sk']);group('CZ',['cs']);
  group('RS ME',['sr','sr-Cyrl']);group('HR',['hr']);group('BA',['bs','hr','sr','sr-Cyrl']);
  group('BG',['bg']);group('SI',['sl']);group('MK',['mk','sq']);group('AL XK',['sq','sr']);
  group('GB US AU NZ IE',['en']);group('CA',['en','fr']);
  group('DE AT LI',['de']);group('CH',['de','fr','it']);group('LU',['fr','de']);
  group('FR MC',['fr']);group('BE',['nl','fr','de']);group('NL',['nl']);
  group('IT SM VA',['it']);group('ES MX AR BO CL CO CR CU DO EC GT HN NI PA PE PY SV UY VE',['es']);
  group('PT BR AO MZ CV GW ST TL',['pt']);
  group('PL',['pl']);group('RU BY',['ru']);group('UA',['uk']);group('TR',['tr']);
  group('GR',['el']);group('CY',['el','tr']);
  group('DK',['da']);group('SE',['sv']);group('NO',['no']);group('FI',['fi','sv']);
  group('EE',['et']);group('LV',['lv']);group('LT',['lt']);
  group('IN',['hi','bn','ta','te','kn','ml','mr','gu','pa','en']);
  group('PK',['ur','pa-Arab','en']);group('BD',['bn']);group('NP',['ne']);group('LK',['ta','en']);
  group('CN',['zh']);group('TW',['zh-Hant']);group('HK',['zh-Hant','en']);group('MO',['zh-Hant','pt']);
  group('SG',['en','zh','ms','ta']);group('MY',['ms','en','zh','ta']);group('ID',['id']);
  group('JP',['ja']);group('KR KP',['ko']);group('VN',['vi']);group('TH',['th']);
  group('PH',['fil','en']);group('MM',['my']);group('KH',['km']);group('LA',['lo']);
  group('IL',['he','ar']);group('IR AF',['fa']);
  group('SA AE QA BH KW OM YE IQ SY JO LB PS EG LY SD',['ar']);group('DZ MA TN',['ar','fr']);
  group('KE TZ',['sw','en']);group('UG',['en','sw']);
  group('BJ BF CD CF CG CI CM DJ GA GN MG ML NE SN TD TG',['fr']);

  function countryLanguage(country,preferences,supported){
    if(typeof country!=='string'||!/^[A-Z]{2}$/i.test(country))return null;
    const available=(countries[country.toUpperCase()]||['en']).filter(code=>supported.includes(code));
    const preferred=AuthLinks.language(preferences,supported,null);
    return available.includes(preferred)?preferred:available[0]||(supported.includes('en')?'en':supported[0]);
  }

  async function detectCountry({fetcher=globalThis.fetch,timeoutMs=2500}={}){
    if(typeof fetcher!=='function')return null;
    const controller=new AbortController();let timer;
    try{
      const timeout=new Promise(resolve=>{timer=setTimeout(()=>{controller.abort();resolve(null);},timeoutMs);});
      const request=(async()=>{
        // Constant URL: no key, code, page URL, customer data, body or credentials.
        const response=await fetcher(endpoint,{method:'GET',mode:'cors',credentials:'omit',
          cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',signal:controller.signal});
        if(!response.ok)return null;
        const data=await response.json();
        return typeof data?.country==='string'&&/^[A-Z]{2}$/i.test(data.country)?data.country.toUpperCase():null;
      })().catch(()=>null);
      return await Promise.race([request,timeout]);
    }finally{clearTimeout(timer);}
  }
  globalThis.AuthGeo={countryLanguage,detectCountry};
})();
