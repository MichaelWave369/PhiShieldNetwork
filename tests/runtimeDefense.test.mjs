import test from 'node:test';
import assert from 'node:assert/strict';
import {createLab,evaluate,transition,simulatedActive,exportLab} from '../src/lib/runtimeDefense.mjs';
test('targeted scenario requires monitoring and explicit approval',()=>{
 let s=createLab(); assert.throws(()=>transition(s,'activate',0));
 s=transition(s,'monitor',1); assert.equal(s.report.pass,true);
 assert.throws(()=>transition(s,'activate',2));
 s=transition(s,'approve',3); s=transition(s,'activate',4);
 assert.equal(simulatedActive(s,4),true);
 assert.equal(exportLab(s,4).mode,'simulation-only');
 assert.deepEqual(s.events.map(e=>e.sequence),[1,2,3]);
});
test('collateral damage blocks approval',()=>{
 const s=transition(createLab('collateral'),'monitor',1);
 assert.equal(s.report.falseBlocks,1); assert.equal(s.report.pass,false);
 assert.throws(()=>transition(s,'approve',2));
});
test('expiry is exclusive and blocks delayed activation',()=>{
 let s=transition(transition(createLab(),'monitor',0),'approve',1);
 assert.throws(()=>transition(s,'activate',s.expiresAt));
 s=transition(s,'activate',2);
 assert.equal(simulatedActive(s,s.expiresAt),false);
 s=transition(s,'expire',s.expiresAt); assert.equal(s.stage,'expired');
});
test('rollback and retirement are terminal for activation',()=>{
 let s=transition(transition(transition(createLab(),'monitor',0),'approve',1),'activate',2);
 s=transition(s,'rollback',3); assert.equal(simulatedActive(s,3),false);
 s=transition(s,'retire',4); assert.throws(()=>transition(s,'activate',5));
});
test('unknown scenario, real mode and backwards clock rejected',()=>{
 assert.throws(()=>createLab('unknown')); assert.throws(()=>evaluate('unknown'));
 assert.throws(()=>transition({...createLab(),mode:'live'},'monitor',0));
 assert.throws(()=>transition(transition(createLab(),'monitor',2),'approve',1));
});
