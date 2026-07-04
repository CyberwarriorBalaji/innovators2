/**
 * =============================================
 * DASHBOARD.JS — Employee Dashboard Logic
 * Innovators 2.0 Employee Management Portal
 * =============================================
 */

'use strict';

let currentSection = 'overview';
let calendarDate   = new Date();
let weatherData    = null;

/* ── Section Navigation ── */
function showSection(name) {
  document.querySelectorAll('.dash-section').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  const section = document.getElementById(`section-${name}`);
  if (section) section.classList.add('active');

  const navItem = document.querySelector(`[data-section="${name}"]`);
  if (navItem) navItem.classList.add('active');

  currentSection = name;
  setPageTitle(navTitles[name] || 'Dashboard');

  /* Lazy load section content */
  switch (name) {
    case 'overview':    initOverview();    break;
    case 'attendance':  initAttendance();  break;
    case 'leave':       initLeave();       break;
    case 'salary':      initSalary();      break;
    case 'projects':    initProjects();    break;
    case 'tasks':       initTasks();       break;
    case 'documents':   initDocuments();   break;
    case 'notifications': initNotifications(); break;
  }
}

const navTitles = {
  overview: 'Dashboard',
  profile: 'My Profile',
  attendance: 'Attendance',
  leave: 'Leave Management',
  salary: 'Salary',
  projects: 'Projects',
  tasks: 'My Tasks',
  documents: 'Documents',
  certificates: 'Certificates',
  notifications: 'Notifications',
  settings: 'Settings',
};

/* ── Get Current User ── */
function getCurrentUser() {
  const session = DB.getSession();
  if (!session) return null;
  return DB.getEmployee(session.userId) || DB.getEmployeeByEmail(session.email);
}

/* ── Overview Section ── */
function initOverview() {
  const user = getCurrentUser();
  if (!user) return;

  /* Animated counters */
  const attendancePct = DB.calculateAttendancePercent(user.id);
  const leaveBalance  = 20 - (DB.getLeaves(user.id).filter(l => l.status === 'approved').length);
  const projectCount  = DB.getProjects().filter(p => p.team?.includes(user.id)).length;
  const salary        = user.salary || 0;

  AnimCounter.run(document.getElementById('stat-attendance'), attendancePct, 1500, '', '%');
  AnimCounter.run(document.getElementById('stat-salary'),     salary,        1500, '₹');
  AnimCounter.run(document.getElementById('stat-projects'),   projectCount,  1200);
  AnimCounter.run(document.getElementById('stat-leaves'),     leaveBalance,  1000);

  /* Attendance Ring */
  Charts.ring('attendance-ring-canvas', attendancePct);
  const pctLabel = document.getElementById('attendance-ring-pct');
  if (pctLabel) pctLabel.textContent = `${attendancePct}%`;

  /* Charts */
  setTimeout(() => {
    renderPerformanceChart();
    renderAttendanceChart();
    renderDoughnut();
  }, 200);

  /* Calendar */
  renderCalendar();

  /* Weather (simulated) */
  renderWeather();

  /* Announcements */
  renderAnnouncements();

  /* Recent Activities */
  renderRecentActivity();

  /* Welcome banner */
  const session = DB.getSession();
  const welcomeEl = document.getElementById('welcome-name');
  if (welcomeEl) welcomeEl.textContent = session?.name?.split(' ')[0] || 'User';
}

/* ── Charts ── */
function renderPerformanceChart() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const values = [72, 85, 78, 91, 88, 95];
  Charts.bar('performance-chart', months, values,
    ['#0A4D8C','#1565c0','#1A73E8','#2196F3','#42A5F5','#1A73E8']);
}

function renderAttendanceChart() {
  const weeks = ['W1', 'W2', 'W3', 'W4'];
  Charts.line('attendance-chart', weeks, [
    { values: [5, 4, 5, 5], color: '#22c55e', label: 'Present' },
    { values: [0, 1, 0, 0], color: '#ef4444', label: 'Absent' },
  ]);
}

function renderDoughnut() {
  Charts.doughnut('task-chart', ['Done', 'In Progress', 'To Do'],
    [8, 3, 2], ['#22c55e', '#F5B942', '#e2e8f0']);
}

