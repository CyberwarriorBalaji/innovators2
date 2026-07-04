/**
 * =============================================
 * REGISTER.JS — Registration Page Logic
 * Innovators 2.0 Employee Management Portal
 * =============================================
 */

'use strict';

/* ── State ── */
let currentStep = 1;
const TOTAL_STEPS = 4;
let registerRole  = 'employee'; // 'employee' | 'worker'
let generatedEmpId = '';
let profilePhoto = null; // base64
let uploadedFiles = { resume: null, certificate: null, govId: null, signature: null };

/* ── Step Navigation ── */
function goToStep(step) {
  if (step < 1 || step > TOTAL_STEPS) return;

  /* Validate current before advancing */
  if (step > currentStep && !validateCurrentStep()) return;

  document.querySelectorAll('.reg-step').forEach((el, i) => {
    el.style.display = (i + 1 === step) ? 'block' : 'none';
  });

  /* Update indicator */
  document.querySelectorAll('.step-item').forEach((el, i) => {
    el.classList.toggle('active',    i + 1 === step);
    el.classList.toggle('completed', i + 1 < step);
  });

  currentStep = step;
  updateStepButtons();

  /* Scroll to top of form */
  document.getElementById('register-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateStepButtons() {
  const prevBtn = document.getElementById('reg-prev-btn');
  const nextBtn = document.getElementById('reg-next-btn');
  const submitBtn = document.getElementById('reg-submit-btn');

  if (prevBtn)   prevBtn.style.display    = currentStep > 1 ? 'inline-flex' : 'none';
  if (nextBtn)   nextBtn.style.display    = currentStep < TOTAL_STEPS ? 'inline-flex' : 'none';
  if (submitBtn) submitBtn.style.display  = currentStep === TOTAL_STEPS ? 'inline-flex' : 'none';
}

/* ── Validate Current Step ── */
function validateCurrentStep() {
  let valid = true;

  if (currentStep === 1) {
    const fields = [
      { el: document.getElementById('reg-name'),   rules: ['required', 'alphaSpace', ['minLen', 3]] },
      { el: document.getElementById('reg-email'),  rules: ['required', 'email'] },
      { el: document.getElementById('reg-mobile'), rules: ['required', 'mobile'] },
      { el: document.getElementById('reg-dob'),    rules: ['required', 'date'] },
      { el: document.getElementById('reg-gender'), rules: ['required'] },
    ];
    valid = Validator.validateForm(fields);

    const dob = document.getElementById('reg-dob')?.value;
    if (dob && !Validator.isAdult(dob)) {
      Validator.showError(document.getElementById('reg-dob'), 'Must be at least 18 years old.');
      valid = false;
    }

    /* Check email uniqueness */
    if (valid) {
      const email = document.getElementById('reg-email').value.trim();
      if (DB.getEmployeeByEmail(email) || DB.getWorkerByEmail(email)) {
        Validator.showError(document.getElementById('reg-email'), 'This email is already registered.');
        valid = false;
      }
    }
  }

  if (currentStep === 2) {
    const fields = [
      { el: document.getElementById('reg-dept'),     rules: ['required'] },
      { el: document.getElementById('reg-desig'),    rules: ['required'] },
      { el: document.getElementById('reg-address'),  rules: ['required'] },
      { el: document.getElementById('reg-city'),     rules: ['required'] },
      { el: document.getElementById('reg-state'),    rules: ['required'] },
      { el: document.getElementById('reg-country'),  rules: ['required'] },
      { el: document.getElementById('reg-pincode'),  rules: ['required', 'pincode'] },
    ];
    valid = Validator.validateForm(fields);
  }

  if (currentStep === 3) {
    const passEl    = document.getElementById('reg-password');
    const confirmEl = document.getElementById('reg-confirm-password');
    const fields = [
      { el: passEl,    rules: ['required', 'password'] },
      { el: confirmEl, rules: ['required'] },
    ];
    valid = Validator.validateForm(fields);
    if (valid && passEl.value !== confirmEl.value) {
      Validator.showError(confirmEl, Validator.messages.match);
      valid = false;
    }
  }

  if (currentStep === 4) {
    const termsEl = document.getElementById('reg-terms');
    if (!termsEl?.checked) {
      Toast.warning('Terms Required', 'Please accept the terms and conditions.');
      valid = false;
    }
  }

  return valid;
}

/* ── Generate Employee ID ── */
function generateEmployeeId() {
  generatedEmpId = DB.generateEmployeeId(registerRole);
  const el = document.getElementById('generated-emp-id');
  if (el) {
    el.textContent = generatedEmpId;
    /* Animate */
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'pageFadeIn 0.4s ease';
  }
}

/* ── Render QR Code Preview ── */
function renderRegistrationQR() {
  const canvas = document.getElementById('reg-qr-canvas');
  if (!canvas || !generatedEmpId) return;
  const data = JSON.stringify({
    id:   generatedEmpId,
    name: document.getElementById('reg-name')?.value || '',
    company: 'Innovators 2.0',
  });
  QRGen.generate(data, canvas, 140);
}

/* ── Role Switch ── */
function setRole(role) {
  registerRole = role;
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.role === role);
  });
  generateEmployeeId();

  /* Show/hide role-specific fields */
  const empOnlyFields = document.querySelectorAll('.emp-only');
  empOnlyFields.forEach(el => {
    el.style.display = role === 'employee' ? '' : 'none';
  });
}

