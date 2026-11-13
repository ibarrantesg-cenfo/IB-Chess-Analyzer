import test from 'node:test';
import assert from 'node:assert/strict';
import {CI_TOURNAMENTS,CI_OLYMPIAD_CABEZAS_GAMES,tournamentSourcesFor,olympiadScoresFor,CI_SOURCE_STATUS} from './ci-tournament-sources.js';
import {readFileSync} from 'node:fs';
const profile=readFileSync(new URL('./ci-player-profile.js',import.meta.url),'utf8');
test('tournaments are linked by verified FIDE ID, independently of shared encounters',()=>{
 assert.equal(CI_TOURNAMENTS.length,8);
 assert.ok(tournamentSourcesFor('6507522').some(x=>x.id==='OLYMPIAD-OPEN-2026'));
 assert.ok(tournamentSourcesFor('6522181').some(x=>x.id==='UTN-CONARE-2026'));
 assert.ok(tournamentSourcesFor('6505945').some(x=>x.id==='CLASIF-ABS-2026'));
 assert.ok(tournamentSourcesFor('6508332').some(x=>x.id==='NACIONAL-ABS-2026'));
 assert.equal(tournamentSourcesFor('000000').length,0);
});
test('preliminary Grand Prix list never claims completed tournament results',()=>{
 const event=CI_TOURNAMENTS.find(x=>x.id==='GP3-PRELIM-2026');
 assert.equal(event.status,'preliminary-list');
 assert.match(CI_SOURCE_STATUS[event.status],/preliminar/);
 assert.ok(event.url.startsWith('https://'));
});
test('eight individual Olympiad game scores are linked and not confused with stored PGN',()=>{
 assert.equal(CI_OLYMPIAD_CABEZAS_GAMES.length,8);
 assert.deepEqual(CI_OLYMPIAD_CABEZAS_GAMES.map(x=>x.round),[1,2,3,4,5,7,9,10]);
 assert.equal(olympiadScoresFor('6507522').length,8);
 assert.equal(olympiadScoresFor('6508332').length,0);
 assert.ok(CI_OLYMPIAD_CABEZAS_GAMES.every(x=>x.url.includes('PartieSuche.aspx?art=36&id=')));
 assert.match(profile,/NO incrementan el contador de PGN almacenados/);
});
test('source URLs and participant keys are structurally valid',()=>{
 const unique=new Set(CI_TOURNAMENTS.map(t=>t.id));
 assert.equal(unique.size,CI_TOURNAMENTS.length);
 for(const t of CI_TOURNAMENTS){
  assert.ok(t.url.startsWith('https://'));
  assert.ok(CI_SOURCE_STATUS[t.status]);
  assert.ok(t.fideIds.every(v=>/^\d{7}$/.test(v)));
 }
});
