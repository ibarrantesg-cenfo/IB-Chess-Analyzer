import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Chess} from 'chess.js';
import {openingLineSignature,openingStudyDestinations,openingStudyTarget,prepareOpeningChapter,duplicateOpeningChapter} from './opening-library-transfer.js';
const first=(()=>{const c=new Chess();c.header('Event','Biblioteca Maestra','StudyStatus','BORRADOR');for(const x of ['e4','c5','Nf3','d6','d4','cxd4','Nxd4','Nf6','Nc3','a6'])c.move(x);c.setComment('Idea estratégica en la posición.');return c.pgn();})();
const second=(()=>{const c=new Chess();for(const x of ['e4','e6','d4','d5','e5'])c.move(x);return c.pgn();})();
const rows=[
 {id:'single',name:'Mi repertorio propio',student:'Ian',pgn:first},
 {id:'chapter1',collectionId:'collection-1',collectionName:'Preparación de torneo',name:'Francesa',pgn:second},
 {id:'chapter2',collectionId:'collection-1',collectionName:'Preparación de torneo',name:'Otra',pgn:first}
];
test('catalog lists existing private collections and single studies without inventing users',()=>{
 const destinations=openingStudyDestinations(rows);
 assert.equal(destinations.length,2);
 assert.deepEqual(destinations.find(x=>x.id==='collection:collection-1'),{id:'collection:collection-1',kind:'collection',title:'Preparación de torneo',count:2,sourceId:null});
 assert.deepEqual(destinations.find(x=>x.id==='item:single'),{id:'item:single',kind:'item',title:'Mi repertorio propio',count:1,sourceId:'single'});
});
test('existing grouped study is resolved without altering its chapters',()=>{
 const target=openingStudyTarget(rows,'collection:collection-1');
 assert.equal(target.collectionId,'collection-1');
 assert.equal(target.members.length,2);
 assert.equal(target.promote,null);
 assert.equal(rows[1].collectionName,'Preparación de torneo');
});
test('standalone study can become a multi-chapter collection without deleting original',()=>{
 const target=openingStudyTarget(rows,'item:single');
 assert.equal(target.collectionId,null);
 assert.equal(target.collectionName,'Mi repertorio propio');
 assert.equal(target.promote.id,'single');
 assert.equal(target.members[0].name,'Mi repertorio propio');
});
test('an opening becomes a new private chapter, retaining annotated PGN',()=>{
 const chapter=prepareOpeningChapter(first,{id:'new-chapter',collectionId:'group-1',collectionName:'Mis aperturas',name:'Najdorf con comentarios',sourceId:'najdorf-h5'});
 assert.equal(chapter.chapterType,'opening');
 assert.equal(chapter.collectionId,'group-1');
 assert.equal(chapter.sourceOpeningId,'najdorf-h5');
 assert.deepEqual(new Chess().history(),[]);
 assert.equal(openingLineSignature(chapter.pgn),openingLineSignature(first));
 assert.ok(chapter.pgn.includes('Idea estratégica'));
 assert.equal(chapter.variations.length,0);
});
test('duplicate line in the same study is prevented regardless of PGN comments',()=>{
 const withoutComment=new Chess();
 for(const x of ['e4','c5','Nf3','d6','d4','cxd4','Nxd4','Nf6','Nc3','a6'])withoutComment.move(x);
 assert.equal(duplicateOpeningChapter(withoutComment.pgn(),[{id:'x',pgn:first}]),true);
 assert.equal(duplicateOpeningChapter(second,[{id:'x',pgn:first}]),false);
 assert.throws(()=>openingStudyTarget(rows,'collection:missing'),/no está disponible/);
 assert.throws(()=>openingLineSignature('1. e4 e5 2. Qh8'),/no es válida/);
 assert.throws(()=>prepareOpeningChapter(first,{id:'x',collectionId:'c',collectionName:'',name:'X'}),/nombre de estudio/);
});
test('opening UI makes all families and theory lines collapsible and offers an explicit choice',()=>{
 const ui=readFileSync(new URL('./opening-research.js',import.meta.url),'utf8');
 assert.ok(ui.includes("document.createElement('details');line.className='opening-lab-catalog-line'"));
 assert.ok(ui.includes("const family=document.createElement('details')"));
 assert.ok(ui.includes('＋ Agregar a mis estudios'));
 assert.ok(ui.includes('Agregar como capítulo a un estudio existente'));
 assert.ok(ui.includes('Crear un estudio nuevo con esta línea'));
 assert.ok(ui.includes('window.IB_STUDIO.addOpeningLineToLibrary'));
 assert.ok(ui.includes('explorer.hidden=focused'));
 const styles=readFileSync(new URL('./style.css',import.meta.url),'utf8');
 assert.ok(styles.includes(':root[data-theme="light"] .opening-lab-catalog-line'));
 assert.ok(styles.includes(':root[data-theme="light"] .opening-lab-copy-dialog'));
 assert.ok(styles.includes('.opening-lab-catalog-line-head'));
});