/* ── Photo Upload ── */
function initPhotoUpload() {
  const input   = document.getElementById('reg-photo');
  const preview = document.getElementById('photo-preview');
  const placeholder = document.getElementById('photo-placeholder');

  input?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validation = Validator.validateFile(file, { maxSizeMB: 2, types: ['image'] });
    if (!validation.valid) { Toast.error('Invalid File', validation.message); return; }
    profilePhoto = await ImagePreview.fileToBase64(file);
    if (preview) { preview.src = profilePhoto; preview.style.display = 'block'; }
    if (placeholder) placeholder.style.display = 'none';
    Toast.success('Photo Uploaded', 'Profile photo set.');
  });
}

/* ── File Uploads ── */
function initFileUploads() {
  const uploadConfigs = [
    { inputId: 'reg-resume',      key: 'resume',      types: ['pdf', 'doc'],   label: 'Resume' },
    { inputId: 'reg-certificate', key: 'certificate', types: ['pdf', 'image'], label: 'Certificate' },
    { inputId: 'reg-gov-id',      key: 'govId',       types: ['pdf', 'image'], label: 'Government ID' },
    { inputId: 'reg-signature',   key: 'signature',   types: ['image'],        label: 'Signature' },
  ];

  uploadConfigs.forEach(({ inputId, key, types, label }) => {
    const input = document.getElementById(inputId);
    input?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const validation = Validator.validateFile(file, { maxSizeMB: 5, types });
      if (!validation.valid) { Toast.error(`Invalid ${label}`, validation.message); return; }
      uploadedFiles[key] = await ImagePreview.fileToBase64(file);
      Toast.success(`${label} Uploaded`, `${file.name} uploaded successfully.`);

      /* Show file name */
      const nameEl = document.getElementById(`${inputId}-name`);
      if (nameEl) nameEl.textContent = file.name;
    });
  });
}

/* ── Skills Input ── */
let skills = [];

function initSkillsInput() {
  const input    = document.getElementById('skills-input');
  const container = document.getElementById('skills-container');
  if (!input) return;

  input.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.value.trim()) {
      e.preventDefault();
      const skill = input.value.trim().replace(/,+$/, '');
      if (skill && !skills.includes(skill) && skills.length < 15) {
        skills.push(skill);
        renderSkills();
        input.value = '';
      }
    }
  });
}

function renderSkills() {
  const container = document.getElementById('skills-container');
  if (!container) return;
  container.innerHTML = skills.map((s, i) => `
    <div class="chip">
      ${s}
      <span class="chip-remove" onclick="removeSkill(${i})">×</span>
    </div>
  `).join('');
}

function removeSkill(idx) {
  skills.splice(idx, 1);
  renderSkills();
}

/* ── Populate Dropdowns ── */
function populateDropdowns() {
  const deptEl  = document.getElementById('reg-dept');
  const desigEl = document.getElementById('reg-desig');

  if (deptEl) {
    DB.getDepartments().forEach(d => {
      const opt = document.createElement('option');
      opt.value = d; opt.textContent = d;
      deptEl.appendChild(opt);
    });
  }

  if (desigEl) {
    DB.getDesignations().forEach(d => {
      const opt = document.createElement('option');
      opt.value = d; opt.textContent = d;
      desigEl.appendChild(opt);
    });
  }
}

/* ── Password Strength ── */
function initPasswordStrength() {
  const passEl = document.getElementById('reg-password');
  passEl?.addEventListener('input', () => {
    PasswordStrength.render(passEl.value, 'password-strength-bar');
  });
}

