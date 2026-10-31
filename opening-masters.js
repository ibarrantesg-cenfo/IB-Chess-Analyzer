// Optional and user-triggered Lichess Masters Opening Explorer lookup.
// Never claims master frequency proves the engine's objective evaluation.
const HOST='https://explorer.lichess.org/masters';
let blockedUntil=0,busy=false;
const number=x=>Math.max(0,Number.isFinite(Number(x))?Math.trunc(Number(x)):0);
const safeName=x=>String(x||'').slice(0,90);
export function normalizeMasterResults(raw){
 if(!raw||!Array.isArray(raw.moves))throw Error('La respuesta de Lichess no tiene el formato esperado.');
 const moves=raw.moves.slice(0,15).map(row=>({
  san:safeName(row.san),uci:safeName(row.uci),white:number(row.white),draws:number(row.draws),black:number(row.black),averageRating:number(row.averageRating)
 })).filter(x=>x.san);
 const games=(Array.isArray(raw.topGames)?raw.topGames:[]).slice(0,6).map(g=>({
  id:/^[a-zA-Z0-9]{8,12}$/.test(String(g.id||''))?String(g.id):null,
  white:safeName(g.white?.name||g.white),black:safeName(g.black?.name||g.black),year:String(g.year||'').slice(0,12),
  winner:safeName(g.winner||'')
 }));
 return {white:number(raw.white),draws:number(raw.draws),black:number(raw.black),moves,games};
}
export async function queryMastersPosition(fen){
 if(busy)throw Error('Ya hay una consulta en curso; completá esa antes de iniciar otra.');
 if(Date.now()<blockedUntil)throw Error('El Explorer indicó límite de solicitudes. Esperá al menos un minuto antes de consultar de nuevo.');
 if(typeof fen!=='string'||!fen.includes(' w ')&&!fen.includes(' b '))throw Error('Se necesita una posición FEN válida.');
 busy=true;
 try{
  const url=new URL(HOST);
  url.searchParams.set('fen',fen);url.searchParams.set('moves','12');url.searchParams.set('topGames','5');url.searchParams.set('recentGames','0');
  const response=await fetch(url.toString(),{headers:{Accept:'application/json'}});
  if(response.status===429){blockedUntil=Date.now()+60000;throw Error('Lichess alcanzó su límite de consultas. Volvé a intentar después de un minuto.');}
  if(!response.ok)throw Error('Opening Explorer no respondió correctamente (HTTP '+response.status+').');
  return normalizeMasterResults(await response.json());
 }catch(e){
  if(e instanceof TypeError)throw Error('El navegador no pudo conectar con Opening Explorer. Revisá conexión y permisos del servicio.');
  throw e;
 }finally{busy=false;}
}
