/**
 * =============================================
 * LOGIN.JS — Login Page Logic
 * Innovators 2.0 Employee Management Portal
 * =============================================
 */

'use strict';

/* ── Panel State Machine ── */
const PANELS = { LOGIN: 'login', OTP: 'otp', FORGOT: 'forgot' };
let currentPanel = PANELS.LOGIN;
let otpTimer     = null;
let generatedOTP = '';

/* ── Switch between login / otp / forgot panels ── */
function showPanel(panel) {
  document.querySelectorAll('.login-panel').forEach(p => p.style.display = 'none');
  const el = document.getElementById(`panel-${panel}`);
  if (el) el.style.display = 'block';
  currentPanel = panel;
}

/* ── OTP Generation ── */
function generateOTP() {
  generatedOTP = String(Math.floor(100000 + Math.random() * 900000));
  console.info(`[DEV] Generated OTP: ${generatedOTP}`); // For demo
  Toast.info('OTP Sent', `For demo, your OTP is: ${generatedOTP}`, 8000);
}

/* ── OTP Timer ── */
function startOTPTimer(seconds = 60) {
  const timerEl   = document.getElementById('otp-timer-count');
  const resendBtn = document.getElementById('resend-otp-btn');
  if (resendBtn) resendBtn.disabled = true;
  clearInterval(otpTimer);

  let remaining = seconds;
  const update  = () => {
    if (timerEl) timerEl.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(otpTimer);
      if (resendBtn) resendBtn.disabled = false;
    }
    remaining--;
  };
  update();
  otpTimer = setInterval(update, 1000);
}

/* ── OTP Input Navigation ── */
function initOTPInputs() {
  const inputs = document.querySelectorAll('.otp-input');
  inputs.forEach((input, i) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val.slice(-1);
      if (val && i < inputs.length - 1) inputs[i + 1].focus();
      input.classList.toggle('filled', !!e.target.value);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && i > 0) {
        inputs[i - 1].focus();
        inputs[i - 1].value = '';
        inputs[i - 1].classList.remove('filled');
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const data = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      data.split('').forEach((ch, j) => {
        if (inputs[j]) { inputs[j].value = ch; inputs[j].classList.add('filled'); }
      });
      if (inputs[data.length]) inputs[data.length].focus();
    });
  });
}

/* ── Get OTP Value ── */
function getOTPValue() {
  return Array.from(document.querySelectorAll('.otp-input')).map(i => i.value).join('');
}

/* ── Login Handler ── */
function handleLogin(e) {
  e.preventDefault();

  const emailEl  = document.getElementById('login-email');
  const passEl   = document.getElementById('login-password');
  const rememberEl = document.getElementById('remember-me');
  const email    = emailEl.value.trim();
  const password = passEl.value;
  const remember = rememberEl?.checked;

  /* Clear previous errors */
  Validator.clearAll(e.target);

  let valid = true;

  if (!Validator.rules.email(email)) {
    Validator.showError(emailEl, Validator.messages.email);
    valid = false;
  }
  if (!password) {
    Validator.showError(passEl, Validator.messages.required);
    valid = false;
  }
  if (!valid) return;

  /* Show loading */
  const btn = document.getElementById('login-btn');
  btn.classList.add('loading');
  btn.disabled = true;

  setTimeout(() => {
    btn.classList.remove('loading');
    btn.disabled = false;

    /* Admin check */
    if (email === 'head@innovators2.com' && password === 'head@innovators') {
      const adminUser = { id: 'admin-001', email, name: 'Head Admin', avatar: null };
      DB.setSession(adminUser, 'admin', remember);
      DB.logActivity('Admin Login', email, 'auth');
      Toast.success('Welcome, Admin!', 'Redirecting to Head Dashboard…');
      setTimeout(() => window.location.href = 'admin.html', 1000);
      return;
    }

    /* Employee check */
    let user = DB.getEmployeeByEmail(email);
    let role = 'employee';

    if (!user) {
      user = DB.getWorkerByEmail(email);
      role = 'worker';
    }

    if (!user) {
      Validator.showError(emailEl, 'No account found with this email.');
      Toast.error('Login Failed', 'Email not registered.');
      return;
    }

    if (user.password !== password) {
      Validator.showError(passEl, 'Incorrect password.');
      Toast.error('Login Failed', 'Incorrect password.');
      return;
    }

    if (user.status === 'suspended') {
      Toast.error('Account Suspended', 'Contact HR for assistance.');
      return;
    }

    /* Success */
    DB.setSession(user, role, remember);
    DB.logActivity('Login', email, 'auth');
    Toast.success(`Welcome back, ${user.name.split(' ')[0]}!`, 'Loading your dashboard…');

    setTimeout(() => {
      window.location.href = role === 'worker' ? 'worker.html' : 'dashboard.html';
    }, 1000);
  }, 1200);
}

/* ── OTP Login Handler ── */
function handleOTPLogin(e) {
  e.preventDefault();

  const emailEl = document.getElementById('otp-email');
  const email   = emailEl.value.trim();

  if (!Validator.rules.email(email)) {
    Validator.showError(emailEl, Validator.messages.email);
    return;
  }

  const user = DB.getEmployeeByEmail(email) || DB.getWorkerByEmail(email);
  if (!user && email !== 'head@innovators2.com') {
    Validator.showError(emailEl, 'No account found with this email.');
    return;
  }

  generateOTP();
  startOTPTimer(60);
  showPanel(PANELS.OTP);
  document.getElementById('otp-for-email').textContent = email;
}

