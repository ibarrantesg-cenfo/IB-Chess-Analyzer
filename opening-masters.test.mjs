import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMasterResults} from './opening-masters.js';

test('Masters results are normalized with truthful per-move totals and safe identifiers',()=>{
 const x=normalizeMasterResults({white:100,draws:40,black:60,moves:[
  {san:'e5',uci:'e7e5',white:45,draws:30,black:25,averageRating:2520},
  {san:'e6',uci:'e7e6',white:55,draws:10,black:35,averageRating:2480}
 ],topGames:[{id:'abcdefgh',white:{name:'GM A'},black:{name:'GM B'},year:2026}]});
 assert.equal(x.white+x.draws+x.black,200);
 assert.equal(x.moves.length,2);
 assert.equal(x.moves[0].white+x.moves[0].draws+x.moves[0].black,100);
 assert.equal(x.games[0].id,'abcdefgh');
 assert.equal(x.games[0].white,'GM A');
});
test('Malformed and unsafe historical explorer responses are rejected or sanitized',()=>{
 assert.throws(()=>normalizeMasterResults({wrong:true}),/formato/);
 const x=normalizeMasterResults({moves:[{san:'a4',white:-1,draws:'',black:null}],topGames:[{id:'javascript:alert(1)'}]});
 assert.equal(x.moves[0].white,0);
 assert.equal(x.games[0].id,null);
});
