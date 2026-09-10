// backend/routes/mandi.js
// Mandi procurement centre operations, staff management, slots, and procurement workflow

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, requireRole } = require('./auth');
const { sendNotification } = require('../utils/sms');
const { triggerDirectSarvamCall } = require('../utils/sarvam');
const { getISTDateString, getISTTimeString, isSlotInPast } = require('../utils/timezone');
const { validatePhoneNumber } = require('../utils/validators');

if (!process.env.JWT_SECRET) {
  console.error('CRITICAL SERVER CONFIGURATION ERROR: process.env.JWT_SECRET is missing. Mandi operations cannot sign tokens safely.');
}

/**
 * Helper: get today's date in YYYY-MM-DD (India Standard Time)
 */
function getTodayDateString() {
  return getISTDateString();
}

/**
 * Helper: get current time in HH:MM (India Standard Time)
 */
function getCurrentTimeString() {
  return getISTTimeString();
}

/**
 * POST /api/mandi/register
 * Register a new Mandi / Procurement Centre + the first Mandi Admin
 */
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      location,
      district,
      state,
      daily_capacity,
      crops_procured,
      admin_name,
      admin_phone,
      admin_password
    } = req.body;

    if (!name || !admin_name || !admin_phone || !admin_password) {
      return res.status(400).json({
        success: false,
        message: 'Mandi name, admin name, official phone, and password are required.'
      });
    }

    const phoneCheck = validatePhoneNumber(admin_phone, false);
    if (!phoneCheck.valid) {
      return res.status(400).json({
        success: false,
        message: phoneCheck.message
      });
    }
    const cleanPhone = phoneCheck.cleanPhone;

    // Check uniqueness
    const existingStaff = await db.get('SELECT id FROM centre_staff WHERE phone = ?', [cleanPhone]);
    const existingUser = await db.get('SELECT user_id FROM users WHERE phone_number = ?', [cleanPhone]);
    if (existingStaff || existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account is already registered with this phone number.'
      });
    }

    const cap = Number(daily_capacity) || 60;

    // Insert new Procurement Centre
    const centreRes = await db.query(
      `INSERT INTO procurement_centres 
       (centre_name, location, city, state, daily_capacity, opening_time, closing_time) 
       VALUES (?, ?, ?, ?, ?, '08:00:00', '17:00:00')`,
      [name.trim(), (location || '').trim(), (district || '').trim(), (state || '').trim(), cap]
    );
    const centreId = centreRes.insertId;

    const passwordHash = await bcrypt.hash(admin_password, 10);

    // Insert first mandi_admin in centre_staff
    const staffRes = await db.query(
      `INSERT INTO centre_staff (centre_id, name, phone, password_hash, role) 
       VALUES (?, ?, ?, ?, 'mandi_admin')`,
      [centreId, admin_name.trim(), cleanPhone, passwordHash]
    );
    const staffId = staffRes.insertId;

    // Mirror in users for unified login
    await db.query(
      `INSERT INTO users (full_name, phone_number, password_hash, role, village, id_proof_number, centre_id, created_at) 
       VALUES (?, ?, ?, 'mandi_admin', ?, 'MANDI-ADMIN', ?, CURRENT_TIMESTAMP)`,
      [admin_name.trim(), cleanPhone, passwordHash, `${district || ''}, ${state || ''}`, centreId]
    );

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('Server Configuration Error: JWT_SECRET environment variable is missing.');
      return res.status(500).json({ success: false, message: 'Server configuration error: Authentication key not configured.' });
    }

    const token = jwt.sign(
      {
        user_id: staffId,
        staff_id: staffId,
        phone_number: cleanPhone,
        role: 'mandi_admin',
        full_name: admin_name.trim(),
        centre_id: centreId,
        centre_name: name.trim(),
        is_mandi: true
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Mandi centre and Admin account registered successfully!',
      token,
      user: {
        user_id: staffId,
        staff_id: staffId,
        full_name: admin_name.trim(),
        phone_number: cleanPhone,
        role: 'mandi_admin',
        centre_id: centreId,
        centre_name: name.trim(),
        is_mandi: true
      },
      centre: {
        centre_id: centreId,
        centre_name: name.trim(),
        daily_capacity: cap,
        state,
        city: district
      }
    });
  } catch (err) {
    console.error('Mandi full registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during Mandi registration.' });
  }
});

