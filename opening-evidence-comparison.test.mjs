import test from 'node:test';
import assert from 'node:assert/strict';
import {compareOpeningEvidence} from './opening-evidence-comparison.js';
const engine={complete:true,lines:[
 {rank:1,san:'8... Be7 9. Qd2',score:'+0.36',depth:24},
 {rank:2,san:'8... h5 9. Qd2',score:'+0.24',depth:22}
]};
test('comparison distinguishes popularity from objective engine preference',()=>{
 const masters={white:200,draws:100,black:100,moves:[
  {san:'h5',white:100,draws:80,black:80},
  {san:'Be7',white:100,draws:20,black:20}
 ]};
 const c=compareOpeningEvidence(engine,masters);
 assert.equal(c.engineBest,'Be7');
 assert.equal(c.mostPlayed,'h5');
 assert.equal(c.match,false);
 assert.equal(c.engineBestMasterCount,140);
 assert.equal(c.sample,400);
 assert.equal(c.engineDepth,24);
 assert.equal(c.hasBoth,true);
});
test('comparison refuses to draw conclusions on empty samples or missing engine',()=>{
 const none={white:0,draws:0,black:0,moves:[{san:'Be7',white:0,draws:0,black:0}]};
 assert.equal(compareOpeningEvidence(engine,none).hasBoth,false);
 assert.equal(compareOpeningEvidence(null,{white:10,draws:0,black:0,moves:[{san:'Be7',white:10,draws:0,black:0}]}).hasBoth,false);
});
