import {parseCIImport,splitPGN,matchesCIPlayerHeader} from './ci-player-intelligence.js';

/** Pure preview: no writes, and no player creation from a PGN header. */
export function planCITournamentImport(raw,players){
 const games=splitPGN(raw);
 if(games.length>1500)throw Error('Máximo 1500 partidas por lote. Dividí la colección en archivos más pequeños.');
 const ready=[],rejected=[];
 for(let i=0;i<games.length;i++){
  const matches=[];
  for(const p of players){
   if(!matchesCIPlayerHeader(games[i],p))continue;
   const test=parseCIImport(games[i],p);
   if(test.good.length===1)matches.push({player:p,game:test.good[0]});
  }
  const perColor=new Set(matches.map(x=>x.game.player_color));
  if(!matches.length){rejected.push({game:i+1,reason:'Sin identidad coincidente entre rivales registrados, o PGN inválido.'});continue;}
  if(matches.length!==perColor.size){rejected.push({game:i+1,reason:'Identidad ambigua: dos expedientes coinciden con el mismo color.'});continue;}
  for(const match of matches)ready.push({gameNumber:i+1,playerId:match.player.id,playerName:match.player.display_name,game:match.game});
 }
 return {total:games.length,ready,rejected,uniqueGames:new Set(ready.map(x=>x.gameNumber)).size};
}

export function initCITournamentImporter({host,service,getPlayers,onImported}){
 host.innerHTML=`<details class="ci-tournament-manager"><summary>Importar PGN de rivales y torneos</summary>
 <div class="ci-tournament-body">
 <p>Importá PGN de JUNCOS, ChessPrime, SnoopChess o torneos nacionales. Se validan las partidas y se asignan únicamente a rivales reconocidos; no se alteran sus estudios.</p>
 <label>Archivo PGN de torneo<input id="ci-batch-file" type="file" accept=".pgn,.txt,text/plain,application/x-chess-pgn"/></label>
 <label>O pegar PGN<textarea id="ci-batch-text" rows="5" placeholder="Pegá partidas completas con White, Black y jugadas legales"></textarea></label>
 <label>URL de procedencia<input id="ci-batch-source" type="url" placeholder="https://fuente-del-archivo.example/"/></label>
 <div class="ci-actions"><button class="btn outline" id="ci-batch-preview" type="button">Verificar partidas</button><button class="btn primary" id="ci-batch-save" type="button" disabled>Guardar partidas identificadas</button></div>
 <p id="ci-batch-result" role="status" aria-live="polite">No hay un archivo verificado todavía.</p>
 <div id="ci-batch-preview-list" class="ci-batch-preview-list"></div>
 </div></details>`;
 const el=id=>host.querySelector('#'+id);
 let plan=null,fingerprint='',busy=false;
 const status=t=>el('ci-batch-result').textContent=t;
 const reset=()=>{plan=null;fingerprint='';el('ci-batch-save').disabled=true;el('ci-batch-preview-list').replaceChildren();};
 function inputKey(){return el('ci-batch-text').value;}
 el('ci-batch-text').oninput=reset;
 el('ci-batch-file').onchange=async()=>{
  const f=el('ci-batch-file').files?.[0];if(!f)return;
  if(f.size>3_000_000){reset();status('Archivo demasiado grande (máximo 3 MB).');return;}
  el('ci-batch-text').value=await f.text();reset();status('Archivo leído: '+f.name+'. Pulsá Verificar partidas.');
 };
 el('ci-batch-preview').onclick=()=>{
  reset();
  try{
   const content=inputKey();plan=planCITournamentImport(content,getPlayers());
   fingerprint=content;
   const message=plan.total+' partidas examinadas · '+plan.uniqueGames+' atribuibles · '+plan.ready.length+' asociaciones con expedientes · '+plan.rejected.length+' rechazadas.';
   status(message);
   const target=el('ci-batch-preview-list');target.replaceChildren();
   for(const row of plan.ready.slice(0,25)){
    const p=document.createElement('p');p.textContent='#'+row.gameNumber+' · '+row.playerName+' · '+(row.game.player_color==='w'?'Blancas':'Negras');target.append(p);
   }
   if(plan.ready.length>25){const p=document.createElement('small');p.textContent='Mostrando las primeras 25 asociaciones.';target.append(p);}
   for(const row of plan.rejected.slice(0,8)){
    const p=document.createElement('p');p.textContent='#'+row.game+' · Omitida: '+row.reason;target.append(p);
   }
   el('ci-batch-save').disabled=!plan.ready.length;
  }catch(e){status('No se pudo validar el archivo: '+e.message);}
 };
 el('ci-batch-save').onclick=async()=>{
  if(busy||!plan||!plan.ready.length)return;
  if(inputKey()!==fingerprint){reset();status('El PGN cambió. Volvé a verificarlo antes de guardar.');return;}
  if(!confirm('Guardar '+plan.ready.length+' asociaciones verificadas a '+plan.uniqueGames+' partidas? Se omitirán duplicados y partidas sin identidad segura.'))return;
  busy=true;el('ci-batch-save').disabled=true;el('ci-batch-preview').disabled=true;
  let inserted=0,duplicated=0;const errors=[],source=el('ci-batch-source').value.trim();
  try{
   for(const row of plan.ready){
    try{await service.addGame(row.playerId,{...row.game,source_url:source||null});inserted++;}
    catch(e){if(/23505|duplicate|unique/i.test(e.message))duplicated++;else errors.push('#'+row.gameNumber+' '+e.message);}
   }
   status('Guardadas '+inserted+' asociaciones · '+duplicated+' duplicadas · '+errors.length+' errores.'+(errors.length?' '+errors.slice(0,2).join(' · '):''));
   if(inserted)await onImported?.();
  }finally{busy=false;el('ci-batch-preview').disabled=false;reset();}
 };
 return {reset};
}
