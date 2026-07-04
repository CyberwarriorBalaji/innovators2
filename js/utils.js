/**
 * =============================================
 * UTILS.JS — Utility Functions
 * Innovators 2.0 Employee Management Portal
 * =============================================
 */

'use strict';

/* ── QR Code Generator (Pure Canvas) ── */
const QRGen = {
  /**
   * Draws a simple QR-like matrix onto a canvas element.
   * Uses a deterministic hash to produce a stable visual.
   * @param {string} text  - Data to encode
   * @param {HTMLCanvasElement} canvas
   * @param {number} size  - Canvas pixel size
   */
  generate(text, canvas, size = 160) {
    const ctx  = canvas.getContext('2d');
    const MODS = 25; // module count
    const MOD  = Math.floor(size / MODS);
    canvas.width  = MODS * MOD;
    canvas.height = MODS * MOD;

    /* Build a bit-matrix via a simple hash */
    const hash  = this._hash(text);
    const matrix = Array.from({ length: MODS }, (_, r) =>
      Array.from({ length: MODS }, (__, c) => {
        /* Finder patterns (top-left, top-right, bottom-left) */
        if (this._isFinder(r, c, MODS)) return 1;
        /* Data bits via hash */
        const bit = (hash[(r * MODS + c) % hash.length]) & 1;
        return bit;
      })
    );

    /* Draw */
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < MODS; r++) {
      for (let c = 0; c < MODS; c++) {
        ctx.fillStyle = matrix[r][c] ? '#0A4D8C' : '#ffffff';
        ctx.fillRect(c * MOD, r * MOD, MOD, MOD);
      }
    }

    /* Quiet zone border */
    ctx.strokeStyle = '#0A4D8C';
    ctx.lineWidth   = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  },

  _isFinder(r, c, n) {
    const inTopLeft     = r < 8 && c < 8;
    const inTopRight    = r < 8 && c >= n - 8;
    const inBottomLeft  = r >= n - 8 && c < 8;
    if (inTopLeft || inTopRight || inBottomLeft) {
      const or = r < 8 ? r : r - (n - 8);
      const oc = c < 8 ? c : c - (n - 8);
      return (or === 0 || or === 6 || oc === 0 || oc === 6 ||
              (or >= 2 && or <= 4 && oc >= 2 && oc <= 4));
    }
    return false;
  },

  _hash(str) {
    const buf = new Uint8Array(str.length * 2);
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      buf[i * 2]     = code & 0xff;
      buf[i * 2 + 1] = (code >> 8) & 0xff;
    }
    /* Spread with MurmurHash-like mixing */
    const result = new Uint8Array(256);
    let h = 0xdeadbeef;
    for (let i = 0; i < buf.length; i++) {
      h ^= buf[i];
      h  = (h ^ (h >>> 13)) >>> 0;
      h  = (Math.imul(h, 0xbf58476d)) >>> 0;
      result[i % 256] = h & 0xff;
    }
    return result;
  },
};

/* ── Toast Notifications ── */
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(title, message = '', type = 'info', duration = 4000) {
    if (!this.container) this.init();

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Close">×</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => this.remove(toast));
    this.container.appendChild(toast);

    const timer = setTimeout(() => this.remove(toast), duration);
    toast._timer = timer;
    return toast;
  },

  remove(toast) {
    clearTimeout(toast._timer);
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
    setTimeout(() => toast.remove(), 400); // Fallback
  },

  success(title, msg, dur) { return this.show(title, msg, 'success', dur); },
  error  (title, msg, dur) { return this.show(title, msg, 'error',   dur); },
  warning(title, msg, dur) { return this.show(title, msg, 'warning', dur); },
  info   (title, msg, dur) { return this.show(title, msg, 'info',    dur); },
};

/* ── Modal Manager ── */
const Modal = {
  open(id)  {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },
  close(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('active');
      document.body.style.overflow = '';
    }
  },
  closeAll() {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  },
};

