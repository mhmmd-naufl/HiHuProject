import { h } from '../utils/dom.js';
import { formatPhone, number, ROLE_LABEL } from '../utils/format.js';
import { icon } from '../utils/icons.js';
import { store } from '../data/store.js';
import { DEMO_ACCOUNTS } from '../data/seed.js';
import { homePath } from '../ui/shell.js';
import { createThemeToggle } from '../ui/theme-toggle.js';

export function createLoginView() {
  const errorBox = h('div', { class: 'form-error', role: 'alert', hidden: true });
  let busy = false;
  let passwordVisible = false;

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

  const passwordAction = h(
    'button',
    {
      class: 'input-action',
      type: 'button',
      'aria-label': 'Tampilkan kata sandi',
      'aria-pressed': 'false',
      onClick: () => {
        passwordVisible = !passwordVisible;
        passwordInput.type = passwordVisible ? 'text' : 'password';
        passwordAction.replaceChildren(icon(passwordVisible ? 'eyeOff' : 'eye', { size: 17 }));
        passwordAction.setAttribute('aria-label', passwordVisible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
        passwordAction.setAttribute('aria-pressed', String(passwordVisible));
        passwordInput.focus({ preventScroll: true });
      },
    },
    icon('eye', { size: 17 }),
  );

  const submitLabel = h('span', { class: 'btn-label' }, 'Masuk');
  const submitButton = h(
    'button',
    { class: 'btn primary block auth-submit', type: 'submit' },
    h('span', { class: 'btn-spinner', 'aria-hidden': 'true' }),
    submitLabel,
    h('span', { class: 'btn-arrow', 'aria-hidden': 'true' }, icon('arrow', { size: 16 })),
  );

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = !message;
    if (message) {
      errorBox.classList.remove('is-shaking');
      void errorBox.offsetWidth;
      errorBox.classList.add('is-shaking');
    }
  }

  function setBusy(value) {
    busy = value;
    submitButton.disabled = value;
    submitButton.dataset.loading = value ? '1' : '0';
    submitLabel.textContent = value ? 'Memeriksa…' : 'Masuk';
  }

  function attempt(phone, password) {
    if (busy) return;
    const result = store.login(phone, password);
    if (!result.ok) {
      showError(result.error);
      passwordInput.select();
      return;
    }
    showError('');
    setBusy(true);
    window.setTimeout(() => {
      location.hash = `#${homePath(result.user.role)}`;
    }, 420);
  }

  const form = h(
    'form',
    {
      class: 'form-grid auth-form',
      novalidate: true,
      onSubmit: (event) => {
        event.preventDefault();
        if (!phoneInput.value.trim() || !passwordInput.value) {
          showError('Isi nomor HP dan kata sandi terlebih dahulu.');
          (!phoneInput.value.trim() ? phoneInput : passwordInput).focus();
          return;
        }
        attempt(phoneInput.value, passwordInput.value);
      },
    },
    h(
      'div',
      { class: 'field' },
      h('label', { for: 'login-phone' }, 'Nomor HP'),
      h('div', { class: 'input-affix' }, phoneInput),
    ),
    h(
      'div',
      { class: 'field' },
      h('label', { for: 'login-password' }, 'Kata sandi'),
      h('div', { class: 'input-affix password-affix' }, passwordInput, passwordAction),
    ),
    errorBox,
    submitButton,
  );

  const demoList = h(
    'div',
    { class: 'demo-list' },
    ...DEMO_ACCOUNTS.map((account, index) =>
      h(
        'button',
        {
          class: 'demo-account',
          type: 'button',
          style: { '--delay': `${index * 70}ms` },
          onClick: () => {
            phoneInput.value = account.phone;
            passwordInput.value = account.password;
            attempt(account.phone, account.password);
          },
        },
        h(
          'span',
          { class: 'demo-avatar', 'aria-hidden': 'true' },
          account.nama
            .split(' ')
            .slice(0, 2)
            .map((part) => part[0])
            .join(''),
        ),
        h(
          'span',
          { class: 'demo-copy' },
          h('strong', null, account.nama),
          h('span', null, formatPhone(account.phone)),
        ),
        h('span', { class: `role-pill ${account.role}` }, ROLE_LABEL[account.role]),
        h('span', { class: 'demo-arrow', 'aria-hidden': 'true' }, icon('arrow', { size: 14 })),
      ),
    ),
  );

  return h(
    'div',
    { class: 'auth' },
    h('span', { class: 'auth-orb orb-one', 'aria-hidden': 'true' }),
    h('span', { class: 'auth-orb orb-two', 'aria-hidden': 'true' }),
    createThemeToggle({ className: 'auth-theme' }),
    h(
      'section',
      { class: 'auth-brand' },
      h(
        'a',
        { class: 'brand', href: '#/login' },
        h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'HH'),
        h('span', null, h('span', { class: 'brand-name' }, 'HiHuJoki')),
      ),
      h(
        'div',
        { class: 'auth-hero' },
        h('p', { class: 'eyebrow' }, 'Katalog layanan akademik'),
        h('h1', null, 'Jualan, kelola, dan cari pendampingan di satu tempat.'),
        h(
          'p',
          null,
          'Admin memantau performa toko, seller mengelola produk dan kategori, pembeli menemukan layanan lalu menghubungi lewat WhatsApp.',
        ),
        h(
          'div',
          { class: 'auth-metrics' },
          h('div', null, h('strong', null, number(store.products.length)), h('span', null, 'produk aktif')),
          h('div', null, h('strong', null, number(store.categories.length)), h('span', null, 'kategori')),
          h('div', null, h('strong', null, '1'), h('span', null, 'alur WhatsApp')),
        ),
      ),
      h(
        'div',
        { class: 'auth-points' },
        h(
          'div',
          { class: 'auth-point' },
          h('span', { class: 'auth-point-icon', 'aria-hidden': 'true' }, icon('chart', { size: 16 })),
          h('span', null, h('b', null, 'Admin.'), ' Dashboard, pengguna, dan analitik dalam satu tampilan.'),
        ),
        h(
          'div',
          { class: 'auth-point' },
          h('span', { class: 'auth-point-icon', 'aria-hidden': 'true' }, icon('box', { size: 16 })),
          h('span', null, h('b', null, 'Seller.'), ' Tambah produk, atur stok, unggulan, foto, dan kategori.'),
        ),
        h(
          'div',
          { class: 'auth-point' },
          h('span', { class: 'auth-point-icon', 'aria-hidden': 'true' }, icon('whatsapp', { size: 16 })),
          h('span', null, h('b', null, 'Pembeli.'), ' Cari produk, lihat detail, lalu hubungi via WhatsApp.'),
        ),
      ),
      h(
        'div',
        { class: 'auth-foot' },
        h('span', { class: 'auth-live', 'aria-hidden': 'true' }),
        'Demo lokal · data tersimpan di localStorage browser.',
      ),
    ),
    h(
      'section',
      { class: 'auth-form-wrap' },
      h(
        'div',
        { class: 'auth-card' },
        h(
          'div',
          { class: 'auth-card-head' },
          h('span', { class: 'auth-badge', 'aria-hidden': 'true' }, icon('sparkle', { size: 19 })),
          h(
            'div',
            null,
            h('p', { class: 'eyebrow' }, 'Selamat datang kembali'),
            h('h2', null, 'Masuk ke HiHuJoki'),
          ),
        ),
        h('p', { class: 'muted auth-intro' }, 'Gunakan nomor HP terdaftar, atau pilih akun demo untuk melihat tiap peran.'),
        form,
        h('div', { class: 'auth-divider' }, h('span', null, 'atau masuk cepat')),
        h('div', { class: 'demo-box' }, h('div', { class: 'section-label' }, 'Akun demo · klik untuk masuk'), demoList),
        h(
          'p',
          { class: 'small muted auth-note' },
          'Autentikasi demo berjalan di browser tanpa server. Jangan gunakan kata sandi asli.',
        ),
      ),
    ),
  );
}
