import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildCIRepertoireTree,ciTreeNodeAt,ciTreeChoices,ciTreeMoveLabel} from './ci-repertoire-tree.js';
const make=(id,color,event,moves,result='1-0',year='2026')=>({
 id,player_color:color,played_at:year+'-10-12',pgn:`[Event "${event}"]
[Date "${year}.10.12"]
[White "White player"]
[Black "Black player"]
[Result "${result}"]

${moves} ${result}`
});
const games=[
 make('1','w','JUNCOS','1. Nf3 d5 2. g3 Nf6', '1-0'),
 make('2','w','JUNCOS','1. Nf3 Nf6 2. g3 g6','1/2-1/2'),
 make('3','w','Nacional','1. d4 Nf6 2. c4 e6','0-1','2025'),
 make('4','b','JUNCOS','1. e4 c5 2. Nf3 d6','0-1')
];
test('tree branches use only matching PGN, with correct relative denominator',()=>{
 const {tree,sample}=buildCIRepertoireTree(games,{color:'w'});
 assert.equal(sample,3);
 const first=ciTreeChoices(tree);
 assert.equal(first[0].move,'Nf3');
 assert.equal(first[0].count,2);
 assert.equal(first[0].share,2/3);
 const next=ciTreeNodeAt(tree,['Nf3']);
 assert.equal(next.total,2);
 assert.equal(ciTreeChoices(next)[0].share,0.5);
 assert.equal(ciTreeNodeAt(tree,['Nf3','d5']).wins,1);
 assert.equal(ciTreeNodeAt(tree,['Nf3','Nf6']).draws,1);
});
test('black repertoire begins with opposing white move and records own response',()=>{
 const {tree,sample}=buildCIRepertoireTree(games,{color:'b'});
 assert.equal(sample,1);
 assert.equal(ciTreeChoices(tree)[0].move,'e4');
 assert.equal(ciTreeChoices(ciTreeNodeAt(tree,['e4']))[0].move,'c5');
 assert.equal(ciTreeNodeAt(tree,['e4','c5']).wins,1);
});
test('existing tournament/year filters apply before tree statistics',()=>{
 const {tree,sample}=buildCIRepertoireTree(games,{color:'w',filters:{year:'2026',tournament:'JUNCOS'}});
 assert.equal(sample,2);
 assert.equal(ciTreeChoices(tree).length,1);
 assert.equal(ciTreeChoices(tree)[0].share,1);
});
test('navigation supports missing branches and safe empty samples',()=>{
 const {tree}=buildCIRepertoireTree([]);
 assert.equal(ciTreeNodeAt(tree,['e4']),null);
 assert.deepEqual(ciTreeChoices(tree),[]);
 assert.equal(ciTreeMoveLabel('Nf6',2),'1... Nf6');
 assert.equal(ciTreeMoveLabel('g3',3),'2. g3');
});
test('UI supplies reversible back/root and filters with real records',()=>{
 const s=readFileSync(new URL('./ci-repertoire-tree-ui.js',import.meta.url),'utf8');
 const panel=readFileSync(new URL('./ci-player-profile.js',import.meta.url),'utf8');
 assert.match(s,/id="ci-tree-back"/);
 assert.match(s,/id="ci-tree-reset"/);
 assert.match(s,/path\.pop\(\)/);
 assert.match(panel,/tree\.update\(records,gameFilters\(\)\)/);
});
