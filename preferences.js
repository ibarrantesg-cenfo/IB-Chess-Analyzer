import { initAudioPreferences } from './chess-audio.js';
import {cloudAvailable,getCloudSession,passwordSignIn,passwordSignUp,resetAccountPassword,updateAccountPassword,accountDetails,saveAccountName,cloudLogout} from './cloud.js';
export function initPreferences(notify){
 const sheet=document.createElement('div');sheet.className='prefs-overlay';sheet.hidden=true;
 sheet.innerHTML=`<section class="prefs-dialog" role="dialog" aria-modal="true" aria-label="Preferencias de IB Chess"><header><h2>Preferencias y cuenta</h2><button type="button" id="prefs-close" class="btn outline">Cerrar ✕</button></header>
 <div class="prefs-layout"><div class="prefs-block"><h3>Apariencia</h3><label>Tema<select id="prefs-theme"><option value="dark">Oscuro</option><option value="light">Claro</option><option value="system">Usar configuración del sistema</option></select></label><p>Se recuerda por navegador.</p></div>
 <div class="prefs-block" id="prefs-audio"></div><div class="prefs-block"><h3>Orientación del tablero</h3><p>Elegí qué color se ve desde abajo. También podés girar el tablero con el botón ⇅ durante la partida.</p><label>Vista<select id="prefs-board-orientation"><option value="white">Blancas abajo</option><option value="black">Negras abajo</option></select></label></div><div class="prefs-block"><h3>Cuenta del alumno / profesor</h3><p id="prefs-session">Comprobando sesión…</p>
 <label>Correo electrónico<input id="prefs-email" type="email" autocomplete="email" placeholder="alumno@correo.com"></label>
 <label>Usuario / nombre visible<input id="prefs-name" maxlength="80" placeholder="Richard Howell"></label>
 <label>Contraseña <span class="prefs-pass"><input id="prefs-password" type="password" autocomplete="current-password" placeholder="Mínimo 12 caracteres"><button id="prefs-show-password" type="button" class="btn outline">Mostrar</button></span></label>
 <div class="prefs-actions"><button type="button" class="btn primary" id="prefs-login">Iniciar sesión</button><button type="button" class="btn outline" id="prefs-register">Crear cuenta</button><button type="button" class="btn outline" id="prefs-reset">Recuperar acceso</button></div>
 <div class="prefs-actions"><button type="button" class="btn outline" id="prefs-save-name">Guardar nombre visible</button><button type="button" class="btn outline" id="prefs-change-password">Cambiar contraseña</button><button type="button" class="btn outline" id="prefs-logout">Cerrar sesión</button></div>
 <small>Las contraseñas se envían exclusivamente a Supabase Auth por conexión segura; nunca quedan guardadas en el estudio ni son visibles para el profesor.</small>
 </div>
 <div class="prefs-block"><h3>Administración de alumnos</h3><p id="prefs-teacher-status">Solo disponible para profesores autorizados.</p><p>Para otorgar cuentas sin compartir contraseñas, lo más seguro es invitar a cada alumno y permitir que establezca su propia clave mediante un enlace de acceso. La creación administrativa de cuentas requiere una función protegida de servidor.</p><div class="prefs-actions"><button type="button" class="btn outline" id="prefs-copy-invite">Copiar enlace de registro</button></div></div>
 </div></section>`;
 document.body.append(sheet);initAudioPreferences();
 const el=id=>document.getElementById(id),settingsKey='ib-chess-theme-v1';
 const applyTheme=v=>{document.documentElement.dataset.theme=v;localStorage.setItem(settingsKey,v);};
 applyTheme(localStorage.getItem(settingsKey)||'dark');
 el('prefs-theme').value=localStorage.getItem(settingsKey)||'dark';
 el('prefs-theme').onchange=e=>applyTheme(e.target.value);
 el('prefs-board-orientation').value=localStorage.getItem('ib-board-orientation')==='black'?'black':'white';
 el('prefs-board-orientation').onchange=e=>{localStorage.setItem('ib-board-orientation',e.target.value);window.IB_SET_BOARD_ORIENTATION?.(e.target.value);};
 const close=()=>{sheet.hidden=true;el('prefs-password').value='';el('prefs-password').type='password';el('prefs-show-password').textContent='Mostrar';};
 el('prefs-close').onclick=close;sheet.onclick=e=>{if(e.target===sheet)close();};
 el('prefs-show-password').onclick=()=>{const input=el('prefs-password'),show=input.type==='password';input.type=show?'text':'password';el('prefs-show-password').textContent=show?'Ocultar':'Mostrar';};
 async function refresh(){
  const session=await getCloudSession().catch(()=>null);
  if(!session){el('prefs-session').textContent='Sin sesión. Iniciá sesión o creá tu cuenta.';el('prefs-teacher-status').textContent='Cuenta de profesor no identificada.';return;}
  el('prefs-email').value=session.user.email||'';
  const account=await accountDetails().catch(()=>null);
  if(account?.name)el('prefs-name').value=account.name;
  el('prefs-session').textContent='Sesión: '+(session.user.email||'')+(account?.isTeacher?' · Profesor':' · Alumno');
  el('prefs-teacher-status').textContent=account?.isTeacher?'Profesor habilitado. La gestión de altas administrativas requiere función segura de servidor.':'Cuenta de alumno activa.';
 }
 const run=fn=>async()=>{try{await fn();await refresh();}catch(e){notify(e.message||String(e),'err');}};
 el('prefs-login').onclick=run(async()=>{await passwordSignIn(el('prefs-email').value.trim(),el('prefs-password').value);notify('Sesión iniciada.');});
 el('prefs-register').onclick=run(async()=>{const pass=el('prefs-password').value;if(pass.length<12)throw Error('Elegí una contraseña de al menos 12 caracteres.');await passwordSignUp(el('prefs-email').value.trim(),pass,el('prefs-name').value.trim());notify('Cuenta solicitada. Revisá el correo para confirmarla.');});
 el('prefs-reset').onclick=run(async()=>{await resetAccountPassword(el('prefs-email').value.trim());notify('Si existe una cuenta con ese correo, se envió el enlace de recuperación.');});
 el('prefs-save-name').onclick=run(async()=>{await saveAccountName(el('prefs-name').value);notify('Nombre visible actualizado.');});
 el('prefs-change-password').onclick=run(async()=>{if(el('prefs-password').value.length<12)throw Error('Mínimo 12 caracteres.');await updateAccountPassword(el('prefs-password').value);notify('Contraseña actualizada.');el('prefs-password').value='';});
 el('prefs-logout').onclick=run(async()=>{await cloudLogout();notify('Sesión cerrada.');});
 el('prefs-copy-invite').onclick=()=>{navigator.clipboard.writeText(location.origin+location.pathname).then(()=>notify('Enlace de acceso copiado.'));};
 return {open:()=>{sheet.hidden=false;refresh();},close};
}
