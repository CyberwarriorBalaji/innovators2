/**
 * =============================================
 * APP.JS — Global Application Logic
 * Innovators 2.0 Employee Management Portal
 * =============================================
 */

'use strict';

/* ── Guard: Require login on protected pages ── */
const protectedPages = ['dashboard.html', 'profile.html', 'settings.html', 'worker.html', 'about.html'];
const adminOnlyPages  = ['admin.html'];

(function sessionGuard() {
  const page = window.location.pathname.split('/').pop() || 'index.html';

  if (protectedPages.some(p => page.includes(p))) {
    const session = DB.getSession();
    if (!session || !DB.isSessionValid()) {
      Toast.warning('Session Expired', 'Please log in again.');
      setTimeout(() => window.location.href = 'index.html', 1200);
    } else {
      /* Role Guard: workers should not be on employee dashboard */
      if (page.includes('dashboard.html') && session.role === 'worker') {
        window.location.href = 'worker.html';
      }
      if (page.includes('worker.html') && session.role === 'employee') {
        window.location.href = 'dashboard.html';
      }
    }
  }
})();

/* ── Navbar Notification Badge Updater ── */
function updateNotifBadge() {
  const session = DB.getSession();
  if (!session) return;
  const count = DB.getUnreadCount(session.userId);
  const badge = document.getElementById('notif-badge');
  if (badge) {
    badge.textContent = count > 9 ? '9+' : count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

/* ── Populate Navbar Profile Info ── */
function populateNavbarUser() {
  const session = DB.getSession();
  if (!session) return;
  const nameEl   = document.getElementById('navbar-user-name');
  const avatarEl = document.getElementById('navbar-avatar');
  if (nameEl)   nameEl.textContent = session.name?.split(' ')[0] || 'User';
  if (avatarEl && session.avatar) avatarEl.src = session.avatar;
  updateNotifBadge();
}

/* ── Logout ── */
function logout() {
  DB.clearSession();
  DB.logActivity('Logout', 'User logged out', 'auth');
  Toast.success('Logged Out', 'See you soon!');
  setTimeout(() => window.location.href = 'index.html', 800);
}

/* ── Render Notification Dropdown ── */
function renderNotifications() {
  const session = DB.getSession();
  if (!session) return;
  const list = DB.getNotifications(session.userId).slice(0, 10);
  const container = document.getElementById('notif-list');
  if (!container) return;

  if (!list.length) {
    container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-muted);font-size:0.85rem;">No notifications</p>';
    return;
  }

  const typeIcons = { success: '🟢', error: '🔴', warning: '🟡', info: '🔵' };

  container.innerHTML = list.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}" onclick="markRead('${n.id}')">
      <div class="notif-icon" style="background:${n.type==='success'?'rgba(34,197,94,0.1)':n.type==='error'?'rgba(239,68,68,0.1)':'rgba(26,115,232,0.1)'}">
        ${typeIcons[n.type] || '🔵'}
      </div>
      <div style="flex:1">
        <div class="notif-title">${n.title}</div>
        <div class="notif-body">${n.body}</div>
        <div class="notif-time">${DateUtil.timeAgo(n.createdAt)}</div>
      </div>
      ${!n.read ? '<div class="notif-dot"></div>' : ''}
    </div>
  `).join('');
}

function markRead(id) {
  DB.markNotificationRead(id);
  renderNotifications();
  updateNotifBadge();
}

function markAllRead() {
  const session = DB.getSession();
  if (session) DB.markAllNotificationsRead(session.userId);
  renderNotifications();
  updateNotifBadge();
}

/* ── Page Title Update ── */
function setPageTitle(title) {
  const el = document.getElementById('page-title');
  if (el) el.textContent = title;
}

/* ── Generic Charts with Canvas ── */
const Charts = {
  /**
   * Draw a bar chart on a canvas element.
   */
  bar(canvasId, labels, values, colors) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx    = canvas.getContext('2d');
    const W      = canvas.width  = canvas.offsetWidth;
    const H      = canvas.height = 240;
    const pad    = { top: 24, right: 16, bottom: 40, left: 50 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top  - pad.bottom;
    const maxVal = Math.max(...values, 1);
    const barW   = (chartW / values.length) * 0.6;
    const barGap = (chartW / values.length) * 0.4;

    ctx.clearRect(0, 0, W, H);

    /* Grid lines */
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      const val = Math.round(maxVal - (maxVal / 4) * i);
      ctx.fillStyle   = '#9aa5b1';
      ctx.font        = '11px Inter, sans-serif';
      ctx.textAlign   = 'right';
      ctx.fillText(val, pad.left - 6, y + 4);
    }

    /* Bars */
    values.forEach((val, i) => {
      const x  = pad.left + i * (chartW / values.length) + barGap / 2;
      const bH = (val / maxVal) * chartH;
      const y  = pad.top + chartH - bH;

      const grad = ctx.createLinearGradient(0, y, 0, y + bH);
      const col  = colors ? colors[i % colors.length] : '#1A73E8';
      grad.addColorStop(0, col);
      grad.addColorStop(1, col + '88');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect?.(x, y, barW, bH, [4, 4, 0, 0]) || ctx.rect(x, y, barW, bH);
      ctx.fill();

      /* Label */
      ctx.fillStyle  = '#9aa5b1';
      ctx.font       = '10px Inter, sans-serif';
      ctx.textAlign  = 'center';
      const labelX   = x + barW / 2;
      ctx.fillText(labels[i], labelX, H - pad.bottom + 14);

      /* Value on top */
      ctx.fillStyle = '#4a5568';
      ctx.fillText(val, labelX, y - 4);
    });
  },

  /**
   * Draw a doughnut/pie chart.
   */
  doughnut(canvasId, labels, values, colors) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx    = canvas.getContext('2d');
    const W      = canvas.width  = canvas.offsetWidth;
    const H      = canvas.height = 200;
    const cx     = W / 2;
    const cy     = H / 2;
    const R      = Math.min(cx, cy) - 24;
    const r      = R * 0.55;
    const total  = values.reduce((s, v) => s + v, 0) || 1;

    ctx.clearRect(0, 0, W, H);
    let startAngle = -Math.PI / 2;

    values.forEach((val, i) => {
      const slice = (val / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      startAngle += slice;
    });

    /* Doughnut hole */
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--white').trim() || '#ffffff';
    ctx.fill();

    /* Center text */
    ctx.fillStyle  = '#0d1b2e';
    ctx.font       = 'bold 16px Inter, sans-serif';
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total.toLocaleString(), cx, cy);

    /* Legend */
    const legendY = H - 12;
    const itemW   = W / labels.length;
    labels.forEach((label, i) => {
      const x = itemW * i + itemW / 2;
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(x - 24, legendY - 8, 12, 8);
      ctx.fillStyle  = '#9aa5b1';
      ctx.font       = '10px Inter, sans-serif';
      ctx.textAlign  = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x - 10, legendY - 4);
    });
  },

  /**
   * Draw a line chart.
   */
  line(canvasId, labels, datasets) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx    = canvas.getContext('2d');
    const W      = canvas.width  = canvas.offsetWidth;
    const H      = canvas.height = 240;
    const pad    = { top: 24, right: 16, bottom: 40, left: 50 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top  - pad.bottom;
    const allVals = datasets.flatMap(d => d.values);
    const maxVal  = Math.max(...allVals, 1);

    ctx.clearRect(0, 0, W, H);

    /* Grid */
    ctx.strokeStyle = 'rgba(0,0,0,0.07)';
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      ctx.fillStyle = '#9aa5b1'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), pad.left - 6, y + 4);
    }

    /* X labels */
    labels.forEach((lbl, i) => {
      const x = pad.left + (i / (labels.length - 1)) * chartW;
      ctx.fillStyle = '#9aa5b1'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(lbl, x, H - pad.bottom + 14);
    });

    datasets.forEach(({ values, color, label }) => {
      const points = values.map((v, i) => ({
        x: pad.left + (i / (values.length - 1)) * chartW,
        y: pad.top  + chartH - (v / maxVal) * chartH,
      }));

      /* Fill area */
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
      grad.addColorStop(0, color + '44');
      grad.addColorStop(1, color + '00');
      ctx.beginPath();
      ctx.moveTo(points[0].x, pad.top + chartH);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, pad.top + chartH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      /* Line */
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2.5;
      ctx.lineJoin    = 'round';
      points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();

      /* Dots */
      points.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      });
    });
  },

  /**
   * Draw a donut ring (attendance ring).
   */
  ring(canvasId, percent, color = '#1A73E8') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const S   = 120;
    canvas.width = canvas.height = S;
    const cx  = S / 2, cy = S / 2, R = S / 2 - 10;

    ctx.clearRect(0, 0, S, S);

    /* Track */
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 10; ctx.stroke();

    /* Arc */
    ctx.beginPath();
    ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + (percent / 100) * 2 * Math.PI);
    ctx.strokeStyle = color; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke();
  },
};

/* ── Confirm Dialog ── */
function confirmDialog(message, onConfirm) {
  const overlay = document.getElementById('confirm-overlay');
  const msgEl   = document.getElementById('confirm-message');
  const okBtn   = document.getElementById('confirm-ok');
  const cancelBtn = document.getElementById('confirm-cancel');

  if (!overlay) {
    /* Fallback */
    if (confirm(message)) onConfirm();
    return;
  }

  if (msgEl) msgEl.textContent = message;
  overlay.classList.add('active');

  const doConfirm = () => {
    overlay.classList.remove('active');
    okBtn.removeEventListener('click', doConfirm);
    cancelBtn.removeEventListener('click', doCancel);
    onConfirm();
  };
  const doCancel = () => {
    overlay.classList.remove('active');
    okBtn.removeEventListener('click', doConfirm);
    cancelBtn.removeEventListener('click', doCancel);
  };

  okBtn.addEventListener('click', doConfirm);
  cancelBtn.addEventListener('click', doCancel);
}

/* ── Global DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', () => {
  /* Apply saved theme */
  ThemeManager.init();

  /* Setup sidebar */
  SidebarManager.init();

  /* Setup dropdowns */
  DropdownManager.init();

  /* Populate navbar */
  populateNavbarUser();

  /* Render notifications */
  renderNotifications();

  /* Bind logout buttons */
  document.querySelectorAll('[data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', logout);
  });

  /* Bind dark mode toggles */
  document.querySelectorAll('.dark-toggle').forEach(btn => {
    btn.addEventListener('click', () => ThemeManager.toggle());
  });

  /* Bind mark all read */
  const markAllBtn = document.getElementById('mark-all-read');
  if (markAllBtn) markAllBtn.addEventListener('click', markAllRead);

  /* Start clock */
  Clock.start('navbar-clock');

  /* Hide loading screen */
  Loader.hide(1800);

  /* Add page entrance animation */
  document.body.classList.add('page-enter');
});
