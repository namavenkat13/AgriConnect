// frontend/js/ticker.js
// Renders the live stock-market style Mandi ticker and price cards with real-time Socket.IO updates

let socket = null;
let currentRatesMap = new Map();

// Emoji map for agricultural crops
const CROP_ICONS = {
  'wheat': '🌾',
  'paddy': '🍚',
  'rice': '🍚',
  'tomato': '🍅',
  'onion': '🧅',
  'potato': '🥔',
  'cotton': '☁️',
  'soybean': '🌱',
  'maize': '🌽',
  'corn': '🌽',
  'mustard': '🌼',
  'green gram': '🌿',
  'moong': '🌿',
  'chana': '🧆',
  'gram': '🧆',
  'chickpea': '🧆',
  'sugarcane': '🎋',
  'banana': '🍌',
  'chilli': '🌶️',
  'mirchi': '🌶️',
  'tur': '🥣',
  'arhar': '🥣',
  'pigeon pea': '🥣',
  'groundnut': '🥜',
  'peanut': '🥜',
  'turmeric': '🟡',
  'haldi': '🟡',
  'cumin': '🧂',
  'jeera': '🧂',
  'apple': '🍎',
  'mango': '🥭',
  'jute': '🧶',
  'tea': '🍵',
  'arecanut': '🌰',
  'supari': '🌰',
  'coffee': '☕',
  'garlic': '🧄',
  'lahsun': '🧄',
  'ginger': '🫚',
  'adrak': '🫚',
  'barley': '🌾',
  'jau': '🌾',
  'jowar': '🌾',
  'sorghum': '🌾',
  'bajra': '🌾',
  'millet': '🌾',
  'litchi': '🍒'
};

