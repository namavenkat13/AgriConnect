// backend/routes/auth.js
// Handles user registration, login, JWT issuance, and authentication middleware

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { validatePhoneNumber, validateAadhaarNumber } = require('../utils/validators');

if (!process.env.JWT_SECRET) {
  console.error('CRITICAL SERVER CONFIGURATION ERROR: process.env.JWT_SECRET is missing. Server authentication cannot operate safely.');
}

/**
 * Middleware to authenticate requests using JWT
 */
function authenticateToken(req, res, next) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('Server Configuration Error: JWT_SECRET environment variable is missing.');
    return res.status(500).json({ success: false, message: 'Server configuration error: Authentication key not configured.' });
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  jwt.verify(token, jwtSecret, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired session token.' });
    }
    req.user = decodedUser;
    next();
  });
}

/**
 * Middleware to restrict route to specific roles
 * e.g. requireRole(['admin', 'staff', 'mandi_admin', 'mandi_member'])
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const userRole = req.user.role;
    const isAllowed = allowedRoles.includes(userRole) ||
      (allowedRoles.includes('staff') && (userRole === 'mandi_member' || userRole === 'mandi_admin' || userRole === 'admin')) ||
      (allowedRoles.includes('mandi_member') && userRole === 'mandi_admin');

    if (!isAllowed) {
      return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
}

/**
 * POST /api/auth/register
 * Farmer Registration
 */
