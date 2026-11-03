import {Chess} from 'chess.js';
import {readSanTokens} from './opening-research-tools.js';

// Import only the main line of the supplied PGN into a private opening study.
// Variations outside the main line require separate, explicit editorial branches.
export function parsePersonalOpeningStudy(text){
 const raw=String(text||'').trim();
 if(!raw)throw Error('Pegá un PGN o una secuencia de jugadas.');
 if(raw.length>250000)throw Error('El PGN supera el límite de 250.000 caracteres.');
 let game=new Chess(),importedAsPGN=false;
 try{
  if(/^\s*\[[A-Za-z][\w]*\s+"/m.test(raw)){game.loadPgn(raw,{strict:false});importedAsPGN=true;}
  else for(const token of readSanTokens(raw)){game.move(token);}
 }catch(error){throw Error('PGN inválido o con jugadas ilegales: '+error.message);}
 const sans=game.history();
 if(!sans.length)throw Error('El estudio necesita al menos una jugada legal.');
 if(sans.length>350)throw Error('La línea principal supera el límite de 350 medias jugadas.');
 const positions=[new Chess().fen()],walk=new Chess();
 sans.forEach(san=>{walk.move(san);positions.push(walk.fen());});
 const notes={};
 if(importedAsPGN){
  const comments=game.getComments();
  for(const note of comments){
   const ply=positions.indexOf(note.fen);
   if(ply>=1&&typeof note.comment==='string')notes[ply]=note.comment.slice(0,4000);
  }
 }
 return {moves:sans.join(' '),notes,headers:game.header(),plyCount:sans.length,hadVariations:/\([^)]*\d+\.\s*[^)]*\)/.test(raw)};
}
