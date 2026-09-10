// frontend/js/theme.js
// AgriConnect Dark Theme Manager

(function () {
  const THEME_KEY = 'theme';

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateToggleButtons(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }

  function updateToggleButtons(theme) {
    const btns = document.querySelectorAll('.theme-toggle-btn');
    btns.forEach((btn) => {
      if (theme === 'dark') {
        btn.innerHTML = '<span class="btn-icon">☀️</span> <span>Light Mode</span>';
        btn.setAttribute('aria-label', 'Switch to Light Mode');
      } else {
        btn.innerHTML = '<span class="btn-icon">🌙</span> <span>Dark Mode</span>';
        btn.setAttribute('aria-label', 'Switch to Dark Mode');
      }
    });
  }

  // Apply immediately upon execution to prevent FOUC
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  // Listen for system theme changes if no explicit user override
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_KEY)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateToggleButtons(document.documentElement.getAttribute('data-theme') || 'light');
  });

  window.AgriTheme = {
    getPreferredTheme,
    applyTheme,
    toggleTheme
  };
})();