/**
 * POST /api/mandi/staff
 * mandi_admin creates additional mandi_member accounts
 */
router.post('/staff', authenticateToken, requireRole(['mandi_admin']), async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;
    const centreId = req.user.centre_id;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Member name, phone, and password are required.' });
    }

    const phoneCheck = validatePhoneNumber(phone, false);
    if (!phoneCheck.valid) {
      return res.status(400).json({ success: false, message: phoneCheck.message });
    }
    const cleanPhone = phoneCheck.cleanPhone;

    const existingStaff = await db.get('SELECT id FROM centre_staff WHERE phone = ?', [cleanPhone]);
    const existingUser = await db.get('SELECT user_id FROM users WHERE phone_number = ?', [cleanPhone]);
    if (existingStaff || existingUser) {
      return res.status(409).json({ success: false, message: 'An account is already registered with this phone number.' });
    }

    const memberRole = role === 'mandi_admin' ? 'mandi_admin' : 'mandi_member';
    const passwordHash = await bcrypt.hash(password, 10);

    const staffRes = await db.query(
      'INSERT INTO centre_staff (centre_id, name, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [centreId, name.trim(), cleanPhone, passwordHash, memberRole]
    );

    // Also mirror in users
    await db.query(
      `INSERT INTO users (full_name, phone_number, password_hash, role, village, id_proof_number, centre_id, created_at) 
       VALUES (?, ?, ?, ?, 'Mandi Member', 'MANDI-STAFF', ?, CURRENT_TIMESTAMP)`,
      [name.trim(), cleanPhone, passwordHash, memberRole, centreId]
    );

    res.status(201).json({
      success: true,
      message: `${memberRole === 'mandi_admin' ? 'Mandi Admin' : 'Mandi Member'} added successfully.`,
      staff: {
        id: staffRes.insertId,
        centre_id: centreId,
        name: name.trim(),
        phone: cleanPhone,
        role: memberRole
      }
    });
  } catch (err) {
    console.error('Add staff error:', err);
    res.status(500).json({ success: false, message: 'Failed to add mandi member.' });
  }
});

/**
 * GET /api/mandi/staff
 * List all staff members for the current centre
 */
router.get('/staff', authenticateToken, requireRole(['mandi_admin', 'mandi_member', 'staff', 'admin']), async (req, res) => {
  try {
    const centreId = req.query.centre_id || req.user.centre_id;
    if (!centreId) {
      return res.status(400).json({ success: false, message: 'Centre ID is required.' });
    }

    const staffList = await db.query(
      'SELECT id, centre_id, name, phone, role, created_at FROM centre_staff WHERE centre_id = ? ORDER BY id ASC',
      [centreId]
    );

    res.json({ success: true, staff: staffList });
  } catch (err) {
    console.error('Fetch staff error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch staff members.' });
  }
});

/**
 * GET /api/mandi/:centreId/slots-today
 * Live Slot Grid for Mandi portal: slots with Occupied vs Open counts, and associated bookings
 */
