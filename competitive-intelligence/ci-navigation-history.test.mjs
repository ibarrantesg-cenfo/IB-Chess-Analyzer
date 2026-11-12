import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sectionHref} from '../navigation-routes.js';
const panel=readFileSync(new URL('./ci-panel.js',import.meta.url),'utf8');
const styles=readFileSync(new URL('./ci-style.css',import.meta.url),'utf8');
test('FIDE and PGN intelligence renders inside selected detail panel, not under the library',()=>{
 const ix=panel.indexOf('<div id="ci-research" hidden>');
 const endPanel=panel.indexOf('</section>\n  </div>\n </section>');
 assert.ok(ix>panel.indexOf('<section class="ci-panel ci-detail-panel">'));
 assert.ok(ix<endPanel);
 assert.match(panel,/initCIPlayerProfile\(\{host:el\('ci-research'\)/);
 assert.match(styles,/\.ci-detail-panel \.ci-r-layout\{grid-template-columns:minmax\(0,1fr\)\}/);
});
test('browser back and forward restore selected rival and documentary tab',()=>{
 assert.match(panel,/history\.pushState\(\{section:'competitive-intelligence',ciPlayer:playerId,ciTab:nextTab\}/);
 assert.match(panel,/const requested=routeState\(\)/);
 assert.match(panel,/const found=players\.find\(p=>p\.id===requested\.playerId\)/);
 assert.match(panel,/await switchTab\(requested\.tab,false\)/);
});
test('internal back actions exist for rival list and documentary board',()=>{
 assert.match(panel,/id="ci-back-roster"/);
 assert.match(panel,/id="ci-back-profile"/);
 assert.match(panel,/el\('ci-back-roster'\)\.onclick/);
 assert.match(panel,/el\('ci-back-profile'\)\.onclick/);
 assert.match(panel,/insertAdjacentHTML\('afterbegin'/);
});
test('private rival parameters are removed outside CI',()=>{
 const href=sectionHref('review','https://example.org/IB-Chess-Analyzer/?view=competitive-intelligence&ci_player=123&ci_tab=board');
 assert.equal(new URL('https://example.org'+href).searchParams.has('ci_player'),false);
 assert.equal(new URL('https://example.org'+href).searchParams.has('ci_tab'),false);
});

test('historical JUNCOS ratings remain visible with an explicit historic label',()=>{
 const content=readFileSync(new URL('./ci-player-profile.js',import.meta.url),'utf8');
 assert.match(content,/findUniversityCandidate\(selected\)/);
 assert.match(content,/JUNCOS · ranking inicial octubre 2026/);
 assert.match(content,/FIDE · noviembre 2026/);
});
