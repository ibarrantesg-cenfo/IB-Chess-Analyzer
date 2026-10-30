import { Chess } from 'chess.js';
import { accountDetails, myEnrollments, academicCohortGames } from './cloud.js';
import { gameMetrics } from './performance.js';
import { apparentPerformance } from './engine-performance.js';

const el=(tag,cls='',text='')=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text)x.textContent=text;return x;};
const fmt=(x,d=1)=>Number.isFinite(x)?x.toFixed(d):'—';
const avg=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const dateValue=g=>{const raw=g.played_at||g.created_at;const n=Date.parse(raw||'');return Number.isFinite(n)?n:0;};
const dayDate=ms=>ms?new Date(ms).toLocaleDateString('es-CR'):'—';
const safeFile=s=>String(s||'estadisticas').replace(/[^\w-]+/g,'_');
const csvCell=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
const percent=n=>Number.isFinite(n)?n.toFixed(1)+'%':'—';
function parseDateWindow(days){return days==='all'?null:Date.now()-Number(days)*86400000;}
function parseGame(record){
 const side=record.student_side==='b'?'b':'w';
 let headings={},technical=null,openings='—';
 try{
  const chess=new Chess();chess.loadPgn(record.pgn,{strict:false});headings=chess.header();
  const moves=chess.history({verbose:true});
  openings=moves.slice(0,8).map(m=>m.san).join(' ');
  const reports=record.review?.reports;
  if(Array.isArray(reports)&&reports.length){
   const metrics=gameMetrics({moves},reports)[side];
   if(metrics.complete)technical={quality:metrics.quality,acpl:metrics.avg,counts:metrics.counts,moves:metrics.count};
  }
 }catch(err){console.warn('PGN no disponible para estadísticas',record.id,err.message);}
 const opponentElo=Number(side==='w'?headings.BlackElo:headings.WhiteElo);
 const result=record.result||headings.Result||'*';
 const score=result==='1/2-1/2'?.5:result===(side==='w'?'1-0':'0-1')?1:result===(side==='w'?'0-1':'1-0')?0:null;
 return {...record,side,technical,score,opponentElo:Number.isFinite(opponentElo)&&opponentElo>0?opponentElo:null,opening:openings,dateMs:dateValue(record)};
}
function qualityPerformance(games){
 const valid=games.filter(g=>g.technical&&Number.isFinite(g.technical.quality)&&g.technical.moves>=8);
 const moves=valid.reduce((sum,g)=>sum+g.technical.moves,0);
 if(!moves)return {value:null,games:0,moves:0};
 const quality=valid.reduce((sum,g)=>sum+g.technical.quality*g.technical.moves,0)/moves;
 return {value:apparentPerformance({complete:true,quality,count:moves}).value,games:valid.length,moves};
}
function competitivePerformance(games){
 const rated=games.filter(x=>x.opponentElo!==null&&x.score!==null);
 const score=rated.reduce((s,x)=>s+x.score,0),n=rated.length;
 if(!n||score<=0||score>=n)return {value:null,rated:n,reason:n?'Resultados extremos: sin valor finito':'Faltan Elo y resultados'};
 // Solve for the rating whose expected points equal the achieved points (logistic TPR).
 let lo=-1000,hi=4500;
 for(let i=0;i<85;i++){
  const mid=(lo+hi)/2;
  const expected=rated.reduce((sum,g)=>sum+1/(1+Math.pow(10,(g.opponentElo-mid)/400)),0);
  if(expected<score)lo=mid;else hi=mid;
 }
 return {value:Math.round((lo+hi)/2),rated:n,reason:''};
}
function groupEvents(games){
 const map=new Map();
 for(const g of games){const key=g.student_id+'\u0000'+(g.event_name||'Sin torneo');
  if(!map.has(key))map.set(key,{student_id:g.student_id,event:g.event_name||'Sin torneo',games:[]});
  map.get(key).games.push(g);
 }
 return [...map.values()].map(row=>{
  const technical=row.games.filter(g=>g.technical),count=row.games.length,scored=row.games.filter(g=>g.score!==null);
  const wins=scored.filter(g=>g.score===1).length,draws=scored.filter(g=>g.score===.5).length,losses=scored.filter(g=>g.score===0).length;
  const tpr=qualityPerformance(row.games);
  return {...row,count,technicalCount:technical.length,accuracy:avg(technical.map(g=>g.technical.quality)),acpl:avg(technical.map(g=>g.technical.acpl)),
   wins,draws,losses,points:scored.reduce((s,g)=>s+g.score,0),scored:scored.length,tpr,latest:Math.max(...row.games.map(g=>g.dateMs))};
 }).sort((a,b)=>b.latest-a.latest);
}
function kpi(label,value,foot=''){const card=el('div','academy-analytics-kpi');card.append(el('small','',label),el('strong','',value));if(foot)card.append(el('span','',foot));return card;}
function downloadCsv(rows,filename){
 const body=rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
 const blob=new Blob(['\uFEFF'+body],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function trendChart(root,events,metric){
 root.replaceChildren();
 const data=[...events].sort((a,b)=>a.latest-b.latest).filter(x=>Number.isFinite(x[metric])).slice(-20);
 if(!data.length){root.append(el('p','academy-analytics-empty','No hay análisis completos suficientes para esta gráfica.'));return;}
 if(data.length===1){root.append(el('p','academy-analytics-empty','Solo hay un torneo con datos. El gráfico se completará con nuevos eventos.'));return;}
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 680 170');svg.setAttribute('role','img');svg.setAttribute('aria-label','Evolución '+metric+' por torneo');
 const nums=data.map(x=>x[metric]),low=Math.min(...nums),high=Math.max(...nums),min=metric==='accuracy'?Math.max(0,Math.floor(low-5)):Math.max(0,Math.floor(low-(high-low||15)*.2)),max=metric==='accuracy'?Math.min(100,Math.ceil(high+5)):Math.ceil(high+(high-low||15)*.2);
 const xx=i=>34+i*620/(data.length-1),yy=v=>139-(v-min)/(max-min||1)*111;
 for(let i=0;i<4;i++){
  const y=25+i*38,line=document.createElementNS(svg.namespaceURI,'line');line.setAttribute('x1','30');line.setAttribute('x2','660');line.setAttribute('y1',String(y));line.setAttribute('y2',String(y));line.setAttribute('stroke','currentColor');line.setAttribute('opacity','.13');svg.append(line);
 }
 const poly=document.createElementNS(svg.namespaceURI,'polyline');poly.setAttribute('fill','none');poly.setAttribute('stroke','#73dfbb');poly.setAttribute('stroke-width','3');poly.setAttribute('stroke-linecap','round');poly.setAttribute('stroke-linejoin','round');poly.setAttribute('points',data.map((x,i)=>xx(i)+','+yy(x[metric])).join(' '));svg.append(poly);
 data.forEach((x,i)=>{const dot=document.createElementNS(svg.namespaceURI,'circle');dot.setAttribute('cx',xx(i));dot.setAttribute('cy',yy(x[metric]));dot.setAttribute('r','4');dot.setAttribute('fill','#8af1ca');const hint=document.createElementNS(svg.namespaceURI,'title');hint.textContent=x.event+': '+fmt(x[metric]);dot.append(hint);svg.append(dot);});
 root.append(svg);
 const caption=el('small','',data.length+' torneos con datos · ordenados por la fecha de la última partida');root.append(caption);
}
export function initAcademyAnalytics({notify}){
 const page=document.querySelector('main.main'),layout=page.querySelector('.layout'),toolbar=page.querySelector('.toolbar'),tools=page.querySelector('.workspace-tools');
 const screen=el('section','academy-analytics-screen');screen.hidden=true;page.insertBefore(screen,page.querySelector('footer'));
 const nav=document.querySelector('#nav-academy-analytics');let visible=false,students=[],records=[],truncated=false;
 let filters={student:'all',days:'30',search:'',metric:'accuracy',status:'all'};
 const head=el('header','academy-analytics-head');head.append(el('div','',''));
 head.firstChild.append(el('div','eyebrow','IB CHESS ACADEMY · INTELIGENCIA DEPORTIVA'),el('h2','','Estadísticas de Academia'),el('p','','Rendimiento acumulado por estudiante, torneos y evolución temporal.'));
 const refresh=el('button','btn outline','↻ Actualizar métricas');head.append(refresh);
 const filterbar=el('div','academy-analytics-filters');
 const input=el('input');input.type='search';input.placeholder='Buscar alumno, torneo, rival…';input.setAttribute('aria-label','Buscar en estadísticas');
 const period=el('select');for(const [value,name] of [['7','Últimos 7 días'],['30','Últimos 30 días'],['90','Últimos 90 días'],['180','Últimos 6 meses'],['365','Último año'],['all','Todo el historial']]){const o=el('option','',name);o.value=value;period.append(o);}period.value=filters.days;
 const select=el('select');select.setAttribute('aria-label','Filtrar alumno');
 const metric=el('select');for(const [value,label] of [['accuracy','Precisión técnica'],['acpl','ACPL'],['tprValue','Performance técnico estimado']]){const o=el('option','',label);o.value=value;metric.append(o);}
 filterbar.append(input,period,select,metric);
 const notice=el('p','academy-analytics-notice');
 const cards=el('div','academy-analytics-cards'),chartArea=el('section','academy-analytics-chart'),studentsArea=el('section','academy-analytics-people'),eventsArea=el('section','academy-analytics-events');
 const actions=el('div','academy-analytics-actions'),exportButton=el('button','btn outline','↓ Exportar CSV');actions.append(exportButton);
 screen.append(head,filterbar,notice,cards,chartArea,studentsArea,eventsArea,actions);
 async function show(){
  const account=await accountDetails();if(!account?.isTeacher){notify('Las estadísticas de Academia solo están disponibles para profesores autorizados.','err');return;}
  visible=true;screen.hidden=false;layout.hidden=true;toolbar.hidden=true;tools.hidden=true;nav?.classList.add('active');
  document.querySelector('.topbar h1').textContent='Estadísticas de Academia';
  document.querySelector('.topbar p').textContent='Compará alumnos, torneos y tendencias a partir de sus partidas analizadas.';
  window.scrollTo(0,0);await load();
 }
 function close(){visible=false;screen.hidden=true;nav?.classList.remove('active');}
 async function load(){
  if(!visible)return;
  notice.textContent='Consultando partidas académicas…';
  try{
   const r=await myEnrollments();if(!r.teacher)throw Error('Se requiere una cuenta de profesor.');
   students=r.items||[];
   const result=await academicCohortGames(students.map(s=>s.student_id));
   records=result.items.map(parseGame);truncated=result.truncated;
   select.replaceChildren();const all=el('option','','Todos los alumnos');all.value='all';select.append(all);
   students.forEach(st=>{const o=el('option','',st.name||'Alumno sin nombre');o.value=st.student_id;select.append(o);});
   if(students.some(s=>s.student_id===filters.student))select.value=filters.student;else {filters.student='all';select.value='all';}
   render();
  }catch(err){notice.textContent='No se pudieron consultar las estadísticas. Verificá que la migración académica esté aplicada en Supabase. '+err.message;cards.replaceChildren();studentsArea.replaceChildren();eventsArea.replaceChildren();chartArea.replaceChildren();}
 }
 const studentName=id=>students.find(x=>x.student_id===id)?.name||'Alumno sin nombre';
 function filtered(){
  const cutoff=parseDateWindow(filters.days),query=norm(filters.search);
  return records.filter(g=>(filters.student==='all'||g.student_id===filters.student)&&(!cutoff||g.dateMs>=cutoff)&&(!query||norm([studentName(g.student_id),g.event_name,g.white_name,g.black_name,g.title].join(' ')).includes(query)));
 }
 function render(){
  if(!visible)return;
  const rows=filtered(),events=groupEvents(rows),analyzed=rows.filter(g=>g.technical),rated=rows.filter(g=>g.score!==null&&g.opponentElo!==null);
  const precision=avg(analyzed.map(g=>g.technical.quality)),acpl=avg(analyzed.map(g=>g.technical.acpl));
  const tpr=filters.student!=='all'?qualityPerformance(rows):null;
  const tournamentPerformances=events.filter(e=>e.tpr.value!==null).map(e=>e.tpr.value),meanPerformance=avg(tournamentPerformances);
  notice.textContent=(filters.days==='all'?'Todo el historial':'Período: últimos '+filters.days+' días')+' · '+rows.length+' partidas · '+events.length+' torneos de '+new Set(rows.map(g=>g.student_id)).size+' alumnos'+(truncated?' · Límite de 1000 registros alcanzado; acotá los filtros para un informe completo.':'')+'.';
  cards.replaceChildren(
   kpi('Alumnos con partidas',String(new Set(rows.map(g=>g.student_id)).size),students.length+' vinculados'),
   kpi('Torneos',String(events.length),'Por estudiante y evento'),
   kpi('Partidas analizadas',analyzed.length+'/'+rows.length,'Solo análisis completos'),
   kpi('Precisión media',percent(precision),'Índice técnico propio'),
   kpi('ACPL medio',Number.isFinite(acpl)?fmt(acpl)+' cp':'—','Jugador, no ambos colores'),
   kpi(filters.student==='all'?'Media performance técnico':'Performance del alumno',filters.student==='all'?(meanPerformance!==null?String(Math.round(meanPerformance)):'—'):(tpr.value!==null?String(tpr.value):'—'),filters.student==='all'?tournamentPerformances.length+' torneos con TPR válido':tpr.games+' partidas analizadas')
  );
  chartArea.replaceChildren();
  const chHead=el('div','academy-analytics-section-title');chHead.append(el('h3','','Evolución por torneo'),el('small','','Filtrá un alumno para una tendencia individual más útil.'));chartArea.append(chHead);
  const chart=el('div','academy-analytics-plot');chartArea.append(chart);
  const plotted=events.map(e=>({...e,tprValue:e.tpr.value}));
  if(filters.metric==='tprValue')trendChart(chart,plotted,'tprValue');else trendChart(chart,plotted,filters.metric);
  studentsArea.replaceChildren(el('h3','','Rendimiento por alumno'));
  const visibleStudents=students.filter(st=>filters.student==='all'||st.student_id===filters.student).filter(st=>!filters.search||norm(st.name).includes(norm(filters.search))||rows.some(g=>g.student_id===st.student_id));
  if(!visibleStudents.length)studentsArea.append(el('p','academy-analytics-empty','No se encontraron alumnos con esos filtros.'));
  const personGrid=el('div','academy-analytics-students');
  for(const student of visibleStudents){
   const games=rows.filter(g=>g.student_id===student.student_id),stats=groupEvents(games),technical=games.filter(g=>g.technical),p=competitivePerformance(games);
   const card=el('article','academy-analytics-student');
   const heading=el('div','academy-analytics-student-head');heading.append(el('strong','',student.name||'Alumno sin nombre'),el('span','',student.state==='active'?'Activo':student.state));card.append(heading);
   const grid=el('div','academy-analytics-mini');for(const [label,value] of [['Torneos',String(stats.length)],['Partidas',String(games.length)],['Precisión',percent(avg(technical.map(g=>g.technical.quality)))],['Performance estimado',p.value!==null?String(p.value):'—']]){const tile=el('div');tile.append(el('small','',label),el('strong','',value));grid.append(tile);}card.append(grid);
   const open=el('button','btn outline','Ver sus torneos');open.onclick=()=>{select.value=student.student_id;filters.student=student.student_id;render();eventsArea.scrollIntoView({behavior:'smooth',block:'start'});};card.append(open);personGrid.append(card);
  }
  studentsArea.append(personGrid);
  eventsArea.replaceChildren(el('h3','','Torneos y partidas'));
  if(!events.length)eventsArea.append(el('p','academy-analytics-empty','No hay torneos para el período o los filtros seleccionados. Los análisis locales deben ser compartidos por el alumno para aparecer aquí.'));
  for(const event of events){
   const details=el('details','academy-analytics-event');
   const summary=el('summary');summary.append(el('strong','',event.event),el('span','',studentName(event.student_id)+' · '+event.count+' partidas · '+dayDate(event.latest)));details.append(summary);
   const summaryGrid=el('div','academy-analytics-event-kpis');
   for(const [label,value] of [['Precisión',percent(event.accuracy)],['ACPL',Number.isFinite(event.acpl)?fmt(event.acpl)+' cp':'—'],['Performance',event.tpr.value!==null?String(event.tpr.value):'—'],['Analizadas',event.technicalCount+'/'+event.count],['Resultados',event.wins+'G / '+event.draws+'T / '+event.losses+'P']]){summaryGrid.append(kpi(label,value));}
   details.append(summaryGrid);
   const list=el('div','academy-analytics-game-list');
   event.games.slice().sort((a,b)=>a.dateMs-b.dateMs).forEach(g=>{
    const row=el('div','academy-analytics-game');const name=el('div');name.append(el('strong','',g.title),el('small','',(g.white_name||'Blancas')+' – '+(g.black_name||'Negras')+' · '+g.result));
    const tech=el('span','',g.technical?percent(g.technical.quality)+' · '+fmt(g.technical.acpl)+' cp':'Pendiente de análisis');
    const button=el('button','btn outline','Abrir PGN');button.onclick=()=>window.IB_LOAD_ACADEMIC_GAME?.(g.pgn,g.title);
    row.append(name,tech,button);list.append(row);
   });
   details.append(list);eventsArea.append(details);
  }
  exportButton.onclick=()=>downloadCsv([['Alumno','Torneo','Fecha','Partidas','Analizadas','Precisión %','ACPL cp','Performance','Partidas analizadas','Victorias','Tablas','Derrotas'],...events.map(e=>[studentName(e.student_id),e.event,dayDate(e.latest),e.count,e.technicalCount,fmt(e.accuracy),fmt(e.acpl),e.tpr.value??'',e.tpr.games,e.wins,e.draws,e.losses])],safeFile('IB_Academia_'+filters.days+'_dias')+'.csv');
 }
 refresh.onclick=load;
 input.oninput=()=>{filters.search=input.value.trim();render();};
 period.onchange=()=>{filters.days=period.value;render();};
 select.onchange=()=>{filters.student=select.value;render();};
 metric.onchange=()=>{filters.metric=metric.value;render();};
 return {show,close,refresh:load};
}
