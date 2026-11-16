import { SEED_ANALYTICS, SEED_PRODUCTS, SEED_SETTINGS, SEED_USERS } from './seed.js';
import { isValidPhone, normalizePhone, uid } from '../utils/format.js';

export const KEYS = {
  users: 'hihujoki.users.v2',
  products: 'hihujoki.products.v2',
  settings: 'hihujoki.settings.v1',
  analytics: 'hihujoki.analytics.v1',
  session: 'hihujoki.session.v1',
};

const ROLES = ['admin', 'seller', 'buyer'];
const MAX_EVENTS = 60;
const listeners = new Set();
const dirty = new Set();

const state = {
  users: [],
  products: [],
  settings: { whatsapp: SEED_SETTINGS.whatsapp, categories: [...SEED_SETTINGS.categories] },
  analytics: { views: {}, waClicks: {}, events: [] },
  session: null,
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const nowIso = () => new Date().toISOString();

function recordEvent(type, productId) {
  if (!state.products.some((product) => product.id === productId)) return;
  const bucket = type === 'view' ? 'views' : 'waClicks';
  const analytics = {
    views: { ...state.analytics.views },
    waClicks: { ...state.analytics.waClicks },
    events: [
      {
        id: uid('e'),
        type,
        productId,
        userId: state.session?.userId || null,
        at: nowIso(),
      },
      ...state.analytics.events,
    ].slice(0, MAX_EVENTS),
  };
  analytics[bucket][productId] = (analytics[bucket][productId] || 0) + 1;
  state.analytics = analytics;
  try {
    write(KEYS.analytics, analytics);
  } catch {
    /* Statistik tidak boleh mengganggu alur pembeli. */
  }
}

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error('Penyimpanan browser penuh. Hapus atau perkecil foto, lalu simpan ulang.');
  }
}

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

function isUser(user) {
  return (
    user &&
    typeof user.id === 'string' &&
    isNonEmptyString(user.nama) &&
    isValidPhone(user.phone) &&
    typeof user.password === 'string' &&
    ROLES.includes(user.role) &&
    typeof user.aktif === 'boolean'
  );
}

function isProduct(product) {
  return (
    product &&
    typeof product.id === 'string' &&
    isNonEmptyString(product.nama) &&
    isNonEmptyString(product.kategori) &&
    Number.isFinite(product.harga) &&
    product.harga >= 0 &&
    Number.isInteger(product.stok) &&
    product.stok >= 0 &&
    typeof product.deskripsi === 'string' &&
    typeof product.imageUrl === 'string' &&
    typeof product.unggulan === 'boolean'
  );
}

function isSettings(settings) {
  return (
    settings &&
    typeof settings === 'object' &&
    isValidPhone(settings.whatsapp) &&
    Array.isArray(settings.categories) &&
    settings.categories.length > 0 &&
    settings.categories.every(isNonEmptyString)
  );
}

function isAnalytics(analytics) {
  return (
    analytics &&
    typeof analytics === 'object' &&
    analytics.views &&
    analytics.waClicks &&
    Array.isArray(analytics.events)
  );
}

function loadUsers() {
  const raw = read(KEYS.users);
  if (Array.isArray(raw) && raw.length && raw.every(isUser)) return raw;
  dirty.add(KEYS.users);
  return clone(SEED_USERS);
}

function loadProducts() {
  const raw = read(KEYS.products);
  if (!Array.isArray(raw) || raw.length === 0 || !raw.every(isProduct)) {
    dirty.add(KEYS.products);
    return clone(SEED_PRODUCTS);
  }
  return raw.map((product) => ({
    ...product,
    sellerId: typeof product.sellerId === 'string' ? product.sellerId : 'u-002',
    createdAt: product.createdAt || nowIso(),
    updatedAt: product.updatedAt || product.createdAt || nowIso(),
  }));
}

