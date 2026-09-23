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
    const isDark = theme === 'dark';
    const lightText = (window.AgriLang && typeof window.AgriLang.t === 'function')
      ? window.AgriLang.t('theme_light', 'Light Mode')
      : 'Light Mode';
    const darkText = (window.AgriLang && typeof window.AgriLang.t === 'function')
      ? window.AgriLang.t('theme_dark', 'Dark Mode')
      : 'Dark Mode';

    btns.forEach((btn) => {
      if (isDark) {
        btn.innerHTML = `<span class="btn-icon">☀️</span> <span data-i18n="theme_light">${lightText}</span>`;
        btn.setAttribute('aria-label', lightText);
        btn.setAttribute('title', lightText);
      } else {
        btn.innerHTML = `<span class="btn-icon">🌙</span> <span data-i18n="theme_dark">${darkText}</span>`;
        btn.setAttribute('aria-label', darkText);
        btn.setAttribute('title', darkText);
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

  // Listen for language change to update toggle text
  window.addEventListener('languageChanged', () => {
    updateToggleButtons(document.documentElement.getAttribute('data-theme') || 'light');
  });

  document.addEventListener('DOMContentLoaded', () => {
    updateToggleButtons(document.documentElement.getAttribute('data-theme') || 'light');
  });

  window.AgriTheme = {
    getPreferredTheme,
    applyTheme,
    toggleTheme,
    updateToggleButtons
  };
})();
