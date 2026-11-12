import test from 'node:test';
import assert from 'node:assert/strict';
import {ratingFor,gameReferences,splitPGN,parseCIImport,analyzeCIGames} from './ci-player-intelligence.js';
const player={display_name:'David Alejandro Cabezas Solano',fide_id:'6507522'};
const game=(white,black,moves,result='1-0')=>`[Event "Partida real de muestra para test"]
[Site "Local"]
[Date "2026.10.17"]
[Round "1"]
[White "${white}"]
[Black "${black}"]
[Result "${result}"]
[ECO "C20"]

${moves} ${result}`;
test('FIDE November 2026 ratings remain separated by format',()=>{
 assert.deepEqual([ratingFor('6507522').standard,ratingFor('6507522').rapid,ratingFor('6507522').blitz],[2275,2216,2262]);
 assert.equal(ratingFor('000000'),null);
 assert.ok(gameReferences('6505945').some(x=>x.url.startsWith('https://')));
});
test('a legal PGN is validated and linked to the named rival',()=>{
 const pgn=game('David Alejandro Cabezas Solano','Other Player','1. e4 e5 2. Nf3 Nc6');
 const result=parseCIImport(pgn,player);assert.equal(result.good.length,1);assert.equal(result.rejected.length,0);assert.equal(result.good[0].player_color,'w');
});
test('wrong rival, illegal moves and ambiguous identities are rejected',()=>{
 const x=game('Other One','Other Two','1. e4 e5');
 assert.equal(parseCIImport(x,player).good.length,0);
 const y=game(player.display_name,'Other Player','1. e4 e5 2. Kxe7');
 assert.equal(parseCIImport(y,player).good.length,0);
});
test('multi-game PGN is split safely and produces usable statistics',()=>{
 const a=game(player.display_name,'Other Player','1. e4 e5 2. Nf3 Nc6','1-0');
 const b=game('Other Player',player.display_name,'1. d4 d5 2. c4 e6','0-1');
 const parsed=parseCIImport(a+'\n\n'+b,player);
 assert.equal(parsed.good.length,2);
 const data=analyzeCIGames(parsed.good);
 assert.equal(data.valid,2);assert.equal(data.byColor.w.n,1);assert.equal(data.byColor.b.n,1);
 assert.equal(data.responses.w[0].name,'e4');
 assert.equal(data.responses.b[0].name,'d4 d5');
});
test('non game sources are never counted in PGN analytics',()=>{
 const data=analyzeCIGames([]);
 assert.equal(data.valid,0);assert.deepEqual(data.openings.w,[]);
});
