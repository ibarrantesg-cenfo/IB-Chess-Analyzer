// Engine-derived performance calibration using actual Stockfish-analyzed games.
// Estimates are conditional on the uploaded reference dataset, never FIDE ratings.
// A prediction is withheld if the reference sample is too small or narrow.
const finite=n=>Number.isFinite(n);
export function calibrationSamples(games, analyses){
 const samples=[];
 for(let i=0;i<games.length;i++){
   const g=games[i],reports=analyses.get(i);
   if(!reports || !g.moves?.length)continue;
   for(const [color,field,nameField] of [['w','WhiteElo','White'],['b','BlackElo','Black']]){
     const rating=Number(g.headers?.[field]),player=String(g.headers?.[nameField]||'').trim().toLowerCase();
     if(!finite(rating)||rating<800||rating>2900||!player)continue;
     const losses=[];
     for(let j=color==='w'?0:1;j<g.moves.length;j+=2){
       const loss=reports[j]?.loss;
       if(!finite(loss)||loss<0)break;
       losses.push(loss);
     }
     const expected=Math.ceil((g.moves.length-(color==='b'?1:0))/2);
     if(losses.length!==expected||losses.length<12)continue;
     const quality=100*losses.reduce((sum,n)=>sum+Math.exp(-Math.min(n,600)/150),0)/losses.length;
     samples.push({index:i,player,rating,quality,moves:losses.length});
   }
 }
 return samples;
}
export function enginePerformance(targetQuality, samples, {excludeIndex=-1,excludePlayer=''}={}){
 if(!finite(targetQuality))return {value:null,reason:'Analizá la partida completa para estimar el rendimiento.'};
 const pool=samples.filter(s=>s.index!==excludeIndex&&s.player!==excludePlayer);
 const unique=new Set(pool.map(s=>s.player)).size;
 const minRating=pool.length?Math.min(...pool.map(s=>s.rating)):null,maxRating=pool.length?Math.max(...pool.map(s=>s.rating)):null;
 if(pool.length<16||unique<6||maxRating-minRating<350){
   return {value:null,reason:'Calibración insuficiente: se requieren al menos 16 partidas-jugador, 6 jugadores distintos y un rango Elo de 350 puntos.',count:pool.length,players:unique};
 }
 const minQuality=Math.min(...pool.map(s=>s.quality)),maxQuality=Math.max(...pool.map(s=>s.quality));
 if(maxQuality-minQuality<7)return {value:null,reason:'La muestra no tiene suficiente variedad de calidad para ajustar un rendimiento.',count:pool.length,players:unique};
 if(targetQuality<minQuality-2||targetQuality>maxQuality+2)return {value:null,reason:'La calidad de esta partida está fuera del intervalo calibrado; no se extrapola Elo.',count:pool.length,players:unique};
 // Aggregate each player's evidence to prevent prolific players from dominating the model.
 const byPlayer=new Map();
 for(const s of pool){const group=byPlayer.get(s.player)||{rating:s.rating,quality:0,n:0};group.quality+=s.quality;group.n++;byPlayer.set(s.player,group);}
 const refs=[...byPlayer.entries()].map(([player,g])=>({player,rating:g.rating,quality:g.quality/g.n}));
 refs.sort((a,b)=>Math.abs(a.quality-targetQuality)-Math.abs(b.quality-targetQuality));
 const neighbors=refs.slice(0,Math.min(8,refs.length));
 // Kernel smoother with a minimum kernel bandwidth; uncertainty represents neighborhood dispersion.
 const weights=neighbors.map(s=>1/(1+Math.pow((s.quality-targetQuality)/6,2)));
 const sw=weights.reduce((a,b)=>a+b,0);
 const value=neighbors.reduce((a,s,i)=>a+s.rating*weights[i],0)/sw;
 const sd=Math.sqrt(neighbors.reduce((a,s,i)=>a+weights[i]*(s.rating-value)**2,0)/sw);
 return {value:Math.round(value/5)*5,spread:Math.max(100,Math.round(1.5*sd/25)*25),count:pool.length,players:unique,reason:'Estimación experimental calibrada con partidas analizadas y Elo de referencia; no equivale a un rendimiento oficial.'};
}
