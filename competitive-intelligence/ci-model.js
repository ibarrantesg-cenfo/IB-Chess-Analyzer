/**
 * Competitive Intelligence domain model.
 * Pure, testable and intentionally independent from the existing chess workspace.
 * No player-specific information ships in this module.
 */
export const CI_CODES=Object.freeze({
 RID:'Identificador de rival',FID:'Identificador FIDE',GID:'Identificador de partida',
 SRC:'Fuente',TC:'Control de tiempo',COL:'Color',OPN:'Apertura',ECO:'Código ECO',
 OBS:'Observación',EVD:'Evidencia',CF:'Confianza',IPR:'Índice de previsibilidad de repertorio',
 IFE:'Índice de familiaridad estructural',IRD:'Índice de resistencia defensiva',
 VEP:'Valor esperado de preparación',REV:'Revisión',RLS:'Seguridad por filas'
});
export const CI_PRIORITIES=Object.freeze(['A','B','C']);
export const CI_CONFIDENCE=Object.freeze(['pending','low','medium','high']);
const squash=value=>String(value??'').trim().replace(/\s+/g,' ');
function bounded(value,label,max){const text=squash(value);if(text.length>max)throw Error(label+' supera '+max+' caracteres');return text;}
export function validatePlayer(data={}){
 const name=bounded(data.display_name,'Nombre',160);
 if(name.length<2)throw Error('Nombre de rival requerido');
 const fide=bounded(data.fide_id,'FID',30);
 if(fide&&!/^\d{4,12}$/.test(fide))throw Error('FID debe ser numérico');
 const priority=data.priority??'C';
 if(!CI_PRIORITIES.includes(priority))throw Error('Prioridad inválida');
 const aliases=Array.isArray(data.aliases)?data.aliases:[];
 if(aliases.length>30)throw Error('Demasiados alias');
 return {display_name:name,fide_id:fide||null,priority,aliases:[...new Set(aliases.map(a=>bounded(a,'Alias',160)).filter(Boolean))],notes:bounded(data.notes,'Notas',10000)};
}
export function validateObservation(data={}){
 const code=bounded(data.code,'Código',24).toUpperCase();
 if(!/^[A-Z][A-Z0-9_]{1,23}$/.test(code))throw Error('Código de observación inválido');
 const claim=bounded(data.claim,'Observación',5000);
 if(!claim)throw Error('Falta la observación');
 const confidence=data.confidence??'pending';
 if(!CI_CONFIDENCE.includes(confidence))throw Error('Confianza inválida');
 const sample_n=Number(data.sample_n??0);
 if(!Number.isSafeInteger(sample_n)||sample_n<0)throw Error('Muestra inválida');
 const evidence=Array.isArray(data.evidence)?data.evidence:[];
 if(evidence.length>100)throw Error('Demasiadas evidencias');
 if(evidence.some(e=>!e||typeof e!=='object'||Array.isArray(e)))throw Error('Evidencia inválida');
 return {code,claim,confidence,sample_n,evidence};
}
export function normalizePgn(text){
 const raw=String(text??'').trim().replace(/\r\n?/g,'\n');
 if(raw.length>300000)throw Error('PGN demasiado grande');
 if(!raw)throw Error('PGN vacío');
 return raw;
}
export function validateSourceUrl(raw){
 const value=bounded(raw,'Fuente',2048);
 if(!value)return null;
 let url;try{url=new URL(value);}catch{throw Error('URL de fuente inválida');}
 if(!['https:','http:'].includes(url.protocol))throw Error('Solo URLs HTTP(S)');
 return url.toString();
}
export function filterPlayers(players,query='',priority='all'){
 const q=squash(query).toLocaleLowerCase('es');
 return players.filter(p=>(priority==='all'||p.priority===priority)&&(!q||[p.display_name,p.fide_id,...(p.aliases||[])].some(s=>String(s||'').toLocaleLowerCase('es').includes(q))));
}
