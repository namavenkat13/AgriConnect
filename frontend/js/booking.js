// frontend/js/booking.js
// Handles procurement slot booking, dynamic capacity grid, and booking history table

let selectedSlotTime = null;

/**
 * Initialize Booking Form & Slot Selector
 */
async function initBookingModule(onBookingSuccessCallback) {
  const token = AgriAuth.getAuthToken();
  const user = AgriAuth.getStoredUser();

  const centreSelect = document.getElementById('centre-select');
  const dateInput = document.getElementById('date-input');
  const cropSelect = document.getElementById('crop-select');
  const slotGrid = document.getElementById('slot-grid');
  const bookingForm = document.getElementById('booking-form');

  if (!centreSelect || !bookingForm) return;

  // Set minimum date to today (IST)
  const todayStr = (window.AgriTime && window.AgriTime.getISTDateString()) || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  dateInput.min = todayStr;
  dateInput.value = todayStr;

  // Populate Farmer's registered crops + all 30 benchmark crops
  if (cropSelect) {
    const CROP_CATEGORIES = {
      'Wheat (Sharbati)': '🌾 Cereals & Grains',
      'Paddy (Basmati)': '🌾 Cereals & Grains',
      'Maize (Kharif)': '🌾 Cereals & Grains',
      'Barley (Jau)': '🌾 Cereals & Grains',
      'Jowar (Sorghum)': '🌾 Cereals & Grains',
      'Bajra (Pearl Millet)': '🌾 Cereals & Grains',
      'Green Gram (Moong)': '🌿 Pulses & Legumes',
      'Gram (Chana / Chickpea)': '🌿 Pulses & Legumes',
      'Tur Dal (Arhar / Pigeon Pea)': '🌿 Pulses & Legumes',
      'Soybean (Yellow)': '🌱 Oilseeds',
      'Mustard (Black)': '🌱 Oilseeds',
      'Groundnut (Peanut)': '🌱 Oilseeds',
      'Cotton (Medium Staple)': '🎋 Cash Crops & Commercial Fibres',
      'Sugarcane': '🎋 Cash Crops & Commercial Fibres',
      'Jute (Raw Jute)': '🎋 Cash Crops & Commercial Fibres',
      'Tea (Assam Green Leaf)': '🎋 Cash Crops & Commercial Fibres',
      'Arecanut (Supari)': '🎋 Cash Crops & Commercial Fibres',
      'Coffee (Arabica / Robusta)': '🎋 Cash Crops & Commercial Fibres',
      'Tomato (Hybrid)': '🍅 Vegetables & Fruits',
      'Onion (Red Nashik)': '🍅 Vegetables & Fruits',
      'Potato (Jyoti)': '🍅 Vegetables & Fruits',
      'Banana (Robusta)': '🍅 Vegetables & Fruits',
      'Apple (Royal Delicious)': '🍅 Vegetables & Fruits',
      'Mango (Alphonso / Kesar)': '🍅 Vegetables & Fruits',
      'Garlic (Lahsun)': '🍅 Vegetables & Fruits',
      'Ginger (Adrak)': '🍅 Vegetables & Fruits',
      'Litchi (Shahi)': '🍅 Vegetables & Fruits',
      'Red Chilli (Guntur)': '🧂 Spices & Condiments',
      'Turmeric (Haldi)': '🧂 Spices & Condiments',
      'Cumin Seeds (Jeera)': '🧂 Spices & Condiments'
    };

    function getCropCategory(name) {
      if (CROP_CATEGORIES[name]) return CROP_CATEGORIES[name];
      const lower = (name || '').toLowerCase();
      if (lower.includes('wheat') || lower.includes('paddy') || lower.includes('rice') || lower.includes('maize') || lower.includes('corn') || lower.includes('barley') || lower.includes('jowar') || lower.includes('bajra')) {
        return '🌾 Cereals & Grains';
      }
      if (lower.includes('gram') || lower.includes('moong') || lower.includes('chana') || lower.includes('tur') || lower.includes('arhar') || lower.includes('pulse')) {
        return '🌿 Pulses & Legumes';
      }
      if (lower.includes('soybean') || lower.includes('mustard') || lower.includes('groundnut') || lower.includes('oilseed')) {
        return '🌱 Oilseeds';
      }
      if (lower.includes('cotton') || lower.includes('sugarcane') || lower.includes('jute') || lower.includes('tea') || lower.includes('coffee') || lower.includes('arecanut')) {
        return '🎋 Cash Crops & Commercial Fibres';
      }
      if (lower.includes('tomato') || lower.includes('onion') || lower.includes('potato') || lower.includes('banana') || lower.includes('apple') || lower.includes('mango') || lower.includes('garlic') || lower.includes('ginger') || lower.includes('litchi')) {
        return '🍅 Vegetables & Fruits';
      }
      if (lower.includes('chilli') || lower.includes('mirchi') || lower.includes('turmeric') || lower.includes('haldi') || lower.includes('cumin') || lower.includes('jeera') || lower.includes('spice')) {
        return '🧂 Spices & Condiments';
      }
      return '🌾 Other Mandi Crops';
    }

    try {
      const ratesRes = await fetch('/api/rates');
      const ratesData = await ratesRes.json();
      if (ratesData.success && Array.isArray(ratesData.rates)) {
        let html = '<option value="">-- Choose Crop to Sell (' + ratesData.rates.length + ' Crops Available) --</option>';

        // 1. Highlight user's registered crops first
        if (user && Array.isArray(user.crops) && user.crops.length > 0) {
          html += '<optgroup label="⭐ My Registered Crops">';
          user.crops.forEach(crop => {
            const matchedRate = ratesData.rates.find(r => r.crop_name.toLowerCase() === crop.toLowerCase());
            const priceText = matchedRate ? ` (₹${matchedRate.price_per_quintal}/q)` : '';
            html += `<option value="${crop}">${AgriTicker.getCropIcon(crop)} ${crop}${priceText}</option>`;
          });
          html += '</optgroup>';
        }

        // 2. Group all mandi crops by category
        const categoryGroups = {};
        ratesData.rates.forEach(r => {
          const cat = getCropCategory(r.crop_name);
          if (!categoryGroups[cat]) categoryGroups[cat] = [];
          categoryGroups[cat].push(r);
        });

        const categoryOrder = [
          '🌾 Cereals & Grains',
          '🌿 Pulses & Legumes',
          '🌱 Oilseeds',
          '🎋 Cash Crops & Commercial Fibres',
          '🍅 Vegetables & Fruits',
          '🧂 Spices & Condiments',
          '🌾 Other Mandi Crops'
        ];

        for (const catName of categoryOrder) {
          if (categoryGroups[catName] && categoryGroups[catName].length > 0) {
            html += `<optgroup label="${catName}">`;
            categoryGroups[catName].forEach(r => {
              html += `<option value="${r.crop_name}">${AgriTicker.getCropIcon(r.crop_name)} ${r.crop_name} (₹${r.price_per_quintal}/q)</option>`;
            });
            html += '</optgroup>';
          }
        }

        cropSelect.innerHTML = html;
      }
    } catch (e) {
      console.warn('Could not load crops for dropdown:', e);
    }
  }

  const stateSelect = document.getElementById('state-select');
  const cityFilter = document.getElementById('city-filter');
  const centreDetailsHint = document.getElementById('centre-details-hint');
  let allCentresList = [];

  // Load States dropdown
  if (stateSelect) {
    try {
      const stateRes = await fetch('/api/centres/states');
      const stateData = await stateRes.json();
      if (stateData.success && Array.isArray(stateData.states)) {
        stateSelect.innerHTML = '<option value="">All States (Pan-India)</option>' +
          stateData.states.map(s => `<option value="${s}">${s}</option>`).join('');
      }
    } catch (e) {
      console.warn('Could not load states:', e);
    }
  }

  // Load all procurement centres
  try {
    const res = await fetch('/api/centres');
    const data = await res.json();
    if (data.success && Array.isArray(data.centres)) {
      allCentresList = data.centres;
      const urlParams = new URLSearchParams(window.location.search);
      const paramCentreId = urlParams.get('centre_id');
      let targetId = null;
      if (paramCentreId) {
        targetId = Number(paramCentreId);
        const found = allCentresList.find(c => c.centre_id === targetId);
        if (found && stateSelect && found.state) {
          stateSelect.value = found.state;
        }
      }
      renderCentresDropdown(targetId);
    }
  } catch (err) {
    console.error('Failed to load centres:', err);
  }

  function renderCentresDropdown(preferredCentreId) {
    const selectedState = stateSelect ? stateSelect.value : '';
    const citySearch = cityFilter ? cityFilter.value.trim().toLowerCase() : '';

    let filtered = allCentresList;
    if (selectedState) {
      filtered = filtered.filter(c => c.state === selectedState);
    }
    if (citySearch) {
      filtered = filtered.filter(c => 
        (c.city && c.city.toLowerCase().includes(citySearch)) ||
        (c.centre_name && c.centre_name.toLowerCase().includes(citySearch)) ||
        (c.location && c.location.toLowerCase().includes(citySearch))
      );
    }

    if (filtered.length === 0) {
      centreSelect.innerHTML = '<option value="">-- No centres match your state/city filter --</option>';
      if (centreDetailsHint) centreDetailsHint.textContent = '';
      loadAvailableSlots();
      return;
    }

    // Group by State
    const groups = {};
    for (const c of filtered) {
      const stateKey = c.state || 'Other Regions';
      if (!groups[stateKey]) groups[stateKey] = [];
      groups[stateKey].push(c);
    }

    let optionsHtml = '<option value="">-- Choose Procurement Centre (' + filtered.length + ' available) --</option>';
    for (const [st, items] of Object.entries(groups)) {
      optionsHtml += `<optgroup label="📍 ${st}">`;
      items.forEach(c => {
        optionsHtml += `
          <option value="${c.centre_id}">
            [${c.city || 'City'}] ${c.centre_name} — Cap: ${c.daily_capacity}/day
          </option>
        `;
      });
      optionsHtml += '</optgroup>';
    }

    centreSelect.innerHTML = optionsHtml;

    // Auto-select preferred or first centre
    if (filtered.length > 0) {
      if (preferredCentreId && filtered.some(c => c.centre_id === preferredCentreId)) {
        centreSelect.value = preferredCentreId;
      } else {
        centreSelect.value = filtered[0].centre_id;
      }
      updateCentreDetailsHint();
      loadAvailableSlots();
    }
  }

  function updateCentreDetailsHint() {
    if (!centreDetailsHint) return;
    const cid = Number(centreSelect.value);
    const chosen = allCentresList.find(c => c.centre_id === cid);
    if (chosen) {
      centreDetailsHint.textContent = `📍 Location: ${chosen.location || chosen.city} | Hours: ${chosen.opening_time.substring(0, 5)} - ${chosen.closing_time.substring(0, 5)} | Capacity: ${chosen.daily_capacity} farmers/day`;
    } else {
      centreDetailsHint.textContent = '';
    }
  }

  // Event listeners for state, city filter, and centre selection
  if (stateSelect) stateSelect.addEventListener('change', renderCentresDropdown);
  if (cityFilter) cityFilter.addEventListener('input', renderCentresDropdown);
  centreSelect.addEventListener('change', () => {
    updateCentreDetailsHint();
    loadAvailableSlots();
  });
  dateInput.addEventListener('change', loadAvailableSlots);

  async function loadAvailableSlots() {
    const centreId = centreSelect.value;
    const dateVal = dateInput.value;

    selectedSlotTime = null;
    slotGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 1rem;">Loading available slots...</div>';

    if (!centreId || !dateVal) {
      slotGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 1rem;">Select a centre and date to view time slots.</div>';
      return;
    }

    try {
      const res = await fetch(`/api/centres/${centreId}/slots?date=${dateVal}`);
      const data = await res.json();

      if (!data.success || !data.slots || data.slots.length === 0) {
        slotGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--bear-red); padding: 1rem;">No slots available for this centre/date.</div>';
        return;
      }

      slotGrid.innerHTML = data.slots.map(s => {
        const isPast = window.AgriTime ? window.AgriTime.isSlotInPast(dateVal, s.time) : false;
        const isClosed = Boolean(s.is_closed || isPast);
        const isFull = s.isFull;
        const isDisabled = isClosed || isFull;

        let statusText = `${s.available} left`;
        if (isClosed) statusText = 'Closed';
        else if (isFull) statusText = 'FULL';

        return `
          <div class="slot-item ${isDisabled ? 'disabled' : ''} ${isClosed ? 'slot-closed-item' : ''}" 
               data-time="${s.time}" 
               title="${isClosed ? 'Slot closed (scheduled time has passed)' : (isFull ? 'Slot is completely booked' : 'Available')}"
               style="${isClosed ? 'opacity: 0.55; cursor: not-allowed; background: #ECEFF1;' : ''}">
            <span class="slot-time-text">${s.label.split(' - ')[0]}</span>
            <span class="slot-cap-text" style="${isClosed ? 'color: #78909C; font-weight: 700;' : ''}">${statusText}</span>
          </div>
        `;
      }).join('');

      // Attach click handlers to active slots (excluding closed or full)
      slotGrid.querySelectorAll('.slot-item:not(.disabled)').forEach(item => {
        item.addEventListener('click', () => {
          slotGrid.querySelectorAll('.slot-item').forEach(el => el.classList.remove('selected'));
          item.classList.add('selected');
          selectedSlotTime = item.getAttribute('data-time');
        });
      });

      // Auto-select first available slot if any
      const firstAvailable = slotGrid.querySelector('.slot-item:not(.disabled)');
      if (firstAvailable) {
        firstAvailable.click();
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
      slotGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--bear-red);">Error checking slot availability.</div>';
    }
  }

  // Handle Booking Form Submission
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const centreId = centreSelect.value;
    const slotDate = dateInput.value;
    const cropName = cropSelect.value;
    const quantityKg = document.getElementById('quantity-input').value;
    const submitBtn = bookingForm.querySelector('button[type="submit"]');

    if (!centreId) {
      alert('Please select a procurement centre.');
      return;
    }
    if (!slotDate) {
      alert('Please choose a date.');
      return;
    }
    if (!selectedSlotTime) {
      alert('Please select an available time slot from the grid.');
      return;
    }
    if (window.AgriTime && window.AgriTime.isSlotInPast(slotDate, selectedSlotTime)) {
      alert('The selected slot has already closed. Please choose a future time slot.');
      return;
    }
    if (!cropName) {
      alert('Please choose the crop you wish to sell.');
      return;
    }
    if (!quantityKg || Number(quantityKg) <= 0) {
      alert('Please specify the estimated quantity in kg.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Confirming Booking...';

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          centre_id: centreId,
          crop_name: cropName,
          estimated_quantity_kg: quantityKg,
          slot_date: slotDate,
          slot_time: selectedSlotTime
        })
      });

      const data = await res.json();
      if (data.success) {
        AgriAuth.showToast(`🎉 Booking Confirmed! Token #${data.booking.queue_number} assigned.`, 'success');
        document.getElementById('quantity-input').value = '';
        await loadAvailableSlots();
        if (typeof onBookingSuccessCallback === 'function') {
          onBookingSuccessCallback(data.booking);
        }
      } else {
        alert(data.message || 'Failed to confirm booking.');
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      alert('Network or server error while submitting booking.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirm & Book Slot';
    }
  });
}

