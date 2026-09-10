// frontend/js/mandi.js
// Mandi Operations Desk Client Logic

let currentCentre = null;
let currentStaff = null;
let loadedSlots = [];
let selectedSlot = null;
let activeWorkflowBooking = null;

// High-Contrast Line Icon System (currentColor, stroke-width: 2, fill: none)
const MandiIcons = {
  shield: `<svg class="op-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
  building: `<svg class="op-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"></path><path d="M5 21V7l7-4 7 4v14"></path><path d="M9 10h1"></path><path d="M9 14h1"></path><path d="M14 10h1"></path><path d="M14 14h1"></path><path d="M9 21v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"></path></svg>`,
  users: `<svg class="op-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  userPlus: `<svg class="op-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>`,
  userWalk: `<svg class="op-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="5" r="2"></circle><path d="m9 20 3-6 3 2 2 4"></path><path d="m6 16 3-3 2 2 3-5-2-4"></path></svg>`,
  scale: `<svg class="op-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="M7 21h10"></path><path d="M12 3v18"></path><path d="M3 7h18"></path></svg>`,
  globe: `<svg class="op-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
  sliders: `<svg class="op-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>`,
  fileText: `<svg class="op-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
  checkCircle: `<svg class="op-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
  close: `<svg class="op-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  refresh: `<svg class="op-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
  phone: `<svg class="op-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`
};
window.MandiIcons = MandiIcons;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Authentication & Role Check
  if (!AgriAuth.guardRoute()) return;

  currentStaff = AgriAuth.getStoredUser();
  if (!currentStaff) {
    window.location.href = '/index.html';
    return;
  }

  const allowedRoles = ['mandi_admin', 'mandi_member', 'staff', 'admin'];
  if (!allowedRoles.includes(currentStaff.role)) {
    alert('Access restricted to Mandi staff and administrators.');
    window.location.href = '/dashboard.html';
    return;
  }

  // Setup Date input (default to today in IST)
  const todayStr = (window.AgriTime && window.AgriTime.getISTDateString()) || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const dateInput = document.getElementById('slot-grid-date');
  if (dateInput) {
    dateInput.value = todayStr;
    dateInput.addEventListener('change', () => loadMandiSlots());
  }

  // Render Staff and Centre info in Top Bar
  setupHeader();

  // If mandi_admin, show admin toolbar and load staff directory
  if (currentStaff.role === 'mandi_admin') {
    const adminToolbar = document.getElementById('admin-toolbar');
    if (adminToolbar) adminToolbar.style.display = 'block';
    loadStaffDirectory();
  }

  // Load initial slots
  await loadMandiSlots();

  // Wire modal form submissions
  setupFormHandlers();
});

/**
 * Top bar header setup
 */
function setupHeader() {
  const staffNameEl = document.getElementById('staff-name-display');
  if (staffNameEl) staffNameEl.textContent = currentStaff.full_name || 'Mandi Staff';

  const centreNameEl = document.getElementById('header-centre-name');
  if (centreNameEl) centreNameEl.textContent = currentStaff.centre_name || 'Assigned APMC Centre';

  const roleContainer = document.getElementById('role-badge-container');
  if (roleContainer) {
    if (currentStaff.role === 'mandi_admin') {
      roleContainer.innerHTML = `<span class="badge-role badge-role-admin">${MandiIcons.shield} <span>Mandi Admin</span></span>`;
    } else {
      roleContainer.innerHTML = `<span class="badge-role badge-role-member">${MandiIcons.building} <span>Mandi Member</span></span>`;
    }
  }
}

/**
 * Load today's live slot grid
 */
async function loadMandiSlots() {
  const dateInput = document.getElementById('slot-grid-date');
  const dateStr = (dateInput && dateInput.value) || (window.AgriTime && window.AgriTime.getISTDateString()) || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const centreId = currentStaff.centre_id || 1;

  const gridEl = document.getElementById('mandi-slot-grid');
  gridEl.innerHTML = '<div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--text-muted);">Fetching live slot grid...</div>';

  try {
    const token = AgriAuth.getAuthToken();
    const res = await fetch(`/api/mandi/${centreId}/slots-today?date=${dateStr}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();
    if (!data.success) {
      gridEl.innerHTML = `<div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--danger);">Failed to load slots: ${data.message}</div>`;
      return;
    }

    currentCentre = data.centre;
    if (currentCentre && currentCentre.centre_name) {
      document.getElementById('header-centre-name').textContent = currentCentre.centre_name;
    }

    loadedSlots = data.slots || [];
    renderSlotGrid(loadedSlots);

    // If a slot was previously selected, re-select it with fresh data
    if (selectedSlot) {
      const refreshed = loadedSlots.find(s => s.slot_id === selectedSlot.slot_id || s.start_time === selectedSlot.start_time);
      if (refreshed) {
        selectSlot(refreshed);
      } else if (loadedSlots.length > 0) {
        selectSlot(loadedSlots[0]);
      }
    } else if (loadedSlots.length > 0) {
      selectSlot(loadedSlots[0]);
    }
  } catch (err) {
    console.error('Error loading mandi slots:', err);
    gridEl.innerHTML = '<div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--danger);">Network error loading live slots.</div>';
  }
}