router.get('/:centreId/slots-today', authenticateToken, async (req, res) => {
  try {
    const centreId = req.params.centreId;
    const dateStr = req.query.date || getTodayDateString();
    const todayStr = getTodayDateString();
    const currentHHMM = getCurrentTimeString();

    // Ensure hourly slots exist in slots table
    const slots = await db.ensureSlotsForCentre(centreId, dateStr);

    const centre = await db.get('SELECT * FROM procurement_centres WHERE centre_id = ?', [centreId]);

    // Fetch live crop benchmark rates
    const allCropRates = await db.query('SELECT crop_name, price_per_quintal FROM crop_rates');

    // Fetch all active bookings for this centre on this date
    const allBookings = await db.query(
      `SELECT b.*, 
              u.full_name as farmer_name, u.phone_number as farmer_phone, u.village,
              cs.name as staff_name,
              pr.agreed_price_per_unit as procurement_rate
       FROM bookings b
       LEFT JOIN users u ON b.farmer_id = u.user_id
       LEFT JOIN centre_staff cs ON b.registered_by_staff_id = cs.id
       LEFT JOIN procurement_records pr ON b.booking_id = pr.booking_id
       WHERE b.centre_id = ? AND b.slot_date = ? AND b.booking_status != 'cancelled'
       ORDER BY b.queue_number ASC, b.booking_id ASC`,
      [centreId, dateStr]
    );

    // Group bookings by slot_id or slot_time
    const enrichedSlots = slots.map(slot => {
      const startTimeHHMM = slot.start_time.substring(0, 5);
      const endTimeHHMM = slot.end_time.substring(0, 5);

      // Match bookings by slot_id or matching slot_time
      const slotBookings = allBookings.filter(b => {
        if (b.slot_id && b.slot_id === slot.slot_id) return true;
        return b.slot_time.substring(0, 5) === startTimeHHMM;
      });

      const totalBooked = slotBookings.length;
      const offlineCount = slotBookings.filter(b => b.channel === 'offline').length;
      const onlineCount = slotBookings.filter(b => b.channel !== 'offline').length;
      const maxCapacity = slot.max_bookings;
      const openCount = Math.max(0, maxCapacity - totalBooked);
      const isFull = totalBooked >= maxCapacity;

      // Time cutoff: check if slot has already passed
      const isClosed = isSlotInPast(dateStr, startTimeHHMM);

      const format12 = (tStr) => {
        const parts = tStr.split(':');
        const h = parseInt(parts[0], 10);
        const m = parts[1] || '00';
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        return `${displayH}:${m} ${period}`;
      };

      return {
        slot_id: slot.slot_id,
        centre_id: slot.centre_id,
        slot_date: slot.slot_date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        time_range: `${format12(startTimeHHMM)} - ${format12(endTimeHHMM)}`,
        startTimeHHMM,
        endTimeHHMM,
        max_bookings: maxCapacity,
        occupied_count: totalBooked,
        open_count: openCount,
        offline_count: offlineCount,
        online_count: onlineCount,
        is_full: isFull,
        is_closed: isClosed,
        bookings: slotBookings.map(b => {
          let resolvedRate = null;
          if (b.procurement_rate) {
            resolvedRate = `₹${Number(b.procurement_rate).toFixed(2)} / kg`;
          } else if (b.final_amount && b.final_quantity_kg) {
            resolvedRate = `₹${(Number(b.final_amount) / Number(b.final_quantity_kg)).toFixed(2)} / kg`;
          } else {
            const matched = Array.isArray(allCropRates) && allCropRates.find(cr => 
              b.crop_name && (cr.crop_name.toLowerCase().includes(b.crop_name.toLowerCase()) || b.crop_name.toLowerCase().includes(cr.crop_name.toLowerCase()))
            );
            if (matched) {
              resolvedRate = `₹${(Number(matched.price_per_quintal) / 100).toFixed(2)} / kg (₹${Number(matched.price_per_quintal).toFixed(2)}/qtl)`;
            } else {
              resolvedRate = '₹28.50 / kg (Est. Mandi Rate)';
            }
          }

          return {
            booking_id: b.booking_id,
            farmer_id: b.farmer_id,
            farmer_name: b.channel === 'offline' ? (b.walkin_name || 'Walk-in Farmer') : (b.farmer_name || 'Registered Farmer'),
            farmer_phone: b.channel === 'offline' ? (b.walkin_phone || 'N/A') : (b.farmer_phone || 'N/A'),
            walkin_phone: b.walkin_phone || null,
            user_phone: b.farmer_phone || null,
            village: b.village || '',
            crop_name: b.crop_name,
            estimated_quantity_kg: b.estimated_quantity_kg,
            slot_date: b.slot_date || dateStr,
            slot_time: b.slot_time,
            mandi_name: centre ? centre.centre_name : 'Mandi Desk',
            rate: resolvedRate,
            reporting_counter: b.counter_number || b.counter || b.reporting_counter || null,
            queue_number: b.queue_number,
            channel: b.channel || 'online',
            approval_status: b.approval_status || 'pending',
            booking_status: b.booking_status,
            procurement_status: b.procurement_status,
            payment_status: b.payment_status,
            final_quantity_kg: b.final_quantity_kg,
            final_amount: b.final_amount
          };
        })
      };
    });

    res.json({
      success: true,
      centre: centre || { centre_id: centreId },
      date: dateStr,
      slots: enrichedSlots
    });
  } catch (err) {
    console.error('Error fetching today slots for mandi:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch live slot grid.' });
  }
});

