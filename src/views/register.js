import { h } from '../utils/dom.js';
import { formatPhone, number, ROLE_LABEL } from '../utils/format.js';
import { icon } from '../utils/icons.js';
import { store } from '../data/store.js';
import { DEMO_ACCOUNTS } from '../data/seed.js';
import { homePath } from '../ui/shell.js';
import { createThemeToggle } from '../ui/theme-toggle.js';

export function createRegisterView() {
  const errorBox = h('div', { class: 'form-error', role: 'alert', hidden: true });
  let busy = false;

  const phoneInput = h('input', {
    class: 'input',
    id: 'reg-phone',
    type: 'tel',
    name: 'phone',
    inputmode: 'tel',
    autocomplete: 'username',
    placeholder: '0812 3450 0006',
    required: true,
  });

  const passwordInput = h('input', {
    class: 'input',
    id: 'reg-password',
    type: 'password',
    name: 'password',
    autocomplete: 'new-password',
    placeholder: 'Kata sandi',
    required: true,
  });

  const passwordVisible = h('button', {
    class: 'input-action',
    type: 'button',
    'aria-label': 'Tampilkan kata sandi',
    'aria-pressed': 'false',
    onClick: () => {
      const isPwd = passwordInput.type === 'password';
      passwordInput.type = isPwd ? 'text' : 'password';
      passwordVisible.replaceChildren(
        icon(isPwd ? 'eyeOff' : 'eye', { size: 17 }),
      );
      passwordVisible.setAttribute('aria-label', isPwd ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
      passwordVisible.setAttribute('aria-pressed', String(!isPwd));
    },
  }, icon('eye', { size: 17 }));

  const submitLabel = h('span', { class: 'btn-label' }, 'Daftar');
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
    submitLabel.textContent = value ? 'Membuat akun…' : 'Daftar';
  }

  function attempt(phone, password) {
    if (busy) return;
    // Simpan user ke localStorage (mirip store.register)
    try {
      const users = JSON.parse(localStorage.getItem('hihujoki.users.v2') || '{}');
      const phoneNorm = phone.replace(/\s/g, '');
      if (users[phoneNorm]) {
        showError('Nomor HP sudah terdaftar. Silakan login.');
        passwordInput.select();
        return;
      }
      users[phoneNorm] = { nama: phoneNorm, password, role: 'buyer', created: new Date().toISOString() };
      localStorage.setItem('hihujoki.users.v2', JSON.stringify(users));
      toast('Akun berhasil dibuat! Silakan login.', 'success');
      window.setTimeout(() => location.hash = '#/login', 600);
    } catch (e) {
      showError('Gagal menyimpan akun.');
    }
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
      h('label', { for: 'reg-phone' }, 'Nomor HP'),
      h('div', { class: 'input-affix' }, phoneInput),
    ),
    h(
      'div',
      { class: 'field' },
      h('label', { for: 'reg-password' }, 'Kata sandi'),
      h('div', { class: 'input-affix password-affix' }, passwordInput, passwordVisible),
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
            // cek apakah sudah terdaftar
            try {
              const users = JSON.parse(localStorage.getItem('hihujoki.users.v2') || '{}');
              if (users[account.phone.replace(/\s/g, '')]) {
                showError('Sudah terdaftar. Silakan login.');
              } else {
                phoneInput.value = account.phone;
                passwordInput.value = account.password;
                attempt(account.phone, account.password);
              }
            } catch (e) {
              showError('Gcek status akun.');
            }
          },
        },
        h(
          'span',
          { class: 'demo-avatar', 'aria-hidden': 'true' },
          account.nama.split(' ').slice(0, 2).map((part) => part[0]).join(''),
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
        h('p', { class: 'eyebrow' }, 'Daftar akun baru'),
        h('h1', null, 'Buat akun HiHuJoki'),
        h(
          'p',
          null,
          'Daftar gratis dan dapatkan akses katalog, fitur seller, dan hubungi pembeli lewat WhatsApp.',
        ),
        h(
          'div',
          { class: 'auth-metrics' },
          h('div', null, h('strong', null, '—'), h('span', null, 'produk aktif')),
          h('div', null, h('strong', null, '—'), h('span', null, 'kategori')),
          h('div', null, h('strong', null, '—'), h('span', null, 'alur WhatsApp')),
        ),
      ),
      h(
        'div',
        { class: 'auth-points' },
        h(
          'div',
          { class: 'auth-point' },
          h('span', { class: 'auth-point-icon', 'aria-hidden': 'true' }, icon('box', { size: 16 })),
          h('span', null, 'Daftar gratis.'),
        ),
        h(
          'div',
          { class: 'auth-point' },
          h('span', { class: 'auth-point-icon', 'aria-hidden': 'true' }, icon('whatsapp', { size: 16 })),
          h('span', null, 'Hubungi via WhatsApp setelah daftar.'),
        ),
        h(
          'div',
          { class: 'auth-point' },
          h('span', { class: 'auth-point-icon', 'aria-hidden': 'true' }, icon('info', { size: 16 })),
          h('span', null, 'Data disimpan lokal di browser.'),
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
            h('p', { class: 'eyebrow' }, 'Daftar sekarang'),
            h('h2', null, 'Buat akun baru'),
          ),
        ),
        h('p', { class: 'muted auth-intro' }, 'Masukkan nomor HP dan kata sandi untuk membuat akun.'),
        form,
        h('div', { class: 'auth-divider' }, h('span', null, 'atau masuk cepak')),
        h('div', { class: 'demo-box' }, h('div', { class: 'section-label' }, 'Akun demo · klik untuk cek'), demoList),
        h(
          'p',
          { class: 'small muted auth-note' },
          'Autentikasi demo berjalan di browser tanpa server. Jangan gunakan kata sandi asli.',
        ),
      ),
    ),
  );
}