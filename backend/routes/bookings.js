// backend/routes/bookings.js
// Handles slot bookings, farmer booking history, admin centre queues, and status transitions

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('./auth');
const { sendNotification } = require('../utils/sms');
const { isSlotInPast, getISTDateString, getISTTimeString } = require('../utils/timezone');

/**
 * Helper to format date as YYYY-MM-DD in India Standard Time
 */
function getTodayDateString() {
  return getISTDateString();
}

/**
 * POST /api/bookings
 * Farmer books a slot at a procurement centre
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const farmerId = req.user.user_id;
    const { centre_id, crop_name, estimated_quantity_kg, slot_date, slot_time } = req.body;

    if (!centre_id || !crop_name || !slot_date || !slot_time) {
      return res.status(400).json({ success: false, message: 'Centre, crop, slot date, and slot time are required.' });
    }

    const centre = await db.get('SELECT * FROM procurement_centres WHERE centre_id = ?', [centre_id]);
    if (!centre) {
      return res.status(404).json({ success: false, message: 'Selected procurement centre does not exist.' });
    }

    const qty = Number(estimated_quantity_kg) || 0;
    if (qty <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid estimated quantity.' });
    }

    // Time-based cutoff rule: reject if slot is in the past (past date or past time today)
    if (isSlotInPast(slot_date, slot_time)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book a past or completed slot. Please choose a future slot.'
      });
    }

    // Resolve or create slot_id
    let slotId = null;
    try {
      const dbSlots = await db.ensureSlotsForCentre(centre_id, slot_date);
      const matchedSlot = dbSlots.find(s => s.start_time.substring(0, 5) === slot_time.substring(0, 5));
      if (matchedSlot) {
        slotId = matchedSlot.slot_id;

        // Check if slot capacity is full
        const bookedInSlot = await db.get(
          "SELECT COUNT(*) as count FROM bookings WHERE slot_id = ? AND booking_status != 'cancelled'",
          [slotId]
        );
        if (bookedInSlot && Number(bookedInSlot.count) >= matchedSlot.max_bookings) {
          return res.status(400).json({ success: false, message: 'This slot is completely booked to maximum capacity.' });
        }
      }
    } catch (slotErr) {
      console.warn('Slot lookup warning:', slotErr);
    }

    // Auto-calculate next queue number for this centre on this date
    const queueRow = await db.get(
      'SELECT COALESCE(MAX(queue_number), 0) + 1 AS next_queue FROM bookings WHERE centre_id = ? AND slot_date = ?',
      [centre_id, slot_date]
    );
    const nextQueueNumber = queueRow ? queueRow.next_queue : 1;

    // Ensure queue_status row exists for this centre and date
    const queueStatus = await db.get(
      'SELECT * FROM queue_status WHERE centre_id = ? AND slot_date = ?',
      [centre_id, slot_date]
    );
    if (!queueStatus) {
      await db.query(
        'INSERT INTO queue_status (centre_id, slot_date, now_serving_number) VALUES (?, ?, 0)',
        [centre_id, slot_date]
      );
    }

    // Insert booking
    const insertResult = await db.query(
      `INSERT INTO bookings 
        (farmer_id, centre_id, slot_id, crop_name, estimated_quantity_kg, slot_date, slot_time, queue_number, channel, approval_status, booking_status, procurement_status, payment_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'online', 'approved', 'booked', 'pending', 'pending', CURRENT_TIMESTAMP)`,
      [farmerId, centre_id, slotId, crop_name.trim(), qty, slot_date, slot_time, nextQueueNumber]
    );

    const bookingId = insertResult.insertId;

    // Fetch user details for notification
    const user = await db.get('SELECT full_name, phone_number FROM users WHERE user_id = ?', [farmerId]);

    // Notification 1: Booking confirmation
    const confirmMessage = `Your slot at ${centre.centre_name} on ${slot_date} at ${slot_time} is confirmed. Your queue number is #${nextQueueNumber}.`;
    await sendNotification({
      farmerId,
      bookingId,
      message: confirmMessage,
      phoneNumber: user ? user.phone_number : ''
    });

    res.status(201).json({
      success: true,
      message: 'Slot booked successfully!',
      booking: {
        booking_id: bookingId,
        centre_name: centre.centre_name,
        slot_date,
        slot_time,
        crop_name,
        estimated_quantity_kg: qty,
        queue_number: nextQueueNumber,
        booking_status: 'booked'
      }
    });
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ success: false, message: 'Failed to create booking.' });
  }
});

/**
 * GET /api/bookings/my
 * Returns all bookings for the logged-in farmer
 */
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const farmerId = req.user.user_id;
    const bookings = await db.query(
      `SELECT b.*, c.centre_name, c.location as centre_location 
       FROM bookings b 
       JOIN procurement_centres c ON b.centre_id = c.centre_id 
       WHERE b.farmer_id = ? 
       ORDER BY b.slot_date DESC, b.slot_time DESC, b.booking_id DESC`,
      [farmerId]
    );

    res.json({ success: true, bookings });
  } catch (err) {
    console.error('Error fetching farmer bookings:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
  }
});

