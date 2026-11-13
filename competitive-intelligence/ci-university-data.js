/**
 * Fuentes oficiales y públicas. Datos de participación histórica (octubre 2026),
 * NO ratings actuales, repertorios ni evaluaciones personales.
 * Sin el propio administrador en la lista de rivales.
 */
export const CI_SOURCES=Object.freeze({
 standard:{label:'JUNCOS 2026 · Standard · ranking inicial · 17 oct 2026',url:'https://s1.chess-results.com/tnr1516373.aspx?SNode=S0&lan=2'},
 blitz:{label:'JUNCOS 2026 · Blitz · ranking inicial · 17 oct 2026',url:'https://s3.chess-results.com/Test/tnr1516388.aspx?lan=1'},
 fedeu:{label:'FedeU · Torneo universitario CENFOTEC · 25 may 2026',url:'https://fedeu.net/ucr-domina-el-torneo-universitario-de-ajedrez-fedeu-cenfotec-2026/'}
});
const entry=(name,fide,university,priority,ratings={},more={})=>Object.freeze({
 display_name:name,fide_id:fide||null,university,priority,ratings:Object.freeze(ratings),
 sourceKeys:Object.freeze([...new Set([...Object.keys(ratings),...(more.standardSource?['standard']:[]),...(more.fedeu?['fedeu']:[])])]),
 achievement:more.fedeu||'',aliases:Object.freeze(more.aliases||[])
});
/** Elo I mostrado en las listas iniciales, NO ratings del mes actual. */
export const UNIVERSITY_RIVALS=Object.freeze([
 entry('David Alejandro Cabezas Solano','6507522','UCR','A',{standard:2249,blitz:2247},{fedeu:'Campeón absoluto FedeU–CENFOTEC, mayo 2026'}),
 entry('Gerardo Alfonso Ramírez Madrid','6505945','UCR','A',{blitz:1934}),
 entry('Dany José Montero Romero','6522181','UNA','A',{blitz:1973}),
 entry('Juan Diego Coto Calderón','6506941','UCR','A',{standard:1856,blitz:1776}),
 entry('Martín Eduardo Barboza Víquez','6508200','UCR','A',{blitz:1878}),
 entry('Sebasthian Agüero Espinoza','6550096','UNA','A',{blitz:1924}),
 entry('Luis Javier Cartín Aguilar','6516858','UCR','B',{blitz:1893}),
 entry('José Daniel Rodríguez Jiménez','6512682','TEC','B',{blitz:1848}),
 entry('Caleb Vargas Argüedas','6524869','UCR','B',{blitz:1829}),
 entry('José Antonio Meza Vega','6513697','TEC','B',{blitz:1818}),
 entry('Esteban Quesada Fallas','6513743','UCR','B',{blitz:1789},{fedeu:'Subcampeón absoluto FedeU–CENFOTEC, mayo 2026'}),
 entry('Sebastián Castillo Chavarría','6519890','UNA','B',{blitz:1787}),
 entry('Sebastián Noel Mora Chavarría','6521541','UNED','B',{standard:1737,blitz:1749}),
 entry('Carlos Mario Castillo Mena','6520901','TEC','B',{standard:1665,blitz:1705}),
 entry('Santiago Rodríguez González','6550959','UNA','B',{blitz:1703}),
 entry('David López Bustos','6508014','UNA','B',{blitz:1673}),
 entry('Gabriel Campos González','6557856','TEC','C',{blitz:1661}),
 entry('Axel Andrey Chaves Olazo','6518095','CENFOTEC','C',{standard:1630,blitz:1606}),
 entry('Ethan Alonso Villalobos Núñez','6563147','UNED','C',{standard:1640,blitz:1591}),
 entry('Aarón Vargas Solano','6514219','LEAD University','C',{standard:1609,blitz:1588}),
 entry('Christian Gabriel Rojas Ordóñez','6560377','UNA','C',{standard:1571,blitz:1560}),
 entry('Anthony León Cubero','6511430','UTN','C',{standard:1547}),
 entry('Pablo Andrés Mora Arias','6529151','UACA','C',{standard:1465}),
 entry('Miguel Andrés Rojas Anchía','6550550','UTN','C',{}, {standardSource:true}),
 entry('Allan Castillo Hernández','6583822','LEAD University','C',{}, {standardSource:true}),
 entry('Mateo Espitia Torres',null,'TEC','A',{}, {fedeu:'Tercer lugar absoluto FedeU–CENFOTEC, mayo 2026'})
]);

export const normalizeCIName=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
export function findUniversityCandidate(player){
 const fide=String(player?.fide_id||'').trim();
 return UNIVERSITY_RIVALS.find(x=>fide&&x.fide_id===fide)||
 UNIVERSITY_RIVALS.find(x=>{
  const names=[x.display_name,...x.aliases].map(normalizeCIName);
  return names.includes(normalizeCIName(player?.display_name));
 })||null;
}
export function matchExistingCandidate(candidate,players){
 return players.find(player=>String(candidate.fide_id||'')&&String(player.fide_id||'')===candidate.fide_id)||
 players.find(player=>normalizeCIName(player.display_name)===normalizeCIName(candidate.display_name))||null;
}
const START='[CI:JUNCOS-FEDEU-2026]';
export function candidateNotes(candidate){
 const lines=[START,'Registro público de participación universitaria · NO supone inscripción futura.',
 'Universidad registrada: '+candidate.university,
 ...Object.entries(candidate.ratings).map(([mode,rating])=>'Elo FIDE '+(mode==='standard'?'clásico':'blitz')+' en ranking inicial JUNCOS 2026: '+rating),
 ...(candidate.achievement?['Resultado verificado: '+candidate.achievement]:[]),
 ...candidate.sourceKeys.map(key=>'Fuente pública: '+CI_SOURCES[key].label+' — '+CI_SOURCES[key].url),
 'Pendiente: partidas PGN, repertorio estadístico, estructura de juego y análisis individual.'];
 return lines.join('\n');
}
export function candidatePayload(candidate,existing=null){
 const oldNotes=String(existing?.notes||'');
 return {
  display_name:existing?.display_name||candidate.display_name,
  fide_id:existing?.fide_id||candidate.fide_id||null,
  priority:existing?.priority||candidate.priority,
  aliases:existing?.aliases||[],
  notes:oldNotes.includes(START)?oldNotes:[oldNotes.trim(),candidateNotes(candidate)].filter(Boolean).join('\n\n')
 };
}
export function reconcileCandidates(players,candidates=UNIVERSITY_RIVALS){
 const adds=[],updates=[],unchanged=[];
 for(const candidate of candidates){
  const existing=matchExistingCandidate(candidate,players);
  if(!existing)adds.push({candidate,payload:candidatePayload(candidate)});
  else{
   const payload=candidatePayload(candidate,existing);
   if(payload.fide_id!==existing.fide_id||payload.notes!==existing.notes)updates.push({candidate,existing,payload});
   else unchanged.push({candidate,existing});
  }
 }
 return {adds,updates,unchanged};
}
