import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {OPENING_RESEARCH_DRAFTS} from './opening-research-data.js';
import {fenKey,readSanTokens,verifiedLine,extendLegalLine,researchChecklist,cleanSnapshot} from './opening-research-tools.js';
import {buildOpeningBackup,validateOpeningBackup} from './opening-research-backup.js';
const draft=OPENING_RESEARCH_DRAFTS.find(x=>x.id==='najdorf-h5');
const after8f3=verifiedLine(draft.moves).fens[15];

test('stockfish SAN with move numbers can branch from the exact Najdorf position',()=>{
 assert.deepEqual(readSanTokens('8... Be7 9. Qd2 O-O 10. O-O-O'),['Be7','Qd2','O-O','O-O-O']);
 const branch=extendLegalLine(draft.moves,15,'8... Be7 9. Qd2 O-O 10. O-O-O');
 assert.equal(fenKey(branch.fens[15]),fenKey(after8f3));
 assert.equal(branch.added[0],'Be7');
 assert.equal(branch.added.length,4);
 assert.notEqual(fenKey(branch.fens[16]),fenKey(verifiedLine(draft.moves).fens[16]));
});
test('PV branch validation prevents illegal or empty engine suggestions',()=>{
 assert.throws(()=>extendLegalLine(draft.moves,15,'8... Qh8'),/ilegal/);
 assert.throws(()=>extendLegalLine(draft.moves,15,''),/vacía/);
 assert.throws(()=>extendLegalLine(draft.moves,500,'Be7'),/inválida/);
});
const rawSnapshot=(fen=after8f3)=>({fen,complete:true,engine:'Stockfish 19 Lite',lines:[
 {rank:1,score:'+0.32',depth:20,san:'8... Be7 9. Qd2 O-O 10. O-O-O'},
 {rank:2,score:'+0.24',depth:18,san:'8... h5 9. Qd2'}
]});
test('engine evidence is tied to exact FEN and checks every PV',()=>{
 const snap=cleanSnapshot(rawSnapshot(),after8f3);
 assert.equal(snap.depth,18);
 assert.equal(snap.lines.length,2);
 assert.throws(()=>cleanSnapshot(rawSnapshot(),verifiedLine(draft.moves).fens[16]),/exacta/);
 assert.throws(()=>cleanSnapshot({...rawSnapshot(),lines:[{rank:1,score:'+0.2',depth:21,san:'8... Be7'},{rank:2,score:'+0.3',depth:15,san:'8... h5'}]},after8f3),/insuficiente/);
 assert.throws(()=>cleanSnapshot({...rawSnapshot(),lines:[{rank:1,score:'+0.2',depth:20,san:'8... Qh8'},{rank:2,score:'+0.3',depth:20,san:'8... h5'}]},after8f3),/ilegal/);
});
test('editorial research queue requires engine, masters and bibliography separately',()=>{
 const items=researchChecklist([draft],{evidence:{},masters:{},sources:{}});
 assert.ok(items.length>0);
 assert.ok(items.every(x=>x.missing===3));
 const ply=15;
 const noteCase={...draft,notes:{[ply]:'critical'}};
 const fen=verifiedLine(draft.moves).fens[ply];
 const evidence=cleanSnapshot(rawSnapshot(),fen);
 const finished=researchChecklist([noteCase],{
  evidence:{[draft.id+'|'+ply]:evidence},
  masters:{[fen]:{result:{moves:[{san:'Be7'}]}}},
  sources:{[draft.id]:'Referencia con identificador comprobable'}
 });
 assert.equal(finished[0].missing,0);
 assert.equal(finished[0].hasEngine,true);
});
test('versioned backup restores legal branches and rejects invalid studies',()=>{
 const branch=extendLegalLine(draft.moves,15,'8... Be7 9. Qd2 O-O');
 const info={custom:[{id:'user-test',name:'PV de Najdorf',family:draft.family,moves:branch.moves,eco:'B90',research:'Borrador',reference:draft.reference}],
   notes:{'user-test|16':'Revisar esta jugada'},sources:{'user-test':'Estudio de prueba'},evidence:{},masters:{}};
 const serialized=JSON.stringify(buildOpeningBackup(info));
 const restored=validateOpeningBackup(JSON.parse(serialized));
 assert.equal(restored.custom.length,1);
 assert.equal(restored.notes['user-test|16'],'Revisar esta jugada');
 assert.deepEqual(verifiedLine(restored.custom[0].moves).sans,verifiedLine(branch.moves).sans);
 assert.throws(()=>validateOpeningBackup({...JSON.parse(serialized),version:99}),/compatible/);
 assert.throws(()=>validateOpeningBackup({...JSON.parse(serialized),custom:[{...info.custom[0],moves:'e4 e5 Qh8'}]}),/ilegal/);
});
