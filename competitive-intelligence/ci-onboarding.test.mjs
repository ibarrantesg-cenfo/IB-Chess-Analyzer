import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {UNIVERSITY_RIVALS,candidatePayload,reconcileCandidates} from './ci-university-data.js';
const code=readFileSync(new URL('./ci-panel.js',import.meta.url),'utf8');
test('one-time university onboarding is initially hidden, independent of manual add',()=>{
 assert.match(code,/class="ci-starter" id="ci-starter" hidden/);
 assert.match(code,/id="ci-create" type="button"/);
});
test('onboarding disappears when all university profiles are synchronized',()=>{
 assert.match(code,/el\('ci-starter'\)\.hidden=unresolved===0/);
 assert.match(code,/updateSeedSummary\(\)/);
 const persisted=UNIVERSITY_RIVALS.map((c,i)=>({id:String(i),...candidatePayload(c)}));
 const plan=reconcileCandidates(persisted);
 assert.equal(plan.adds.length+plan.updates.length,0);
});
test('incomplete imported records are recognized without duplicating completed ones',()=>{
 const persisted=UNIVERSITY_RIVALS.slice(0,4).map((c,i)=>({id:String(i),...candidatePayload(c)}));
 const plan=reconcileCandidates(persisted);
 assert.equal(plan.adds.length,UNIVERSITY_RIVALS.length-4);
 assert.equal(plan.unchanged.length,4);
});
