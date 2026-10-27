// User-controlled compact workspace. All blocks remain in normal document flow.
export function initWorkspace(){
 const main=document.querySelector('.main'), right=document.querySelector('.analysis-column');
 const toolbar=document.createElement('div');toolbar.className='workspace-tools';
 toolbar.innerHTML='<label>Vista <select id="workspace-view"><option value="compact">Compacta</option><option value="comfortable">Cómoda</option></select></label><label>Prioridad <select id="workspace-priority"><option value="auto">Automática</option><option value="review">Conclusiones primero</option><option value="variations">Variantes primero</option></select></label><button class="btn outline" id="workspace-swap">⇅ Invertir paneles</button><button class="btn outline" id="workspace-restore">Restaurar</button>';
 main.querySelector('.toolbar').after(toolbar);
 const $=id=>document.getElementById(id),storage='ib-analyzer-workspace-v1';
 let prefs={view:'compact',priority:'auto',inverted:false}, inVariation=false;
 try{prefs={...prefs,...JSON.parse(localStorage.getItem(storage)||'{}')};}catch{}
 const apply=()=>{
  const mode=prefs.priority==='auto'?(inVariation?'variations':'review'):prefs.priority;
  const top=(mode==='variations')!==prefs.inverted?'variations':'review';
  main.classList.toggle('workspace-compact',prefs.view==='compact');
  right.classList.toggle('variations-first',top==='variations');
  right.classList.toggle('review-first',top==='review');
  $('workspace-view').value=prefs.view;
  $('workspace-priority').value=prefs.priority;
  localStorage.setItem(storage,JSON.stringify(prefs));
 };
 $('workspace-view').onchange=e=>{prefs.view=e.target.value;apply();};
 $('workspace-priority').onchange=e=>{prefs.priority=e.target.value;prefs.inverted=false;apply();};
 $('workspace-swap').onclick=()=>{prefs.inverted=!prefs.inverted;apply();};
 $('workspace-restore').onclick=()=>{prefs={view:'compact',priority:'auto',inverted:false};apply();};
 apply();
 return {variationChanged(v){inVariation=Boolean(v);apply();},refresh:apply};
}
