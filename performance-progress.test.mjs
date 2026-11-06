import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gameMetrics,eventAnalysisProgress} from './performance.js';

const game={headers:{White:'Blancas',Black:'Negras',Event:'Torneo'},moves:[
 {san:'e4'},{san:'c5'},{san:'Nf3'},{san:'d6'}
]};
const full=[{type:'best',loss:3},{type:'best',loss:6},{type:'good',loss:9},{type:'mistake',loss:80}];
const partial=[full[0],full[1],full[2]];
test('event analysis progress reports only fully evaluated white AND black games as complete',()=>{
 const list=[{g:game,index:0},{g:game,index:1},{g:game,index:2}];
 const cache=new Map([[0,{reports:full}],[1,{reports:partial}]]);
 const result=eventAnalysisProgress(list,cache);
 assert.deepEqual([result.total,result.completed,result.pending],[3,1,2]);
 assert.deepEqual(result.items.map(x=>x.complete),[true,false,false]);
 assert.equal(gameMetrics(game,{reports:partial}).b.complete,false);
});
test('empty event cannot be advertised as completed analysis',()=>{
 assert.deepEqual(eventAnalysisProgress([],new Map()),{items:[],total:0,completed:0,pending:0});
});
test('batch message requires zero remaining incomplete games',()=>{
 const source=readFileSync(new URL('./performance.js',import.meta.url),'utf8');
 assert.ok(source.includes('finalProgress.pending===0?'));
 assert.ok(source.includes('Análisis incompleto: '));
 assert.ok(source.includes('Análisis cancelado: '));
 assert.ok(source.includes('eventAnalysisProgress(games,getAnalyses())'));
 assert.ok(!source.includes("'Análisis integral completado: '+games.length+' partidas del evento.'"));
});
test('event game list defaults to a collapsed, filterable accessible control',()=>{
 const source=readFileSync(new URL('./performance.js',import.meta.url),'utf8');
 assert.ok(source.includes("eventGamesExpanded=false,eventGamesFilter='pending'"));
 assert.ok(source.includes('id="perf-toggle-games"'));
 assert.ok(source.includes('aria-expanded='));
 assert.ok(source.includes('data-perf-games-filter="pending"'));
 assert.ok(source.includes('data-perf-games-filter="all"'));
 assert.ok(source.includes('data-perf-game-open'));
});
test('light and dark game-list styling is consistent',()=>{
 const css=readFileSync(new URL('./style.css',import.meta.url),'utf8');
 for(const query of ['.perf-games-toggle','.perf-games-filters','.perf-games-section .perf-game-select',':root[data-theme="light"] .perf-games-section',':root[data-theme="light"] .perf-state-pending'])assert.ok(css.includes(query),query+' CSS missing');
});