/**
 * Render slot grid tiles
 */
function renderSlotGrid(slots) {
  const gridEl = document.getElementById('mandi-slot-grid');
  gridEl.innerHTML = '';

  if (slots.length === 0) {
    gridEl.innerHTML = '<div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--text-muted);">No slots scheduled for this date.</div>';
    return;
  }

  slots.forEach((slot) => {
    const card = document.createElement('div');
    const isSelected = selectedSlot && (selectedSlot.slot_id === slot.slot_id || selectedSlot.start_time === slot.start_time);

    let statusClass = 'slot-empty';
    let pillText = 'Open';
    let pillClass = 'pill-open';

    if (slot.is_closed) {
      statusClass = 'slot-closed';
      pillText = 'Closed';
      pillClass = 'pill-closed';
    } else if (slot.occupied_count >= slot.max_bookings) {
      statusClass = 'slot-full';
      pillText = 'Full';
      pillClass = 'pill-full';
    } else if (slot.offline_count > 0 || slot.occupied_count > 0) {
      statusClass = 'slot-partial';
      pillText = 'Partial';
      pillClass = 'pill-partial';
    }

    card.className = `slot-card timeline-cell ${statusClass} ${isSelected ? 'active' : ''}`;
    card.onclick = () => selectSlot(slot);

    // Format walk-in dots: ●●, ●○, ○○, or ✕ if closed
    let walkinDotsHtml = '';
    let walkinLabel = '';
    if (slot.is_closed) {
      walkinDotsHtml = '<span class="walkin-dot-symbol" title="Closed (Past Cutoff)">✕</span>';
      walkinLabel = 'Closed';
    } else {
      const dot1 = slot.offline_count >= 1 ? 'filled' : 'empty';
      const dot2 = slot.offline_count >= 2 ? 'filled' : 'empty';
      walkinDotsHtml = `
        <span class="timeline-dots" title="Walk-ins: ${slot.offline_count}/2">
          <span class="walkin-dot ${dot1}"></span>
          <span class="walkin-dot ${dot2}"></span>
        </span>
      `;
      walkinLabel = slot.offline_count >= 2 ? 'Maxed (2/2)' : `${slot.offline_count}/2 walk-ins`;
    }

    const timeDisplay = slot.start_time ? slot.start_time.substring(0, 5) : slot.time_range;

    card.innerHTML = `
      <div>
        <div class="timeline-cell-top">
          <span class="timeline-time">${timeDisplay}</span>
          <div style="display: flex; align-items: center; gap: 0.35rem;">
            ${walkinDotsHtml}
            <span class="slot-status-pill ${pillClass}">${pillText}</span>
          </div>
        </div>
        <div class="timeline-range">${slot.time_range}</div>
      </div>
      <div class="timeline-metrics">
        <span class="timeline-count">${slot.occupied_count} / ${slot.max_bookings} <span style="font-weight: 400; color: var(--text-muted); font-size: 0.72rem;">booked</span></span>
        <span class="timeline-walkin-label ${slot.offline_count >= 2 ? 'walkin-maxed' : ''}">${walkinLabel}</span>
      </div>
    `;

    gridEl.appendChild(card);
  });
}

/**
 * Select a slot and display its bookings list
 */
