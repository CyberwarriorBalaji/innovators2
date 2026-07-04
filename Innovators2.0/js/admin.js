/**
 * =============================================
 * ADMIN.JS — Admin Dashboard Logic
 * Innovators 2.0 Employee Management Portal
 * =============================================
 */

'use strict';

/* ── State ── */
let empPage     = 1;
let wrkPage     = 1;
let empSearch   = '';
let wrkSearch   = '';
let empSort     = { field: 'name', dir: 'asc' };
let wrkSort     = { field: 'name', dir: 'asc' };
let empFilter   = { dept: '', status: '' };
let editingEmp  = null;

const PER_PAGE = 10;

/* ── Admin Login ── */
function handleAdminLogin(e) {
  e.preventDefault();

  const userEl = document.getElementById('admin-username');
  const passEl = document.getElementById('admin-password');
  const user   = userEl.value.trim();
  const pass   = passEl.value;

  if (!user || !pass) {
    Toast.warning('Required Fields', 'Enter username and password.');
    return;
  }

  const btn = document.getElementById('admin-login-btn');
  btn.disabled = true;
  btn.textContent = 'Authenticating…';

  setTimeout(() => {
    btn.disabled = false;
    btn.textContent = 'Access Head Dashboard';

    if (user === 'head' && pass === 'head@innovators') {
      const adminUser = { id: 'admin-001', email: 'head@innovators2.com', name: 'Head Admin', avatar: null };
      DB.setSession(adminUser, 'admin', true);
      DB.logActivity('Admin Login', 'Head admin accessed dashboard', 'auth');
      Toast.success('Access Granted!', 'Welcome, Head Admin.');

      document.getElementById('admin-login-screen').style.display = 'none';
      document.getElementById('admin-dashboard').style.display   = 'flex';

      initAdminDashboard();
    } else {
      Toast.error('Access Denied', 'Invalid credentials. Access restricted.');
      userEl.classList.add('error');
      passEl.classList.add('error');
    }
  }, 1000);
}

/* ── Check Existing Admin Session ── */
function checkAdminSession() {
  const session = DB.getSession();
  if (session && session.role === 'admin' && DB.isSessionValid()) {
    document.getElementById('admin-login-screen').style.display = 'none';
    document.getElementById('admin-dashboard').style.display   = 'flex';
    initAdminDashboard();
    return true;
  }
  return false;
}

/* ── Init Admin Dashboard ── */
function initAdminDashboard() {
  updateAdminStats();
  renderEmployeeTable();
  renderWorkerTable();
  renderAdminCharts();
  renderActivityLog();
  renderAnnouncements();
  renderDeptList();
  showAdminSection('overview');
}

/* ── Stats ── */
function updateAdminStats() {
  const employees = DB.getEmployees();
  const workers   = DB.getWorkers();
  const leaves    = DB.getArray(DB.KEYS.LEAVE);
  const active    = employees.filter(e => e.status === 'active').length;

  AnimCounter.run(document.getElementById('admin-stat-emp'),    employees.length, 1200);
  AnimCounter.run(document.getElementById('admin-stat-wrk'),    workers.length,   1200);
  AnimCounter.run(document.getElementById('admin-stat-active'), active,           1000);
  AnimCounter.run(document.getElementById('admin-stat-leaves'), leaves.filter(l => l.status === 'pending').length, 800);

  /* Update DB helper to use public getter */
  function DB_getArray(key) { return DB.getArray(key); }
}

