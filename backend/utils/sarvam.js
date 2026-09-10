// backend/utils/sarvam.js
// Sarvam AI Outbound Voice Call integration for AgriConnect queue alerts

const db = require('../db');

// In-memory set for debouncing immediate duplicate calls within the same process lifecycle
const recentCallDebounce = new Set();

/**
 * Formats raw phone number string to standard E.164 telephony format (+91XXXXXXXXXX)
 * @param {string} rawPhone
 * @returns {string|null} E.164 formatted number or null if invalid
 */
function formatE164PhoneNumber(rawPhone) {
  if (!rawPhone) return null;
  const cleaned = String(rawPhone).replace(/[\s\-\(\)\.]/g, '');

  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `+91${cleaned.slice(1)}`;
  }
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  if (/^\d{10,15}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  return null;
}

/**
 * Safe telephone masking for privacy in application logs
 * @param {string} phone
 * @returns {string}
 */
function maskPhone(phone) {
  if (!phone || phone.length < 6) return '******';
  return phone.slice(0, 3) + '*****' + phone.slice(-4);
}

/**
 * Builds the exact dynamic variables payload expected by the Sarvam Voice Agent
 */
function buildSarvamPayload({ formattedPhone, farmerName, booking, centreName }) {
  const slotTime = booking.slot_time ? String(booking.slot_time) : '10:00 AM';
  const reportingCounter = booking.reporting_counter || booking.counter || 'Counter 1';
  const helplineNumber = process.env.AGRICONNECT_HELPLINE_NUMBER || '1800-180-1551';

  const agentVariables = {
    farmer_name: farmerName || 'Farmer',
    token_number: Number(booking.queue_number) || booking.queue_number,
    crop_name: booking.crop_name || 'Produce',
    mandi_name: booking.centre_name || centreName || 'Mandi Yard',
    token_valid_date: String(booking.slot_date),
    token_slot_time: slotTime,
    reporting_counter: reportingCounter,
    helpline_number: helplineNumber
  };

  const payload = {
    app_config: {
      app_id: process.env.SARVAM_AGENT_ID || '',
      app_version: Number(process.env.SARVAM_APP_VERSION) || 2,
      connection_config: {
        connection_id: process.env.SARVAM_CONNECTION_ID || '',
        agent_phone_number: process.env.SARVAM_AGENT_PHONE_NUMBER || ''
      },
      agent_variables: agentVariables
    },
    user_config: {
      user_phone_number: formattedPhone
    }
  };

  return { payload, agentVariables };
}

/**
 * Trigger an outbound voice call to the upcoming farmer whose turn is 2 positions away.
 *
 * CALL TRIGGER RULE:
 * queue_number - now_serving_number === 2
 *
 * Execution is asynchronous, non-blocking, and never affects the parent queue advancement.
 *
 * @param {Object} params
 * @param {number|string} params.centreId
 * @param {string} params.centreName
 * @param {string} params.slotDate
 * @param {number} params.nowServingNumber
 * @returns {Promise<{ triggered: boolean, reason?: string, booking_id?: number }>}
 */
