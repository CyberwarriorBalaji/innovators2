/**
 * =============================================
 * PROFILE.JS — Profile Page Logic
 * Innovators 2.0 Employee Management Portal
 * =============================================
 */

'use strict';

let editMode    = false;
let currentUser = null;
let newAvatar   = null;

/* ── Load User ── */
function loadUser() {
  const session = DB.getSession();
  if (!session) return;
  currentUser = DB.getEmployee(session.userId) || DB.getEmployeeByEmail(session.email) || DB.getWorker(session.userId);
  return currentUser;
}

/* ── Render Profile ── */
function renderProfile() {
  const user = loadUser();
  if (!user) return;

  /* Avatar */
  const avatarEl = document.getElementById('profile-avatar');
  if (avatarEl) {
    avatarEl.src = user.avatar || generateAvatarSVG(user.name);
  }

  /* Cover / Name */
  document.getElementById('profile-name').textContent        = user.name          || '—';
  document.getElementById('profile-designation').textContent = user.designation    || '—';
  document.getElementById('profile-emp-id').textContent      = user.employeeId     || '—';
  document.getElementById('profile-dept-badge').textContent  = user.department     || '—';
  document.getElementById('profile-status-badge').textContent= user.status         || 'active';

  /* Contact */
  document.getElementById('pc-email').textContent   = user.email   || '—';
  document.getElementById('pc-mobile').textContent  = user.mobile  || '—';
  document.getElementById('pc-city').textContent    = `${user.city || '—'}, ${user.state || ''}`;
  document.getElementById('pc-blood').textContent   = user.bloodGroup || '—';

  /* QR */
  const qrCanvas = document.getElementById('profile-qr-canvas');
  if (qrCanvas && user.employeeId) {
    QRGen.generate(JSON.stringify({ id: user.employeeId, name: user.name }), qrCanvas, 140);
  }

  /* Personal Details Panel */
  renderDetailFields(user);

  /* Skills */
  renderSkillsCloud(user.skills || []);

  /* Languages */
  renderLanguages(user.languages || []);

  /* Timeline */
  renderTimeline();

  /* Documents */
  renderDocuments(user);

  /* Social Links */
  renderSocialLinks(user.social || {});
}

/* ── Detail Fields ── */
function renderDetailFields(user) {
  const fields = {
    'field-name':      user.name,
    'field-email':     user.email,
    'field-mobile':    user.mobile,
    'field-dob':       DateUtil.format(user.dob),
    'field-gender':    user.gender,
    'field-address':   user.address,
    'field-city':      user.city,
    'field-state':     user.state,
    'field-country':   user.country,
    'field-pincode':   user.pincode,
    'field-blood':     user.bloodGroup,
    'field-emergency': user.emergencyContact,
    'field-dept':      user.department,
    'field-desig':     user.designation,
    'field-exp':       user.experience,
    'field-salary':    DateUtil.formatCurrency(user.salary || 0),
    'field-joining':   DateUtil.format(user.joiningDate),
    'field-bio':       user.bio,
  };

  Object.entries(fields).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '—';
  });

  /* Edit inputs */
  const editFields = {
    'edit-name':      user.name,
    'edit-mobile':    user.mobile,
    'edit-address':   user.address,
    'edit-city':      user.city,
    'edit-state':     user.state,
    'edit-country':   user.country,
    'edit-pincode':   user.pincode,
    'edit-blood':     user.bloodGroup,
    'edit-emergency': user.emergencyContact,
    'edit-bio':       user.bio,
    'edit-exp':       user.experience,
  };

  Object.entries(editFields).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
  });
}

/* ── Skills Cloud ── */
function renderSkillsCloud(skills) {
  const container = document.getElementById('skills-cloud');
  if (!container) return;
  container.innerHTML = skills.map(s => `<span class="skill-chip">${s}</span>`).join('') || '<span style="color:var(--text-muted);font-size:0.85rem;">No skills added yet</span>';
}

/* ── Languages ── */
function renderLanguages(languages) {
  const container = document.getElementById('languages-list');
  if (!container) return;
  if (!languages.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">No languages added</p>';
    return;
  }
  container.innerHTML = languages.map(l => `
    <div class="language-item">
      <div class="language-top">
        <span class="language-name">${l.name}</span>
        <span class="language-level">${l.level}%</span>
      </div>
      <div class="progress-wrap">
        <div class="progress-bar" style="width:${l.level}%"></div>
      </div>
    </div>
  `).join('');
}

