// frontend/js/auth.js
// Authentication management, session handling, and role redirection

const TOKEN_KEY = 'agriconnect_token';
const USER_KEY = 'agriconnect_user';

function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredUser() {
  const userJson = localStorage.getItem(USER_KEY);
  try {
    return userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    return null;
  }
}

function setAuthSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function logout() {
  clearAuthSession();
  window.location.href = '/index.html';
}

/**
 * Redirect user if they are logged in or lacking permission
 */
function guardRoute(requiredRole = null) {
  const token = getAuthToken();
  const user = getStoredUser();

  if (!token || !user) {
    window.location.href = '/index.html';
    return false;
  }

  if (requiredRole) {
    const isMandi = user.role === 'mandi_admin' || user.role === 'mandi_member' || user.role === 'staff' || user.role === 'admin';
    if (requiredRole === 'farmer' && user.role !== 'farmer') {
      alert('Access restricted to farmers.');
      window.location.href = '/mandi.html';
      return false;
    }
    if ((requiredRole === 'staff' || requiredRole === 'mandi_member' || requiredRole === 'mandi_admin') && !isMandi) {
      alert('Access restricted: Mandi staff credentials required.');
      window.location.href = '/dashboard.html';
      return false;
    }
  }

  return true;
}

/**
 * If logged in, redirect away from public landing page to their respective portal
 */
function redirectIfLoggedIn() {
  const token = getAuthToken();
  const user = getStoredUser();
  if (token && user) {
    if (user.role === 'farmer') {
      window.location.href = '/dashboard.html';
    } else if (user.role === 'mandi_admin' || user.role === 'mandi_member' || user.role === 'staff' || user.role === 'admin') {
      window.location.href = '/mandi.html';
    }
  }
}

/**
 * Helper to show toast messages
 */
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'alert' ? 'toast-alert' : 'toast-success'}`;
  toast.innerHTML = `
    <span style="font-size: 1.2rem;">${type === 'alert' ? '⚠️' : '✅'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

/**
 * Toggle password input visibility between 'password' and 'text'
 */
function togglePasswordVisibility(targetId, btnElement) {
  const input = document.getElementById(targetId);
  if (!input) return;

  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';

  if (btnElement) {
    btnElement.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    btnElement.setAttribute('title', isPassword ? 'Hide password' : 'Show password');
    const eyeOpen = btnElement.querySelector('.eye-open');
    const eyeClosed = btnElement.querySelector('.eye-closed');
    if (eyeOpen && eyeClosed) {
      eyeOpen.style.display = isPassword ? 'none' : 'block';
      eyeClosed.style.display = isPassword ? 'block' : 'none';
    }
  }
}

// Global click delegation for any button with class 'password-toggle-btn'
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.password-toggle-btn');
  if (!btn) return;
  const targetId = btn.getAttribute('data-target');
  if (targetId) {
    togglePasswordVisibility(targetId, btn);
  }
});

/**
 * Validate legitimate 10-digit mobile number starting with 6, 7, 8, 9
 * Reject dummy numbers like 0000000000, 1000000000, repeating digits, etc.
 */
function validatePhoneNumber(phone, allowDemo = false) {
  if (!phone) {
    return { valid: false, message: 'Phone number is required.' };
  }
  let clean = String(phone).trim().replace(/[^0-9]/g, '');
  if (clean.length === 12 && clean.startsWith('91')) {
    clean = clean.substring(2);
  } else if (clean.length === 11 && clean.startsWith('0')) {
    clean = clean.substring(1);
  }

  if (clean.length !== 10) {
    return { valid: false, message: 'Phone number must be exactly 10 digits.' };
  }

  if (!/^[6-9]/.test(clean)) {
    return {
      valid: false,
      message: 'Invalid mobile number. Mobile numbers must start with 6, 7, 8, or 9. Dummy numbers like ' + clean + ' are not allowed.'
    };
  }

  if (/^(\d)\1{9}$/.test(clean)) {
    return { valid: false, message: 'Dummy phone numbers with repeated digits are not allowed.' };
  }

  const dummyList = ['1234567890', '0123456789', '9898989898', '9090909090', '8989898989', '7878787878'];
  if (!allowDemo) {
    dummyList.push('9876543210');
  }

  if (dummyList.includes(clean)) {
    return { valid: false, message: 'Dummy or test phone numbers are not allowed. Please enter a legitimate mobile number.' };
  }

  return { valid: true, cleanPhone: clean };
}

/**
 * Validate Aadhaar number: strictly 12 digits, cannot start with 0 or 1
 */
function validateAadhaarNumber(aadhaar, required = true) {
  if (!aadhaar || !String(aadhaar).trim()) {
    if (required) {
      return { valid: false, message: 'Aadhaar number is required and must consist of 12 digits.' };
    }
    return { valid: true, cleanAadhaar: null };
  }

  const clean = String(aadhaar).trim().replace(/[^0-9]/g, '');

  if (clean.length !== 12) {
    return { valid: false, message: 'Aadhaar number must consist of exactly 12 digits (currently ' + clean.length + ' digits).' };
  }

  if (!/^[2-9]/.test(clean)) {
    return { valid: false, message: 'Invalid Aadhaar number. Aadhaar numbers cannot start with 0 or 1. Dummy numbers are not allowed.' };
  }

  if (/^(\d)\1{11}$/.test(clean)) {
    return { valid: false, message: 'Invalid Aadhaar number. All digits cannot be identical.' };
  }

  const dummySequences = ['123456789012', '234567890123', '987654321098'];
  if (dummySequences.includes(clean)) {
    return { valid: false, message: 'Dummy Aadhaar numbers are not allowed. Please enter your valid 12-digit Aadhaar number.' };
  }

  return { valid: true, cleanAadhaar: clean };
}

/**
 * Request Password Hint for an account by phone number
 * Returns { success, has_hint, hint, message }
 */
async function requestPasswordHint(phoneNumber, role = null) {
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber, role })
    });
    return await res.json();
  } catch (err) {
    console.error('Request password hint error:', err);
    return {
      success: false,
      message: 'Network error connecting to AgriConnect server.'
    };
  }
}

window.AgriAuth = {
  getAuthToken,
  getStoredUser,
  setAuthSession,
  clearAuthSession,
  logout,
  guardRoute,
  redirectIfLoggedIn,
  showToast,
  togglePasswordVisibility,
  validatePhoneNumber,
  validateAadhaarNumber,
  requestPasswordHint
};