/* ── Employee Table ── */
function renderEmployeeTable() {
  let data = DB.getEmployees();

  /* Search */
  if (empSearch) data = DataUtils.search(data, empSearch, ['name', 'email', 'employeeId', 'department']);

  /* Filter */
  if (empFilter.dept)   data = data.filter(e => e.department === empFilter.dept);
  if (empFilter.status) data = data.filter(e => e.status === empFilter.status);

  /* Sort */
  data = DataUtils.sort(data, empSort.field, empSort.dir);

  /* Paginate */
  const paged = DataUtils.paginate(data, empPage, PER_PAGE);

  const tbody = document.getElementById('emp-tbody');
  if (!tbody) return;

  if (!paged.data.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px;color:var(--text-muted)">No employees found</td></tr>';
    renderPagination('emp-pagination', paged, (p) => { empPage = p; renderEmployeeTable(); });
    return;
  }

  tbody.innerHTML = paged.data.map(e => {
    const avatar = e.avatar
      ? `<img src="${e.avatar}" class="avatar avatar-sm" alt="${e.name}">`
      : `<div class="avatar-placeholder avatar-sm">${e.name.charAt(0)}</div>`;
    const statusBadge = `<span class="badge badge-${e.status === 'active' ? 'success' : e.status === 'suspended' ? 'warning' : 'danger'}">${e.status}</span>`;
    return `
      <tr class="status-${e.status}">
        <td><label class="custom-check"><input type="checkbox" class="emp-select" value="${e.id}"><span class="check-box"></span></label></td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            ${avatar}
            <div>
              <div style="font-weight:600;color:var(--text-primary);font-size:0.88rem;">${e.name}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">${e.employeeId}</div>
            </div>
          </div>
        </td>
        <td>${e.email}</td>
        <td>${e.department || '—'}</td>
        <td>${e.designation || '—'}</td>
        <td>${statusBadge}</td>
        <td>${DateUtil.format(e.joiningDate)}</td>
        <td>${DateUtil.formatCurrency(e.salary || 0)}</td>
        <td>
          <div style="display:flex;gap:4px;flex-wrap:wrap;">
            <button class="tbl-btn tbl-btn-view"    onclick="viewEmployee('${e.id}')">👁 View</button>
            <button class="tbl-btn tbl-btn-edit"    onclick="editEmployee('${e.id}')">✏️ Edit</button>
            <button class="tbl-btn tbl-btn-suspend" onclick="toggleStatus('${e.id}','${e.role || 'employee'}')">⏸ ${e.status === 'suspended' ? 'Activate' : 'Suspend'}</button>
            <button class="tbl-btn tbl-btn-delete"  onclick="deleteRecord('${e.id}','employee')">🗑 Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  renderPagination('emp-pagination', paged, (p) => { empPage = p; renderEmployeeTable(); });
  document.getElementById('emp-count').textContent = `${paged.total} employees`;
}

/* ── Worker Table ── */
function renderWorkerTable() {
  let data = DB.getWorkers();
  if (wrkSearch) data = DataUtils.search(data, wrkSearch, ['name', 'email', 'employeeId', 'department']);
  data = DataUtils.sort(data, wrkSort.field, wrkSort.dir);
  const paged = DataUtils.paginate(data, wrkPage, PER_PAGE);

  const tbody = document.getElementById('wrk-tbody');
  if (!tbody) return;

  if (!paged.data.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">No workers found</td></tr>';
    return;
  }

  tbody.innerHTML = paged.data.map(w => {
    const avatar = w.avatar
      ? `<img src="${w.avatar}" class="avatar avatar-sm" alt="${w.name}">`
      : `<div class="avatar-placeholder avatar-sm">${w.name.charAt(0)}</div>`;
    const statusBadge = `<span class="badge badge-${w.status === 'active' ? 'success' : 'warning'}">${w.status}</span>`;
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            ${avatar}
            <div>
              <div style="font-weight:600;color:var(--text-primary);font-size:0.88rem;">${w.name}</div>
              <div style="font-size:0.75px;color:var(--text-muted);">${w.employeeId}</div>
            </div>
          </div>
        </td>
        <td>${w.email}</td>
        <td>${w.department || '—'}</td>
        <td>${w.designation || '—'}</td>
        <td>${statusBadge}</td>
        <td>${DateUtil.formatCurrency(w.salary || 0)}</td>
        <td>
          <button class="tbl-btn tbl-btn-view"   onclick="viewEmployee('${w.id}','worker')">👁 View</button>
          <button class="tbl-btn tbl-btn-edit"   onclick="editEmployee('${w.id}','worker')">✏️ Edit</button>
          <button class="tbl-btn tbl-btn-delete" onclick="deleteRecord('${w.id}','worker')">🗑 Delete</button>
        </td>
      </tr>
    `;
  }).join('');

  renderPagination('wrk-pagination', paged, (p) => { wrkPage = p; renderWorkerTable(); });
}

