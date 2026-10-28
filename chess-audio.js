// Original synthesized chess effects. No third-party recordings are redistributed.
const KEY='ib-chess-audio-v1';
const defaults={enabled:false,theme:'classic',volume:45,history:true};
const presets={
 classic:{freq:155,noise:0.68,decay:0.07,pitch:0.8},
 wood:{freq:125,noise:0.83,decay:0.11,pitch:0.67},
 soft:{freq:310,noise:0.30,decay:0.045,pitch:1.1},
 digital:{freq:530,noise:0.12,decay:0.10,pitch:1.35},
 arcade:{freq:380,noise:0.08,decay:0.16,pitch:1.65}
};
let settings={...defaults};
try{settings={...settings,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{}
let ctx=null;
const stored=()=>{try{localStorage.setItem(KEY,JSON.stringify(settings));}catch{}};
function audio(){if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ctx=new C();}if(ctx.state==='suspended')ctx.resume().catch(()=>{});return ctx;}
export function soundSettings(){return {...settings};}
export function setSoundSettings(next){settings={...settings,...next};settings.volume=Math.max(0,Math.min(100,Number(settings.volume)||0));if(!presets[settings.theme])settings.theme='classic';stored();return soundSettings();}
export function playChessSound(type,{preview=false}={}){
 if(!settings.enabled&&!preview)return;
 const c=audio();if(!c)return;const preset=presets[settings.theme]||presets.classic;
 const volume=settings.volume/100,now=c.currentTime,kind=['move','capture','castle','check','promotion'].includes(type)?type:'move';
 const duration=preset.decay*(kind==='capture'?1.65:kind==='check'?2.1:kind==='castle'?1.4:1);
 function pulse(offset,factor,frequency){
  const start=now+offset,osc=c.createOscillator(),gain=c.createGain(),filter=c.createBiquadFilter();
  osc.type=settings.theme==='digital'||settings.theme==='arcade'?'triangle':'sine';
  osc.frequency.setValueAtTime(frequency,start);osc.frequency.exponentialRampToValueAtTime(Math.max(55,frequency*preset.pitch),start+duration);
  filter.type='lowpass';filter.frequency.value=1800;
  gain.gain.setValueAtTime(Math.max(.0001,volume*0.12*factor),start);
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(filter).connect(gain).connect(c.destination);osc.start(start);osc.stop(start+duration+.01);
  if(preset.noise){
   const frames=Math.max(64,Math.round(c.sampleRate*duration)),buffer=c.createBuffer(1,frames,c.sampleRate),data=buffer.getChannelData(0);
   for(let i=0;i<frames;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/frames*6);
   const source=c.createBufferSource(),level=c.createGain(),lp=c.createBiquadFilter();
   source.buffer=buffer;lp.type='lowpass';lp.frequency.value=kind==='capture'?2900:1700;
   level.gain.value=volume*0.20*preset.noise*factor;
   source.connect(lp).connect(level).connect(c.destination);source.start(start);
  }
 }
 const f=preset.freq;
 pulse(0,1,kind==='check'?f*1.55:kind==='capture'?f*.7:f);
 if(kind==='capture')pulse(.044,.63,f*1.2);
 if(kind==='castle')pulse(.075,.58,f*.83);
 if(kind==='check')pulse(.095,.45,f*1.9);
 if(kind==='promotion')pulse(.07,.5,f*1.5);
}
export function initAudioPreferences(){
 const container=document.getElementById('prefs-audio');if(!container)return;
 container.innerHTML='<h3>Sonidos de ajedrez</h3><label class="audio-row"><input type="checkbox" id="audio-enabled"> Activar efectos de jugadas</label><label>Estilo<select id="audio-theme"><option value="classic">Clásico · pieza y tablero</option><option value="wood">Madera · golpe profundo</option><option value="soft">Suave · discreto</option><option value="digital">Digital · nítido</option><option value="arcade">Arcade · retro</option></select></label><label>Volumen <span id="audio-volume-label"></span><input id="audio-volume" type="range" min="0" max="100" step="5"></label><label class="audio-row"><input type="checkbox" id="audio-history"> Sonidos al recorrer partidas PGN</label><div class="prefs-actions"><button type="button" class="btn outline" id="audio-demo-move">▶ Movimiento</button><button type="button" class="btn outline" id="audio-demo-capture">▶ Captura</button><button type="button" class="btn outline" id="audio-demo-check">▶ Jaque</button></div><small>Perfiles originales sintetizados en el navegador; no utilizan grabaciones protegidas de Chess.com ni Lichess. El navegador puede exigir una interacción antes del primer sonido.</small>';
 const el=id=>document.getElementById(id),sync=()=>{el('audio-enabled').checked=settings.enabled;el('audio-theme').value=settings.theme;el('audio-volume').value=settings.volume;el('audio-volume-label').textContent=settings.volume+'%';el('audio-history').checked=settings.history;};
 sync();el('audio-enabled').onchange=e=>setSoundSettings({enabled:e.target.checked});
 el('audio-theme').onchange=e=>{setSoundSettings({theme:e.target.value});playChessSound('move',{preview:true});};
 el('audio-volume').oninput=e=>{setSoundSettings({volume:Number(e.target.value)});sync();};
 el('audio-history').onchange=e=>setSoundSettings({history:e.target.checked});
 for(const kind of ['move','capture','check'])el('audio-demo-'+kind).onclick=()=>playChessSound(kind,{preview:true});
}
