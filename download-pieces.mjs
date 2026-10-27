// Copies permitted open-license chess SVG assets during build so the website works
// without runtime image CDNs. Source: lichess-org/lila, see PIECE_CREDITS.md.
import { mkdir, writeFile } from 'node:fs/promises';
const sets=['chessnut','fantasy','spatial','celtic','rhosgfx'];
const pieces=['wK','wQ','wR','wB','wN','wP','bK','bQ','bR','bB','bN','bP'];
const base='https://raw.githubusercontent.com/lichess-org/lila/master/public/piece';
await mkdir('public/pieces',{recursive:true});
async function download(set,piece){
 const dir='public/pieces/'+set;await mkdir(dir,{recursive:true});
 const url=base+'/'+set+'/'+piece+'.svg';
 let error;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await fetch(url,{signal:AbortSignal.timeout(16000)});
   if(!response.ok)throw Error('HTTP '+response.status+' '+url);
   const svg=await response.text();
   if(!svg.includes('<svg'))throw Error('Response was not SVG: '+url);
   await writeFile(dir+'/'+piece+'.svg',svg);return;
  }catch(e){error=e;if(attempt<2)await new Promise(resolve=>setTimeout(resolve,600*(attempt+1)));}
 }
 throw Error('Could not bundle '+set+'/'+piece+': '+error.message);
}
const queue=sets.flatMap(set=>pieces.map(piece=>({set,piece})));
for(let i=0;i<queue.length;i+=6){
 await Promise.all(queue.slice(i,i+6).map(({set,piece})=>download(set,piece)));
}
console.log('Bundled '+queue.length+' chess SVG pieces across '+sets.length+' themes.');
