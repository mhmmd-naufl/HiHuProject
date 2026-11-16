import { h, initials } from '../utils/dom.js';
import { number, ROLE_LABEL } from '../utils/format.js';
import { icon } from '../utils/icons.js';
import { store } from '../data/store.js';
import { createThemeToggle } from './theme-toggle.js';

export function homePath(role) {
  if (role === 'admin') return '/admin';
  if (role === 'seller') return '/produk';
  return '/katalog';
}

function navigationFor(user) {
  const groups = [];

  if (user.role === 'admin') {
    groups.push({
      label: 'Admin',
      links: [
        { path: '/admin', label: 'Dashboard', icon: 'dashboard' },
        { path: '/pengguna', label: 'Pengguna', icon: 'users', count: store.users.length },
        { path: '/analitik', label: 'Analitik', icon: 'chart' },
      ],
    });
    groups.push({
      label: 'Toko',
      links: [
        { path: '/katalog', label: 'Katalog', icon: 'store' },
        { path: '/pengaturan', label: 'Pengaturan', icon: 'settings' },
      ],
    });
  } else if (user.role === 'seller') {
    const mine = store.products.filter((product) => product.sellerId === user.id).length;
    groups.push({
      label: 'Toko saya',
      links: [
        { path: '/produk', label: 'Produk', icon: 'box', count: mine },
        { path: '/kategori', label: 'Kategori', icon: 'tags' },
      ],
    });
    groups.push({
      label: 'Jelajah',
      links: [{ path: '/katalog', label: 'Katalog', icon: 'store' }],
    });
  } else {
    groups.push({
      label: 'Belanja',
      links: [{ path: '/katalog', label: 'Katalog produk', icon: 'store' }],
    });
  }

  return groups;
}

function navLink({ path, label, icon: iconName, count, active }) {
  return h(
    'a',
    {
      class: `nav-link${active ? ' active' : ''}`,
      href: `#${path}`,
      'aria-current': active ? 'page' : null,
    },
    h('span', { class: 'nav-icon', 'aria-hidden': 'true' }, icon(iconName || 'box', { size: 17 })),
    h('span', { class: 'nav-text' }, label),
    count === undefined ? null : h('span', { class: 'nav-count' }, number(count)),
  );
}

function brand({ small = false } = {}) {
  return h(
    'a',
    { class: 'brand', href: '#/', 'aria-label': 'HiHuJoki, kembali ke beranda' },
    h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'HH'),
    h(
      'span',
      null,
      h('span', { class: 'brand-name', style: small ? { fontSize: '15px' } : undefined }, 'HiHuJoki'),
      h('span', { class: 'brand-sub', style: { display: 'block' } }, 'Katalog layanan'),
    ),
  );
}

function logout() {
  store.logout();
  location.hash = '#/login';
}

export function createShell({ user, path, view }) {
  const groups = navigationFor(user);
  const links = groups.flatMap((group) => group.links);

  const sidebar = h(
    'aside',
    { class: 'sidebar' },
    brand(),
    h(
      'nav',
      { class: 'nav', 'aria-label': 'Navigasi utama' },
      ...groups.map((group) =>
        h(
          'div',
          null,
          h('div', { class: 'nav-label' }, group.label),
          ...group.links.map((link) => navLink({ ...link, active: link.path === path })),
        ),
      ),
    ),
    h(
      'div',
      { class: 'sidebar-foot' },
      h(
        'div',
        { class: 'user-chip' },
        h('span', { class: 'avatar', 'aria-hidden': 'true' }, initials(user.nama)),
        h(
          'div',
          { class: 'user-meta' },
          h('strong', null, user.nama),
          h('span', null, ROLE_LABEL[user.role]),
        ),
      ),
      createThemeToggle({ className: 'block' }),
      h(
        'button',
        { class: 'btn outline sm block logout-btn', type: 'button', onClick: logout },
        h('span', { 'aria-hidden': 'true' }, icon('logout', { size: 15 })),
        'Keluar',
      ),
    ),
  );

  const mobileBar = h(
    'div',
    { class: 'mobile-bar' },
    brand({ small: true }),
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
      h(
        'span',
        { class: 'user-chip' },
        h('span', { class: 'avatar', 'aria-hidden': 'true' }, initials(user.nama)),
        h(
          'span',
          { class: 'user-meta' },
          h('strong', null, user.nama),
          h('span', null, ROLE_LABEL[user.role]),
        ),
      ),
      createThemeToggle({ compact: true }),
      h('button', { class: 'btn ghost sm', type: 'button', onClick: logout, 'aria-label': 'Keluar dari akun' }, h('span', { 'aria-hidden': 'true' }, icon('logout', { size: 15 }))),
    ),
  );

  const mobileNav = h(
    'nav',
    { class: 'mobile-nav', 'aria-label': 'Navigasi utama versi seluler' },
    ...links.map((link) => navLink({ ...link, active: link.path === path })),
  );

  return h(
    'div',
    { class: 'app-shell' },
    sidebar,
    h(
      'div',
      { class: 'main' },
      mobileBar,
      mobileNav,
      h('main', { class: 'content' }, view),
    ),
  );
}
