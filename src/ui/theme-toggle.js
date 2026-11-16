import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { isDark, toggleTheme } from '../utils/theme.js';

function labelFor(button) {
  const dark = isDark();
  if (button.dataset.compact === '1') return dark ? 'Terang' : 'Gelap';
  return dark ? 'Mode terang' : 'Mode gelap';
}

function syncLabels() {
  for (const button of document.querySelectorAll('[data-theme-toggle]')) {
    const label = button.querySelector('.theme-label');
    if (label) label.textContent = labelFor(button);
    button.setAttribute('aria-pressed', String(isDark()));
    button.setAttribute('aria-label', isDark() ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');
    button.title = isDark() ? 'Aktifkan mode terang' : 'Aktifkan mode gelap';
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
    h(
      'span',
      { class: 'theme-glyph', 'aria-hidden': 'true' },
      icon('sun', { size: 15, className: 'theme-sun' }),
      icon('moon', { size: 15, className: 'theme-moon' }),
    ),
    h('span', { class: 'theme-label' }, labelFor({ dataset: { compact: compact ? '1' : '0' } })),
  );
  button.dataset.themeToggle = '';
  button.dataset.compact = compact ? '1' : '0';
  button.setAttribute('aria-pressed', String(isDark()));
  button.title = isDark() ? 'Aktifkan mode terang' : 'Aktifkan mode gelap';
  return button;
}