async function triggerSarvamQueueCall({ centreId, centreName, slotDate, nowServingNumber }) {
  try {
    const targetQueueNumber = Number(nowServingNumber) + 2;

    // 1. Locate upcoming booking satisfying queue_number - now_serving_number === 2
    const booking = await db.get(
      `SELECT b.*, u.phone_number AS user_phone, u.full_name AS user_name, c.centre_name
       FROM bookings b
       LEFT JOIN users u ON b.farmer_id = u.user_id
       JOIN procurement_centres c ON b.centre_id = c.centre_id
       WHERE b.centre_id = ?
         AND b.slot_date = ?
         AND b.queue_number = ?`,
      [centreId, slotDate, targetQueueNumber]
    );

    if (!booking) {
      // No booking assigned to this upcoming token position
      return { triggered: false, reason: 'no_booking_found' };
    }

    // 2. Skip if booking is cancelled or already completed
    if (booking.booking_status === 'cancelled' || booking.booking_status === 'completed') {
      return { triggered: false, reason: `booking_${booking.booking_status}`, booking_id: booking.booking_id };
    }

    // 3. Duplicate Call Prevention:
    // Check in-memory debounce cache
    const debounceKey = `${booking.booking_id}_${targetQueueNumber}`;
    if (recentCallDebounce.has(debounceKey)) {
      return { triggered: false, reason: 'already_called_memory', booking_id: booking.booking_id };
    }

    // Check database notifications table for channel = 'sarvam_voice'
    const existingCallRecord = await db.get(
      "SELECT notification_id FROM notifications WHERE booking_id = ? AND channel = 'sarvam_voice' LIMIT 1",
      [booking.booking_id]
    );

    if (existingCallRecord) {
      recentCallDebounce.add(debounceKey);
      return { triggered: false, reason: 'already_called_db', booking_id: booking.booking_id };
    }

    // 4. Safely extract recipient phone number
    const rawPhone = booking.channel === 'offline' ? booking.walkin_phone : booking.user_phone;
    const formattedPhone = formatE164PhoneNumber(rawPhone);

    if (!formattedPhone) {
      console.warn(`⚠️ [Sarvam Voice Call] Invalid or missing phone number for Booking #${booking.booking_id} (Token #${booking.queue_number}). Skipping call.`);
      return { triggered: false, reason: 'invalid_phone', booking_id: booking.booking_id };
    }

    // 5. Determine farmer name
    const farmerName = (
      (booking.channel === 'offline' ? booking.walkin_name : booking.user_name) ||
      booking.walkin_name ||
      booking.user_name ||
      'Farmer'
    ).trim();

    // 6. Build payload with dynamic variables
    const { payload, agentVariables } = buildSarvamPayload({
      formattedPhone,
      farmerName,
      booking,
      centreName: booking.centre_name || centreName
    });

    const apiKey = process.env.SARVAM_API_KEY;
    const orgId = process.env.SARVAM_ORG_ID;
    const workspaceId = process.env.SARVAM_WORKSPACE_ID;
    const agentId = process.env.SARVAM_AGENT_ID;

    // 7. Fallback when credentials are not yet configured in .env
    if (!apiKey || !agentId) {
      console.log('\n' + '═'.repeat(72));
      console.log(' 🎙️ [SARVAM AI VOICE CALL - CONSOLE SIMULATION FALLBACK]');
      console.log(` ℹ️ SARVAM_API_KEY or SARVAM_AGENT_ID not configured in .env.`);
      console.log(` 📞 Target Recipient: ${maskPhone(formattedPhone)} (Token #${booking.queue_number})`);
      console.log(` 👤 Farmer Name:      ${farmerName}`);
      console.log(` 🌾 Crop:             ${agentVariables.crop_name}`);
      console.log(` 🏛️ Mandi:            ${agentVariables.mandi_name}`);
      console.log(` 📅 Slot Date & Time: ${agentVariables.token_valid_date} at ${agentVariables.token_slot_time}`);
      console.log(` 🏢 Reporting Counter:${agentVariables.reporting_counter}`);
      console.log(` ☎️ Helpline:         ${agentVariables.helpline_number}`);
      console.log(` 💡 Trigger condition met: queue_number (${booking.queue_number}) - now_serving (${nowServingNumber}) === 2`);
      console.log('═'.repeat(72) + '\n');

      // Mark in-memory debounce set to avoid redundant duplicate calls
      recentCallDebounce.add(debounceKey);
      recentCallDebounce.add(`booking_${booking.booking_id}`);

      // If farmer_id is present (or matches a registered user), record to notifications table
      let resolvedFarmerId = booking.farmer_id;
      if (!resolvedFarmerId && rawPhone) {
        try {
          const userMatch = await db.get('SELECT user_id FROM users WHERE phone_number = ?', [String(rawPhone).trim()]);
          if (userMatch) resolvedFarmerId = userMatch.user_id;
        } catch (mErr) {}
      }

      if (resolvedFarmerId) {
        try {
          await db.query(
            "INSERT INTO notifications (farmer_id, booking_id, message, channel, is_read, sent_at) VALUES (?, ?, ?, 'sarvam_voice', 0, CURRENT_TIMESTAMP)",
            [
              resolvedFarmerId,
              booking.booking_id,
              `[Simulated] Sarvam AI Voice Call queued for Token #${booking.queue_number} (${farmerName})`
            ]
          );
        } catch (dbErr) {
          // Safe catch: DB logging failure never interrupts application
        }
      }

      return { triggered: true, simulated: true, booking_id: booking.booking_id };
    }

    // 8. Resolve Endpoint URL
    const endpointUrl = process.env.SARVAM_API_ENDPOINT ||
      (orgId && workspaceId
        ? `https://apps.sarvam.ai/api/outbounds/v1/orgs/${orgId}/workspaces/${workspaceId}/outbounds`
        : 'https://apps.sarvam.ai/api/outbounds/v1/outbounds');

    // 9. Dispatch Outbound Call Request
    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
          'api-subscription-key': apiKey,
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000) // 10 second timeout guard
      });

      if (response.ok) {
        const resData = await response.json().catch(() => ({}));
        console.log(`✅ [Sarvam AI Voice Call] Successfully initiated call to ${maskPhone(formattedPhone)} for Token #${booking.queue_number}`);

        recentCallDebounce.add(debounceKey);
        recentCallDebounce.add(`booking_${booking.booking_id}`);

        // Record successful call in existing notifications table if valid farmer_id
        let resolvedFarmerId = booking.farmer_id;
        if (!resolvedFarmerId && rawPhone) {
          try {
            const userMatch = await db.get('SELECT user_id FROM users WHERE phone_number = ?', [String(rawPhone).trim()]);
            if (userMatch) resolvedFarmerId = userMatch.user_id;
          } catch (mErr) {}
        }

        if (resolvedFarmerId) {
          try {
            await db.query(
              "INSERT INTO notifications (farmer_id, booking_id, message, channel, is_read, sent_at) VALUES (?, ?, ?, 'sarvam_voice', 0, CURRENT_TIMESTAMP)",
              [
                resolvedFarmerId,
                booking.booking_id,
                `Sarvam AI Voice Call placed for Token #${booking.queue_number} (Call ID: ${resData.id || resData.call_id || 'initiated'})`
              ]
            );
          } catch (dbErr) {
            // Safe catch
          }
        }

        return { triggered: true, success: true, booking_id: booking.booking_id, call_id: resData.id || resData.call_id };
      } else {
        const errorText = await response.text().catch(() => 'No error response body');
        console.warn(`⚠️ [Sarvam AI Voice Call] API returned status ${response.status}: ${errorText}`);
        return { triggered: false, reason: `api_error_${response.status}`, booking_id: booking.booking_id };
      }
    } catch (netErr) {
      console.warn(`⚠️ [Sarvam AI Voice Call] Network/Request error: ${netErr.message}`);
      return { triggered: false, reason: 'network_error', booking_id: booking.booking_id };
    }
  } catch (err) {
    console.warn(`⚠️ [Sarvam AI Voice Call] Unexpected error: ${err.message}`);
    return { triggered: false, reason: 'unexpected_error' };
  }
}

