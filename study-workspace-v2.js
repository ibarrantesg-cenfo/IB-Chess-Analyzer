import {Chess} from 'chess.js';
import {readSanTokens} from './opening-research-tools.js';
import {spanishToInternationalSan} from './opening-study-branches.js';

// This module is UI-independent so we can test study actions without a browser.
export function parseStudyContinuation(fen,source,notation='international'){
 if(!fen||typeof fen!=='string')throw Error('Seleccioná una posición válida del estudio.');
 const raw=String(source||'').trim();
 if(!raw)throw Error('Escribí al menos una jugada para la variante.');
 if(raw.length>25000)throw Error('La variante es demasiado larga.');
 const chess=new Chess(fen),tokens=readSanTokens(notation==='es'?spanishToInternationalSan(raw):raw);
 if(!tokens.length)throw Error('La variante no contiene jugadas.');
 if(tokens.length>160)throw Error('Limitamos las variantes a 160 medias jugadas.');
 const sans=[],fens=[chess.fen()];
 for(const token of tokens){
  try{const move=chess.move(token);if(!move)throw Error();sans.push(move.san);fens.push(chess.fen());}
  catch{throw Error('Jugada ilegal: '+token+' después de '+(sans.join(' ')||'la posición inicial')+'.');}
 }
 return {sans,fens,finalFen:chess.fen(),startFen:fens[0]};
}
export function eligibleStudyRecipients(account,enrollments){
 if(account?.isTeacher){
  const now=Date.now();
  return (enrollments?.teacher?enrollments.items:[]).filter(item=>{
   if(item.state!=='active')return false;
   if(item.expires_at&&Date.parse(item.expires_at)<now)return false;
   return /^[0-9a-f-]{36}$/i.test(String(item.student_id||''));
  }).map(item=>({id:item.student_id,name:String(item.name||'Alumno').slice(0,100),type:'student'}));
 }
 return (account?.teachers||[]).filter(item=>/^[0-9a-f-]{36}$/i.test(String(item.teacher_id||'')))
  .map(item=>({id:item.teacher_id,name:String(item.display_name||'Profesor').slice(0,100),type:'teacher'}));
}
export function studyPositionLabel(ply,game){
 const p=Number.isInteger(ply)?Math.max(0,ply):0;
 if(p===0)return 'Posición inicial';
 const san=game?.moves?.[p-1]?.san||'';
 return (Math.ceil(p/2))+(p%2===0?'... ':'. ')+san;
}
