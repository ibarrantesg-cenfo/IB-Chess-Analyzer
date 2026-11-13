import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {UNIVERSITY_RIVALS,CI_SOURCES,reconcileCandidates,candidatePayload} from './ci-university-data.js';
import {CI_JUNCOS_STANDARD_PGN,gameReferences,analyzeCIGames} from './ci-player-intelligence.js';
const profile=readFileSync(new URL('./ci-player-profile.js',import.meta.url),'utf8');
test('public source states there are 10 tournament PGNs, not 10 games per player',()=>{
 assert.equal(CI_JUNCOS_STANDARD_PGN.totalAdvertised,10);
 assert.match(CI_JUNCOS_STANDARD_PGN.url,/tnr=1516373/);
 assert.ok(gameReferences('6507522').some(x=>x.kind==='tournament-pgn'));
 assert.equal(gameReferences('6505945').some(x=>x.kind==='tournament-pgn'),false);
 assert.match(profile,/No todas corresponden necesariamente a este jugador/);
});
test('four new JUNCOS competitors are documented, including FIDE-unrated players',()=>{
 for(const fid of ['6511430','6529151','6550550','6583822']){
  const rival=UNIVERSITY_RIVALS.find(x=>x.fide_id===fid);
  assert.ok(rival);
  assert.ok(rival.sourceKeys.includes('standard'));
 }
 assert.equal(UNIVERSITY_RIVALS.find(x=>x.fide_id==='6550550').ratings.standard,undefined);
 assert.equal(UNIVERSITY_RIVALS.find(x=>x.fide_id==='6583822').ratings.standard,undefined);
});
test('adding candidates does not change existing notes and no duplicated records are created',()=>{
 const persisted=UNIVERSITY_RIVALS.slice(0,22).map((c,i)=>({id:String(i),...candidatePayload(c)}));
 const actions=reconcileCandidates(persisted);
 assert.equal(actions.adds.length,4);
 assert.equal(actions.updates.length,0);
});
test('source count is not claimed to be PGN count',()=>{
 assert.match(profile,/records.length\+' partidas completas'/);
 assert.match(profile,/sources.length\+' referencias consultables'/);
 assert.match(profile,/data.lines\[color\]/);
 assert.equal(analyzeCIGames([]).valid,0);
});
