import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeDocument,encodeDocument} from './ci-document-board.js';
test('documento privado conserva PGN, notas y fuente',()=>{
 const pgn='[Event "Clásico"]\n\n1. e4 e5 2. Nf3 Nc6 *';
 const text=encodeDocument({pgn,notes:{0:'Introducción',4:'Prioridad central'},source:'https://example.org'});
 const data=decodeDocument({title:'Estudio',plan:text});
 assert.equal(data.pgn,pgn);assert.equal(data.notes[4],'Prioridad central');assert.equal(data.source,'https://example.org');
});
test('documento desconocido no inventa variantes',()=>{
 const d=decodeDocument({title:'X',plan:'no-json'});
 assert.equal(d.title,'X');assert.equal(d.pgn,'');assert.deepEqual(d.notes,{});
});
