import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const main=readFileSync(new URL('../main.js',import.meta.url),'utf8');
const ci=readFileSync(new URL('./ci-panel.js',import.meta.url),'utf8');
const css=readFileSync(new URL('./ci-style.css',import.meta.url),'utf8');

test('private CI opens AFTER other screens are closed',()=>{
 const nav=main.slice(main.indexOf('ciNav.onclick=async()=>'),main.indexOf('let roleCheck=0;'));
 assert.ok(nav.indexOf('window.IB_LIBRARY.close()')>=0);
 assert.ok(nav.indexOf('window.IB_LIBRARY.close()')<nav.indexOf('window.IB_CI.show()'));
 assert.ok(nav.indexOf('window.IB_PERFORMANCE.hide()')<nav.indexOf('window.IB_CI.show()'));
});
test('CI owns a standalone view and removes it on exit',()=>{
 assert.match(ci,/main\.classList\.add\('ci-isolated'\)/);
 assert.match(ci,/main\.classList\.remove\('ci-isolated'\)/);
 assert.match(css,/\.main\.ci-isolated > \.layout[\s\S]*?display:none!important;/);
 assert.match(css,/\.main\.ci-isolated > \.toolbar/);
});
test('documentary board and its tab require a selected rival',()=>{
 assert.match(ci,/el\('ci-open-board'\)\.hidden=!player/);
 assert.match(ci,/el\('ci-tab-board'\)\.hidden=!player/);
 assert.match(ci,/if\(next==='board'&&!chosenId\)/);
});
test('release marker changes when new deployment has landed',()=>{
 assert.match(ci,/ci-release">v2\.2/);
});