/**
 * POST /api/mandi/:centreId/offline-booking
 * Mandi staff adds a walk-in offline booking.
 * Strictly capped at 2 offline bookings per slot.
 */
router.post('/:centreId/offline-booking', authenticateToken, requireRole(['mandi_admin', 'mandi_member', 'staff', 'admin']), async (req, res) => {
  try {
    const centreId = req.params.centreId;
    const {
      farmer_name,
      phone_number,
      crop_name,
      estimated_quantity_kg,
      slot_id,
      slot_time,
      slot_date
    } = req.body;

    if (!farmer_name || !phone_number || !crop_name || !estimated_quantity_kg || (!slot_id && !slot_time)) {
      return res.status(400).json({
        success: false,
        message: 'Farmer name, phone number, crop, estimated quantity, and slot selection are required.'
      });
    }

    const phoneCheck = validatePhoneNumber(phone_number, false);
    if (!phoneCheck.valid) {
      return res.status(400).json({ success: false, message: phoneCheck.message });
    }
    const cleanPhone = phoneCheck.cleanPhone;

    const dateStr = slot_date || getTodayDateString();
    const todayStr = getTodayDateString();
    const currentHHMM = getCurrentTimeString();

    // Resolve slot
    let targetSlot = null;
    if (slot_id) {
      targetSlot = await db.get('SELECT * FROM slots WHERE slot_id = ?', [slot_id]);
    } else {
      targetSlot = await db.get(
        'SELECT * FROM slots WHERE centre_id = ? AND slot_date = ? AND start_time LIKE ?',
        [centreId, dateStr, `${slot_time.substring(0, 5)}%`]
      );
    }

    if (!targetSlot) {
      // Create slot if needed
      await db.ensureSlotsForCentre(centreId, dateStr);
      targetSlot = await db.get(
        'SELECT * FROM slots WHERE centre_id = ? AND slot_date = ? AND start_time LIKE ?',
        [centreId, dateStr, `${(slot_time || '08:00').substring(0, 5)}%`]
      );
    }

    const resolvedSlotId = targetSlot ? targetSlot.slot_id : null;
    const resolvedSlotTime = targetSlot ? targetSlot.start_time.substring(0, 5) : slot_time.substring(0, 5);

    // 1. Time Cutoff Rule: check if slot has already passed
    if (isSlotInPast(dateStr, resolvedSlotTime)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book a past or completed slot. This slot is already closed.'
      });
    }

    // 2. Offline Quota Rule: strictly capped at 2 walk-in bookings per slot
    let offlineCount = 0;
    if (resolvedSlotId) {
      const offlineRow = await db.get(
        `SELECT COUNT(*) as count FROM bookings 
         WHERE slot_id = ? AND channel = 'offline' AND booking_status != 'cancelled'`,
        [resolvedSlotId]
      );
      offlineCount = offlineRow ? Number(offlineRow.count) : 0;
    } else {
      const offlineRow = await db.get(
        `SELECT COUNT(*) as count FROM bookings 
         WHERE centre_id = ? AND slot_date = ? AND slot_time LIKE ? AND channel = 'offline' AND booking_status != 'cancelled'`,
        [centreId, dateStr, `${resolvedSlotTime}%`]
      );
      offlineCount = offlineRow ? Number(offlineRow.count) : 0;
    }

    if (offlineCount >= 2) {
      return res.status(400).json({
        success: false,
        message: 'Offline booking limit reached for this slot (max 2 walk-ins allowed).'
      });
    }

    // Check overall slot capacity
    if (targetSlot) {
      const totalBookedRow = await db.get(
        "SELECT COUNT(*) as count FROM bookings WHERE slot_id = ? AND booking_status != 'cancelled'",
        [targetSlot.slot_id]
      );
      if (totalBookedRow && Number(totalBookedRow.count) >= targetSlot.max_bookings) {
        return res.status(400).json({
          success: false,
          message: 'This slot is completely full (maximum capacity reached).'
        });
      }
    }

    // Generate next queue number
    const queueRow = await db.get(
      'SELECT COALESCE(MAX(queue_number), 0) + 1 AS next_queue FROM bookings WHERE centre_id = ? AND slot_date = ?',
      [centreId, dateStr]
    );
    const nextQueueNumber = queueRow ? queueRow.next_queue : 1;

    const staffId = req.user.staff_id || req.user.user_id;

    // Check if farmer is already registered with this phone number
    const existingFarmer = await db.get('SELECT user_id FROM users WHERE phone_number = ?', [cleanPhone]);
    const resolvedFarmerId = existingFarmer ? existingFarmer.user_id : null;

    // Insert offline booking
    const insertRes = await db.query(
      `INSERT INTO bookings 
        (farmer_id, centre_id, slot_id, crop_name, estimated_quantity_kg, slot_date, slot_time, 
         queue_number, channel, approval_status, booking_status, procurement_status, payment_status, 
         registered_by_staff_id, walkin_name, walkin_phone, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'offline', 'approved', 'booked', 'pending', 'pending', ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        resolvedFarmerId,
        centreId,
        resolvedSlotId,
        crop_name.trim(),
        Number(estimated_quantity_kg),
        dateStr,
        resolvedSlotTime,
        nextQueueNumber,
        staffId,
        farmer_name.trim(),
        cleanPhone
      ]
    );

    const bookingId = insertRes.insertId;

    res.status(201).json({
      success: true,
      message: 'Walk-in booking registered successfully!',
      booking: {
        booking_id: bookingId,
        centre_id: centreId,
        slot_id: resolvedSlotId,
        farmer_name: farmer_name.trim(),
        phone_number: String(phone_number).trim(),
        crop_name: crop_name.trim(),
        estimated_quantity_kg: Number(estimated_quantity_kg),
        slot_date: dateStr,
        slot_time: resolvedSlotTime,
        queue_number: nextQueueNumber,
        channel: 'offline',
        approval_status: 'approved',
        booking_status: 'booked'
      }
    });
  } catch (err) {
    console.error('Error creating offline booking:', err);
    res.status(500).json({ success: false, message: 'Failed to create offline walk-in booking.' });
  }
});

/**
 * PATCH /api/mandi/slots/:id
 * mandi_admin edits time range and max booking capacity for a slot.
 * Enforces Capacity Floor Rule: cannot reduce capacity below current bookings count.
 */
router.patch('/slots/:id', authenticateToken, requireRole(['mandi_admin']), async (req, res) => {
  try {
    const slotId = req.params.id;
    const { start_time, end_time, max_bookings } = req.body;

    const slot = await db.get('SELECT * FROM slots WHERE slot_id = ?', [slotId]);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found.' });
    }

    const newMax = max_bookings !== undefined ? Number(max_bookings) : slot.max_bookings;
    if (newMax <= 0) {
      return res.status(400).json({ success: false, message: 'Capacity must be at least 1.' });
    }

    // Capacity floor check: count current bookings in this slot
    const countRow = await db.get(
      "SELECT COUNT(*) as count FROM bookings WHERE slot_id = ? AND booking_status != 'cancelled'",
      [slotId]
    );
    const currentBookings = countRow ? Number(countRow.count) : 0;

    if (newMax < currentBookings) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce capacity to ${newMax}. This slot currently has ${currentBookings} active booking(s). Capacity cannot be less than current bookings.`
      });
    }

    const updatedStartTime = start_time || slot.start_time;
    const updatedEndTime = end_time || slot.end_time;

    await db.query(
      'UPDATE slots SET start_time = ?, end_time = ?, max_bookings = ? WHERE slot_id = ?',
      [updatedStartTime, updatedEndTime, newMax, slotId]
    );

    const updated = await db.get('SELECT * FROM slots WHERE slot_id = ?', [slotId]);

    res.json({
      success: true,
      message: 'Slot updated successfully.',
      slot: updated
    });
  } catch (err) {
    console.error('Error updating slot:', err);
    res.status(500).json({ success: false, message: 'Failed to update slot.' });
  }
});

