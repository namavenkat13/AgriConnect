// backend/routes/receipts.js
// Gemini-powered official procurement receipt generation with graceful fallback

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('./auth');
const { getISTDateString, getISTTimeString } = require('../utils/timezone');

/**
 * POST /api/receipts/generate
 * Generates an official APMC receipt image using the Gemini API.
 * Returns base64 image data or fallback flag if Gemini is unavailable.
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const {
      booking_id,
      mandi_name,
      date,
      time,
      farmer_name,
      phone_number,
      crop_name,
      quantity_kg,
      quality_grade,
      agreed_price_per_unit,
      final_amount,
      payment_mode
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ [Receipts] GEMINI_API_KEY not configured. Requesting client canvas fallback.');
      return res.json({
        success: false,
        fallback: true,
        message: 'GEMINI_API_KEY is not configured in environment.'
      });
    }

    const mandiName = mandi_name || 'APMC Procurement Yard';
    const farmer = farmer_name || 'Farmer';
    const phone = phone_number || 'N/A';
    const crop = crop_name || 'Agri Produce';
    const qty = quantity_kg || '0';
    const grade = quality_grade || 'Standard';
    const rate = agreed_price_per_unit || '0';
    const amount = final_amount || '0';
    const mode = payment_mode || 'Cash';
    const dateStr = date || getISTDateString();
    const timeStr = time || getISTTimeString();
    const receiptNo = `REC-MANDI-${booking_id || Date.now()}-${Date.now().toString().slice(-4)}`;

    const receiptPrompt = `Official APMC Procurement & Settlement Receipt:
Header: ${mandiName}
Receipt Number: ${receiptNo}
Date: ${dateStr} | Time: ${timeStr}
Farmer Name: ${farmer}
Mobile: ${phone}
Crop Procured: ${crop}
Weighed Quantity: ${qty} kg
Quality Inspection Grade: ${grade}
Agreed Rate: ₹${rate}/kg
Final Settlement Amount: ₹${amount}
Payment Mode: ${mode}
Status: VERIFIED & PAID — APMC OFFICIAL
Visual layout: Crisp white document background, clear dark typography, official green bordered box, structured rows, verified seal watermark stamp.`;

    let base64Image = null;
    let mimeType = 'image/png';

    // Attempt 1: Call gemini-2.5-flash-image
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: receiptPrompt }]
            }
          ],
          generationConfig: {
            responseModalities: ['IMAGE']
          }
        })
      });

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const candidate = data.candidates?.[0];
        const part = candidate?.content?.parts?.find(p => p.inlineData);
        if (part && part.inlineData && part.inlineData.data) {
          base64Image = part.inlineData.data;
          mimeType = part.inlineData.mimeType || 'image/png';
        }
      } else {
        const errText = await geminiRes.text();
        console.warn(`[Receipts] gemini-2.5-flash-image returned ${geminiRes.status}:`, errText);
      }
    } catch (e) {
      console.warn('[Receipts] Error calling gemini-2.5-flash-image:', e.message);
    }

    // Attempt 2: Fallback to imagen-3.0-generate-002 if gemini-2.5-flash-image did not return an image
    if (!base64Image) {
      try {
        const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
        const imagenRes = await fetch(imagenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [
              { prompt: `Crisp clean official receipt document on white paper. ${receiptPrompt}` }
            ],
            parameters: {
              sampleCount: 1,
              aspectRatio: '3:4'
            }
          })
        });

        if (imagenRes.ok) {
          const imgData = await imagenRes.json();
          const encoded = imgData.predictions?.[0]?.bytesBase64Encoded;
          if (encoded) {
            base64Image = encoded;
            mimeType = 'image/png';
          }
        } else {
          const errText = await imagenRes.text();
          console.warn(`[Receipts] imagen-3.0-generate-002 returned ${imagenRes.status}:`, errText);
        }
      } catch (e) {
        console.warn('[Receipts] Error calling imagen-3.0-generate-002:', e.message);
      }
    }

    // If both models failed or did not return an image, request client canvas fallback
    if (!base64Image) {
      return res.json({
        success: false,
        fallback: true,
        message: 'AI receipt generation unavailable, falling back to verified canvas receipt.'
      });
    }

    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    // Persist to receipts table if booking_id provided
    if (booking_id) {
      try {
        await db.query(
          'INSERT INTO receipts (booking_id, image_data, generated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
          [booking_id, dataUrl]
        );
      } catch (dbErr) {
        console.warn('[Receipts] Could not persist receipt image to DB:', dbErr.message);
      }
    }

    res.json({
      success: true,
      image_data: dataUrl,
      source: 'gemini'
    });
  } catch (err) {
    console.error('[Receipts] Unhandled generate error:', err);
    res.json({
      success: false,
      fallback: true,
      message: `Gemini receipt error: ${err.message}`
    });
  }
});

/**
 * POST /api/receipts/save
 * Persists client canvas generated receipt to database
 */
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { booking_id, image_data } = req.body;
    if (!booking_id || !image_data) {
      return res.status(400).json({ success: false, message: 'booking_id and image_data required.' });
    }

    await db.query(
      'INSERT INTO receipts (booking_id, image_data, generated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [booking_id, image_data]
    );

    res.json({ success: true, message: 'Receipt saved successfully.' });
  } catch (err) {
    console.error('Error saving receipt:', err);
    res.status(500).json({ success: false, message: 'Failed to save receipt.' });
  }
});

/**
 * GET /api/receipts/:bookingId
 * Retrieve the latest receipt image for a booking
 */
router.get('/:bookingId', authenticateToken, async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const receipt = await db.get(
      'SELECT id, booking_id, image_data, generated_at FROM receipts WHERE booking_id = ? ORDER BY id DESC LIMIT 1',
      [bookingId]
    );

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'No receipt found for this booking.' });
    }

    res.json({ success: true, receipt });
  } catch (err) {
    console.error('Error retrieving receipt:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve receipt.' });
  }
});

module.exports = router;