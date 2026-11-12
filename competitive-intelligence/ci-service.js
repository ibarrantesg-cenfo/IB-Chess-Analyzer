/**
 * Supabase-backed CI service. Inject the EXISTING authenticated Supabase client.
 * No client-side teacher/admin flag is trusted. The RPC is only a UX gate:
 * RLS must protect all tables on the server.
 */
import {validatePlayer,validateObservation,normalizePgn,validateSourceUrl} from './ci-model.js';
function failure(error){throw Error(error?.message||'Operación no disponible');}
export function createCIService(supabase){
 if(!supabase||typeof supabase.from!=='function'||typeof supabase.rpc!=='function')throw Error('Cliente autenticado requerido');
 async function authorized(){
  const {data,error}=await supabase.rpc('ib_ci_is_admin');
  if(error)failure(error);
  return data===true;
 }
 async function guard(){
  if(!(await authorized()))throw Error('Acceso restringido al administrador de Competitive Intelligence');
 }
 return {
  authorized,
  async listPlayers(){await guard();const {data,error}=await supabase.from('ib_ci_players').select('id,display_name,fide_id,aliases,priority,notes,created_at,updated_at,archived_at').is('archived_at',null).order('display_name').limit(200);if(error)failure(error);return data||[];},
  async createPlayer(input){await guard();const payload=validatePlayer(input);const {data,error}=await supabase.from('ib_ci_players').insert(payload).select('id,display_name,fide_id,aliases,priority,notes').single();if(error)failure(error);return data;},
  async updatePlayer(id,input){await guard();if(!/^[0-9a-f-]{36}$/i.test(id))throw Error('RID inválido');const payload=validatePlayer(input);const {data,error}=await supabase.from('ib_ci_players').update({...payload,updated_at:new Date().toISOString()}).eq('id',id).select('id,display_name,fide_id,aliases,priority,notes').single();if(error)failure(error);return data;},
  async archivePlayer(id){await guard();if(!/^[0-9a-f-]{36}$/i.test(id))throw Error('RID inválido');const {error}=await supabase.from('ib_ci_players').update({archived_at:new Date().toISOString()}).eq('id',id);if(error)failure(error);},
  async listObservations(playerId){await guard();const {data,error}=await supabase.from('ib_ci_observations').select('id,player_id,code,claim,confidence,sample_n,evidence,reviewed_at,created_at').eq('player_id',playerId).order('created_at',{ascending:false});if(error)failure(error);return data||[];},
  async addObservation(playerId,input){await guard();const payload={...validateObservation(input),player_id:playerId};const {data,error}=await supabase.from('ib_ci_observations').insert(payload).select('id,code,claim,confidence,sample_n,evidence').single();if(error)failure(error);return data;},
  async listGames(playerId){await guard();const {data,error}=await supabase.from('ib_ci_games').select('id,player_id,source_url,source_name,played_at,time_control,player_color,created_at').eq('player_id',playerId).order('played_at',{ascending:false}).limit(250);if(error)failure(error);return data||[];},
  async addGame(playerId,input){await guard();const pgn=normalizePgn(input.pgn);const source_url=validateSourceUrl(input.source_url);const bytes=new TextEncoder().encode(pgn);const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');const payload={player_id:playerId,pgn,pgn_sha256:hash,source_url,source_name:String(input.source_name||'').slice(0,180),played_at:input.played_at||null,time_control:String(input.time_control||'').slice(0,80),player_color:input.player_color||null};const {data,error}=await supabase.from('ib_ci_games').insert(payload).select('id,player_id,source_name,played_at').single();if(error)failure(error);return data;}
 };
}
