import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifiedLine} from './opening-research-tools.js';
import {prepareOpeningBranch,describesStudyBranch,studyRootId} from './opening-study-branches.js';

const root='e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6 f3';
test('a concrete SAN continuation branches precisely after the selected Najdorf position',()=>{
 const base=verifiedLine(root);
 const branch=prepareOpeningBranch(root,15,'8... Be7 9. Qd2 O-O','san');
 assert.equal(branch.basePly,15);
 assert.equal(branch.baseFen,base.fens[15]);
 assert.equal(branch.added.join(' '),'Be7 Qd2 O-O');
 assert.equal(branch.moves,'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6 f3 Be7 Qd2 O-O');
});
test('full PGN imported as a branch must contain the position selected in the study',()=>{
 const pgn='[Event "Mi variante"]\n[Result "*"]\n\n1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 Be7 9. Qd2 O-O *';
 const branch=prepareOpeningBranch(root,15,pgn,'pgn');
 assert.deepEqual(branch.added,['Be7','Qd2','O-O']);
 assert.equal(branch.baseFen,verifiedLine(root).fens[15]);
 assert.throws(()=>prepareOpeningBranch(root,15,'1. e4 e5 2. Nf3 Nc6 *','pgn'),/no llega|termina/);
});
test('illegal, duplicate and malformed branch input is rejected',()=>{
 assert.throws(()=>prepareOpeningBranch(root,15,'8... Qh8','san'),/ilegal/);
 assert.throws(()=>prepareOpeningBranch(root,15,'','san'),/Escribí/);
 assert.throws(()=>prepareOpeningBranch(root,-1,'Be7','san'),/posición/);
 assert.throws(()=>prepareOpeningBranch(root,15,'Be7','unknown'),/formato/);
});
test('nested variation ancestry always resolves to the individual parent study',()=>{
 const catalog=[
  {id:'student-study'},
  {id:'branch-a',origin:{parent:'student-study',parentPly:10}},
  {id:'branch-b',origin:{parent:'branch-a',parentPly:12}}
 ];
 assert.equal(studyRootId(catalog,'branch-b'),'student-study');
 assert.equal(describesStudyBranch(catalog[1].origin,'student-study'),true);
});
test('main board and keyboard prioritize PV or study branch navigation before the mainline',()=>{
 const main=readFileSync(new URL('./main.js',import.meta.url),'utf8');
 assert.ok(main.includes('if(window.IB_LIVE?.isPlayingBack?.())return window.IB_LIVE.stepPlayback(delta)'));
 assert.ok(main.includes('if(window.IB_STUDIO?.isVariationActive?.())return window.IB_STUDIO.stepVariation(delta)'));
 assert.ok(main.includes("if(!stepDisplayedLine(-1))jump(state.move-1)"));
 assert.ok(main.includes("if(!stepDisplayedLine(1))jump(state.move+1)"));
 const live=readFileSync(new URL('./live-analysis.js',import.meta.url),'utf8');
 assert.ok(live.includes('isPlayingBack:()=>Boolean(playback)'));
 assert.ok(live.includes('seekPlayback,'));
 const variant=readFileSync(new URL('./variation-board.js',import.meta.url),'utf8');
 assert.ok(variant.includes('step:navigate,seek'));
});
test('light mode provides explicit contrast for modern opening and Stockfish workspaces',()=>{
 const css=readFileSync(new URL('./style.css',import.meta.url),'utf8');
 for(const selector of ['.opening-lab-builder','.opening-lab-catalog','.opening-lab-evidence','.live-line','.live-move-chip','.sidebar a.nav']){
  assert.ok(css.includes(':root[data-theme="light"]')&&css.lastIndexOf(selector)>0,selector+' is unstyled');
 }
 assert.ok(css.includes('background:#fff;color:#153b4d'),'light form inputs must have contrast');
});
