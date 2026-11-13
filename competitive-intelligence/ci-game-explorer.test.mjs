import test from 'node:test';
import assert from 'node:assert/strict';
import {ciGameMetadata,createCIGameIndex,gameFilterOptions,filterCIGames,ciFilterStats} from './ci-game-explorer.js';
import {readFileSync} from 'node:fs';
const pgn=(event,date,white,black,result,eco,moves)=>`[Event "${event}"]
[Date "${date}"]
[White "${white}"]
[Black "${black}"]
[Result "${result}"]
[ECO "${eco}"]

${moves} ${result}`;
const records=[
 {id:'1',player_color:'w',played_at:'2026-10-15',pgn:pgn('JUNCOS Clásico','2026.10.15','David Cabezas','Juan Coto','1-0','A04','1. Nf3 d5 2. g3 Nf6')},
 {id:'2',player_color:'b',played_at:'2025-09-18',pgn:pgn('Nacional Equipos','2025.09.18','Gerardo Ramírez','David Cabezas','1/2-1/2','C00','1. e4 e6 2. d4 d5')},
 {id:'3',player_color:'b',played_at:'2026-10-15',pgn:pgn('JUNCOS Clásico','2026.10.15','Juan Coto','David Cabezas','1-0','B20','1. e4 c5 2. Nf3 d6')}
];
test('PGN filter index gets metadata from verified headers',()=>{
 const result=createCIGameIndex(records);
 assert.equal(result.length,3);
 assert.equal(result[0].opponent,'Juan Coto');
 assert.equal(result[0].outcome,'win');
 assert.equal(result[1].outcome,'draw');
 assert.equal(result[2].outcome,'loss');
});
test('year, event, color, result, ECO and text filters intersect',()=>{
 const index=createCIGameIndex(records);
 assert.equal(filterCIGames(index,{year:'2026',tournament:'JUNCOS Clásico'}).length,2);
 assert.equal(filterCIGames(index,{color:'b',outcome:'loss',eco:'B20'}).length,1);
 assert.equal(filterCIGames(index,{query:'Gerardo'}).length,1);
 assert.equal(filterCIGames(index,{query:'Nf3'}).length,2);
 const opts=gameFilterOptions(index);
 assert.deepEqual(opts.years,['2026','2025']);
 assert.deepEqual(opts.ecos,['A04','B20','C00']);
});
test('stats are computed on filtered sample, not whole player corpus',()=>{
 const sample=filterCIGames(createCIGameIndex(records),{year:'2026'});
 assert.deepEqual(ciFilterStats(sample),{total:2,white:1,black:1,wins:1,draws:0,losses:1,unknown:0});
});
test('unparseable records do not create fabricated metadata',()=>{
 assert.equal(ciGameMetadata({id:'x',pgn:'not chess',player_color:'w'}),null);
});
test('filter UI is embedded in the selected dossier',()=>{
 const s=readFileSync(new URL('./ci-player-profile.js',import.meta.url),'utf8');
 assert.match(s,/id="ci-game-year"/);
 assert.match(s,/id="ci-game-event"/);
 assert.match(s,/id="ci-game-result"/);
 assert.match(s,/filterCIGames\(index,gameFilters\(\)\)/);
});