router.post('/register', async (req, res) => {
  try {
    const { full_name, phone_number, password, village, id_proof_number, crops, password_hint } = req.body;

    if (!full_name || !phone_number || !password) {
      return res.status(400).json({ success: false, message: 'Full name, phone number, and password are required.' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Validate phone number: legitimate 10 digits starting with 6-9, disallowing dummy numbers
    const phoneCheck = validatePhoneNumber(phone_number, false);
    if (!phoneCheck.valid) {
      return res.status(400).json({ success: false, message: phoneCheck.message });
    }
    const cleanPhone = phoneCheck.cleanPhone;

    // Validate Aadhaar number: strictly 12 digits
    const aadhaarCheck = validateAadhaarNumber(id_proof_number, true);
    if (!aadhaarCheck.valid) {
      return res.status(400).json({ success: false, message: aadhaarCheck.message });
    }
    const cleanAadhaar = aadhaarCheck.cleanAadhaar;

    // Check if phone number already exists
    const existing = await db.get('SELECT user_id FROM users WHERE phone_number = ?', [cleanPhone]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'A user is already registered with this phone number.' });
    }

    // Process optional password hint
    let cleanHint = null;
    if (password_hint && typeof password_hint === 'string' && password_hint.trim()) {
      cleanHint = password_hint.trim();
      if (cleanHint.toLowerCase() === String(password).trim().toLowerCase()) {
        return res.status(400).json({ success: false, message: 'Password hint cannot be identical to your password.' });
      }
      if (cleanHint.length > 150) {
        cleanHint = cleanHint.substring(0, 150);
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = 'farmer';

    const insertResult = await db.query(
      'INSERT INTO users (full_name, phone_number, password_hash, password_hint, role, village, id_proof_number, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [full_name.trim(), cleanPhone, passwordHash, cleanHint, userRole, village ? village.trim() : null, cleanAadhaar]
    );

    const userId = insertResult.insertId;

    // Insert registered crops if any
    const registeredCrops = [];
    if (Array.isArray(crops) && crops.length > 0) {
      for (const crop of crops) {
        if (typeof crop === 'string' && crop.trim()) {
          const trimmedCrop = crop.trim();
          await db.query('INSERT INTO farmer_crops (farmer_id, crop_name) VALUES (?, ?)', [userId, trimmedCrop]);
          registeredCrops.push(trimmedCrop);
        }
      }
    }

    // Sign JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('Server Configuration Error: JWT_SECRET environment variable is missing.');
      return res.status(500).json({ success: false, message: 'Server configuration error: Authentication key not configured.' });
    }

    const token = jwt.sign(
      {
        user_id: userId,
        phone_number: cleanPhone,
        role: userRole,
        full_name: full_name.trim()
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to AgriConnect.',
      token,
      user: {
        user_id: userId,
        full_name: full_name.trim(),
        phone_number: cleanPhone,
        role: userRole,
        village: village || '',
        crops: registeredCrops
      }
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

/**
 * POST /api/auth/register-mandi
 * Mandi Procurement Staff / Officer Registration
 */
router.post('/register-mandi', async (req, res) => {
  try {
    const { full_name, phone_number, password, id_proof_number, centre_id, password_hint } = req.body;

    if (!full_name || !phone_number || !password) {
      return res.status(400).json({ success: false, message: 'Officer name, phone number, and password are required.' });
    }

    const cleanPhoneCheck = validatePhoneNumber(phone_number, true);
    if (!cleanPhoneCheck.valid) {
      return res.status(400).json({ success: false, message: cleanPhoneCheck.message });
    }
    const cleanPhone = cleanPhoneCheck.cleanPhone;

    const existingUser = await db.get('SELECT user_id FROM users WHERE phone_number = ?', [cleanPhone]);
    const existingStaff = await db.get('SELECT id FROM centre_staff WHERE phone = ?', [cleanPhone]);
    if (existingUser || existingStaff) {
      return res.status(409).json({ success: false, message: 'An account is already registered with this phone number.' });
    }

    if (!centre_id) {
      return res.status(400).json({ success: false, message: 'Please select an authorized APMC Mandi / Centre from the official directory.' });
    }

    const assignedCentreId = Number(centre_id);
    const centre = await db.get('SELECT centre_name, location, state, city FROM procurement_centres WHERE centre_id = ?', [assignedCentreId]);
    if (!centre) {
      return res.status(400).json({ success: false, message: 'Selected Mandi Centre does not exist. Please select an authorized APMC mandi from the list.' });
    }

    // Reject if already registered/claimed by another Mandi Admin
    const existingAdmin = await db.get('SELECT id FROM centre_staff WHERE centre_id = ? AND role = ?', [assignedCentreId, 'mandi_admin']);
    if (existingAdmin) {
      return res.status(409).json({ success: false, message: `This Mandi Centre (${centre.centre_name}) is already registered by a Mandi Admin. Duplicate registration is not permitted.` });
    }

    // Process optional password hint
    let cleanHint = null;
    if (password_hint && typeof password_hint === 'string' && password_hint.trim()) {
      cleanHint = password_hint.trim();
      if (cleanHint.toLowerCase() === String(password).trim().toLowerCase()) {
        return res.status(400).json({ success: false, message: 'Password hint cannot be identical to your password.' });
      }
      if (cleanHint.length > 150) {
        cleanHint = cleanHint.substring(0, 150);
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Insert into centre_staff
    const staffRes = await db.query(
      'INSERT INTO centre_staff (centre_id, name, phone, password_hash, role, password_hint) VALUES (?, ?, ?, ?, ?, ?)',
      [assignedCentreId, full_name.trim(), cleanPhone, passwordHash, 'mandi_admin', cleanHint]
    );

    // Also mirror in users for consistency
    const insertResult = await db.query(
      'INSERT INTO users (full_name, phone_number, password_hash, role, village, id_proof_number, centre_id, password_hint, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [
        full_name.trim(),
        cleanPhone,
        passwordHash,
        'mandi_admin',
        centre ? `${centre.city}, ${centre.state}` : 'Mandi Office',
        id_proof_number ? id_proof_number.trim() : 'OFFICER-APMC',
        assignedCentreId,
        cleanHint
      ]
    );

    const userId = staffRes.insertId || insertResult.insertId;

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('Server Configuration Error: JWT_SECRET environment variable is missing.');
      return res.status(500).json({ success: false, message: 'Server configuration error: Authentication key not configured.' });
    }

    const token = jwt.sign(
      {
        user_id: userId,
        staff_id: staffRes.insertId,
        phone_number: cleanPhone,
        role: 'mandi_admin',
        full_name: full_name.trim(),
        centre_id: assignedCentreId,
        centre_name: centre ? centre.centre_name : '',
        is_mandi: true
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Mandi Admin account registered successfully! Welcome to AgriConnect Mandi Desk.',
      token,
      user: {
        user_id: userId,
        staff_id: staffRes.insertId,
        full_name: full_name.trim(),
        phone_number: cleanPhone,
        role: 'mandi_admin',
        id_proof_number: id_proof_number || '',
        centre_id: assignedCentreId,
        centre_name: centre ? centre.centre_name : '',
        is_mandi: true
      }
    });
  } catch (err) {
    console.error('Mandi Registration Error:', err);
    res.status(500).json({ success: false, message: 'Server error during Mandi registration.' });
  }
});

/**
 * Helper to check whether actual user role matches expected portal role
 */
function isRoleAllowedForPortal(actualRole, expected) {
  if (!expected) return true; // unified login if none specified
  const exp = String(expected).toLowerCase().trim();
  const act = String(actualRole || '').toLowerCase().trim();

  if (exp === 'farmer') {
    return act === 'farmer';
  }
  if (exp === 'mandi' || exp === 'mandi_staff' || exp === 'staff') {
    return ['mandi_admin', 'mandi_member', 'staff'].includes(act);
  }
  if (exp === 'admin') {
    return act === 'admin';
  }
  return act === exp;
}

/**
 * POST /api/auth/login
 * Role-aware Login with strict portal role authorization
 * (accepts optional expected_role to prevent cross-portal authentication)
 */
router.post('/login', async (req, res) => {
  try {
    const { phone_number, password, expected_role } = req.body;
    const targetRole = (expected_role || req.body.role || req.query.role || req.headers['x-expected-role'] || '').toLowerCase().trim();

    if (!phone_number || !password) {
      return res.status(400).json({ success: false, message: 'Phone number and password are required.' });
    }

    const cleanPhone = String(phone_number).trim().replace(/[^0-9]/g, '');

    // 1. Check centre_staff table first (Mandi Admin & Members)
    const staffMember = await db.get(
      `SELECT cs.*, pc.centre_name, pc.location as centre_location, pc.city, pc.state 
       FROM centre_staff cs 
       LEFT JOIN procurement_centres pc ON cs.centre_id = pc.centre_id 
       WHERE cs.phone = ?`,
      [cleanPhone]
    );

    if (staffMember) {
      const isMatch = await bcrypt.compare(password, staffMember.password_hash);
      if (isMatch) {
        if (!isRoleAllowedForPortal(staffMember.role, targetRole)) {
          return res.status(401).json({ success: false, message: 'Invalid phone number or password.' });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          console.error('Server Configuration Error: JWT_SECRET environment variable is missing.');
          return res.status(500).json({ success: false, message: 'Server configuration error: Authentication key not configured.' });
        }

        const token = jwt.sign(
          {
            user_id: staffMember.id,
            staff_id: staffMember.id,
            phone_number: staffMember.phone,
            role: staffMember.role,
            full_name: staffMember.name,
            centre_id: staffMember.centre_id,
            centre_name: staffMember.centre_name,
            is_mandi: true
          },
          jwtSecret,
          { expiresIn: '7d' }
        );

        return res.json({
          success: true,
          message: 'Mandi staff login successful.',
          token,
          user: {
            user_id: staffMember.id,
            staff_id: staffMember.id,
            full_name: staffMember.name,
            phone_number: staffMember.phone,
            role: staffMember.role,
            centre_id: staffMember.centre_id,
            centre_name: staffMember.centre_name || 'Procurement Centre',
            is_mandi: true
          }
        });
      }
    }

    // 2. Otherwise check users table
    const user = await db.get('SELECT * FROM users WHERE phone_number = ?', [cleanPhone]);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or password.' });
    }

    // Verify role matches requested portal
    if (!isRoleAllowedForPortal(user.role, targetRole)) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or password.' });
    }

    // Fetch crops if farmer
    let crops = [];
    if (user.role === 'farmer') {
      const cropRows = await db.query('SELECT crop_name FROM farmer_crops WHERE farmer_id = ?', [user.user_id]);
      crops = cropRows.map(r => r.crop_name);
    }

    // Fetch centre name if staff or admin
    let centreName = null;
    if (user.centre_id) {
      const cRow = await db.get('SELECT centre_name FROM procurement_centres WHERE centre_id = ?', [user.centre_id]);
      if (cRow) centreName = cRow.centre_name;
    }

    const isMandi = user.role === 'mandi_admin' || user.role === 'mandi_member' || user.role === 'staff' || user.role === 'admin';

    // Sign JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('Server Configuration Error: JWT_SECRET environment variable is missing.');
      return res.status(500).json({ success: false, message: 'Server configuration error: Authentication key not configured.' });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        phone_number: user.phone_number,
        role: user.role,
        full_name: user.full_name,
        centre_id: user.centre_id || null,
        centre_name: centreName,
        is_mandi: isMandi
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        phone_number: user.phone_number,
        role: user.role,
        village: user.village || '',
        centre_id: user.centre_id || null,
        centre_name: centreName,
        is_mandi: isMandi,
        crops
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user and profile
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (req.user.is_mandi || req.user.role === 'mandi_admin' || req.user.role === 'mandi_member') {
      const staff = await db.get(
        `SELECT cs.id, cs.name, cs.phone, cs.role, cs.centre_id, pc.centre_name, pc.city, pc.state 
         FROM centre_staff cs 
         LEFT JOIN procurement_centres pc ON cs.centre_id = pc.centre_id 
         WHERE cs.id = ?`,
        [req.user.user_id || req.user.staff_id]
      );
      if (staff) {
        return res.json({
          success: true,
          user: {
            user_id: staff.id,
            staff_id: staff.id,
            full_name: staff.name,
            phone_number: staff.phone,
            role: staff.role,
            centre_id: staff.centre_id,
            centre_name: staff.centre_name,
            is_mandi: true
          }
        });
      }
    }

    const user = await db.get('SELECT user_id, full_name, phone_number, role, village, id_proof_number, centre_id, created_at FROM users WHERE user_id = ?', [req.user.user_id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let crops = [];
    if (user.role === 'farmer') {
      const cropRows = await db.query('SELECT crop_name FROM farmer_crops WHERE farmer_id = ?', [user.user_id]);
      crops = cropRows.map(r => r.crop_name);
    }

    let centreName = null;
    if (user.centre_id) {
      const cRow = await db.get('SELECT centre_name FROM procurement_centres WHERE centre_id = ?', [user.centre_id]);
      if (cRow) centreName = cRow.centre_name;
    }

    res.json({
      success: true,
      user: {
        ...user,
        centre_name: centreName,
        is_mandi: user.role === 'mandi_admin' || user.role === 'mandi_member' || user.role === 'staff' || user.role === 'admin',
        crops
      }
    });
  } catch (err) {
    console.error('Fetch me Error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching user details.' });
  }
});



// ============================================================================
// PASSWORD HINT RECOVERY ENDPOINTS (Public)
// ============================================================================

/**
 * POST /api/auth/forgot-password
 * Password Hint lookup endpoint
 * Accepts: { phone_number, role (optional) }
 * Returns the registered password hint as a reminder (does NOT perform password reset)
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { phone_number, phone, role } = req.body;
    const rawPhone = phone_number || phone;

    if (!rawPhone) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required.'
      });
    }

    const cleanPhone = String(rawPhone).trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit mobile number.'
      });
    }
    const standardPhone = cleanPhone.slice(-10);

    // Look up in users table first
    let user = await db.get(
      'SELECT user_id, full_name, role, password_hint FROM users WHERE phone_number = ? OR phone_number LIKE ?',
      [standardPhone, `%${standardPhone}`]
    );

    // If not found in users, check centre_staff table
    if (!user) {
      const staff = await db.get(
        'SELECT id as user_id, name as full_name, role, password_hint FROM centre_staff WHERE phone = ? OR phone LIKE ?',
        [standardPhone, `%${standardPhone}`]
      );
      if (staff) {
        user = staff;
      }
    }

    // Neutral privacy-preserving message if account does not exist
    if (!user) {
      return res.json({
        success: true,
        has_hint: false,
        message: 'If an account exists with this mobile number, your hint information will be displayed below.',
        hint: null
      });
    }

    // If user exists but no hint was configured
    if (!user.password_hint || !user.password_hint.trim()) {
      return res.json({
        success: true,
        has_hint: false,
        no_hint_set: true,
        message: 'No password hint was set for this account when it was registered. Please contact AgriConnect Mandi Support if you cannot recall your password.',
        hint: null
      });
    }

    // User exists and has a hint
    return res.json({
      success: true,
      has_hint: true,
      hint: user.password_hint.trim(),
      password_hint: user.password_hint.trim(),
      message: 'Use this hint to remember your password and return to the login page.'
    });
  } catch (err) {
    console.error('Forgot password hint error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving password hint.'
    });
  }
});

// Alias routes for compatibility
router.post('/forgot-password/check', async (req, res) => {
  req.url = '/forgot-password';
  return router.handle(req, res);
});

router.post('/password-hint', async (req, res) => {
  req.url = '/forgot-password';
  return router.handle(req, res);
});





module.exports = {
  router,
  authenticateToken,
  requireRole
};

