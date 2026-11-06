// Offline persistent Stockfish review cache. No private games leave the browser.
const DB='ib-chess-review-cache-v1';
function open(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('reviews',{keyPath:'key'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function transact(mode,operation){return open().then(db=>new Promise((resolve,reject)=>{const tx=db.transaction('reviews',mode),req=operation(tx.objectStore('reviews'));req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();tx.onerror=()=>reject(tx.error);}));}
export async function gameKey(game,depth=18,engine='stockfish19'){const data=new TextEncoder().encode(JSON.stringify({fen:game.headers?.FEN||'',moves:game.moves.map(x=>x.san),depth,engine}));const digest=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function loadReview(game,depth=18,engine='stockfish19'){const key=await gameKey(game,depth,engine);return (await transact('readonly',s=>s.get(key)))||null;}
export async function saveReview(game,result,depth=18,engine='stockfish19'){if(!game?.moves?.length||result?.reports?.length!==game.moves.length)return false;const key=await gameKey(game,depth,engine);await transact('readwrite',s=>s.put({key,depth,engine,created:new Date().toISOString(),evaluations:result.evaluations,reports:result.reports}));return true;}
export async function findReview(game){for(const depth of [28,27,26,25,24,23,22,21,20,19,18,17,16]){const found=await loadReview(game,depth);if(found)return found;}return null;}

// Incomplete games live under a separate key and never count as analyzed.
export async function saveReviewProgress(game,result,depth=18,engine='stockfish19'){
 if(!game?.moves?.length||!Array.isArray(result?.evaluations)||!Array.isArray(result?.reports))return false;
 const key='progress:'+(await gameKey(game,depth,engine));
 await transact('readwrite',store=>store.put({key,depth,engine,updated:new Date().toISOString(),
  evaluations:result.evaluations,reports:result.reports}));
 return true;
}
export async function loadReviewProgress(game,depth=18,engine='stockfish19'){
 const key='progress:'+(await gameKey(game,depth,engine));
 return (await transact('readonly',store=>store.get(key)))||null;
}
export async function clearReviewProgress(game,depth=18,engine='stockfish19'){
 const key='progress:'+(await gameKey(game,depth,engine));
 await transact('readwrite',store=>store.delete(key));return true;
}
