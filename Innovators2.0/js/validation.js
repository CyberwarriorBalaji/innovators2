/**
 * =============================================
 * VALIDATION.JS — Form Validation
 * Innovators 2.0 Employee Management Portal
 * =============================================
 */

'use strict';

const Validator = {
  /* ── Rules ── */
  rules: {
    required:   (v)    => !!v && v.trim() !== '',
    email:      (v)    => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    mobile:     (v)    => /^[6-9]\d{9}$/.test(v.replace(/\s/g, '')),
    minLen:     (v, n) => v.length >= n,
    maxLen:     (v, n) => v.length <= n,
    match:      (v, o) => v === o,
    alphaSpace: (v)    => /^[A-Za-z\s]+$/.test(v),
    numeric:    (v)    => /^\d+$/.test(v),
    pincode:    (v)    => /^\d{6}$/.test(v),
    password:   (v)    => /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,}$/.test(v),
    date:       (v)    => !isNaN(new Date(v).getTime()),
    url:        (v)    => { try { new URL(v); return true; } catch { return false; } },
    empId:      (v)    => /^[A-Z]{3}-\d{4}-\d{4}$/.test(v),
    file:       (v)    => !!v,
    checked:    (v)    => v === true || v === 'true',
  },

  /* ── Error Messages ── */
  messages: {
    required:   'This field is required.',
    email:      'Enter a valid email address.',
    mobile:     'Enter a valid 10-digit Indian mobile number.',
    minLen:     (n)    => `Must be at least ${n} characters.`,
    maxLen:     (n)    => `Must be at most ${n} characters.`,
    match:      'Passwords do not match.',
    alphaSpace: 'Only letters and spaces are allowed.',
    numeric:    'Only numbers are allowed.',
    pincode:    'Enter a valid 6-digit pincode.',
    password:   'Min 8 chars, 1 letter, 1 digit, 1 special character.',
    date:       'Enter a valid date.',
    url:        'Enter a valid URL.',
    empId:      'Invalid Employee ID format.',
    file:       'Please select a file.',
    checked:    'You must accept this.',
  },

  /* ── Validate a Single Field ── */
  validateField(value, rulesArr, customMessages = {}) {
    for (const ruleEntry of rulesArr) {
      const [rule, param] = Array.isArray(ruleEntry) ? ruleEntry : [ruleEntry];
      const fn = this.rules[rule];
      if (!fn) continue;
      const valid = param !== undefined ? fn(value, param) : fn(value);
      if (!valid) {
        const msg = customMessages[rule]
          || (typeof this.messages[rule] === 'function'
              ? this.messages[rule](param)
              : this.messages[rule]);
        return { valid: false, message: msg };
      }
    }
    return { valid: true, message: '' };
  },

  /* ── Show / Clear field errors ── */
  showError(inputEl, message) {
    if (!inputEl) return;
    inputEl.classList.add('error');
    inputEl.classList.remove('success');
    let errEl = inputEl.parentElement.querySelector('.field-error');
    if (!errEl) {
      errEl = document.createElement('span');
      errEl.className = 'field-error form-error';
      inputEl.parentElement.appendChild(errEl);
    }
    errEl.textContent = message;
  },

  clearError(inputEl) {
    if (!inputEl) return;
    inputEl.classList.remove('error');
    inputEl.classList.add('success');
    const errEl = inputEl.parentElement.querySelector('.field-error');
    if (errEl) errEl.textContent = '';
  },

  clearAll(formEl) {
    formEl.querySelectorAll('.form-control, .login-input').forEach(el => {
      el.classList.remove('error', 'success');
    });
    formEl.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  },

  /* ── Validate Entire Form ── */
  validateForm(fields) {
    let allValid = true;
    fields.forEach(({ el, rules, messages }) => {
      const value  = el?.type === 'checkbox' ? el.checked : el?.value || '';
      const result = this.validateField(String(value), rules, messages || {});
      if (result.valid) {
        this.clearError(el);
      } else {
        this.showError(el, result.message);
        allValid = false;
      }
    });
    return allValid;
  },

  /* ── Live Validation Binding ── */
  bindLive(inputEl, rules, customMessages = {}) {
    if (!inputEl) return;
    const validate = () => {
      const value  = inputEl.type === 'checkbox' ? String(inputEl.checked) : inputEl.value;
      const result = this.validateField(value, rules, customMessages);
      if (result.valid) this.clearError(inputEl);
      else              this.showError(inputEl, result.message);
    };
    inputEl.addEventListener('blur',  validate);
    inputEl.addEventListener('input', () => {
      /* Only clear once user starts typing again */
      if (inputEl.classList.contains('error')) validate();
    });
  },

  /* ── Age Check ── */
  isAdult(dob, minAge = 18) {
    const today  = new Date();
    const birth  = new Date(dob);
    const age    = today.getFullYear() - birth.getFullYear() -
      (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
    return age >= minAge;
  },

  /* ── File Validation ── */
  validateFile(file, { maxSizeMB = 5, types = [] } = {}) {
    if (!file) return { valid: false, message: 'No file selected.' };
    if (file.size > maxSizeMB * 1024 * 1024) {
      return { valid: false, message: `File must be under ${maxSizeMB}MB.` };
    }
    if (types.length && !types.some(t => file.type.includes(t))) {
      return { valid: false, message: `Allowed types: ${types.join(', ')}.` };
    }
    return { valid: true, message: '' };
  },
};
