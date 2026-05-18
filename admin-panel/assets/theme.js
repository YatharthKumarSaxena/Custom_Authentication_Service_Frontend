/**
 * Theme Management Module
 * Handles dark/light theme switching for admin panel
 * Respects system preferences and persists user choice
 */

// Configuration constants
const THEME_KEY = 'adminPanelTheme';
const THEME_SOURCE_KEY = 'adminPanelThemeSource';
const SYSTEM_PREFERENCE = window.matchMedia('(prefers-color-scheme: dark)');

/**
 * Initialize theme on page load
 * Loads saved preference or defaults to system preference
 */
function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const storedTheme = savedTheme || (SYSTEM_PREFERENCE.matches ? 'dark' : 'light');
  
  console.debug(`🎨 Initializing theme: ${storedTheme} (from ${savedTheme ? 'localStorage' : 'system preference'})`);
  setTheme(storedTheme, savedTheme ? 'user' : 'system');
  setupThemeToggle();
}

/**
 * Apply theme to document
 * Updates data-theme attribute and saves preference
 * @param {string} theme - Theme name: 'dark' or 'light'
 * @param {string} source - Theme source: 'user' or 'system'
 */
function setTheme(theme, source = 'user') {
  const html = document.documentElement;
  html.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  localStorage.setItem(THEME_SOURCE_KEY, source);
  console.log(`🎨 Theme changed to: ${theme}`);
  updateThemeIcon(theme);
}

/**
 * Toggle between light and dark themes
 * Switches from current theme to opposite
 */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  console.log(`🔄 Theme toggle: ${current} → ${newTheme}`);
  setTheme(newTheme);
}

/**
 * Update theme toggle button icon
 * Shows appropriate icon based on current theme
 * @param {string} theme - Current theme ('dark' or 'light')
 */
function updateThemeIcon(theme) {
  const toggleBtns = document.querySelectorAll('#themeToggle');
  toggleBtns.forEach(btn => {
    const icon = btn.querySelector('.material-icons');
    if (icon) {
      icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    }
  });
}

/**
 * Setup theme toggle button listeners
 * Attaches click handlers and system preference change listener
 */
function setupThemeToggle() {
  const toggleBtns = document.querySelectorAll('#themeToggle');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
  
  // Listen for system preference changes
  const handleSystemChange = (e) => {
    if (localStorage.getItem(THEME_SOURCE_KEY) === 'user') {
      return;
    }

    const newTheme = e.matches ? 'dark' : 'light';
    console.log(`🔄 System preference changed to: ${newTheme}`);
    setTheme(newTheme, 'system');
  };

  if (typeof SYSTEM_PREFERENCE.addEventListener === 'function') {
    SYSTEM_PREFERENCE.addEventListener('change', handleSystemChange);
  } else if (typeof SYSTEM_PREFERENCE.addListener === 'function') {
    SYSTEM_PREFERENCE.addListener(handleSystemChange);
  }
}

// Initialize theme when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTheme);
} else {
  initializeTheme();
}

console.log('✅ Theme module loaded');
