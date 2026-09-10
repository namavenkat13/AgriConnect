// frontend/js/admin.js
// Staff and Admin Dashboard Management for Procurement Centres

let selectedCentreId = 1;
let selectedDate = (window.AgriTime && window.AgriTime.getISTDateString()) || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
let currentBookings = [];
let hourlyChartInstance = null;
let cropChartInstance = null;

async function initAdminDashboard() {
  const isAuthorized = AgriAuth.guardRoute('staff');
  if (!isAuthorized) return;

  const user = AgriAuth.getStoredUser();
  const officerNameEl = document.getElementById('officer-name');
  if (officerNameEl && user) {
    officerNameEl.textContent = user.full_name;
  }

  // Set date picker to today
  const datePicker = document.getElementById('admin-date-picker');
  if (datePicker) {
    datePicker.value = selectedDate;
    datePicker.addEventListener('change', (e) => {
      selectedDate = e.target.value;
      loadTodayQueue();
    });
  }

  // Setup Socket.IO for live queue reflection
  if (typeof io !== 'undefined') {
    const socket = io();
    socket.on('queue_update', (data) => {
      if (Number(data.centre_id) === Number(selectedCentreId)) {
        loadTodayQueue();
      }
    });
  }

  // Load centres dropdown
  await loadCentresDropdown();

  // Load queue, rates, and analytics
  await loadTodayQueue();
  await loadRatesManagement();
  await loadAnalytics();

  // Setup Call Next button
  const callNextBtn = document.getElementById('call-next-btn');
  if (callNextBtn) {
    callNextBtn.addEventListener('click', handleCallNextFarmer);
  }

  // Setup Status Modal
  setupStatusModal();

  // Setup Add Crop Form
  setupAddCropForm();
}

/**
 * Load centres into admin dropdown
 */
async function loadCentresDropdown() {
  const centreSelect = document.getElementById('admin-centre-select');
  const stateSelect = document.getElementById('admin-state-select');
  if (!centreSelect) return;

  let allCentres = [];

  // Load states dropdown
  if (stateSelect) {
    try {
      const stateRes = await fetch('/api/centres/states');
      const stateData = await stateRes.json();
      if (stateData.success && Array.isArray(stateData.states)) {
        stateSelect.innerHTML = '<option value="">All States (Pan-India)</option>' +
          stateData.states.map(s => `<option value="${s}">${s}</option>`).join('');

        stateSelect.addEventListener('change', () => {
          renderAdminCentres(stateSelect.value);
        });
      }
    } catch (e) {}
  }

  try {
    const res = await fetch('/api/centres');
    const data = await res.json();
    if (data.success && Array.isArray(data.centres)) {
      allCentres = data.centres;
      renderAdminCentres('');
    }
  } catch (err) {
    console.error('Failed to load centres:', err);
  }

  function renderAdminCentres(filterState) {
    let filtered = allCentres;
    if (filterState) {
      filtered = allCentres.filter(c => c.state === filterState);
    }

    if (filtered.length === 0) {
      centreSelect.innerHTML = '<option value="">No centres in this state</option>';
      return;
    }

    const groups = {};
    for (const c of filtered) {
      const st = c.state || 'Other Regions';
      if (!groups[st]) groups[st] = [];
      groups[st].push(c);
    }

    let html = '';
    for (const [st, items] of Object.entries(groups)) {
      html += `<optgroup label="📍 ${st}">`;
      items.forEach(c => {
        html += `<option value="${c.centre_id}">[${c.city || ''}] ${c.centre_name}</option>`;
      });
      html += '</optgroup>';
    }

    centreSelect.innerHTML = html;
    selectedCentreId = filtered[0].centre_id;
    centreSelect.value = selectedCentreId;
    loadTodayQueue();
  }

  centreSelect.addEventListener('change', (e) => {
    selectedCentreId = e.target.value;
    loadTodayQueue();
  });
}

/**
 * Fetch and render today's queue for selected centre
 */
