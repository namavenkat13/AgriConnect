// backend/routes/centres.js
// Procurement centres listings and dynamic slot capacity calculation

const express = require('express');
const router = express.Router();
const db = require('../db');
const { getISTDateTime, getISTDateString, isSlotInPast } = require('../utils/timezone');

/**
 * Helper to generate time slot intervals between opening and closing time
 */
function generateHourlySlots(openingTime = '08:00:00', closingTime = '17:00:00') {
  const startHour = parseInt(openingTime.split(':')[0], 10);
  const endHour = parseInt(closingTime.split(':')[0], 10);
  const slots = [];

  for (let h = startHour; h < endHour; h++) {
    const timeStr = `${String(h).padStart(2, '0')}:00`;
    const nextHour = `${String(h + 1).padStart(2, '0')}:00`;

    const format12 = (hourNum) => {
      const period = hourNum >= 12 ? 'PM' : 'AM';
      const displayH = hourNum % 12 === 0 ? 12 : hourNum % 12;
      return `${displayH}:00 ${period}`;
    };

    slots.push({
      time: timeStr,
      label: `${format12(h)} - ${format12(h + 1)}`
    });
  }

  return slots;
}

/**
 * GET /api/centres/states
 * Returns distinct list of states having procurement centres
 */
router.get('/states', async (req, res) => {
  try {
    const rows = await db.query("SELECT DISTINCT state FROM procurement_centres WHERE state IS NOT NULL AND state != '' ORDER BY state ASC");
    const states = rows.map(r => r.state);
    res.json({ success: true, states });
  } catch (err) {
    console.error('Error fetching states:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch states.' });
  }
});

/**
 * GET /api/centres
 * List procurement centres with optional state and city filters
 */
router.get('/', async (req, res) => {
  try {
    const { state, city } = req.query;
    let sql = `
      SELECT pc.*, 
        EXISTS(SELECT 1 FROM centre_staff cs WHERE cs.centre_id = pc.centre_id AND cs.role = 'mandi_admin') as is_claimed
      FROM procurement_centres pc
    `;
    const params = [];
    const conditions = [];

    if (state) {
      conditions.push('pc.state = ?');
      params.push(state);
    }
    if (city) {
      conditions.push('pc.city = ?');
      params.push(city);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY pc.state ASC, pc.city ASC, pc.centre_name ASC';

    const rawCentres = await db.query(sql, params);
    const centres = rawCentres.map(c => ({
      ...c,
      is_claimed: Boolean(c.is_claimed)
    }));
    res.json({ success: true, total: centres.length, centres });
  } catch (err) {
    console.error('Error fetching centres:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch centres.' });
  }
});

/**
 * GET /api/centres/:id/slots?date=YYYY-MM-DD
 * Get time slots for a specific centre on a given date, calculating current bookings vs capacity
 */
router.get('/:id/slots', async (req, res) => {
  try {
    const centreId = req.params.id;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Query parameter date (YYYY-MM-DD) is required.' });
    }

    const centre = await db.get('SELECT * FROM procurement_centres WHERE centre_id = ?', [centreId]);
    if (!centre) {
      return res.status(404).json({ success: false, message: 'Procurement centre not found.' });
    }

    // Ensure persistent slots exist for centre on this date
    const dbSlots = await db.ensureSlotsForCentre(centreId, date);

    // Get count of bookings per slot on that date (excluding cancelled)
    const bookedRows = await db.query(
      "SELECT slot_id, slot_time, COUNT(*) as count FROM bookings WHERE centre_id = ? AND slot_date = ? AND booking_status != 'cancelled' GROUP BY slot_id, slot_time",
      [centreId, date]
    );

    const bookingCountMap = {};
    const bookingSlotIdMap = {};
    for (const row of bookedRows) {
      const key = row.slot_time.substring(0, 5);
      bookingCountMap[key] = (bookingCountMap[key] || 0) + Number(row.count);
      if (row.slot_id) {
        bookingSlotIdMap[row.slot_id] = (bookingSlotIdMap[row.slot_id] || 0) + Number(row.count);
      }
    }

    const format12 = (hourNum) => {
      const period = hourNum >= 12 ? 'PM' : 'AM';
      const displayH = hourNum % 12 === 0 ? 12 : hourNum % 12;
      return `${displayH}:00 ${period}`;
    };

    const slotsWithAvailability = dbSlots.map((slot) => {
      const timeHHMM = slot.start_time.substring(0, 5);
      const startH = parseInt(timeHHMM.split(':')[0], 10);
      const label = `${format12(startH)} - ${format12(startH + 1)}`;
      const booked = bookingSlotIdMap[slot.slot_id] !== undefined ? bookingSlotIdMap[slot.slot_id] : (bookingCountMap[timeHHMM] || 0);
      const cap = slot.max_bookings;
      const isClosed = isSlotInPast(date, timeHHMM);
      const available = isClosed ? 0 : Math.max(0, cap - booked);

      return {
        slot_id: slot.slot_id,
        time: timeHHMM,
        label,
        booked,
        capacity: cap,
        available,
        isFull: available <= 0,
        is_closed: isClosed
      };
    });

    res.json({
      success: true,
      centre: {
        centre_id: centre.centre_id,
        centre_name: centre.centre_name,
        daily_capacity: centre.daily_capacity
      },
      date,
      slots: slotsWithAvailability
    });
  } catch (err) {
    console.error('Error fetching slots:', err);
    res.status(500).json({ success: false, message: 'Failed to calculate available slots.' });
  }
});

module.exports = router;
