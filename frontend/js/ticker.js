// frontend/js/ticker.js
// Renders the live stock-market style Mandi ticker and price cards with real-time Socket.IO updates

let socket = null;
let currentRatesMap = new Map();
let currentUserCrops = [];

function updateTickerLabels() {
  const t = (k, f) => (window.AgriLang && typeof window.AgriLang.t === 'function' ? window.AgriLang.t(k, f) : f);
  const tickerLabel = t('ticker_live_mandi', '🔴 LIVE MANDI');
  document.querySelectorAll('.ticker-strip-wrapper').forEach(w => {
    w.setAttribute('data-ticker-label', tickerLabel);
  });
  document.querySelectorAll('.ticker-badge, #ticker-badge').forEach(b => {
    b.textContent = tickerLabel;
  });
}

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
  const t = (k, f) => (window.AgriLang && typeof window.AgriLang.t === 'function' ? window.AgriLang.t(k, f) : f);
  if (!dateString) return t('time_just_now', 'Just now');
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (seconds < 15) return t('time_just_now', 'Just now');
  if (seconds < 60) return `${seconds} ${t('time_sec_ago', 's ago')}`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} ${t('time_min_ago', 'm ago')}`;
  const hours = Math.floor(mins / 60);
  return `${hours} ${t('time_hour_ago', 'h ago')}`;
}

/**
 * Initialize Ticker
 * @param {Object} options
 * @param {string[]} [options.userCrops=[]] - List of crops the logged-in farmer grows
 */
async function initMandiTicker(options = {}) {
  currentUserCrops = (options.userCrops || []).map(c => c.toLowerCase());
  const userCrops = currentUserCrops;
  updateTickerLabels();

  // 1. Initial fetch of crop rates
  await fetchRates(userCrops);

  // 2. Setup Socket.IO for live rate updates
  setupSocketListener(userCrops);

  // 3. Fallback smart polling every 28s (~25-30s) if WebSocket is unavailable or disconnected
  setInterval(() => {
    if (!socket || !socket.connected) {
      fetchRates(currentUserCrops);
    }
  }, 28000);
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
function renderMarqueeTicker(rates, userCrops = currentUserCrops) {
  const trackEl = document.getElementById('ticker-track');
  if (!trackEl) return;

  if (Array.isArray(rates) && rates.length > 0) {
    rates.forEach(r => currentRatesMap.set(r.rate_id, r));
  }
  const rateList = (Array.isArray(rates) && rates.length > 0) ? rates : Array.from(currentRatesMap.values());
  if (rateList.length === 0) return;

  const currentLang = (window.AgriLang && typeof window.AgriLang.getLanguage === 'function')
    ? window.AgriLang.getLanguage()
    : 'en';

  const t = (k, f) => (window.AgriLang && typeof window.AgriLang.t === 'function' ? window.AgriLang.t(k, f) : f);
  updateTickerLabels();

  // Build ticker HTML items
  const renderItem = (r) => {
    const isMyCrop = (userCrops || []).some(uc => r.crop_name.toLowerCase().includes(uc));
    const icon = getCropIcon(r.crop_name);
    const arrow = r.trend === 'up' ? '▲' : r.trend === 'down' ? '▼' : '▬';
    const changeSign = r.change_amount > 0 ? '+' : '';
    const trendText = r.trend === 'up'
      ? t('ticker_increase', 'Increase')
      : (r.trend === 'down' ? t('ticker_decrease', 'Decrease') : t('ticker_no_change', 'No Change'));
    const priceText = t('ticker_price', 'Price');
    const displayCrop = (window.AgriLang && typeof window.AgriLang.tCrop === 'function')
      ? window.AgriLang.tCrop(r.crop_name, currentLang)
      : r.crop_name;

    return `
      <div class="ticker-item ${isMyCrop ? 'my-crop' : ''}" data-rate-id="${r.rate_id}" title="${displayCrop}: ${priceText} ₹${formatPrice(r.price_per_quintal)} (${trendText})">
        <span class="crop-icon">${icon}</span>
        <span class="ticker-crop-name" data-crop-raw="${r.crop_name}">${displayCrop}</span>
        <span class="ticker-price" title="${priceText}">₹${formatPrice(r.price_per_quintal)}</span>
        <span class="ticker-change ${r.trend}" title="${trendText}" aria-label="${trendText}">
          ${arrow} ${changeSign}${r.change_pct}%
        </span>
      </div>
    `;
  };

  const itemsHtml = rateList.map(renderItem).join('');
  // Duplicate for seamless 100% infinite marquee loop
  trackEl.innerHTML = itemsHtml + itemsHtml;

  // Synchronously ensure all items are translated to active language
  translateTickerItems(currentLang);
}

/**
 * Translates crop names and tooltips in the marquee ticker in-place
 * without disrupting ongoing CSS animation.
 */
function translateTickerItems(lang) {
  const currentLang = lang || (window.AgriLang && typeof window.AgriLang.getLanguage === 'function' ? window.AgriLang.getLanguage() : 'en');
  const t = (k, f) => (window.AgriLang && typeof window.AgriLang.t === 'function' ? window.AgriLang.t(k, f) : f);
  const priceText = t('ticker_price', 'Price');

  const trackEl = document.getElementById('ticker-track');
  if (!trackEl || typeof trackEl.querySelectorAll !== 'function') return;

  const cropElements = trackEl.querySelectorAll('.ticker-crop-name, [data-crop-raw]');
  cropElements.forEach(el => {
    let raw = el.getAttribute('data-crop-raw');
    if (!raw) {
      raw = el.textContent.trim();
      el.setAttribute('data-crop-raw', raw);
    }
    const translated = (window.AgriLang && typeof window.AgriLang.tCrop === 'function')
      ? window.AgriLang.tCrop(raw, currentLang)
      : raw;
    el.textContent = translated;

    // Synchronize parent .ticker-item title tooltip
    const parentItem = el.closest('.ticker-item');
    if (parentItem) {
      const priceEl = parentItem.querySelector('.ticker-price');
      const changeEl = parentItem.querySelector('.ticker-change');
      const priceVal = priceEl ? priceEl.textContent.trim() : '';
      const isUp = changeEl && (changeEl.classList && typeof changeEl.classList.contains === 'function' ? changeEl.classList.contains('up') : String(changeEl.className || '').includes('up'));
      const isDown = changeEl && (changeEl.classList && typeof changeEl.classList.contains === 'function' ? changeEl.classList.contains('down') : String(changeEl.className || '').includes('down'));
      const trendText = isUp ? t('ticker_increase', 'Increase') : (isDown ? t('ticker_decrease', 'Decrease') : t('ticker_no_change', 'No Change'));
      parentItem.setAttribute('title', `${translated}: ${priceText} ${priceVal} (${trendText})`);
    }
  });
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
    list = list.filter(r => {
      const enName = r.crop_name.toLowerCase();
      const teName = (window.AgriLang && typeof window.AgriLang.tCrop === 'function' ? window.AgriLang.tCrop(r.crop_name, 'te') : '').toLowerCase();
      const hiName = (window.AgriLang && typeof window.AgriLang.tCrop === 'function' ? window.AgriLang.tCrop(r.crop_name, 'hi') : '').toLowerCase();
      return enName.includes(query) || teName.includes(query) || hiName.includes(query);
    });
  }

  const t = (k, f) => (window.AgriLang && typeof window.AgriLang.t === 'function' ? window.AgriLang.t(k, f) : f);

  if (badgeEl) {
    const showingText = t('rates_showing_prefix', 'Showing');
    const ofText = t('rates_of', 'of');
    const cropsText = t('rates_mandi_crops', 'Mandi Crops');
    badgeEl.innerHTML = `<span style="color: var(--primary-green);">●</span> ${showingText} <strong>${list.length}</strong> ${ofText} ${rates.length} ${cropsText}`;
  }

  if (list.length === 0) {
    gridEl.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2.5rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1.5px dashed var(--border-color); color: var(--text-muted);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
        <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.35rem;">${t('rates_no_crops', 'No Crops Found')}</div>
        <div>${t('rates_no_crops_sub', 'No mandi benchmark rates matched your search. Clear search to view all crops.')}</div>
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
    const displayCrop = (window.AgriLang && typeof window.AgriLang.tCrop === 'function')
      ? window.AgriLang.tCrop(r.crop_name)
      : r.crop_name;

    return `
      <div class="rate-card ${isMyCrop ? 'my-registered-crop' : ''}" id="rate-card-${r.rate_id}">
        <div class="rate-card-header">
          <span class="rate-crop-icon">${icon}</span>
          <div>
            <h4 class="rate-crop-name" data-crop-raw="${r.crop_name}">${displayCrop}</h4>
            <span class="rate-crop-unit">${t('label_mandi_benchmark_rate', 'Mandi Benchmark Rate / Quintal')}</span>
          </div>
        </div>
        <div class="rate-price-row">
          <div class="rate-price-current">₹${formatPrice(r.price_per_quintal)}</div>
          <div class="rate-trend-badge ${r.trend}">
            ${arrow} ${changeSign}${r.change_pct}%
          </div>
        </div>
        <div class="rate-card-footer">
          <span>${t('label_prev', 'Prev')}: ₹${formatPrice(r.previous_price)} (${diffSign})</span>
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

  try {
    socket = io({
      timeout: 4000,
      reconnectionAttempts: 3,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      // Connected to real-time events
    });

    socket.on('connect_error', () => {
      // Socket failed (e.g. on serverless Vercel): fallback polling takes over seamlessly
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
      const t = (k, f) => (window.AgriLang && typeof window.AgriLang.t === 'function' ? window.AgriLang.t(k, f) : f);
      const displayCrop = (window.AgriLang && typeof window.AgriLang.tCrop === 'function')
        ? window.AgriLang.tCrop(updatedRate.crop_name)
        : updatedRate.crop_name;

      cardEl.innerHTML = `
        <div class="rate-card-header">
          <span class="rate-crop-icon">${icon}</span>
          <div>
            <h4 class="rate-crop-name" data-crop-raw="${updatedRate.crop_name}">${displayCrop}</h4>
            <span class="rate-crop-unit">${t('label_mandi_benchmark_rate', 'Mandi Benchmark Rate / Quintal')}</span>
          </div>
        </div>
        <div class="rate-price-row">
          <div class="rate-price-current">₹${formatPrice(updatedRate.price_per_quintal)}</div>
          <div class="rate-trend-badge ${updatedRate.trend}">
            ${arrow} ${changeSign}${updatedRate.change_pct}%
          </div>
        </div>
        <div class="rate-card-footer">
          <span>${t('label_prev', 'Prev')}: ₹${formatPrice(updatedRate.previous_price)} (${diffSign})</span>
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
    renderMarqueeTicker(allRates, currentUserCrops);
  });
  } catch (err) {
    // Graceful fallback to smart polling
  }
}

// Re-render ticker and rates grid on language change
window.addEventListener('languageChanged', (e) => {
  const lang = (e && e.detail && e.detail.lang) ? e.detail.lang : (window.AgriLang && typeof window.AgriLang.getLanguage === 'function' ? window.AgriLang.getLanguage() : 'en');
  updateTickerLabels();
  translateTickerItems(lang);
  const allRates = Array.from(currentRatesMap.values());
  if (allRates.length > 0) {
    if (document.getElementById('ticker-track')) {
      renderMarqueeTicker(allRates, currentUserCrops);
    }
    if (document.getElementById('rates-grid')) {
      renderRatesGrid(allRates, currentUserCrops);
    }
  }
});

window.AgriTicker = {
  initMandiTicker,
  getCropIcon,
  formatPrice,
  updateTickerLabels,
  renderMarqueeTicker,
  translateTickerItems
};
