import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planCITournamentImport} from './ci-tournament-import.js';
const participants=[
 {id:'p1',display_name:'David Alejandro Cabezas Solano',fide_id:'6507522'},
 {id:'p2',display_name:'Juan Diego Coto Calderón',fide_id:'6506941'},
 {id:'p3',display_name:'Alguien Sin Partida',fide_id:'44448888'}
];
const game=(w,b,m='1. e4 e5 2. Nf3 Nc6')=>`[Event "JUNCOS 2026"]
[Date "2026.10.15"]
[White "${w}"]
[Black "${b}"]
[Result "1-0"]

${m} 1-0`;
test('tournament preview matches two listed rivals in one valid PGN',()=>{
 const res=planCITournamentImport(game('David Alejandro Cabezas Solano','Juan Diego Coto Calderón'),participants);
 assert.equal(res.total,1);assert.equal(res.uniqueGames,1);assert.equal(res.ready.length,2);
 assert.deepEqual(new Set(res.ready.map(x=>x.playerId)),new Set(['p1','p2']));
});
test('unknown opponent does not cause fabricated player creation',()=>{
 const res=planCITournamentImport(game('David Alejandro Cabezas Solano','Anonymous Opponent'),participants);
 assert.equal(res.ready.length,1);assert.equal(res.ready[0].playerId,'p1');
});
test('a PGN without known competitor or with ambiguous identity is rejected',()=>{
 const other=planCITournamentImport(game('Unknown One','Unknown Two'),participants);
 assert.equal(other.ready.length,0);assert.equal(other.rejected.length,1);
 const duplicate=[participants[0],{id:'dupe',display_name:'David Alejandro Cabezas Solano',fide_id:'6507522'}];
 const check=planCITournamentImport(game('David Alejandro Cabezas Solano','Unknown'),duplicate);
 assert.equal(check.ready.length,0);assert.equal(check.rejected.length,1);
});
test('invalid chess moves never become records',()=>{
 const res=planCITournamentImport(game('David Alejandro Cabezas Solano','Unknown','1. e4 e5 2. Kxe7'),participants);
 assert.equal(res.ready.length,0);
});
test('import UI is collapsible and requires confirmation before writes',()=>{
 const panel=readFileSync(new URL('./ci-tournament-import.js',import.meta.url),'utf8');
 assert.match(panel,/<details class="ci-tournament-manager">/);
 assert.match(panel,/if\(!confirm\(/);
 assert.match(panel,/service\.addGame\(row\.playerId/);
 assert.match(panel,/getPlayers\(\)/);
});
