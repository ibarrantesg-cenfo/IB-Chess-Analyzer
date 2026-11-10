import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Chess } from 'chess.js';
import vm from 'node:vm';
// Isolate the parser from browser-only Supabase, DOM and localStorage initialization.
const source=fs.readFileSync(new URL('./studio.js',import.meta.url),'utf8');
const start=source.indexOf('function splitLibraryPgnSource(');
const end=source.indexOf('export function initStudio(',start);
if(start<0||end<0)throw Error('PGN parser functions were not found');
const parser=source.slice(start,end).replace('export function inspectLibraryPgnSource','function inspectLibraryPgnSource');
const inspectLibraryPgnSource=vm.runInNewContext('(()=>{'+parser+';return inspectLibraryPgnSource;})()', {Chess});

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

test('retain nested PGN variations in the saved source and after reopening',()=>{
 const pgn='[Event "Estudio"]\n\n1. e4 (1. d4 d5 (1... Nf6)) e5 {Centro} 2. Nf3 *';
 const [row]=inspectLibraryPgnSource(pgn);
 assert.equal(row.valid,true);
 assert.equal(row.pgn,pgn);
 assert.equal(inspectLibraryPgnSource(row.pgn)[0].moves,3);
});

test('report the invalid game in a mixed batch',()=>{
 const pgn='[Event "Válida"]\n\n1. e4 e5 *\n\n[Event "Inválida"]\n\n1. e5 *';
 const [valid,invalid]=inspectLibraryPgnSource(pgn);
 assert.equal(valid.valid,true);
 assert.equal(invalid.valid,false);
 assert.equal(invalid.index,2);
});
