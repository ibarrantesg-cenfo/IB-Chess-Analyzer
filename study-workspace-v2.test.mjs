import { groupLocalStudies } from './study-picker.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Chess} from 'chess.js';
import {parseStudyContinuation,eligibleStudyRecipients,studyPositionLabel} from './study-workspace-v2.js';

const start='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const uidA='123e4567-e89b-12d3-a456-426614174000';
const uidB='123e4567-e89b-12d3-a456-426614174001';
test('variation from current FEN is legal and preserves SAN and move-by-move FENs',()=>{
 const g=new Chess();for(const m of ['e4','c5','Nf3','d6','d4','cxd4','Nxd4','Nf6','Nc3','a6'])g.move(m);
 const line=parseStudyContinuation(g.fen(),'6. Be3 e5 7. Nb3 Be6');
 assert.deepEqual(line.sans,['Be3','e5','Nb3','Be6']);
 assert.equal(line.fens.length,5);
 assert.equal(line.startFen,g.fen());
 assert.equal(g.history().length,10);
 assert.throws(()=>parseStudyContinuation(g.fen(),'6. Qh8'),/ilegal/);
});
test('Spanish notation accepts Cf3 and Dd2 while international notation remains unchanged',()=>{
 const spanish=parseStudyContinuation(start,'1. e4 c5 2. Cf3 d6','es');
 const international=parseStudyContinuation(start,'1. e4 c5 2. Nf3 d6','international');
 assert.equal(spanish.finalFen,international.finalFen);
 assert.deepEqual(spanish.sans,international.sans);
});
test('variation input errors are useful and do not silently save',()=>{
 assert.throws(()=>parseStudyContinuation(start,'', 'international'),/al menos una/);
 assert.throws(()=>parseStudyContinuation('', 'e4'),/posición válida/);
 assert.throws(()=>parseStudyContinuation(start,'1. Qh8'),/ilegal/);
});
test('teachers see only active enrolled students, not expired or pending enrollments',()=>{
 const records={teacher:true,items:[
  {student_id:uidA,name:'Moisés',state:'active',expires_at:null},
  {student_id:uidB,name:'Otro',state:'pending',expires_at:null},
  {student_id:uidB,name:'Otro',state:'active',expires_at:'2020-01-01'}
 ]};
 assert.deepEqual(eligibleStudyRecipients({isTeacher:true},records),[{id:uidA,name:'Moisés',type:'student'}]);
 assert.deepEqual(eligibleStudyRecipients({isTeacher:true},{teacher:false,items:records.items}),[]);
});
test('students see verified teacher entries by name, never user-provided UUIDs',()=>{
 const list=eligibleStudyRecipients({isTeacher:false,teachers:[
  {teacher_id:uidA,display_name:'Profe'},
  {teacher_id:'invalid',display_name:'Rogue'}
 ]},null);
 assert.deepEqual(list,[{id:uidA,name:'Profe',type:'teacher'}]);
});
test('position label is understood by both sides',()=>{
 const game={moves:[{san:'e4'},{san:'c5'},{san:'Nf3'}]};
 assert.equal(studyPositionLabel(0,game),'Posición inicial');
 assert.equal(studyPositionLabel(1,game),'1. e4');
 assert.equal(studyPositionLabel(2,game),'1... c5');
 assert.equal(studyPositionLabel(3,game),'2. Nf3');
});
test('studio UI offers one-click board variations and human-friendly share selection',()=>{
 const studio=readFileSync(new URL('./studio.js',import.meta.url),'utf8');
 const board=readFileSync(new URL('./variation-board.js',import.meta.url),'utf8');
 assert.ok(studio.includes('id="studio-variation-quick"'));
 assert.ok(studio.includes('id="studio-play-variation"'));
 assert.ok(studio.includes('id="studio-share-quick"'));
 assert.ok(studio.includes('eligibleStudyRecipients(account,enrollments)'));
 assert.ok(studio.includes("el('studio-share-confirm').onclick=async()"));
 assert.ok(studio.includes('await cloudSave(active)'));
 assert.ok(studio.includes('await cloudShare(active.id,selectedId)'));
 assert.ok(board.includes('const startAt=ply=>'));
 assert.ok(board.includes('return {open,startAt,'));
});

test('study picker groups games by stable collection ID without merging namesakes',()=>{
 const groups=groupLocalStudies([
  {id:'1',collectionId:'a',collectionName:'Torneo',name:'Ronda 1'},
  {id:'2',collectionId:'b',collectionName:'Torneo',name:'Ronda 2'},
  {id:'3',collectionId:'a',collectionName:'Torneo',name:'Ronda 3'},
  {id:'4',name:'Suelta'}
 ]);
 assert.deepEqual(groups.map(group=>[group.title,group.games.map(game=>game.id)]),[
  ['Torneo',['1','3']],['Torneo',['2']],['Suelta',['4']]
 ]);
});
