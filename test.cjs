const assert=require('node:assert/strict');
require('./totp.js');const {parse,key,generate,decode}=globalThis.TotpCore;
function base32(str){let bits=0,n=0,out='';for(const byte of Buffer.from(str)){n=(n<<8)|byte;bits+=8;while(bits>=5){bits-=5;out+='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[(n>>>bits)&31];}n&=(1<<bits)-1;}if(bits)out+='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[(n<<(5-bits))&31];return out;}
(async()=>{
 const times=[59,1111111109,1111111111,1234567890,2000000000,20000000000];
 const cases={SHA1:['12345678901234567890',['94287082','07081804','14050471','89005924','69279037','65353130']],SHA256:['12345678901234567890123456789012',['46119246','68084774','67062674','91819424','90698825','77737706']],SHA512:['1234567890123456789012345678901234567890123456789012345678901234',['90693936','25091201','99943326','93441116','38618901','47863826']]};
 for(const [algorithm,[secret,expected]] of Object.entries(cases)){
  const config=parse(base32(secret),{algorithm,digits:8}),k=await key(config);
  for(let i=0;i<times.length;i++)assert.equal(await generate(k,times[i],30,8),expected[i]);
 }
 const uri=parse('otpauth://totp/Test%3Aalice?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&algorithm=SHA256&digits=8&period=60');
 assert.equal(uri.name,'Test:alice');assert.equal(uri.period,60);assert.equal(uri.digits,8);assert.equal(uri.algorithm,'SHA256');
 for(const invalid of ['123456','bad!key','otpauth://hotp/Test?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ','otpauth://totp/a?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&period=0','otpauth://totp/a?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&algorithm=MD5'])assert.throws(()=>parse(invalid));
 assert.equal(Buffer.from(decode('gez dgn-bvgy3tqojqgez dgnbvgy3tqojq')).toString(),'12345678901234567890');
 assert.equal(TotpCore.limits.minKeyCharacters,16);assert.equal(TotpCore.limits.maxKeyCharacters,1024);
 assert.throws(()=>parse('A'.repeat(15)));assert.equal(parse('A'.repeat(16)).bytes.length,10);
 assert.equal(parse('A'.repeat(1024)).bytes.length,640);assert.throws(()=>parse('A'.repeat(1025)));
 const k=await key(parse('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'));
 assert.equal(await generate(k,59,30,6),'287082');assert.notEqual(await generate(k,59,30,6),await generate(k,60,30,6));
 console.log('PASS: all 18 RFC 6238 SHA1/SHA256/SHA512 vectors; 6-digit result, boundary rollover, URI settings, normalization, invalid input.');
})().catch(e=>{console.error(e);process.exitCode=1;});