function loadSettings() {
  const raw = read(KEYS.settings);
  if (isSettings(raw)) {
    return { whatsapp: normalizePhone(raw.whatsapp), categories: [...new Set(raw.categories.map((c) => c.trim()))] };
  }
  dirty.add(KEYS.settings);
  return clone(SEED_SETTINGS);
}

function loadAnalytics() {
  const raw = read(KEYS.analytics);
  if (isAnalytics(raw)) {
    return {
      views: { ...raw.views },
      waClicks: { ...raw.waClicks },
      events: raw.events.filter((event) => event && typeof event.productId === 'string').slice(0, MAX_EVENTS),
    };
  }
  dirty.add(KEYS.analytics);
  return clone(SEED_ANALYTICS);
}

function loadSession(users) {
  const raw = read(KEYS.session);
  const userId = raw && typeof raw.userId === 'string' ? raw.userId : null;
  const user = users.find((item) => item.id === userId && item.aktif);
  return user ? { userId: user.id } : null;
}

export function init() {
  state.users = loadUsers();
  state.products = loadProducts();
  state.settings = loadSettings();
  state.analytics = loadAnalytics();
  state.session = loadSession(state.users);

  for (const key of dirty) {
    const value =
      key === KEYS.users ? state.users
      : key === KEYS.products ? state.products
      : key === KEYS.settings ? state.settings
      : state.analytics;
    try {
      write(key, value);
    } catch {
      /* Data tetap tersedia di memori walau storage penuh. */
    }
  }
  dirty.clear();

  window.addEventListener('storage', (event) => {
    if (event.key && !event.key.startsWith('hihujoki.')) return;
    hydrate();
    notify();
  });
}

function hydrate() {
  state.users = loadUsers();
  state.products = loadProducts();
  state.settings = loadSettings();
  state.analytics = loadAnalytics();
  state.session = loadSession(state.users);
  if (dirty.size) {
    dirty.clear();
  }
}

