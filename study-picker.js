// Local collections keep their IDs even when two studies share a title.
export function groupLocalStudies(items) {
 const groups=new Map();
 for(const item of items){
  const key=item.collectionId?'collection:'+item.collectionId:'game:'+item.id;
  if(!groups.has(key))groups.set(key,{key,title:item.collectionName||item.name||'Estudio sin nombre',games:[]});
  groups.get(key).games.push(item);
 }
 return [...groups.values()];
}

export function appendStudyGroup(root,{title,count,load,onSelect,open=false}) {
 const group=document.createElement('details');
 const heading=document.createElement('summary');
 heading.textContent=title+(count===undefined?'':' · '+count+(count===1?' partida':' partidas'));
 const games=document.createElement('div');
 games.className='study-picker-games';
 group.append(heading,games);
 let loaded=false,loading=false;
 group.addEventListener('toggle',async()=>{
  if(!group.open||loaded||loading)return;
  loading=true;
  games.textContent='Cargando partidas…';
  try{
   const list=await load();
   games.replaceChildren();
   for(const [index,game] of list.entries()){
    const button=document.createElement('button');
    button.type='button';
    button.textContent=(index+1)+'. '+game.title;
    button.onclick=()=>onSelect(game);
    games.append(button);
   }
   if(!list.length)games.textContent='Este estudio no tiene partidas.';
   loaded=true;
  }catch(error){games.textContent='No se pudieron cargar las partidas. '+error.message;}
  finally{loading=false;}
 });
 root.append(group);
 group.open=open;
 return group;
}
