const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});
const decimal = new Intl.NumberFormat('id-ID');
const dateFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export const money = (value) => rupiah.format(Number(value) || 0);
export const number = (value) => decimal.format(Number(value) || 0);
export const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormat.format(date);
};

export function timeAgo(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return 'baru saja';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} menit lalu`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} jam lalu`;
  if (diff < 2_592_000_000) return `${Math.floor(diff / 86_400_000)} hari lalu`;
  return formatDate(date);
}

/** Hanya digit, awalan 0 diubah ke kode negara 62. */
export function normalizePhone(input) {
  const digits = String(input ?? '').replace(/\D/g, '');
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
}

export function isValidPhone(input) {
  return /^\d{8,15}$/.test(normalizePhone(input));
}

/** Tampilan ramah: 6281234500002 → +62 812-3450-0002. */
export function formatPhone(input) {
  const phone = normalizePhone(input);
  if (!phone) return '—';
  if (!phone.startsWith('62')) return `+${phone}`;
  const rest = phone.slice(2);
  const groups = [rest.slice(0, 3), ...(rest.slice(3).match(/\d{1,4}/g) || [])].filter(Boolean);
  return `+62 ${groups.join('-')}`;
}

export function uid(prefix) {
  const random = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${Date.now().toString(36)}${random}`;
}

export const ROLE_LABEL = { admin: 'Admin', seller: 'Seller', buyer: 'Pembeli' };

export const PLACEHOLDER_TONES = ['green', 'blue', 'pink', 'purple', 'sand'];

export function placeholderTone(seed) {
  const text = String(seed ?? '');
  let sum = 0;
  for (const char of text) sum += char.charCodeAt(0);
  return PLACEHOLDER_TONES[sum % PLACEHOLDER_TONES.length];
}
