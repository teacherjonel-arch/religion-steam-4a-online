/* Expediente Bellemer — aplicación estática para GitHub Pages.
   La laptop aloja la sesión mediante WebRTC/PeerJS. No se transfieren datos personales. */
(()=>{
'use strict';
const Q=[
{q:'¿Qué motivo lleva a Hugo a Francia?',options:['Participar en un curso de francés','Visitar a su familia','Trabajar como pescador','Investigar a un soldado'],key:'A',page:'13–14'},
{q:'¿Qué advertencia recibe Hugo de François antes de pasear?',options:['Que el curso se ha cancelado','Que no debe hablar con Bernard','Que no es buen día para ir a los acantilados','Que el tren no llegará'],key:'C',page:'17'},
{q:'¿Qué ocurre cuando la muchacha intenta dar un papel a Hugo?',options:['Él lo lee de inmediato','El miedo le impide cogerlo','Él se lo entrega al soldado','Lo esconde bajo una roca'],key:'B',page:'19'},
{q:'¿Qué rastro deja de encontrar Hugo en la puerta del faro?',options:['Un billete de tren','Una brújula de metal','Una fotografía antigua','La sangre y la marca de una bala'],key:'D',page:'20'},
{q:'¿Qué afirma Lucille acerca de los soldados en Bellemer?',options:['No hay soldados desde hace unos cincuenta años','Hay soldados alojados en el sanatorio','Un soldado llevó a Hugo al hospital','Un soldado entregó un mensaje'],key:'A',page:'24'},
{q:'¿Qué sospecha Gabriella cuando examina las pertenencias de Hugo?',options:['Que Bernard es familiar de Hugo','Que falta un billete','Que Hugo oculta algo','Que la muchacha vive en la residencia'],key:'C',page:'26–27'},
{q:'¿Qué resulta especialmente extraño en el papel encontrado?',options:['Está escrito en español','Está seco mientras los otros papeles estaban mojados','Contiene una fotografía de François','Se encontró dentro del faro'],key:'B',page:'27 y 31'},
{q:'¿Para qué se utilizó el palacete durante la Segunda Guerra Mundial?',options:['Solo como museo','Como escuela de navegación','Como fábrica de embarcaciones','Como hospital, cuartel y prisión en distintos momentos'],key:'D',page:'29–30'},
{q:'Anota dos hechos que apoyen el testimonio de Hugo y una explicación alternativa. Distingue hechos de hipótesis.',open:true,page:'19–38'},
{q:'¿Qué crees que ocurrió en el faro? Argumenta con dos pistas del libro y plantea una pregunta que aún no podemos responder.',open:true,page:'17–38'}
];
const TEAM_NAMES=['Los rastreadores','Los observadores','Los detectives','Los investigadores'];
const app=document.getElementById('app');
const LS='expediente-bellemer-docente-v3';
let mode='landing',host=null,student=null,session=null,current=0,notice='',noticeLevel='',activeEdit=false,studentDraft=null,typingTimer=null;
let peers=new Map();
const esc=s=>String(s??'').replace(/[&<>"']/g,v=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[v]));
const rand=()=>String(Math.floor(100000+Math.random()*900000));
const roomPeerId=code=>'bellemer-aula-'+code;
const isValidCode=c=>/^\d{6}$/.test(String(c));
const freshTeam=()=>({answers:Array.from({length:10},()=>''),grades:[0,0]});
const freshRoom=()=>({code:rand(),status:'playing',createdAt:Date.now(),teams:Array.from({length:4},freshTeam)});
const count=t=>t.answers.filter(a=>String(a).trim().length>0).length;
const points=t=>t.answers.slice(0,8).reduce((sum,a,i)=>sum+(a===Q[i].key?10:0),0)+t.grades.reduce((sum,grade,i)=>sum+(String(t.answers[8+i]||'').trim()?grade:0),0);
const persist=()=>{if(session)try{localStorage.setItem(LS,JSON.stringify(session));}catch(e){console.warn('No se pudo guardar sesión',e)}};
function restore(){try{const v=JSON.parse(localStorage.getItem(LS)||'null');if(v&&isValidCode(v.code)&&['playing','closed','revealed'].includes(v.status)&&Array.isArray(v.teams)&&v.teams.length===4){for(const t of v.teams){if(!Array.isArray(t.answers)||t.answers.length!==10||!Array.isArray(t.grades)||t.grades.length!==2)return null;}return v}}catch(e){}return null}
const topbar=()=>`<header class="topbar"><div class="frame"><div class="brand"><div class="symbol"><span>✦</span></div><div>Expediente Bellemer<small>El misterio del faro</small></div></div><button class="navlink" data-act="home">Inicio</button></div></header>`;
const badge=(online,label)=>`<span class="pill ${online?'live':'offline'}"><span class="status-dot"></span> ${esc(label)}</span>`;
function landing(){
app.innerHTML=`<main class="screen landing"><div class="grain"></div><div class="frame"><header class="mast"><div class="brand"><div class="symbol"><span>✦</span></div>Archivo Bellemer</div><div class="mast-note">Plan Lector · Investigación Nº 001</div></header><section class="hero"><div><p class="eyebrow">Una historia. Cuatro equipos. Diez misiones.</p><h1>El misterio <span>del faro</span></h1><p class="intro">Una muchacha desaparecida. Un disparo que nadie recuerda. Un papel que permanece seco durante una tormenta. Hoy no leemos para repetir: <strong style="color:#fff">leemos para investigar.</strong></p><div class="land-actions"><button class="btn btn-primary" data-act="teacher-start">Soy docente →</button><button class="btn btn-outline" data-act="student-start">Entrar como equipo →</button></div><div class="statline"><span>22 estudiantes</span><span>4 equipos</span><span>10 misiones</span><span>45 minutos</span></div></div><div class="visual" aria-hidden="true"><div class="moon"></div><div class="beam"></div><div class="roof"></div><div class="tower-top"></div><div class="lighthouse"></div><div class="cliff"></div><div class="waves"></div><div class="evidence">¿Qué ocurrió realmente?</div></div></section><footer class="footer"><span>Basado en “El faro de la mujer ausente” · David Fernández Sifres · Páginas 11–38</span><span>Sesión compartida: la laptop debe mantenerse abierta</span></footer></div></main>`;
}
function teacherGate(){
const saved=restore();app.innerHTML=`<div class="content-screen">${topbar()}<div class="container column-sm"><div class="card stack"><span class="eyebrow" style="color:#ad8062">Panel del docente</span><h2>Dirige la investigación</h2><p class="muted">La laptop será la central de la partida. Mantén esta pestaña abierta mientras los equipos responden desde las dos tablets.</p>${saved?`<div class="rubric"><b>Sala guardada: ${saved.code}</b><br>Progreso y respuestas conservados en esta laptop.</div><button class="btn btn-dark btn-block" data-act="teacher-resume">Retomar sala ${saved.code}</button><div class="line"></div>`:''}<button class="btn btn-primary btn-block" data-act="teacher-create">Crear una sala nueva</button><p class="subtle">La sala funciona a través de internet usando conexiones directas entre navegadores. No requiere cuentas para los alumnos, pero necesita el navegador del docente conectado.</p></div></div></div>`;
}
function studentGate(){
const params=new URLSearchParams(location.search);const prefill=isValidCode(params.get('sala'))?params.get('sala'):'';
app.innerHTML=`<div class="content-screen">${topbar()}<div class="container column-sm"><div class="card stack"><span class="eyebrow" style="color:#ad8062">Acceso de investigadores</span><h2>Entrar a la misión</h2><p class="muted">Pide al docente el código de seis cifras. La tablet 1 se turna entre los equipos 1 y 3; la tablet 2 entre el 2 y el 4.</p><div><label class="label" for="code">Código de la sala</label><input id="code" class="field field-lg" type="text" inputmode="numeric" maxlength="6" placeholder="000000" value="${prefill}" autocomplete="one-time-code"></div><div><label class="label" for="team">Selecciona tu equipo</label><select id="team" class="field"><option value="0">Equipo 1 · Los rastreadores (6)</option><option value="1">Equipo 2 · Los observadores (6)</option><option value="2">Equipo 3 · Los detectives (5)</option><option value="3">Equipo 4 · Los investigadores (5)</option></select></div><button class="btn btn-primary btn-block" data-act="student-join">Conectarme a la sala →</button><div id="gate-status" role="status"></div></div></div></div>`;
}
function message(text,level=''){notice=text;noticeLevel=level;const el=document.getElementById('notice');if(el)el.innerHTML=`<div class="alert ${level==='error'?'alert-danger':level==='warn'?'alert-warn':''}">${esc(text)}</div>`}
function startTeacher(resume){
if(host){try{host.destroy()}catch(e){}}
for(const c of peers.values())try{c.close()}catch(e){};peers.clear();
session=resume?restore():freshRoom();if(!session){session=freshRoom()};persist();mode='teacher';renderTeacher();
if(!window.Peer){message('No se pudo cargar la conexión entre dispositivos. Comprueba internet y permite el acceso a cdn.jsdelivr.net.','error');return;}
host=new Peer(roomPeerId(session.code),{debug:0});
host.on('open',()=>{message('Sala disponible. Las tablets ya pueden entrar con el código '+session.code);renderTeacher()});
host.on('connection',conn=>{
  const id=Math.random().toString(36).slice(2);peers.set(id,conn);conn._id=id;conn._team=null;
  conn.on('open',()=>{try{conn.send({type:'hello',code:session.code})}catch(e){}renderTeacher()});
  conn.on('data',data=>onHostData(conn,data));
  conn.on('close',()=>{peers.delete(id);renderTeacher()});
  conn.on('error',()=>{peers.delete(id);renderTeacher()});
});
host.on('disconnected',()=>{message('El servidor de conexiones se desconectó. Intentando recuperar la sala…','warn');setTimeout(()=>{if(host&&!host.destroyed&&host.disconnected)host.reconnect()},1500)});
host.on('error',err=>message(err?.type==='unavailable-id'?'Este código ya está ocupado. Crea una nueva sala o intenta retomar cuando la otra esté cerrada.':'Conexión no disponible: '+(err?.type||'desconocido')+'. Prueba con otra red o recarga.','error'));
}
function sanitizedTeam(t,idx){return {index:idx,name:TEAM_NAMES[idx],progress:count(t),score:session.status==='revealed'?points(t):null}}
function snap(conn){if(!conn?.open||!session)return;let team=Number.isInteger(conn._team)?conn._team:null;try{conn.send({type:'state',status:session.status,code:session.code,teams:session.teams.map(sanitizedTeam),team,answers:team!==null?session.teams[team].answers:null,grades:team!==null&&session.status==='revealed'?session.teams[team].grades:null,correct:session.status==='revealed'?Q.map(q=>q.open?null:q.key):null})}catch(e){console.warn(e)}}
function broadcast(){for(const c of peers.values())snap(c)}
function onHostData(conn,data){
if(!data||typeof data!=='object')return;
if(data.type==='join'){
 const team=Number(data.team);if(!Number.isInteger(team)||team<0||team>3)return;conn._team=team;snap(conn);renderTeacher();return;
}
if(data.type==='answer'&&session?.status==='playing'&&conn._team!==null){
 const ix=Number(data.index);if(!Number.isInteger(ix)||ix<0||ix>9||typeof data.value!=='string')return;
 const value=data.value.trim().slice(0,1800);
 if(ix<8&&!['','A','B','C','D'].includes(value))return;
 session.teams[conn._team].answers[ix]=value;persist();broadcast();renderTeacher();
}
}
function teacherStatus(){if(!host)return badge(false,'Iniciando conexión');return badge(host.open,'Conexión '+(host.open?'activa':'pendiente'))}
function renderTeacher(){if(mode!=='teacher'||!session)return;
const joined=new Set([...peers.values()].filter(c=>c.open&&c._team!==null).map(c=>c._team));
const publicUrl=location.origin+location.pathname+'?sala='+session.code;
app.innerHTML=`<div class="content-screen">${topbar()}<main class="container"><div class="section-head row"><div><small>Central de operaciones</small><h2>Panel del docente</h2></div><div class="row">${teacherStatus()}<span class="pill">${session.status==='playing'?'En juego':session.status==='closed'?'Respuestas cerradas':'Resultados revelados'}</span></div></div><div id="notice">${notice?`<div class="alert ${noticeLevel==='error'?'alert-danger':noticeLevel==='warn'?'alert-warn':''}">${esc(notice)}</div>`:''}</div><div class="space"></div><div class="grid-two"><section class="card"><span class="label">Código para ambas tablets</span><div class="room-code">${session.code}</div><p class="muted">Abre el mismo enlace en las dos tablets, elige el equipo y escribe este código.</p><div class="controls"><button class="btn btn-dark btn-sm" data-act="copy-link">Copiar enlace de invitación</button><button class="btn btn-pale btn-sm" data-act="copy-code">Copiar código</button></div><p class="copytext">${esc(publicUrl)}</p></section><section class="card"><span class="label">Control de la partida</span><div class="controls">${session.status==='playing'?'<button class="btn btn-dark btn-sm" data-act="close">Cerrar respuestas</button>':'<button class="btn btn-pale btn-sm" data-act="reopen">Reabrir respuestas</button>'}<button class="btn btn-primary btn-sm" data-act="reveal" ${session.status==='revealed'?'disabled':''}>Revelar resultados</button><button class="btn btn-pale btn-sm" data-act="new-room">Nueva sala</button></div><p class="muted" style="margin:16px 0 0">${session.status==='revealed'?'Ya se pueden ver puntuaciones y soluciones.':session.status==='closed'?'Las respuestas están bloqueadas. Puedes calificar las preguntas abiertas.':'Las respuestas de alternativa se guardan en el navegador del docente conforme llegan. No se muestran claves ni puntuaciones hasta revelar.'}</p></section></div><div class="space"></div><section class="section-head"><small>Investigación en directo</small><h2>Progreso de los equipos</h2></section><div class="grid-four">${session.teams.map((t,i)=>`<article class="team-card"><div class="row"><strong>Equipo ${i+1}</strong>${joined.has(i)?badge(true,'En línea'):badge(false,'Sin conexión')}</div><div class="subtle">${TEAM_NAMES[i]}</div><div class="number">${count(t)}<span style="font-size:15px;color:#65827a"> / 10</span></div><div class="progress"><div style="width:${count(t)*10}%"></div></div><span class="subtle">${session.status==='revealed'?'Puntos: '+points(t)+'/100':'Pruebas registradas'}</span></article>`).join('')}</div><div class="space"></div>${session.status==='revealed'?`<div class="card"><h3>Clasificación final</h3><div class="scrolltable"><table><thead><tr><th>Posición</th><th>Equipo</th><th>Progreso</th><th>Puntuación</th></tr></thead><tbody>${session.teams.map((t,i)=>({t,i,score:points(t)})).sort((a,b)=>b.score-a.score).map((a,i)=>`<tr><td><b>${i+1}º</b></td><td>Equipo ${a.i+1}</td><td>${count(a.t)}/10</td><td><b>${a.score}/100</b></td></tr>`).join('')}</tbody></table></div></div><div class="space"></div>`:''}<div class="grid-two"><section class="card"><h3>Corrección de argumentos</h3><p class="muted">Asigna de 0 a 10 puntos a cada respuesta abierta. Revisa si citan evidencias de los capítulos.</p><div class="stack">${session.teams.map((t,i)=>`<div><div class="row"><strong>Equipo ${i+1}</strong><span class="subtle">${TEAM_NAMES[i]}</span></div><div class="rubric"><b>Reto 9</b> · ${esc(t.answers[8]||'Sin respuesta')}<br><br><b>Reto 10</b> · ${esc(t.answers[9]||'Sin respuesta')}</div><div class="row" style="margin:9px 0 12px"><label class="subtle">Reto 9 <input class="grade" type="number" min="0" max="10" step="1" value="${t.grades[0]}" ${!t.answers[8]?.trim()?'disabled title="Primero debe haber una respuesta"':''} data-grade="0" data-team="${i}"></label><label class="subtle">Reto 10 <input class="grade" type="number" min="0" max="10" step="1" value="${t.grades[1]}" ${!t.answers[9]?.trim()?'disabled title="Primero debe haber una respuesta"':''} data-grade="1" data-team="${i}"></label></div></div>`).join('')}</div></section><section class="card"><h3>Guía de la sesión · 45 min</h3>${[['5 min','Abre el expediente con el misterio del papel seco.'],['12 min','Tablet 1: equipo 1. Tablet 2: equipo 2.'],['12 min','Cambian las tablets a equipos 3 y 4.'],['10 min','Juicio del faro: defender hipótesis con pruebas.'],['6 min','Cierra, califica, revela y comenta.']].map(([a,b])=>`<div class="teacher-guide"><b>${a}</b><span>${b}</span></div>`).join('')}<div class="line"></div><h3>Claves del docente</h3><p class="muted">${Q.slice(0,8).map((q,i)=>`${i+1}: ${q.key}`).join(' · ')}</p><p class="subtle">Material de trabajo sobre el prólogo y los cuatro primeros capítulos hasta la página 38. La historia conserva sus incógnitas.</p><div class="alert alert-warn">Importante: GitHub Pages es alojamiento estático. El enlace entre tablets y laptop usa el servicio público de PeerJS. Mantén abierta esta pestaña; si cierras la laptop, la conexión se interrumpe.</div></section></div></main></div>`;
}
function onStudentData(data){if(!student||!data||typeof data!=='object')return;
if(data.type==='state'&&data.code===student.code){
 const changedState=data.status!==student.roomStatus;
 student.roomStatus=data.status;student.teams=data.teams||[];student.correct=data.correct;student.grades=data.grades||[0,0];if(Array.isArray(data.answers))student.answers=data.answers;
 student.saved='Respuestas sincronizadas';
 const input=document.activeElement;if(input?.matches('textarea[data-answer]')&&!changedState){const save=document.getElementById('saved');if(save)save.textContent='Guardado ✓';return;}renderStudent();
}
}
function renderStudent(){if(mode!=='student'||!student)return;
const s=student;const joined=s.connected;const status=joined?badge(true,'Conectado al docente'):badge(false,s.status==='connecting'?'Conectando…':'Sin conexión');const q=Q[current],val=s.answers[current]||'',readonly=s.roomStatus!=='playing';const done=s.answers.filter(x=>String(x).trim()).length;
app.innerHTML=`<div class="content-screen">${topbar()}<main class="container"><div class="section-head row"><div><small>Sala ${esc(s.code)} · Equipo ${s.team+1}</small><h2>Tu expediente de investigación</h2></div>${status}</div>${s.status==='lost'?`<div class="alert alert-warn">${esc(s.saved||'Se perdió la conexión con la laptop.')} <button class="btn btn-dark btn-sm" data-act="student-retry">Reconectar</button></div>`:''}${s.roomStatus==='closed'?'<div class="lock-banner">El docente ha cerrado la recepción de respuestas. Puedes revisar tus hipótesis.</div>':''}${s.roomStatus==='revealed'?'<div class="alert">El docente ha revelado el resultado. Revisa las soluciones y tus puntos.</div>':''}<div class="mission-layout"><aside class="nav-aside"><div class="card"><div class="number-row"><div class="big-icon">🕵</div><div><b>Equipo ${s.team+1}</b><br><small>${TEAM_NAMES[s.team]}</small></div></div><p class="subtle" style="margin-top:15px">${done} de 10 desafíos respondidos</p><div class="progress"><div style="width:${done*10}%"></div></div><div class="question-nav">${Q.map((_,i)=>`<button class="${i===current?'on':''} ${s.answers[i]?'done':''}" aria-label="Ir al reto ${i+1}" data-act="go" data-to="${i}">${i+1}</button>`).join('')}</div><div class="line"></div><button class="btn btn-pale btn-block btn-sm" data-act="change-team">Cambiar de equipo</button>${s.roomStatus==='revealed'?`<div class="line"></div><div class="score">${s.teams?.[s.team]?.score??0}<span style="font-size:17px"> / 100</span></div><p class="subtle">Puntuación del equipo</p>`:''}</div></aside><section class="card"><div class="row"><span class="eyebrow" style="color:#b58854">${current<8?'Prueba de evidencia':'Prueba de argumentación'} ${current+1} / 10</span><span class="pill">${q.open?'10 pts · docente':'10 puntos'}</span></div><h3 class="question">${esc(q.q)}</h3><div class="mini-steps"><span>Libro: página ${esc(q.page)}</span><span id="saved" class="saved ${joined?'':'wait'}">${esc(s.saved)}</span></div>${q.open?`<label class="label" for="answer">Tu argumento</label><textarea id="answer" data-answer="${current}" class="field field-text" placeholder="Escribe aquí tus ideas y pruebas del libro…" ${readonly?'disabled':''}>${esc(val)}</textarea><div class="rubric" style="margin-top:11px">Incluye datos concretos de la lectura. Lo importante no es adivinar, sino explicar.</div>`:`<div class="stack">${q.options.map((o,i)=>{const letter='ABCD'[i],chosen=val===letter,reveal=s.roomStatus==='revealed';return `<button class="choice ${chosen?'selected':''}" data-act="answer" data-val="${letter}" ${readonly?'disabled':''}><span class="bubble">${letter}</span><span style="flex:1;text-align:left">${esc(o)}</span>${reveal&&s.correct?.[current]===letter?'<span class="result-good">✓</span>':''}</button>`}).join('')}</div>${s.roomStatus==='revealed'?`<div class="alert ${val===s.correct?.[current]?'':'alert-warn'}" style="margin-top:15px">${val===s.correct?.[current]?'¡Respuesta correcta!':'La respuesta correcta es '+esc(s.correct?.[current]||'—')+'.'} Revisa la página ${esc(q.page)}.</div>`:''}`}<div class="row" style="margin-top:26px"><button class="btn btn-pale" data-act="prev" ${current===0?'disabled':''}>← Anterior</button><button class="btn btn-dark" data-act="next" ${current===9?'disabled':''}>Siguiente →</button></div></section></div><div class="space"></div><div class="card"><div class="row"><div><b>Marcador general</b><p class="subtle">${s.roomStatus==='revealed'?'Clasificación de la sala':'Avance de la investigación, sin revelar puntos'}</p></div>${badge(joined,'Sala '+s.code)}</div><div class="grid-four">${(s.teams?.length?s.teams:Array.from({length:4},(_,i)=>({name:TEAM_NAMES[i],progress:0,score:null}))).map((t,i)=>`<div class="team-card"><strong>Equipo ${i+1}</strong><div class="progress"><div style="width:${(t.progress||0)*10}%"></div></div><span class="subtle">${s.roomStatus==='revealed'?(t.score??0)+' puntos':(t.progress||0)+'/10 respuestas'}</span></div>`).join('')}</div></div></main></div>`;
}
function sendAnswer(index,value){if(!student?.connected||!student.conn?.open)return;student.answers[index]=value;student.saved='Enviando…';const save=document.getElementById('saved');if(save)save.textContent='Guardando…';try{student.conn.send({type:'answer',index,value});}catch(e){student.saved='Error al enviar';if(save)save.textContent='Error al enviar'}}
function endStudent(){clearTimeout(typingTimer);try{student?.conn?.close()}catch(e){}try{student?.peer?.destroy()}catch(e){}student=null}
function endTeacher(){try{host?.destroy()}catch(e){}host=null;for(const c of peers.values())try{c.close()}catch(e){}peers.clear();}
function act(name,el){
switch(name){
case 'home': if(mode==='teacher')endTeacher();if(mode==='student')endStudent();mode='landing';landing();break;
case 'teacher-start':teacherGate();break;
case 'teacher-create':startTeacher(false);break;
case 'teacher-resume':startTeacher(true);break;
case 'student-start':studentGate();break;
case 'student-join':{const c=document.getElementById('code')?.value?.trim();const t=document.getElementById('team')?.value;const valid=isValidCode(c);if(!valid){document.getElementById('gate-status').innerHTML='<div class="alert alert-warn">Escribe un código de seis cifras.</div>';break}const team=Number(t);if(!Number.isInteger(team)||team<0||team>3)break;startStudentFrom(c,team);break;}
case 'student-retry':if(student){const {code,team}=student;endStudent();startStudentFrom(code,team)}break;
case 'change-team':endStudent();studentGate();break;
case 'go':current=Math.max(0,Math.min(9,Number(el.dataset.to)));renderStudent();break;
case 'prev':current=Math.max(0,current-1);renderStudent();break;
case 'next':current=Math.min(9,current+1);renderStudent();break;
case 'answer':if(student?.roomStatus!=='playing')break;sendAnswer(current,el.dataset.val);renderStudent();break;
case 'copy-link':copy(location.origin+location.pathname+'?sala='+session.code);break;
case 'copy-code':copy(session.code);break;
case 'close':session.status='closed';persist();broadcast();renderTeacher();break;
case 'reopen':session.status='playing';persist();broadcast();renderTeacher();break;
case 'reveal':if(session.status!=='revealed'&&confirm('¿Revelar ahora las respuestas correctas y las puntuaciones a todos los equipos?')){session.status='revealed';persist();broadcast();renderTeacher()}break;
case 'new-room':if(confirm('¿Crear una sala distinta? El progreso actual quedará reemplazado por una sala vacía en esta laptop.'))startTeacher(false);break;
}
}
function startStudentFrom(code,team){mode='student';current=0;if(!window.Peer){app.innerHTML=`<div class="content-screen">${topbar()}<main class="container column-sm"><div class="card"><div class="alert alert-danger">Fallo al conectar. Comprueba la conexión a internet y recarga la página.</div></div></main></div>`;return}student={code,team,peer:null,conn:null,connected:false,status:'connecting',answers:Array(10).fill(''),grades:[0,0],teams:[],roomStatus:'playing',correct:null,saved:'Conectando…'};renderStudent();const peer=new Peer(undefined,{debug:0});student.peer=peer;
peer.on('open',()=>{if(!student||student.peer!==peer)return;const conn=peer.connect(roomPeerId(code),{reliable:true});student.conn=conn;conn.on('open',()=>{student.connected=true;student.status='ready';conn.send({type:'join',team});renderStudent()});conn.on('data',onStudentData);conn.on('close',()=>{if(!student)return;student.connected=false;student.status='lost';student.saved='Se perdió la conexión. Pide al docente que mantenga su sesión abierta.';renderStudent()});conn.on('error',()=>{if(!student)return;student.connected=false;student.status='lost';renderStudent()})});
peer.on('error',err=>{if(!student||student.peer!==peer)return;student.connected=false;student.status='lost';student.saved=err?.type==='peer-unavailable'?'No hay un docente conectado con ese código. Comprueba que el docente tenga su sala abierta.':'La comunicación no está disponible. Comprueba internet.';renderStudent()});
}
async function copy(t){try{await navigator.clipboard.writeText(t);message('Copiado al portapapeles.')}catch(e){prompt('Copia este valor:',t)}}
app.addEventListener('click',e=>{const btn=e.target.closest('[data-act]');if(btn&&!btn.disabled)act(btn.dataset.act,btn)});
app.addEventListener('change',e=>{if(e.target.matches('[data-grade]')&&session&&mode==='teacher'){
const team=Number(e.target.dataset.team),grade=Number(e.target.dataset.grade),v=Math.max(0,Math.min(10,Math.floor(Number(e.target.value)||0)));session.teams[team].grades[grade]=v;persist();broadcast();renderTeacher();
}});
app.addEventListener('input',e=>{if(e.target.matches('textarea[data-answer]')&&student?.roomStatus==='playing'){
const ix=Number(e.target.dataset.answer),value=e.target.value.slice(0,1800);student.answers[ix]=value;const label=document.getElementById('saved');if(label)label.textContent='Escribiendo…';clearTimeout(typingTimer);typingTimer=setTimeout(()=>sendAnswer(ix,value),550)
}});
window.addEventListener('beforeunload',()=>{if(mode==='teacher')persist()});
(function init(){const p=new URLSearchParams(location.search);if(isValidCode(p.get('sala'))){studentGate()}else landing()})();
})();
