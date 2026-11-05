const assert=require('node:assert/strict');
require('./totp.js');require('./auth-session.js');
const SECRET='GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'; // Public RFC test key.
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
(async()=>{
 let now=59;const s=new AuthSession(TotpCore,()=>now);
 assert.equal(s.snapshot.active,false);await s.start(SECRET);assert.equal(s.snapshot.code,'287082');assert.equal(s.snapshot.remaining,1);
 now=60;assert.equal(s.snapshot.code,'');await s.refresh();assert.notEqual(s.snapshot.code,'287082');assert.equal(s.snapshot.remaining,30);
 s.clear();assert.equal(s.snapshot.active,false);assert.equal(s.key,null);assert.equal(s.snapshot.code,'');
 now=59;await s.start('otpauth://totp/Test?secret='+SECRET+'&digits=8&period=30');assert.equal(s.snapshot.code,'94287082');assert.equal(s.snapshot.digits,8);
 const importing=deferred();let bytes;
 const importSession=new AuthSession({parse:()=>({bytes:bytes=new Uint8Array(20).fill(1),period:30,digits:6}),key:()=>importing.promise,generate:async()=>'123456'},()=>59);
 const oldStart=importSession.start('public-fixture');importSession.clear();importing.resolve({});assert.equal(await oldStart,false);assert.equal(importSession.key,null);assert(bytes.every(x=>x===0));
 const calculating=deferred();let called=0;
 const delayed=new AuthSession({parse:TotpCore.parse,key:TotpCore.key,generate:()=>{called++;return calculating.promise;}},()=>now);
 now=59;const delayedStart=delayed.start(SECRET);await new Promise(r=>setTimeout(r,20));assert.equal(called,1);now=60;calculating.resolve('123456');await delayedStart;assert.equal(delayed.snapshot.code,'');
 const newCalc=deferred();const changed=new AuthSession({parse:TotpCore.parse,key:TotpCore.key,generate:()=>newCalc.promise},()=>59);
 const pendingStart=changed.start(SECRET);await new Promise(r=>setTimeout(r,20));changed.clear();newCalc.resolve('123456');assert.equal(await pendingStart,false);assert.equal(changed.snapshot.code,'');
 console.log('PASS: session rollover, immediate stale-code hiding, clear, otpauth settings, delayed import cancellation, boundary-crossing computation, in-flight clear, key-byte cleanup.');
})().catch(e=>{console.error(e);process.exitCode=1;});
