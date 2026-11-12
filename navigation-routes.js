// Browser-native routes for opening a section or an individual study in a separate tab.
// Use links with a real href; buttons cannot be dragged onto a browser tab bar.
export const ROUTES=Object.freeze(['review','library','openings','reports','academic','academy','academy-analytics','competitive-intelligence','preferences']);
export function sectionHref(view,href,study='',analysis=false,family=''){
 if(!ROUTES.includes(view))throw new Error('Vista inexistente: '+view);
 const url=new URL(href);
 url.searchParams.delete('solicitar');
 url.searchParams.set('view',view);
 if(view!=='competitive-intelligence'){url.searchParams.delete('ci_player');url.searchParams.delete('ci_tab');}
 if(view==='openings'&&study)url.searchParams.set('study',study);
 else url.searchParams.delete('study');
 if(view==='openings'&&family)url.searchParams.set('family',family);
 else url.searchParams.delete('family');
 if(view==='openings'&&(study||family)&&analysis)url.searchParams.set('analysis','1');
 else url.searchParams.delete('analysis');
 // Keep OAuth/recovery hashes only if explicitly navigating there, never on a new tab to a section.
 url.hash='';
 return url.pathname+url.search;
}
export function sectionFromSearch(search){
 const params=new URLSearchParams(search);
 const view=params.get('view');
 return {
  view:ROUTES.includes(view)?view:'review',
  study:params.get('study')||'',
  analysis:view==='openings'&&params.get('analysis')==='1',
  family:view==='openings'?params.get('family')||'':''
 };
}
export function normalLinkClick(event){
 return event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey;
}
