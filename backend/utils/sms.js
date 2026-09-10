// backend/utils/sms.js
// Handles SMS dispatch with Twilio API and formatted console fallback.
// Also records notification to database and broadcasts via WebSocket.

const db = require('../db');

let ioInstance = null;

function setSocketIO(io) {
  ioInstance = io;
}

/**
 * Send SMS and In-App notification
 * @param {Object} options
 * @param {number} options.farmerId - User ID of the farmer
 * @param {number|null} options.bookingId - Associated booking ID if any
 * @param {string} options.message - Notification text
 * @param {string} options.phoneNumber - Target phone number
 * @param {string} [options.channel='sms'] - 'sms' or 'app'
 */
async function sendNotification({ farmerId, bookingId = null, message, phoneNumber = '', channel = 'sms' }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  let smsDispatched = false;

  // 1. Dispatch SMS via Twilio if credentials configured
  if (accountSid && authToken && twilioPhone && phoneNumber) {
    try {
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`);
      params.append('From', twilioPhone);
      params.append('Body', `[AgriConnect] ${message}`);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (response.ok) {
        smsDispatched = true;
        console.log(`📱 [Twilio SMS Sent] to ${phoneNumber}: ${message}`);
      } else {
        const errorData = await response.text();
        console.warn(`⚠️ Twilio API returned error: ${errorData}`);
      }
    } catch (twErr) {
      console.warn(`⚠️ Twilio dispatch error (${twErr.message}). Using console fallback.`);
    }
  }

  // 2. Console fallback (always active when Twilio is absent or fails)
  if (!smsDispatched) {
    console.log('\n' + '═'.repeat(68));
    console.log(` 🔔 [SMS DISPATCH FALLBACK] TO: ${phoneNumber || `Farmer #${farmerId}`}`);
    console.log(` 💬 "${message}"`);
    console.log('═'.repeat(68) + '\n');
  }

  // 3. Save to database notifications table
  let notificationId = null;
  try {
    const result = await db.query(
      'INSERT INTO notifications (farmer_id, booking_id, message, channel, is_read, sent_at) VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)',
      [farmerId, bookingId, message, channel]
    );
    notificationId = result.insertId;
  } catch (dbErr) {
    console.error('Failed to save notification to DB:', dbErr.message);
  }

  // 4. Emit live WebSocket alert if user is connected
  if (ioInstance) {
    ioInstance.to(`user_${farmerId}`).emit('notification', {
      notification_id: notificationId,
      farmer_id: farmerId,
      booking_id: bookingId,
      message,
      channel,
      sent_at: new Date().toISOString()
    });
  }

  return { success: true, notificationId };
}

module.exports = {
  setSocketIO,
  sendNotification
};