function getCropIcon(name = '') {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(CROP_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '🥬';
}

function formatPrice(val) {
  return Number(val).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function timeAgo(dateString) {
  if (!dateString) return 'Just now';
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (seconds < 15) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

/**
 * Initialize Ticker
 * @param {Object} options
 * @param {string[]} [options.userCrops=[]] - List of crops the logged-in farmer grows
 */
async function initMandiTicker(options = {}) {
  const userCrops = (options.userCrops || []).map(c => c.toLowerCase());

  // 1. Initial fetch of crop rates
  await fetchRates(userCrops);

  // 2. Setup Socket.IO for live rate updates
  setupSocketListener(userCrops);

  // 3. Fallback polling every 15s in case socket drops
  setInterval(() => {
    if (!socket || !socket.connected) {
      fetchRates(userCrops);
    }
  }, 15000);
}

async function fetchRates(userCrops) {
  try {
    const res = await fetch('/api/rates');
    const data = await res.json();
    if (data.success && Array.isArray(data.rates)) {
      data.rates.forEach(r => currentRatesMap.set(r.rate_id, r));
      renderMarqueeTicker(data.rates, userCrops);
      renderRatesGrid(data.rates, userCrops);
    }
  } catch (err) {
    console.warn('Could not fetch crop rates:', err.message);
  }
}

/**
 * Render horizontal marquee ticker strip
 */
function renderMarqueeTicker(rates, userCrops) {
  const trackEl = document.getElementById('ticker-track');
  if (!trackEl) return;

  // Build ticker HTML items
  const renderItem = (r) => {
    const isMyCrop = userCrops.some(uc => r.crop_name.toLowerCase().includes(uc));
    const icon = getCropIcon(r.crop_name);
    const arrow = r.trend === 'up' ? '▲' : r.trend === 'down' ? '▼' : '▬';
    const changeSign = r.change_amount > 0 ? '+' : '';

    return `
      <div class="ticker-item ${isMyCrop ? 'my-crop' : ''}" data-rate-id="${r.rate_id}">
        <span class="crop-icon">${icon}</span>
        <span class="ticker-crop-name">${r.crop_name}</span>
        <span class="ticker-price">₹${formatPrice(r.price_per_quintal)}</span>
        <span class="ticker-change ${r.trend}">
          ${arrow} ${changeSign}${r.change_pct}%
        </span>
      </div>
    `;
  };

  const itemsHtml = rates.map(renderItem).join('');
  // Duplicate for seamless 100% infinite marquee loop
  trackEl.innerHTML = itemsHtml + itemsHtml;
}

/**
 * Render grid of stock-style price cards
 */
function renderRatesGrid(rates, userCrops) {
  const gridEl = document.getElementById('rates-grid');
  if (!gridEl) return;

  const searchInput = document.getElementById('crop-search-input');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const badgeEl = document.getElementById('crop-count-badge');

  // Attach search listener once
  if (searchInput && !searchInput.dataset.hasCropListener) {
    searchInput.dataset.hasCropListener = 'true';
    searchInput.addEventListener('input', () => {
      renderRatesGrid(Array.from(currentRatesMap.values()), userCrops);
    });
  }

  let list = rates;
  if (query) {
    list = list.filter(r => r.crop_name.toLowerCase().includes(query));
  }

  if (badgeEl) {
    badgeEl.innerHTML = `<span style="color: var(--primary-green);">●</span> Showing <strong>${list.length}</strong> of ${rates.length} Mandi Crops`;
  }

  if (list.length === 0) {
    gridEl.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2.5rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1.5px dashed var(--border-color); color: var(--text-muted);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
        <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.35rem;">No Crops Found</div>
        <div>No mandi benchmark rates matched "${query}". Clear search to view all crops.</div>
      </div>
    `;
    return;
  }

  gridEl.innerHTML = list.map(r => {
    const isMyCrop = userCrops.some(uc => r.crop_name.toLowerCase().includes(uc));
    const icon = getCropIcon(r.crop_name);
    const arrow = r.trend === 'up' ? '▲' : r.trend === 'down' ? '▼' : '▬';
    const changeSign = r.change_amount > 0 ? '+' : '';
    const diffSign = r.change_amount > 0 ? `+₹${formatPrice(r.change_amount)}` : (r.change_amount < 0 ? `-₹${formatPrice(Math.abs(r.change_amount))}` : '0.00');

    return `
      <div class="rate-card ${isMyCrop ? 'my-registered-crop' : ''}" id="rate-card-${r.rate_id}">
        <div class="rate-card-header">
          <span class="rate-crop-icon">${icon}</span>
          <div>
            <h4 class="rate-crop-name">${r.crop_name}</h4>
            <span class="rate-crop-unit">Mandi Benchmark Rate / Quintal</span>
          </div>
        </div>
        <div class="rate-price-row">
          <div class="rate-price-current">₹${formatPrice(r.price_per_quintal)}</div>
          <div class="rate-trend-badge ${r.trend}">
            ${arrow} ${changeSign}${r.change_pct}%
          </div>
        </div>
        <div class="rate-card-footer">
          <span>Prev: ₹${formatPrice(r.previous_price)} (${diffSign})</span>
          <span class="rate-time-ago">${timeAgo(r.updated_at)}</span>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Listen for live rate_update events from Socket.IO
 */
function setupSocketListener(userCrops) {
  if (typeof io === 'undefined') return;

  socket = io();

  socket.on('connect', () => {
    // Connected to real-time events
  });

  socket.on('rate_update', (updatedRate) => {
    currentRatesMap.set(updatedRate.rate_id, updatedRate);

    // 1. Update in the Card Grid
    const cardEl = document.getElementById(`rate-card-${updatedRate.rate_id}`);
    if (cardEl) {
      const isMyCrop = userCrops.some(uc => updatedRate.crop_name.toLowerCase().includes(uc));
      const icon = getCropIcon(updatedRate.crop_name);
      const arrow = updatedRate.trend === 'up' ? '▲' : updatedRate.trend === 'down' ? '▼' : '▬';
      const changeSign = updatedRate.change_amount > 0 ? '+' : '';
      const diffSign = updatedRate.change_amount > 0 ? `+₹${formatPrice(updatedRate.change_amount)}` : (updatedRate.change_amount < 0 ? `-₹${formatPrice(Math.abs(updatedRate.change_amount))}` : '0.00');

      cardEl.innerHTML = `
        <div class="rate-card-header">
          <span class="rate-crop-icon">${icon}</span>
          <div>
            <h4 class="rate-crop-name">${updatedRate.crop_name}</h4>
            <span class="rate-crop-unit">Mandi Benchmark Rate / Quintal</span>
          </div>
        </div>
        <div class="rate-price-row">
          <div class="rate-price-current">₹${formatPrice(updatedRate.price_per_quintal)}</div>
          <div class="rate-trend-badge ${updatedRate.trend}">
            ${arrow} ${changeSign}${updatedRate.change_pct}%
          </div>
        </div>
        <div class="rate-card-footer">
          <span>Prev: ₹${formatPrice(updatedRate.previous_price)} (${diffSign})</span>
          <span class="rate-time-ago">${timeAgo(updatedRate.updated_at)}</span>
        </div>
      `;

      // Trigger flash animation
      cardEl.classList.remove('flash-up', 'flash-down');
      void cardEl.offsetWidth; // Reflow
      cardEl.classList.add(updatedRate.trend === 'up' ? 'flash-up' : 'flash-down');
    }

    // 2. Re-render the Marquee Ticker
    const allRates = Array.from(currentRatesMap.values());
    renderMarqueeTicker(allRates, userCrops);
  });
}

window.AgriTicker = {
  initMandiTicker,
  getCropIcon,
  formatPrice
};
