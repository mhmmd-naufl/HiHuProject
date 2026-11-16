import { h } from '../utils/dom.js';
import { formatPhone, ROLE_LABEL } from '../utils/format.js';
import { store } from '../data/store.js';
import { DEMO_ACCOUNTS } from '../data/seed.js';
import { homePath } from '../ui/shell.js';
import { createThemeToggle } from '../ui/theme-toggle.js';

export function createLoginView() {
  const errorBox = h('div', { class: 'form-error', role: 'alert', hidden: true });

  const phoneInput = h('input', {
    class: 'input',
    id: 'login-phone',
    type: 'tel',
    name: 'phone',
    inputmode: 'tel',
    autocomplete: 'username',
    placeholder: '0812 3450 0002',
    required: true,
  });

  const passwordInput = h('input', {
    class: 'input',
    id: 'login-password',
    type: 'password',
    name: 'password',
    autocomplete: 'current-password',
    placeholder: 'Kata sandi',
    required: true,
  });

  const submitButton = h('button', { class: 'btn primary block', type: 'submit' }, 'Masuk');

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = !message;
  }

  function attempt(phone, password) {
    const result = store.login(phone, password);
    if (!result.ok) {
      showError(result.error);
      return;
    }
    showError('');
    location.hash = `#${homePath(result.user.role)}`;
  }

  const form = h(
    'form',
    {
      class: 'form-grid',
      novalidate: true,
      onSubmit: (event) => {
        event.preventDefault();
        if (!phoneInput.value.trim() || !passwordInput.value) {
          showError('Isi nomor HP dan kata sandi terlebih dahulu.');
          return;
        }
        attempt(phoneInput.value, passwordInput.value);
      },
    },
    h('div', { class: 'field' }, h('label', { for: 'login-phone' }, 'Nomor HP'), phoneInput),
    h('div', { class: 'field' }, h('label', { for: 'login-password' }, 'Kata sandi'), passwordInput),
    errorBox,
    submitButton,
  );

  const demoList = h(
    'div',
    { class: 'demo-list' },
    ...DEMO_ACCOUNTS.map((account) =>
      h(
        'button',
        {
          class: 'demo-account',
          type: 'button',
          onClick: () => {
            phoneInput.value = account.phone;
            passwordInput.value = account.password;
            attempt(account.phone, account.password);
          },
        },
        h(
          'span',
          null,
          h('strong', null, account.nama),
          h('span', null, formatPhone(account.phone)),
        ),
        h('span', { class: `role-pill ${account.role}` }, ROLE_LABEL[account.role]),
      ),
    ),
  );

  return h(
    'div',
    { class: 'auth' },
    createThemeToggle({ className: 'auth-theme' }),
    h(
      'section',
      { class: 'auth-brand' },
      h(
        'a',
        { class: 'brand', href: '#/login' },
        h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'HH'),
        h('span', null, h('span', { class: 'brand-name', style: { color: '#fff' } }, 'HiHuJoki')),
      ),
      h(
        'div',
        null,
        h('p', { class: 'eyebrow', style: { color: '#9ed3b8' } }, 'Katalog layanan akademik'),
        h('h1', null, 'Satu tempat untuk jualan, kelola, dan cari pendampingan.'),
        h(
          'p',
          null,
          'Admin memantau performa toko, seller mengelola produk dan kategori, pembeli menemukan produk lalu menghubungi lewat WhatsApp.',
        ),
      ),
      h(
        'div',
        { class: 'auth-points' },
        h('div', { class: 'auth-point' }, h('b', null, 'Admin.'), ' Dashboard, pengguna, dan analitik dalam satu tampilan.'),
        h('div', { class: 'auth-point' }, h('b', null, 'Seller.'), ' Tambah produk, atur stok, unggulan, foto, dan kategori.'),
        h('div', { class: 'auth-point' }, h('b', null, 'Pembeli.'), ' Cari produk, lihat detail, lalu hubungi via WhatsApp.'),
        h('p', { class: 'small', style: { color: '#8e9a92', marginTop: '20px' } }, 'Demo lokal · data tersimpan di localStorage browser.'),
      ),
    ),
    h(
      'section',
      { class: 'auth-form-wrap' },
      h(
        'div',
        { class: 'auth-card' },
        h('h2', null, 'Masuk ke HiHuJoki'),
        h('p', { class: 'muted', style: { marginTop: '6px' } }, 'Masuk dengan nomor HP yang terdaftar, atau pilih akun demo di bawah.'),
        h('div', { style: { marginTop: '22px' } }, form),
        h(
          'div',
          { class: 'demo-box' },
          h('div', { class: 'section-label' }, 'Akun demo · klik untuk masuk'),
          demoList,
        ),
        h(
          'p',
          { class: 'small muted', style: { marginTop: '16px' } },
          'Autentikasi demo berjalan di browser tanpa server. Jangan gunakan kata sandi asli.',
        ),
      ),
    ),
  );
}