/* ── Loading Screen ── */
const Loader = {
  show() {
    const el = document.getElementById('loading-screen');
    if (el) el.classList.remove('hidden');
  },
  hide(delay = 2000) {
    setTimeout(() => {
      const el = document.getElementById('loading-screen');
      if (el) el.classList.add('hidden');
    }, delay);
  },
};

/* ── Dark Mode ── */
const ThemeManager = {
  init() {
    const saved = localStorage.getItem('i2_theme') || 'light';
    this.apply(saved);
  },
  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next    = current === 'dark' ? 'light' : 'dark';
    this.apply(next);
    return next;
  },
  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('i2_theme', theme);
    /* Sync all toggles on the page */
    document.querySelectorAll('.dark-toggle').forEach(btn => {
      btn.classList.toggle('active', theme === 'dark');
    });
  },
  current() { return document.documentElement.getAttribute('data-theme') || 'light'; },
};

/* ── Password Strength Meter ── */
const PasswordStrength = {
  check(password) {
    let score = 0;
    if (password.length >= 8)  score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return { score, label: labels[score] };
  },

  render(password, wrapId) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    const { score, label } = this.check(password);
    wrap.className = `password-strength strength-${score}`;
    const segs = wrap.querySelectorAll('.strength-segment');
    segs.forEach((s, i) => {
      s.style.background = i < score ? '' : 'var(--border)';
    });
    const lbl = wrap.querySelector('.strength-label');
    if (lbl) lbl.textContent = password ? label : '';
  },
};

/* ── Image Preview Handler ── */
const ImagePreview = {
  bind(inputId, previewId, defaultSrc = '') {
    const input   = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        Toast.error('File Too Large', 'Please select an image under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        preview.src = ev.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  },

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};

/* ── Animated Counter ── */
const AnimCounter = {
  run(el, target, duration = 1500, prefix = '', suffix = '') {
    if (!el) return;
    const start  = 0;
    const step   = (timestamp) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // ease out cubic
      el.textContent = prefix + Math.round(start + eased * (target - start)).toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    let startTime;
    requestAnimationFrame(ts => { startTime = ts; step(ts); });
  },
};

/* ── Ripple Effect ── */
const Ripple = {
  init() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn, .ripple');
      if (!btn) return;
      const rect   = btn.getBoundingClientRect();
      const circle = document.createElement('span');
      const size   = Math.max(rect.width, rect.height) * 2;
      circle.style.cssText = `
        width:${size}px;height:${size}px;
        left:${e.clientX - rect.left - size/2}px;
        top:${e.clientY - rect.top - size/2}px;
        position:absolute;border-radius:50%;
        background:rgba(255,255,255,0.3);
        transform:scale(0);animation:rippleAnim 0.6s linear;
        pointer-events:none;
      `;
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(circle);
      circle.addEventListener('animationend', () => circle.remove());
    });
    /* Inject keyframe */
    const style = document.createElement('style');
    style.textContent = '@keyframes rippleAnim{to{transform:scale(1);opacity:0}}';
    document.head.appendChild(style);
  },
};

/* ── Date & Time Utilities ── */
const DateUtil = {
  format(date, fmt = 'DD/MM/YYYY') {
    const d = new Date(date);
    if (isNaN(d)) return 'N/A';
    const dd   = String(d.getDate()).padStart(2, '0');
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return fmt.replace('DD', dd).replace('MM', mm).replace('YYYY', yyyy);
  },

  timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 1)  return 'just now';
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  },

  formatCurrency(amount, currency = '₹') {
    return `${currency}${Number(amount).toLocaleString('en-IN')}`;
  },

  monthName(monthIndex) {
    return ['January','February','March','April','May','June','July','August','September','October','November','December'][monthIndex];
  },
};

/* ── Clock ── */
const Clock = {
  start(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const tick = () => {
      const now = new Date();
      const h   = String(now.getHours()).padStart(2,'0');
      const m   = String(now.getMinutes()).padStart(2,'0');
      const s   = String(now.getSeconds()).padStart(2,'0');
      el.textContent = `${h}:${m}:${s}`;
    };
    tick();
    return setInterval(tick, 1000);
  },
};

