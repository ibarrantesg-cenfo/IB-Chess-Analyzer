// Personalized display settings. No external images, scripts or network requests.
const schemes={
  jade:{name:'Jade original',light:'#c2d1cb',dark:'#678c86'},
  wood:{name:'Madera clásica',light:'#f0d9b5',dark:'#b58863'},
  blue:{name:'Azul profesional',light:'#dee7ee',dark:'#7796b8'},
  grey:{name:'Gris elegante',light:'#e2e5e9',dark:'#87939f'},
  purple:{name:'Violeta suave',light:'#e9dff0',dark:'#9682b0'},
  contrast:{name:'Alto contraste',light:'#f6f6ee',dark:'#4f5966'}
};
const styles=new Set(['classic','flat','outline','bold','chessnut','fantasy','spatial','celtic','rhosgfx']);
const graphicSets=new Set(['chessnut','fantasy','spatial','celtic','rhosgfx']);
const storage='ib-chess-board-appearance-v1';
const colorOk=c=>/^#[0-9a-f]{6}$/i.test(c);
export function initBoardAppearance({refreshPieces}={}){
  const workspace=document.querySelector('.workspace-tools');
  if(!workspace)return;
  const el=document.createElement('details');
  el.className='appearance-menu';
  el.innerHTML=`<summary>♟ Apariencia</summary>
  <div class="appearance-options">
    <label>Color de tablero<select id="appearance-scheme">${Object.entries(schemes).map(([id,p])=>'<option value="'+id+'">'+p.name+'</option>').join('')}<option value="custom">Personalizado</option></select></label>
    <div class="appearance-colors"><label>Casillas claras<input type="color" id="appearance-light" aria-label="Color de las casillas claras"/></label><label>Casillas oscuras<input type="color" id="appearance-dark" aria-label="Color de las casillas oscuras"/></label></div>
    <label>Estilo de piezas<select id="appearance-pieces"><option value="classic">Clásicas</option><option value="flat">Planas</option><option value="outline">Contorno</option><option value="bold">Alto contraste</option><optgroup label="Colecciones gráficas SVG"><option value="chessnut">Chessnut · Moderno</option><option value="fantasy">Fantasy · Artístico</option><option value="spatial">Spatial · Geométrico</option><option value="celtic">Celtic · Decorativo</option><option value="rhosgfx">RhosGFX · Pixel art</option></optgroup></select></label><div id="appearance-preview" class="appearance-preview" aria-label="Vista previa del estilo de piezas"></div>
    <label class="appearance-toggle"><input type="checkbox" id="appearance-coordinates" checked/> Mostrar coordenadas</label>
    <button type="button" class="btn outline" id="appearance-reset">Restablecer apariencia</button>
    <small>Las preferencias se guardan en este navegador y no cambian el análisis de Stockfish.</small>
  </div>`;
  workspace.append(el);
  const $=id=>document.getElementById(id);
  const defaults={scheme:'jade',light:schemes.jade.light,dark:schemes.jade.dark,pieces:'classic',coordinates:true};
  let settings={...defaults};
  try{
    const v=JSON.parse(localStorage.getItem(storage)||'{}');
    if(v&&typeof v==='object'){
      const scheme=schemes[v.scheme]?v.scheme:v.scheme==='custom'?'custom':'jade';
      settings={scheme,light:colorOk(v.light)?v.light:defaults.light,dark:colorOk(v.dark)?v.dark:defaults.dark,pieces:styles.has(v.pieces)?v.pieces:'classic',coordinates:v.coordinates!==false};
    }
  }catch{}
  const drawPreview=()=>{
    const root=$('appearance-preview');root.replaceChildren();
    for(const piece of ['wK','wQ','wR','wB','wN','wP','bK','bQ','bR','bB','bN','bP']){
      const slot=document.createElement('span');slot.className='appearance-preview-piece';
      if(graphicSets.has(settings.pieces)){
        const img=document.createElement('img');img.alt=piece;img.src=import.meta.env.BASE_URL+'pieces/'+settings.pieces+'/'+piece+'.svg';slot.append(img);
      }else{
        const glyph={K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙'}[piece[1]];
        slot.textContent=piece[0]==='w'?glyph:{K:'♚',Q:'♛',R:'♜',B:'♝',N:'♞',P:'♟'}[piece[1]];
        slot.classList.add('preview-'+settings.pieces,piece[0]==='w'?'preview-white':'preview-black');
      }
      root.append(slot);
    }
  };
  const apply=()=>{
    const root=document.documentElement;
    root.style.setProperty('--board-light',settings.light);
    root.style.setProperty('--board-dark',settings.dark);
    const board=document.getElementById('board');
    if(board){board.dataset.pieceStyle=settings.pieces;board.classList.toggle('hide-coordinates',!settings.coordinates);}
    $('appearance-scheme').value=settings.scheme;
    $('appearance-light').value=settings.light;
    $('appearance-dark').value=settings.dark;
    $('appearance-pieces').value=settings.pieces;
    $('appearance-coordinates').checked=settings.coordinates;
    drawPreview();
    try{localStorage.setItem(storage,JSON.stringify(settings));}catch{}
  };
  $('appearance-scheme').onchange=e=>{
    settings.scheme=e.target.value;
    if(schemes[settings.scheme])Object.assign(settings,{light:schemes[settings.scheme].light,dark:schemes[settings.scheme].dark});
    apply();
  };
  for(const [id,key] of [['appearance-light','light'],['appearance-dark','dark']]){
    $(id).oninput=e=>{if(!colorOk(e.target.value))return;settings[key]=e.target.value;settings.scheme='custom';apply();};
  }
  $('appearance-pieces').onchange=e=>{settings.pieces=styles.has(e.target.value)?e.target.value:'classic';apply();refreshPieces?.();};
  $('appearance-coordinates').onchange=e=>{settings.coordinates=e.target.checked;apply();};
  $('appearance-reset').onclick=()=>{settings={...defaults};apply();refreshPieces?.();};
  // The board container remains stable while its squares are re-rendered.
  apply();
  return {apply,getPieceSet:()=>graphicSets.has(settings.pieces)?settings.pieces:null};
}
