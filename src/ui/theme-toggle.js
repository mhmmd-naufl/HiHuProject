import { h } from '../utils/dom.js';
import { isDark, toggleTheme } from '../utils/theme.js';

function labelFor(button) {
  const dark = isDark();
  if (button.dataset.compact === '1') return dark ? 'Terang' : 'Gelap';
  return dark ? 'Mode terang' : 'Mode gelap';
}

function syncLabels() {
  for (const button of document.querySelectorAll('[data-theme-toggle]')) {
    button.textContent = labelFor(button);
    button.setAttribute('aria-pressed', String(isDark()));
    button.setAttribute('aria-label', isDark() ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');
  }
}

export function createThemeToggle({ compact = false, className = '' } = {}) {
  const button = h(
    'button',
    {
      class: `btn outline sm theme-toggle ${className}`.trim(),
      type: 'button',
      onClick: () => {
        toggleTheme();
        syncLabels();
      },
    },
    labelFor({ dataset: { compact: compact ? '1' : '0' } }),
  );
  button.dataset.themeToggle = '';
  button.dataset.compact = compact ? '1' : '0';
  button.setAttribute('aria-pressed', String(isDark()));
  return button;
}
