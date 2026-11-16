import { clear, h, initials, option } from '../utils/dom.js';
import { formatDate, formatPhone, normalizePhone, number, ROLE_LABEL } from '../utils/format.js';
import { store } from '../data/store.js';
import { confirmAction, field, openDialog, toast } from '../utils/ui.js';

const ROLES = ['admin', 'seller', 'buyer'];

export function createAdminUsersView(ctx) {
  const state = { q: '', role: 'all' };

  function openUserForm(user = null) {
    const isEdit = Boolean(user);
    const errorBox = h('div', { class: 'form-error', role: 'alert', hidden: true });
    const showError = (message) => {
      errorBox.textContent = message;
      errorBox.hidden = !message;
    };

    const nameInput = h('input', { class: 'input', id: 'uf-nama', maxlength: '60', placeholder: 'Nama lengkap', value: user?.nama || '' });
    const phoneInput = h('input', { class: 'input', id: 'uf-phone', type: 'tel', inputmode: 'tel', placeholder: '0812 3450 0002', value: user?.phone || '', autocomplete: 'off' });
    const roleSelect = h(
      'select',
      { class: 'select', id: 'uf-role', value: user?.role || 'buyer' },
      ...ROLES.map((role) => option(role, ROLE_LABEL[role])),
    );
    const passwordInput = h('input', {
      class: 'input',
      id: 'uf-password',
      type: 'password',
      autocomplete: 'new-password',
      placeholder: isEdit ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter',
    });
    const activeInput = h('input', { type: 'checkbox', id: 'uf-aktif', checked: user ? user.aktif : true });

    const form = h(
      'form',
      {
        class: 'form-grid',
        id: 'user-form',
        novalidate: true,
        onSubmit: (event) => {
          event.preventDefault();
          const draft = {
            nama: nameInput.value,
            phone: phoneInput.value,
            role: roleSelect.value,
            password: passwordInput.value || (isEdit ? user.password : ''),
            aktif: activeInput.checked,
          };
          try {
            const result = isEdit ? store.updateUser(user.id, draft) : store.createUser(draft);
            if (!result.ok) {
              showError(result.error);
              return;
            }
            dialog.close();
            toast(isEdit ? 'Pengguna diperbarui.' : 'Pengguna ditambahkan.', 'success');
            ctx.refresh();
          } catch (error) {
            showError(error.message);
          }
        },
      },
      field('Nama pengguna', nameInput),
      field('Nomor HP', phoneInput, 'Nomor ini dipakai untuk masuk ke aplikasi. Boleh diawali 08 atau 62.'),
      h('div', { class: 'two-col' }, field('Peran', roleSelect), field(isEdit ? 'Kata sandi baru' : 'Kata sandi', passwordInput, isEdit ? 'Biarkan kosong untuk memakai kata sandi lama.' : undefined)),
      h('label', { class: 'check' }, activeInput, 'Akun aktif dan dapat masuk'),
      errorBox,
    );

    let dialog;
    dialog = openDialog({
      title: isEdit ? 'Edit pengguna' : 'Tambah pengguna',
      subtitle: isEdit ? 'Perbarui data, peran, atau status akun.' : 'Buat akun baru untuk admin, seller, atau pembeli.',
      width: 'min(600px, calc(100vw - 32px))',
      body: form,
      actions: [
        h('button', { class: 'btn outline', type: 'button', onClick: () => dialog.close() }, 'Batal'),
        h('button', { class: 'btn primary', type: 'submit', form: 'user-form' }, isEdit ? 'Simpan perubahan' : 'Tambah pengguna'),
      ],
    });
  }

  async function removeUser(user) {
    const ok = await confirmAction({
      title: 'Hapus pengguna?',
      message: `Akun ${user.nama} (${formatPhone(user.phone)}) akan dihapus permanen. Seller yang masih memiliki produk tidak dapat dihapus.`,
      confirmLabel: 'Hapus pengguna',
    });
    if (!ok) return;
    const result = store.deleteUser(user.id);
    if (!result.ok) {
      toast(result.error, 'error');
      return;
    }
    toast('Pengguna dihapus.', 'success');
    ctx.refresh();
  }

  const tableBody = h('div', { class: 'table-wrap' });

  function renderTable() {
    const query = state.q.trim().toLowerCase();
    const phoneQuery = normalizePhone(state.q);
    const filtered = store.users.filter((user) => {
      if (state.role !== 'all' && user.role !== state.role) return false;
      if (!query) return true;
      if (`${user.nama} ${user.phone} ${formatPhone(user.phone)}`.toLowerCase().includes(query)) return true;
      return phoneQuery.length >= 3 && user.phone.includes(phoneQuery);
    });

    clear(tableBody);
    if (filtered.length === 0) {
      tableBody.append(
        h(
          'div',
          { class: 'empty', style: { border: '0' } },
          h('strong', null, 'Pengguna tidak ditemukan'),
          h('span', null, 'Coba kata kunci atau peran lain.'),
        ),
      );
      return;
    }

    tableBody.append(
      h(
        'table',
        null,
        h(
          'thead',
          null,
          h(
            'tr',
            null,
            h('th', null, 'Pengguna'),
            h('th', null, 'Peran'),
            h('th', null, 'Status'),
            h('th', null, 'Dibuat'),
            h('th', { style: { textAlign: 'right' } }, 'Aksi'),
          ),
        ),
        h(
          'tbody',
          null,
          ...filtered.map((user) => {
            const self = store.currentUser()?.id === user.id;
            return h(
              'tr',
              null,
              h(
                'td',
                null,
                h(
                  'div',
                  { class: 'cell-product' },
                  h('span', { class: 'avatar', 'aria-hidden': 'true' }, initials(user.nama)),
                  h('div', null, h('strong', null, user.nama, self ? h('span', { class: 'small muted' }, ' (kamu)') : null), h('span', null, formatPhone(user.phone))),
                ),
              ),
              h('td', null, h('span', { class: `tag ${user.role === 'admin' ? 'accent' : user.role === 'seller' ? 'success' : 'neutral'}` }, ROLE_LABEL[user.role])),
              h('td', null, user.aktif ? h('span', { class: 'tag success' }, 'Aktif') : h('span', { class: 'tag danger' }, 'Nonaktif')),
              h('td', { class: 'small muted' }, formatDate(user.createdAt)),
              h(
                'td',
                { class: 'actions' },
                h(
                  'div',
                  { class: 'row-actions' },
                  h('button', { class: 'btn outline sm', type: 'button', onClick: () => openUserForm(user) }, 'Edit'),
                  h(
                    'button',
                    {
                      class: 'btn danger sm',
                      type: 'button',
                      disabled: self,
                      title: self ? 'Tidak dapat menghapus akun yang sedang dipakai' : undefined,
                      onClick: () => removeUser(user),
                    },
                    'Hapus',
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }

  const searchInput = h('input', {
    class: 'input search',
    type: 'search',
    placeholder: 'Cari nama atau nomor HP…',
    'aria-label': 'Cari pengguna',
    onInput: (event) => {
      state.q = event.target.value;
      renderTable();
    },
  });

  const roleFilter = h(
    'select',
    {
      class: 'select',
      'aria-label': 'Filter peran',
      value: 'all',
      onChange: (event) => {
        state.role = event.target.value;
        renderTable();
      },
    },
    option('all', 'Semua peran'),
    ...ROLES.map((role) => option(role, ROLE_LABEL[role])),
  );

  renderTable();

  const count = (role) => store.users.filter((user) => user.role === role).length;

  return h(
    'div',
    null,
    h(
      'header',
      { class: 'page-head' },
      h(
        'div',
        null,
        h('p', { class: 'eyebrow' }, 'Admin · Pengguna'),
        h('h1', null, 'Pengguna'),
        h('p', null, 'Kelola akun admin, seller, dan pembeli, termasuk peran serta status aktifnya.'),
      ),
      h('div', { class: 'head-actions' }, h('button', { class: 'btn primary', type: 'button', onClick: () => openUserForm() }, 'Tambah pengguna')),
    ),
    h(
      'div',
      { class: 'stats' },
      h('div', { class: 'stat accent' }, h('small', null, 'Total pengguna'), h('strong', null, number(store.users.length)), h('div', { class: 'stat-foot' }, `${number(store.users.filter((user) => user.aktif).length)} aktif`)),
      h('div', { class: 'stat' }, h('small', null, 'Admin'), h('strong', null, number(count('admin'))), h('div', { class: 'stat-foot' }, 'Akses penuh')),
      h('div', { class: 'stat' }, h('small', null, 'Seller'), h('strong', null, number(count('seller'))), h('div', { class: 'stat-foot' }, 'Mengelola produk')),
      h('div', { class: 'stat' }, h('small', null, 'Pembeli'), h('strong', null, number(count('buyer'))), h('div', { class: 'stat-foot' }, 'Menghubungi via WA')),
    ),
    h(
      'div',
      { class: 'panel' },
      h(
        'div',
        { class: 'panel-head' },
        h('div', null, h('h2', null, 'Daftar pengguna'), h('p', { class: 'small muted' }, 'Kata sandi demo tersimpan lokal di browser.')),
        h('div', { class: 'toolbar', style: { margin: '0' } }, searchInput, roleFilter),
      ),
      tableBody,
    ),
  );
}