/* ── Pagination ── */
function renderPagination(containerId, paged, callback) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { page, pages } = paged;
  let html = '';
  for (let i = 1; i <= pages; i++) {
    html += `<button class="btn btn-sm ${i === page ? 'btn-primary' : 'btn-ghost'}" onclick="(${callback.toString()})(${i})">${i}</button>`;
  }
  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;justify-content:flex-end;margin-top:16px;">
      <span style="font-size:0.8rem;color:var(--text-muted)">Page ${page} of ${pages} | ${paged.total} records</span>
      ${html}
    </div>
  `;
}

/* ── View Employee ── */
function viewEmployee(id, role = 'employee') {
  const record = role === 'worker' ? DB.getWorker(id) : DB.getEmployee(id);
  if (!record) return;

  const modal    = document.getElementById('view-emp-modal');
  const content  = document.getElementById('view-emp-content');
  if (!modal || !content) return;

  const avatar = record.avatar
    ? `<img src="${record.avatar}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--light-blue);">`
    : `<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;color:white;font-size:2rem;font-weight:700;">${record.name.charAt(0)}</div>`;

  content.innerHTML = `
    <div style="text-align:center;margin-bottom:24px;">
      ${avatar}
      <h3 style="margin-top:12px;">${record.name}</h3>
      <p style="color:var(--text-muted);">${record.designation || ''} · ${record.department || ''}</p>
      <span class="badge badge-${record.status === 'active' ? 'success' : 'warning'} mt-sm">${record.status}</span>
    </div>
    <div class="detail-grid">
      ${[
        ['Employee ID', record.employeeId],
        ['Email',       record.email],
        ['Mobile',      record.mobile],
        ['DOB',         DateUtil.format(record.dob)],
        ['Gender',      record.gender],
        ['Blood Group', record.bloodGroup],
        ['Salary',      DateUtil.formatCurrency(record.salary || 0)],
        ['Joining Date',DateUtil.format(record.joiningDate)],
        ['City',        record.city],
        ['State',       record.state],
        ['Experience',  record.experience || '—'],
        ['Emergency',   record.emergencyContact || '—'],
      ].map(([l, v]) => `
        <div class="detail-item">
          <div class="detail-label">${l}</div>
          <div class="detail-value">${v || '—'}</div>
        </div>
      `).join('')}
    </div>
    ${record.skills?.length ? `
      <div style="margin-top:16px;">
        <div class="detail-label">Skills</div>
        <div class="skills-cloud" style="margin-top:8px;">
          ${record.skills.map(s => `<span class="skill-chip">${s}</span>`).join('')}
        </div>
      </div>` : ''}
  `;

  Modal.open('view-emp-modal');
}

/* ── Edit Employee ── */
function editEmployee(id, role = 'employee') {
  editingEmp = { id, role };
  const record = role === 'worker' ? DB.getWorker(id) : DB.getEmployee(id);
  if (!record) return;

  /* Populate edit form */
  ['name','email','mobile','department','designation','salary','status'].forEach(f => {
    const el = document.getElementById(`edit-${f}`);
    if (el) el.value = record[f] || '';
  });

  Modal.open('edit-emp-modal');
}

function saveEditEmployee() {
  if (!editingEmp) return;
  const { id, role } = editingEmp;
  const record = role === 'worker' ? DB.getWorker(id) : DB.getEmployee(id);
  if (!record) return;

  const updates = {};
  ['name','email','mobile','department','designation','salary','status'].forEach(f => {
    const el = document.getElementById(`edit-${f}`);
    if (el) updates[f] = el.value.trim();
  });

  if (role === 'worker') {
    DB.saveWorker({ ...record, ...updates });
    renderWorkerTable();
  } else {
    DB.saveEmployee({ ...record, ...updates });
    renderEmployeeTable();
  }

  DB.logActivity('Employee Updated', `${record.name} (${record.employeeId})`, 'employee');
  Toast.success('Updated!', 'Employee record has been updated.');
  Modal.close('edit-emp-modal');
  editingEmp = null;
}

/* ── Toggle Status ── */
function toggleStatus(id, role = 'employee') {
  const record = role === 'worker' ? DB.getWorker(id) : DB.getEmployee(id);
  if (!record) return;
  const newStatus = record.status === 'suspended' ? 'active' : 'suspended';
  DB.updateEmployeeStatus(id, newStatus);
  DB.logActivity(`Employee ${newStatus}`, `${record.name}`, 'employee');
  Toast.success('Status Updated', `${record.name} is now ${newStatus}.`);
  renderEmployeeTable();
  updateAdminStats();
}

/* ── Delete ── */
function deleteRecord(id, role = 'employee') {
  const record = role === 'worker' ? DB.getWorker(id) : DB.getEmployee(id);
  if (!record) return;

  confirmDialog(`Delete ${record.name}? This cannot be undone.`, () => {
    if (role === 'worker') DB.deleteWorker(id);
    else                   DB.deleteEmployee(id);
    DB.logActivity('Employee Deleted', `${record.name} (${record.employeeId})`, 'employee');
    Toast.success('Deleted', `${record.name} has been removed.`);
    renderEmployeeTable();
    renderWorkerTable();
    updateAdminStats();
  });
}

