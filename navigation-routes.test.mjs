import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROUTES,sectionHref,sectionFromSearch,normalLinkClick} from './navigation-routes.js';

test('every workspace has a stable, browser-native deep link',()=>{
 const origin='https://example.org/IB-Chess-Analyzer/?solicitar=1&theme=dark#type=invite';
 for(const route of ROUTES){
  const href=sectionHref(route,origin);
  assert.ok(href.startsWith('/IB-Chess-Analyzer/'));
  assert.equal(sectionFromSearch(href.split('?')[1]?'?'+href.split('?')[1]:'').view,route);
  assert.ok(!href.includes('solicitar='));
  assert.ok(!href.includes('#'));
 }
 assert.equal(sectionHref('openings',origin,'najdorf-h5'),'/IB-Chess-Analyzer/?theme=dark&view=openings&study=najdorf-h5');
 assert.equal(sectionFromSearch('?view=openings&study=caro-short').study,'caro-short');
 const focusUrl=sectionHref('openings',origin,'najdorf-h5',true);
 assert.deepEqual(sectionFromSearch(new URL(focusUrl,origin).search),{view:'openings',study:'najdorf-h5',analysis:true,family:''});
 const familyUrl=sectionHref('openings',origin,'',true,'Apertura Catalana');
 assert.deepEqual(sectionFromSearch(new URL(familyUrl,origin).search),{view:'openings',study:'',analysis:true,family:'Apertura Catalana'});
 assert.equal(sectionHref('openings',new URL(familyUrl,origin)),'/IB-Chess-Analyzer/?theme=dark&view=openings');
 assert.equal(sectionHref('review',new URL(focusUrl,origin)),'/IB-Chess-Analyzer/?theme=dark&view=review');
 assert.equal(sectionFromSearch('?view=bad-route').view,'review');
 assert.throws(()=>sectionHref('bad-route',origin),/inexistente/);
});
test('modified link clicks keep the browser native new-tab behavior',()=>{
 assert.equal(normalLinkClick({button:0,ctrlKey:false,metaKey:false,altKey:false,shiftKey:false}),true);
 assert.equal(normalLinkClick({button:0,ctrlKey:true,metaKey:false,altKey:false,shiftKey:false}),false);
 assert.equal(normalLinkClick({button:0,ctrlKey:false,metaKey:true,altKey:false,shiftKey:false}),false);
 assert.equal(normalLinkClick({button:1,ctrlKey:false,metaKey:false,altKey:false,shiftKey:false}),false);
});
test('sidebar sections are real draggable anchors, not click-only buttons',()=>{
 const source=readFileSync(new URL('./main.js',import.meta.url),'utf8');
 for(const route of ROUTES)assert.ok(source.includes('href="?view='+route+'" id="nav-'+route+'"'),route+' link missing');
 assert.ok(source.includes('normalLinkClick(event)'));
 assert.ok(source.includes("window.addEventListener('popstate',activateLocationSection)"));
});
