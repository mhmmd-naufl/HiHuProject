import { h } from '../utils/dom.js';
import { money, number, ROLE_LABEL, timeAgo } from '../utils/format.js';
import { store } from '../data/store.js';
import { productThumb } from '../utils/ui.js';

const sumValues = (record) => Object.values(record).reduce((sum, value) => sum + (Number(value) || 0), 0);

export function createAdminOverviewView() {
  const products = store.products;
  const users = store.users;
  const totalViews = sumValues(store.analytics.views);
  const totalClicks = sumValues(store.analytics.waClicks);
  const inventoryValue = products.reduce((sum, product) => sum + product.harga * product.stok, 0);
  const roleCount = (role) => users.filter((user) => user.role === role).length;

  const latestProducts = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const lowStock = [...products].filter((product) => product.stok <= 5).sort((a, b) => a.stok - b.stok).slice(0, 5);

  const events = store.analytics.events.slice(0, 6);

  const stats = h(
    'div',
    { class: 'stats' },
    h('div', { class: 'stat accent' }, h('small', null, 'Nilai katalog'), h('strong', { style: { fontSize: '22px' } }, money(inventoryValue)), h('div', { class: 'stat-foot' }, 'Harga × stok seluruh produk')),
    h('div', { class: 'stat' }, h('small', null, 'Produk'), h('strong', null, number(products.length)), h('div', { class: 'stat-foot' }, `${number(store.categories.length)} kategori`)),
    h('div', { class: 'stat' }, h('small', null, 'Pengguna'), h('strong', null, number(users.length)), h('div', { class: 'stat-foot' }, `${number(roleCount('seller'))} seller · ${number(roleCount('buyer'))} pembeli`)),
    h('div', { class: 'stat' }, h('small', null, 'Interaksi'), h('strong', null, number(totalViews + totalClicks)), h('div', { class: 'stat-foot' }, `${number(totalViews)} lihat · ${number(totalClicks)} klik WA`)),
  );

  const productTable = h(
    'div',
    { class: 'panel' },
    h(
      'div',
      { class: 'panel-head' },
      h('div', null, h('h2', null, 'Produk terbaru'), h('p', { class: 'small muted' }, 'Lima produk yang paling baru ditambahkan')),
      h('a', { class: 'btn ghost sm', href: '#/katalog' }, 'Lihat katalog'),
    ),
    latestProducts.length
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
                h('th', null, 'Seller'),
                h('th', null, 'Harga'),
                h('th', null, 'Stok'),
              ),
            ),
            h(
              'tbody',
              null,
              ...latestProducts.map((product) => {
                const seller = users.find((user) => user.id === product.sellerId);
                return h(
                  'tr',
                  null,
                  h(
                    'td',
                    null,
                    h(
                      'div',
                      { class: 'cell-product' },
                      productThumb(product),
                      h('div', null, h('strong', null, product.nama), h('span', null, product.kategori)),
                    ),
                  ),
                  h('td', null, h('span', { class: 'tag neutral' }, seller?.nama || 'Tanpa seller')),
                  h('td', { class: 'mono' }, money(product.harga)),
                  h('td', { class: 'mono' }, number(product.stok)),
                );
              }),
            ),
          ),
        )
      : h('div', { class: 'empty', style: { border: '0' } }, h('strong', null, 'Belum ada produk'), h('span', null, 'Seller belum menambahkan produk.')), 
  );

  const activityPanel = h(
    'div',
    { class: 'panel' },
    h(
      'div',
      { class: 'panel-head' },
      h('h2', null, 'Aktivitas terbaru'),
      h('a', { class: 'btn ghost sm', href: '#/analitik' }, 'Analitik'),
    ),
    events.length
      ? h(
          'ul',
          { class: 'activity' },
          ...events.map((event) => {
            const product = products.find((item) => item.id === event.productId);
            const actor = users.find((user) => user.id === event.userId);
            return h(
              'li',
              null,
              h('span', { class: `dot ${event.type === 'wa' ? 'wa' : ''}`, 'aria-hidden': 'true' }),
              h(
                'div',
                null,
                h(
                  'p',
                  null,
                  event.type === 'wa' ? 'Klik WhatsApp untuk ' : 'Melihat ',
                  h('strong', null, product?.nama || 'produk terhapus'),
                ),
                h('small', null, `${actor?.nama || 'Pengunjung'} · ${timeAgo(event.at)}`),
              ),
            );
          }),
        )
      : h('div', { class: 'empty', style: { border: '0' } }, h('strong', null, 'Belum ada aktivitas'), h('span', null, 'Interaksi pembeli akan muncul di sini.')),
  );

  const stockPanel = h(
    'div',
    { class: 'panel' },
    h('div', { class: 'panel-head' }, h('h2', null, 'Stok menipis'), h('span', { class: 'small muted' }, '≤ 5 unit')),
    lowStock.length
      ? h(
          'div',
          { class: 'panel-pad', style: { paddingTop: '6px', paddingBottom: '10px' } },
          ...lowStock.map((product) =>
            h(
              'div',
              { class: 'metric-row' },
              h('span', null, product.nama),
              h('strong', { style: { color: product.stok === 0 ? 'var(--danger)' : 'var(--warning)' } }, product.stok === 0 ? 'Habis' : `${number(product.stok)} unit`),
            ),
          ),
          h('a', { class: 'btn outline sm block', href: '#/katalog', style: { marginTop: '10px' } }, 'Cek produk'),
        )
      : h('div', { class: 'empty', style: { border: '0' } }, h('strong', null, 'Stok aman'), h('span', null, 'Semua produk memiliki stok di atas 5.')),
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
        h('p', { class: 'eyebrow' }, 'Admin · Ringkasan'),
        h('h1', null, 'Dashboard'),
        h(
          'p',
          null,
          `Selamat datang, ${store.currentUser()?.nama?.split(' ')[0] || 'Admin'}. Pantau katalog, pengguna, dan interaksi pembeli dalam satu tampilan.`,
        ),
      ),
      h(
        'div',
        { class: 'head-actions' },
        h('a', { class: 'btn outline', href: '#/analitik' }, 'Lihat analitik'),
        h('a', { class: 'btn primary', href: '#/pengguna' }, 'Kelola pengguna'),
      ),
    ),
    stats,
    h(
      'div',
      { class: 'dash-grid' },
      productTable,
      h('div', { class: 'stack' }, activityPanel, stockPanel),
    ),
    h(
      'div',
      { class: 'panel panel-pad', style: { marginTop: '16px' } },
      h(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center' } },
        h(
          'div',
          null,
          h('h2', { style: { fontSize: '15px' } }, 'Sebaran pengguna'),
          h('p', { class: 'small muted' }, `${number(roleCount('admin'))} admin · ${number(roleCount('seller'))} seller · ${number(roleCount('buyer'))} pembeli`),
        ),
        h('a', { class: 'btn outline sm', href: '#/pengguna' }, 'Atur pengguna'),
      ),
      h(
        'div',
        { class: 'chart', style: { paddingLeft: '0', paddingRight: '0', paddingBottom: '0' } },
        ...['admin', 'seller', 'buyer'].map((role) => {
          const count = roleCount(role);
          const width = users.length ? Math.round((count / users.length) * 100) : 0;
          return h(
            'div',
            { class: 'bar-row' },
            h('span', { class: 'bar-label' }, ROLE_LABEL[role]),
            h('span', { class: 'bar-track' }, h('span', { class: `bar-fill ${role === 'seller' ? 'accent' : ''}`, style: { width: `${Math.max(width, count ? 3 : 0)}%` } })),
            h('span', { class: 'bar-value' }, number(count)),
          );
        }),
      ),
    ),
  );
}
