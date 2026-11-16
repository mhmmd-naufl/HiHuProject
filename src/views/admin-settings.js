import { h } from '../utils/dom.js';
import { formatPhone, number } from '../utils/format.js';
import { store } from '../data/store.js';
import { DEMO_ACCOUNTS } from '../data/seed.js';
import { confirmAction, field, toast } from '../utils/ui.js';

export function createAdminSettingsView(ctx) {
  const errorBox = h('div', { class: 'form-error', role: 'alert', hidden: true });

  const phoneInput = h('input', {
    class: 'input',
    id: 'settings-wa',
    type: 'tel',
    inputmode: 'tel',
    placeholder: '6281234567890',
    value: store.settings.whatsapp,
    autocomplete: 'off',
  });

  const preview = h('p', { class: 'small muted' }, `Tautan saat ini: https://wa.me/${store.settings.whatsapp}`);

  const form = h(
    'form',
    {
      class: 'form-grid',
      onSubmit: (event) => {
        event.preventDefault();
        try {
          const result = store.saveWhatsapp(phoneInput.value);
          if (!result.ok) {
            errorBox.textContent = result.error;
            errorBox.hidden = false;
            return;
          }
          errorBox.hidden = true;
          toast('Nomor WhatsApp disimpan.', 'success');
          ctx.refresh();
        } catch (error) {
          errorBox.textContent = error.message;
          errorBox.hidden = false;
        }
      },
    },
    field('Nomor WhatsApp toko', phoneInput, 'Gunakan kode negara tanpa tanda +. Contoh: 6281234567890.'),
    preview,
    errorBox,
    h('div', null, h('button', { class: 'btn primary', type: 'submit' }, 'Simpan nomor')),
  );

  async function resetAll() {
    const ok = await confirmAction({
      title: 'Reset seluruh data demo?',
      message: 'Pengguna, produk, kategori, nomor WhatsApp, dan analitik akan dikembalikan ke data awal. Perubahan yang sudah dibuat akan hilang.',
      confirmLabel: 'Reset semua data',
    });
    if (!ok) return;
    try {
      store.resetAll();
      toast('Data demo dikembalikan ke kondisi awal.', 'success');
      ctx.refresh();
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  return h(
    'div',
    null,
    h(
      'header',
      { class: 'page-head' },
      h(
        'div',
        null,
        h('p', { class: 'eyebrow' }, 'Admin · Toko'),
        h('h1', null, 'Pengaturan'),
        h('p', null, 'Atur nomor WhatsApp yang dipakai semua tombol pembeli dan kelola data demo aplikasi.'),
      ),
    ),
    h(
      'div',
      { class: 'split-2' },
      h(
        'div',
        { class: 'panel' },
        h('div', { class: 'panel-head' }, h('h2', null, 'Kontak WhatsApp')),
        h(
          'div',
          { class: 'panel-pad stack' },
          h('p', { class: 'small muted' }, 'Semua tombol WhatsApp di katalog mengarah ke nomor ini. Pembeli akan membuka chat dengan pesan yang sudah terisi nama produk.'),
          form,
          h('p', { class: 'notice warning' }, 'Nomor harus berupa digit dengan kode negara. Nomor lokal berawalan 0 otomatis diubah menjadi 62 saat disimpan.'),
        ),
      ),
      h(
        'div',
        { class: 'panel' },
        h('div', { class: 'panel-head' }, h('h2', null, 'Data aplikasi')),
        h(
          'div',
          { class: 'panel-pad stack' },
          h(
            'div',
            null,
            h('div', { class: 'metric-row' }, h('span', null, 'Pengguna'), h('strong', null, number(store.users.length))),
            h('div', { class: 'metric-row' }, h('span', null, 'Produk'), h('strong', null, number(store.products.length))),
            h('div', { class: 'metric-row' }, h('span', null, 'Kategori'), h('strong', null, number(store.categories.length))),
            h('div', { class: 'metric-row' }, h('span', null, 'Aktivitas tercatat'), h('strong', null, number(store.analytics.events.length))),
          ),
          h('p', { class: 'small muted' }, 'Seluruh data disimpan di localStorage browser ini. Membuka aplikasi di browser atau perangkat lain akan memakai data terpisah.'),
          h('button', { class: 'btn danger', type: 'button', onClick: resetAll }, 'Reset seluruh data demo'),
        ),
      ),
    ),
    h(
      'div',
      { class: 'panel', style: { marginTop: '16px' } },
      h('div', { class: 'panel-head' }, h('h2', null, 'Akun demo awal')),
      h(
        'div',
        { class: 'panel-pad stack' },
        h(
          'div',
          { class: 'table-wrap' },
          h(
            'table',
            null,
            h('thead', null, h('tr', null, h('th', null, 'Peran'), h('th', null, 'Nomor HP'), h('th', null, 'Kata sandi'))),
            h(
              'tbody',
              null,
              ...DEMO_ACCOUNTS.map((account) =>
                h(
                  'tr',
                  null,
                  h('td', null, h('span', { class: `tag ${account.role === 'admin' ? 'accent' : account.role === 'seller' ? 'success' : 'neutral'}` }, account.role === 'seller' ? 'Seller' : account.role === 'buyer' ? 'Pembeli' : 'Admin')),
                  h('td', { class: 'mono' }, formatPhone(account.phone)),
                  h('td', { class: 'mono' }, account.password),
                ),
              ),
            ),
          ),
        ),
        h('p', { class: 'small muted' }, 'Kredensial awal ini berlaku setelah reset data. Kata sandi dan sesi hanya untuk demo lokal; jangan gunakan data sensitif di aplikasi ini.'),
      ),
    ),
  );
}
