import test from 'node:test';
import assert from 'node:assert/strict';
import {coordinateInk,contrastRatio,pieceSetForStyle} from './color-contrast.js';
test('coordinate labels stay readable across custom board colors',()=>{
 for(let r=0;r<=255;r+=17)for(let g=0;g<=255;g+=17)for(let b=0;b<=255;b+=17){
  const background='#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
  assert.ok(contrastRatio(background,coordinateInk(background))>=4.5,background);
 }
});
test('classic and both named traditional sets resolve to bundled SVGs',()=>{
 assert.equal(pieceSetForStyle('classic'),'cburnett');
 assert.equal(pieceSetForStyle('cburnett'),'cburnett');
 assert.equal(pieceSetForStyle('merida'),'merida');
 assert.equal(pieceSetForStyle('flat'),null);
 assert.equal(pieceSetForStyle('unknown'),null);
});