function selectSlot(slot) {
  selectedSlot = slot;

  // Update card active classes
  document.querySelectorAll('.slot-card').forEach((el, idx) => {
    const s = loadedSlots[idx];
    if (s && (s.slot_id === slot.slot_id || s.start_time === slot.start_time)) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  const container = document.getElementById('slot-bookings-container');
  container.style.display = 'block';

  document.getElementById('selected-slot-title').textContent = `Slot: ${slot.time_range} (${slot.occupied_count} Farmers Booked)`;
  document.getElementById('selected-slot-subtitle').textContent = `Max Capacity: ${slot.max_bookings} | Walk-ins: ${slot.offline_count}/2 | Online: ${slot.online_count || 0}`;

  // Admin action: Edit Slot
  const adminActions = document.getElementById('slot-admin-actions');
  if (currentStaff.role === 'mandi_admin') {
    adminActions.innerHTML = `
      <button class="btn btn-secondary btn-sm" onclick="openEditSlotModal(${slot.slot_id})" style="display: inline-flex; align-items: center; gap: 0.4rem;">
        ${MandiIcons.sliders} <span>Edit Slot (${slot.time_range})</span>
      </button>
    `;
  } else {
    adminActions.innerHTML = '';
  }

  // Render Bookings Table
  const tbody = document.getElementById('slot-bookings-tbody');
  tbody.innerHTML = '';

  const bookings = slot.bookings || [];
  if (bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          No farmer bookings in this slot yet. Mandi staff can register walk-ins above.
        </td>
      </tr>
    `;
    return;
  }

  bookings.forEach((b) => {
    const tr = document.createElement('tr');

    const isOffline = b.channel === 'offline';
    const channelBadge = isOffline
      ? `<span class="badge-channel badge-channel-offline">${MandiIcons.userWalk} <span>Walk-in</span></span>`
      : `<span class="badge-channel badge-channel-online">${MandiIcons.globe} <span>Online</span></span>`;

    let approvalBadge = '<span class="badge badge-status-complete">Approved</span>';
    if (b.approval_status === 'pending') {
      approvalBadge = '<span class="badge badge-status-pending">Pending</span>';
    } else if (b.approval_status === 'rejected') {
      approvalBadge = '<span class="badge badge-cancelled">Rejected</span>';
    }

    let procBadge = `<span class="badge badge-${b.procurement_status}">${b.procurement_status}</span>`;
    let payBadge = `<span class="badge badge-${b.payment_status}">${b.payment_status}</span>`;

    let actionsHtml = '';
    if (b.booking_status === 'completed' || b.procurement_status === 'accepted') {
      actionsHtml = `
        <button class="btn btn-secondary btn-sm" onclick="viewBookingReceipt(${b.booking_id})" style="display: inline-flex; align-items: center; gap: 0.35rem;">
          ${MandiIcons.fileText} <span>Receipt</span>
        </button>
      `;
    } else if (b.booking_status !== 'cancelled') {
      actionsHtml = `
        <button class="btn btn-primary btn-sm" onclick="openWorkflowModal(${b.booking_id})" style="display: inline-flex; align-items: center; gap: 0.35rem;">
          ${MandiIcons.scale} <span>Workflow</span>
        </button>
      `;

      // If pending online booking and user is admin, allow approve/reject
      if (!isOffline && b.approval_status === 'pending' && currentStaff.role === 'mandi_admin') {
        actionsHtml += `
          <button class="btn btn-secondary btn-sm" style="color: var(--danger); margin-left: 0.35rem;" onclick="handleApproveBooking(${b.booking_id}, 'rejected')">
            Reject
          </button>
        `;
      }
    } else {
      actionsHtml = '<span style="color: var(--icon-muted); font-size: 0.8rem;">Cancelled</span>';
    }

    // Call Now button: triggers immediate Sarvam outbound call for this farmer
    const callBtnHtml = `
      <button type="button" class="btn btn-secondary btn-sm" onclick="triggerCallNow(${b.booking_id}, this)" title="Call Now" style="display: inline-flex; align-items: center; gap: 0.35rem;">
        ${MandiIcons.phone} <span>Call Now</span>
      </button>
    `;

    tr.innerHTML = `
      <td><strong>#${b.queue_number || '1'}</strong></td>
      <td>
        <strong>${b.farmer_name}</strong>
        <div style="font-size: 0.8rem; color: var(--text-muted);">${b.farmer_phone} ${b.village ? `• ${b.village}` : ''}</div>
      </td>
      <td>
        ${b.crop_name}
        <div style="font-size: 0.8rem; color: var(--text-muted);">${b.estimated_quantity_kg} kg est.</div>
      </td>
      <td>${channelBadge}</td>
      <td>${approvalBadge}</td>
      <td>${procBadge}</td>
      <td>${payBadge}</td>
      <td>
        <div style="display: inline-flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
          ${actionsHtml}
          ${callBtnHtml}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Synchronize body.modal-open to prevent background scrolling
 */
function syncModalBodyLock() {
  const anyActive = document.querySelector('.modal-backdrop.active, .modal-overlay.active, .modal.active');
  if (anyActive) {
    document.body.classList.add('modal-open');
  } else {
    document.body.classList.remove('modal-open');
  }
}

/**
 * Open Walk-in Modal with 2-offline cap check
 */
function openWalkinModal() {
  const modal = document.getElementById('walkin-modal');
  const errorDiv = document.getElementById('walkin-error-msg');
  errorDiv.style.display = 'none';

  const select = document.getElementById('walkin-slot-select');
  select.innerHTML = '<option value="">Choose slot...</option>';

  loadedSlots.forEach(s => {
    const isFull = s.is_full;
    const isClosed = s.is_closed;
    const isOfflineCapped = s.offline_count >= 2;

    const opt = document.createElement('option');
    opt.value = s.slot_id;

    let label = `${s.time_range} — Booked: ${s.occupied_count}/${s.max_bookings} | Walk-ins: ${s.offline_count}/2`;
    if (isClosed) {
      label += ' (Slot Closed)';
      opt.disabled = true;
    } else if (isOfflineCapped) {
      label += ' (Walk-in Cap 2/2 Reached)';
      opt.disabled = true;
    } else if (isFull) {
      label += ' (Full)';
      opt.disabled = true;
    }

    opt.textContent = label;

    if (selectedSlot && selectedSlot.slot_id === s.slot_id && !isClosed && !isOfflineCapped) {
      opt.selected = true;
    }

    select.appendChild(opt);
  });

  modal.classList.add('active');
  syncModalBodyLock();
}

function closeWalkinModal() {
  const modal = document.getElementById('walkin-modal');
  if (modal) modal.classList.remove('active');
  const form = document.getElementById('walkin-form');
  if (form) form.reset();
  syncModalBodyLock();
}

/**
 * Open Per-Booking Workflow Modal
 */
function openWorkflowModal(bookingId) {
  let foundBooking = null;
  for (const s of loadedSlots) {
    const b = (s.bookings || []).find(item => item.booking_id === bookingId);
    if (b) {
      foundBooking = b;
      break;
    }
  }

  if (!foundBooking) {
    alert('Booking details not found.');
    return;
  }

  activeWorkflowBooking = foundBooking;

  // Section 1: Farmer & Booking
  document.getElementById('wf-farmer-name').textContent = foundBooking.farmer_name;
  document.getElementById('wf-farmer-phone').textContent = foundBooking.farmer_phone;
  document.getElementById('wf-crop-name').textContent = foundBooking.crop_name;
  document.getElementById('wf-est-qty').textContent = foundBooking.estimated_quantity_kg;
  document.getElementById('wf-slot-time').textContent = foundBooking.slot_time;

  const isOffline = foundBooking.channel === 'offline';
  document.getElementById('wf-channel-badge').innerHTML = isOffline
    ? `<span class="badge-channel badge-channel-offline">${MandiIcons.userWalk} <span>Walk-in (Offline)</span></span>`
    : `<span class="badge-channel badge-channel-online">${MandiIcons.globe} <span>Online Booking</span></span>`;

  // Section 2: Procurement
  const estQty = Number(foundBooking.estimated_quantity_kg) || 100;
  document.getElementById('wf-actual-qty').value = estQty;
  document.getElementById('wf-grade').value = 'Grade A';

  // Default agreed price (benchmark estimation in ₹/kg)
  let defaultPrice = 28.50;
  const cn = (foundBooking.crop_name || '').toLowerCase();
  if (cn.includes('tomato')) defaultPrice = 18.50;
  else if (cn.includes('onion')) defaultPrice = 22.00;
  else if (cn.includes('paddy') || cn.includes('rice')) defaultPrice = 38.50;
  else if (cn.includes('cotton')) defaultPrice = 71.20;
  else if (cn.includes('mustard')) defaultPrice = 54.50;
  else if (cn.includes('wheat')) defaultPrice = 24.50;
  else if (cn.includes('potato')) defaultPrice = 16.50;
  else if (cn.includes('soybean')) defaultPrice = 46.80;
  else if (cn.includes('maize') || cn.includes('corn')) defaultPrice = 21.50;
  else if (cn.includes('moong')) defaultPrice = 85.50;
  else if (cn.includes('sugarcane')) defaultPrice = 3.50;
  else if (cn.includes('chilli') || cn.includes('mirchi')) defaultPrice = 185.00;
  else if (cn.includes('chana') || cn.includes('gram') || cn.includes('chickpea')) defaultPrice = 56.00;
  else if (cn.includes('tur') || cn.includes('arhar')) defaultPrice = 74.00;
  else if (cn.includes('groundnut') || cn.includes('peanut')) defaultPrice = 64.50;
  else if (cn.includes('turmeric') || cn.includes('haldi')) defaultPrice = 138.00;
  else if (cn.includes('cumin') || cn.includes('jeera')) defaultPrice = 285.00;
  else if (cn.includes('banana')) defaultPrice = 21.00;
  else if (cn.includes('apple')) defaultPrice = 78.00;
  else if (cn.includes('mango')) defaultPrice = 65.00;
  else if (cn.includes('jute')) defaultPrice = 50.50;
  else if (cn.includes('tea')) defaultPrice = 42.00;
  else if (cn.includes('arecanut') || cn.includes('supari')) defaultPrice = 380.00;
  else if (cn.includes('coffee')) defaultPrice = 220.00;
  else if (cn.includes('garlic') || cn.includes('lahsun')) defaultPrice = 115.00;
  else if (cn.includes('ginger') || cn.includes('adrak')) defaultPrice = 82.00;
  else if (cn.includes('barley') || cn.includes('jau')) defaultPrice = 19.50;
  else if (cn.includes('jowar') || cn.includes('sorghum')) defaultPrice = 32.00;
  else if (cn.includes('bajra') || cn.includes('millet')) defaultPrice = 25.50;
  else if (cn.includes('litchi')) defaultPrice = 48.00;

  document.getElementById('wf-price').value = defaultPrice;

  // Section 3: Payment
  document.getElementById('wf-pay-mode').value = 'Cash';
  document.getElementById('wf-pay-status').value = 'Paid';
  document.getElementById('wf-txn-ref').value = '';
  handlePaymentModeChange();

  // Recalculate amounts
  recalculateWorkflowAmounts();

  // Reset errors
  const errDiv = document.getElementById('wf-error-msg');
  if (errDiv) {
    errDiv.style.display = 'none';
    errDiv.textContent = '';
  }

  const modal = document.getElementById('workflow-modal');
  if (modal) modal.classList.add('active');
  syncModalBodyLock();
}

function closeWorkflowModal() {
  const modal = document.getElementById('workflow-modal');
  if (modal) modal.classList.remove('active');
  activeWorkflowBooking = null;
  const errDiv = document.getElementById('wf-error-msg');
  if (errDiv) {
    errDiv.style.display = 'none';
    errDiv.textContent = '';
  }
  syncModalBodyLock();
}

/**
 * Triggers an immediate Sarvam outbound voice call for a farmer booking
 * Debounces and disables button to prevent duplicate calls,
 * and displays toast notification on success / failure.
 */
async function triggerCallNow(bookingId, btnEl) {
  if (!bookingId) return;
  if (btnEl && (btnEl.disabled || btnEl.getAttribute('data-busy') === 'true')) {
    return;
  }

  const originalContent = btnEl ? btnEl.innerHTML : null;
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.setAttribute('data-busy', 'true');
    btnEl.style.opacity = '0.65';
    btnEl.style.cursor = 'wait';
    btnEl.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 0.3rem;">${MandiIcons.phone} <span>Calling...</span></span>`;
  }

  try {
    const token = AgriAuth.getAuthToken();
    const centreId = (currentStaff && currentStaff.centre_id) ? currentStaff.centre_id : 1;

    const res = await fetch(`/api/mandi/${centreId}/call-farmer/${bookingId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success && data.attempt_id) {
      showCallToast('Call Executed Successfully', 'success');
    } else {
      showCallToast('Call Failed', 'alert');
    }
  } catch (err) {
    showCallToast('Call Failed', 'alert');
  } finally {
    // Cooldown debounce before re-enabling
    setTimeout(() => {
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.removeAttribute('data-busy');
        btnEl.style.opacity = '1';
        btnEl.style.cursor = 'pointer';
        if (originalContent) btnEl.innerHTML = originalContent;
      }
    }, 2500);
  }
}

/**
 * Displays a small temporary popup/toast that disappears automatically after a few seconds
 */
function showCallToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'alert' ? 'toast-alert' : 'toast-success'}`;
  toast.innerHTML = `
    <span style="font-size: 1.2rem;">${type === 'alert' ? '⚠️' : '✅'}</span>
    <span style="font-weight: 500;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function handlePaymentModeChange() {
  const mode = document.getElementById('wf-pay-mode').value;
  const txnGroup = document.getElementById('wf-txn-group');
  const txnInput = document.getElementById('wf-txn-ref');

  if (mode === 'UPI' || mode === 'Bank Transfer') {
    txnGroup.style.display = 'block';
    txnInput.required = true;
  } else {
    txnGroup.style.display = 'none';
    txnInput.required = false;
  }
}

function recalculateWorkflowAmounts(isManualFinalEdit = false) {
  const qty = parseFloat(document.getElementById('wf-actual-qty').value) || 0;
  const price = parseFloat(document.getElementById('wf-price').value) || 0;
  const calculated = Math.round(qty * price * 100) / 100;

  document.getElementById('wf-calculated-display').textContent = `₹ ${calculated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const finalInput = document.getElementById('wf-final-amount');
  if (!isManualFinalEdit) {
    finalInput.value = calculated;
  }

  const finalVal = parseFloat(finalInput.value) || 0;
  document.getElementById('wf-final-display').textContent = `₹ ${finalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Show adjustment reason if different
  const adjGroup = document.getElementById('wf-adjustment-group');
  const adjInput = document.getElementById('wf-adjustment-reason');
  if (Math.abs(finalVal - calculated) > 0.05) {
    adjGroup.style.display = 'block';
    adjInput.required = true;
  } else {
    adjGroup.style.display = 'none';
    adjInput.required = false;
  }
}

/**
 * Wire form handlers
 */
function setupFormHandlers() {
  // Qty and price change listeners
  const actualQtyInput = document.getElementById('wf-actual-qty');
  const priceInput = document.getElementById('wf-price');
  const finalAmountInput = document.getElementById('wf-final-amount');

  if (actualQtyInput) actualQtyInput.addEventListener('input', () => recalculateWorkflowAmounts(false));
  if (priceInput) priceInput.addEventListener('input', () => recalculateWorkflowAmounts(false));
  if (finalAmountInput) finalAmountInput.addEventListener('input', () => recalculateWorkflowAmounts(true));

  // Walk-in form submit
  const walkinForm = document.getElementById('walkin-form');
  walkinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('walkin-submit-btn');
    const errDiv = document.getElementById('walkin-error-msg');
    errDiv.style.display = 'none';

    const farmerName = document.getElementById('walkin-farmer-name').value.trim();
    const phone = document.getElementById('walkin-farmer-phone').value.trim();
    const crop = document.getElementById('walkin-crop').value.trim();
    const qty = document.getElementById('walkin-qty').value;
    const slotId = document.getElementById('walkin-slot-select').value;
    const dateStr = document.getElementById('slot-grid-date').value;

    const phoneCheck = AgriAuth.validatePhoneNumber(phone, false);
    if (!phoneCheck.valid) {
      errDiv.textContent = phoneCheck.message;
      errDiv.style.display = 'block';
      document.getElementById('walkin-farmer-phone').focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Registering...';

    try {
      const token = AgriAuth.getAuthToken();
      const centreId = currentStaff.centre_id || 1;

      const res = await fetch(`/api/mandi/${centreId}/offline-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          farmer_name: farmerName,
          phone_number: phone,
          crop_name: crop,
          estimated_quantity_kg: qty,
          slot_id: slotId,
          slot_date: dateStr
        })
      });

      const data = await res.json();
      if (data.success) {
        AgriAuth.showToast('Walk-in offline booking registered successfully!', 'success');
        closeWalkinModal();
        await loadMandiSlots();
      } else {
        errDiv.textContent = data.message || 'Failed to create walk-in booking.';
        errDiv.style.display = 'block';
      }
    } catch (err) {
      errDiv.textContent = 'Server or network error creating walk-in booking.';
      errDiv.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save Walk-in Booking →';
    }
  });

  // Workflow Form Submit (Accept & Generate Receipt)
  const workflowForm = document.getElementById('workflow-form');
  workflowForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeWorkflowBooking) return;

    const btn = document.getElementById('wf-accept-btn');
    const errDiv = document.getElementById('wf-error-msg');
    errDiv.style.display = 'none';
    errDiv.textContent = '';

    const actualQty = parseFloat(document.getElementById('wf-actual-qty').value);
    const grade = document.getElementById('wf-grade').value;
    const price = parseFloat(document.getElementById('wf-price').value);
    const finalAmount = parseFloat(document.getElementById('wf-final-amount').value);
    const paymentMode = document.getElementById('wf-pay-mode').value;
    const paymentStatus = document.getElementById('wf-pay-status').value;
    const txnRef = document.getElementById('wf-txn-ref').value.trim();
    const adjReason = document.getElementById('wf-adjustment-reason').value.trim();

    // Client validation
    if (isNaN(actualQty) || actualQty <= 0) {
      errDiv.textContent = 'Please enter a valid actual quantity in kg.';
      errDiv.style.display = 'block';
      return;
    }

    if (isNaN(price) || price <= 0) {
      errDiv.textContent = 'Please enter a valid agreed price per kg.';
      errDiv.style.display = 'block';
      return;
    }

    if (isNaN(finalAmount) || finalAmount <= 0) {
      errDiv.textContent = 'Please enter a valid final settlement amount.';
      errDiv.style.display = 'block';
      return;
    }

    const calculated = Math.round(actualQty * price * 100) / 100;
    if (Math.abs(finalAmount - calculated) > 0.05 && !adjReason) {
      errDiv.textContent = 'Adjustment Reason is mandatory when Final Amount differs from (Qty × Price).';
      errDiv.style.display = 'block';
      return;
    }

    if ((paymentMode === 'UPI' || paymentMode === 'Bank Transfer') && !txnRef) {
      errDiv.textContent = 'Transaction Reference / UTR is required for UPI or Bank Transfer.';
      errDiv.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Saving Procurement Record...';

    // Retain active booking data before closing modal
    const bookingToAccept = { ...activeWorkflowBooking };
    const centreName = (currentCentre && currentCentre.centre_name) || currentStaff.centre_name || 'APMC Mandi Yard';
    const token = AgriAuth.getAuthToken();

    // STEP 1: Persist procurement & payment in database first (decoupled from receipt generation)
    let acceptRes;
    try {
      acceptRes = await fetch(`/api/mandi/bookings/${bookingToAccept.booking_id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          actual_quantity_kg: Number(actualQty),
          quality_grade: String(grade),
          agreed_price_per_unit: Number(price),
          final_amount: Number(finalAmount),
          adjustment_reason: adjReason || null,
          payment_mode: String(paymentMode),
          payment_status: String(paymentStatus),
          transaction_ref: txnRef || null
        })
      });
    } catch (netErr) {
      console.error('Network failure completing workflow:', netErr);
      errDiv.textContent = `Network connection failed: Unable to reach the server. Please check your internet connection. (${netErr.message || 'Offline'})`;
      errDiv.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = `${MandiIcons.checkCircle} <span>Accept & Generate Official Receipt →</span>`;
      return;
    }

    let acceptData;
    try {
      acceptData = await acceptRes.json();
    } catch (jsonErr) {
      const rawText = await acceptRes.text().catch(() => '');
      console.error('Non-JSON server response:', acceptRes.status, rawText);
      errDiv.textContent = `Server error HTTP ${acceptRes.status} (${acceptRes.statusText}): ${rawText || 'Unexpected server response.'}`;
      errDiv.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = `${MandiIcons.checkCircle} <span>Accept & Generate Official Receipt →</span>`;
      return;
    }

    if (!acceptRes.ok || !acceptData.success) {
      console.error('Accept workflow rejected by server:', acceptRes.status, acceptData);
      errDiv.textContent = acceptData.message || `Server error (HTTP ${acceptRes.status}): Failed to complete procurement.`;
      errDiv.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = `${MandiIcons.checkCircle} <span>Accept & Generate Official Receipt →</span>`;
      return;
    }

    // STEP 2: Database procurement successful! Close workflow modal and refresh slots
    closeWorkflowModal();
    AgriAuth.showToast('Procurement accepted & settlement recorded successfully!', 'success');
    loadMandiSlots().catch(err => console.error('Failed to reload slots:', err));

    // STEP 3: Generate receipt image (Gemini AI with fallback to HTML5 canvas)
    let receiptImageData = null;
    let receiptSource = 'canvas';

    try {
      // Attempt Gemini AI receipt generation
      const geminiRes = await fetch('/api/receipts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          booking_id: bookingToAccept.booking_id,
          mandi_name: centreName,
          date: bookingToAccept.slot_date,
          time: bookingToAccept.slot_time,
          farmer_name: bookingToAccept.farmer_name,
          phone_number: bookingToAccept.farmer_phone,
          crop_name: bookingToAccept.crop_name,
          quantity_kg: actualQty,
          quality_grade: grade,
          agreed_price_per_unit: price,
          final_amount: finalAmount,
          payment_mode: paymentMode
        })
      });

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        if (geminiData.success && geminiData.image_data) {
          receiptImageData = geminiData.image_data;
          receiptSource = 'gemini';
        }
      }
    } catch (aiErr) {
      console.warn('Gemini receipt generation skipped or unavailable:', aiErr.message);
    }

    // If Gemini was unavailable or returned fallback, generate via client canvas
    if (!receiptImageData) {
      try {
        const receiptData = {
          centre_name: centreName,
          booking_id: bookingToAccept.booking_id,
          receipt_no: `REC-MANDI-${bookingToAccept.booking_id}-${Date.now().toString().slice(-5)}`,
          date_time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          farmer_name: bookingToAccept.farmer_name,
          farmer_phone: bookingToAccept.farmer_phone,
          crop_name: bookingToAccept.crop_name,
          estimated_quantity_kg: bookingToAccept.estimated_quantity_kg,
          slot_date: bookingToAccept.slot_date,
          slot_time: bookingToAccept.slot_time,
          queue_number: bookingToAccept.queue_number,
          channel: bookingToAccept.channel,
          actual_quantity_kg: actualQty,
          quality_grade: grade,
          agreed_price_per_unit: price,
          payment_mode: paymentMode,
          payment_status: paymentStatus,
          transaction_ref: txnRef,
          final_amount: finalAmount,
          adjustment_reason: adjReason,
          staff_name: currentStaff ? currentStaff.full_name : 'Staff Officer'
        };

        const { dataUrl } = AgriReceipt.generateReceiptCanvas(receiptData);
        receiptImageData = dataUrl;
        receiptSource = 'canvas';

        // Persist fallback canvas receipt to DB asynchronously
        fetch('/api/receipts/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            booking_id: bookingToAccept.booking_id,
            image_data: dataUrl
          })
        }).catch(err => console.warn('Could not save fallback receipt to DB:', err));
      } catch (canvasErr) {
        console.error('Canvas receipt generation failed:', canvasErr);
        AgriAuth.showToast('Procurement saved, but receipt rendering failed.', 'alert');
      }
    }

    // STEP 4: Render receipt modal with verified badge, download, and print buttons
    if (receiptImageData) {
      AgriReceipt.showReceiptModal(receiptImageData, bookingToAccept.booking_id, receiptSource);
    }
  });

  // Edit Slot form submit
  const editSlotForm = document.getElementById('edit-slot-form');
  if (editSlotForm) {
    editSlotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const slotId = document.getElementById('edit-slot-id').value;
      const start = document.getElementById('edit-slot-start').value.trim();
      const end = document.getElementById('edit-slot-end').value.trim();
      const cap = parseInt(document.getElementById('edit-slot-capacity').value, 10);
      const errDiv = document.getElementById('edit-slot-error');
      errDiv.style.display = 'none';

      const btn = document.getElementById('edit-slot-submit-btn');
      btn.disabled = true;
      btn.textContent = 'Updating...';

      try {
        const token = AgriAuth.getAuthToken();
        const res = await fetch(`/api/mandi/slots/${slotId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            start_time: start,
            end_time: end,
            max_bookings: cap
          })
        });

        const data = await res.json();
        if (data.success) {
          AgriAuth.showToast('Slot configuration updated successfully.', 'success');
          closeEditSlotModal();
          await loadMandiSlots();
        } else {
          errDiv.textContent = data.message || 'Failed to update slot.';
          errDiv.style.display = 'block';
        }
      } catch (err) {
        errDiv.textContent = 'Network error updating slot.';
        errDiv.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save Changes';
      }
    });
  }

  // Add Mandi Member form submit
  const addMemberForm = document.getElementById('add-member-form');
  if (addMemberForm) {
    addMemberForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('member-name').value.trim();
      const phone = document.getElementById('member-phone').value.trim();
      const password = document.getElementById('member-password').value;
      const role = document.getElementById('member-role').value;
      const errDiv = document.getElementById('add-member-error');
      errDiv.style.display = 'none';

      const btn = document.getElementById('add-member-submit-btn');

      const phoneCheck = AgriAuth.validatePhoneNumber(phone, false);
      if (!phoneCheck.valid) {
        errDiv.textContent = phoneCheck.message;
        errDiv.style.display = 'block';
        document.getElementById('member-phone').focus();
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Creating Account...';

      try {
        const token = AgriAuth.getAuthToken();
        const res = await fetch('/api/mandi/staff', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name, phone, password, role })
        });

        const data = await res.json();
        if (data.success) {
          AgriAuth.showToast(data.message, 'success');
          closeAddMemberModal();
          loadStaffDirectory();
        } else {
          errDiv.textContent = data.message || 'Failed to add staff member.';
          errDiv.style.display = 'block';
        }
      } catch (err) {
        errDiv.textContent = 'Network error adding staff member.';
        errDiv.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Create Staff Account';
      }
    });
  }
}

