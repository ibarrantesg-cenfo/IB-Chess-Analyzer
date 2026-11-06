import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {batchOptions,batchResults,validCompleteReport} from './tournament-batch.js';

test('batch speed modes provide bounded per-position budgets',()=>{
 const fast=batchOptions('fast'),balanced=batchOptions('balanced'),deep=batchOptions('deep');
 assert.ok(fast.depth<balanced.depth&&balanced.depth<deep.depth);
 assert.ok(fast.moveTimeMs<balanced.moveTimeMs&&balanced.moveTimeMs<deep.moveTimeMs);
 assert.ok([fast,balanced,deep].every(v=>v.timeoutMs>v.moveTimeMs));
 assert.equal(batchOptions('unknown').preset,'balanced');
});
test('incomplete or nonfinite engine results cannot count as completed',()=>{
 const game={moves:[{san:'e4'},{san:'c5'},{san:'Nf3'}]};
 assert.equal(validCompleteReport(game,{reports:[{loss:1},{loss:2},{loss:3}]}),true);
 assert.equal(validCompleteReport(game,{reports:[{loss:1},{loss:2}]}),false);
 assert.equal(validCompleteReport(game,{reports:[{loss:1},{loss:NaN},{loss:3}]}),false);
 assert.equal(validCompleteReport(game,{reports:[{loss:1},{loss:Infinity},{loss:3}]}),false);
 assert.equal(validCompleteReport(game,null),false);
});
test('failed games remain separate from successful analyses',()=>{
 const outcomes=batchResults([{index:1,name:'A',ok:true},{index:2,name:'B',ok:false,error:'timeout'}]);
 assert.equal(outcomes.completed,1);assert.equal(outcomes.failed,1);
 assert.deepEqual(outcomes.failures,[{index:2,name:'B',error:'timeout'}]);
});
test('tournament batch skips completed games and continues after failure',()=>{
 const src=readFileSync(new URL('./performance.js',import.meta.url),'utf8');
 assert.ok(src.includes('if(validCompleteReport(g,getAnalyses().get(index)))continue'));
 assert.ok(src.includes('await analyzeGame({batch:true'));
 assert.ok(src.includes('results.push({index:gameItem.index,name,ok,error})'));
 assert.ok(src.includes('Podés reanudar o elegir modo Rápido'));
 assert.ok(src.includes('cancelGame?.()'));
});
test('individual Game Review is preserved while tournament analysis is time bounded',()=>{
 const src=readFileSync(new URL('./main.js',import.meta.url),'utf8');
 assert.ok(src.includes("const batch=options?.batch===true"));
 assert.ok(src.includes("moveTimeMs:batch?"));
 assert.ok(src.includes("timeoutMs:batch?"));
 assert.ok(src.includes("signal:state.analysisController.signal"));
 assert.ok(src.includes('cancelGame:stopAnalysis'));
});
