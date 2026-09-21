/* =========================================================================
   js/theme.js — light / dark theme controller
   The pre-paint bootstrap lives inline in every page's <head> (no flash of
   the wrong theme). This file only wires up the toggle button afterwards.
   Preference is stored under "vp-theme" ("light" | "dark"); if nothing is
   stored the OS / browser setting is followed live.
   ========================================================================= */
(function () {
  'use strict';

  var STORAGE_KEY = 'vp-theme';
  var root = document.documentElement;
  var prefersDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function readStored() {
    try {
      var value = window.localStorage.getItem(STORAGE_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch (error) {
      // Private mode / storage disabled: fall back to the system preference.
      return null;
    }
  }

  function systemTheme() {
    return prefersDark && prefersDark.matches ? 'dark' : 'light';
  }

  function currentTheme() {
    return readStored() || systemTheme();
  }

  function syncControls(theme) {
    var isDark = theme === 'dark';
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      var button = buttons[i];
      button.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      button.setAttribute(
        'aria-label',
        isDark ? 'Switch to light theme' : 'Switch to dark theme'
      );
      button.setAttribute('title', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    }
  }

  function applyTheme(theme, persist) {
    var isDark = theme === 'dark';
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';

    if (persist) {
      try {
        window.localStorage.setItem(STORAGE_KEY, theme);
      } catch (error) {
        /* storage unavailable — the choice simply is not remembered */
      }
    }

    syncControls(theme);

    // Let other widgets (e.g. the PID canvas) restyle themselves.
    window.dispatchEvent(
      new CustomEvent('vp:themechange', { detail: { theme: theme } })
    );
  }

  function toggleTheme() {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
  }

  // Delegated click handling: works no matter when the header is rendered.
  document.addEventListener('click', function (event) {
    var trigger = event.target.closest ? event.target.closest('[data-theme-toggle]') : null;
    if (trigger) {
      event.preventDefault();
      toggleTheme();
    }
  });

  // Follow the OS setting when the visitor has never chosen manually.
  if (prefersDark) {
    var onSystemChange = function () {
      if (!readStored()) {
        applyTheme(systemTheme(), false);
      }
    };
    if (typeof prefersDark.addEventListener === 'function') {
      prefersDark.addEventListener('change', onSystemChange);
    } else if (typeof prefersDark.addListener === 'function') {
      prefersDark.addListener(onSystemChange);
    }
  }

  // Keep the toggle state correct on load, after layout.js has rendered it.
  function init() {
    applyTheme(currentTheme(), false);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Small public surface, handy for debugging in the console.
  window.VPTheme = {
    get: currentTheme,
    set: function (theme) {
      applyTheme(theme === 'dark' ? 'dark' : 'light', true);
    },
    toggle: toggleTheme
  };
})();
