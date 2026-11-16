const KEY = 'hihujoki.theme.v1';

export function preferredTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* storage bisa tidak tersedia */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function isDark() {
  return document.documentElement.dataset.theme === 'dark';
}

export function initTheme() {
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : preferredTheme());
}

export function toggleTheme() {
  const next = isDark() ? 'light' : 'dark';
  applyTheme(next);
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* pilihan tetap berlaku di sesi ini */
  }
  return next;
}
