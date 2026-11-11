const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const today=new Date();$('#todayLabel').textContent=today.toLocaleDateString('es-CO',{weekday:'short',day:'2-digit',month:'short',year:'numeric'});
const roleData={admin:{name:'Administrador',email:'',initials:'AD',role:'ADMINISTRADOR',nav:[['home','Inicio','⌂'],['users','Gestión de usuarios','♙'],['parking','Parqueaderos','▣'],['audit','Auditoría','▤'],['profile','Mi perfil','◉']]},resident:{name:'Residente',email:'',initials:'RE',role:'RESIDENTE',nav:[['home','Inicio','⌂'],['reservations','Reservas','▦'],['guests','Invitados','♧'],['profile','Perfil','◉']]},security:{name:'Personal de seguridad',email:'',initials:'SE',role:'SEGURIDAD',nav:[['home','Inicio','⌂'],['security','Seguridad','⬡'],['parking','Parqueaderos','▣'],['audit','Ingresos y salidas','⇄'],['profile','Mi perfil','◉']]}};
let currentRole='admin',currentPage='home';
// Cuentas residentes iniciales de demostración solicitadas.
let users=[
  ['Francisco Castro','1032456789','f@res','Residente','A-402','Activo','3104827615'],
  ['Diego Baron','1029876543','d@res','Residente','A-201','Activo','3157294086'],
  ['Personal de Seguridad','900000001','seguridad@seguridad','Seguridad','—','Activo','3000000000']
];
let guests=[];
let reservations=[];
let parkingSlots=[];
let audit=[];
let currentEmail='';
let currentDisplayName='';
let currentHome='—';
function showModal(title,text,icon='✓'){ $('#modalTitle').textContent=title;$('#modalText').textContent=text;$('#modalIcon').textContent=icon;$('#modal').classList.remove('hidden') }
function go(page){
  currentPage=page;
  $$('.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+page));
  $$('.nav-link').forEach(n=>{
    const active=n.dataset.page===page;
    n.classList.toggle('active',active);
    if(active)n.setAttribute('aria-current','page');else n.removeAttribute('aria-current');
  });
  const labels={home:'Inicio',users:'Gestión de usuarios',reservations:'Reservas',guests:'Invitados',security:'Seguridad',parking:'Parqueaderos',audit:'Auditoría',profile:'Mi perfil'};
  $('#breadcrumb').textContent=labels[page]||'Inicio';
}
function setupRole(role,email){
currentRole=role;currentEmail=email;
const d=roleData[role];
const account=users.find(u=>u[2].toLowerCase()===email.toLowerCase());
if((role==='resident'&&(!account||account[3]!=='Residente'||account[5]!=='Activo'))||
   (role==='security'&&(!account||account[3]!=='Seguridad'||account[5]!=='Activo'))){
  $('#loginError').textContent='Correo inválido o no registrado.';
  $('#loginError').classList.remove('hidden');
  return;
}
const local=email.split('@')[0].replace(/[._-]+/g,' ').trim();
currentDisplayName=account?account[0]:(local?local.replace(/\b\w/g,c=>c.toUpperCase()):d.name);
currentHome=(role==='resident'&&account)?account[4]:'—';
d.name=currentDisplayName;d.email=email;d.initials=currentDisplayName.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();$('#loginView').classList.add('hidden');$('#appView').classList.remove('hidden');$('#sidebarName').textContent=d.name;$('#sidebarRole').textContent=d.role;$('#sidebarAvatar').textContent=d.initials;$('#topAvatar').textContent=d.initials;$('#topName').textContent=d.name;$('#profileAvatar').textContent=d.initials;$('#profileName').textContent=d.name;$('#profileEmail').textContent=d.email;$('#profileRole').textContent=d.role;$('#sideNav').innerHTML=d.nav.map(([page,label,icon])=>`<button class=\"nav-link ${page==='home'?'active':''}\" data-page=\"${page}\"><span class=\"nav-icon\">${icon}</span><span class=\"nav-label\">${label}</span></button>`).join('');$('#sideNav').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));$('#welcomeTitle').textContent='Hola, '+currentDisplayName+' 👋';$('#welcomeEyebrow').textContent=role==='security'?'CONTROL DE PORTERÍA':role==='resident'?'ESPACIO DEL RESIDENTE':'PANEL DE CONTROL';$('#welcomeSubtitle').textContent=role==='security'?'Consulta autorizaciones y registra los movimientos de visitantes.':role==='resident'?'Gestiona tus reservas, invitados y datos personales.':'Resumen general de tu conjunto residencial.';renderHome();renderUsers();renderGuests();renderSecurity();renderParking();renderAudit();go('home');}
$('#loginForm').addEventListener('submit',e=>{e.preventDefault();const email=$('#email').value.trim().toLowerCase();const password=$('#password').value;const suffix=email.slice(email.lastIndexOf('@'));const map={'@admin':'admin','@res':'resident','@segu':'security','@seguridad':'security'};const role=map[suffix];if(!role||!email.includes('@')||!email.split('@')[0]||!password){$('#loginError').classList.remove('hidden');return}$('#loginError').classList.add('hidden');setupRole(role,email)});
$('#logoutBtn').addEventListener('click',()=>{$('#appView').classList.add('hidden');$('#loginView').classList.remove('hidden');$('#password').value='';$('#loginError').classList.add('hidden')});$('#togglePassword').addEventListener('click',()=>{const p=$('#password');p.type=p.type==='password'?'text':'password'});$('#forgotLink').addEventListener('click',e=>{e.preventDefault();showModal('Recuperación de contraseña','La solicitud no está disponible en este momento.','✉')});$('#profileChip').addEventListener('click',()=>go('profile'));
function renderHome(){
const d=roleData[currentRole];
const myReservations=reservations.filter(r=>r.residentEmail===currentEmail&&r.status==='CONFIRMADA');
const myGuests=guests.filter(g=>(g.residentEmail||'').trim().toLowerCase()===currentEmail.trim().toLowerCase());
let stats=currentRole==='security'?
 [[String(guests.length),'Visitantes hoy','♧',''],[String(guests.filter(g=>g.plate!=='—').length),'Vehículos autorizados','▣','green'],[String(guests.filter(g=>g.status==='Pendiente').length),'Pendientes de validar','◷','amber'],['0','Novedades','⚑','red']]:
 currentRole==='resident'?
 [[String(myReservations.length),'Reservas activas','▦',''],[String(myGuests.length),'Invitados registrados','♧','green'],[currentHome||'—','Vivienda asignada','⌂','amber'],['0','Pagos pendientes','$','red']]:
 [[String(users.length),'Usuarios registrados','♙',''],[String(new Set(users.filter(u=>u[4]&&u[4]!=='—').map(u=>u[4])).size),'Viviendas registradas','⌂','green'],[String(users.filter(u=>u[3]==='Residente').length),'Residentes','♧','amber'],[String(users.filter(u=>u[3]==='Seguridad').length),'Personal de seguridad','⬡','']];
$('#homeStats').innerHTML=stats.map(s=>`<div class="stat-card"><div class="stat-icon ${s[3]}">${s[2]}</div><div><strong>${s[0]}</strong><small>${s[1]}</small></div></div>`).join('');
let visibleAudit=currentRole==='resident'?audit.filter(a=>a[5]===currentEmail):currentRole==='security'?audit.filter(a=>a[1]!=='Reserva'):audit;
const activity=visibleAudit.slice(0,3).map(a=>[a[3],a[2],a[0],a[4]]);
$('#recentActivity').innerHTML=activity.length?activity.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td><span class="tag green">${r[3]}</span></td></tr>`).join(''):'<tr><td colspan="4" class="empty-state">Aún no hay actividad registrada.</td></tr>';
let acts=currentRole==='resident'?[['▦','Reservar zona común','reservations'],['♧','Registrar invitado','guests'],['◉','Ver mi perfil','profile']]:currentRole==='security'?[['⬡','Ver autorizaciones','security'],['▣','Consultar parqueaderos','parking'],['⇄','Ver movimientos','audit']]:[['♙','Gestionar usuarios','users'],['▣','Ver parqueaderos','parking'],['▤','Consultar auditoría','audit']];
$('#quickActions').innerHTML=acts.map(a=>`<button class="quick-action" data-page="${a[2]}"><span>${a[0]}</span>${a[1]}</button>`).join('');
$('#quickActions').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));
}
function renderUsers(){const q=($('#userSearch')?.value||'').toLowerCase(),r=$('#userRoleFilter')?.value||'all';const rows=users.filter(u=>(r==='all'||u[3]===r)&&u.join(' ').toLowerCase().includes(q));$('#usersTable').innerHTML=rows.length?rows.map(u=>`<tr>${u.map((v,i)=>`<td>${i===3?`<span class="tag ${v==='Residente'?'blue':'gray'}">${v}</span>`:i===5?`<span class="tag green">${v}</span>`:v}</td>`).join('')}<td>—</td></tr>`).join(''):'<tr><td colspan="7" class="empty-state">No hay usuarios registrados.</td></tr>'}
$('#userSearch').addEventListener('input',renderUsers);$('#userRoleFilter').addEventListener('change',renderUsers);$('#newUserBtn').addEventListener('click',()=>$('#userFormPanel').classList.remove('hidden'));$('#cancelNewUser').addEventListener('click',()=>$('#userFormPanel').classList.add('hidden'));$('#newUserRole').addEventListener('change',()=>{const resident=$('#newUserRole').value==='RESIDENTE';$('#newUserHomeField').classList.toggle('hidden',!resident);$('#newUserHome').required=resident});$('#userCreateForm').addEventListener('submit',e=>{e.preventDefault();const role=$('#newUserRole').value,email=$('#newUserEmail').value.trim().toLowerCase(),expected=role==='RESIDENTE'?'@res':'@segu';if(!(role==='SEGURIDAD'?(email.endsWith('@segu')||email.endsWith('@seguridad')):email.endsWith(expected))){showModal('Registro no válido','Correo o dependencia inválida.','!');return}const home=role==='RESIDENTE'?$('#newUserHome').value.trim():'—';if(role==='RESIDENTE'&&users.filter(u=>u[4]===home&&u[3]==='Residente').length>=2){showModal('Límite alcanzado','La vivienda ya cuenta con el máximo de residentes activos.','!');return}if(users.some(u=>u[1]===$('#newUserDoc').value.trim()||u[2]===email)){showModal('Registro no válido','No fue posible completar el registro.','!');return}users.push([$('#newUserName').value.trim()+' '+$('#newUserLast').value.trim(),$('#newUserDoc').value.trim(),email,role==='RESIDENTE'?'Residente':'Seguridad',home,'Activo',$('#newUserPhone').value.trim()]);renderUsers();renderHome();$('#userCreateForm').reset();$('#userFormPanel').classList.add('hidden');showModal('Usuario creado','El usuario quedó agregado a esta sesión de demostración.');});
function renderGuests(){
  const q=($('#guestSearch')?.value||'').trim().toLowerCase();
  const status=$('#guestStatusFilter')?.value||'all';

  // A residente se le muestran exclusivamente los invitados cuyo propietario
  // coincide exactamente con el correo de la sesión activa. Los registros
  // antiguos sin propietario identificado no se muestran a ningún residente.
  const visibleGuests=currentRole==='resident'
    ? guests.filter(g=>(g.residentEmail||'').trim().toLowerCase()===currentEmail.trim().toLowerCase())
    : guests;

  const rows=visibleGuests.filter(g=>
    (status==='all'||g.status===status) &&
    [g.name,g.doc,g.plate,g.date,g.status,g.home,g.resident].join(' ').toLowerCase().includes(q)
  );

  $('#guestsTable').innerHTML=rows.length
    ? rows.map(g=>`<tr><td>${g.name}</td><td>${g.doc}</td><td>${g.plate}</td><td>${g.date}</td><td><span class="tag ${g.status==='Pendiente'?'amber':g.status==='Ingreso aprobado'?'green':'gray'}">${g.status}</span></td></tr>`).join('')
    : '<tr><td colspan="5" class="empty-state">No hay invitados registrados.</td></tr>';
}
$('#guestSearch').addEventListener('input',renderGuests);$('#guestStatusFilter').addEventListener('change',renderGuests);$('#newGuestBtn').addEventListener('click',()=>$('#guestForm').classList.toggle('hidden'));$('#cancelGuest').addEventListener('click',()=>$('#guestForm').classList.add('hidden'));$('#guestVehicle').addEventListener('change',()=>$('#plateField').classList.toggle('hidden',!$('#guestVehicle').checked));$('#guestCreateForm').addEventListener('submit',e=>{e.preventDefault();const name=$('#guestFirst').value+' '+$('#guestLast').value;guests.unshift({name,doc:$('#guestDoc').value,plate:$('#guestVehicle').checked?$('#guestPlate').value.toUpperCase():'—',home:currentHome,resident:currentDisplayName,residentEmail:currentEmail.trim().toLowerCase(),date:$('#guestDate').value+' '+$('#guestTime').value,status:'Pendiente'});renderGuests();renderSecurity();renderHome();$('#guestCreateForm').reset();$('#plateField').classList.add('hidden');$('#guestForm').classList.add('hidden');showModal('Invitado registrado','La autorización quedó asociada a tu vivienda y disponible para consulta por Seguridad.');});
function renderSecurity(){const pending=guests.filter(g=>g.status==='Pendiente').length;$('#securityStats').innerHTML=[[String(guests.length),'Visitantes registrados','♧',''],[String(guests.filter(g=>g.plate!=='—').length),'Vehículos autorizados','▣','green'],[String(pending),'Pendientes de validar','◷','amber'],['0','Novedades','⚑','red']].map(s=>`<div class="stat-card"><div class="stat-icon ${s[3]}">${s[2]}</div><div><strong>${s[0]}</strong><small>${s[1]}</small></div></div>`).join('');const q=($('#securitySearch')?.value||'').toLowerCase(),f=$('#securityFilter')?.value||'Pendiente';const rows=guests.filter(g=>(f==='all'||g.status===f)&&Object.values(g).join(' ').toLowerCase().includes(q));$('#securityTable').innerHTML=rows.length?rows.map(g=>`<tr><td><b>${g.name}</b></td><td>${g.doc}</td><td>${g.plate}</td><td><b>${g.home}</b><br><small>${g.resident}</small></td><td>${g.date}</td><td><span class="tag ${g.status==='Pendiente'?'amber':g.status==='Ingreso aprobado'?'green':'gray'}">${g.status}</span></td><td>${g.status==='Pendiente'?`<button class="btn primary approve" data-name="${g.name}" style="padding:7px 9px;font-size:10px">✓ Aprobar</button>`:'—'}</td></tr>`).join(''):'<tr><td colspan="7" class="empty-state">No hay autorizaciones registradas.</td></tr>'; $('#securityTable').querySelectorAll('.approve').forEach(b=>b.addEventListener('click',()=>approveGuest(b.dataset.name)));$('#securityMovements').innerHTML=audit.length?audit.slice(0,3).map(a=>`<div class="movement"><div><b>${a[2]}</b><small>${a[3]}</small></div><span>${a[0].split(' ')[1]||''}</span></div>`).join(''):'<p class="empty-state">Sin movimientos registrados.</p>'}
function approveGuest(name){
  const g=guests.find(x=>x.name===name);
  if(!g||g.status!=='Pendiente')return;
  let assignedSlot=null;
  const arrivesByCar=g.plate&&g.plate!=='—';
  if(arrivesByCar){
    assignedSlot=parkingSlots.find(slot=>!slot.occupiedBy);
    if(!assignedSlot){
      showModal('No hay parqueaderos disponibles','No se puede aprobar el ingreso del vehículo porque todos los parqueaderos de visitantes están ocupados. Registra o libera un espacio antes de continuar.','!');
      return;
    }
    assignedSlot.occupiedBy=g.doc;
    assignedSlot.guestName=g.name;
    assignedSlot.plate=g.plate;
    assignedSlot.home=g.home;
    assignedSlot.resident=g.resident;
    assignedSlot.entryAt=new Date().toLocaleString('es-CO');
    g.parkingCode=assignedSlot.code;
  }
  g.status='Ingreso aprobado';
  const stamp=new Date().toLocaleString('es-CO');
  const detail=arrivesByCar?`${g.name} · Placa ${g.plate} · Casa ${g.home} · Parqueadero ${assignedSlot.code}`:`${g.name} · Casa ${g.home}`;
  audit.unshift([stamp,'Seguridad','Ingreso aprobado',detail,'Exitoso']);
  renderSecurity();renderGuests();renderAudit();renderHome();renderParking();
  showModal('Ingreso aprobado',arrivesByCar
    ?`Se autorizó el ingreso de ${g.name}. Se asignó el parqueadero ${assignedSlot.code}. Placa: ${g.plate}. Vivienda: ${g.home}.`
    :`Se autorizó el ingreso de ${g.name}. El visitante no requiere parqueadero.`);
}
$('#securitySearch').addEventListener('input',renderSecurity);$('#securityFilter').addEventListener('change',renderSecurity);$('#refreshAuth').addEventListener('click',()=>{renderSecurity();showModal('Información actualizada','Se ha actualizado la lista de autorizaciones.','↻')});$('#manualEntry').addEventListener('click',()=>showModal('Ingreso manual','El ingreso manual debe estar sujeto al procedimiento de verificación definido por la administración. Registra el evento en auditoría.','＋'));$('#parkingQuick').addEventListener('click',()=>go('parking'));$('#incidentQuick').addEventListener('click',()=>showModal('Reportar novedad','Formulario de novedades pendiente de definición funcional.','⚑'));
function renderParking(){
  const occupied=parkingSlots.filter(slot=>Boolean(slot.occupiedBy)).length;
  const free=parkingSlots.length-occupied;
  $('#parkingStats').innerHTML=[
    [String(parkingSlots.length),'Espacios registrados','▣',''],
    [String(free),'Disponibles','✓','green'],
    [String(occupied),'Ocupados','▤','amber']
  ].map(s=>`<div class="stat-card"><div class="stat-icon ${s[3]}">${s[2]}</div><div><strong>${s[0]}</strong><small>${s[1]}</small></div></div>`).join('');
  const addButton=$('#addParkingBtn');
  if(addButton)addButton.classList.toggle('hidden',currentRole!=='admin');
  $('#parkingGrid').innerHTML=parkingSlots.length?parkingSlots.map(slot=>slot.occupiedBy
    ?`<article class="parking-slot busy"><strong>${slot.code}</strong><span class="tag amber">OCUPADO</span><div class="parking-occupant"><b>${slot.guestName}</b><small>Placa: ${slot.plate}</small><small>Vivienda: ${slot.home}</small><small>Residente: ${slot.resident}</small><small>Ingreso: ${slot.entryAt}</small><button class="btn secondary releaseParking" data-code="${slot.code}" style="margin-top:10px;padding:7px 10px;font-size:11px">Registrar salida</button></div></article>`
    :`<article class="parking-slot"><strong>${slot.code}</strong><span class="tag green">DISPONIBLE</span><small>Espacio libre para visitantes</small></article>`
  ).join(''):'<p class="empty-state">No hay espacios registrados. El administrador debe registrar los parqueaderos disponibles para visitantes.</p>';
  $('#parkingGrid').querySelectorAll('.releaseParking').forEach(button=>button.addEventListener('click',()=>releaseParking(button.dataset.code)));
}
function releaseParking(code){
  const slot=parkingSlots.find(item=>item.code===code);
  if(!slot||!slot.occupiedBy)return;
  const guest=guests.find(g=>g.doc===slot.occupiedBy);
  if(guest){guest.status='Finalizado';guest.parkingCode=null;}
  const detail=`${slot.guestName} · Placa ${slot.plate} · Casa ${slot.home} · Parqueadero ${slot.code}`;
  audit.unshift([new Date().toLocaleString('es-CO'),'Seguridad','Salida registrada',detail,'Exitoso']);
  slot.occupiedBy=null;slot.guestName=null;slot.plate=null;slot.home=null;slot.resident=null;slot.entryAt=null;
  renderParking();renderSecurity();renderGuests();renderAudit();renderHome();
  showModal('Salida registrada',`Se registró la salida del vehículo ${slot.code}. El parqueadero quedó disponible.`);
}
$('#addParkingBtn')?.addEventListener('click',()=>$('#parkingFormPanel').classList.remove('hidden'));
$('#cancelParking')?.addEventListener('click',()=>$('#parkingFormPanel').classList.add('hidden'));
$('#parkingCreateForm')?.addEventListener('submit',e=>{
  e.preventDefault();
  const code=$('#parkingCode').value.trim().toUpperCase();
  if(parkingSlots.some(slot=>slot.code===code)){showModal('Espacio duplicado','Ese identificador de parqueadero ya está registrado.','!');return;}
  parkingSlots.push({code,occupiedBy:null,guestName:null,plate:null,home:null,resident:null,entryAt:null});
  $('#parkingCreateForm').reset();$('#parkingFormPanel').classList.add('hidden');renderParking();
  showModal('Parqueadero registrado',`El espacio ${code} quedó disponible para visitantes.`);
});
function renderAudit(){const q=($('#auditSearch')?.value||'').toLowerCase();const rows=audit.filter(a=>a.join(' ').toLowerCase().includes(q));$('#auditTable').innerHTML=rows.length?rows.map(a=>`<tr>${a.map((v,i)=>`<td>${i===4?`<span class="tag green">${v}</span>`:v}</td>`).join('')}</tr>`).join(''):'<tr><td colspan="5" class="empty-state">No hay registros de auditoría.</td></tr>'}
$('#auditSearch').addEventListener('input',renderAudit);
$$('[data-page]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));
let calendarMonth=new Date();calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth(),1);
function calendarOccupiedDates(space,year,month){
  const daysInMonth=new Date(year,month+1,0).getDate();
  const seedText=`${space}-${year}-${month}`;
  let seed=0;for(let i=0;i<seedText.length;i++)seed=(seed*31+seedText.charCodeAt(i))>>>0;
  const picked=new Set();
  while(picked.size<Math.min(3,Math.max(1,Math.floor(daysInMonth/12)))){
    seed=(seed*1664525+1013904223)>>>0;
    const day=1+(seed%daysInMonth);
    if(new Date(year,month,day).getDay()!==0)picked.add(day);
  }
  reservations.filter(r=>r.space===space&&r.status==='CONFIRMADA').forEach(r=>{
    const d=new Date(`${r.date}T12:00:00`);
    if(d.getFullYear()===year&&d.getMonth()===month)picked.add(d.getDate());
  });
  return picked;
}
function renderReservationCalendar(){
  const title=$('#reservationTitle').textContent.replace(/^Reservar\s+/,'').trim();
  const year=calendarMonth.getFullYear(),month=calendarMonth.getMonth();
  $('#calendarMonth').textContent=calendarMonth.toLocaleDateString('es-CO',{month:'long',year:'numeric'});
  const firstDay=(new Date(year,month,1).getDay()+6)%7,days=new Date(year,month+1,0).getDate();
  const occupied=calendarOccupiedDates(title,year,month),selected=$('#reservationDate').value;
  const todayStart=new Date();todayStart.setHours(0,0,0,0);
  let html='';for(let i=0;i<firstDay;i++)html+='<span class="calendar-empty"></span>';
  for(let day=1;day<=days;day++){
    const date=new Date(year,month,day),iso=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const isOccupied=occupied.has(day),past=date<todayStart;
    html+=`<button type="button" class="calendar-day ${isOccupied?'occupied':''} ${selected===iso?'selected':''}" data-date="${iso}" ${isOccupied||past?'disabled':''} title="${isOccupied?'Día ocupado':past?'Fecha pasada':'Seleccionar fecha'}">${day}</button>`;
  }
  $('#calendarDays').innerHTML=html;
  $('#calendarDays').querySelectorAll('.calendar-day:not(:disabled)').forEach(btn=>btn.addEventListener('click',()=>{
    $('#reservationDate').value=btn.dataset.date;
    renderReservationCalendar();
  }));
  $('#calendarPrev').disabled=year===todayStart.getFullYear()&&month===todayStart.getMonth();
}
$('#calendarPrev').addEventListener('click',()=>{calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()-1,1);renderReservationCalendar()});
$('#calendarNext').addEventListener('click',()=>{calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,1);renderReservationCalendar()});
const RESERVATION_OPEN='08:00',RESERVATION_CLOSE='22:00';
function validateReservationHours(){
  const start=$('#startTime').value,end=$('#endTime').value;
  const warning=$('#reservationTimeWarning');
  const invalid=Boolean(start&&end&&(start<RESERVATION_OPEN||end>RESERVATION_CLOSE));
  warning.classList.toggle('hidden',!invalid);
  return !invalid;
}
$('#startTime').addEventListener('change',validateReservationHours);
$('#endTime').addEventListener('change',validateReservationHours);
$$('.reserveBtn').forEach(b=>b.addEventListener('click',()=>{$('#reservationTitle').textContent='Reservar '+b.dataset.space;$('#reservationDate').value='';calendarMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);renderReservationCalendar();validateReservationHours();$('#reservationForm').classList.remove('hidden');$('#reservationForm').scrollIntoView({behavior:'smooth',block:'center'})}));$$('.infoBtn').forEach(b=>b.addEventListener('click',()=>showModal(b.dataset.space,'Consulta informativa: el horario general está pendiente de configuración. Piscina y Sauna no requieren reserva.','◷')));$('#cancelReservation').addEventListener('click',()=>$('#reservationForm').classList.add('hidden'));$('#confirmReservation').addEventListener('click',()=>{
  const date=$('#reservationDate').value;
  const start=$('#startTime').value;
  const end=$('#endTime').value;
  const title=$('#reservationTitle').textContent.replace(/^Reservar\s+/,'').trim();
  if(!date||!start||!end){showModal('Datos incompletos','No fue posible completar la reserva.','!');return}
  const pickedDate=new Date(`${date}T12:00:00`);
  if(calendarOccupiedDates(title,pickedDate.getFullYear(),pickedDate.getMonth()).has(pickedDate.getDate())){showModal('Día ocupado','La fecha seleccionada no está disponible para esta zona común. Elige otro día marcado como disponible.','!');return}
  if(!validateReservationHours()){showModal('Fuera del horario permitido','Las reservas de esta zona común solo se permiten entre las 8:00 a. m. y las 10:00 p. m. Ajusta la hora inicial y final.','!');return}
  if(end<=start){showModal('Horario no válido','No fue posible completar la reserva.','!');return}
  const conflict=reservations.some(r=>r.space===title&&r.date===date&&start<r.end&&end>r.start);
  if(conflict){showModal('Zona común ocupada','El espacio seleccionado ya está reservado para ese día y horario. Selecciona otro horario o fecha.','!');return}
  reservations.push({space:title,date,start,end,resident:currentDisplayName,residentEmail:currentEmail,home:currentHome,status:'CONFIRMADA',payment:'APROBADO'});
  audit.unshift([new Date().toLocaleString('es-CO'),'Reserva',title+' · '+date+' '+start+'–'+end,currentDisplayName,'Confirmada',currentEmail]);
  $('#reservationForm').classList.add('hidden');
  $('#reservationDate').value='';
  renderReservationCalendar();
  $('#startTime').value='14:00';
  $('#endTime').value='18:00';
  renderHome();renderAudit();
  showModal('¡Reserva confirmada!','Tu reserva de '+title+' quedó aprobada. Pago simulado de $100.000 COP realizado correctamente.','✓');
});
$('#closeModal').addEventListener('click',()=>$('#modal').classList.add('hidden'));$('#modalOk').addEventListener('click',()=>$('#modal').classList.add('hidden'));$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')$('#modal').classList.add('hidden')});
