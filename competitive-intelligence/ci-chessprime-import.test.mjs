import test from 'node:test';
import assert from 'node:assert/strict';
import {splitPGN,parseCIImport,matchesCIPlayerHeader} from './ci-player-intelligence.js';
import {planCITournamentImport} from './ci-tournament-import.js';

const cabezas={id:'c',display_name:'David Alejandro Cabezas Solano',fide_id:'6507522'};
const gerardo={id:'g',display_name:'Gerardo Alfonso Ramírez Madrid',fide_id:'6505945'};
const game=(source,white,black,i)=>`[Source "${source}"]
[Event "3rd Caissa Guatemala Open"]
[Site "Guatemala City GUA"]
[Date "2026.01.07"]
[White "${white}"]
[Black "${black}"]
[Result "1-0"]
[ECO "A04"]

1. Nf3 d5 2. g3 Nf6 1-0`;
test('ChessPrime PGN with Source before Event is valid and correctly matched',()=>{
 const raw=game('ChessPrime','Cabezas Solano,David Alejandro','Other Player',1);
 assert.equal(splitPGN(raw).length,1);
 const out=parseCIImport(raw,cabezas);
 assert.equal(out.good.length,1);
 assert.equal(out.good[0].player_color,'w');
 assert.equal(out.rejected.length,0);
});
test('many Source-first games split accurately without losing tags',()=>{
 const text=Array.from({length:240},(_,i)=>game('ChessPrime','Cabezas Solano,David Alejandro','Other '+i,i)).join('\n\n');
 const parts=splitPGN(text);
 assert.equal(parts.length,240);
 assert.ok(parts.every(p=>p.startsWith('[Source "ChessPrime"]')));
 const plan=planCITournamentImport(text,[cabezas,gerardo]);
 assert.equal(plan.total,240);
 assert.equal(plan.ready.length,240);
 assert.equal(plan.rejected.length,0);
});
test('surname-first FIDE player identification is exact, not substring or shared surname',()=>{
 const raw=game('ChessPrime','Ramirez Madrid,Gerardo Alfonso','Another Player');
 assert.equal(parseCIImport(raw,gerardo).good.length,1);
 assert.equal(parseCIImport(raw,cabezas).good.length,0);
 assert.equal(matchesCIPlayerHeader(raw,{display_name:'Ramírez Madrid Gerardo',fide_id:'9999999'}),false);
});
test('source-first PGN also handles two registered opponents',()=>{
 const raw=game('ChessPrime','Cabezas Solano,David Alejandro','Ramirez Madrid,Gerardo Alfonso');
 const result=planCITournamentImport(raw,[cabezas,gerardo]);
 assert.equal(result.ready.length,2);
 assert.equal(result.uniqueGames,1);
});
test('header order is irrelevant for Event-first exported PGN',()=>{
 const raw=game('ChessPrime','Cabezas Solano,David Alejandro','Other Player').replace('[Source "ChessPrime"]\n','');
 assert.equal(splitPGN(raw).length,1);
 assert.equal(parseCIImport(raw,cabezas).good.length,1);
});
test('bulk importer no longer forces JUNCOS provenance on ChessPrime uploads',()=>{
 const {readFileSync}=requireTestHelpers();
 const src=readFileSync(new URL('./ci-tournament-import.js',import.meta.url),'utf8');
 assert.ok(!src.includes('value="${CI_JUNCOS_STANDARD_PGN.url}"'));
 assert.ok(src.includes('1.500')===false||src.includes('1500'));
});
function requireTestHelpers(){return {readFileSync:readFileSyncNode};}
import {readFileSync as readFileSyncNode} from 'node:fs';
