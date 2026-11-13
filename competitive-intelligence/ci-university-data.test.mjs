import test from 'node:test';
import assert from 'node:assert/strict';
import {UNIVERSITY_RIVALS,CI_SOURCES,findUniversityCandidate,matchExistingCandidate,candidatePayload,reconcileCandidates} from './ci-university-data.js';

test('university catalog only contains sourced competitors (not the administrator)',()=>{
 assert.ok(UNIVERSITY_RIVALS.length>=20);
 assert.ok(UNIVERSITY_RIVALS.every(x=>x.sourceKeys.length>=1));
 assert.ok(UNIVERSITY_RIVALS.every(x=>x.sourceKeys.every(k=>CI_SOURCES[k]?.url.startsWith('https://'))));
 assert.ok(!UNIVERSITY_RIVALS.some(x=>x.display_name.includes('Ian Daniel Barrantes')));
});
test('verified FIDE identifiers can be matched even with alternate name accents',()=>{
 const c=UNIVERSITY_RIVALS.find(x=>x.fide_id==='6507522');
 assert.equal(c.university,'UCR');
 assert.equal(c.ratings.standard,2249);
 assert.equal(findUniversityCandidate({fide_id:'6507522'}),c);
 assert.equal(matchExistingCandidate(c,[{display_name:'DAVID ALEJANDRO CABEZAS SOLANO',fide_id:null}]).display_name,'DAVID ALEJANDRO CABEZAS SOLANO');
});
test('enrich existing player while preserving user-edited priority, name and notes',()=>{
 const c=UNIVERSITY_RIVALS.find(x=>x.fide_id==='6507522');
 const old={id:'x',display_name:'David Alejandro Cabezas Solano',fide_id:null,priority:'C',aliases:['D. Cabezas'],notes:'Análisis personal sin validar'};
 const p=candidatePayload(c,old);
 assert.equal(p.priority,'C');
 assert.equal(p.fide_id,'6507522');
 assert.deepEqual(p.aliases,['D. Cabezas']);
 assert.ok(p.notes.startsWith(old.notes));
 assert.match(p.notes,/https:\/\//);
 assert.equal(candidatePayload(c,{...old,...p}).notes,p.notes);
});
test('re-import is idempotent for sourced profiles',()=>{
 const records=UNIVERSITY_RIVALS.map((c,i)=>({id:'record-'+i,...candidatePayload(c)}));
 const plan=reconcileCandidates(records);
 assert.equal(plan.adds.length,0);
 assert.equal(plan.updates.length,0);
 assert.equal(plan.unchanged.length,UNIVERSITY_RIVALS.length);
});
test('Mateo FIDE ID verified from official records without fabricating Elo',()=>{
 const c=UNIVERSITY_RIVALS.find(x=>x.display_name==='Mateo Espitia Torres');
 assert.equal(c.fide_id,'6508332');
 assert.equal(Object.keys(c.ratings).length,0);
 assert.match(candidatePayload(c).notes,/FedeU/);
});
