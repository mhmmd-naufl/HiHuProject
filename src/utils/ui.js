import { h } from './dom.js';
import { placeholderTone } from './format.js';

let toastStack = null;

export function toast(message, type = 'info') {
  if (!toastStack) {
    toastStack = h('div', { class: 'toast-stack', role: 'status', 'aria-live': 'polite' });
    document.body.append(toastStack);
  }
  const node = h('div', { class: `toast ${type}` }, message);
  toastStack.append(node);
  window.setTimeout(() => node.remove(), 3800);
}

export function openDialog({ title, subtitle, body, actions = [], width, onClose }) {
  let dialog;
  const close = () => {
    if (dialog?.open) dialog.close();
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
