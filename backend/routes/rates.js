// backend/routes/rates.js
// Crop rates API and live market ticker simulator

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('./auth');
const { broadcastRateUpdate } = require('../sockets');

/**
 * Format rate object with percentage change
 */
function formatRate(row) {
  const current = Number(row.price_per_quintal) || 0;
  const previous = Number(row.previous_price) || current;
  const diff = current - previous;
  const changePct = previous > 0 ? ((diff / previous) * 100) : 0;

  return {
    rate_id: row.rate_id,
    crop_name: row.crop_name,
    price_per_quintal: current,
    previous_price: previous,
    change_amount: Number(diff.toFixed(2)),
    change_pct: Number(changePct.toFixed(2)),
    trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
    updated_at: row.updated_at
  };
}

/**
 * GET /api/rates
 * Public endpoint: returns list of all current crop rates with trends
 */
router.get('/', async (req, res) => {
  try {
    const rows = await db.query('SELECT rate_id, crop_name, price_per_quintal, previous_price, updated_at FROM crop_rates ORDER BY crop_name ASC');
    const rates = rows.map(formatRate);
    res.json({ success: true, rates });
  } catch (err) {
    console.error('Error fetching rates:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch crop rates.' });
  }
});

/**
 * PUT /api/rates/:id
 * Admin/Staff only: update price of an existing crop
 */
router.put('/:id', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const rateId = req.params.id;
    const { price_per_quintal } = req.body;

    const newPrice = Number(price_per_quintal);
    if (!newPrice || isNaN(newPrice) || newPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Valid price per quintal is required.' });
    }

    const currentCrop = await db.get('SELECT * FROM crop_rates WHERE rate_id = ?', [rateId]);
    if (!currentCrop) {
      return res.status(404).json({ success: false, message: 'Crop rate record not found.' });
    }

    const oldPrice = Number(currentCrop.price_per_quintal);

    await db.query(
      'UPDATE crop_rates SET previous_price = ?, price_per_quintal = ?, updated_at = CURRENT_TIMESTAMP WHERE rate_id = ?',
      [oldPrice, newPrice, rateId]
    );

    const updatedCrop = await db.get('SELECT * FROM crop_rates WHERE rate_id = ?', [rateId]);
    const formatted = formatRate(updatedCrop);

    // Broadcast live rate update via Socket.IO to all users
    broadcastRateUpdate(formatted);

    res.json({
      success: true,
      message: `Updated ${formatted.crop_name} price to ₹${formatted.price_per_quintal}/quintal.`,
      rate: formatted
    });
  } catch (err) {
    console.error('Error updating crop rate:', err);
    res.status(500).json({ success: false, message: 'Failed to update crop rate.' });
  }
});

/**
 * POST /api/rates
 * Admin/Staff only: add a new crop to market rates
 */
router.post('/', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { crop_name, price_per_quintal } = req.body;

    if (!crop_name || !price_per_quintal) {
      return res.status(400).json({ success: false, message: 'Crop name and initial price are required.' });
    }

    const price = Number(price_per_quintal);
    const result = await db.query(
      'INSERT INTO crop_rates (crop_name, price_per_quintal, previous_price, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [crop_name.trim(), price, price]
    );

    const newRate = await db.get('SELECT * FROM crop_rates WHERE rate_id = ?', [result.insertId]);
    const formatted = formatRate(newRate);

    broadcastRateUpdate(formatted);

    res.status(201).json({
      success: true,
      message: `Added new crop ${crop_name} at ₹${price}/quintal.`,
      rate: formatted
    });
  } catch (err) {
    console.error('Error adding crop rate:', err);
    res.status(500).json({ success: false, message: 'Failed to add crop rate.' });
  }
});

/**
 * Background Live Market Simulator
 * Nudges a random crop's price slightly every 20-30 seconds to simulate real-time mandi action
 */
let simulationTimer = null;

function startMarketSimulator() {
  if (simulationTimer) return;

  simulationTimer = setInterval(async () => {
    try {
      const allRates = await db.query('SELECT * FROM crop_rates');
      if (!allRates || allRates.length === 0) return;

      // Pick a random crop
      const randomIndex = Math.floor(Math.random() * allRates.length);
      const crop = allRates[randomIndex];

      const currentPrice = Number(crop.price_per_quintal);
      // Nudge between -1.5% and +1.8%
      const pctNudge = (Math.random() * 3.3 - 1.5) / 100;
      let newPrice = Math.round((currentPrice * (1 + pctNudge)) * 10) / 10;
      if (newPrice <= 100) newPrice = 100;

      if (newPrice === currentPrice) return;

      await db.query(
        'UPDATE crop_rates SET previous_price = ?, price_per_quintal = ?, updated_at = CURRENT_TIMESTAMP WHERE rate_id = ?',
        [currentPrice, newPrice, crop.rate_id]
      );

      const updated = await db.get('SELECT * FROM crop_rates WHERE rate_id = ?', [crop.rate_id]);
      const formatted = formatRate(updated);

      broadcastRateUpdate(formatted);
    } catch (simErr) {
      // Ignore background simulator errors
    }
  }, 25000); // every 25 seconds
}

module.exports = {
  router,
  startMarketSimulator,
  formatRate
};
