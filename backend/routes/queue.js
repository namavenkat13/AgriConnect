// backend/routes/queue.js
// Live queue status and "Call Next Farmer" workflow

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('./auth');
const { sendNotification } = require('../utils/sms');
const { broadcastQueueUpdate } = require('../sockets');
const { triggerSarvamQueueCall } = require('../utils/sarvam');
const { getISTDateString } = require('../utils/timezone');

function getTodayDateString() {
  return getISTDateString();
}

/**
 * GET /api/queue/:centreId/today
 * Public / Farmer check: get current now_serving_number and stats for centre today
 */
router.get('/:centreId/today', async (req, res) => {
  try {
    const centreId = req.params.centreId;
    const date = req.query.date || getTodayDateString();

    let queueStatus = await db.get(
      'SELECT * FROM queue_status WHERE centre_id = ? AND slot_date = ?',
      [centreId, date]
    );

    if (!queueStatus) {
      // Initialize if not present
      await db.query(
        'INSERT INTO queue_status (centre_id, slot_date, now_serving_number) VALUES (?, ?, 0)',
        [centreId, date]
      );
      queueStatus = { centre_id: centreId, slot_date: date, now_serving_number: 0 };
    }

    const nowServing = Number(queueStatus.now_serving_number) || 0;

    // Total bookings for this centre today
    const totalRow = await db.get(
      "SELECT COUNT(*) as total, MAX(queue_number) as max_queue FROM bookings WHERE centre_id = ? AND slot_date = ? AND booking_status != 'cancelled'",
      [centreId, date]
    );

    const totalBookings = totalRow ? Number(totalRow.total) : 0;
    const maxQueue = totalRow && totalRow.max_queue ? Number(totalRow.max_queue) : 0;
    const waitingCount = Math.max(0, maxQueue - nowServing);

    res.json({
      success: true,
      centre_id: Number(centreId),
      slot_date: date,
      now_serving_number: nowServing,
      total_bookings: totalBookings,
      waiting_count: waitingCount,
      estimated_wait_mins_per_farmer: 10
    });
  } catch (err) {
    console.error('Error fetching queue status:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch queue status.' });
  }
});

/**
 * POST /api/queue/:centreId/next
 * Staff/Admin: Advance queue to next farmer, dispatch notifications to upcoming farmers
 */
router.post('/:centreId/next', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const centreId = req.params.centreId;
    const date = req.body.date || getTodayDateString();

    const centre = await db.get('SELECT * FROM procurement_centres WHERE centre_id = ?', [centreId]);
    if (!centre) {
      return res.status(404).json({ success: false, message: 'Centre not found.' });
    }

    // Ensure queue_status row
    let queueStatus = await db.get(
      'SELECT * FROM queue_status WHERE centre_id = ? AND slot_date = ?',
      [centreId, date]
    );

    if (!queueStatus) {
      await db.query(
        'INSERT INTO queue_status (centre_id, slot_date, now_serving_number) VALUES (?, ?, 0)',
        [centreId, date]
      );
      queueStatus = { now_serving_number: 0 };
    }

    const currentServing = Number(queueStatus.now_serving_number) || 0;
    const nextServing = currentServing + 1;

    // Update queue_status
    await db.query(
      'UPDATE queue_status SET now_serving_number = ? WHERE centre_id = ? AND slot_date = ?',
      [nextServing, centreId, date]
    );

    // Update current booking to 'in_queue'
    await db.query(
      "UPDATE bookings SET booking_status = 'in_queue' WHERE centre_id = ? AND slot_date = ? AND queue_number = ? AND booking_status = 'booked'",
      [centreId, date, nextServing]
    );

    // If previous booking was in_queue, set to completed if procurement status is progressed
    if (currentServing > 0) {
      await db.query(
        "UPDATE bookings SET booking_status = 'completed' WHERE centre_id = ? AND slot_date = ? AND queue_number = ? AND procurement_status != 'pending'",
        [centreId, date, currentServing]
      );
    }

    // Notify the farmer who is being called right now (Queue #nextServing)
    const activeBooking = await db.get(
      `SELECT b.*, u.phone_number, u.full_name 
       FROM bookings b 
       JOIN users u ON b.farmer_id = u.user_id 
       WHERE b.centre_id = ? AND b.slot_date = ? AND b.queue_number = ?`,
      [centreId, date, nextServing]
    );

    if (activeBooking) {
      const nowMsg = `Your Token #${nextServing} is now being called at ${centre.centre_name}! Please proceed immediately to counter.`;
      await sendNotification({
        farmerId: activeBooking.farmer_id,
        bookingId: activeBooking.booking_id,
        message: nowMsg,
        phoneNumber: activeBooking.phone_number
      });
    }

    // Notification Logic 2:
    // "Farmer is 2 positions away from being served -> You're next! Please reach [Centre] counter now."
    // Check upcoming farmers at nextServing + 1 and nextServing + 2
    const upcomingPositions = [nextServing + 1, nextServing + 2];
    for (const qNum of upcomingPositions) {
      const upcomingBooking = await db.get(
        `SELECT b.*, u.phone_number, u.full_name 
         FROM bookings b 
         JOIN users u ON b.farmer_id = u.user_id 
         WHERE b.centre_id = ? AND b.slot_date = ? AND b.queue_number = ?`,
        [centreId, date, qNum]
      );

      if (upcomingBooking) {
        const diff = qNum - nextServing;
        const alertMsg = diff === 1
          ? `You're next! (Queue #${qNum}). Please reach ${centre.centre_name} counter now.`
          : `Your turn is arriving soon (Queue #${qNum}, 2 positions away). Please get ready at ${centre.centre_name}.`;

        await sendNotification({
          farmerId: upcomingBooking.farmer_id,
          bookingId: upcomingBooking.booking_id,
          message: alertMsg,
          phoneNumber: upcomingBooking.phone_number
        });
      }
    }

    // Emit live WebSocket update to the centre's room
    broadcastQueueUpdate(centreId, {
      now_serving_number: nextServing,
      centre_name: centre.centre_name,
      slot_date: date
    });

    // Automatic Sarvam AI voice-call trigger disabled:
    // (Sarvam calls are now triggered exclusively on-demand via the Mandi Desk "Call Now" button)
    /*
    triggerSarvamQueueCall({
      centreId,
      centreName: centre.centre_name,
      slotDate: date,
      nowServingNumber: nextServing
    }).catch(voiceErr => {
      console.warn('⚠️ [Sarvam Voice Call] Background trigger error:', voiceErr.message);
    });
    */

    res.json({
      success: true,
      message: `Now serving Token #${nextServing}`,
      now_serving_number: nextServing,
      active_farmer: activeBooking ? activeBooking.full_name : null
    });
  } catch (err) {
    console.error('Error advancing queue:', err);
    res.status(500).json({ success: false, message: 'Failed to advance queue.' });
  }
});

module.exports = router;