/**
 * View receipt for a completed booking
 */
async function viewBookingReceipt(bookingId) {
  try {
    const token = AgriAuth.getAuthToken();
    const res = await fetch(`/api/mandi/bookings/${bookingId}/receipt`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();
    if (data.success && data.receipt && data.receipt.image_data) {
      AgriReceipt.showReceiptModal(data.receipt.image_data, bookingId);
    } else {
      alert('No receipt image found for this booking.');
    }
  } catch (err) {
    alert('Error fetching receipt from server.');
  }
}

/**
 * Handle Approve / Reject Online Booking
 */
async function handleApproveBooking(bookingId, status) {
  const reason = status === 'rejected' ? prompt('Please enter rejection reason:') : '';
  if (status === 'rejected' && reason === null) return;

  try {
    const token = AgriAuth.getAuthToken();
    const res = await fetch(`/api/mandi/bookings/${bookingId}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ approval_status: status, reason })
    });

    const data = await res.json();
    if (data.success) {
      AgriAuth.showToast(`Booking #${bookingId} ${status}.`, 'success');
      await loadMandiSlots();
    } else {
      alert(data.message || 'Failed to update approval status.');
    }
  } catch (err) {
    alert('Error approving/rejecting booking.');
  }
}

/**
 * Edit Slot Modal (mandi_admin)
 */
function openEditSlotModal(slotId) {
  const slot = loadedSlots.find(s => s.slot_id === slotId);
  if (!slot) return;

  document.getElementById('edit-slot-id').value = slot.slot_id;
  document.getElementById('edit-slot-start').value = slot.start_time;
  document.getElementById('edit-slot-end').value = slot.end_time;
  document.getElementById('edit-slot-capacity').value = slot.max_bookings;
  document.getElementById('edit-slot-current-booked').textContent = slot.occupied_count;

  // Set minimum capacity floor on the input element
  const capInput = document.getElementById('edit-slot-capacity');
  capInput.min = Math.max(1, slot.occupied_count);

  document.getElementById('edit-slot-error').style.display = 'none';
  const modal = document.getElementById('edit-slot-modal');
  if (modal) modal.classList.add('active');
  syncModalBodyLock();
}

function closeEditSlotModal() {
  const modal = document.getElementById('edit-slot-modal');
  if (modal) modal.classList.remove('active');
  syncModalBodyLock();
}

/**
 * Staff Directory Modals
 */
async function loadStaffDirectory() {
  try {
    const token = AgriAuth.getAuthToken();
    const res = await fetch('/api/mandi/staff', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      const countEl = document.getElementById('staff-count');
      if (countEl) countEl.textContent = data.staff.length;

      const tbody = document.getElementById('staff-directory-tbody');
      if (tbody) {
        tbody.innerHTML = '';
        data.staff.forEach(st => {
          const tr = document.createElement('tr');
          const isAdm = st.role === 'mandi_admin';
          tr.innerHTML = `
            <td>#${st.id}</td>
            <td><strong>${st.name}</strong></td>
            <td><code>${st.phone}</code></td>
            <td><span class="badge-role ${isAdm ? 'badge-role-admin' : 'badge-role-member'}">${isAdm ? MandiIcons.shield : MandiIcons.building} <span>${isAdm ? 'Admin' : 'Member'}</span></span></td>
            <td>${st.created_at ? st.created_at.substring(0, 10) : '-'}</td>
          `;
          tbody.appendChild(tr);
        });
      }
    }
  } catch (err) {}
}

function openStaffModal() {
  loadStaffDirectory();
  const modal = document.getElementById('staff-directory-modal');
  if (modal) modal.classList.add('active');
  syncModalBodyLock();
}

function closeStaffModal() {
  const modal = document.getElementById('staff-directory-modal');
  if (modal) modal.classList.remove('active');
  syncModalBodyLock();
}

function openAddMemberModal() {
  document.getElementById('add-member-form').reset();
  document.getElementById('add-member-error').style.display = 'none';
  const modal = document.getElementById('add-member-modal');
  if (modal) modal.classList.add('active');
  syncModalBodyLock();
}

function closeAddMemberModal() {
  const modal = document.getElementById('add-member-modal');
  if (modal) modal.classList.remove('active');
  syncModalBodyLock();
}

// Global modal backdrop click and Escape key listeners
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeWalkinModal();
    closeWorkflowModal();
    closeEditSlotModal();
    closeStaffModal();
    closeAddMemberModal();
    if (window.AgriReceipt && AgriReceipt.closeReceiptModal) {
      AgriReceipt.closeReceiptModal();
    }
    syncModalBodyLock();
  }
});

document.addEventListener('click', (e) => {
  if (e.target && e.target.classList && (e.target.classList.contains('modal-backdrop') || e.target.classList.contains('modal-overlay'))) {
    if (e.target.id === 'walkin-modal') closeWalkinModal();
    else if (e.target.id === 'workflow-modal') closeWorkflowModal();
    else if (e.target.id === 'edit-slot-modal') closeEditSlotModal();
    else if (e.target.id === 'add-member-modal') closeAddMemberModal();
    else if (e.target.id === 'staff-directory-modal') closeStaffModal();
    else {
      e.target.classList.remove('active');
      syncModalBodyLock();
    }
  }
});

window.triggerCallNow = triggerCallNow;
window.showCallToast = showCallToast;

window.MandiDesk = {
  loadMandiSlots,
  selectSlot,
  openWalkinModal,
  closeWalkinModal,
  openWorkflowModal,
  closeWorkflowModal,
  viewBookingReceipt,
  triggerCallNow,
  showCallToast
};
