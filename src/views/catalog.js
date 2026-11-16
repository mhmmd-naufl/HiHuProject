import { clear, h, option } from '../utils/dom.js';
import { money, number, ROLE_LABEL } from '../utils/format.js';
import { store } from '../data/store.js';
import { openDialog } from '../utils/ui.js';
import { homePath } from '../ui/shell.js';

export function createCatalogView({ user }) {
  const filters = { q: '', category: 'all', sort: 'featured' };

  function sellerName(product) {
    return store.users.find((item) => item.id === product.sellerId)?.nama || 'HiHuJoki';
  }

  function waUrl(product) {
    const text = `Halo HiHuJoki, saya ingin bertanya tentang "${product.nama}" (${money(product.harga)}). Apakah masih tersedia?`;
    return `https://wa.me/${store.settings.whatsapp}?text=${encodeURIComponent(text)}`;
  }

  function waButton(product, small = true) {
    return h(
      'a',
      {
        class: `btn accent ${small ? 'sm' : ''}`,
        href: waUrl(product),
        target: '_blank',
        rel: 'noopener noreferrer',
        style: small ? { flex: '1' } : undefined,
        onClick: () => store.trackWaClick(product.id),
      },
      'WhatsApp',
    );
  }

  function photo(product) {
    const wrap = h('div', { class: 'product-photo' });
    if (typeof product.imageUrl === 'string' && product.imageUrl.startsWith('data:image/')) {
      wrap.append(h('img', { src: product.imageUrl, alt: `Foto ${product.nama}`, loading: 'lazy' }));
    } else {
      wrap.append(h('div', { class: `placeholder tone-${product.unggulan ? 'sand' : 'green'}` }, 'HH'));
    }
    if (product.unggulan) wrap.append(h('span', { class: 'badge' }, 'UNGGULAN'));
    if (product.stok === 0) wrap.append(h('span', { class: 'badge outline', style: { left: 'auto', right: '10px' } }, 'STOK HABIS'));
    return wrap;
  }

  function stockLabel(stok) {
    if (stok === 0) return h('span', { class: 'stock out' }, 'Stok habis');
    if (stok <= 5) return h('span', { class: 'stock low' }, `Sisa ${number(stok)}`);
    return h('span', { class: 'stock' }, `Stok ${number(stok)}`);
  }

  function showDetail(product) {
    store.trackProductView(product.id);

    const hero = h('div', { class: 'detail-hero' });
    if (typeof product.imageUrl === 'string' && product.imageUrl.startsWith('data:image/')) {
      hero.append(h('img', { src: product.imageUrl, alt: `Foto ${product.nama}` }));
    } else {
      hero.append(h('div', { class: `placeholder tone-${product.unggulan ? 'sand' : 'green'}` }, 'HiHuJoki'));
    }

    const body = h(
      'div',
      null,
      hero,
      h(
        'div',
        { class: 'detail-meta' },
        h('span', { class: 'tag' }, product.kategori),
        product.unggulan ? h('span', { class: 'tag accent' }, 'Unggulan') : null,
        h('span', { class: 'tag neutral' }, `Seller: ${sellerName(product)}`),
      ),
      h('div', { class: 'detail-price' }, money(product.harga)),
      h('div', { class: 'detail-meta' }, stockLabel(product.stok)),
      h('p', { class: 'muted', style: { marginBottom: '16px' } }, product.deskripsi),
      h(
        'p',
        { class: 'notice' },
        'Pemesanan dan pembayaran dilakukan langsung lewat WhatsApp. HiHuJoki hanya mempertemukan pembeli dengan seller.',
      ),
      h('div', { style: { marginTop: '16px' } }, waButton(product, false)),
    );

    let dialog;
    dialog = openDialog({
      title: product.nama,
      subtitle: product.kategori,
      body,
      actions: [h('button', { class: 'btn outline', type: 'button', onClick: () => dialog.close() }, 'Tutup')],
    });
  }

  function productCard(product) {
    return h(
      'article',
      { class: 'product-card' },
      photo(product),
      h(
        'div',
        { class: 'product-body' },
        h('span', { class: 'product-cat' }, product.kategori),
        h('h3', { class: 'product-name' }, product.nama),
        h('p', { class: 'product-desc' }, product.deskripsi),
        h('div', { class: 'product-price' }, money(product.harga)),
        h('div', { class: 'product-foot' }, stockLabel(product.stok), h('span', { class: 'small muted' }, sellerName(product))),
        h(
          'div',
          { class: 'row-actions', style: { marginTop: '6px' } },
          h(
            'button',
            { class: 'btn outline sm', type: 'button', style: { flex: '1' }, onClick: () => showDetail(product) },
            'Detail',
          ),
          waButton(product),
        ),
      ),
    );
  }

  const grid = h('div', { class: 'product-grid' });
  const resultInfo = h('p', { class: 'small muted', role: 'status', style: { marginBottom: '10px' } });

  function applyFilters() {
    const query = filters.q.trim().toLowerCase();
    let items = store.products.filter((product) => {
      if (filters.category !== 'all' && product.kategori !== filters.category) return false;
      if (!query) return true;
      return `${product.nama} ${product.kategori} ${product.deskripsi}`.toLowerCase().includes(query);
    });

    const newest = (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (filters.sort === 'featured') {
      items = [...items].sort((a, b) => Number(b.unggulan) - Number(a.unggulan) || newest(a, b));
    } else if (filters.sort === 'cheap') {
      items = [...items].sort((a, b) => a.harga - b.harga);
    } else if (filters.sort === 'expensive') {
      items = [...items].sort((a, b) => b.harga - a.harga);
    } else {
      items = [...items].sort(newest);
    }

    clear(grid);
    resultInfo.textContent = `${number(items.length)} dari ${number(store.products.length)} produk ditampilkan.`;

    if (items.length === 0) {
      grid.append(
        h(
          'div',
          { class: 'empty' },
          h('strong', null, 'Produk tidak ditemukan'),
          h('span', null, 'Coba kata kunci lain atau ganti kategori.'),
          h(
            'button',
            {
              class: 'btn outline sm',
              type: 'button',
              style: { marginTop: '10px' },
              onClick: () => {
                filters.q = '';
                filters.category = 'all';
                searchInput.value = '';
                categorySelect.value = 'all';
                applyFilters();
              },
            },
            'Reset filter',
          ),
        ),
      );
      return;
    }

    for (const product of items) grid.append(productCard(product));
  }

  const searchInput = h('input', {
    class: 'input search',
    type: 'search',
    placeholder: 'Cari layanan, kategori, atau kata kunci…',
    'aria-label': 'Cari produk',
    onInput: (event) => {
      filters.q = event.target.value;
      applyFilters();
    },
  });

  const categorySelect = h(
    'select',
    {
      class: 'select',
      'aria-label': 'Filter kategori',
      value: 'all',
      onChange: (event) => {
        filters.category = event.target.value;
        applyFilters();
      },
    },
    option('all', 'Semua kategori'),
    ...store.categories.map((category) => option(category, category)),
  );

  const sortSelect = h(
    'select',
    {
      class: 'select',
      'aria-label': 'Urutkan produk',
      value: 'featured',
      onChange: (event) => {
        filters.sort = event.target.value;
        applyFilters();
      },
    },
    option('featured', 'Unggulan dulu'),
    option('cheap', 'Harga termurah'),
    option('expensive', 'Harga tertinggi'),
    option('newest', 'Terbaru'),
  );

  const head = h(
    'header',
    { class: 'hero' },
    h(
      'div',
      null,
      h('p', { class: 'eyebrow' }, `${ROLE_LABEL[user.role]} · Katalog`),
      h('h1', null, user.role === 'buyer' ? 'Layanan pendampingan, tanpa ribet.' : 'Katalog HiHuJoki'),
      h(
        'p',
        null,
        'Temukan layanan yang cocok, lihat detailnya, lalu hubungi seller lewat WhatsApp. Tidak perlu membuat pesanan di aplikasi.',
      ),
      user.role !== 'buyer'
        ? h(
            'div',
            { style: { marginTop: '16px' } },
            h('a', { class: 'btn outline sm', href: `#${homePath(user.role)}` }, 'Buka dashboard'),
          )
        : null,
    ),
    h(
      'div',
      { class: 'hero-count' },
      h('strong', null, number(store.products.length)),
      h('span', null, 'produk aktif'),
    ),
  );

  const toolbar = h(
    'div',
    { class: 'toolbar' },
    searchInput,
    categorySelect,
    sortSelect,
  );

  applyFilters();

  return h('div', null, head, toolbar, resultInfo, grid);
}
