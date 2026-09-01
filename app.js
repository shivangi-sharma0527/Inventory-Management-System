(() => {
  'use strict';

  /* Auspify HRMS - frontend-only version
     All data is stored in browser localStorage because this project is intentionally
     limited to HTML, CSS and JavaScript. */

  const KEY = {
    version: 'auspify_hrms_version',
    employees: 'auspify_hrms_employees_v3',
    departments: 'auspify_hrms_departments_v3',
    users: 'auspify_hrms_users_v3',
    session: 'auspify_hrms_session_v3',
    settings: 'auspify_hrms_settings_v3'
  };
  const VERSION = '3.0';

  const seedDepartments = [
    { id:'d1', name:'Engineering', head:'Ananya Rao', description:'Product engineering, platforms and technical delivery.' },
    { id:'d2', name:'Human Resources', head:'Meera Kapoor', description:'People operations, culture and employee experience.' },
    { id:'d3', name:'Finance', head:'Rahul Mehta', description:'Financial planning, accounting and business controls.' },
    { id:'d4', name:'Sales', head:'Arjun Malhotra', description:'Customer growth, partnerships and revenue operations.' },
    { id:'d5', name:'Marketing', head:'Ishita Nair', description:'Brand, campaigns, communications and demand generation.' },
    { id:'d6', name:'Operations', head:'Vikram Singh', description:'Business operations, administration and facilities.' }
  ];

  const seedEmployees = [
    ['Aarav','Sharma','aarav.sharma@auspify.com','+91 98765 10234','Engineering','Senior Software Engineer','2022-04-18','Active','Bengaluru','Full-time','Platform team'],
    ['Diya','Patel','diya.patel@auspify.com','+91 98210 44211','Human Resources','HR Business Partner','2023-01-09','Active','Mumbai','Full-time',''],
    ['Rohan','Verma','rohan.verma@auspify.com','+91 98111 20342','Sales','Account Executive','2024-03-25','Active','Delhi','Full-time','Enterprise accounts'],
    ['Sneha','Iyer','sneha.iyer@auspify.com','+91 99008 33210','Marketing','Marketing Manager','2021-08-12','On Leave','Bengaluru','Full-time',''],
    ['Kabir','Joshi','kabir.joshi@auspify.com','+91 98700 55120','Engineering','Frontend Developer','2024-07-01','Active','Pune','Full-time','Design systems'],
    ['Neha','Shah','neha.shah@auspify.com','+91 98190 78121','Finance','Financial Analyst','2023-10-16','Active','Mumbai','Full-time',''],
    ['Aditya','Nair','aditya.nair@auspify.com','+91 97455 21987','Operations','Operations Lead','2020-06-22','Active','Kochi','Full-time','Facilities & admin'],
    ['Megha','Gupta','megha.gupta@auspify.com','+91 99888 12031','Engineering','QA Engineer','2024-11-04','Active','Noida','Full-time','Automation'],
    ['Karan','Bose','karan.bose@auspify.com','+91 98310 11421','Sales','Sales Development Rep','2025-02-17','Active','Kolkata','Full-time',''],
    ['Tanya','Sethi','tanya.sethi@auspify.com','+91 98100 44321','Marketing','Content Strategist','2024-05-13','Active','Delhi','Contract',''],
    ['Vivek','Reddy','vivek.reddy@auspify.com','+91 98490 77321','Operations','Business Analyst','2025-01-20','Active','Hyderabad','Full-time','Process improvement']
  ].map((x,i) => ({
    id:'e'+(i+1), firstName:x[0], lastName:x[1], email:x[2], phone:x[3], department:x[4], role:x[5],
    joiningDate:x[6], status:x[7], location:x[8], type:x[9], notes:x[10]
  }));

  const demoAdmin = {
    id:'u_admin', firstName:'Raj', lastName:'Sharma', email:'admin@auspify.com',
    company:'Auspify Technologies', role:'Administrator', password:'Admin@123', createdAt:'2026-01-10T10:00:00.000Z'
  };

  const $ = id => document.getElementById(id);
  const clone = value => JSON.parse(JSON.stringify(value));
  const safeArray = (value, fallback) => Array.isArray(value) ? value : clone(fallback);

  function load(key, fallback) {
    try { const value = localStorage.getItem(key); return value === null ? clone(fallback) : JSON.parse(value); }
    catch { return clone(fallback); }
  }
  function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function uid(prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  function esc(value='') {
    return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }
  function employeeName(e) { return `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Unnamed employee'; }
  function initials(e) { return `${(e.firstName||'')[0]||''}${(e.lastName||'')[0]||''}`.toUpperCase() || 'U'; }
  function formatDate(value) {
    if (!value) return '—';
    const d = new Date(String(value).length === 10 ? value + 'T00:00:00' : value);
    return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',year:'numeric'}).format(d);
  }
  function toast(message, type='success') {
    const container = $('toastContainer');
    if (!container) return;
    const node = document.createElement('div'); node.className = `toast ${type}`; node.textContent = message;
    container.appendChild(node); setTimeout(() => node.remove(), 3200);
  }

  // v3 keys intentionally isolate this build from older broken localStorage data.
  if (localStorage.getItem(KEY.version) !== VERSION) localStorage.setItem(KEY.version, VERSION);

  let state = {
    page:'dashboard', search:'', status:'All', department:'All', deptSearch:'', empPage:1,
    reportFilter:'All', settingsTab:'general', pending:null, user:null,
    employees: safeArray(load(KEY.employees, seedEmployees), seedEmployees),
    departments: safeArray(load(KEY.departments, seedDepartments), seedDepartments),
    users: safeArray(load(KEY.users, [demoAdmin]), [demoAdmin]),
    settings: Object.assign({emailAlerts:true, compactMode:false}, load(KEY.settings, {}))
  };

  // Normalize old/missing records so one bad record cannot break the Employees page.
  state.employees = state.employees.map((e,i) => ({
    id:e.id || uid('e'), firstName:e.firstName || '', lastName:e.lastName || '', email:e.email || '', phone:e.phone || '',
    department:e.department || state.departments[0]?.name || 'Unassigned', role:e.role || 'Employee', joiningDate:e.joiningDate || '',
    status:['Active','On Leave','Inactive'].includes(e.status) ? e.status : 'Active', location:e.location || '',
    type:e.type || 'Full-time', notes:e.notes || ''
  }));
  state.departments = state.departments.map((d,i) => ({ id:d.id || uid('d'), name:d.name || `Department ${i+1}`, head:d.head || '', description:d.description || '' }));
  state.users = state.users.length ? state.users : [clone(demoAdmin)];
  save(KEY.employees,state.employees); save(KEY.departments,state.departments); save(KEY.users,state.users); save(KEY.settings,state.settings);

  function currentSession() {
    try {
      const raw = sessionStorage.getItem(KEY.session) || localStorage.getItem(KEY.session);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  function setSession(user, remember) {
    const payload = JSON.stringify({id:user.id,email:user.email});
    sessionStorage.removeItem(KEY.session); localStorage.removeItem(KEY.session);
    (remember ? localStorage : sessionStorage).setItem(KEY.session,payload);
  }
  function clearSession() { sessionStorage.removeItem(KEY.session); localStorage.removeItem(KEY.session); }

  function authPanel(panel) {
    ['loginPanel','signupPanel','forgotPanel'].forEach(id => $(id)?.classList.toggle('hidden', id !== panel));
  }
  function openModal(id) { $(id)?.classList.remove('hidden'); }
  function closeModal(id) { $(id)?.classList.add('hidden'); }
  function updateUserHeader() {
    if (!state.user) return;
    $('topUserName').textContent = employeeName(state.user);
    $('topCompany').textContent = state.user.company || state.user.role || 'Administrator';
    $('topAvatar').textContent = initials(state.user);
  }
  function login(user, remember=false) {
    state.user = user; setSession(user,remember);
    $('authView').classList.add('hidden'); $('appView').classList.remove('hidden');
    updateUserHeader(); render();
  }
  function logout() {
    clearSession(); state.user = null;
    $('appView').classList.add('hidden'); $('authView').classList.remove('hidden');
    $('loginPassword').value=''; authPanel('loginPanel'); toast('Signed out successfully');
  }

  function header(title, description, actions='') {
    return `<div class="page-header"><div><h1>${title}</h1><p>${description}</p></div><div class="header-actions">${actions}</div></div>`;
  }
  function stat(label,value,icon,sub) {
    return `<div class="stat-card"><div><div class="label">${esc(label)}</div><div class="value">${value}</div><div class="trend">${esc(sub)}</div></div><div class="stat-icon">${icon}</div></div>`;
  }
  function statusClass(status) { return status === 'Active' ? 'active' : status === 'On Leave' ? 'on-leave' : 'inactive'; }

  function dashboard() {
    const total=state.employees.length, active=state.employees.filter(e=>e.status==='Active').length, leave=state.employees.filter(e=>e.status==='On Leave').length;
    const latest=[...state.employees].sort((a,b)=>(b.joiningDate||'').localeCompare(a.joiningDate||'')).slice(0,5);
    const months=['Apr','May','Jun','Jul','Aug','Sep'];
    const counts=months.map((_,i)=>Math.max(1,Math.round(total*(0.55+i*0.08))));
    const max=Math.max(...counts,1);
    return header(`Good morning, ${esc(state.user.firstName)} 👋`,'Here’s what’s happening across your organization today.',`<button class="secondary-btn" data-action="export">⇩ Export</button><button class="primary-btn" data-action="addEmployee">+ Add employee</button>`)+
      `<div class="stats-grid">${stat('Total employees',total,'♙','All employee records')}${stat('Active employees',active,'✓','Currently working')}${stat('Departments',state.departments.length,'▦','Organization units')}${stat('On leave',leave,'◷','Needs attention')}</div>
      <div class="dashboard-grid"><section class="card"><div class="card-head"><div><h3>Employee growth</h3><p>Workforce overview · last 6 months</p></div><button class="link-btn" data-nav="reports">View report →</button></div><div class="chart-area"><div class="bar-chart">${counts.map((n,i)=>`<div class="bar"><i style="height:${Math.round(n/max*82)}%"></i><small>${months[i]}</small></div>`).join('')}</div></div></section>
      <section class="card"><div class="card-head"><div><h3>Departments</h3><p>Headcount by department</p></div><button class="link-btn" data-nav="departments">Manage →</button></div><div class="department-list">${state.departments.map(d=>`<div class="dept-row"><div class="dept-dot">${esc(d.name.slice(0,2).toUpperCase())}</div><div class="dept-info"><strong>${esc(d.name)}</strong><small>${esc(d.head||'Not assigned')}</small></div><div class="dept-count">${state.employees.filter(e=>e.department===d.name).length}</div></div>`).join('')}</div></section></div>
      <section class="card" style="margin-top:18px"><div class="card-head"><div><h3>Recently joined</h3><p>Latest employee registrations</p></div><button class="link-btn" data-nav="employees">View all →</button></div><div class="table-scroll"><table class="recent-table"><thead><tr><th>Employee</th><th>Department</th><th>Role</th><th>Joining date</th><th>Status</th></tr></thead><tbody>${latest.map(e=>`<tr><td><div class="employee-cell"><div class="avatar avatar-table">${initials(e)}</div><div><strong>${esc(employeeName(e))}</strong><small>${esc(e.email)}</small></div></div></td><td>${esc(e.department)}</td><td>${esc(e.role)}</td><td>${formatDate(e.joiningDate)}</td><td><span class="status ${statusClass(e.status)}">${esc(e.status)}</span></td></tr>`).join('')}</tbody></table></div></section>`;
  }

  function employees() {
    const term=state.search.trim().toLowerCase();
    const filtered=state.employees.filter(e=>{
      const hay=[employeeName(e),e.email,e.phone,e.role,e.department,e.location,e.type].join(' ').toLowerCase();
      return (!term || hay.includes(term)) && (state.status==='All'||e.status===state.status) && (state.department==='All'||e.department===state.department);
    });
    const perPage=8, totalPages=Math.max(1,Math.ceil(filtered.length/perPage));
    state.empPage=Math.min(Math.max(1,state.empPage),totalPages);
    const start=(state.empPage-1)*perPage, rows=filtered.slice(start,start+perPage), end=start+rows.length;
    const pagination=Array.from({length:totalPages},(_,i)=>`<button class="page-btn ${state.empPage===i+1?'active':''}" data-emp-page="${i+1}">${i+1}</button>`).join('');
    return header('Employees','Manage employee records, roles and employment details.',`<button class="secondary-btn" data-action="export">⇩ Export CSV</button><button class="primary-btn" data-action="addEmployee">+ Add employee</button>`)+
      `<section class="card table-card"><div class="table-toolbar"><div class="toolbar-left"><div class="search-box"><span>⌕</span><input id="empSearch" value="${esc(state.search)}" placeholder="Search employees..." aria-label="Search employees"></div></div><div class="toolbar-right"><select id="empDept" class="filter-select"><option value="All">All departments</option>${state.departments.map(d=>`<option value="${esc(d.name)}" ${state.department===d.name?'selected':''}>${esc(d.name)}</option>`).join('')}</select><select id="empStatus" class="filter-select"><option value="All">All statuses</option><option value="Active" ${state.status==='Active'?'selected':''}>Active</option><option value="On Leave" ${state.status==='On Leave'?'selected':''}>On Leave</option><option value="Inactive" ${state.status==='Inactive'?'selected':''}>Inactive</option></select></div></div>
      ${rows.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>Employee</th><th>Department</th><th>Job title</th><th>Location</th><th>Joining date</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map(e=>`<tr><td><div class="employee-cell"><div class="avatar avatar-table">${initials(e)}</div><div><strong>${esc(employeeName(e))}</strong><small>${esc(e.email)}</small></div></div></td><td>${esc(e.department)}</td><td>${esc(e.role)}</td><td>${esc(e.location||'—')}</td><td>${formatDate(e.joiningDate)}</td><td><span class="status ${statusClass(e.status)}">${esc(e.status)}</span></td><td><div class="actions"><button class="small-icon-btn" title="View employee" data-view="${e.id}">◉</button><button class="small-icon-btn" title="Edit employee" data-edit="${e.id}">✎</button><button class="small-icon-btn danger" title="Delete employee" data-del="${e.id}">×</button></div></td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state"><h3>No employees found</h3><p>${state.employees.length?'Try another search or filter.':'Add your first employee to start building your workforce.'}</p><button class="primary-btn" data-action="addEmployee">+ Add employee</button></div>`}
      <div class="table-footer"><span>Showing ${rows.length?start+1:0}–${end} of ${filtered.length} employees</span><div class="pagination"><button class="page-btn" data-emp-page="${Math.max(1,state.empPage-1)}" ${state.empPage===1?'disabled':''}>‹</button>${pagination}<button class="page-btn" data-emp-page="${Math.min(totalPages,state.empPage+1)}" ${state.empPage===totalPages?'disabled':''}>›</button></div></div></section>`;
  }

  function departments() {
    const term=(state.deptSearch||'').trim().toLowerCase();
    const list=state.departments.filter(d=>!term || [d.name,d.head,d.description].join(' ').toLowerCase().includes(term));
    return header('Departments','Organize teams and maintain department ownership.',`<button class="primary-btn" data-action="addDepartment">+ Add department</button>`)+
      `<div style="margin-bottom:17px"><div class="search-box"><span>⌕</span><input id="deptSearch" value="${esc(state.deptSearch||'')}" placeholder="Search departments..." aria-label="Search departments"></div></div><div class="dept-grid">${list.map(d=>{const c=state.employees.filter(e=>e.department===d.name).length;return `<article class="dept-card"><div class="dept-card-head"><div class="dept-avatar">${esc(d.name.slice(0,2).toUpperCase())}</div><div class="actions"><button class="small-icon-btn" title="Edit department" data-edit-dept="${d.id}">✎</button><button class="small-icon-btn danger" title="Delete department" data-del-dept="${d.id}">×</button></div></div><h3>${esc(d.name)}</h3><p>${esc(d.description||'No description provided.')}</p><div class="dept-meta"><span>Head <strong>${esc(d.head||'Not assigned')}</strong></span><span>Employees <strong>${c}</strong></span></div></article>`}).join('')}</div>${!list.length?`<div class="card empty-state"><h3>No departments found</h3><p>Try a different search or add a new department.</p></div>`:''}`;
  }

  function reports() {
    const data=state.reportFilter==='All'?state.employees:state.employees.filter(e=>e.status===state.reportFilter);
    const total=data.length, active=data.filter(e=>e.status==='Active').length, leave=data.filter(e=>e.status==='On Leave').length, inactive=data.filter(e=>e.status==='Inactive').length;
    const types={}; data.forEach(e=>types[e.type]=(types[e.type]||0)+1);
    return header('Reports','Generate, print and export workforce reports.',`<button class="secondary-btn" data-action="print">Print report</button><button class="primary-btn" data-action="export">Export CSV</button>`)+
      `<div class="table-toolbar card" style="margin-bottom:18px"><div><strong>Report scope</strong><small style="display:block;color:var(--muted);margin-top:4px">Choose which employee records are included.</small></div><select id="reportFilter" class="filter-select"><option value="All" ${state.reportFilter==='All'?'selected':''}>All employees</option><option value="Active" ${state.reportFilter==='Active'?'selected':''}>Active only</option><option value="On Leave" ${state.reportFilter==='On Leave'?'selected':''}>On leave only</option><option value="Inactive" ${state.reportFilter==='Inactive'?'selected':''}>Inactive only</option></select></div>
      <div class="reports-grid"><section class="card report-card"><h3>Workforce summary</h3><p>Current employee population by status.</p>${[['Total employees',total,''],['Active',active,total?Math.round(active/total*100)+'%':'0%'],['On leave',leave,total?Math.round(leave/total*100)+'%':'0%'],['Inactive',inactive,total?Math.round(inactive/total*100)+'%':'0%']].map(x=>`<div class="setting-row"><strong>${x[0]}</strong><strong>${x[1]} ${x[2]?`(${x[2]})`:''}</strong></div>`).join('')}</section>
      <section class="card report-card"><h3>Employment types</h3><p>Distribution by employment type.</p>${Object.keys(types).length?Object.entries(types).map(x=>`<div class="setting-row"><div><strong>${esc(x[0])}</strong><small>${total?Math.round(x[1]/total*100):0}% of report</small></div><strong>${x[1]}</strong></div>`).join(''):`<div class="empty-state">No data for this filter.</div>`}</section>
      <section class="card report-card"><h3>Department headcount</h3><p>Employees grouped by department.</p>${state.departments.map(d=>`<div class="setting-row"><strong>${esc(d.name)}</strong><strong>${data.filter(e=>e.department===d.name).length}</strong></div>`).join('')}</section>
      <section class="card report-card"><h3>Report actions</h3><p>Take your report outside the application.</p><div class="header-actions"><button class="primary-btn" data-action="export">Export employee CSV</button><button class="secondary-btn" data-action="print">Print</button></div></section></div>`;
  }

  function profile() {
    const u=state.user;
    return header('My profile','Manage your administrator account and organization information.',`<button class="primary-btn" data-action="editProfile">Edit profile</button>`)+
      `<section class="card profile-card"><div class="profile-identity"><div class="avatar large">${initials(u)}</div><h2>${esc(employeeName(u))}</h2><p>${esc(u.role||'Administrator')}</p></div><div class="profile-details"><div class="detail-box"><small>First name</small><strong>${esc(u.firstName)}</strong></div><div class="detail-box"><small>Last name</small><strong>${esc(u.lastName)}</strong></div><div class="detail-box"><small>Email</small><strong>${esc(u.email)}</strong></div><div class="detail-box"><small>Company</small><strong>${esc(u.company)}</strong></div><div class="detail-box"><small>Role</small><strong>${esc(u.role||'Administrator')}</strong></div><div class="detail-box"><small>Account created</small><strong>${formatDate(u.createdAt)}</strong></div></div></section>`;
  }

  function settings() {
    const tab=state.settingsTab;
    let body='';
    if(tab==='general') body=`<h2>Workspace settings</h2><p>Control the way your HRMS workspace behaves in this browser.</p><div class="setting-row"><div><strong>Compact data tables</strong><small>Use a denser layout for employee and department tables.</small></div><button class="switch ${state.settings.compactMode?'on':''}" data-setting="compactMode" aria-label="Toggle compact tables"></button></div><div class="setting-row"><div><strong>Reset demo organization</strong><small>Restore the original sample employees and departments.</small></div><button class="danger-btn" data-action="reset">Reset data</button></div>`;
    if(tab==='notifications') body=`<h2>Notifications</h2><p>Choose which in-app alerts you want to see.</p><div class="setting-row"><div><strong>Email notifications</strong><small>Show alerts for important employee changes.</small></div><button class="switch ${state.settings.emailAlerts?'on':''}" data-setting="emailAlerts" aria-label="Toggle email notifications"></button></div><div class="card" style="background:#f7f9fc;margin-top:18px"><strong>Note</strong><p style="margin:5px 0 0;color:var(--muted)">Because this version uses only HTML, CSS and JavaScript, notifications are simulated inside the application.</p></div>`;
    if(tab==='security') body=`<h2>Security</h2><p>Manage the credentials for the account currently signed in.</p><div class="setting-row"><div><strong>Change password</strong><small>Update the password used for this browser account.</small></div><button class="secondary-btn" data-action="changePassword">Change password</button></div><div class="card" style="background:#f7f9fc;margin-top:18px"><strong>Frontend-only storage</strong><p style="margin:5px 0 0;color:var(--muted)">Account and HR data are stored locally in your browser. Connect a backend/database before using this for real company data.</p></div>`;
    return header('Settings','Configure your HRMS workspace.')+`<div class="settings-grid"><div class="settings-nav"><button class="settings-tab ${tab==='general'?'active':''}" data-settings-tab="general">General</button><button class="settings-tab ${tab==='notifications'?'active':''}" data-settings-tab="notifications">Notifications</button><button class="settings-tab ${tab==='security'?'active':''}" data-settings-tab="security">Security</button></div><section class="settings-panel">${body}</section></div>`;
  }

  function render() {
    if(!state.user) return;
    const pageFn={dashboard,employees,departments,reports,profile,settings}[state.page]||dashboard;
    $('pageTitle').textContent=state.page.charAt(0).toUpperCase()+state.page.slice(1);
    document.querySelectorAll('.nav-item[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===state.page));
    $('content').innerHTML=pageFn();
    if(state.settings.compactMode) document.body.classList.add('compact-mode'); else document.body.classList.remove('compact-mode');
  }

  function openEmployee(id='') {
    $('employeeForm').reset(); $('employeeId').value=id; $('employeeModalTitle').textContent=id?'Edit employee':'Add employee';
    $('employeeDepartment').innerHTML=state.departments.map(d=>`<option value="${esc(d.name)}">${esc(d.name)}</option>`).join('');
    if(id){
      const e=state.employees.find(x=>x.id===id); if(!e) return;
      $('firstName').value=e.firstName; $('lastName').value=e.lastName; $('employeeEmail').value=e.email; $('employeePhone').value=e.phone;
      $('employeeDepartment').value=e.department; $('employeeRole').value=e.role; $('employeeJoiningDate').value=e.joiningDate; $('employeeStatus').value=e.status;
      $('employeeLocation').value=e.location; $('employeeType').value=e.type; $('employeeNotes').value=e.notes;
    } else $('employeeJoiningDate').value=new Date().toISOString().slice(0,10);
    openModal('employeeModal'); setTimeout(()=>$('firstName').focus(),50);
  }
  function openDepartment(id='') {
    $('departmentForm').reset(); $('departmentId').value=id; $('departmentModalTitle').textContent=id?'Edit department':'Add department';
    if(id){const d=state.departments.find(x=>x.id===id);if(!d)return;$('departmentName').value=d.name;$('departmentHead').value=d.head;$('departmentDescription').value=d.description;}
    openModal('departmentModal'); setTimeout(()=>$('departmentName').focus(),50);
  }
  function openProfile() {
    const u=state.user; $('profileFirst').value=u.firstName; $('profileLast').value=u.lastName; $('profileEmail').value=u.email; $('profileCompany').value=u.company; $('profileRole').value=u.role||'Administrator'; openModal('profileEditModal');
  }
  function viewEmployee(id) {
    const e=state.employees.find(x=>x.id===id); if(!e)return;
    state.pending={type:'viewEmployee',id};
    $('confirmTitle').textContent=employeeName(e); $('confirmMessage').innerHTML=`<strong>${esc(e.role)}</strong><br>${esc(e.email)}<br><br><strong>Department:</strong> ${esc(e.department)}<br><strong>Phone:</strong> ${esc(e.phone||'—')}<br><strong>Location:</strong> ${esc(e.location||'—')}<br><strong>Employment:</strong> ${esc(e.type)}<br><strong>Joining date:</strong> ${formatDate(e.joiningDate)}<br><strong>Status:</strong> ${esc(e.status)}${e.notes?`<br><strong>Notes:</strong> ${esc(e.notes)}`:''}`;
    $('confirmBtn').textContent='Close'; $('confirmBtn').className='secondary-btn'; openModal('confirmModal');
  }
  function confirmDelete(type,id) {
    state.pending={type,id}; $('confirmBtn').textContent='Delete'; $('confirmBtn').className='danger-btn';
    if(type==='employee'){const e=state.employees.find(x=>x.id===id);$('confirmTitle').textContent='Delete employee?';$('confirmMessage').textContent=`Delete ${employeeName(e)}? This employee record will be permanently removed from this browser.`;}
    else {const d=state.departments.find(x=>x.id===id),count=state.employees.filter(e=>e.department===d?.name).length;$('confirmTitle').textContent='Delete department?';$('confirmMessage').textContent=count?`${d.name} has ${count} employee(s). Reassign or edit those employees before deleting this department.`:`Delete ${d?.name||'this department'}? This action cannot be undone.`;}
    openModal('confirmModal');
  }
  function resetData() {
    state.pending={type:'reset'}; $('confirmTitle').textContent='Reset demo data?'; $('confirmMessage').textContent='All employee and department changes will be replaced with the original Auspify sample data.'; $('confirmBtn').textContent='Reset'; $('confirmBtn').className='danger-btn'; openModal('confirmModal');
  }
  function changePassword() {
    const p=window.prompt('Enter a new password (minimum 8 characters):'); if(p===null)return;
    if(p.length<8){toast('Password must contain at least 8 characters','error');return;}
    const c=window.prompt('Confirm your new password:'); if(p!==c){toast('Passwords do not match','error');return;}
    state.users=state.users.map(u=>u.id===state.user.id?Object.assign({},u,{password:p}):u); save(KEY.users,state.users); state.user=state.users.find(u=>u.id===state.user.id); setSession(state.user,true); toast('Password changed successfully');
  }
  function exportCSV() {
    const headers=['ID','First Name','Last Name','Email','Phone','Department','Job Title','Joining Date','Status','Location','Employment Type','Notes'];
    const rows=state.employees.map(e=>[e.id,e.firstName,e.lastName,e.email,e.phone,e.department,e.role,e.joiningDate,e.status,e.location,e.type,e.notes]);
    const csv=[headers,...rows].map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}), url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download=`auspify-employees-${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); toast('Employee CSV exported successfully');
  }
  function printReport() {
    const rows=state.employees.map(e=>`<tr><td>${esc(employeeName(e))}</td><td>${esc(e.email)}</td><td>${esc(e.department)}</td><td>${esc(e.role)}</td><td>${formatDate(e.joiningDate)}</td><td>${esc(e.status)}</td></tr>`).join('');
    const w=window.open('','_blank'); if(!w){toast('Please allow pop-ups to print the report','error');return;}
    w.document.write(`<!doctype html><html><head><title>Auspify Employee Report</title><style>body{font:13px Arial,sans-serif;padding:30px;color:#172233}h1{color:#163a5f}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #dfe5ec;padding:8px;text-align:left}th{background:#f2f5f8}</style></head><body><h1>Auspify Employee Management System</h1><p>Generated: ${esc(new Date().toLocaleString('en-IN'))}</p><table><thead><tr><th>Employee</th><th>Email</th><th>Department</th><th>Role</th><th>Joining date</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=function(){window.print()}<\/script></body></html>`); w.document.close();
  }
  function performConfirm() {
    const p=state.pending; if(!p)return;
    if(p.type==='viewEmployee'){closeModal('confirmModal');return;}
    if(p.type==='reset'){
      state.employees=clone(seedEmployees);state.departments=clone(seedDepartments);state.search='';state.department='All';state.status='All';state.empPage=1;
      save(KEY.employees,state.employees);save(KEY.departments,state.departments);closeModal('confirmModal');render();toast('Demo data reset successfully');return;
    }
    if(p.type==='employee'){state.employees=state.employees.filter(e=>e.id!==p.id);save(KEY.employees,state.employees);toast('Employee deleted successfully');}
    if(p.type==='department'){
      const d=state.departments.find(x=>x.id===p.id); if(d && state.employees.some(e=>e.department===d.name)){toast('Cannot delete a department that still has employees','error');closeModal('confirmModal');return;}
      state.departments=state.departments.filter(d=>d.id!==p.id);save(KEY.departments,state.departments);toast('Department deleted successfully');
    }
    closeModal('confirmModal');state.pending=null;render();
  }

  // Permanent event delegation: navigation/buttons keep working after every re-render.
  document.addEventListener('click', e => {
    const nav=e.target.closest('[data-page],[data-nav]');
    if(nav){e.preventDefault();state.page=nav.dataset.page||nav.dataset.nav;state.empPage=1;document.querySelectorAll('.profile-dropdown').forEach(x=>x.classList.add('hidden'));render();if(window.innerWidth<900)$('sidebar')?.classList.remove('open');return;}
    const action=e.target.closest('[data-action]');
    if(action){
      const a=action.dataset.action;
      if(a==='addEmployee')openEmployee(); else if(a==='addDepartment')openDepartment(); else if(a==='editProfile')openProfile(); else if(a==='export')exportCSV(); else if(a==='print')printReport(); else if(a==='reset')resetData(); else if(a==='changePassword')changePassword();
      return;
    }
    const edit=e.target.closest('[data-edit]'); if(edit){openEmployee(edit.dataset.edit);return;}
    const del=e.target.closest('[data-del]'); if(del){confirmDelete('employee',del.dataset.del);return;}
    const view=e.target.closest('[data-view]'); if(view){viewEmployee(view.dataset.view);return;}
    const editD=e.target.closest('[data-edit-dept]'); if(editD){openDepartment(editD.dataset.editDept);return;}
    const delD=e.target.closest('[data-del-dept]'); if(delD){confirmDelete('department',delD.dataset.delDept);return;}
    const page=e.target.closest('[data-emp-page]'); if(page && !page.disabled){state.empPage=Number(page.dataset.empPage);render();return;}
    const tab=e.target.closest('[data-settings-tab]'); if(tab){state.settingsTab=tab.dataset.settingsTab;render();return;}
    const setting=e.target.closest('[data-setting]'); if(setting){const k=setting.dataset.setting;state.settings[k]=!state.settings[k];save(KEY.settings,state.settings);render();toast(`${k==='emailAlerts'?'Email notifications':'Compact tables'} ${state.settings[k]?'enabled':'disabled'}`);return;}
    const close=e.target.closest('[data-close]'); if(close){closeModal(close.dataset.close);state.pending=null;return;}
  });

  document.addEventListener('input', e => {
    if(e.target.id==='empSearch'){state.search=e.target.value;state.empPage=1;render();const el=$('empSearch');if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length);}}
    if(e.target.id==='deptSearch'){state.deptSearch=e.target.value;render();const el=$('deptSearch');if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length);}}
  });
  document.addEventListener('change', e => {
    if(e.target.id==='empDept'){state.department=e.target.value;state.empPage=1;render();}
    if(e.target.id==='empStatus'){state.status=e.target.value;state.empPage=1;render();}
    if(e.target.id==='reportFilter'){state.reportFilter=e.target.value;render();}
    if(e.target.matches('[data-setting]')){const k=e.target.dataset.setting;state.settings[k]=!state.settings[k];save(KEY.settings,state.settings);render();toast(`${k==='emailAlerts'?'Email notifications':'Compact tables'} ${state.settings[k]?'enabled':'disabled'}`);}
  });

  $('loginForm').addEventListener('submit',e=>{
    e.preventDefault();const email=$('loginEmail').value.trim().toLowerCase(),pass=$('loginPassword').value;
    const user=state.users.find(u=>String(u.email).toLowerCase()===email && u.password===pass);
    if(!user){toast('Invalid email or password','error');return;} login(user,$('rememberMe').checked);toast(`Welcome back, ${user.firstName}`);
  });
  $('signupForm').addEventListener('submit',e=>{
    e.preventDefault();const email=$('signupEmail').value.trim().toLowerCase(),p=$('signupPassword').value,c=$('signupConfirm').value;
    if(p.length<8){toast('Password must contain at least 8 characters','error');return;} if(p!==c){toast('Passwords do not match','error');return;}
    if(state.users.some(u=>String(u.email).toLowerCase()===email)){toast('An account with this email already exists','error');return;}
    const user={id:uid('u'),firstName:$('signupFirstName').value.trim(),lastName:$('signupLastName').value.trim(),email,company:$('signupCompany').value.trim(),role:'Administrator',password:p,createdAt:new Date().toISOString()};
    state.users.push(user);save(KEY.users,state.users);login(user,true);toast('Account created successfully');
  });
  $('forgotForm').addEventListener('submit',e=>{
    e.preventDefault();const email=$('forgotEmail').value.trim().toLowerCase(),p=$('forgotPassword').value,c=$('forgotConfirm').value,u=state.users.find(x=>String(x.email).toLowerCase()===email);
    if(!u){toast('No account found for this email','error');return;} if(p.length<8){toast('Password must contain at least 8 characters','error');return;} if(p!==c){toast('Passwords do not match','error');return;}
    u.password=p;save(KEY.users,state.users);authPanel('loginPanel');$('loginEmail').value=email;$('loginPassword').value='';toast('Password reset successfully');
  });
  $('employeeForm').addEventListener('submit',e=>{
    e.preventDefault();const id=$('employeeId').value, email=$('employeeEmail').value.trim().toLowerCase();
    if(state.employees.some(x=>String(x.email).toLowerCase()===email&&x.id!==id)){toast('Employee email already exists','error');return;}
    const record={id:id||uid('e'),firstName:$('firstName').value.trim(),lastName:$('lastName').value.trim(),email,phone:$('employeePhone').value.trim(),department:$('employeeDepartment').value,role:$('employeeRole').value.trim(),joiningDate:$('employeeJoiningDate').value,status:$('employeeStatus').value,location:$('employeeLocation').value.trim(),type:$('employeeType').value,notes:$('employeeNotes').value.trim()};
    state.employees=id?state.employees.map(x=>x.id===id?record:x):[record,...state.employees];save(KEY.employees,state.employees);closeModal('employeeModal');state.empPage=1;render();toast(id?'Employee updated successfully':'Employee added successfully');
  });
  $('departmentForm').addEventListener('submit',e=>{
    e.preventDefault();const id=$('departmentId').value,n=$('departmentName').value.trim();
    if(state.departments.some(x=>x.name.toLowerCase()===n.toLowerCase()&&x.id!==id)){toast('Department already exists','error');return;}
    const old=id?state.departments.find(x=>x.id===id):null, record={id:id||uid('d'),name:n,head:$('departmentHead').value.trim(),description:$('departmentDescription').value.trim()};
    state.departments=id?state.departments.map(x=>x.id===id?record:x):[...state.departments,record];
    if(old && old.name!==record.name) state.employees=state.employees.map(e=>e.department===old.name?Object.assign({},e,{department:record.name}):e);
    save(KEY.departments,state.departments);save(KEY.employees,state.employees);closeModal('departmentModal');render();toast(id?'Department updated successfully':'Department added successfully');
  });
  $('profileForm').addEventListener('submit',e=>{
    e.preventDefault();const email=$('profileEmail').value.trim().toLowerCase();
    if(state.users.some(x=>String(x.email).toLowerCase()===email&&x.id!==state.user.id)){toast('That email is already used','error');return;}
    const updated=Object.assign({},state.user,{firstName:$('profileFirst').value.trim(),lastName:$('profileLast').value.trim(),email,company:$('profileCompany').value.trim(),role:$('profileRole').value.trim()||'Administrator'});
    state.users=state.users.map(x=>x.id===updated.id?updated:x);state.user=updated;save(KEY.users,state.users);setSession(updated,true);updateUserHeader();closeModal('profileEditModal');render();toast('Profile updated successfully');
  });
  $('confirmBtn').addEventListener('click',performConfirm);
  $('logoutBtn').addEventListener('click',logout);
  $('mobileMenuBtn').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
  $('notificationBtn').addEventListener('click',()=>toast('No new notifications'));
  $('profileButton').addEventListener('click',()=>$('profileDropdown').classList.toggle('hidden'));
  document.querySelectorAll('[data-auth]').forEach(b=>b.addEventListener('click',()=>authPanel(b.dataset.auth==='signup'?'signupPanel':b.dataset.auth==='forgot'?'forgotPanel':'loginPanel')));
  document.querySelectorAll('.password-toggle').forEach(b=>b.addEventListener('click',()=>{const input=$(b.dataset.target);input.type=input.type==='password'?'text':'password';}));
  document.addEventListener('click',e=>{
    const p=e.target.closest('[data-profile]');
    if(p){$('profileDropdown').classList.add('hidden');if(p.dataset.profile==='profile'){state.page='profile';render();}else if(p.dataset.profile==='settings'){state.page='settings';render();}else logout();return;}
    if(!e.target.closest('.profile-menu')) $('profileDropdown')?.classList.add('hidden');
  });
  document.querySelectorAll('.modal-backdrop').forEach(m=>m.addEventListener('click',e=>{if(e.target===m){closeModal(m.id);state.pending=null;}}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(m=>{closeModal(m.id);state.pending=null;});});

  // Initial auth state.
  const session=currentSession();
  if(session){const user=state.users.find(u=>u.id===session.id&&String(u.email).toLowerCase()===String(session.email).toLowerCase());if(user)login(user,!!localStorage.getItem(KEY.session));}
})();
