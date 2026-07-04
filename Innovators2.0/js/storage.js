/**
 * =============================================
 * STORAGE.JS — LocalStorage Database Layer
 * Innovators 2.0 Employee Management Portal
 * =============================================
 * Provides a complete CRUD API on top of
 * localStorage, acting as the app's database.
 */

'use strict';

const DB = {
  /* ── Key Definitions ── */
  KEYS: {
    EMPLOYEES:     'i2_employees',
    WORKERS:       'i2_workers',
    ATTENDANCE:    'i2_attendance',
    LEAVE:         'i2_leave',
    SALARY:        'i2_salary',
    NOTIFICATIONS: 'i2_notifications',
    ANNOUNCEMENTS: 'i2_announcements',
    PROJECTS:      'i2_projects',
    TASKS:         'i2_tasks',
    DEPARTMENTS:   'i2_departments',
    DESIGNATIONS:  'i2_designations',
    ACTIVITY_LOG:  'i2_activity_log',
    SESSION:       'i2_session',
    SETTINGS:      'i2_settings',
    THEMES:        'i2_themes',
  },

  /* ── Generic Read / Write ── */
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      console.error('[Storage] Write failed for key:', key);
      return false;
    }
  },

  remove(key) { localStorage.removeItem(key); },

  /* ── Array Helpers ── */
  getArray(key) { return this.get(key) ?? []; },

  push(key, item) {
    const arr = this.getArray(key);
    arr.push(item);
    return this.set(key, arr);
  },

  /* ── Employee CRUD ── */
  getEmployees()    { return this.getArray(this.KEYS.EMPLOYEES); },
  getEmployee(id)   { return this.getEmployees().find(e => e.id === id) || null; },
  getEmployeeByEmail(email) { return this.getEmployees().find(e => e.email === email) || null; },

  saveEmployee(employee) {
    const list = this.getEmployees();
    const idx  = list.findIndex(e => e.id === employee.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...employee, updatedAt: new Date().toISOString() };
    } else {
      list.push({ ...employee, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.set(this.KEYS.EMPLOYEES, list);
    this.logActivity('Employee record saved', `${employee.name} (${employee.employeeId})`, 'employee');
  },

  deleteEmployee(id) {
    const list = this.getEmployees().filter(e => e.id !== id);
    this.set(this.KEYS.EMPLOYEES, list);
  },

  updateEmployeeStatus(id, status) {
    const emp = this.getEmployee(id);
    if (emp) { emp.status = status; this.saveEmployee(emp); }
  },

  /* ── Worker CRUD ── */
  getWorkers()    { return this.getArray(this.KEYS.WORKERS); },
  getWorker(id)   { return this.getWorkers().find(w => w.id === id) || null; },
  getWorkerByEmail(email) { return this.getWorkers().find(w => w.email === email) || null; },

  saveWorker(worker) {
    const list = this.getWorkers();
    const idx  = list.findIndex(w => w.id === worker.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...worker, updatedAt: new Date().toISOString() };
    } else {
      list.push({ ...worker, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.set(this.KEYS.WORKERS, list);
  },

  deleteWorker(id) {
    const list = this.getWorkers().filter(w => w.id !== id);
    this.set(this.KEYS.WORKERS, list);
  },

  /* ── Session Management ── */
  getSession() { return this.get(this.KEYS.SESSION); },

  setSession(user, role, remember = false) {
    const session = {
      userId:    user.id,
      email:     user.email,
      name:      user.name,
      role,
      avatar:    user.avatar || null,
      loginAt:   new Date().toISOString(),
      expiresAt: remember
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        : new Date(Date.now() + 8  * 60 * 60 * 1000).toISOString(),       // 8 hours
    };
    this.set(this.KEYS.SESSION, session);
    return session;
  },

  clearSession() { this.remove(this.KEYS.SESSION); },

  isSessionValid() {
    const session = this.getSession();
    if (!session) return false;
    return new Date(session.expiresAt) > new Date();
  },

  /* ── Attendance ── */
  getAttendance(userId) {
    const all = this.getArray(this.KEYS.ATTENDANCE);
    return userId ? all.filter(a => a.userId === userId) : all;
  },

  markAttendance(userId, type, note = '') {
    const record = {
      id:        this.generateId(),
      userId,
      type,        // 'in' | 'out'
      timestamp:  new Date().toISOString(),
      date:       new Date().toDateString(),
      note,
    };
    this.push(this.KEYS.ATTENDANCE, record);
    return record;
  },

  getTodayAttendance(userId) {
    const today = new Date().toDateString();
    return this.getAttendance(userId).filter(a => a.date === today);
  },

  calculateAttendancePercent(userId) {
    const records = this.getAttendance(userId);
    const workingDays = 22; // assumed monthly working days
    const presentDays = new Set(
      records.filter(r => r.type === 'in').map(r => r.date)
    ).size;
    return Math.min(100, Math.round((presentDays / workingDays) * 100));
  },

  /* ── Leave ── */
  getLeaves(userId) {
    const all = this.getArray(this.KEYS.LEAVE);
    return userId ? all.filter(l => l.userId === userId) : all;
  },

  applyLeave(leave) {
    const record = { ...leave, id: this.generateId(), status: 'pending', appliedAt: new Date().toISOString() };
    this.push(this.KEYS.LEAVE, record);
    this.addNotification({
      title:   'Leave Application',
      body:    `Your leave application has been submitted.`,
      type:    'info',
      userId:  leave.userId,
    });
    return record;
  },

  updateLeaveStatus(leaveId, status, adminNote = '') {
    const list = this.getArray(this.KEYS.LEAVE);
    const idx  = list.findIndex(l => l.id === leaveId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], status, adminNote, reviewedAt: new Date().toISOString() };
      this.set(this.KEYS.LEAVE, list);
    }
  },

  /* ── Salary ── */
  getSalary(userId) {
    const all = this.getArray(this.KEYS.SALARY);
    return userId ? all.filter(s => s.userId === userId) : all;
  },

  addSalaryRecord(record) {
    this.push(this.KEYS.SALARY, { ...record, id: this.generateId(), createdAt: new Date().toISOString() });
  },

  /* ── Notifications ── */
  getNotifications(userId) {
    const all = this.getArray(this.KEYS.NOTIFICATIONS);
    return userId ? all.filter(n => !n.userId || n.userId === userId) : all;
  },

  addNotification({ title, body, type = 'info', userId = null, link = '' }) {
    const notif = { id: this.generateId(), title, body, type, userId, link, read: false, createdAt: new Date().toISOString() };
    this.push(this.KEYS.NOTIFICATIONS, notif);
    return notif;
  },

  markNotificationRead(id) {
    const list = this.getArray(this.KEYS.NOTIFICATIONS);
    const idx  = list.findIndex(n => n.id === id);
    if (idx >= 0) { list[idx].read = true; this.set(this.KEYS.NOTIFICATIONS, list); }
  },

  markAllNotificationsRead(userId) {
    const list = this.getArray(this.KEYS.NOTIFICATIONS).map(n => {
      if (!n.userId || n.userId === userId) return { ...n, read: true };
      return n;
    });
    this.set(this.KEYS.NOTIFICATIONS, list);
  },

  getUnreadCount(userId) {
    return this.getNotifications(userId).filter(n => !n.read).length;
  },

  /* ── Announcements ── */
  getAnnouncements() { return this.getArray(this.KEYS.ANNOUNCEMENTS); },
  addAnnouncement(ann) {
    this.push(this.KEYS.ANNOUNCEMENTS, { ...ann, id: this.generateId(), createdAt: new Date().toISOString() });
  },
  deleteAnnouncement(id) {
    const list = this.getAnnouncements().filter(a => a.id !== id);
    this.set(this.KEYS.ANNOUNCEMENTS, list);
  },

  /* ── Projects ── */
  getProjects() { return this.getArray(this.KEYS.PROJECTS); },
  saveProject(proj) {
    const list = this.getProjects();
    const idx  = list.findIndex(p => p.id === proj.id);
    if (idx >= 0) { list[idx] = { ...list[idx], ...proj }; }
    else { list.push({ ...proj, id: this.generateId(), createdAt: new Date().toISOString() }); }
    this.set(this.KEYS.PROJECTS, list);
  },

  /* ── Tasks ── */
  getTasks(userId) {
    const all = this.getArray(this.KEYS.TASKS);
    return userId ? all.filter(t => t.assignedTo === userId) : all;
  },
  saveTask(task) {
    const list = this.getArray(this.KEYS.TASKS);
    const idx  = list.findIndex(t => t.id === task.id);
    if (idx >= 0) { list[idx] = { ...list[idx], ...task }; }
    else { list.push({ ...task, id: this.generateId(), createdAt: new Date().toISOString() }); }
    this.set(this.KEYS.TASKS, list);
  },

  /* ── Departments ── */
  getDepartments() {
    const stored = this.get(this.KEYS.DEPARTMENTS);
    if (stored) return stored;
    /* Default departments */
    const defaults = ['Engineering','Marketing','Finance','HR','Operations','Sales','Design','Legal','IT Support','Management'];
    this.set(this.KEYS.DEPARTMENTS, defaults);
    return defaults;
  },

  /* ── Designations ── */
  getDesignations() {
    const stored = this.get(this.KEYS.DESIGNATIONS);
    if (stored) return stored;
    const defaults = ['Software Engineer','Senior Engineer','Team Lead','Manager','Director','Analyst','Associate','Intern','VP','CEO'];
    this.set(this.KEYS.DESIGNATIONS, defaults);
    return defaults;
  },

  /* ── Activity Log ── */
  logActivity(action, detail, category = 'general') {
    const log = {
      id:        this.generateId(),
      action,
      detail,
      category,
      timestamp: new Date().toISOString(),
      session:   this.getSession()?.email || 'system',
    };
    const logs = this.getArray(this.KEYS.ACTIVITY_LOG);
    logs.unshift(log);
    // Keep only last 200 entries
    this.set(this.KEYS.ACTIVITY_LOG, logs.slice(0, 200));
    return log;
  },

  getActivityLog() { return this.getArray(this.KEYS.ACTIVITY_LOG); },

  /* ── Settings ── */
  getSettings() {
    return this.get(this.KEYS.SETTINGS) ?? {
      theme: 'light',
      language: 'en',
      emailNotif: true,
      pushNotif: true,
      smsNotif: false,
    };
  },
  saveSettings(settings) { this.set(this.KEYS.SETTINGS, settings); },

  /* ── Backup / Restore ── */
  backup() {
    const data = {};
    Object.entries(this.KEYS).forEach(([k, key]) => {
      data[key] = this.get(key);
    });
    return JSON.stringify(data, null, 2);
  },

  restore(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      Object.values(this.KEYS).forEach(key => {
        if (data[key] !== undefined) this.set(key, data[key]);
      });
      return true;
    } catch { return false; }
  },

  /* ── CSV Export ── */
  exportCSV(data, filename) {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows    = data.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','));
    const csv     = [headers.join(','), ...rows].join('\n');
    const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },

  /* ── Utilities ── */
  generateId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  },

  generateEmployeeId(role = 'EMP') {
    const prefix = role === 'worker' ? 'WRK' : 'EMP';
    const count  = (role === 'worker' ? this.getWorkers() : this.getEmployees()).length + 1;
    const year   = new Date().getFullYear();
    return `${prefix}-${year}-${String(count).padStart(4, '0')}`;
  },

  /* ── Seed Demo Data ── */
  seedDemoData() {
    if (this.get('i2_seeded')) return;

    /* Demo employees */
    const employees = [
      {
        id: 'demo-emp-001',
        employeeId: 'EMP-2025-0001',
        name: 'Arjun Sharma',
        email: 'arjun@innovators2.com',
        password: 'Pass@1234',
        mobile: '9876543210',
        gender: 'Male',
        dob: '1995-04-15',
        department: 'Engineering',
        designation: 'Senior Engineer',
        address: '42 Tech Park, Whitefield',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        pincode: '560066',
        bloodGroup: 'O+',
        experience: '5 years',
        skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        salary: 95000,
        joiningDate: '2020-06-01',
        status: 'active',
        role: 'employee',
        avatar: null,
        emergencyContact: '9876001122',
        education: [{ degree: 'B.Tech CSE', institution: 'IIT Madras', year: '2017' }],
        languages: [{ name: 'English', level: 90 }, { name: 'Hindi', level: 95 }, { name: 'Kannada', level: 60 }],
        social: { linkedin: 'linkedin.com/in/arjun', github: 'github.com/arjun' },
        bio: 'Passionate full-stack developer with 5+ years of experience.',
      },
      {
        id: 'demo-emp-002',
        employeeId: 'EMP-2025-0002',
        name: 'Priya Nair',
        email: 'priya@innovators2.com',
        password: 'Pass@1234',
        mobile: '8765432109',
        gender: 'Female',
        dob: '1998-08-22',
        department: 'Marketing',
        designation: 'Marketing Manager',
        address: '15 Jubilee Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
        pincode: '500033',
        bloodGroup: 'A+',
        experience: '4 years',
        skills: ['Digital Marketing', 'SEO', 'Analytics', 'Content Strategy'],
        salary: 78000,
        joiningDate: '2021-03-15',
        status: 'active',
        role: 'employee',
        avatar: null,
      },
      {
        id: 'demo-emp-003',
        employeeId: 'EMP-2025-0003',
        name: 'Rahul Mehta',
        email: 'rahul@innovators2.com',
        password: 'Pass@1234',
        mobile: '7654321098',
        gender: 'Male',
        dob: '1993-12-05',
        department: 'Finance',
        designation: 'Financial Analyst',
        address: '8 Marine Drive',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pincode: '400002',
        bloodGroup: 'B+',
        experience: '7 years',
        skills: ['Accounting', 'Excel', 'Financial Modelling', 'SAP'],
        salary: 110000,
        joiningDate: '2018-11-01',
        status: 'active',
        role: 'employee',
        avatar: null,
      },
    ];

    /* Demo workers */
    const workers = [
      {
        id: 'demo-wrk-001',
        employeeId: 'WRK-2025-0001',
        name: 'Ramu Kumar',
        email: 'ramu@innovators2.com',
        password: 'Pass@1234',
        mobile: '9123456780',
        gender: 'Male',
        department: 'Operations',
        designation: 'Maintenance Staff',
        status: 'active',
        role: 'worker',
        salary: 22000,
        avatar: null,
      },
    ];

    /* Demo announcements */
    const announcements = [
      { id: 'ann-001', title: 'Q3 Performance Review', body: 'All employees are requested to complete their Q3 self-assessment by July 31st.', postedBy: 'HR', createdAt: new Date().toISOString(), priority: 'high' },
      { id: 'ann-002', title: 'Office Closed – Independence Day', body: 'The office will remain closed on August 15th for Independence Day celebrations.', postedBy: 'Admin', createdAt: new Date().toISOString(), priority: 'normal' },
    ];

    /* Demo projects */
    const projects = [
      { id: 'proj-001', name: 'Portal Revamp', description: 'Redesign the employee portal.', status: 'in-progress', progress: 65, team: ['demo-emp-001', 'demo-emp-002'], deadline: '2025-09-30', priority: 'high' },
      { id: 'proj-002', name: 'ERP Integration', description: 'Integrate SAP with internal systems.', status: 'planning', progress: 15, team: ['demo-emp-003'], deadline: '2025-12-01', priority: 'medium' },
    ];

    /* Demo salary records */
    const salaryRecords = [
      { id: 'sal-001', userId: 'demo-emp-001', month: 'June 2025', basic: 70000, hra: 14000, allowances: 11000, deductions: 5000, net: 90000, status: 'paid', paidOn: '2025-06-30' },
      { id: 'sal-002', userId: 'demo-emp-001', month: 'May 2025',  basic: 70000, hra: 14000, allowances: 11000, deductions: 5000, net: 90000, status: 'paid', paidOn: '2025-05-31' },
    ];

    /* Demo attendance */
    const attendance = [];
    for (let i = 0; i < 22; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        attendance.push({ id: `att-in-${i}`, userId: 'demo-emp-001', type: 'in', date: d.toDateString(), timestamp: d.toISOString() });
        attendance.push({ id: `att-out-${i}`, userId: 'demo-emp-001', type: 'out', date: d.toDateString(), timestamp: new Date(d.getTime() + 8 * 3600000).toISOString() });
      }
    }

    /* Demo notifications */
    const notifications = [
      { id: 'notif-001', title: 'Salary Credited', body: 'Your June salary of ₹90,000 has been credited.', type: 'success', userId: 'demo-emp-001', read: false, createdAt: new Date().toISOString() },
      { id: 'notif-002', title: 'Leave Approved', body: 'Your leave application for Jul 10–12 has been approved.', type: 'success', userId: 'demo-emp-001', read: false, createdAt: new Date().toISOString() },
      { id: 'notif-003', title: 'New Announcement', body: 'Q3 Performance Review dates announced.', type: 'info', userId: null, read: false, createdAt: new Date().toISOString() },
    ];

    /* Demo tasks */
    const tasks = [
      { id: 'task-001', title: 'Design new login page', assignedTo: 'demo-emp-001', project: 'proj-001', priority: 'high', status: 'done', dueDate: '2025-07-10' },
      { id: 'task-002', title: 'Write API documentation', assignedTo: 'demo-emp-001', project: 'proj-001', priority: 'medium', status: 'in-progress', dueDate: '2025-07-20' },
      { id: 'task-003', title: 'Code review – Auth module', assignedTo: 'demo-emp-001', project: 'proj-002', priority: 'low', status: 'todo', dueDate: '2025-07-25' },
    ];

    employees.forEach(e => this.set(this.KEYS.EMPLOYEES, []));
    this.set(this.KEYS.EMPLOYEES, employees);
    this.set(this.KEYS.WORKERS, workers);
    this.set(this.KEYS.ANNOUNCEMENTS, announcements);
    this.set(this.KEYS.PROJECTS, projects);
    this.set(this.KEYS.SALARY, salaryRecords);
    this.set(this.KEYS.ATTENDANCE, attendance);
    this.set(this.KEYS.NOTIFICATIONS, notifications);
    this.set(this.KEYS.TASKS, tasks);
    this.set('i2_seeded', true);
  },
};

/* Auto-seed on first load */
DB.seedDemoData();
