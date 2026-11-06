// Immutable per-game result decisions for resilient tournament review batches.
// A timeout/error should mark a failure, never a completed analysis.
export const BATCH_PRESETS=Object.freeze({
 fast:{label:'Rápido',depth:12,moveTimeMs:1000,timeoutMs:12000},
 balanced:{label:'Equilibrado',depth:14,moveTimeMs:2200,timeoutMs:16000},
 deep:{label:'Profundo',depth:16,moveTimeMs:4500,timeoutMs:25000}
});
export function batchOptions(value){
 const selected=Object.prototype.hasOwnProperty.call(BATCH_PRESETS,value)?value:'balanced';
 return {...BATCH_PRESETS[selected],preset:selected};
}
export function validCompleteReport(game,review){
 const expected=game?.moves?.length||0;
 if(!expected)return false;
 const reports=review?.reports;
 return Array.isArray(reports)&&reports.length>=expected&&
  Array.from({length:expected},(_,i)=>reports[i]).every(r=>Number.isFinite(r?.loss)&&r.loss>=0);
}
export function batchResults(records){
 const outcomes=records||[];
 return {completed:outcomes.filter(x=>x.ok).length,failed:outcomes.filter(x=>!x.ok).length,
  failures:outcomes.filter(x=>!x.ok).map(x=>({index:x.index,name:x.name,error:x.error||'Análisis incompleto'}))};
}
