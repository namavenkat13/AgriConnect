// frontend/js/ist-clock.js
// Global IST Time and Live Header Clock Manager for AgriConnect
// Strictly enforces Asia/Kolkata (UTC+05:30) timezone

(function () {
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

  function getISTDateString(dateObj = new Date()) {
    return getISTDateTime(dateObj).dateStr;
  }

  function getISTTimeString(dateObj = new Date()) {
    return getISTDateTime(dateObj).timeStr;
  }

  /**
   * Checks whether a slot is completed/past relative to IST now.
   * - Any date before today in IST -> true
   * - Today in IST with start_time <= current IST time -> true
   * - Future -> false
   */
  function isSlotInPast(slotDate, slotTime) {
    if (!slotDate || !slotTime) return true;
    const { dateStr: currentISTDate, timeStr: currentISTTime } = getISTDateTime();
    const cleanSlotTime = slotTime.substring(0, 5);

    if (slotDate < currentISTDate) {
      return true;
    }
    if (slotDate === currentISTDate && cleanSlotTime <= currentISTTime) {
      return true;
    }
    return false;
  }

  /**
   * Safe date formatter for YYYY-MM-DD strings.
   * Avoids new Date('YYYY-MM-DD') timezone shift by parsing parts directly.
   * @param {string} dateStr - "YYYY-MM-DD"
   * @returns {string} e.g. "10 Sep 2026"
   */
  function formatDisplayDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${String(day).padStart(2, '0')} ${months[monthIdx]} ${year}`;
      }
    }
    return dateStr;
  }

  /**
   * Update all live IST clocks in DOM
   */
  function updateLiveClocks() {
    const clockContainers = document.querySelectorAll('.header-live-clock');
    if (!clockContainers || clockContainers.length === 0) return;

    const now = new Date();

    // Format IST time: "HH:MM:SS"
    const timeFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Format IST date: "Thu, 10 Sep 2026"
    const dateFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: TIMEZONE,
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const timeStr = timeFormatter.format(now);
    const dateStr = dateFormatter.format(now);

    clockContainers.forEach(container => {
      const timeEl = container.querySelector('.live-clock-time');
      const dateEl = container.querySelector('.live-clock-date');
      if (timeEl && timeEl.textContent !== timeStr) {
        timeEl.textContent = timeStr;
      }
      if (dateEl && dateEl.textContent !== dateStr) {
        dateEl.textContent = dateStr;
      }
    });
  }

  // Run update immediately
  updateLiveClocks();

  // Run every 1000ms for continuous real-time ticking
  setInterval(updateLiveClocks, 1000);

  // Hook into DOM ready to catch any late-rendered clock containers
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateLiveClocks);
  } else {
    updateLiveClocks();
  }

  window.AgriTime = {
    TIMEZONE,
    getISTDateTime,
    getISTDateString,
    getISTTimeString,
    isSlotInPast,
    formatDisplayDate,
    updateLiveClocks
  };
})();