/**
 * Render Farmer's Bookings Table
 */
async function loadMyBookingsTable() {
  const tableBody = document.getElementById('my-bookings-body');
  if (!tableBody) return;

  const token = AgriAuth.getAuthToken();
  if (!token) return;

  try {
    const res = await fetch('/api/bookings/my', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.success || !Array.isArray(data.bookings) || data.bookings.length === 0) {
      const emptyMsg = (window.AgriLang && typeof window.AgriLang.t === 'function')
        ? window.AgriLang.t('no_bookings_yet', 'No bookings found yet. Book your first procurement slot above!')
        : 'No bookings found yet. Book your first procurement slot above!';
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            ${emptyMsg}
          </td>
        </tr>
      `;
      return;
    }

    const t = (k, f) => (window.AgriLang && typeof window.AgriLang.t === 'function' ? window.AgriLang.t(k, f) : f);
    const tStat = (s) => (window.AgriLang && typeof window.AgriLang.tStatus === 'function' ? window.AgriLang.tStatus(s) : (s || '').replace('_', ' '));

    tableBody.innerHTML = data.bookings.map(b => {
      const finalAmtDisplay = b.final_amount ? `₹${Number(b.final_amount).toLocaleString('en-IN')}` : '—';
      const finalQtyDisplay = b.final_quantity_kg ? `${b.final_quantity_kg} kg` : `${b.estimated_quantity_kg} kg (est)`;
      const isCompleted = b.booking_status === 'completed' || b.procurement_status === 'accepted';
      const receiptText = t('btn_receipt', 'Receipt');
      const actionDisplay = isCompleted
        ? `<button class="btn btn-secondary btn-sm" onclick="AgriBooking.viewReceipt(${b.booking_id})" style="font-size: 0.75rem; padding: 0.25rem 0.55rem;">
            <span class="btn-icon">📄</span> <span data-i18n="btn_receipt">${receiptText}</span>
          </button>`
        : '—';

      const tokenLabel = t('queue_token_label', 'Queue Token');

      return `
        <tr>
          <td>
            <strong>${(window.AgriTime && window.AgriTime.formatDisplayDate(b.slot_date)) || b.slot_date}</strong><br>
            <span style="font-size: 0.75rem; color: var(--text-light);">${b.slot_time.substring(0, 5)}</span>
          </td>
          <td>
            <strong>${b.centre_name}</strong><br>
            <span style="font-size: 0.75rem; color: var(--text-light);">${b.centre_location || ''}</span>
          </td>
          <td>
            <div style="display: inline-flex; align-items: center; gap: 0.35rem;">
              <span class="crop-icon">${AgriTicker.getCropIcon(b.crop_name)}</span> <strong data-crop-raw="${b.crop_name}">${(window.AgriLang && typeof window.AgriLang.tCrop === 'function') ? window.AgriLang.tCrop(b.crop_name) : b.crop_name}</strong>
            </div><br>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${tokenLabel} #${b.queue_number}</span>
          </td>
          <td>${finalQtyDisplay}</td>
          <td><span class="badge badge-${b.booking_status}">${tStat(b.booking_status)}</span></td>
          <td><span class="badge badge-${b.procurement_status}">${tStat(b.procurement_status)}</span></td>
          <td><span class="badge badge-${b.payment_status}">${tStat(b.payment_status)}</span></td>
          <td style="font-family: var(--font-mono); font-weight: 700; color: var(--primary-dark);">${finalAmtDisplay}</td>
          <td>${actionDisplay}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading farmer bookings:', err);
    tableBody.innerHTML = `<tr><td colspan="9" style="color: var(--bear-red); text-align: center;">Error loading bookings.</td></tr>`;
  }
}

/**
 * View receipt for completed farmer booking
 */
async function viewReceipt(bookingId) {
  try {
    const token = AgriAuth.getAuthToken();
    const res = await fetch(`/api/bookings/${bookingId}/receipt`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success && data.receipt && data.receipt.image_data) {
      AgriReceipt.showReceiptModal(data.receipt.image_data, bookingId);
    } else {
      alert('Official procurement receipt is not yet available for this booking.');
    }
  } catch (err) {
    console.error('Error viewing receipt:', err);
    alert('Failed to load receipt from server.');
  }
}

// Re-render bookings table when language changes
window.addEventListener('languageChanged', () => {
  if (document.getElementById('my-bookings-body')) {
    loadMyBookingsTable();
  }
});

window.AgriBooking = {
  initBookingModule,
  loadMyBookingsTable,
  viewReceipt
};
