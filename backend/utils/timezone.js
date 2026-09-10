// backend/utils/timezone.js
// Centralized timezone utilities for India Standard Time (Asia/Kolkata, UTC+05:30)

const TIMEZONE = 'Asia/Kolkata';

/**
 * Returns current IST date, time, and full components
 * @param {Date} [dateObj=new Date()]
 * @returns {{ dateStr: string, timeStr: string, fullTimeStr: string, now: Date }}
 */
function getISTDateTime(dateObj = new Date()) {
  // 'en-CA' outputs format YYYY-MM-DD
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateObj);

  // 'en-GB' with hour12: false outputs format HH:MM:SS
  const fullTimeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(dateObj);

  const timeStr = fullTimeStr.substring(0, 5); // HH:MM

  return { dateStr, timeStr, fullTimeStr, now: dateObj };
}

/**
 * Get today's IST date string in YYYY-MM-DD
 * @param {Date} [dateObj=new Date()]
 * @returns {string}
 */
function getISTDateString(dateObj = new Date()) {
  return getISTDateTime(dateObj).dateStr;
}

/**
 * Get current IST time string in HH:MM
 * @param {Date} [dateObj=new Date()]
 * @returns {string}
 */
function getISTTimeString(dateObj = new Date()) {
  return getISTDateTime(dateObj).timeStr;
}

/**
 * Checks whether a given slot date and time is in the past relative to IST now.
 * Complete date + time evaluation:
 * - If slotDate < currentISTDate -> true (past date)
 * - If slotDate === currentISTDate && slotTime <= currentISTTime -> true (past or current minute)
 * - Otherwise -> false (future)
 *
 * @param {string} slotDate - "YYYY-MM-DD"
 * @param {string} slotTime - "HH:MM" or "HH:MM:SS"
 * @param {Date} [referenceDate=new Date()]
 * @returns {boolean}
 */
function isSlotInPast(slotDate, slotTime, referenceDate = new Date()) {
  if (!slotDate || !slotTime) return true;
  const { dateStr: currentISTDate, timeStr: currentISTTime } = getISTDateTime(referenceDate);
  const cleanSlotTime = slotTime.substring(0, 5);

  if (slotDate < currentISTDate) {
    return true;
  }
  if (slotDate === currentISTDate && cleanSlotTime <= currentISTTime) {
    return true;
  }
  return false;
}

module.exports = {
  TIMEZONE,
  getISTDateTime,
  getISTDateString,
  getISTTimeString,
  isSlotInPast
};