/**
 * PATCH /api/mandi/bookings/:id/approve
 * mandi_admin approves or rejects an online booking
 */
router.patch('/bookings/:id/approve', authenticateToken, requireRole(['mandi_admin', 'staff', 'admin']), async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { approval_status, reason } = req.body;

    if (!['approved', 'rejected'].includes(approval_status)) {
      return res.status(400).json({ success: false, message: 'approval_status must be either approved or rejected.' });
    }

    const booking = await db.get(
      `SELECT b.*, u.phone_number, u.full_name, c.centre_name 
       FROM bookings b 
       LEFT JOIN users u ON b.farmer_id = u.user_id 
       JOIN procurement_centres c ON b.centre_id = c.centre_id 
       WHERE b.booking_id = ?`,
      [bookingId]
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const newBookingStatus = approval_status === 'rejected' ? 'cancelled' : booking.booking_status;

    await db.query(
      'UPDATE bookings SET approval_status = ?, booking_status = ? WHERE booking_id = ?',
      [approval_status, newBookingStatus, bookingId]
    );

    // Send notification to farmer if phone number available
    const phone = booking.channel === 'offline' ? booking.walkin_phone : booking.phone_number;
    if (phone) {
      let msg = '';
      if (approval_status === 'approved') {
        msg = `Your booking for ${booking.crop_name} at ${booking.centre_name} on ${booking.slot_date} at ${booking.slot_time} has been approved by Mandi Admin.`;
      } else {
        msg = `Your booking for ${booking.crop_name} at ${booking.centre_name} has been rejected.${reason ? ` Reason: ${reason}` : ''} The slot has been released.`;
      }

      await sendNotification({
        farmerId: booking.farmer_id,
        bookingId,
        message: msg,
        phoneNumber: phone
      });
    }

    res.json({
      success: true,
      message: `Booking has been ${approval_status}.`,
      booking_id: bookingId,
      approval_status
    });
  } catch (err) {
    console.error('Error approving booking:', err);
    res.status(500).json({ success: false, message: 'Failed to update approval status.' });
  }
});

