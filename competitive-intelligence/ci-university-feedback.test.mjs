import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reconcileCandidates,UNIVERSITY_RIVALS,candidatePayload} from './ci-university-data.js';
const panel=readFileSync(new URL('./ci-panel.js',import.meta.url),'utf8');
const styles=readFileSync(new URL('./ci-style.css',import.meta.url),'utf8');

test('university sync gives feedback next to the button',()=>{
 assert.match(panel,/id="ci-seed-status"[^>]+role="status"/);
 assert.match(panel,/const seedMessage=/);
 assert.match(panel,/ya están registrados y no necesitan cambios/);
 assert.match(panel,/No se pudo comprobar la base/);
 assert.match(styles,/\.ci-seed-status\[data-kind="success"\]/);
});
test('catalog that has already been imported produces zero changes',()=>{
 const existing=UNIVERSITY_RIVALS.map((c,i)=>({id:'p-'+i,...candidatePayload(c)}));
 const plan=reconcileCandidates(existing);
 assert.equal(plan.adds.length,0);
 assert.equal(plan.updates.length,0);
 assert.equal(plan.unchanged.length,UNIVERSITY_RIVALS.length);
});
test('university sync is explicit and loads latest Supabase state',()=>{
 assert.match(panel,/el\('ci-seed'\)\.onclick=async/);
 assert.match(panel,/players=await service\.listPlayers\(\)/);
 assert.match(panel,/if\(!confirm\('¿Sincronizar /);
});
