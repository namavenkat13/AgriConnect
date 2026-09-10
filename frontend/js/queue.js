// frontend/js/queue.js
// Handles Farmer Live Queue Tracker, WebSocket synchronization, and In-App Notifications

let activeSocket = null;
let currentActiveBooking = null;

/**
 * Initialize Farmer Queue & Notification System
 */
async function initFarmerQueueAndNotifications() {
  const token = AgriAuth.getAuthToken();
  const user = AgriAuth.getStoredUser();
  if (!token || !user) return;

  // Initialize Socket.IO connection
  if (typeof io !== 'undefined') {
    activeSocket = io();

    activeSocket.on('connect', () => {
      // Join targeted user room for personal alerts
      activeSocket.emit('join_user', user.user_id);
    });

    // Handle targeted notifications (SMS / status alerts)
    activeSocket.on('notification', (notifData) => {
      AgriAuth.showToast(notifData.message, 'alert');
      // Increment unread count & refresh drawer
      loadNotifications();
      // Also refresh bookings table in case procurement/payment status changed
      if (window.AgriBooking && typeof window.AgriBooking.loadMyBookingsTable === 'function') {
        window.AgriBooking.loadMyBookingsTable();
      }
    });

    // Handle real-time queue advancements
    activeSocket.on('queue_update', (data) => {
      if (currentActiveBooking && Number(data.centre_id) === Number(currentActiveBooking.centre_id)) {
        updateQueueDisplay(data.now_serving_number);
      }
    });
  }

  // Load active booking and notifications
  await checkActiveTodayQueue();
  await loadNotifications();
  setupNotificationDrawer();
}

/**
 * Check if the farmer has an active booking scheduled for today
 */
async function checkActiveTodayQueue() {
  const token = AgriAuth.getAuthToken();
  const todayStr = (window.AgriTime && window.AgriTime.getISTDateString()) || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const widgetContainer = document.getElementById('queue-widget-container');
  if (!widgetContainer) return;

  try {
    const res = await fetch('/api/bookings/my', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.success || !Array.isArray(data.bookings)) return;

    // Look for active booking today
    currentActiveBooking = data.bookings.find(b => 
      b.slot_date === todayStr && 
      (b.booking_status === 'booked' || b.booking_status === 'in_queue')
    );

    if (!currentActiveBooking) {
      // Check if there is an upcoming booking tomorrow or future
      const nextBooking = data.bookings.find(b => b.booking_status === 'booked' && b.slot_date >= todayStr);

      if (nextBooking) {
        widgetContainer.innerHTML = `
          <div class="card" style="border-left: 4px solid var(--primary-green); margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div>
                <h3 style="color: var(--primary-dark); margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem;">
                  <span class="title-icon">📅</span> <span>Upcoming Booking Confirmed</span>
                </h3>
                <p style="color: var(--text-muted); font-size: 0.95rem;">
                  <strong>${nextBooking.centre_name}</strong> on <strong>${(window.AgriTime && window.AgriTime.formatDisplayDate(nextBooking.slot_date)) || nextBooking.slot_date}</strong> at <strong>${nextBooking.slot_time.substring(0, 5)}</strong> for <strong>${nextBooking.crop_name}</strong>.
                </p>
              </div>
              <div style="text-align: right;">
                <span class="badge badge-booked" style="font-size: 0.9rem; padding: 0.4rem 0.8rem;">Queue Token #${nextBooking.queue_number}</span>
                <p style="font-size: 0.75rem; color: var(--text-light); margin-top: 0.3rem;">Live tracker activates on day of visit</p>
              </div>
            </div>
          </div>
        `;
      } else {
        widgetContainer.innerHTML = `
          <div class="card" style="background: var(--bg-card-alt); border: 1px dashed var(--border-color); text-align: center; padding: 2rem; margin-bottom: 2rem;">
            <div style="margin-bottom: 0.5rem;"><span class="crop-icon" style="font-size: 2.2rem;">🌾</span></div>
            <h3 style="color: var(--primary-dark); margin-bottom: 0.3rem;">No Active Queue Today</h3>
            <p style="color: var(--text-muted); font-size: 0.95rem; max-width: 500px; margin: 0 auto;">
              Select a procurement centre and book a slot below to receive your real-time queue position token.
            </p>
          </div>
        `;
      }
      return;
    }

    // Connect to the centre's WebSocket room
    if (activeSocket) {
      activeSocket.emit('join_centre', currentActiveBooking.centre_id);
    }

    // Fetch centre's today queue status
    const queueRes = await fetch(`/api/queue/${currentActiveBooking.centre_id}/today`);
    const queueData = await queueRes.json();
    const nowServing = queueData.success ? Number(queueData.now_serving_number) : 0;

    renderActiveQueueWidget(nowServing);
  } catch (err) {
    console.error('Error checking active queue:', err);
  }
}

/**
 * Render the prominent active live queue widget
 */