/**
 * POST /api/mandi/bookings/:id/accept
 * Workflow acceptance: Procurement + Payment + Final Amount + Receipt generation
 */
router.post('/bookings/:id/accept', authenticateToken, requireRole(['mandi_admin', 'mandi_member', 'staff', 'admin']), async (req, res) => {
  try {
    const bookingId = req.params.id;
    const {
      actual_quantity_kg,
      quality_grade,
      agreed_price_per_unit,
      final_amount,
      adjustment_reason,
      payment_mode,
      payment_status,
      transaction_ref,
      receipt_image
    } = req.body;

    const actualQty = Number(actual_quantity_kg);
    const agreedPrice = Number(agreed_price_per_unit);
    const finalAmt = Number(final_amount);

    if (isNaN(actualQty) || actualQty <= 0) {
      return res.status(400).json({ success: false, message: 'Valid actual quantity is required.' });
    }
    if (!quality_grade) {
      return res.status(400).json({ success: false, message: 'Quality grade is required.' });
    }
    if (isNaN(agreedPrice) || agreedPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Agreed price per unit is required.' });
    }
    if (isNaN(finalAmt) || finalAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Final amount is required.' });
    }

    // Check adjustment reason if final amount differs from calculated qty * price
    const calculatedAmt = actualQty * agreedPrice;
    if (Math.abs(finalAmt - calculatedAmt) > 0.05 && (!adjustment_reason || !adjustment_reason.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Adjustment reason is mandatory when final amount differs from (Actual Qty × Agreed Price).'
      });
    }

    // Payment validation
    const mode = payment_mode || 'Cash';
    const rawPayStatus = (payment_status || 'Paid').toLowerCase();
    const payStatus = ['pending', 'processing', 'paid'].includes(rawPayStatus) ? rawPayStatus : 'paid';
    if ((mode === 'UPI' || mode === 'Bank Transfer') && (!transaction_ref || !transaction_ref.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Transaction reference is required for UPI or Bank Transfer payments.'
      });
    }

    const booking = await db.get(
      `SELECT b.*, u.phone_number, u.full_name, c.centre_name 
       FROM bookings b 
       LEFT JOIN users u ON b.farmer_id = u.user_id 
       JOIN procurement_centres c ON b.centre_id = c.centre_id 
       WHERE b.booking_id = ?`,
      [bookingId]
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const staffId = req.user.staff_id || req.user.user_id;
    const isRejected = quality_grade === 'Rejected';
    const procurementStatus = isRejected ? 'rejected' : 'accepted';
    const bookingStatus = 'completed';

    // 1. Insert procurement record
    await db.query(
      `INSERT INTO procurement_records 
        (booking_id, actual_quantity_kg, quality_grade, agreed_price_per_unit, final_amount, adjustment_reason, recorded_by_staff_id, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [bookingId, actualQty, quality_grade, agreedPrice, finalAmt, adjustment_reason ? adjustment_reason.trim() : null, staffId]
    );

    // 2. Insert payment record
    await db.query(
      `INSERT INTO payments 
        (booking_id, amount, payment_mode, payment_status, transaction_ref, paid_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [bookingId, finalAmt, mode, payStatus, transaction_ref ? transaction_ref.trim() : null]
    );

    // 3. Update booking status
    await db.query(
      `UPDATE bookings 
       SET procurement_status = ?, payment_status = ?, booking_status = ?, 
           final_quantity_kg = ?, final_amount = ? 
       WHERE booking_id = ?`,
      [procurementStatus, payStatus, bookingStatus, actualQty, finalAmt, bookingId]
    );

    // 4. Save receipt image if provided (safeguarded so it never blocks acceptance)
    if (receipt_image) {
      try {
        await db.query(
          'INSERT INTO receipts (booking_id, image_data, generated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
          [bookingId, receipt_image]
        );
      } catch (recErr) {
        console.warn('Could not save receipt image during accept:', recErr.message);
      }
    }

    // 5. Send notification to farmer
    const phone = booking.channel === 'offline' ? booking.walkin_phone : booking.phone_number;
    if (phone) {
      const msg = isRejected
        ? `Your crop ${booking.crop_name} was inspected and marked as Rejected at ${booking.centre_name}.`
        : `Procurement accepted! ${actualQty} kg of ${booking.crop_name} (Grade: ${quality_grade}) at ${booking.centre_name}. Amount: ₹${finalAmt.toLocaleString('en-IN')}. Receipt generated.`;

      await sendNotification({
        farmerId: booking.farmer_id,
        bookingId,
        message: msg,
        phoneNumber: phone
      });
    }

    res.json({
      success: true,
      message: 'Procurement accepted, payment recorded, and official receipt generated.',
      booking_id: bookingId,
      final_amount: finalAmt,
      procurement_status: procurementStatus,
      payment_status: payStatus
    });
  } catch (err) {
    console.error('Accept workflow error:', err);
    res.status(500).json({ success: false, message: `Failed to complete procurement workflow: ${err.message}` });
  }
});