async function loadTodayQueue() {
  const token = AgriAuth.getAuthToken();
  const queueTableBody = document.getElementById('admin-queue-body');
  const servingBadge = document.getElementById('admin-now-serving-badge');
  const waitingCountEl = document.getElementById('admin-waiting-count');

  if (!queueTableBody || !token) return;

  try {
    const res = await fetch(`/api/bookings/centre/${selectedCentreId}/today?date=${selectedDate}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.success) return;

    currentBookings = data.bookings || [];
    const nowServing = Number(data.now_serving_number) || 0;

    if (servingBadge) servingBadge.textContent = `#${nowServing}`;

    const waitingBookings = currentBookings.filter(b => b.queue_number > nowServing && b.booking_status !== 'cancelled');
    if (waitingCountEl) waitingCountEl.textContent = `${waitingBookings.length} farmers in queue`;

    if (currentBookings.length === 0) {
      queueTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
            No bookings registered for this centre on ${selectedDate}.
          </td>
        </tr>
      `;
      return;
    }

    queueTableBody.innerHTML = currentBookings.map(b => {
      const isCurrentlyServing = Number(b.queue_number) === nowServing;
      const isPast = Number(b.queue_number) < nowServing;
      const rowStyle = isCurrentlyServing ? 'background-color: #E8F5E9; font-weight: 500;' : (isPast ? 'opacity: 0.75;' : '');

      const finalAmtDisplay = b.final_amount ? `₹${Number(b.final_amount).toLocaleString('en-IN')}` : '—';
      const finalQtyDisplay = b.final_quantity_kg ? `${b.final_quantity_kg} kg` : `${b.estimated_quantity_kg} kg (est)`;

      return `
        <tr style="${rowStyle}">
          <td>
            <span style="font-family: var(--font-mono); font-weight: 800; font-size: 1.1rem; color: ${isCurrentlyServing ? 'var(--primary-dark)' : 'var(--text-main)'};">
              #${b.queue_number}
            </span>
            ${isCurrentlyServing ? '<span class="badge badge-in_queue" style="display:block; margin-top:2px;">SERVING</span>' : ''}
          </td>
          <td>
            <strong>${b.farmer_name}</strong><br>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${b.village || 'Village N/A'}</span>
          </td>
          <td style="font-family: var(--font-mono);">${b.farmer_phone}</td>
          <td>
            <strong>${AgriTicker.getCropIcon(b.crop_name)} ${b.crop_name}</strong><br>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${finalQtyDisplay}</span>
          </td>
          <td><span class="badge badge-${b.booking_status}">${b.booking_status.replace('_', ' ')}</span></td>
          <td><span class="badge badge-${b.procurement_status}">${b.procurement_status}</span></td>
          <td><span class="badge badge-${b.payment_status}">${b.payment_status}</span></td>
          <td>
            <button class="btn btn-secondary" style="padding: 0.35rem 0.7rem; font-size: 0.8rem;" onclick="openStatusModal(${b.booking_id})">
              ✏️ Update
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading today queue:', err);
  }
}

/**
 * Handle Call Next Farmer action
 */
async function handleCallNextFarmer() {
  const token = AgriAuth.getAuthToken();
  const btn = document.getElementById('call-next-btn');

  btn.disabled = true;
  btn.textContent = 'Calling Next...';

  try {
    const res = await fetch(`/api/queue/${selectedCentreId}/next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ date: selectedDate })
    });

    const data = await res.json();
    if (data.success) {
      AgriAuth.showToast(`📢 Now Calling Token #${data.now_serving_number}${data.active_farmer ? ` (${data.active_farmer})` : ''}. Upcoming farmers notified!`, 'success');
      await loadTodayQueue();
    } else {
      alert(data.message || 'Failed to call next farmer.');
    }
  } catch (err) {
    console.error('Error calling next:', err);
    alert('Server error calling next farmer.');
  } finally {
    btn.disabled = false;
    btn.textContent = '📢 Call Next Farmer';
  }
}

/**
 * Setup and open Status Update Modal (<dialog>)
 */
function setupStatusModal() {
  const dialog = document.getElementById('status-dialog');
  const form = document.getElementById('status-form');
  const closeBtn = document.getElementById('modal-close-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');

  if (!dialog || !form) return;

  closeBtn.addEventListener('click', () => dialog.close());
  cancelBtn.addEventListener('click', () => dialog.close());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = AgriAuth.getAuthToken();
    const bookingId = document.getElementById('modal-booking-id').value;

    const procStatus = document.getElementById('modal-proc-status').value;
    const payStatus = document.getElementById('modal-pay-status').value;
    const finalQty = document.getElementById('modal-final-qty').value;
    const finalAmt = document.getElementById('modal-final-amt').value;

    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          procurement_status: procStatus,
          payment_status: payStatus,
          final_quantity_kg: finalQty ? Number(finalQty) : undefined,
          final_amount: finalAmt ? Number(finalAmt) : undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        AgriAuth.showToast('✅ Status and payout updated. Farmer notified!', 'success');
        dialog.close();
        loadTodayQueue();
        loadAnalytics();
      } else {
        alert(data.message || 'Failed to update booking status.');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error updating status.');
    }
  });
}

