// frontend/js/centres-directory.js
// Renders and manages the interactive Pan-India Mandis Directory on the website

(function () {
  let allCentres = [];
  let allStates = [];

  function formatTime(timeStr) {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${m} ${ampm}`;
  }

  async function loadMandis() {
    const grid = document.getElementById('mandis-container');
    const stateSelect = document.getElementById('mandi-state-filter');

    if (!grid) return;

    try {
      const [centresRes, statesRes] = await Promise.all([
        fetch('/api/centres'),
        fetch('/api/centres/states')
      ]);

      const centresData = await centresRes.json();
      const statesData = await statesRes.json();

      if (centresData.success && Array.isArray(centresData.centres)) {
        allCentres = centresData.centres.filter(c => c.state && c.city);
      }

      if (statesData.success && Array.isArray(statesData.states)) {
        allStates = statesData.states;
        if (stateSelect) {
          stateSelect.innerHTML = '<option value="">All States (Pan-India)</option>' +
            allStates.map(s => `<option value="${s}">${s}</option>`).join('');
        }
      }

      renderMandisGrid();
    } catch (err) {
      console.error('Failed to load mandis:', err);
      if (grid) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--danger);">Failed to load procurement mandis. Please refresh the page.</div>';
      }
    }
  }

  function renderMandisGrid() {
    const grid = document.getElementById('mandis-container');
    const stateSelect = document.getElementById('mandi-state-filter');
    const searchInput = document.getElementById('mandi-search-input');
    const badge = document.getElementById('mandi-count-badge');

    if (!grid) return;

    const selectedState = stateSelect ? stateSelect.value.trim() : '';
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let list = allCentres;

    if (selectedState) {
      list = list.filter(c => c.state === selectedState);
    }

    if (query) {
      list = list.filter(c => 
        (c.centre_name && c.centre_name.toLowerCase().includes(query)) ||
        (c.city && c.city.toLowerCase().includes(query)) ||
        (c.state && c.state.toLowerCase().includes(query)) ||
        (c.location && c.location.toLowerCase().includes(query))
      );
    }

    if (badge) {
      badge.innerHTML = `<span style="color: var(--primary-green);">●</span> Showing <strong>${list.length}</strong> of ${allCentres.length} Mandis`;
    }

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1.5px dashed var(--border-color); color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
          <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.35rem;">No Mandis Found</div>
          <div>No procurement centres matched "${query || selectedState}". Try selecting another state or clearing the search.</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map(c => `
      <div class="mandi-directory-card">
        <div>
          <div class="mandi-card-header">
            <span class="mandi-state-badge">${escapeHtml(c.state)}</span>
            <span class="mandi-city-tag">📍 ${escapeHtml(c.city)}</span>
          </div>
          <h3 class="mandi-card-title">${escapeHtml(c.centre_name)}</h3>
          <div class="mandi-card-location">
            <span>📌</span> <span>${escapeHtml(c.location || `${c.city}, ${c.state}`)}</span>
          </div>
          <div class="mandi-card-meta">
            <div class="mandi-card-meta-item">
              <span>📦</span> <span><strong>Capacity:</strong> ${c.daily_capacity || 60} farmers/day</span>
            </div>
            <div class="mandi-card-meta-item">
              <span>🕒</span> <span><strong>Hours:</strong> ${formatTime(c.opening_time)} - ${formatTime(c.closing_time)}</span>
            </div>
          </div>
        </div>
        <div>
          <button type="button" class="btn btn-secondary btn-block" onclick="window.AgriMandis.selectMandiAndBook(${c.centre_id})" style="font-size: 0.85rem; padding: 0.55rem 0.8rem;">
            Book Slot at this Mandi →
          </button>
        </div>
      </div>
    `).join('');
  }

  function escapeHtml(str = '') {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function selectMandiAndBook(centreId) {
    const user = AgriAuth.getStoredUser();
    const token = AgriAuth.getAuthToken();

    if (token && user && user.role === 'farmer') {
      window.location.href = `/dashboard.html?centre_id=${centreId}`;
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const loginPhone = document.getElementById('login-phone');
      if (loginPhone) loginPhone.focus();
      AgriAuth.showToast('Please log in or register as a farmer to book your slot at this Mandi.', 'alert');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const stateFilter = document.getElementById('mandi-state-filter');
    const searchInput = document.getElementById('mandi-search-input');

    if (stateFilter) {
      stateFilter.addEventListener('change', renderMandisGrid);
    }
    if (searchInput) {
      searchInput.addEventListener('input', renderMandisGrid);
    }

    loadMandis();
  });

  window.AgriMandis = {
    loadMandis,
    renderMandisGrid,
    selectMandiAndBook
  };
})();
