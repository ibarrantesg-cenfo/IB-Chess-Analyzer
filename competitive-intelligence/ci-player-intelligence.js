import {Chess} from 'chess.js';
import {normalizeCIName} from './ci-university-data.js';

/** Official FIDE monthly list, November 2026. Never imply realtime updates. */
export const CI_FIDE_NOV_2026=Object.freeze({
 '6507522':{standard:2275,rapid:2216,blitz:2262,title:'FM'},
 '6505945':{standard:2056,rapid:1955,blitz:1934,title:'FM'},
 '6522181':{standard:1859,rapid:1790,blitz:2000,title:''},
 '6508200':{standard:2042,rapid:1725,blitz:1877,title:'CM'},
 '6506941':{standard:1867,rapid:1767,blitz:1774,title:''},
 '6516858':{standard:1890,rapid:1786,blitz:1840,title:''},
 '6513743':{standard:2052,rapid:1856,blitz:1817,title:''}
});
export const CI_PGN_REFERENCES=Object.freeze({
 '6507522':[
  {label:'Chess.com · partidas publicadas (104 en su índice)',url:'https://www.chess.com/games/david-alejandro-cabezas-solano',kind:'games'},
  {label:'ChessPrime · catálogo de partidas',url:'https://chessprime.com/players/player/146957/',kind:'games'},
  {label:'Chess-Results · Nacional Equipos 2026, ronda 4',url:'https://s2.chess-results.com/test/partiesuche.aspx?art=4&lan=5&rd=4&tnr=1413614',kind:'tournament'},
  {label:'Chess-Results · Nacional Equipos 2026, ronda 5',url:'https://s2.chess-results.com/test/partiesuche.aspx?art=4&lan=5&rd=5&tnr=1413614',kind:'tournament'}
 ],
 '6505945':[
  {label:'Chess.com · colección de partidas públicas',url:'https://www.chess.com/games/gerardo-alfonso-ramirez-madrid',kind:'games'},
  {label:'Chess-Results · Nacional Equipos 2026, ronda 4',url:'https://s2.chess-results.com/test/partiesuche.aspx?art=4&lan=5&rd=4&tnr=1413614',kind:'tournament'},
  {label:'Chess-Results · Nacional Equipos 2026, ronda 5',url:'https://s2.chess-results.com/test/partiesuche.aspx?art=4&lan=5&rd=5&tnr=1413614',kind:'tournament'}
 ],
 '6508200':[{label:'Chess.com · partidas públicas de Martín Barboza',url:'https://www.chess.com/games/martin-eduardo-barboza-viquez',kind:'games'}],
 '6516858':[{label:'Chess-Results · Nacional Equipos 2026, ronda 4',url:'https://s2.chess-results.com/test/partiesuche.aspx?art=4&lan=5&rd=4&tnr=1413614',kind:'tournament'}],
 '6550096':[{label:'Chess-Results · Nacional Equipos 2026, ronda 4',url:'https://s2.chess-results.com/test/partiesuche.aspx?art=4&lan=5&rd=4&tnr=1413614',kind:'tournament'}],
 '6524869':[{label:'Chess-Results · Nacional Equipos 2026, rondas 4–5',url:'https://s2.chess-results.com/test/partiesuche.aspx?art=4&lan=5&rd=4&tnr=1413614',kind:'tournament'}]
});

export const ratingFor=fideId=>CI_FIDE_NOV_2026[String(fideId||'')]||null;
/** JUNCOS Standard tournament game database advertises 10 downloadable PGNs in 5 rounds.
 * This does not imply all these players appear in the 10 available game scores.
 */
export const CI_JUNCOS_STANDARD_PGN=Object.freeze({
 label:'JUNCOS 2026 · 10 PGN disponibles en 5 rondas (descarga del torneo)',
 url:'https://s3.chess-results.com/partiesuche.aspx?art=3&lan=2&tnr=1516373',
 kind:'tournament-pgn',
 totalAdvertised:10,
 tournamentId:'1516373'
});
const CI_JUNCOS_STANDARD_FIDE_IDS=new Set([
 '6507522','6506941','6521541','6520901','6518095',
 '6514219','6560377','6563147','6511430','6529151','6550550','6583822'
]);
export const gameReferences=fideId=>{
 const id=String(fideId||'');
 const found=CI_PGN_REFERENCES[id]||[];
 return CI_JUNCOS_STANDARD_FIDE_IDS.has(id)?[CI_JUNCOS_STANDARD_PGN,...found]:found;
};

/** Split legal PGN exports by header blocks, regardless of tag order.
 * ChessPrime commonly puts [Source] before [Event]; do not require Event first.
 * A new header block after movetext begins the next game.
 */