/* ── Verify OTP ── */
function verifyOTP() {
  const entered = getOTPValue();
  if (entered.length < 6) {
    Toast.warning('Incomplete OTP', 'Please enter all 6 digits.');
    return;
  }
  if (entered !== generatedOTP) {
    Toast.error('Invalid OTP', 'The OTP you entered is incorrect.');
    document.querySelectorAll('.otp-input').forEach(i => { i.value = ''; i.classList.remove('filled'); });
    document.querySelector('.otp-input')?.focus();
    return;
  }

  const email = document.getElementById('otp-email').value.trim();
  let user = DB.getEmployeeByEmail(email) || DB.getWorkerByEmail(email);
  const role = user?.role || (email === 'head@innovators2.com' ? 'admin' : 'employee');

  if (!user) user = { id: 'admin-001', email, name: 'Head Admin', avatar: null };

  DB.setSession(user, role, false);
  DB.logActivity('OTP Login', email, 'auth');
  Toast.success('OTP Verified!', 'Redirecting…');
  clearInterval(otpTimer);

  setTimeout(() => {
    window.location.href = role === 'worker' ? 'worker.html' : role === 'admin' ? 'admin.html' : 'dashboard.html';
  }, 800);
}

/* ── Google Login Simulation ── */
function handleGoogleLogin() {
  Toast.info('Google Sign-In', 'Simulating Google OAuth…');
  setTimeout(() => {
    /* Demo: log in as first employee */
    const employees = DB.getEmployees();
    if (employees.length) {
      const user = employees[0];
      DB.setSession(user, 'employee', false);
      Toast.success(`Welcome, ${user.name.split(' ')[0]}!`, 'Signed in with Google.');
      setTimeout(() => window.location.href = 'dashboard.html', 800);
    } else {
      Toast.error('No Accounts', 'Register an account first.');
    }
  }, 1500);
}

/* ── Forgot Password ── */
function handleForgotPassword(e) {
  e.preventDefault();

  const emailEl = document.getElementById('forgot-email');
  const email   = emailEl.value.trim();

  if (!Validator.rules.email(email)) {
    Validator.showError(emailEl, Validator.messages.email);
    return;
  }

  const user = DB.getEmployeeByEmail(email) || DB.getWorkerByEmail(email);
  if (!user) {
    Validator.showError(emailEl, 'No account with this email.');
    return;
  }

  /* Simulate email */
  Toast.success('Reset Link Sent!', `A password reset link has been sent to ${email}`);
  setTimeout(() => showPanel(PANELS.LOGIN), 2000);
}

/* ── Remember Me — Pre-fill ── */
function loadRememberedEmail() {
  const saved = localStorage.getItem('i2_remember_email');
  if (saved) {
    const emailEl = document.getElementById('login-email');
    const remEl   = document.getElementById('remember-me');
    if (emailEl) emailEl.value = saved;
    if (remEl)   remEl.checked = true;
  }
}

/* ── Redirect if Already Logged In ── */
function checkExistingSession() {
  if (DB.isSessionValid()) {
    const session = DB.getSession();
    if (session.role === 'admin')    window.location.href = 'admin.html';
    else if (session.role === 'worker') window.location.href = 'worker.html';
    else                              window.location.href = 'dashboard.html';
  }
}

/* ── DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', () => {
  checkExistingSession();
  loadRememberedEmail();
  initOTPInputs();

  /* Show default panel */
  showPanel(PANELS.LOGIN);

  /* Login form */
  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  /* OTP send form */
  const otpForm = document.getElementById('otp-send-form');
  if (otpForm) otpForm.addEventListener('submit', handleOTPLogin);

  /* OTP verify button */
  const verifyBtn = document.getElementById('verify-otp-btn');
  if (verifyBtn) verifyBtn.addEventListener('click', verifyOTP);

  /* Resend OTP */
  const resendBtn = document.getElementById('resend-otp-btn');
  if (resendBtn) resendBtn.addEventListener('click', () => {
    generateOTP();
    startOTPTimer(60);
  });

  /* Forgot password form */
  const forgotForm = document.getElementById('forgot-form');
  if (forgotForm) forgotForm.addEventListener('submit', handleForgotPassword);

  /* Google login */
  const googleBtn = document.getElementById('google-login-btn');
  if (googleBtn) googleBtn.addEventListener('click', handleGoogleLogin);

  /* Show OTP panel link */
  document.getElementById('show-otp-btn')?.addEventListener('click', () => showPanel(PANELS.OTP));

  /* Show forgot link */
  document.getElementById('show-forgot-btn')?.addEventListener('click', () => showPanel(PANELS.FORGOT));

  /* Back to login */
  document.querySelectorAll('.back-to-login-btn').forEach(btn =>
    btn.addEventListener('click', () => showPanel(PANELS.LOGIN))
  );

  /* Dark mode toggle */
  document.getElementById('login-dark-toggle')?.addEventListener('click', () => ThemeManager.toggle());

  /* Particles */
  Particles.init('login-particles', 35);

  /* Remember me: save email on login */
  document.getElementById('login-form')?.addEventListener('submit', () => {
    const remEl   = document.getElementById('remember-me');
    const emailEl = document.getElementById('login-email');
    if (remEl?.checked) {
      localStorage.setItem('i2_remember_email', emailEl.value.trim());
    } else {
      localStorage.removeItem('i2_remember_email');
    }
  });

  /* Live validation */
  const emailEl = document.getElementById('login-email');
  const passEl  = document.getElementById('login-password');
  if (emailEl) Validator.bindLive(emailEl, ['required', 'email']);
  if (passEl)  Validator.bindLive(passEl,  ['required']);
});
