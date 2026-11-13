import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Chess} from 'chess.js';
import {ciPositionFromLine,ciSquaresForOrientation} from './ci-position-board.js';
test('starting position has normal FEN and white to move',()=>{
 const p=ciPositionFromLine([]);
 assert.equal(p.fen,new Chess().fen());
 assert.equal(p.turn,'w');assert.equal(p.ply,0);assert.equal(p.last,null);
});
test('board follows the exact SAN path including last move squares',()=>{
 const p=ciPositionFromLine(['e4','c5','Nf3','d6']);
 assert.equal(p.ply,4);assert.equal(p.turn,'w');
 assert.deepEqual(p.last,{from:'d7',to:'d6',san:'d6'});
 const chess=new Chess();for(const m of ['e4','c5','Nf3','d6'])chess.move(m);
 assert.equal(p.fen,chess.fen());
});
test('captures and castling are replayed without invented positions',()=>{
 const moves=['e4','e5','Nf3','Nc6','Bc4','Bc5','O-O'];
 const p=ciPositionFromLine(moves);
 assert.equal(p.last.from,'e1');assert.equal(p.last.to,'g1');
 const chess=new Chess(p.fen);
 assert.equal(chess.get('g1')?.type,'k');assert.equal(chess.get('f1')?.type,'r');
});
test('illegal sequence is rejected without modifying saved PGN',()=>{
 const p=ciPositionFromLine(['e4','e5','Kxe7']);
 assert.match(p.error,/Secuencia inválida/);
});
test('square orientation reverses files and ranks consistently',()=>{
 const w=ciSquaresForOrientation('w'),b=ciSquaresForOrientation('b');
 assert.equal(w[0],'a8');assert.equal(w.at(-1),'h1');
 assert.equal(b[0],'h1');assert.equal(b.at(-1),'a8');
 assert.equal(new Set(w).size,64);
});
test('tree UI uses same path for graphic board and move choices',()=>{
 const ui=readFileSync(new URL('./ci-repertoire-tree-ui.js',import.meta.url),'utf8');
 assert.match(ui,/board\.setLine\(path\)/);
 assert.match(ui,/path\.pop\(\)/);
 assert.match(ui,/path\.push\(choice\.move\)/);
 assert.match(ui,/board\.setOrientation\(el\('ci-tree-color'\)\.value\)/);
});