/**
 * Triggers an immediate outbound Sarvam voice call for a specific booking.
 * Invoked by Mandi Desk staff clicking "Call Now".
 *
 * @param {Object} params
 * @param {number|string} params.bookingId
 * @returns {Promise<{ success: boolean, attempt_id?: string, status?: number, error?: any }>}
 */
async function triggerDirectSarvamCall({ bookingId }) {
  try {
    const booking = await db.get(
      `SELECT b.*, u.phone_number AS user_phone, u.full_name AS user_name, c.centre_name
       FROM bookings b
       LEFT JOIN users u ON b.farmer_id = u.user_id
       JOIN procurement_centres c ON b.centre_id = c.centre_id
       WHERE b.booking_id = ?`,
      [bookingId]
    );

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    // Farmer data resolution rule:
    // Registered farmer -> users.phone_number, users.full_name
    // Walk-in farmer -> bookings.walkin_phone, bookings.walkin_name
    const rawPhone = booking.channel === 'offline' ? booking.walkin_phone : booking.user_phone;
    const formattedPhone = formatE164PhoneNumber(rawPhone);

    if (!formattedPhone) {
      console.warn(`⚠️ [Sarvam Direct Call] Invalid or missing phone number for Booking #${booking.booking_id}.`);
      return { success: false, error: 'Invalid or missing phone number' };
    }

    const farmerName = (
      (booking.channel === 'offline' ? booking.walkin_name : booking.user_name) ||
      booking.walkin_name ||
      booking.user_name ||
      'Farmer'
    ).trim();

    const { payload, agentVariables } = buildSarvamPayload({
      formattedPhone,
      farmerName,
      booking,
      centreName: booking.centre_name
    });

    const apiKey = process.env.SARVAM_API_KEY;
    const orgId = process.env.SARVAM_ORG_ID;
    const workspaceId = process.env.SARVAM_WORKSPACE_ID;
    const agentId = process.env.SARVAM_AGENT_ID;

    // Resolve Endpoint URL
    const endpointUrl = process.env.SARVAM_API_ENDPOINT ||
      (orgId && workspaceId
        ? `https://apps.sarvam.ai/api/outbounds/v1/orgs/${orgId}/workspaces/${workspaceId}/outbounds`
        : 'https://apps.sarvam.ai/api/outbounds/v1/outbounds');

    if (!apiKey || !agentId) {
      console.warn(`⚠️ [Sarvam Direct Call] SARVAM_API_KEY or SARVAM_AGENT_ID not configured.`);
      return { success: false, error: 'Sarvam credentials not configured in environment' };
    }

    // Dispatch outbound request to Sarvam with X-API-Key
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000)
    });

    let resData = null;
    try {
      resData = await response.json();
    } catch (parseErr) {
      resData = await response.text().catch(() => null);
    }

    const attemptId = (resData && (resData.attempt_id || resData.id || resData.call_id)) || null;

    if (response.ok && attemptId) {
      console.log(`✅ [Sarvam Direct Call] Call successfully dispatched for Booking #${booking.booking_id} (Attempt ID: ${attemptId})`);

      // Optional: record in notifications table if registered farmer
      if (booking.farmer_id) {
        try {
          await db.query(
            "INSERT INTO notifications (farmer_id, booking_id, message, channel, is_read, sent_at) VALUES (?, ?, ?, 'sarvam_voice', 0, CURRENT_TIMESTAMP)",
            [
              booking.farmer_id,
              booking.booking_id,
              `Sarvam AI Voice Call placed for Token #${booking.queue_number} (Attempt ID: ${attemptId})`
            ]
          );
        } catch (dbErr) {
          // Safe catch
        }
      }

      return { success: true, attempt_id: attemptId };
    } else {
      console.warn(`⚠️ [Sarvam Direct Call] API responded with status ${response.status}:`, resData);
      return { success: false, status: response.status, error: resData };
    }
  } catch (err) {
    console.warn(`⚠️ [Sarvam Direct Call] Request error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

module.exports = {
  triggerSarvamQueueCall,
  triggerDirectSarvamCall,
  formatE164PhoneNumber,
  buildSarvamPayload
};
