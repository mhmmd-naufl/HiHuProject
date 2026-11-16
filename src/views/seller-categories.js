import { h } from '../utils/dom.js';
import { number } from '../utils/format.js';
import { store } from '../data/store.js';
import { confirmAction, toast } from '../utils/ui.js';

export function createSellerCategoriesView(ctx) {
  const input = h('input', {
    class: 'input',
    id: 'category-name',
    maxlength: '40',
    placeholder: 'Contoh: Editing Bahasa',
    'aria-label': 'Nama kategori baru',
  });

  const form = h(
    'form',
    {
      class: 'form-grid',
      onSubmit: (event) => {
        event.preventDefault();
        try {
          const result = store.addCategory(input.value);
          if (!result.ok) {
            toast(result.error, 'error');
            input.focus({ preventScroll: true });
            return;
          }
          toast('Kategori ditambahkan.', 'success');
          ctx.refresh();
        } catch (error) {
          toast(error.message, 'error');
        }
      },
    },
    h('div', { class: 'inline-form' }, input, h('button', { class: 'btn primary', type: 'submit' }, 'Tambah')),
  );

  async function removeCategory(category) {
    const used = store.products.filter((product) => product.kategori === category).length;
    if (used > 0) {
      toast(`Kategori "${category}" masih dipakai ${used} produk.`, 'error');
      return;
    }
    const ok = await confirmAction({
      title: 'Hapus kategori?',
      message: `Kategori "${category}" akan dihapus dari daftar pilihan produk.`,
      confirmLabel: 'Hapus kategori',
    });
    if (!ok) return;
    const result = store.removeCategory(category);
    if (!result.ok) {
      toast(result.error, 'error');
      return;
    }
    toast('Kategori dihapus.', 'success');
    ctx.refresh();
  }

  const chips = h(
    'div',
    { class: 'category-list' },
    ...store.categories.map((category) => {
      const used = store.products.filter((product) => product.kategori === category).length;
      return h(
        'span',
        { class: 'chip' },
        h('span', null, category, h('small', null, ` · ${number(used)} produk`)),
        h(
          'button',
          { type: 'button', 'aria-label': `Hapus kategori ${category}`, onClick: () => removeCategory(category) },
          '×',
        ),
      );
    }),
  );

  const rows = store.categories.map((category) => {
    const products = store.products.filter((product) => product.kategori === category);
    const stock = products.reduce((sum, product) => sum + product.stok, 0);
    return h(
      'tr',
      null,
      h('td', null, h('strong', null, category)),
      h('td', { class: 'mono' }, number(products.length)),
      h('td', { class: 'mono' }, number(stock)),
      h(
        'td',
        { class: 'actions' },
        h(
          'button',
          {
            class: 'btn danger sm',
            type: 'button',
            onClick: () => removeCategory(category),
          },
          'Hapus',
        ),
      ),
    );
  });

  return h(
    'div',
    null,
    h(
      'header',
      { class: 'page-head' },
      h(
        'div',
        null,
        h('p', { class: 'eyebrow' }, 'Seller · Katalog'),
        h('h1', null, 'Kategori'),
        h('p', null, 'Kategori dipakai bersama di katalog. Hanya kategori tanpa produk yang dapat dihapus.'),
      ),
      h('div', { class: 'head-actions' }, h('a', { class: 'btn outline', href: '#/produk' }, 'Kembali ke produk')),
    ),
    h(
      'div',
      { class: 'split-2' },
      h(
        'div',
        { class: 'panel panel-pad stack' },
        h('div', null, h('h2', { style: { fontSize: '15px' } }, 'Tambah kategori'), h('p', { class: 'small muted', style: { marginTop: '4px' } }, 'Gunakan nama singkat dan jelas, maksimal 40 karakter.')),
        form,
        h('p', { class: 'notice' }, 'Penghapusan kategori yang masih dipakai produk akan ditolak agar produk tidak kehilangan kategori.'),
      ),
      h(
        'div',
        { class: 'panel panel-pad stack' },
        h('div', null, h('h2', { style: { fontSize: '15px' } }, 'Kategori aktif'), h('p', { class: 'small muted', style: { marginTop: '4px' } }, `${number(store.categories.length)} kategori tersedia`)),
        chips,
      ),
    ),
    h(
      'div',
      { class: 'panel', style: { marginTop: '16px' } },
      h('div', { class: 'panel-head' }, h('h2', null, 'Penggunaan kategori')),
      h(
        'div',
        { class: 'table-wrap' },
        h(
          'table',
          null,
          h('thead', null, h('tr', null, h('th', null, 'Kategori'), h('th', null, 'Produk'), h('th', null, 'Total stok'), h('th', { style: { textAlign: 'right' } }, 'Aksi'))),
          h('tbody', null, ...rows),
        ),
      ),
    ),
  );
}
