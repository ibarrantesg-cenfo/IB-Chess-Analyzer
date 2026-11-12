import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('./live-analysis.js',import.meta.url),'utf8');
const styles=readFileSync(new URL('./style.css',import.meta.url),'utf8');

test('PV alternatives are accessible, expandable summaries instead of nested scroll panels',()=>{
 assert.ok(source.includes("document.createElement('details');card.className='live-line live-line-accordion'"));
 assert.ok(source.includes("document.createElement('summary');header.className='live-line-head'"));
 assert.ok(source.includes('card.open=expandedRanks.has(n)'));
 assert.ok(source.includes('expandedRanks.add(n)'));
 assert.ok(source.includes('expandedRanks.delete(n)'));
 assert.ok(styles.includes('.live-analysis-panel .live-lines'));
 assert.ok(styles.includes('max-height:none;'));
 assert.ok(styles.includes('overflow:visible;'));
});
test('lines start collapsed under the side-to-move disclosure',()=>{
 assert.ok(source.includes('const expandedRanks=new Set()'));
 assert.ok(source.includes('let liveGroupOpen=false'));
 assert.ok(source.includes("'Líneas para blancas':'Líneas para negras'"));
 assert.ok(source.includes("n===1?'Principal':'Alternativa'"));
 assert.ok(source.includes('body.append(variation,explanation,actions)'));
});
test('the engine has no repeated explanatory block for an existing PV',()=>{
 assert.ok(source.includes("Tocá una línea para mostrar u ocultar las jugadas"));
 assert.ok(!source.includes("textContent=first?interpretation(first,1)"));
});
test('compact mode keeps the board readable on short displays and fluid on mobile',()=>{
 assert.ok(styles.includes('.workspace-compact .board-row{max-width:clamp(420px,calc(100dvh - 250px),560px)}'));
 assert.ok(styles.includes('.main.workspace-compact .board-row{max-width:min(100%,540px)}'));
 assert.ok(styles.includes('grid-template:repeat(8,minmax(0,1fr))/repeat(8,minmax(0,1fr))'));
});
test('live variation has matching light theme and keyboard focus styles',()=>{
 assert.ok(styles.includes(':root[data-theme="light"] .live-line-accordion'));
 assert.ok(styles.includes('.live-line-accordion>.live-line-head:focus-visible'));
 assert.ok(styles.includes('.live-line-actions'));
});