/**
 * GET /api/mandi/bookings/:id/receipt
 * Retrieve the generated canvas receipt image data for a booking
 */
router.get('/bookings/:id/receipt', authenticateToken, async (req, res) => {
  try {
    const bookingId = req.params.id;

    const receipt = await db.get(
      'SELECT id, booking_id, generated_at, image_data FROM receipts WHERE booking_id = ? ORDER BY id DESC LIMIT 1',
      [bookingId]
    );

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'No receipt found for this booking.' });
    }

    res.json({
      success: true,
      receipt
    });
  } catch (err) {
    console.error('Fetch receipt error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve receipt.' });
  }
});

/**
 * POST /api/mandi/:centreId/call-farmer/:bookingId
 * Triggers immediate outbound Sarvam voice call to the selected farmer
 */
router.post('/:centreId/call-farmer/:bookingId', authenticateToken, requireRole(['staff', 'mandi_admin', 'mandi_member', 'admin']), async (req, res) => {
  try {
    const bookingId = Number(req.params.bookingId);
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID.' });
    }

    const result = await triggerDirectSarvamCall({ bookingId });
    if (result.success && result.attempt_id) {
      return res.json({
        success: true,
        message: 'Call Executed Successfully',
        attempt_id: result.attempt_id
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Call Failed',
        error: result.error || 'Sarvam outbound request was not accepted'
      });
    }
  } catch (err) {
    console.error('Error in call-farmer route:', err);
    return res.status(500).json({ success: false, message: 'Call Failed', error: err.message });
  }
});

module.exports = router;
