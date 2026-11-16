import { h } from './dom.js';
import { placeholderTone } from './format.js';
import { icon } from './icons.js';

let toastStack = null;
const TOAST_ICONS = { success: 'check', error: 'alert', info: 'info' };
const TOAST_DURATION = 4200;

export function toast(message, type = 'info') {
  if (!toastStack) {
    toastStack = h('div', { class: 'toast-stack', role: 'status', 'aria-live': 'polite' });
    document.body.append(toastStack);
  }

  let timer;
  let remaining = TOAST_DURATION;
  let startedAt = Date.now();

  const dismiss = () => {
    window.clearTimeout(timer);
    if (!node.isConnected || node.classList.contains('is-leaving')) return;
    node.classList.add('is-leaving');
    window.setTimeout(() => node.remove(), 220);
  };

  const node = h(
    'div',
    { class: `toast ${type}`, role: type === 'error' ? 'alert' : 'status' },
    h('span', { class: 'toast-icon', 'aria-hidden': 'true' }, icon(TOAST_ICONS[type] || 'info', { size: 16 })),
    h('p', { class: 'toast-message' }, message),
    h(
      'button',
      { class: 'toast-close', type: 'button', 'aria-label': 'Tutup notifikasi', onClick: dismiss },
      '×',
    ),
    h('span', { class: 'toast-progress', 'aria-hidden': 'true' }),
  );

  while (toastStack.children.length >= 4) toastStack.firstElementChild.remove();
  toastStack.append(node);

  timer = window.setTimeout(dismiss, remaining);
  node.addEventListener('mouseenter', () => {
    window.clearTimeout(timer);
    remaining = Math.max(1200, remaining - (Date.now() - startedAt));
  });
  node.addEventListener('mouseleave', () => {
    startedAt = Date.now();
    timer = window.setTimeout(dismiss, remaining);
  });
}

export function openDialog({ title, subtitle, body, actions = [], width, onClose }) {
  let dialog;
  const close = () => {
    if (!dialog?.open || dialog.classList.contains('is-closing')) return;
    dialog.classList.add('is-closing');
    window.setTimeout(() => dialog.close(), 150);
  };

  dialog = h(
    'dialog',
    { 'aria-label': title, style: width ? { width } : undefined },
    h(
      'div',
      { class: 'dialog-head' },
      h(
        'div',
        null,
        h('h2', null, title),
        subtitle ? h('p', null, subtitle) : null,
      ),
      h('button', { class: 'btn ghost icon', type: 'button', 'aria-label': 'Tutup dialog', onClick: close }, '×'),
    ),
    h('div', { class: 'dialog-body' }, body),
    actions.length ? h('div', { class: 'dialog-foot' }, actions) : null,
  );

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('close', () => {
    dialog.remove();
    onClose?.();
  });
  document.body.append(dialog);
  dialog.showModal();
  return dialog;
}

export function confirmAction({ title, message, confirmLabel = 'Ya, lanjutkan', danger = true }) {
  return new Promise((resolve) => {
    let confirmed = false;
    let dialog;
    dialog = openDialog({
      title,
      body: h('p', { class: 'muted' }, message),
      actions: [
        h('button', { class: 'btn outline', type: 'button', onClick: () => dialog.close() }, 'Batal'),
        h(
          'button',
          {
            class: `btn ${danger ? 'danger' : 'primary'}`,
            type: 'button',
            onClick: () => {
              confirmed = true;
              dialog.close();
            },
          },
          confirmLabel,
        ),
      ],
      onClose: () => resolve(confirmed),
    });
  });
}

export function field(labelText, control, hint) {
  return h(
    'div',
    { class: 'field' },
    h('label', { for: control.id }, labelText),
    control,
    hint ? h('span', { class: 'hint' }, hint) : null,
  );
}

export function productThumb(product) {
  const box = h('span', { class: `thumb tone-${placeholderTone(`${product.id}${product.kategori}`)}` });
  if (typeof product.imageUrl === 'string' && product.imageUrl.startsWith('data:image/')) {
    box.append(h('img', { src: product.imageUrl, alt: '' }));
  } else {
    box.textContent = 'HH';
  }
  return box;
}

export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File harus berupa gambar JPG, PNG, atau WebP.'));
      return;
    }
    if (file.size > 1024 * 1024) {
      reject(new Error('Ukuran foto maksimal 1 MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Foto gagal dibaca. Coba file lain.'));
    reader.readAsDataURL(file);
  });
}
