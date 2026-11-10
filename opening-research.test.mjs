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
  const issues=[],sequences=[];
  for(const draft of all){
    try{
      const {sans,fens}=validateOpeningLine(draft.moves);
      sequences.push(sans.join(' '));
      if(sans.length<9)issues.push(draft.id+' too short');
      if(fens.length!==sans.length+1)issues.push(draft.id+' FEN length');
      if(!/^https:\/\//.test(draft.reference))issues.push(draft.id+' missing reference');
      if(!draft.research||draft.research.length<=35)issues.push(draft.id+' missing research question');
      for(const key of Object.keys(draft.notes||{})){
        if(Number(key)<1||Number(key)>sans.length)issues.push(draft.id+' comment ply '+key+' exceeds '+sans.length);
      }
    }catch(error){issues.push(draft.id+': '+error.message);}
  }
  if(new Set(sequences).size!==sequences.length)issues.push('Duplicate game sequences');
  assert.deepEqual(issues,[],'Opening research catalog needs editorial repair');
});

test('2026 model excerpts are distinct, legal and annotated at valid positions',async()=>{
 const {OPENING_MODELS_2026}=await import('./opening-research-2026.js');
 const ids=new Set([...OPENING_RESEARCH_DRAFTS,...OPENING_RESEARCH_EXPANSION].map(row=>row.id));
 for(const row of OPENING_MODELS_2026){
  assert.equal(ids.has(row.id),false,row.id);
  ids.add(row.id);
  const {sans,fens}=validateOpeningLine(row.moves);
  assert.equal(sans.length,22,row.id);
  assert.ok(row.model.includes('2026')&&row.reference.startsWith('https://theweekinchess.com/'));
  assert.ok(Object.keys(row.notes).every(ply=>Number(ply)>0&&Number(ply)<=sans.length));
  if(row.engine){
   assert.equal(row.engine.fen,fens[row.engine.ply]);
   assert.equal(row.engine.alternatives.length,3);
   for(const {cp,san} of row.engine.alternatives){
    assert.ok(Number.isFinite(cp));
    const chess=new Chess(row.engine.fen);
    san.split(' ').forEach(move=>chess.move(move));
   }
  }
 }
});

test('local opening search matches name, ECO, model players and either move notation',async()=>{
 const {matchesOpeningSearch}=await import('./opening-research.js');
 const row={family:'Defensa Siciliana · Najdorf',name:'Ataque Inglés',eco:'B90',model:'Wei – Nakamura',moves:'e4 c5 Nf3 d6'};
 for(const query of ['ingles','najdorf b90','Nakamura','1.e4 c5 2.Cf3','1.e4 c5 2.Nf3'])assert.equal(matchesOpeningSearch(row,query),true,query);
 assert.equal(matchesOpeningSearch(row,'Gambito de Rey'),false);
});

test('Colle and common alternate names resolve in the bundled catalog',async()=>{
 const {matchesOpeningSearch}=await import('./opening-research.js');
 const colle=OPENING_RESEARCH_EXPANSION.filter(entry=>matchesOpeningSearch(entry,'colle'));
 assert.deepEqual(colle.map(entry=>entry.id),['colle-traditional','colle-zukertort','colle-anti']);
 assert.equal(matchesOpeningSearch(colle[1],'COLLE-Zukertort'),true);
 assert.equal(matchesOpeningSearch({family:'Apertura Española'},'Ruy López'),true);
 assert.equal(matchesOpeningSearch({family:'Defensa Petrov'},'Petroff'),true);
 assert.equal(matchesOpeningSearch({family:'Ataque Trompowsky'},'Trompowski'),true);
});

test('the position tree merges shared prefixes and keeps alternate move orders available',async()=>{
 const {buildOpeningPositionTree}=await import('./opening-position-tree.js');
 const {OPENING_MODELS_2026}=await import('./opening-research-2026.js');
 const lines=[...OPENING_RESEARCH_DRAFTS,...OPENING_RESEARCH_EXPANSION,...OPENING_MODELS_2026]
  .filter(row=>row.family==='Defensa Siciliana · Najdorf')
  .map(row=>({...row,sans:validateOpeningLine(row.moves).sans}));
 const tree=buildOpeningPositionTree(lines,'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6'.split(' '));
 assert.equal(tree.root.ply,10);
 assert.equal(tree.root.san,'a6');
 const f4=tree.root.children.get('f4');
 assert.ok(f4.children.has('e5'));
 const bg5=tree.root.children.get('Bg5');
 assert.ok(bg5.children.has('e6'));
 assert.equal(tree.routes.size+tree.alternate.length,lines.length);
 for(const [id,route] of tree.routes)for(const [ply,node] of route)
  assert.equal(node.san,lines.find(line=>line.id===id).sans[ply-1]);
});

test('reference chapters are legal, searchable and have stable unique IDs',async()=>{
 const {OPENING_REFERENCE_LINES}=await import('./opening-reference-lines.js');
 const {matchesOpeningSearch}=await import('./opening-research.js');
 assert.equal(new Set(OPENING_REFERENCE_LINES.map(line=>line.id)).size,OPENING_REFERENCE_LINES.length);
 for(const line of OPENING_REFERENCE_LINES){
  assert.ok(validateOpeningLine(line.moves).sans.length>=5,line.id);
  assert.ok(matchesOpeningSearch(line,line.family),line.id);
  assert.ok(line.research&&line.reference.startsWith('https://github.com/lichess-org/chess-openings/'));
 }
});