/* ── Timeline (Experience + Education) ── */
function renderTimeline() {
  const user = currentUser;
  if (!user) return;

  const expContainer = document.getElementById('experience-timeline');
  const eduContainer = document.getElementById('education-timeline');

  /* Sample experience if none */
  const experiences = user.experience ? [{
    title: user.designation || 'Current Role',
    company: 'Innovators 2.0',
    period: `${DateUtil.format(user.joiningDate)} — Present`,
    description: `Working as ${user.designation} in ${user.department} department.`,
  }] : [];

  if (expContainer) {
    expContainer.innerHTML = experiences.length ? `<ul class="timeline">` + experiences.map(e => `
      <li class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-title">${e.title}</div>
        <div class="timeline-company">${e.company}</div>
        <div class="timeline-period">${e.period}</div>
        <div class="timeline-desc">${e.description}</div>
      </li>
    `).join('') + `</ul>` : '<p style="color:var(--text-muted);font-size:0.85rem;">No experience added</p>';
  }

  const education = user.education || [];
  if (eduContainer) {
    eduContainer.innerHTML = education.length ? `<ul class="timeline">` + education.map(e => `
      <li class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-title">${e.degree}</div>
        <div class="timeline-company">${e.institution}</div>
        <div class="timeline-period">${e.year}</div>
      </li>
    `).join('') + `</ul>` : '<p style="color:var(--text-muted);font-size:0.85rem;">No education records</p>';
  }
}

/* ── Documents ── */
function renderDocuments(user) {
  const container = document.getElementById('profile-docs');
  if (!container) return;

  const docs = [];
  if (user.resume)      docs.push({ name: 'Resume',       icon: '📄', data: user.resume });
  if (user.certificate) docs.push({ name: 'Certificate',  icon: '🏅', data: user.certificate });
  if (user.govId)       docs.push({ name: 'Gov. ID',      icon: '🪪', data: user.govId });
  if (user.signature)   docs.push({ name: 'Signature',    icon: '✍️', data: user.signature });

  if (!docs.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">No documents uploaded. Upload them below.</p>';
    return;
  }

  container.innerHTML = `<div class="docs-grid">` + docs.map(doc => `
    <div class="doc-card">
      <div class="doc-preview">
        ${doc.data?.startsWith('data:image') ?
          `<img src="${doc.data}" alt="${doc.name}" />` :
          `<span style="font-size:2.5rem;">${doc.icon}</span>`
        }
        <div class="doc-preview-overlay"><span>👁</span></div>
      </div>
      <div class="doc-info">
        <div class="doc-name">${doc.name}</div>
        <div class="doc-actions">
          <a href="${doc.data}" download="${doc.name}" class="btn btn-sm btn-primary" style="padding:4px 8px;font-size:0.72rem;">⬇ Download</a>
        </div>
      </div>
    </div>
  `).join('') + `</div>`;
}

/* ── Social Links ── */
function renderSocialLinks(social) {
  const container = document.getElementById('social-links-container');
  if (!container) return;

  const links = [
    { key: 'linkedin', icon: '💼', label: 'LinkedIn',  class: 'social-linkedin' },
    { key: 'github',   icon: '💻', label: 'GitHub',    class: 'social-github' },
    { key: 'twitter',  icon: '🐦', label: 'Twitter',   class: 'social-twitter' },
  ];

  container.innerHTML = links.map(l => `
    <a href="${social[l.key] ? 'https://' + social[l.key] : '#'}"
       class="social-link ${l.class}" target="_blank"
       style="${!social[l.key] ? 'opacity:0.4;pointer-events:none;' : ''}">
      ${l.icon} ${social[l.key] || `Add ${l.label}`}
    </a>
  `).join('');
}

/* ── Avatar Placeholder SVG ── */
function generateAvatarSVG(name) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
    <rect width="120" height="120" rx="60" fill="#0A4D8C"/>
    <text x="60" y="72" font-family="Inter,sans-serif" font-size="40" font-weight="700" text-anchor="middle" fill="white">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/* ── Toggle Edit Mode ── */
function toggleEditMode() {
  editMode = !editMode;
  const editBtn = document.getElementById('edit-profile-btn');
  const saveBtn = document.getElementById('save-profile-btn');
  const cancelBtn = document.getElementById('cancel-edit-btn');

  /* Toggle view/edit classes */
  document.querySelectorAll('.edit-field').forEach(el => {
    el.style.display = editMode ? 'block' : 'none';
  });
  document.querySelectorAll('.view-field').forEach(el => {
    el.style.display = editMode ? 'none' : 'block';
  });

  if (editBtn)  editBtn.style.display   = editMode ? 'none' : 'inline-flex';
  if (saveBtn)  saveBtn.style.display   = editMode ? 'inline-flex' : 'none';
  if (cancelBtn) cancelBtn.style.display = editMode ? 'inline-flex' : 'none';

  if (editMode) Toast.info('Edit Mode', 'Make your changes and click Save.');
}