/**
 * GET /api/bookings/centre/:id/today
 * Staff/Admin: view today's queue for a given centre
 */
router.get('/centre/:id/today', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const centreId = req.params.id;
    const date = req.query.date || getTodayDateString();

    const bookings = await db.query(
      `SELECT b.*, u.full_name as farmer_name, u.phone_number as farmer_phone, u.village 
       FROM bookings b 
       JOIN users u ON b.farmer_id = u.user_id 
       WHERE b.centre_id = ? AND b.slot_date = ? 
       ORDER BY b.queue_number ASC`,
      [centreId, date]
    );

    const queueStatus = await db.get(
      'SELECT now_serving_number FROM queue_status WHERE centre_id = ? AND slot_date = ?',
      [centreId, date]
    );

    const nowServing = queueStatus ? Number(queueStatus.now_serving_number) : 0;

    res.json({
      success: true,
      centre_id: centreId,
      date,
      now_serving_number: nowServing,
      bookings
    });
  } catch (err) {
    console.error('Error fetching centre queue:', err);
    res.status(500).json({ success: false, message: 'Failed to load centre queue.' });
  }
});

/**
 * PUT /api/bookings/:id/status
 * Staff/Admin: update procurement and payment status for a booking
 */
router.put('/:id/status', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { procurement_status, payment_status, final_quantity_kg, final_amount, booking_status } = req.body;

    const booking = await db.get(
      `SELECT b.*, u.phone_number, u.full_name, c.centre_name 
       FROM bookings b 
       JOIN users u ON b.farmer_id = u.user_id 
       JOIN procurement_centres c ON b.centre_id = c.centre_id 
       WHERE b.booking_id = ?`,
      [bookingId]
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const prevProcurementStatus = booking.procurement_status;
    const prevPaymentStatus = booking.payment_status;

    const newProcStatus = procurement_status || booking.procurement_status;
    const newPayStatus = payment_status || booking.payment_status;
    const newBookStatus = booking_status || (newProcStatus === 'accepted' || newProcStatus === 'rejected' ? 'completed' : booking.booking_status);
    const finalQty = final_quantity_kg !== undefined ? Number(final_quantity_kg) : booking.final_quantity_kg;
    const finalAmt = final_amount !== undefined ? Number(final_amount) : booking.final_amount;

    await db.query(
      `UPDATE bookings 
       SET procurement_status = ?, payment_status = ?, booking_status = ?, final_quantity_kg = ?, final_amount = ? 
       WHERE booking_id = ?`,
      [newProcStatus, newPayStatus, newBookStatus, finalQty, finalAmt, bookingId]
    );

    // Business Logic Notifications:
    // 1. Procurement status changes to accepted or rejected
    if (newProcStatus !== prevProcurementStatus && (newProcStatus === 'accepted' || newProcStatus === 'rejected')) {
      const qtyText = finalQty ? `${finalQty} kg` : (booking.estimated_quantity_kg ? `${booking.estimated_quantity_kg} kg` : '');
      const msg = `Your ${booking.crop_name} ${qtyText ? `(Qty: ${qtyText}) ` : ''}has been ${newProcStatus} at ${booking.centre_name}.`;
      await sendNotification({
        farmerId: booking.farmer_id,
        bookingId: booking.booking_id,
        message: msg,
        phoneNumber: booking.phone_number
      });
    }

    // 2. Payment status changes to paid
    if (newPayStatus !== prevPaymentStatus && newPayStatus === 'paid') {
      const amtText = finalAmt ? `₹${finalAmt.toLocaleString('en-IN')}` : 'full';
      const msg = `Payment of ${amtText} for your ${booking.crop_name} has been processed. Thank you!`;
      await sendNotification({
        farmerId: booking.farmer_id,
        bookingId: booking.booking_id,
        message: msg,
        phoneNumber: booking.phone_number
      });
    }

    const updated = await db.get('SELECT * FROM bookings WHERE booking_id = ?', [bookingId]);

    res.json({
      success: true,
      message: 'Booking status updated successfully.',
      booking: updated
    });
  } catch (err) {
    console.error('Error updating booking status:', err);
    res.status(500).json({ success: false, message: 'Failed to update booking status.' });
  }
});

/**
 * GET /api/bookings/:id/receipt
 * Farmer or Mandi Staff retrieves stored receipt image
 */
router.get('/:id/receipt', authenticateToken, async (req, res) => {
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

module.exports = router;