/* ── Final Submit ── */
async function handleRegisterSubmit(e) {
  e.preventDefault();
  if (!validateCurrentStep()) return;

  const submitBtn = document.getElementById('reg-submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Registering…';

  await new Promise(r => setTimeout(r, 800)); // Simulate async

  /* Build user object */
  const user = {
    id:         DB.generateId(),
    employeeId: generatedEmpId,
    role:       registerRole,
    name:       document.getElementById('reg-name').value.trim(),
    email:      document.getElementById('reg-email').value.trim(),
    mobile:     document.getElementById('reg-mobile').value.trim(),
    dob:        document.getElementById('reg-dob').value,
    gender:     document.getElementById('reg-gender').value,
    department: document.getElementById('reg-dept').value,
    designation: document.getElementById('reg-desig').value,
    address:    document.getElementById('reg-address').value.trim(),
    city:       document.getElementById('reg-city').value.trim(),
    state:      document.getElementById('reg-state').value.trim(),
    country:    document.getElementById('reg-country').value.trim(),
    pincode:    document.getElementById('reg-pincode').value.trim(),
    bloodGroup: document.getElementById('reg-blood')?.value || '',
    emergencyContact: document.getElementById('reg-emergency')?.value.trim() || '',
    experience: document.getElementById('reg-experience')?.value || '0',
    skills,
    password:   document.getElementById('reg-password').value,
    avatar:     profilePhoto,
    resume:     uploadedFiles.resume,
    certificate: uploadedFiles.certificate,
    govId:      uploadedFiles.govId,
    signature:  uploadedFiles.signature,
    status:     'active',
    joiningDate: new Date().toISOString().split('T')[0],
    salary:     0,
    qrCode:     generatedEmpId,
    bio:        '',
    social:     {},
    languages:  [],
    education:  [],
  };

  /* Save */
  if (registerRole === 'worker') {
    DB.saveWorker(user);
  } else {
    DB.saveEmployee(user);
  }

  /* Add welcome notification */
  DB.addNotification({
    title:  'Welcome to Innovators 2.0!',
    body:   `Your account has been created. Employee ID: ${generatedEmpId}`,
    type:   'success',
    userId: user.id,
  });

  DB.logActivity('Registration', `${user.name} (${user.employeeId})`, 'auth');

  /* Show success modal */
  document.getElementById('success-name').textContent     = user.name;
  document.getElementById('success-emp-id').textContent   = user.employeeId;
  document.getElementById('success-dept').textContent     = user.department;

  const qrCanvas = document.getElementById('success-qr-canvas');
  if (qrCanvas) {
    QRGen.generate(JSON.stringify({ id: user.employeeId, name: user.name }), qrCanvas, 160);
  }

  Modal.open('success-modal');

  submitBtn.disabled = false;
  submitBtn.textContent = 'Complete Registration';
}

/* ── DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();

  /* Init */
  populateDropdowns();
  generateEmployeeId();
  initPhotoUpload();
  initFileUploads();
  initSkillsInput();
  initPasswordStrength();
  goToStep(1);

  /* Role buttons */
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => setRole(btn.dataset.role));
  });

  /* Navigation */
  document.getElementById('reg-next-btn')?.addEventListener('click', () => goToStep(currentStep + 1));
  document.getElementById('reg-prev-btn')?.addEventListener('click', () => goToStep(currentStep - 1));

  /* Submit */
  document.getElementById('register-form')?.addEventListener('submit', handleRegisterSubmit);

  /* Generate QR on Step 4 */
  document.getElementById('reg-next-btn')?.addEventListener('click', () => {
    if (currentStep === 4) renderRegistrationQR();
  });

  /* Success modal actions */
  document.getElementById('go-to-login-btn')?.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  /* Password toggle */
  document.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (input) input.type = input.type === 'password' ? 'text' : 'password';
      btn.textContent = input.type === 'password' ? '👁' : '🙈';
    });
  });

  /* Live validation bindings */
  const liveValidations = [
    { id: 'reg-name',   rules: ['required', 'alphaSpace'] },
    { id: 'reg-email',  rules: ['required', 'email'] },
    { id: 'reg-mobile', rules: ['required', 'mobile'] },
    { id: 'reg-pincode',rules: ['required', 'pincode'] },
  ];
  liveValidations.forEach(({ id, rules }) => {
    const el = document.getElementById(id);
    if (el) Validator.bindLive(el, rules);
  });

  Loader.hide(1200);
});
