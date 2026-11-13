import test from 'node:test';
import assert from 'node:assert/strict';
import {dossierCoverage,summarizeDossiers} from './ci-dossier-coverage.js';
const player={id:'r1',display_name:'David Alejandro Cabezas Solano',fide_id:'6507522'};
const game=(w,b,m)=>`[Event "JUNCOS Clásico 2026"]
[Date "2026.10.12"]
[White "${w}"]
[Black "${b}"]
[Result "1-0"]
[ECO "A04"]

${m} 1-0`;
test('public game scores and tournaments do not count as stored PGN',()=>{
 const c=dossierCoverage(player,[]);
 assert.ok(c.evidence.tournaments>0);
 assert.ok(c.evidence.individualSheets>0);
 assert.equal(c.evidence.storedPgn,0);
 assert.ok(c.missing.includes('Importar partidas PGN completas'));
});
test('coverage only increases from supplied actual PGN records',()=>{
 const one={id:'g1',player_color:'w',played_at:'2026-10-12',pgn:game(player.display_name,'Aaron Vargas','1. Nf3 d5 2. d4 Nf6')};
 const c=dossierCoverage(player,[one]);
 assert.equal(c.evidence.storedPgn,1);
 assert.equal(c.evidence.white,1);
 assert.equal(c.evidence.black,0);
 assert.equal(c.evidence.ecoKnown,1);
 assert.ok(c.missing.includes('Recopilar partidas con negras'));
});
test('unrated profiles stay unrated and checklist remains grounded',()=>{
 const c=dossierCoverage({id:'x',display_name:'Jugador Sin Datos'},[]);
 assert.equal(c.rating.monthly,null);
 assert.equal(c.identity.fideId,null);
 assert.ok(c.missing.includes('Confirmar FIDE ID e identidad'));
});
test('aggregate summary never treats references as saved games',()=>{
 const all=summarizeDossiers([player,{id:'x',display_name:'Jugador Sin Datos'}]);
 assert.equal(all.players,2);
 assert.equal(all.withStoredPgn,0);
 assert.equal(all.withFide,1);
});