/* ── Admin Charts ── */
function renderAdminCharts() {
  const employees  = DB.getEmployees();
  const depts      = {};
  employees.forEach(e => { depts[e.department || 'Other'] = (depts[e.department || 'Other'] || 0) + 1; });

  const deptLabels = Object.keys(depts).slice(0, 5);
  const deptValues = deptLabels.map(d => depts[d]);
  const colors     = ['#0A4D8C','#1A73E8','#F5B942','#22c55e','#ef4444'];

  Charts.bar('dept-chart', deptLabels, deptValues, colors);
  Charts.doughnut('status-chart',
    ['Active','Suspended','Total Workers'],
    [
      employees.filter(e => e.status === 'active').length,
      employees.filter(e => e.status === 'suspended').length,
      DB.getWorkers().length,
    ],
    colors
  );
}

/* ── Activity Log ── */
function renderActivityLog() {
  const log = DB.getActivityLog().slice(0, 20);
  const container = document.getElementById('admin-activity-log');
  if (!container) return;

  const catColors = { auth: 'rgba(26,115,232,0.1)', employee: 'rgba(34,197,94,0.1)', general: 'rgba(245,185,66,0.1)' };
  const catIcons  = { auth: '🔐', employee: '👤', general: '📋' };

  container.innerHTML = log.map(entry => `
    <div class="log-item">
      <div class="log-timestamp">${DateUtil.timeAgo(entry.timestamp)}</div>
      <div class="log-icon-wrap" style="background:${catColors[entry.category] || catColors.general}">
        ${catIcons[entry.category] || '📋'}
      </div>
      <div class="log-text"><strong>${entry.action}</strong>: ${entry.detail} <span style="color:var(--text-muted);font-size:0.75rem;">by ${entry.session}</span></div>
    </div>
  `).join('') || '<p style="text-align:center;padding:20px;color:var(--text-muted)">No activity yet</p>';
}

/* ── Announcements ── */
function renderAnnouncements() {
  const list = DB.getAnnouncements();
  const container = document.getElementById('admin-announcements');
  if (!container) return;

  container.innerHTML = list.map(a => `
    <div class="card" style="padding:16px;margin-bottom:12px;">
      <div class="flex-between mb-md">
        <strong>${a.title}</strong>
        <div style="display:flex;gap:8px;">
          <span class="badge badge-${a.priority === 'high' ? 'danger' : 'secondary'}">${a.priority || 'normal'}</span>
          <button class="tbl-btn tbl-btn-delete" onclick="deleteAnnouncement('${a.id}')">🗑</button>
        </div>
      </div>
      <p style="font-size:0.85rem;">${a.body}</p>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-top:8px;">${DateUtil.timeAgo(a.createdAt)} · ${a.postedBy}</div>
    </div>
  `).join('') || '<p style="text-align:center;padding:20px;color:var(--text-muted)">No announcements</p>';
}

function deleteAnnouncement(id) {
  DB.deleteAnnouncement(id);
  Toast.success('Deleted', 'Announcement removed.');
  renderAnnouncements();
}

/* ── Department List ── */
function renderDeptList() {
  const employees = DB.getEmployees();
  const depts     = {};
  employees.forEach(e => { depts[e.department || 'Other'] = (depts[e.department || 'Other'] || 0) + 1; });

  const container = document.getElementById('dept-list');
  if (!container) return;

  container.innerHTML = Object.entries(depts).map(([dept, count]) => `
    <div class="dept-item">
      <div>
        <div class="dept-item-name">${dept}</div>
        <div class="dept-item-count">${count} employee${count !== 1 ? 's' : ''}</div>
      </div>
      <span class="badge badge-primary">${count}</span>
    </div>
  `).join('') || '<p>No departments</p>';
}

/* ── Show Admin Section ── */
function showAdminSection(name) {
  document.querySelectorAll('.admin-section').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));

  const section = document.getElementById(`admin-section-${name}`);
  if (section) section.classList.add('active');

  const navItem = document.querySelector(`[data-admin-section="${name}"]`);
  if (navItem) navItem.classList.add('active');
}

/* ── Export CSV ── */
function exportEmployeesCSV() {
  const data = DB.getEmployees().map(e => ({
    'Employee ID': e.employeeId,
    'Name': e.name,
    'Email': e.email,
    'Mobile': e.mobile,
    'Department': e.department,
    'Designation': e.designation,
    'Status': e.status,
    'Salary': e.salary,
    'Joining Date': DateUtil.format(e.joiningDate),
  }));
  DB.exportCSV(data, 'employees.csv');
  Toast.success('Exported!', 'employees.csv downloaded.');
}

function exportWorkersCSV() {
  const data = DB.getWorkers().map(w => ({
    'Worker ID': w.employeeId, 'Name': w.name, 'Email': w.email,
    'Department': w.department, 'Status': w.status, 'Salary': w.salary,
  }));
  DB.exportCSV(data, 'workers.csv');
  Toast.success('Exported!', 'workers.csv downloaded.');
}