function renderActiveQueueWidget(nowServing) {
  const widgetContainer = document.getElementById('queue-widget-container');
  if (!widgetContainer || !currentActiveBooking) return;

  const myQueue = Number(currentActiveBooking.queue_number);
  const positionDiff = myQueue - nowServing;
  const isBeingServed = nowServing >= myQueue;
  const estWaitMins = Math.max(0, positionDiff * 10);

  // Calculate progress percentage
  let progressPct = 5;
  if (myQueue > 0) {
    progressPct = Math.min(100, Math.max(5, Math.round((nowServing / myQueue) * 100)));
  }

  widgetContainer.innerHTML = `
    <div class="queue-widget-active">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <div>
          <span style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.85;">
            📍 ${currentActiveBooking.centre_name}
          </span>
          <h2 style="font-size: 1.5rem; font-weight: 800;">
            ${isBeingServed ? '🎉 IT IS YOUR TURN!' : 'Live Procurement Queue Tracker'}
          </h2>
        </div>
        <div style="background: rgba(0,0,0,0.25); padding: 0.35rem 0.8rem; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 600;">
          <span class="pulse-indicator"></span> LIVE
        </div>
      </div>

      <div class="queue-hero-grid">
        <div class="queue-stat-box">
          <div class="queue-stat-label">Your Token</div>
          <div class="queue-stat-val" style="color: #FFD54F;">#${myQueue}</div>
        </div>
        <div class="queue-stat-box">
          <div class="queue-stat-label">Now Serving</div>
          <div class="queue-stat-val" id="now-serving-val">#${nowServing}</div>
        </div>
        <div class="queue-stat-box">
          <div class="queue-stat-label">Position in Line</div>
          <div class="queue-stat-val" id="position-in-line-val">
            ${isBeingServed ? 'Now!' : `${positionDiff}`}
          </div>
        </div>
        <div class="queue-stat-box">
          <div class="queue-stat-label">Estimated Wait</div>
          <div class="queue-stat-val" id="est-wait-val" style="font-size: 1.5rem;">
            ${isBeingServed ? '0 mins' : `~${estWaitMins}m`}
          </div>
        </div>
      </div>

      <div class="queue-progress-wrapper">
        <div class="queue-progress-bar" id="queue-progress-bar" style="width: ${progressPct}%;"></div>
      </div>

      <div class="queue-status-text">
        <span id="queue-status-instruction">
          ${isBeingServed 
            ? '👉 <strong>Please proceed to the procurement desk immediately with your crop harvest!</strong>'
            : (positionDiff <= 2 
                ? '⚡ <strong>You are next! Please arrive near the counter right now.</strong>' 
                : `Crop: <strong>${currentActiveBooking.crop_name}</strong> (${currentActiveBooking.estimated_quantity_kg} kg est)`
              )
          }
        </span>
        <span style="font-size: 0.8rem; opacity: 0.85;">Auto-updates in real-time</span>
      </div>
    </div>
  `;
}

/**
 * Smoothly update the active queue widget when WebSocket sends new serving number
 */
function updateQueueDisplay(nowServing) {
  const servingValEl = document.getElementById('now-serving-val');
  const posValEl = document.getElementById('position-in-line-val');
  const waitValEl = document.getElementById('est-wait-val');
  const progressBar = document.getElementById('queue-progress-bar');
  const instructionEl = document.getElementById('queue-status-instruction');

  if (!servingValEl || !currentActiveBooking) return;

  const myQueue = Number(currentActiveBooking.queue_number);
  const positionDiff = myQueue - nowServing;
  const isBeingServed = nowServing >= myQueue;
  const estWaitMins = Math.max(0, positionDiff * 10);

  servingValEl.textContent = `#${nowServing}`;
  if (posValEl) posValEl.textContent = isBeingServed ? 'Now!' : `${positionDiff}`;
  if (waitValEl) waitValEl.textContent = isBeingServed ? '0 mins' : `~${estWaitMins}m`;

  if (progressBar) {
    const progressPct = Math.min(100, Math.max(5, Math.round((nowServing / myQueue) * 100)));
    progressBar.style.width = `${progressPct}%`;
  }

  if (instructionEl) {
    if (isBeingServed) {
      instructionEl.innerHTML = '👉 <strong>Please proceed to the procurement desk immediately with your harvest!</strong>';
    } else if (positionDiff <= 2) {
      instructionEl.innerHTML = '⚡ <strong>You are next! Please arrive near the counter right now.</strong>';
    }
  }
}

/**
 * Load Notifications History and update badge count
 */
async function loadNotifications() {
  const token = AgriAuth.getAuthToken();
  const badgeEl = document.getElementById('notif-badge');
  const listEl = document.getElementById('notif-list');
  if (!badgeEl || !token) return;

  try {
    const res = await fetch('/api/notifications/my', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.success) return;

    // Update badge count
    const count = data.unread_count || 0;
    badgeEl.textContent = count;
    badgeEl.style.display = count > 0 ? 'flex' : 'none';

    // Render list in drawer
    if (listEl) {
      if (!data.notifications || data.notifications.length === 0) {
        listEl.innerHTML = '<li style="padding: 1.5rem; text-align: center; color: var(--text-muted);">No notifications yet.</li>';
        return;
      }

      listEl.innerHTML = data.notifications.map(n => `
        <li class="notification-item ${n.is_read ? '' : 'unread'}" data-id="${n.notification_id}">
          <div>${n.message}</div>
          <span class="notif-time">${new Date(n.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${new Date(n.sent_at).toLocaleDateString()}</span>
        </li>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load notifications:', err);
  }
}

/**
 * Setup notification drawer toggle and mark all read button
 */
function setupNotificationDrawer() {
  const notifBtn = document.getElementById('notif-btn');
  const drawer = document.getElementById('notif-drawer');
  const markReadBtn = document.getElementById('mark-all-read-btn');

  if (!notifBtn || !drawer) return;

  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    drawer.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!drawer.contains(e.target) && !notifBtn.contains(e.target)) {
      drawer.classList.remove('open');
    }
  });

  if (markReadBtn) {
    markReadBtn.addEventListener('click', async () => {
      const token = AgriAuth.getAuthToken();
      try {
        await fetch('/api/notifications/read-all', {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        loadNotifications();
      } catch (err) {
        console.error('Error marking all as read:', err);
      }
    });
  }
}

window.AgriQueue = {
  initFarmerQueueAndNotifications,
  checkActiveTodayQueue,
  loadNotifications
};