function openStatusModal(bookingId) {
  const booking = currentBookings.find(b => Number(b.booking_id) === Number(bookingId));
  if (!booking) return;

  const dialog = document.getElementById('status-dialog');
  document.getElementById('modal-booking-id').value = booking.booking_id;
  document.getElementById('modal-farmer-info').textContent = `${booking.farmer_name} (#${booking.queue_number}) — ${booking.crop_name}`;

  document.getElementById('modal-proc-status').value = booking.procurement_status;
  document.getElementById('modal-pay-status').value = booking.payment_status;
  document.getElementById('modal-final-qty').value = booking.final_quantity_kg || booking.estimated_quantity_kg || '';
  document.getElementById('modal-final-amt').value = booking.final_amount || '';

  // Auto-calculate suggested payout if empty
  const qtyInput = document.getElementById('modal-final-qty');
  const amtInput = document.getElementById('modal-final-amt');

  qtyInput.oninput = async () => {
    const qtyKg = Number(qtyInput.value) || 0;
    if (qtyKg > 0 && !amtInput.value) {
      try {
        const ratesRes = await fetch('/api/rates');
        const ratesData = await ratesRes.json();
        const cropRate = ratesData.rates.find(r => r.crop_name.toLowerCase() === booking.crop_name.toLowerCase());
        if (cropRate) {
          // Rate is per quintal (100 kg)
          const suggested = (qtyKg / 100) * cropRate.price_per_quintal;
          amtInput.value = Math.round(suggested);
        }
      } catch (e) {}
    }
  };

  dialog.showModal();
}

/**
 * Manage Crop Rates in Admin Panel
 */
async function loadRatesManagement() {
  const ratesTableBody = document.getElementById('admin-rates-body');
  if (!ratesTableBody) return;

  try {
    const res = await fetch('/api/rates');
    const data = await res.json();
    if (!data.success || !Array.isArray(data.rates)) return;

    ratesTableBody.innerHTML = data.rates.map(r => `
      <tr>
        <td>
          <strong>${AgriTicker.getCropIcon(r.crop_name)} ${r.crop_name}</strong>
        </td>
        <td style="font-family: var(--font-mono); font-weight: 700;">
          ₹${r.price_per_quintal.toFixed(2)}
        </td>
        <td style="font-family: var(--font-mono); color: var(--text-muted);">
          ₹${r.previous_price.toFixed(2)}
        </td>
        <td>
          <span class="ticker-change ${r.trend}">
            ${r.trend === 'up' ? '▲' : r.trend === 'down' ? '▼' : '▬'} ${r.change_pct}%
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <input type="number" id="rate-input-${r.rate_id}" value="${r.price_per_quintal}" step="5" style="width: 110px; padding: 0.35rem 0.5rem; font-family: var(--font-mono); border: 1px solid var(--border-color); border-radius: 4px;">
            <button class="btn btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" onclick="updateRatePrice(${r.rate_id})">
              Update
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load rates table:', err);
  }
}

async function updateRatePrice(rateId) {
  const token = AgriAuth.getAuthToken();
  const input = document.getElementById(`rate-input-${rateId}`);
  if (!input) return;

  const newPrice = Number(input.value);
  if (!newPrice || newPrice <= 0) {
    alert('Please enter a valid price.');
    return;
  }

  try {
    const res = await fetch(`/api/rates/${rateId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ price_per_quintal: newPrice })
    });

    const data = await res.json();
    if (data.success) {
      AgriAuth.showToast(`📊 Rate updated: ${data.message}`, 'success');
      loadRatesManagement();
    } else {
      alert(data.message || 'Failed to update rate.');
    }
  } catch (err) {
    console.error('Error updating rate:', err);
    alert('Error updating rate.');
  }
}

