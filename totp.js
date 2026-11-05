(function () {
  'use strict';
  const limits=Object.freeze({minKeyCharacters:16,maxKeyCharacters:1024});
  function decode(value) {
    const s = value.toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '');
    if (s.length < limits.minKeyCharacters || s.length > limits.maxKeyCharacters || !/^[A-Z2-7]+$/.test(s) || ![0,2,4,5,7].includes(s.length % 8)) throw new Error('Érvénytelen Base32 titkos kulcs. Ellenőrizd a másolt szöveget.');
    let bits=0, buffer=0; const bytes=[];
    for (const c of s) {
      buffer=(buffer<<5)|'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(c); bits+=5;
      if(bits>=8){bits-=8;bytes.push((buffer>>>bits)&255);buffer&=(1<<bits)-1;}
    }
    if(buffer!==0 || bytes.length<10) throw new Error('A kulcs túl rövid vagy hibás. A 2FA beállításakor kapott teljes kulcsot add meg.');
    return new Uint8Array(bytes);
  }
  function parse(input, settings={}) {
    let secret=input.trim(), name=settings.name?.trim()||'', algorithm=settings.algorithm||'SHA1',digits=Number(settings.digits||6),period=Number(settings.period||30);
    if(/^otpauth:/i.test(secret)) {
      let u;try{u=new URL(secret);}catch{throw new Error('Hibás otpauth hivatkozás.');}
      if(u.protocol!=='otpauth:' || u.hostname!=='totp') throw new Error('Ez az oldal időalapú TOTP-kulcsot fogad, HOTP-kulcsot nem.');
      secret=u.searchParams.get('secret')||'';
      if(!name){try{name=decodeURIComponent(u.pathname.slice(1));}catch{throw new Error('Hibás fióknév a hivatkozásban.');}}
      algorithm=u.searchParams.get('algorithm')||'SHA1';digits=Number(u.searchParams.get('digits')||6);period=Number(u.searchParams.get('period')||30);
    }
    algorithm=algorithm.toUpperCase().replace(/-/g,'');
    if(!['SHA1','SHA256','SHA512'].includes(algorithm))throw new Error('Támogatott algoritmusok: SHA1, SHA256, SHA512.');
    if(![6,8].includes(digits))throw new Error('6 vagy 8 számjegyű kód támogatott.');
    if(!Number.isInteger(period)||period<1||period>300)throw new Error('A periódus 1–300 másodperc közötti egész szám legyen.');
    return {bytes:decode(secret), name:name.slice(0,120),algorithm,digits,period};
  }
  async function key(config){return crypto.subtle.importKey('raw',config.bytes,{name:'HMAC',hash:config.algorithm.replace('SHA','SHA-')},false,['sign']);}
  async function generate(key,timeSeconds,period=30,digits=6){
    let counter=BigInt(Math.floor(timeSeconds/period));const buffer=new Uint8Array(8);
    for(let i=7;i>=0;i--){buffer[i]=Number(counter&255n);counter>>=8n;}
    const mac=new Uint8Array(await crypto.subtle.sign('HMAC',key,buffer));const o=mac[mac.length-1]&15;
    const value=(((mac[o]&127)<<24)|(mac[o+1]<<16)|(mac[o+2]<<8)|mac[o+3])>>>0;
    return String(value % (10**digits)).padStart(digits,'0');
  }
  globalThis.TotpCore={decode,parse,key,generate,limits};
})();