/* ── Particle Background ── */
const Particles = {
  init(containerId, count = 30) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const size     = Math.random() * 12 + 4;
      const duration = Math.random() * 20 + 15;
      const delay    = Math.random() * 20;
      const left     = Math.random() * 100;
      const opacity  = Math.random() * 0.5 + 0.1;
      const isGold   = Math.random() > 0.7;
      p.className  = 'login-particle';
      p.style.cssText = `
        width:${size}px;height:${size}px;
        left:${left}%;
        background:${isGold ? 'rgba(245,185,66,' + opacity + ')' : 'rgba(255,255,255,' + opacity + ')'};
        animation-duration:${duration}s;
        animation-delay:-${delay}s;
      `;
      container.appendChild(p);
    }
  },
};

/* ── Search / Filter / Sort ── */
const DataUtils = {
  search(data, query, fields) {
    if (!query) return data;
    const q = query.toLowerCase();
    return data.filter(item =>
      fields.some(f => String(item[f] ?? '').toLowerCase().includes(q))
    );
  },

  sort(data, field, direction = 'asc') {
    return [...data].sort((a, b) => {
      const va = a[field] ?? '';
      const vb = b[field] ?? '';
      if (va < vb) return direction === 'asc' ? -1 : 1;
      if (va > vb) return direction === 'asc' ?  1 : -1;
      return 0;
    });
  },

  paginate(data, page, perPage = 10) {
    const total = data.length;
    const pages = Math.ceil(total / perPage);
    const start = (page - 1) * perPage;
    return {
      data:    data.slice(start, start + perPage),
      total,
      pages,
      page,
      perPage,
    };
  },
};

/* ── Sidebar Toggle ── */
const SidebarManager = {
  init() {
    const sidebar  = document.getElementById('sidebar');
    const mainArea = document.getElementById('main-area');
    const overlay  = document.getElementById('sidebar-overlay');
    const hamburger = document.querySelectorAll('.hamburger');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');

    hamburger.forEach(btn => {
      btn.addEventListener('click', () => {
        const isMobile = window.innerWidth <= 1024;
        if (isMobile) {
          sidebar?.classList.toggle('mobile-open');
          overlay?.classList.toggle('active');
        } else {
          sidebar?.classList.toggle('collapsed');
          mainArea?.classList.toggle('expanded');
        }
      });
    });

    toggleBtn?.addEventListener('click', () => {
      sidebar?.classList.toggle('collapsed');
      mainArea?.classList.toggle('expanded');
    });

    overlay?.addEventListener('click', () => {
      sidebar?.classList.remove('mobile-open');
      overlay.classList.remove('active');
    });

    /* Close mobile sidebar on nav click */
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
          sidebar?.classList.remove('mobile-open');
          overlay?.classList.remove('active');
        }
      });
    });
  },
};

/* ── Profile Dropdown ── */
const DropdownManager = {
  init() {
    document.querySelectorAll('[data-dropdown-toggle]').forEach(btn => {
      const targetId = btn.getAttribute('data-dropdown-toggle');
      const target   = document.getElementById(targetId);
      if (!target) return;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = target.classList.contains('open');
        /* Close all */
        document.querySelectorAll('.notif-dropdown, .profile-dropdown').forEach(d => d.classList.remove('open'));
        if (!isOpen) target.classList.add('open');
      });
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.notif-dropdown, .profile-dropdown').forEach(d => d.classList.remove('open'));
    });
  },
};

/* ── Export PDF / Print ── */
const PrintUtil = {
  printSection(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Innovators 2.0 – Print</title>
      <style>
        body{font-family:Inter,sans-serif;color:#0d1b2e;padding:20px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ddd;padding:8px;text-align:left}
        th{background:#0A4D8C;color:white}
        h2{color:#0A4D8C}
      </style>
      </head><body>${el.innerHTML}</body></html>
    `);
    win.document.close();
    win.print();
  },
};

/* ── Initialise everything on DOM ready ── */
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  Ripple.init();
  Toast.init();
});
