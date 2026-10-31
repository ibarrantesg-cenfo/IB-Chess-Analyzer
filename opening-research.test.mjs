import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { OPENING_RESEARCH_DRAFTS } from './opening-research-data.js';
import { OPENING_RESEARCH_EXPANSION } from './opening-research-more.js';
import { validateOpeningLine } from './opening-research.js';

test('every seed opening line is playable and has one FEN per ply',()=>{
  assert.equal(OPENING_RESEARCH_DRAFTS.length,6);
  for(const draft of OPENING_RESEARCH_DRAFTS){
    const {sans,fens}=validateOpeningLine(draft.moves);
    assert.ok(sans.length>=10,draft.name);
    assert.equal(fens.length,sans.length+1);
    const chess=new Chess();
    sans.forEach(san=>chess.move(san));
    assert.equal(chess.fen(),fens.at(-1));
    for(const ply of Object.keys(draft.notes)){
      assert.ok(Number(ply)>=1&&Number(ply)<=sans.length,'comment ply out of range: '+draft.name);
    }
  }
});
test('Najdorf 8...h5 and 8...Be7 share the same position before the branch',()=>{
  const a=validateOpeningLine(OPENING_RESEARCH_DRAFTS.find(x=>x.id==='najdorf-h5').moves);
  const b=validateOpeningLine(OPENING_RESEARCH_DRAFTS.find(x=>x.id==='najdorf-be7').moves);
  assert.equal(a.fens[15],b.fens[15]); // After 8.f3
  assert.notEqual(a.fens[16],b.fens[16]);
});
test('French and Caro-Kann alternatives branch at a legal shared position',()=>{
  for(const family of ['french','caro']){
    const arr=OPENING_RESEARCH_DRAFTS.filter(x=>x.id.startsWith(family));
    assert.equal(arr.length,2);
    const a=validateOpeningLine(arr[0].moves),b=validateOpeningLine(arr[1].moves);
    assert.equal(a.fens[0],b.fens[0]);
    assert.ok(a.sans.some((m,i)=>m!==b.sans[i]));
  }
});
test('invalid proposed branches are rejected rather than silently imported',()=>{
  assert.throws(()=>validateOpeningLine('e4 e5 Qh8'),/Movimiento ilegal/);
  assert.throws(()=>validateOpeningLine(''),/no contiene jugadas/);
});

test('expanded editorial catalog contains diverse, valid and uniquely identified branches',()=>{
  assert.ok(OPENING_RESEARCH_EXPANSION.length>=25);
  const all=[...OPENING_RESEARCH_DRAFTS,...OPENING_RESEARCH_EXPANSION];
  assert.equal(new Set(all.map(x=>x.id)).size,all.length);
  assert.ok(new Set(all.map(x=>x.family)).size>=12);
  for(const draft of all){
    const {sans,fens}=validateOpeningLine(draft.moves);
    assert.ok(sans.length>=9,draft.id+' too short');
    assert.equal(fens.length,sans.length+1);
    assert.ok(/^https:\/\//.test(draft.reference),draft.id+' missing reference');
    assert.ok(draft.research&&draft.research.length>35,draft.id+' missing concrete research question');
    for(const key of Object.keys(draft.notes||{})){
      assert.ok(Number(key)>=1&&Number(key)<=sans.length,draft.id+' comment ply '+key+' exceeds '+sans.length);
    }
  }
  assert.equal(new Set(all.map(x=>validateOpeningLine(x.moves).sans.join(' '))).size,all.length,'duplicate line');
});
