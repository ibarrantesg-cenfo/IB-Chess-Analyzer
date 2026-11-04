import { Chess } from 'chess.js';

const clean=s=>String(s||'').trim();
export function openingLineSignature(pgn){
 const game=new Chess();
 try{game.loadPgn(String(pgn||''),{strict:false});}catch(e){throw Error('La línea PGN no es válida: '+e.message);}
 const moves=game.history();
 if(!moves.length)throw Error('La línea debe contener al menos una jugada.');
 if(moves.length>350)throw Error('La línea supera el límite de 350 medias jugadas.');
 return moves.join(' ');
}
export function openingStudyDestinations(items){
 const groups=new Map(),singles=[];
 for(const item of items||[]){
  if(!item?.id||typeof item.pgn!=='string')continue;
  if(item.collectionId){
   const id=String(item.collectionId);
   if(!groups.has(id))groups.set(id,{id:'collection:'+id,kind:'collection',title:clean(item.collectionName)||'Estudio sin nombre',count:0,sourceId:null});
   groups.get(id).count++;
  }else singles.push({id:'item:'+item.id,kind:'item',title:clean(item.name)||'Estudio sin nombre',count:1,sourceId:item.id});
 }
 return [...groups.values(),...singles].sort((a,b)=>a.title.localeCompare(b.title,'es',{sensitivity:'base'}));
}
export function openingStudyTarget(items,targetId){
 const rows=Array.isArray(items)?items:[];
 const destinations=openingStudyDestinations(rows);
 const destination=destinations.find(x=>x.id===targetId);
 if(!destination)throw Error('El estudio seleccionado no está disponible. Actualizá la lista.');
 const base=destination.kind==='item'?rows.find(x=>x.id===destination.sourceId):null;
 const group=destination.kind==='collection'?targetId.slice('collection:'.length):base?.collectionId||null;
 const name=destination.kind==='collection'?destination.title:clean(base?.name)||'Estudio personal';
 const members=destination.kind==='collection'?rows.filter(x=>x.collectionId===group):[base];
 if(!members.length||members.some(x=>!x?.pgn))throw Error('El estudio elegido no tiene partidas recuperables.');
 return {collectionId:group,collectionName:name,members:members.filter(Boolean),promote:base&&!group?base:null};
}
export function prepareOpeningChapter(pgn,{id,collectionId,collectionName,name,student='Sin alumno',sourceId=''}){
 const signature=openingLineSignature(pgn);
 const chapterName=clean(name);
 const groupName=clean(collectionName);
 if(!chapterName||chapterName.length>150)throw Error('Ingresá un nombre de línea (hasta 150 caracteres).');
 if(!groupName||groupName.length>120)throw Error('Ingresá un nombre de estudio (hasta 120 caracteres).');
 if(!id||!collectionId)throw Error('No se pudo identificar el estudio de destino.');
 const now=new Date().toISOString();
 return {id,collectionId,collectionName:groupName,name:chapterName,
  student:clean(student).slice(0,100)||'Sin alumno',
  pgn:String(pgn),comments:{},variations:[],diagrams:[],
  sourceOpeningId:String(sourceId||'').slice(0,150),created:now,updated:now,chapterType:'opening'};
}
export function duplicateOpeningChapter(pgn,existing){
 const signature=openingLineSignature(pgn);
 return (existing||[]).some(item=>{
  try{return openingLineSignature(item.pgn)===signature;}
  catch{return false;}
 });
}
