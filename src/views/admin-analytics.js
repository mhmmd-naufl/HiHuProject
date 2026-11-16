import { h } from '../utils/dom.js';
import { number } from '../utils/format.js';
import { store } from '../data/store.js';
import { confirmAction, toast } from '../utils/ui.js';

const sumValues = (record) => Object.values(record).reduce((sum, value) => sum + (Number(value) || 0), 0);
const CHART_COLORS = ['#427a63', '#7fae94', '#b3cbbf', '#d8a765', '#c08370', '#9a90aa'];

export function createAdminAnalyticsView(ctx) {
  const { views, waClicks } = store.analytics;
  const totalViews = sumValues(views);
  const totalClicks = sumValues(waClicks);
  const ratio = totalViews ? Math.round((totalClicks / totalViews) * 100) : 0;

  const productName = (id) => store.products.find((product) => product.id === id)?.nama || 'Produk terhapus';
  const percent = (value, max) => `${Math.min((value / Math.max(max, 1)) * 100, 100)}%`;

  const productRows = [...new Set([...Object.keys(views), ...Object.keys(waClicks)])]
    .map((id) => ({ label: productName(id), views: Number(views[id]) || 0, clicks: Number(waClicks[id]) || 0 }))
    .sort((a, b) => b.views + b.clicks - (a.views + a.clicks))
    .slice(0, 6);

  const maxInteraction = Math.max(...productRows.map((row) => Math.max(row.views, row.clicks)), 1);

  const productChart = productRows.length
    ? h(
        'div',
        { class: 'chart' },
        h(
          'div',
          { class: 'chart-legend' },
          h('span', { class: 'legend-item' }, h('span', { class: 'swatch', 'aria-hidden': 'true' }), 'Tayangan'),
          h('span', { class: 'legend-item' }, h('span', { class: 'swatch accent', 'aria-hidden': 'true' }), 'Klik WhatsApp'),
        ),
        ...productRows.map((row) =>
          h(
            'div',
            { class: 'bar-row', title: `${row.label}: ${number(row.views)} tayangan, ${number(row.clicks)} klik WhatsApp` },
            h('span', { class: 'bar-label' }, row.label),
            h(
              'span',
              { class: 'bar-group' },
              h('span', { class: 'bar-track' }, h('span', { class: 'bar-fill view', style: { width: percent(row.views, maxInteraction) } })),
              h('span', { class: 'bar-track thin' }, h('span', { class: 'bar-fill accent', style: { width: percent(row.clicks, maxInteraction) } })),
            ),
            h('span', { class: 'bar-value' }, `${number(row.views)} · ${number(row.clicks)}`),
          ),
        ),
      )
    : h('div', { class: 'empty', style: { border: '0', borderRadius: '0' } }, h('strong', null, 'Belum ada interaksi'), h('span', null, 'Grafik akan terisi saat pembeli membuka produk.'));

  const categories = store.categories
    .map((category) => {
      const ids = store.products.filter((product) => product.kategori === category).map((product) => product.id);
      const value = ids.reduce((sum, id) => sum + (Number(views[id]) || 0) + (Number(waClicks[id]) || 0), 0);
      return { label: category, value };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const categoryTotal = categories.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const gradientStops = categories.map((item, index) => {
    const start = cursor;
    cursor += (item.value / categoryTotal) * 100;
    return `${CHART_COLORS[index % CHART_COLORS.length]} ${start}% ${cursor}%`;
  });

  const categoryPanelBody = categories.length
    ? h(
        'div',
        { class: 'donut-wrap' },
        h(
          'div',
          {
            class: 'donut',
            style: { background: `conic-gradient(${gradientStops.join(', ')})` },
            role: 'img',
            'aria-label': `Distribusi interaksi dari ${categories.length} kategori`,
          },
          h('div', { class: 'donut-center' }, h('strong', null, number(categoryTotal)), h('span', null, 'interaksi')),
        ),
        h(
          'div',
          { class: 'donut-legend' },
          ...categories.map((item, index) =>
            h(
              'div',
              { class: 'legend-row' },
              h('span', { class: 'swatch', style: { background: CHART_COLORS[index % CHART_COLORS.length] }, 'aria-hidden': 'true' }),
              h('span', { class: 'legend-name' }, item.label),
              h('small', null, `${Math.round((item.value / categoryTotal) * 100)}%`),
              h('strong', null, number(item.value)),
            ),
          ),
        ),
      )
    : h('div', { class: 'empty', style: { border: '0', borderRadius: '0' } }, h('strong', null, 'Belum ada interaksi'), h('span', null, 'Distribusi kategori muncul setelah ada kunjungan.'));

  const conversionRows = store.products
    .map((product) => {
      const seen = Number(views[product.id]) || 0;
      const clicks = Number(waClicks[product.id]) || 0;
      return { label: product.nama, seen, clicks, rate: seen ? Math.round((clicks / seen) * 100) : 0 };
    })
    .filter((row) => row.seen > 0 && row.clicks > 0)
    .sort((a, b) => b.rate - a.rate || b.clicks - a.clicks)
    .slice(0, 5);

  const conversionPanelBody = conversionRows.length
    ? h(
        'div',
        { class: 'chart' },
        ...conversionRows.map((row) =>
          h(
            'div',
            { class: 'bar-row', title: `${row.label}: ${number(row.clicks)} dari ${number(row.seen)} tayangan` },
            h('span', { class: 'bar-label' }, row.label),
            h('span', { class: 'bar-track' }, h('span', { class: 'bar-fill accent', style: { width: `${Math.max(row.rate, 2)}%` } })),
            h('span', { class: 'bar-value' }, `${row.rate}%`),
          ),
        ),
      )
    : h('div', { class: 'empty', style: { border: '0', borderRadius: '0' } }, h('strong', null, 'Belum ada klik WhatsApp'), h('span', null, 'Rasio kontak tampil setelah pembeli menghubungi seller.'));

  async function resetAnalytics() {
    const ok = await confirmAction({
      title: 'Reset analitik?',
      message: 'Semua data tayangan dan klik WhatsApp akan dikosongkan. Produk dan pengguna tidak terpengaruh.',
      confirmLabel: 'Reset analitik',
    });
    if (!ok) return;
    try {
      store.resetAnalytics();
      toast('Analitik dikosongkan.', 'success');
      ctx.refresh();
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  const stats = h(
    'div',
    { class: 'stats' },
    h('div', { class: 'stat accent' }, h('small', null, 'Tayangan produk'), h('strong', null, number(totalViews)), h('div', { class: 'stat-foot' }, 'Detail produk dibuka')),
    h('div', { class: 'stat' }, h('small', null, 'Klik WhatsApp'), h('strong', null, number(totalClicks)), h('div', { class: 'stat-foot' }, 'Pembeli menghubungi seller')),
    h('div', { class: 'stat' }, h('small', null, 'Rasio kontak'), h('strong', null, `${number(ratio)}%`), h('div', { class: 'stat-foot' }, `${number(totalClicks)} dari ${number(totalViews)} tayangan`)),
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
        h('p', { class: 'eyebrow' }, 'Admin · Analitik'),
        h('h1', null, 'Analitik'),
        h('p', null, 'Gambaran singkat minat pembeli: produk yang paling dilihat, yang paling sering dihubungi, dan sebaran minat per kategori.'),
      ),
      h('div', { class: 'head-actions' }, h('button', { class: 'btn danger', type: 'button', onClick: resetAnalytics }, 'Reset analitik')),
    ),
    stats,
    h(
      'div',
      { class: 'panel' },
      h('div', { class: 'panel-head' }, h('h2', null, 'Performa produk'), h('span', { class: 'small muted' }, 'tayangan · klik WhatsApp')),
      productChart,
    ),
    h(
      'div',
      { class: 'split-2', style: { marginTop: '16px' } },
      h('div', { class: 'panel' }, h('div', { class: 'panel-head' }, h('h2', null, 'Distribusi kategori'), h('span', { class: 'small muted' }, 'porsi interaksi')), categoryPanelBody),
      h('div', { class: 'panel' }, h('div', { class: 'panel-head' }, h('h2', null, 'Rasio kontak'), h('span', { class: 'small muted' }, 'klik ÷ tayangan')), conversionPanelBody),
    ),
    h('p', { class: 'notice', style: { marginTop: '16px' } }, 'Statistik dihitung dari aktivitas pada browser ini dan disimpan bersama data demo lainnya.'),
  );
}