export function splitPGN(raw){
 const text=String(raw??'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim();
 if(!text)throw Error('Pegá o seleccioná un PGN antes de importarlo.');
 if(text.length>3_000_000)throw Error('PGN demasiado grande (máximo 3 MB).');
 const lines=text.split('\n'),games=[];
 let buffer=[],sawHeader=false,sawMoves=false;
 const header=/^\[[A-Za-z][A-Za-z0-9_]*\s+"(?:[^"\\]|\\.)*"\]\s*$/;
 const flush=()=>{const game=buffer.join('\n').trim();if(game)games.push(game);buffer=[];sawHeader=false;sawMoves=false;};
 for(const line of lines){
  const stripped=line.trim();
  if(header.test(stripped)){
   if(sawMoves)flush();
   sawHeader=true;buffer.push(line);continue;
  }
  if(!sawHeader&&stripped&&!stripped.startsWith('%'))throw Error('Contenido inesperado antes de la primera partida.');
  if(sawHeader&&stripped&&!stripped.startsWith('%'))sawMoves=true;
  buffer.push(line);
 }
 flush();
 return games;
}
const pgnHeader=(pgn,key)=>{
 const match=String(pgn).match(new RegExp('^\\['+key+'\\s+"([^"]*)"\\]','im'));
 return match?.[1]||'';
};
const sameName=(actual,expected)=>{
 const x=normalizeCIName(actual),y=normalizeCIName(expected);
 if(x===y)return true;
 const parts=x.split(' ').filter(Boolean),target=y.split(' ').filter(Boolean);
 // Only allow explicit last+first transposition, no surname-only matching.
 return parts.length>=3&&target.length>=3&&parts.length===target.length&&parts.every(t=>target.includes(t));
};
export function parseCIImport(raw,player){
 const chunks=splitPGN(raw),good=[],rejected=[];
 for(let i=0;i<chunks.length;i++){
  const rawGame=chunks[i];
  try{
   if(rawGame.length>300000)throw Error('Una partida supera 300 KB.');
   const board=new Chess();board.loadPgn(rawGame,{strict:false});
   const headers=board.header(),white=headers.White||pgnHeader(rawGame,'White'),black=headers.Black||pgnHeader(rawGame,'Black');
   if(!white||!black)throw Error('Faltan los encabezados White y Black.');
   const whiteFid=headers.WhiteFideId||headers.WhiteFideID||'',blackFid=headers.BlackFideId||headers.BlackFideID||'';
   const fide=String(player.fide_id||'');
   // Require exact FIDE match if present; otherwise full-name matching.
   const matchedWhite=(fide&&String(whiteFid)===fide)||sameName(white,player.display_name);
   const matchedBlack=(fide&&String(blackFid)===fide)||sameName(black,player.display_name);
   if(matchedWhite===matchedBlack)throw Error('No se pudo identificar de forma inequívoca al rival en esta partida.');
   const color=matchedWhite?'w':'b';
   const length=board.history().length;
   if(!length)throw Error('Partida sin jugadas.');
   const date=/^\d{4}\.\d{2}\.\d{2}$/.test(headers.Date||'')&&!headers.Date.includes('?')?headers.Date.replaceAll('.','-'):null;
   good.push({pgn:rawGame,source_name:headers.Event||'PGN aportado por administrador',played_at:date,time_control:headers.TimeControl||'',player_color:color,summary:{white,black,result:headers.Result||'*',date:headers.Date||'',eco:headers.ECO||'',moves:length}});
  }catch(error){rejected.push({number:i+1,reason:error.message});}
 }
 return {good,rejected};
}
const resultScore=(result,color)=>result==='1/2-1/2'?0.5:result===(color==='w'?'1-0':'0-1')?1:result===(color==='w'?'0-1':'1-0')?0:null;
const inc=(map,key,score)=>{let v=map.get(key);if(!v){v={name:key,n:0,wins:0,draws:0,losses:0,points:0,results:0};map.set(key,v);}v.n++;if(score!==null){v.results++;v.points+=score;v[score===1?'wins':score===0?'losses':'draws']++;}};
export function analyzeCIGames(records=[]){
 const byColor={w:{n:0,wins:0,draws:0,losses:0},b:{n:0,wins:0,draws:0,losses:0}};
 const openings={w:new Map(),b:new Map()},lines={w:new Map(),b:new Map()},responses={w:new Map(),b:new Map()};
 let valid=0,rejected=0,dated=0;
 for(const record of records){
  try{
   const chess=new Chess();chess.loadPgn(record.pgn,{strict:false});
   const h=chess.header(),hist=chess.history(),color=record.player_color;
   if(!['w','b'].includes(color)||!hist.length)throw Error('Sin color o jugadas');
   valid++;if(record.played_at)dated++;
   const score=resultScore(h.Result||'*',color),c=byColor[color];c.n++;
   if(score!==null)c[score===1?'wins':score===0?'losses':'draws']++;
   inc(openings[color],h.ECO?.trim()||'Sin ECO',score);
   const own=color==='w'?hist[0]:(hist[0]&&hist[1]?hist[0]+' '+hist[1]:'Sin respuesta');
   inc(responses[color],own||'Sin jugada',score);
   inc(lines[color],hist.slice(0,Math.min(8,hist.length)).map((move,i)=>(i%2===0?(Math.floor(i/2)+1)+'.':'')+move).join(' '),score);
  }catch{rejected++;}
 }
 const sorted=m=>[...m.values()].sort((a,b)=>b.n-a.n||a.name.localeCompare(b.name));
 return {valid,rejected,dated,byColor,openings:{w:sorted(openings.w),b:sorted(openings.b)},responses:{w:sorted(responses.w),b:sorted(responses.b)},lines:{w:sorted(lines.w),b:sorted(lines.b)}};
}