/* ── Save Profile ── */
function saveProfile() {
  if (!currentUser) return;

  const updates = {
    name:             document.getElementById('edit-name')?.value.trim()      || currentUser.name,
    mobile:           document.getElementById('edit-mobile')?.value.trim()    || currentUser.mobile,
    address:          document.getElementById('edit-address')?.value.trim()   || currentUser.address,
    city:             document.getElementById('edit-city')?.value.trim()      || currentUser.city,
    state:            document.getElementById('edit-state')?.value.trim()     || currentUser.state,
    country:          document.getElementById('edit-country')?.value.trim()   || currentUser.country,
    pincode:          document.getElementById('edit-pincode')?.value.trim()   || currentUser.pincode,
    bloodGroup:       document.getElementById('edit-blood')?.value.trim()     || currentUser.bloodGroup,
    emergencyContact: document.getElementById('edit-emergency')?.value.trim() || currentUser.emergencyContact,
    bio:              document.getElementById('edit-bio')?.value.trim()       || currentUser.bio,
    experience:       document.getElementById('edit-exp')?.value.trim()       || currentUser.experience,
  };

  if (newAvatar) updates.avatar = newAvatar;

  /* Social */
  const social = {
    linkedin: document.getElementById('edit-linkedin')?.value.trim() || '',
    github:   document.getElementById('edit-github')?.value.trim()   || '',
    twitter:  document.getElementById('edit-twitter')?.value.trim()  || '',
  };
  updates.social = social;

  /* Save */
  const updated = { ...currentUser, ...updates };
  if (currentUser.role === 'worker') DB.saveWorker(updated);
  else                               DB.saveEmployee(updated);

  currentUser = updated;
  DB.logActivity('Profile Updated', currentUser.name, 'employee');

  Toast.success('Profile Saved!', 'Your profile has been updated.');
  toggleEditMode();
  renderProfile();
}

/* ── Avatar Upload ── */
function initAvatarUpload() {
  const input = document.getElementById('avatar-upload-input');
  input?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validation = Validator.validateFile(file, { maxSizeMB: 2, types: ['image'] });
    if (!validation.valid) { Toast.error('Invalid File', validation.message); return; }
    newAvatar = await ImagePreview.fileToBase64(file);
    const avatarEl = document.getElementById('profile-avatar');
    if (avatarEl) avatarEl.src = newAvatar;
    Toast.success('Photo Updated', 'Click Save to apply.');
  });

  document.getElementById('avatar-upload-btn')?.addEventListener('click', () => {
    if (editMode) input?.click();
    else Toast.info('Edit Mode', 'Enable edit mode first.');
  });
}

/* ── Document Upload (Profile page) ── */
function initDocUpload() {
  const configs = [
    { inputId: 'upload-resume',      key: 'resume',      types: ['pdf'] },
    { inputId: 'upload-cert',        key: 'certificate', types: ['pdf', 'image'] },
    { inputId: 'upload-govid',       key: 'govId',       types: ['pdf', 'image'] },
    { inputId: 'upload-signature',   key: 'signature',   types: ['image'] },
  ];

  configs.forEach(({ inputId, key, types }) => {
    const input = document.getElementById(inputId);
    input?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const v = Validator.validateFile(file, { maxSizeMB: 5, types });
      if (!v.valid) { Toast.error('Invalid File', v.message); return; }
      const data = await ImagePreview.fileToBase64(file);
      if (!currentUser) return;
      currentUser[key] = data;
      if (currentUser.role === 'worker') DB.saveWorker(currentUser);
      else                               DB.saveEmployee(currentUser);
      Toast.success('Uploaded!', `${file.name} saved.`);
      renderDocuments(currentUser);
    });
  });
}

/* ── Profile Tab Navigation ── */
function initProfileTabs() {
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.profile-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById(`panel-${tab.dataset.tab}`);
      if (panel) panel.classList.add('active');
    });
  });
}

/* ── Print Profile ── */
function printProfile() {
  PrintUtil.printSection('profile-print-area');
}

/* ── DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', () => {
  renderProfile();
  initAvatarUpload();
  initDocUpload();
  initProfileTabs();

  document.getElementById('edit-profile-btn')?.addEventListener('click', toggleEditMode);
  document.getElementById('save-profile-btn')?.addEventListener('click', saveProfile);
  document.getElementById('cancel-edit-btn')?.addEventListener('click', () => {
    toggleEditMode();
    renderProfile(); // Revert
  });
  document.getElementById('print-profile-btn')?.addEventListener('click', printProfile);

  /* Activate first tab */
  document.querySelector('.profile-tab')?.click();
});