function notify() {
  for (const listener of listeners) listener();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const store = {
  get users() {
    return state.users;
  },
  get products() {
    return state.products;
  },
  get settings() {
    return state.settings;
  },
  get analytics() {
    return state.analytics;
  },
  get categories() {
    const used = state.products.map((product) => product.kategori);
    return [...new Set([...state.settings.categories, ...used])].sort((a, b) => a.localeCompare(b, 'id'));
  },

  currentUser() {
    if (!state.session) return null;
    return state.users.find((user) => user.id === state.session.userId && user.aktif) || null;
  },

  login(phone, password) {
    const cleaned = normalizePhone(phone);
    const user = cleaned ? state.users.find((item) => item.phone === cleaned) : null;
    if (!user || user.password !== String(password ?? '')) {
      return { ok: false, error: 'Nomor HP atau kata sandi tidak cocok.' };
    }
    if (!user.aktif) {
      return { ok: false, error: 'Akun ini dinonaktifkan. Hubungi admin toko.' };
    }
    state.session = { userId: user.id };
    try {
      write(KEYS.session, state.session);
    } catch {
      /* Sesi tetap berlaku di memori walau storage tidak tersedia. */
    }
    return { ok: true, user };
  },

  logout() {
    state.session = null;
    try {
      localStorage.removeItem(KEYS.session);
    } catch {
      /* abaikan */
    }
  },

  /* ----- Users ----- */
  validateUser(draft, editingId = null) {
    const nama = String(draft.nama ?? '').trim();
    const phone = normalizePhone(draft.phone);
    const password = String(draft.password ?? '');
    if (nama.length < 2) return 'Nama pengguna minimal 2 karakter.';
    if (!isValidPhone(phone)) return 'Nomor HP harus 8–15 digit. Contoh: 081234500002.';
    if (state.users.some((user) => user.phone === phone && user.id !== editingId)) {
      return 'Nomor HP sudah dipakai pengguna lain.';
    }
    if (!ROLES.includes(draft.role)) return 'Pilih peran pengguna yang valid.';
    if (password.length < 6) return 'Kata sandi minimal 6 karakter.';
    return null;
  },

  createUser(draft) {
    const error = this.validateUser(draft);
    if (error) return { ok: false, error };
    const user = {
      id: uid('u'),
      nama: draft.nama.trim(),
      phone: normalizePhone(draft.phone),
      password: draft.password,
      role: draft.role,
      aktif: draft.aktif !== false,
      createdAt: nowIso(),
    };
    const users = [...state.users, user];
    write(KEYS.users, users);
    state.users = users;
    return { ok: true, user };
  },

  updateUser(id, draft) {
    const existing = state.users.find((user) => user.id === id);
    if (!existing) return { ok: false, error: 'Pengguna tidak ditemukan.' };
    const error = this.validateUser(draft, id);
    if (error) return { ok: false, error };

    const next = state.users.map((user) =>
      user.id === id
        ? {
            ...user,
            nama: draft.nama.trim(),
            phone: normalizePhone(draft.phone),
            password: draft.password,
            role: draft.role,
            aktif: draft.aktif !== false,
          }
        : user,
    );

    const activeAdmins = next.filter((user) => user.role === 'admin' && user.aktif);
    if (activeAdmins.length === 0) {
      return { ok: false, error: 'Minimal harus ada satu admin aktif.' };
    }

    write(KEYS.users, next);
    state.users = next;
    if (state.session && state.session.userId === id && !next.find((u) => u.id === id).aktif) {
      this.logout();
      notify();
    }
    return { ok: true };
  },

  deleteUser(id) {
    const user = state.users.find((item) => item.id === id);
    if (!user) return { ok: false, error: 'Pengguna tidak ditemukan.' };
    if (state.session && state.session.userId === id) {
      return { ok: false, error: 'Kamu tidak dapat menghapus akun yang sedang dipakai.' };
    }
    const remaining = state.users.filter((item) => item.id !== id);
    if (user.role === 'admin' && !remaining.some((item) => item.role === 'admin' && item.aktif)) {
      return { ok: false, error: 'Minimal harus ada satu admin aktif.' };
    }
    const owned = state.products.filter((product) => product.sellerId === id).length;
    if (owned > 0) {
      return { ok: false, error: `Seller masih memiliki ${owned} produk. Hapus atau pindahkan produknya dulu.` };
    }
    write(KEYS.users, remaining);
    state.users = remaining;
    return { ok: true };
  },

  /* ----- Products ----- */
  validateProduct(draft) {
    const nama = String(draft.nama ?? '').trim();
    const kategori = String(draft.kategori ?? '').trim();
    const deskripsi = String(draft.deskripsi ?? '').trim();
    const harga = Number(draft.harga);
    const stok = Number(draft.stok);
    if (!nama) return 'Nama produk wajib diisi.';
    if (nama.length > 80) return 'Nama produk maksimal 80 karakter.';
    if (!kategori) return 'Kategori wajib dipilih.';
    if (!this.categories.includes(kategori)) return 'Kategori tidak dikenal. Tambahkan dulu di menu Kategori.';
    if (!deskripsi) return 'Deskripsi wajib diisi.';
    if (!Number.isInteger(harga) || harga < 0) return 'Harga harus bilangan bulat 0 atau lebih.';
    if (!Number.isInteger(stok) || stok < 0) return 'Stok harus bilangan bulat 0 atau lebih.';
    return null;
  },

  createProduct(draft) {
    const error = this.validateProduct(draft);
    if (error) return { ok: false, error };
    const product = {
      id: uid('p'),
      nama: draft.nama.trim(),
      kategori: draft.kategori,
      harga: Number(draft.harga),
      stok: Number(draft.stok),
      deskripsi: draft.deskripsi.trim(),
      imageUrl: draft.imageUrl || 'local-placeholder://green',
      unggulan: Boolean(draft.unggulan),
      sellerId: draft.sellerId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const products = [product, ...state.products];
    write(KEYS.products, products);
    state.products = products;
    return { ok: true, product };
  },

  updateProduct(id, draft) {
    const existing = state.products.find((product) => product.id === id);
    if (!existing) return { ok: false, error: 'Produk tidak ditemukan.' };
    const error = this.validateProduct(draft);
    if (error) return { ok: false, error };
    const products = state.products.map((product) =>
      product.id === id
        ? {
            ...product,
            nama: draft.nama.trim(),
            kategori: draft.kategori,
            harga: Number(draft.harga),
            stok: Number(draft.stok),
            deskripsi: draft.deskripsi.trim(),
            imageUrl: draft.imageUrl || product.imageUrl,
            unggulan: Boolean(draft.unggulan),
            updatedAt: nowIso(),
          }
        : product,
    );
    write(KEYS.products, products);
    state.products = products;
    return { ok: true };
  },

  deleteProduct(id) {
    const products = state.products.filter((product) => product.id !== id);
    write(KEYS.products, products);
    state.products = products;

    const analytics = {
      views: { ...state.analytics.views },
      waClicks: { ...state.analytics.waClicks },
      events: state.analytics.events.filter((event) => event.productId !== id),
    };
    delete analytics.views[id];
    delete analytics.waClicks[id];
    state.analytics = analytics;
    try {
      write(KEYS.analytics, analytics);
    } catch {
      /* Statistik boleh gagal disimpan tanpa membatalkan hapus produk. */
    }
    return { ok: true };
  },

  /* ----- Categories ----- */
  addCategory(name) {
    const cleaned = String(name ?? '').trim();
    if (!cleaned) return { ok: false, error: 'Nama kategori wajib diisi.' };
    if (cleaned.length > 40) return { ok: false, error: 'Nama kategori maksimal 40 karakter.' };
    if (this.categories.some((category) => category.toLowerCase() === cleaned.toLowerCase())) {
      return { ok: false, error: 'Kategori sudah ada.' };
    }
    const settings = { ...state.settings, categories: [...state.settings.categories, cleaned] };
    write(KEYS.settings, settings);
    state.settings = settings;
    return { ok: true };
  },

  removeCategory(name) {
    const used = state.products.filter((product) => product.kategori === name).length;
    if (used > 0) {
      return { ok: false, error: `Kategori masih dipakai ${used} produk dan tidak dapat dihapus.` };
    }
    const settings = {
      ...state.settings,
      categories: state.settings.categories.filter((category) => category !== name),
    };
    if (settings.categories.length === 0) {
      return { ok: false, error: 'Minimal harus ada satu kategori.' };
    }
    write(KEYS.settings, settings);
    state.settings = settings;
    return { ok: true };
  },

  saveWhatsapp(input) {
    const phone = normalizePhone(input);
    if (!isValidPhone(phone)) {
      return { ok: false, error: 'Nomor WA harus 8–15 digit. Contoh: 6281234567890.' };
    }
    const settings = { ...state.settings, whatsapp: phone };
    write(KEYS.settings, settings);
    state.settings = settings;
    return { ok: true, phone };
  },

  /* ----- Analytics ----- */
  trackProductView(productId) {
    recordEvent('view', productId);
  },

  trackWaClick(productId) {
    recordEvent('wa', productId);
  },

  resetAnalytics() {
    const analytics = { views: {}, waClicks: {}, events: [] };
    write(KEYS.analytics, analytics);
    state.analytics = analytics;
    return { ok: true };
  },

  resetAll() {
    const users = clone(SEED_USERS);
    const products = clone(SEED_PRODUCTS);
    const settings = clone(SEED_SETTINGS);
    const analytics = clone(SEED_ANALYTICS);
    write(KEYS.users, users);
    write(KEYS.products, products);
    write(KEYS.settings, settings);
    write(KEYS.analytics, analytics);
    state.users = users;
    state.products = products;
    state.settings = settings;
    state.analytics = analytics;
    if (state.session && !users.some((user) => user.id === state.session.userId && user.aktif)) {
      this.logout();
      notify();
    }
    return { ok: true };
  },
};
