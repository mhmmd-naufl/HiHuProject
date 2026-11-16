import './styles.css';
import { init, store, subscribe } from './data/store.js';
import { createShell, homePath } from './ui/shell.js';
import { toast } from './utils/ui.js';
import { initTheme } from './utils/theme.js';
import { createLoginView } from './views/login.js';
import { createCatalogView } from './views/catalog.js';
import { createSellerProductsView } from './views/seller-products.js';
import { createSellerCategoriesView } from './views/seller-categories.js';
import { createAdminOverviewView } from './views/admin-overview.js';
import { createAdminUsersView } from './views/admin-users.js';
import { createAdminAnalyticsView } from './views/admin-analytics.js';
import { createAdminSettingsView } from './views/admin-settings.js';

const app = document.getElementById('app');

const routes = [
  { path: '/admin', roles: ['admin'], title: 'Dashboard', view: createAdminOverviewView },
  { path: '/pengguna', roles: ['admin'], title: 'Pengguna', view: createAdminUsersView },
  { path: '/analitik', roles: ['admin'], title: 'Analitik', view: createAdminAnalyticsView },
  { path: '/pengaturan', roles: ['admin'], title: 'Pengaturan', view: createAdminSettingsView },
  { path: '/produk', roles: ['seller'], title: 'Produk saya', view: createSellerProductsView },
  { path: '/kategori', roles: ['seller'], title: 'Kategori', view: createSellerCategoriesView },
  { path: '/katalog', roles: ['admin', 'seller', 'buyer'], title: 'Katalog', view: createCatalogView },
];

let renderedPath = null;

function currentPath() {
  return location.hash.replace(/^#/, '').trim();
}

function closeDialogs() {
  for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
}

function redirect(hash) {
  if (location.hash === hash) {
    render();
    return;
  }
  location.replace(hash);
}

function render() {
  const path = currentPath();
  const user = store.currentUser();

  if (!user) {
    if (path !== '/login') {
      redirect('#/login');
      return;
    }
    if (renderedPath !== '/login') closeDialogs();
    renderedPath = '/login';
    document.title = 'Masuk · HiHuJoki';
    app.replaceChildren(createLoginView());
    return;
  }

  if (!path || path === '/' || path === '/login') {
    redirect(`#${homePath(user.role)}`);
    return;
  }

  const route = routes.find((item) => item.path === path);
  if (!route) {
    toast('Halaman tidak ditemukan.', 'error');
    redirect(`#${homePath(user.role)}`);
    return;
  }

  if (!route.roles.includes(user.role)) {
    toast('Kamu tidak punya akses ke halaman itu.', 'error');
    redirect(`#${homePath(user.role)}`);
    return;
  }

  if (renderedPath !== path) closeDialogs();
  renderedPath = path;
  document.title = `${route.title} · HiHuJoki`;

  const ctx = {
    user,
    path,
    refresh: render,
  };
  app.replaceChildren(createShell({ user, path, view: route.view(ctx) }));
}

initTheme();
init();
window.addEventListener('hashchange', render);
subscribe(render);
render();
