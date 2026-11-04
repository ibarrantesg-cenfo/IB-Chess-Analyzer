import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {savedSidebarPreference} from './sidebar-layout.js';

const main=readFileSync(new URL('./main.js',import.meta.url),'utf8');
const styles=readFileSync(new URL('./style.css',import.meta.url),'utf8');
const module=readFileSync(new URL('./sidebar-layout.js',import.meta.url),'utf8');

test('collapse preference is saved only as an opt-in, with a safe fallback',()=>{
 assert.equal(savedSidebarPreference({getItem:()=>null}),false);
 assert.equal(savedSidebarPreference({getItem:()=> '1'}),true);
 assert.equal(savedSidebarPreference({getItem:()=> '0'}),false);
 assert.equal(savedSidebarPreference({getItem(){throw new Error('storage blocked');}}),false);
});
test('sidebar is fully controllable from both desktop and mobile without removing deep links',()=>{
 for(const fragment of [
  'id="app-sidebar"','id="sidebar-toggle"','id="sidebar-mobile-toggle"',
  'id="sidebar-scrim"','window.IB_SIDEBAR=initSidebarLayout()',
  'id="nav-review"','id="nav-openings"','id="nav-library"',
  'id="nav-reports"','id="nav-preferences"'
 ])assert.ok(main.includes(fragment),'Missing '+fragment);
 assert.ok(module.includes("shell.classList.toggle('sidebar-collapsed'"));
 assert.ok(module.includes("shell.classList.toggle('sidebar-mobile-open'"));
 assert.ok(module.includes("aria-expanded"));
 assert.ok(module.includes("data-tooltip"));
 assert.ok(module.includes("window.addEventListener('storage'"));
});
test('sidebar collapse keeps readable desktop icons and visible mobile drawer',()=>{
 assert.ok(styles.includes('@media(min-width:801px)'));
 assert.ok(styles.includes('.shell.sidebar-collapsed>.sidebar'));
 assert.ok(styles.includes('width:76px;min-width:76px'));
 assert.ok(styles.includes('.shell.sidebar-collapsed>.main'));
 assert.ok(styles.includes('.sidebar .nav>span{display:none}'));
 assert.ok(styles.includes('@media(max-width:800px)'));
 assert.ok(styles.includes('.shell.sidebar-mobile-open .sidebar'));
 assert.ok(styles.includes('.shell.sidebar-mobile-open .sidebar-scrim'));
 assert.ok(styles.includes(':root[data-theme="light"] .sidebar-toggle'));
 assert.ok(styles.includes('prefers-reduced-motion:reduce'));
});
test('role-specific Academy controls do not leak when hidden',()=>{
 assert.ok(main.includes('id="sidebar-academy-heading"'));
 assert.ok(main.includes('document.querySelector("#sidebar-academy-heading").hidden=!account'));
 assert.ok(styles.includes('.sidebar .section-caption[hidden]'));
 assert.ok(styles.includes('.sidebar .nav[hidden]'));
});