/* ── Calendar ── */
function renderCalendar() {
  const container = document.getElementById('calendar-grid-body');
  if (!container) return;

  const year  = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const today = new Date();

  document.getElementById('cal-month-label').textContent =
    `${DateUtil.monthName(month)} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  /* Get event days from attendance */
  const user      = getCurrentUser();
  const attendance = user ? DB.getAttendance(user.id) : [];
  const eventDates = new Set(attendance.map(a => new Date(a.timestamp).getDate()));

  let html = '';
  /* Empty cells before first day */
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-day other-month"></div>';
  /* Days */
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const hasEvent = eventDates.has(d);
    html += `<div class="cal-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}">${d}</div>`;
  }

  container.innerHTML = html;

  /* Nav buttons */
  document.getElementById('cal-prev')?.addEventListener('click', () => {
    calendarDate = new Date(year, month - 1, 1);
    renderCalendar();
  });
  document.getElementById('cal-next')?.addEventListener('click', () => {
    calendarDate = new Date(year, month + 1, 1);
    renderCalendar();
  });
}

/* ── Weather (Simulated) ── */
function renderWeather() {
  const conditions = [
    { icon: '☀️', label: 'Sunny',  temp: 32, humid: 55, wind: 12 },
    { icon: '⛅', label: 'Partly Cloudy', temp: 28, humid: 68, wind: 18 },
    { icon: '🌧️', label: 'Rainy',  temp: 24, humid: 82, wind: 22 },
    { icon: '🌤️', label: 'Mostly Sunny', temp: 30, humid: 60, wind: 15 },
  ];
  const w = conditions[Math.floor(Math.random() * conditions.length)];

  const el = document.getElementById('weather-widget');
  if (!el) return;
  el.innerHTML = `
    <div class="weather-main">
      <div class="weather-icon">${w.icon}</div>
      <div>
        <div class="weather-temp">${w.temp}°C</div>
        <div class="weather-city">📍 Bengaluru, India</div>
        <div class="weather-condition">${w.label}</div>
      </div>
    </div>
    <div class="weather-details">
      <div class="weather-detail">💧 ${w.humid}%</div>
      <div class="weather-detail">🌬️ ${w.wind} km/h</div>
      <div class="weather-detail">📅 ${new Date().toLocaleDateString('en-IN', {weekday:'long'})}</div>
    </div>
  `;
}

/* ── Announcements ── */
function renderAnnouncements() {
  const list = DB.getAnnouncements();
  const el   = document.getElementById('announcements-list');
  if (!el) return;

  if (!list.length) {
    el.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;font-size:0.85rem;">No announcements</p>';
    return;
  }

  const priorityColors = { high: '#ef4444', normal: '#1A73E8', low: '#22c55e' };

  el.innerHTML = list.map(a => `
    <div class="activity-item">
      <div class="activity-dot" style="background:${priorityColors[a.priority || 'normal']}"></div>
      <div class="activity-body">
        <div class="title">${a.title}</div>
        <div class="detail">${a.body}</div>
        <div class="time">${DateUtil.timeAgo(a.createdAt)} · ${a.postedBy}</div>
      </div>
    </div>
  `).join('');
}

/* ── Recent Activity ── */
function renderRecentActivity() {
  const log = DB.getActivityLog().slice(0, 8);
  const el  = document.getElementById('activity-feed');
  if (!el) return;

  if (!log.length) {
    el.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;font-size:0.85rem;">No recent activity</p>';
    return;
  }

  const catColors = { auth: '#1A73E8', employee: '#22c55e', general: '#F5B942' };

  el.innerHTML = log.map(entry => `
    <div class="activity-item">
      <div class="activity-dot" style="background:${catColors[entry.category] || '#9aa5b1'}"></div>
      <div class="activity-body">
        <div class="title">${entry.action}</div>
        <div class="detail">${entry.detail}</div>
        <div class="time">${DateUtil.timeAgo(entry.timestamp)}</div>
      </div>
    </div>
  `).join('');
}

/* ── Attendance Section ── */
function initAttendance() {
  const user = getCurrentUser();
  if (!user) return;

  const todayRecords = DB.getTodayAttendance(user.id);
  const punchInEl    = document.getElementById('punch-in-time');
  const punchOutEl   = document.getElementById('punch-out-time');

  const inRecord  = todayRecords.find(r => r.type === 'in');
  const outRecord = todayRecords.find(r => r.type === 'out');

  if (punchInEl)  punchInEl.textContent  = inRecord  ? new Date(inRecord.timestamp).toLocaleTimeString()  : '-- : --';
  if (punchOutEl) punchOutEl.textContent = outRecord ? new Date(outRecord.timestamp).toLocaleTimeString() : '-- : --';

  /* Attendance table */
  const tbody = document.getElementById('attendance-tbody');
  if (!tbody) return;

  const records = DB.getAttendance(user.id);
  const grouped = {};
  records.forEach(r => {
    if (!grouped[r.date]) grouped[r.date] = {};
    grouped[r.date][r.type] = r.timestamp;
  });

  const rows = Object.entries(grouped).slice(0, 30).reverse();
  tbody.innerHTML = rows.map(([date, times]) => {
    const inTime  = times.in  ? new Date(times.in).toLocaleTimeString()  : '—';
    const outTime = times.out ? new Date(times.out).toLocaleTimeString() : '—';
    const status  = times.in && times.out ? 'Present' : times.in ? 'Half Day' : 'Absent';
    const badgeClass = status === 'Present' ? 'badge-success' : status === 'Half Day' ? 'badge-warning' : 'badge-danger';
    return `
      <tr>
        <td>${date}</td>
        <td>${inTime}</td>
        <td>${outTime}</td>
        <td><span class="badge ${badgeClass}">${status}</span></td>
        <td>${times.in && times.out ? '8h 00m' : '—'}</td>
      </tr>
    `;
  }).join('');

  /* Punch buttons */
  document.getElementById('punch-in-btn')?.addEventListener('click', () => {
    if (inRecord) { Toast.warning('Already Punched In', 'You already punched in today.'); return; }
    DB.markAttendance(user.id, 'in');
    Toast.success('Punch In', 'Good morning! Have a productive day.');
    initAttendance();
  });

  document.getElementById('punch-out-btn')?.addEventListener('click', () => {
    if (!inRecord) { Toast.warning('Not Punched In', 'Please punch in first.'); return; }
    if (outRecord) { Toast.warning('Already Punched Out', 'You already punched out today.'); return; }
    DB.markAttendance(user.id, 'out');
    Toast.success('Punch Out', 'See you tomorrow!');
    initAttendance();
  });

  /* Summary */
  const pct = DB.calculateAttendancePercent(user.id);
  const summaryEl = document.getElementById('att-summary-pct');
  if (summaryEl) summaryEl.textContent = `${pct}%`;
}

/* ── Leave Section ── */
function initLeave() {
  const user = getCurrentUser();
  if (!user) return;

  /* Balance */
  const approved = DB.getLeaves(user.id).filter(l => l.status === 'approved').length;
  const balance  = 20 - approved;
  const elBal    = document.getElementById('leave-balance');
  if (elBal) elBal.textContent = balance;

  /* Leave list */
  const tbody = document.getElementById('leave-tbody');
  if (!tbody) return;

  const leaves = DB.getLeaves(user.id);
  if (!leaves.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No leave applications</td></tr>';
    return;
  }

  tbody.innerHTML = leaves.map(l => {
    const badgeClass = l.status === 'approved' ? 'badge-success' : l.status === 'rejected' ? 'badge-danger' : 'badge-warning';
    return `
      <tr>
        <td>${l.type || 'Casual'}</td>
        <td>${DateUtil.format(l.from)}</td>
        <td>${DateUtil.format(l.to)}</td>
        <td>${l.reason || '—'}</td>
        <td><span class="badge ${badgeClass}">${l.status}</span></td>
        <td>${DateUtil.timeAgo(l.appliedAt)}</td>
      </tr>
    `;
  }).join('');

  /* Apply leave form */
  const leaveForm = document.getElementById('leave-form');
  leaveForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const type   = document.getElementById('leave-type').value;
    const from   = document.getElementById('leave-from').value;
    const to     = document.getElementById('leave-to').value;
    const reason = document.getElementById('leave-reason').value.trim();

    if (!type || !from || !to || !reason) { Toast.warning('Incomplete Form', 'Please fill all fields.'); return; }
    if (new Date(from) > new Date(to)) { Toast.error('Invalid Dates', 'From date must be before To date.'); return; }
    if (balance <= 0) { Toast.warning('No Leave Balance', 'You have exhausted your leave balance.'); return; }

    DB.applyLeave({ userId: user.id, type, from, to, reason });
    Toast.success('Leave Applied!', 'Your application has been submitted.');
    leaveForm.reset();
    initLeave();
  });
}

/* ── Salary Section ── */
function initSalary() {
  const user    = getCurrentUser();
  if (!user) return;

  const salaries = DB.getSalary(user.id);
  const tbody    = document.getElementById('salary-tbody');
  if (!tbody) return;

  if (!salaries.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No salary records</td></tr>';

    /* Create a sample from user salary if available */
    if (user.salary) {
      DB.addSalaryRecord({
        userId: user.id, month: 'July 2025',
        basic: Math.round(user.salary * 0.7), hra: Math.round(user.salary * 0.15),
        allowances: Math.round(user.salary * 0.1), deductions: Math.round(user.salary * 0.05),
        net: user.salary, status: 'paid', paidOn: new Date().toISOString().split('T')[0],
      });
      initSalary();
    }
    return;
  }

  tbody.innerHTML = salaries.map(s => `
    <tr>
      <td>${s.month}</td>
      <td>${DateUtil.formatCurrency(s.basic)}</td>
      <td>${DateUtil.formatCurrency(s.hra)}</td>
      <td>${DateUtil.formatCurrency(s.allowances)}</td>
      <td>${DateUtil.formatCurrency(s.deductions)}</td>
      <td class="fw-700 text-primary-color">${DateUtil.formatCurrency(s.net)}</td>
      <td><span class="badge badge-success">${s.status}</span></td>
    </tr>
  `).join('');

  /* Latest salary stats */
  const latest = salaries[0];
  if (latest) {
    AnimCounter.run(document.getElementById('current-salary'), latest.net, 1500, '₹');
  }
}

/* ── Projects Section ── */
function initProjects() {
  const user     = getCurrentUser();
  const projects = DB.getProjects();
  const container = document.getElementById('projects-grid');
  if (!container) return;

  const userProjects = projects.filter(p =>
    !p.team || !user || p.team.includes(user.id) || true
  );

  const statusColors = {
    'in-progress': '#1A73E8',
    'planning':    '#F5B942',
    'completed':   '#22c55e',
    'on-hold':     '#ef4444',
  };
  const priorityBadge = { high: 'badge-danger', medium: 'badge-warning', low: 'badge-success' };

  container.innerHTML = userProjects.map(p => `
    <div class="card" style="border-top: 3px solid ${statusColors[p.status] || '#1A73E8'};">
      <div class="flex-between mb-md">
        <h4 style="font-size:1rem;">${p.name}</h4>
        <span class="badge ${priorityBadge[p.priority] || 'badge-secondary'}">${p.priority || 'medium'}</span>
      </div>
      <p style="font-size:0.85rem;margin-bottom:12px;">${p.description}</p>
      <div class="progress-wrap mb-md">
        <div class="progress-bar" style="width:${p.progress || 0}%"></div>
      </div>
      <div class="flex-between" style="font-size:0.8rem;color:var(--text-muted);">
        <span>Progress: ${p.progress || 0}%</span>
        <span>Due: ${DateUtil.format(p.deadline)}</span>
      </div>
      <div class="flex-between mt-md">
        <span class="badge" style="background:${statusColors[p.status]}22;color:${statusColors[p.status]}">${p.status}</span>
        <span style="font-size:0.75rem;color:var(--text-muted);">👥 ${p.team?.length || 0} members</span>
      </div>
    </div>
  `).join('');
}

/* ── Tasks Section ── */
function initTasks() {
  const user  = getCurrentUser();
  if (!user) return;

  const tasks = DB.getTasks(user.id);
  const todo  = tasks.filter(t => t.status === 'todo');
  const inProg = tasks.filter(t => t.status === 'in-progress');
  const done  = tasks.filter(t => t.status === 'done');

  renderTaskColumn('tasks-todo',        todo);
  renderTaskColumn('tasks-in-progress', inProg);
  renderTaskColumn('tasks-done',        done);
}

function renderTaskColumn(containerId, tasks) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = tasks.length ? tasks.map(t => `
    <div class="card" style="padding:14px;margin-bottom:10px;border-left:3px solid ${
      t.priority === 'high' ? 'var(--danger)' : t.priority === 'low' ? 'var(--success)' : 'var(--warning)'
    }">
      <div class="fw-700" style="font-size:0.9rem;">${t.title}</div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">Due: ${DateUtil.format(t.dueDate)}</div>
      <span class="badge badge-${t.priority === 'high' ? 'danger' : t.priority === 'low' ? 'success' : 'warning'}" style="margin-top:6px;">${t.priority}</span>
    </div>
  `).join('') : '<p style="text-align:center;color:var(--text-muted);font-size:0.82rem;padding:20px;">No tasks</p>';
}

/* ── Documents Section ── */
function initDocuments() {
  const user = getCurrentUser();
  if (!user) return;

  const container = document.getElementById('documents-grid');
  if (!container) return;

  const docs = [];
  if (user.resume)      docs.push({ name: 'Resume',          type: 'PDF', icon: '📄', data: user.resume });
  if (user.certificate) docs.push({ name: 'Certificate',     type: 'Document', icon: '🏅', data: user.certificate });
  if (user.govId)       docs.push({ name: 'Government ID',   type: 'Document', icon: '🪪', data: user.govId });
  if (user.signature)   docs.push({ name: 'Signature',       type: 'Image', icon: '✍️', data: user.signature });

  if (!docs.length) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">
        <div style="font-size:3rem;margin-bottom:12px;">📁</div>
        <p>No documents uploaded yet.</p>
        <a href="profile.html" class="btn btn-primary btn-sm mt-md">Upload Documents</a>
      </div>
    `;
    return;
  }

  container.innerHTML = docs.map(doc => `
    <div class="doc-card">
      <div class="doc-preview">
        ${doc.data && doc.data.startsWith('data:image') ?
          `<img src="${doc.data}" alt="${doc.name}" />` :
          `<span style="font-size:2.5rem;">${doc.icon}</span>`
        }
        <div class="doc-preview-overlay">
          <span>👁</span>
        </div>
      </div>
      <div class="doc-info">
        <div class="doc-name">${doc.name}</div>
        <div class="doc-type">${doc.type}</div>
        <div class="doc-actions">
          <a href="${doc.data}" download="${doc.name}" class="btn btn-sm btn-primary" style="padding:4px 8px;font-size:0.72rem;">⬇ Download</a>
        </div>
      </div>
    </div>
  `).join('');
}

