import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectLibraryPgnSource} from './studio.js';

test('import a single PGN with event and normal comments',()=>{
 const pgn='[Event "Partida de prueba"]\n[White "Alumno"]\n[Black "Rival"]\n[Result "1-0"]\n\n1. e4 e5 {Comentario de prueba} 2. Nf3 Nc6 3. Bc4 Bc5 1-0';
 const rows=inspectLibraryPgnSource(pgn);
 assert.equal(rows.length,1);
 assert.equal(rows[0].valid,true);
 assert.equal(rows[0].headers.White,'Alumno');
 assert.equal(rows[0].moves,6);
});

test('detect multiple tournament games and preserve metadata',()=>{
 const pgn='[Event "Torneo"]\n[Round "1"]\n[White "Alumno"]\n[Black "A"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 1-0\n\n[Event "Torneo"]\n[Round "2"]\n[White "B"]\n[Black "Alumno"]\n[Result "0-1"]\n\n1. d4 d5 2. c4 e6 0-1';
 const rows=inspectLibraryPgnSource(pgn);
 assert.equal(rows.length,2);
 assert.ok(rows.every(r=>r.valid));
 assert.equal(rows[0].headers.Round,'1');
 assert.equal(rows[1].headers.Round,'2');
});

test('recover mainline when exported annotations have malformed nested braces',()=>{
 const pgn='[Event "Estudio"]\n[White "Alumno"]\n[Black "Rival"]\n[Result "*"]\n\n{Introducción {anidada}} 1. e4 {Notas {anidadas}} e5 2. Nf3 Nc6 *';
 const rows=inspectLibraryPgnSource(pgn);
 assert.equal(rows.length,1);
 assert.equal(rows[0].valid,true);
 assert.equal(rows[0].moves,4);
});