function setupAddCropForm() {
  const form = document.getElementById('add-crop-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = AgriAuth.getAuthToken();
    const nameInput = document.getElementById('new-crop-name');
    const priceInput = document.getElementById('new-crop-price');

    if (!nameInput.value.trim() || !priceInput.value) {
      alert('Please fill crop name and initial price.');
      return;
    }

    try {
      const res = await fetch('/api/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          crop_name: nameInput.value.trim(),
          price_per_quintal: Number(priceInput.value)
        })
      });

      const data = await res.json();
      if (data.success) {
        AgriAuth.showToast(`🌱 Added new crop: ${nameInput.value.trim()}`, 'success');
        nameInput.value = '';
        priceInput.value = '';
        loadRatesManagement();
      } else {
        alert(data.message || 'Failed to add crop.');
      }
    } catch (err) {
      console.error('Error adding crop:', err);
      alert('Error adding crop.');
    }
  });
}

/**
 * Load Analytics & Render Charts
 */
async function loadAnalytics() {
  try {
    const res = await fetch('/api/analytics');
    const data = await res.json();
    if (!data.success) return;

    const m = data.metrics;
    document.getElementById('metric-total-bookings').textContent = m.total_bookings;
    document.getElementById('metric-farmers-served').textContent = m.farmers_served;
    document.getElementById('metric-total-kg').textContent = `${(m.total_procured_kg / 1000).toFixed(1)} MT`;
    document.getElementById('metric-payout').textContent = `₹${(m.total_payout_inr / 100000).toFixed(2)} Lakh`;
    document.getElementById('metric-wait-time').textContent = `${m.avg_wait_time_mins} min`;

    // Render Chart.js if available
    if (typeof Chart !== 'undefined') {
      renderCharts(data.hourly_congestion, data.crop_breakdown);
    }
  } catch (err) {
    console.error('Failed to load analytics:', err);
  }
}

function renderCharts(hourlyData = [], cropData = []) {
  const hourlyCanvas = document.getElementById('hourly-congestion-chart');
  const cropCanvas = document.getElementById('crop-breakdown-chart');

  // Hourly Congestion Bar Chart
  if (hourlyCanvas) {
    const labels = hourlyData.map(h => h.slot_time.substring(0, 5));
    const counts = hourlyData.map(h => Number(h.count));

    if (hourlyChartInstance) hourlyChartInstance.destroy();

    hourlyChartInstance = new Chart(hourlyCanvas, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00'],
        datasets: [{
          label: 'Farmer Bookings',
          data: counts.length ? counts : [4, 8, 12, 10, 6, 7, 5],
          backgroundColor: '#2E7D32',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  // Crop Breakdown Doughnut Chart
  if (cropCanvas) {
    const cropLabels = cropData.map(c => c.crop_name);
    const cropCounts = cropData.map(c => Number(c.bookings_count));

    if (cropChartInstance) cropChartInstance.destroy();

    cropChartInstance = new Chart(cropCanvas, {
      type: 'doughnut',
      data: {
        labels: cropLabels.length ? cropLabels : ['Wheat', 'Tomato', 'Onion', 'Paddy', 'Soybean'],
        datasets: [{
          data: cropCounts.length ? cropCounts : [14, 11, 9, 7, 5],
          backgroundColor: ['#2E7D32', '#EF5350', '#8E24AA', '#FBC02D', '#0288D1']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
}

window.AgriAdmin = {
  initAdminDashboard,
  openStatusModal,
  updateRatePrice
};
