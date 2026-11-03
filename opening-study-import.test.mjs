import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePersonalOpeningStudy} from './opening-study-import.js';
import {verifiedLine} from './opening-research-tools.js';

test('personal opening study imports PGN headers and original mainline comments',()=>{
 const pgn='[Event "Mi repertorio"]\n[ECO "C02"]\n[Result "*"]\n\n1. e4 {Ocupa el centro.} e6 2. d4 d5 3. e5 {Cadena e5-d4.} *';
 const study=parsePersonalOpeningStudy(pgn);
 assert.equal(study.headers.Event,'Mi repertorio');
 assert.equal(study.headers.ECO,'C02');
 assert.equal(study.plyCount,5);
 assert.equal(study.moves,'e4 e6 d4 d5 e5');
 assert.ok(Object.values(study.notes).some(x=>x.includes('Cadena e5-d4')));
 assert.equal(verifiedLine(study.moves).sans.length,5);
});
test('personal study imports SAN, checks legal moves and rejects empty or oversized content',()=>{
 const study=parsePersonalOpeningStudy('1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4');
 assert.equal(study.moves,'e4 c5 Nf3 d6 d4 cxd4 Nxd4');
 assert.throws(()=>parsePersonalOpeningStudy(''),/Pegá un PGN/);
 assert.throws(()=>parsePersonalOpeningStudy('1. e4 e5 2. Qh8'),/ilegales|inválido/);
 assert.throws(()=>parsePersonalOpeningStudy('x'.repeat(250001)),/límite/);
});
