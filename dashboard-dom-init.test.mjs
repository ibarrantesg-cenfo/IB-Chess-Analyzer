import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const opening=readFileSync(new URL('./opening-research.js',import.meta.url),'utf8');
const main=readFileSync(new URL('./main.js',import.meta.url),'utf8');

test('every static opening-laboratory lookup points to a declared DOM element',()=>{
  const lookups=[...opening.matchAll(/\bel\(['"]([\w-]+)['"]\)/g)].map(match=>match[1]);
  const declared=new Set([...opening.matchAll(/\bid=['"]([\w-]+)['"]/g)].map(match=>match[1]));
  const missing=[...new Set(lookups)].filter(id=>!declared.has(id));
  assert.deepEqual(missing,[],'Missing DOM IDs can halt initialization and leave the sidebar unresponsive');
  assert.ok(declared.has('opening-lab-queue'));
});

test('critical-position queue exists before it is moved into advanced research',()=>{
  const queueMarkup=opening.indexOf('id="opening-lab-queue"');
  const queueMove=opening.indexOf("const queue=el('opening-lab-queue')");
  assert.ok(queueMarkup>0);
  assert.ok(queueMove>queueMarkup);
  assert.ok(opening.includes('queue.before(advanced)'));
});

test('dashboard sections retain their normal click handlers and direct links',()=>{
  assert.ok(main.includes("const nativeHandlers=new Map()"));
  assert.ok(main.includes("window.addEventListener('popstate',activateLocationSection)"));
  for(const section of ['review','openings','library','reports','preferences']){
    assert.ok(main.includes('id="nav-'+section+'"'),'Missing navigation '+section);
  }
});