/* ── Backup / Restore ── */
function backupData() {
  const data = DB.backup();
  const blob = new Blob([data], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `innovators2_backup_${Date.now()}.json`; a.click();
  URL.revokeObjectURL(url);
  Toast.success('Backup Created!', 'Data exported as JSON.');
}

function restoreData(inputId) {
  const input = document.getElementById(inputId);
  const file  = input?.files[0];
  if (!file) { Toast.warning('No File', 'Select a backup file.'); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    if (DB.restore(e.target.result)) {
      Toast.success('Restored!', 'Data has been restored. Refreshing…');
      setTimeout(() => window.location.reload(), 1500);
    } else {
      Toast.error('Restore Failed', 'Invalid backup file.');
    }
  };
  reader.readAsText(file);
}

/* ── Post Announcement ── */
function postAnnouncement(e) {
  e.preventDefault();
  const title    = document.getElementById('ann-title').value.trim();
  const body     = document.getElementById('ann-body').value.trim();
  const priority = document.getElementById('ann-priority').value;
  const postedBy = DB.getSession()?.name || 'Admin';

  if (!title || !body) { Toast.warning('Required', 'Fill title and body.'); return; }

  DB.addAnnouncement({ title, body, priority, postedBy });
  DB.addNotification({ title, body, type: 'info', userId: null }); // broadcast

  Toast.success('Posted!', 'Announcement sent to all employees.');
  document.getElementById('ann-form')?.reset();
  renderAnnouncements();
}

/* ── DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();

  /* Check existing admin session */
  if (!checkAdminSession()) {
    /* Show login form */
    const loginForm = document.getElementById('admin-login-form');
    loginForm?.addEventListener('submit', handleAdminLogin);
  }

  /* Admin nav clicks */
  document.querySelectorAll('[data-admin-section]').forEach(btn => {
    btn.addEventListener('click', () => showAdminSection(btn.dataset.adminSection));
  });

  /* Employee Search */
  document.getElementById('emp-search')?.addEventListener('input', (e) => {
    empSearch = e.target.value;
    empPage   = 1;
    renderEmployeeTable();
  });

  /* Worker Search */
  document.getElementById('wrk-search')?.addEventListener('input', (e) => {
    wrkSearch = e.target.value;
    wrkPage   = 1;
    renderWorkerTable();
  });

  /* Dept filter */
  const deptFilter = document.getElementById('emp-dept-filter');
  if (deptFilter) {
    DB.getDepartments().forEach(d => {
      const opt = document.createElement('option');
      opt.value = d; opt.textContent = d;
      deptFilter.appendChild(opt);
    });
    deptFilter.addEventListener('change', (e) => {
      empFilter.dept = e.target.value;
      empPage = 1;
      renderEmployeeTable();
    });
  }

  /* Status filter */
  document.getElementById('emp-status-filter')?.addEventListener('change', (e) => {
    empFilter.status = e.target.value;
    empPage = 1;
    renderEmployeeTable();
  });

  /* Sort */
  document.getElementById('emp-sort')?.addEventListener('change', (e) => {
    const [field, dir] = e.target.value.split('-');
    empSort = { field, dir };
    renderEmployeeTable();
  });

  /* Export */
  document.getElementById('export-emp-csv')?.addEventListener('click', exportEmployeesCSV);
  document.getElementById('export-wrk-csv')?.addEventListener('click', exportWorkersCSV);
  document.getElementById('print-emp-btn')?.addEventListener('click', () => PrintUtil.printSection('emp-table-wrap'));

  /* Backup / Restore */
  document.getElementById('backup-btn')?.addEventListener('click', backupData);
  document.getElementById('restore-btn')?.addEventListener('click', () => document.getElementById('restore-input')?.click());
  document.getElementById('restore-input')?.addEventListener('change', () => restoreData('restore-input'));

  /* Announcement form */
  document.getElementById('ann-form')?.addEventListener('submit', postAnnouncement);

  /* Edit save */
  document.getElementById('save-edit-btn')?.addEventListener('click', saveEditEmployee);

  /* Dark mode toggle */
  document.querySelectorAll('.dark-toggle').forEach(btn => btn.addEventListener('click', () => ThemeManager.toggle()));

  /* Logout */
  document.querySelectorAll('[data-action="logout"]').forEach(btn => btn.addEventListener('click', () => {
    DB.clearSession();
    window.location.href = 'index.html';
  }));

  Loader.hide(1200);
});
