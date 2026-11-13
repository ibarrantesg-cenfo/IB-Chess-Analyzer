import {UNIVERSITY_RIVALS,findUniversityCandidate} from './ci-university-data.js';
import {ratingFor,gameReferences} from './ci-player-intelligence.js';
import {tournamentSourcesFor,olympiadScoresFor} from './ci-tournament-sources.js';
import {createCIGameIndex} from './ci-game-explorer.js';

/** Evidence inventory, not an arbitrary "player quality" score. */
export function dossierCoverage(player,records=[]){
 const fide=String(player?.fide_id||'');
 const candidate=findUniversityCandidate(player);
 const current=ratingFor(fide);
 const tournaments=tournamentSourcesFor(fide);
 const sources=gameReferences(fide);
 const sheets=olympiadScoresFor(fide);
 const games=createCIGameIndex(records);
 const white=games.filter(g=>g.color==='w');
 const black=games.filter(g=>g.color==='b');
 const knownYears=[...new Set(games.map(g=>g.year).filter(x=>x!=='unknown'))].sort();
 const ecoWithCode=games.filter(g=>g.eco!=='Sin ECO');
 const missing=[];
 if(!fide)missing.push('Confirmar FIDE ID e identidad');
 if(!current)missing.push('Consultar Elo FIDE con fecha');
 if(!tournaments.length)missing.push('Vincular torneos públicos verificables');
 if(!games.length)missing.push('Importar partidas PGN completas');
 else {
  if(!white.length)missing.push('Recopilar partidas con blancas');
  if(!black.length)missing.push('Recopilar partidas con negras');
  if(ecoWithCode.length<games.length)missing.push('Completar ECO faltantes desde evidencia');
 }
 if(games.length>0&&knownYears.length<2)missing.push('Ampliar muestra de otros años');
 return {
  identity:{fideId:fide||null,university:candidate?.university||null},
  rating:{monthly:current||null,month:current?'2026-11':null,historic:candidate?.ratings||{}},
  evidence:{tournaments:tournaments.length,sources:sources.length,individualSheets:sheets.length,storedPgn:games.length,white:white.length,black:black.length,ecoKnown:ecoWithCode.length,years:knownYears},
  missing
 };
}
export function summarizeDossiers(players,recordsById={}){
 const result={players:players.length,withFide:0,withMonthlyRating:0,withTournament:0,withStoredPgn:0,whiteCovered:0,blackCovered:0};
 for(const player of players){
  const c=dossierCoverage(player,recordsById[player.id]||[]);
  if(c.identity.fideId)result.withFide++;
  if(c.rating.monthly)result.withMonthlyRating++;
  if(c.evidence.tournaments)result.withTournament++;
  if(c.evidence.storedPgn)result.withStoredPgn++;
  if(c.evidence.white)result.whiteCovered++;
  if(c.evidence.black)result.blackCovered++;
 }
 return result;
}
