import { h, option } from '../utils/dom.js';
import { formatDate, money, number } from '../utils/format.js';
import { store } from '../data/store.js';
import { confirmAction, field, openDialog, productThumb, readImageFile, toast } from '../utils/ui.js';

export function createSellerProductsView(ctx) {
  const { user } = ctx;
  const mine = [...store.products]
    .filter((product) => product.sellerId === user.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  function openProductForm(product = null) {
    const isEdit = Boolean(product);
    let imageUrl = product?.imageUrl || '';

    const errorBox = h('div', { class: 'form-error', role: 'alert', hidden: true });
    const photoError = h('div', { class: 'form-error', role: 'alert', hidden: true });

    const showError = (message) => {
      errorBox.textContent = message;
      errorBox.hidden = !message;
    };

    const nameInput = h('input', {
      class: 'input',
      id: 'pf-nama',
      maxlength: '80',
      placeholder: 'Contoh: Paket Konsultasi Bab 1',
      value: product?.nama || '',
    });

    const categorySelect = h(
      'select',
      { class: 'select', id: 'pf-kategori', value: product?.kategori || store.categories[0] },
      ...store.categories.map((category) => option(category, category)),
    );

    const priceInput = h('input', {
      class: 'input',
      id: 'pf-harga',
      type: 'number',
      min: '0',
      step: '1',
      inputmode: 'numeric',
      placeholder: '75000',
      value: product?.harga ?? '',
    });

    const stockInput = h('input', {
      class: 'input',
      id: 'pf-stok',
      type: 'number',
      min: '0',
      step: '1',
      inputmode: 'numeric',
      placeholder: '10',
      value: product?.stok ?? '',
    });

    const descInput = h(
      'textarea',
      { class: 'textarea', id: 'pf-deskripsi', maxlength: '600', placeholder: 'Jelaskan singkat isi layanan, durasi, dan hasil yang didapat.' },
      product?.deskripsi || '',
    );

    const unggulanInput = h('input', { type: 'checkbox', id: 'pf-unggulan', checked: Boolean(product?.unggulan) });

    const previewWrap = h('div', { class: 'photo-preview' });
    function renderPhoto() {
      previewWrap.replaceChildren(
        productThumb({ id: product?.id || 'baru', kategori: categorySelect.value, imageUrl }),
        h(
          'div',
          null,
          h('strong', null, imageUrl.startsWith('data:image/') ? 'Foto terpasang' : 'Belum ada foto'),
          h('p', null, 'Gunakan JPG, PNG, atau WebP. Maksimal 1 MB. Foto disimpan di browser.'),
          imageUrl.startsWith('data:image/')
            ? h(
                'button',
                {
                  class: 'btn ghost sm',
                  type: 'button',
                  style: { paddingLeft: '0' },
                  onClick: () => {
                    imageUrl = '';
                    renderPhoto();
                  },
                },
                'Hapus foto',
              )
            : null,
        ),
      );
    }

    const photoInput = h('input', {
      class: 'input',
      id: 'pf-foto',
      type: 'file',
      accept: 'image/png,image/jpeg,image/webp',
      onChange: async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        photoError.hidden = true;
        try {
          imageUrl = await readImageFile(file);
          renderPhoto();
        } catch (error) {
          photoError.textContent = error.message;
          photoError.hidden = false;
          event.target.value = '';
        }
      },
    });

    renderPhoto();

    const form = h(
      'form',
      {
        class: 'form-grid',
        id: 'product-form',
        novalidate: true,
        onSubmit: (event) => {
          event.preventDefault();
          const draft = {
            nama: nameInput.value,
            kategori: categorySelect.value,
            harga: priceInput.value === '' ? Number.NaN : Number(priceInput.value),
            stok: stockInput.value === '' ? Number.NaN : Number(stockInput.value),
            deskripsi: descInput.value,
            imageUrl: imageUrl || 'local-placeholder://green',
            unggulan: unggulanInput.checked,
            sellerId: user.id,
          };
          try {
            const result = isEdit ? store.updateProduct(product.id, draft) : store.createProduct(draft);
            if (!result.ok) {
              showError(result.error);
              return;
            }
            dialog.close();
            toast(isEdit ? 'Perubahan produk disimpan.' : 'Produk baru ditambahkan.', 'success');
            ctx.refresh();
          } catch (error) {
            showError(error.message);
          }
        },
      },
      field('Nama produk', nameInput),
      field('Kategori', categorySelect, 'Kategori dikelola di menu Kategori.'),
      h('div', { class: 'two-col' }, field('Harga (Rp)', priceInput), field('Stok', stockInput)),
      field('Deskripsi', descInput),
      h('div', { class: 'field' }, h('label', { for: 'pf-foto' }, 'Foto produk'), photoInput, photoError),
      previewWrap,
      h('label', { class: 'check' }, unggulanInput, 'Tandai sebagai produk unggulan'),
      errorBox,
    );

    let dialog;
    dialog = openDialog({
      title: isEdit ? 'Edit produk' : 'Tambah produk',
      subtitle: isEdit ? 'Perbarui informasi produk yang tampil di katalog.' : 'Produk akan langsung tampil di katalog pembeli.',
      width: 'min(620px, calc(100vw - 32px))',
      body: form,
      actions: [
        h('button', { class: 'btn outline', type: 'button', onClick: () => dialog.close() }, 'Batal'),
        h('button', { class: 'btn primary', type: 'submit', form: 'product-form' }, isEdit ? 'Simpan perubahan' : 'Tambah produk'),
      ],
    });
  }

  async function removeProduct(product) {
    const ok = await confirmAction({
      title: 'Hapus produk?',
      message: `"${product.nama}" akan dihapus dari katalog beserta statistiknya. Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: 'Hapus produk',
    });
    if (!ok) return;
    try {
      store.deleteProduct(product.id);
      toast('Produk dihapus.', 'success');
      ctx.refresh();
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  const totalStock = mine.reduce((sum, product) => sum + product.stok, 0);
  const featured = mine.filter((product) => product.unggulan).length;
  const lowStock = mine.filter((product) => product.stok <= 5).length;

  const stats = h(
    'div',
    { class: 'stats' },
    h('div', { class: 'stat accent' }, h('small', null, 'Produk saya'), h('strong', null, number(mine.length)), h('div', { class: 'stat-foot' }, 'Tampil di katalog')),
    h('div', { class: 'stat' }, h('small', null, 'Total stok'), h('strong', null, number(totalStock)), h('div', { class: 'stat-foot' }, 'Akumulasi semua produk')),
    h('div', { class: 'stat' }, h('small', null, 'Unggulan'), h('strong', null, number(featured)), h('div', { class: 'stat-foot' }, 'Ditampilkan lebih dulu')),
    h('div', { class: 'stat' }, h('small', null, 'Stok menipis'), h('strong', null, number(lowStock)), h('div', { class: 'stat-foot' }, 'Sisa 5 atau kurang')),
  );

  const rows = mine.map((product) =>
    h(
      'tr',
      null,
      h(
        'td',
        null,
        h(
          'div',
          { class: 'cell-product' },
          productThumb(product),
          h('div', null, h('strong', null, product.nama), h('span', null, `Diperbarui ${formatDate(product.updatedAt)}`)),
        ),
      ),
      h('td', null, h('span', { class: 'tag' }, product.kategori)),
      h('td', { class: 'mono' }, money(product.harga)),
      h(
        'td',
        null,
        product.stok === 0
          ? h('span', { class: 'tag danger' }, 'Habis')
          : h('span', { class: product.stok <= 5 ? 'tag' : 'tag success' }, `${number(product.stok)} tersedia`),
      ),
      h('td', null, product.unggulan ? h('span', { class: 'tag accent' }, 'Unggulan') : h('span', { class: 'tag neutral' }, 'Biasa')),
      h(
        'td',
        { class: 'actions' },
        h(
          'div',
          { class: 'row-actions' },
          h('button', { class: 'btn outline sm', type: 'button', onClick: () => openProductForm(product) }, 'Edit'),
          h('button', { class: 'btn danger sm', type: 'button', onClick: () => removeProduct(product) }, 'Hapus'),
        ),
      ),
    ),
  );

  const table = h(
    'div',
    { class: 'panel' },
    h(
      'div',
      { class: 'panel-head' },
      h('div', null, h('h2', null, 'Daftar produk'), h('p', { class: 'small muted' }, `${number(mine.length)} produk milikmu`)),
      h('button', { class: 'btn primary sm', type: 'button', onClick: () => openProductForm() }, 'Tambah produk'),
    ),
    mine.length
      ? h(
          'div',
          { class: 'table-wrap' },
          h(
            'table',
            null,
            h(
              'thead',
              null,
              h(
                'tr',
                null,
                h('th', null, 'Produk'),
                h('th', null, 'Kategori'),
                h('th', null, 'Harga'),
                h('th', null, 'Stok'),
                h('th', null, 'Status'),
                h('th', { style: { textAlign: 'right' } }, 'Aksi'),
              ),
            ),
            h('tbody', null, ...rows),
          ),
        )
      : h(
          'div',
          { class: 'empty', style: { border: '0', borderRadius: '0' } },
          h('strong', null, 'Belum ada produk'),
          h('span', null, 'Tambahkan produk pertama agar muncul di katalog pembeli.'),
          h('button', { class: 'btn primary sm', type: 'button', style: { marginTop: '10px' }, onClick: () => openProductForm() }, 'Tambah produk'),
        ),
  );

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
        h('h1', null, 'Produk saya'),
        h('p', null, 'Kelola produk, harga, stok, foto, dan produk unggulan yang tampil di katalog.'),
      ),
      h(
        'div',
        { class: 'head-actions' },
        h('a', { class: 'btn outline', href: '#/katalog' }, 'Lihat katalog'),
        h('button', { class: 'btn primary', type: 'button', onClick: () => openProductForm() }, 'Tambah produk'),
      ),
    ),
    stats,
    table,
  );
}
