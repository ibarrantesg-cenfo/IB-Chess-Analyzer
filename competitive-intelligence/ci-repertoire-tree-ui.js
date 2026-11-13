import {buildCIRepertoireTree,ciTreeNodeAt,ciTreeChoices,ciTreeMoveLabel} from './ci-repertoire-tree.js';
import {initCIPositionBoard} from './ci-position-board.js';

/** Inline, read-only preparation tree. All actions are locally reversible. */
export function initCIRepertoireTree({host}){
 host.innerHTML=`<section class="ci-r-section ci-tree-section"><div class="ci-tree-head"><div><h4>Árbol de repertorio</h4><p class="ci-subtle">Frecuencia real de continuaciones en PGN completos. El porcentaje corresponde a las partidas que llegaron a la posición actual, no a todas las partidas del rival.</p></div></div>
 <div class="ci-tree-controls"><label>Juega con <select id="ci-tree-color"><option value="w">Blancas</option><option value="b">Negras</option></select></label>
 <button type="button" class="btn outline" id="ci-tree-back" disabled>← Retroceder</button>
 <button type="button" class="btn outline" id="ci-tree-reset" disabled>Inicio</button></div>
 <div class="ci-tree-layout">
 <div id="ci-tree-board" class="ci-tree-board-panel"></div>
 <div class="ci-tree-moves"><p class="ci-tree-path" id="ci-tree-path" aria-live="polite">Posición inicial</p>
 <p class="ci-r-summary" id="ci-tree-sample"></p><div id="ci-tree-lines" class="ci-tree-lines"></div></div>
 </div>
 <p class="ci-subtle">Las jugadas siguen el orden real del PGN, incluidas las del oponente. Sin evaluación de motor; los resultados pertenecen a las partidas que siguieron cada rama.</p>
 </section>`;
 const el=id=>host.querySelector('#'+id);
 const board=initCIPositionBoard({host:el('ci-tree-board')});
 let records=[],filters={},path=[],state=buildCIRepertoireTree([],{color:'w'});
 const add=(parent,tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;parent.append(e);return e;};
 function render(){
  const node=ciTreeNodeAt(state.tree,path)||state.tree;
  const choices=ciTreeChoices(node),container=el('ci-tree-lines');
  container.replaceChildren();
  el('ci-tree-back').disabled=!path.length;el('ci-tree-reset').disabled=!path.length;
  board.setLine(path);
  el('ci-tree-path').textContent=path.length?path.map((m,i)=>ciTreeMoveLabel(m,i+1)).join('  '):'Posición inicial';
  el('ci-tree-sample').textContent=state.sample+' PGN de muestra · '+node.total+' alcanzan esta posición'+(node.unknown?' · '+node.unknown+' sin resultado':'');
  if(!choices.length){
   add(container,'p',state.sample?'No hay más continuaciones en la muestra para esta ruta.':'Todavía no hay PGN para este color y los filtros seleccionados.','ci-subtle');
   return;
  }
  for(const choice of choices){
   const btn=document.createElement('button');btn.type='button';btn.className='ci-tree-choice';
   const summary=add(btn,'span','', 'ci-tree-choice-heading');
   add(summary,'strong',ciTreeMoveLabel(choice.move,choice.ply));
   add(summary,'span',choice.count+' partidas · '+(choice.share*100).toFixed(1)+' %');
   const bar=add(btn,'span','', 'ci-tree-choice-bar');
   const fill=add(bar,'i','');fill.style.width=(100*choice.share).toFixed(2)+'%';
   add(btn,'small',choice.wins+' V · '+choice.draws+' T · '+choice.losses+' D'+(choice.unknown?' · '+choice.unknown+' sin resultado':''));
   btn.onclick=()=>{path.push(choice.move);render();};
   container.append(btn);
  }
 }
 function rebuild(resetPath=true){
  if(resetPath)path=[];
  state=buildCIRepertoireTree(records,{color:el('ci-tree-color').value,filters});
  render();
 }
 el('ci-tree-color').onchange=()=>{board.setOrientation(el('ci-tree-color').value);rebuild();};
 el('ci-tree-back').onclick=()=>{if(path.length){path.pop();render();}};
 el('ci-tree-reset').onclick=()=>{path=[];render();};
 return {update(nextRecords=[],nextFilters={},resetPath=true){
  records=nextRecords;filters={...nextFilters};rebuild(resetPath);
 },clear(){records=[];filters={};path=[];rebuild();}};
}
