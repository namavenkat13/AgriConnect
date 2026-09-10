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
    const { full_name, phone_number, password, village, id_proof_number, crops } = req.body;

    if (!full_name || !phone_number || !password) {
      return res.status(400).json({ success: false, message: 'Full name, phone number, and password are required.' });
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

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = 'farmer';

    const insertResult = await db.query(
      'INSERT INTO users (full_name, phone_number, password_hash, role, village, id_proof_number, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [full_name.trim(), cleanPhone, passwordHash, userRole, village ? village.trim() : null, cleanAadhaar]
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
    const { full_name, phone_number, password, id_proof_number, centre_id } = req.body;

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

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedCentreId = centre_id ? Number(centre_id) : 1;
    const centre = await db.get('SELECT centre_name, location, state, city FROM procurement_centres WHERE centre_id = ?', [assignedCentreId]);

    // Insert into centre_staff
    const staffRes = await db.query(
      'INSERT INTO centre_staff (centre_id, name, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [assignedCentreId, full_name.trim(), cleanPhone, passwordHash, 'mandi_admin']
    );

    // Also mirror in users for consistency
    const insertResult = await db.query(
      'INSERT INTO users (full_name, phone_number, password_hash, role, village, id_proof_number, centre_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [
        full_name.trim(),
        cleanPhone,
        passwordHash,
        'mandi_admin',
        centre ? `${centre.city}, ${centre.state}` : 'Mandi Office',
        id_proof_number ? id_proof_number.trim() : 'OFFICER-APMC',
        assignedCentreId
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

module.exports = {
  router,
  authenticateToken,
  requireRole
};