/* ── Notifications Section ── */
function initNotifications() {
  const session = DB.getSession();
  if (!session) return;

  const notifs = DB.getNotifications(session.userId);
  const container = document.getElementById('notif-full-list');
  if (!container) return;

  const typeIcons  = { success: '✅', error: '❌', warning: '⚠️', info: '🔔' };
  const typeBg     = { success: 'rgba(34,197,94,0.1)', error: 'rgba(239,68,68,0.1)', warning: 'rgba(245,158,11,0.1)', info: 'rgba(26,115,232,0.1)' };

  container.innerHTML = notifs.map(n => `
    <div class="activity-item ${n.read ? '' : 'unread'}" style="cursor:pointer;padding:16px;" onclick="markRead('${n.id}')">
      <div style="width:44px;height:44px;border-radius:50%;background:${typeBg[n.type]||typeBg.info};display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">
        ${typeIcons[n.type] || '🔔'}
      </div>
      <div class="activity-body" style="flex:1;">
        <div class="title">${n.title} ${!n.read ? '<span style="display:inline-block;width:8px;height:8px;background:var(--secondary);border-radius:50%;margin-left:6px;"></span>' : ''}</div>
        <div class="detail">${n.body}</div>
        <div class="time">${DateUtil.timeAgo(n.createdAt)}</div>
      </div>
    </div>
  `).join('') || '<p style="text-align:center;padding:40px;color:var(--text-muted);">No notifications</p>';
}

/* ── DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', () => {
  /* Nav item click */
  document.querySelectorAll('[data-section]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      showSection(el.dataset.section);
    });
  });

  /* Profile / Settings links */
  document.getElementById('nav-profile')?.addEventListener('click', () => window.location.href = 'profile.html');
  document.getElementById('nav-settings')?.addEventListener('click', () => window.location.href = 'settings.html');

  /* Default section */
  showSection('overview');
});
