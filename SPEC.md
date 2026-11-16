# SPEC — HiHuJoki

## 1. Tujuan

HiHuJoki adalah prototipe katalog dan dashboard produk UMKM Joki Skripsi berbasis web untuk latihan satu hari. Calon pembeli dan pengelola toko memakai satu perangkat. Prototipe mengutamakan katalog minimalis, CRUD demo, upload foto lokal, pengaturan kategori, nomor WhatsApp yang dapat diubah, dan penyimpanan `localStorage` tanpa backend.

## 2. Pengguna dan skenario

### Calon pembeli

- Melihat katalog produk HiHuJoki.
- Mencari, memfilter kategori, dan mengurutkan produk.
- Melihat foto produk, harga Rupiah, stok, deskripsi, dan status unggulan.
- Menekan tombol pesan untuk membuka WhatsApp dengan teks produk yang sudah terisi.

### Pengelola toko

- Melihat ringkasan produk, stok, kategori, dan unggulan.
- Menambah, mengubah, menghapus produk, serta mengunggah foto dari perangkat.
- Menambah/menghapus kategori.
- Mengubah nomor WhatsApp tujuan dari panel Pengaturan.
- Mereset data produk ke delapan contoh awal bila diperlukan.

## 3. Fitur MVP

1. Branding **HiHuJoki** dengan tema visual minimalis: ruang putih, tipografi tegas, border tipis, dan satu warna aksen.
2. Katalog 8 produk contoh nonpribadi.
3. Placeholder lokal untuk produk tanpa foto.
4. Upload foto melalui `<input type="file">` untuk gambar lokal; foto disimpan sebagai Data URL di `localStorage` dan tidak diunggah ke server.
5. CRUD produk: nama, kategori, harga, stok, deskripsi, foto, dan unggulan.
6. Pencarian, filter kategori, dan sorting.
7. Tombol Pesan WhatsApp memakai nomor yang dapat diubah pengelola.
8. Pengelolaan kategori: tambah kategori baru dan hapus kategori yang tidak sedang dipakai.
9. Dashboard ringkasan total produk, stok, kategori, dan unggulan.
10. Reset data contoh dan penyimpanan produk, kategori, serta nomor WA melalui `localStorage`.
11. Tanpa backend, login palsu, API key, atau aset berhak cipta.

## 4. Data model

```js
{
  id: "p-001",
  nama: "Paket Konsultasi Bab 1",
  kategori: "Konsultasi",
  harga: 75000,
  stok: 12,
  deskripsi: "...",
  imageUrl: "data:image/png;base64,..." // atau local-placeholder://green
  unggulan: true
}
```

Penyimpanan:

- `hihujoki.products.v2`: array produk.
- `hihujoki.settings.v1`: `{ whatsapp: "6281234567890", categories: [...] }`.

Harga harus angka bulat `>= 0`; stok harus integer `>= 0`. Nomor WA disimpan sebagai digit internasional tanpa `+`, spasi, atau tanda baca.

## 5. Nonfunctional requirements

- Antarmuka Bahasa Indonesia, responsif, minimalis, dan dapat digunakan dengan keyboard.
- Tidak ada request jaringan untuk katalog, foto, kategori, atau penyimpanan.
- Foto dibatasi ke gambar dan maksimal 1 MB agar localStorage tidak cepat penuh.
- Nilai input pengguna dirender dengan `textContent`, bukan HTML mentah.
- Data contoh nonpribadi; nomor WA awal hanya nomor demo.
- Jika localStorage rusak, aplikasi kembali ke data contoh.
- Penghapusan produk/kategori dan reset memakai konfirmasi browser.
- Prototipe dapat dibuka langsung sebagai `index.html`; target produksi tetap Vite + JavaScript vanilla.

## 6. Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| localStorage penuh karena foto | Simpan gagal | Batasi foto 1 MB, tampilkan pesan, dan sarankan foto lebih kecil |
| Browser memblokir file/data URL | Foto tidak tampil | Gunakan placeholder lokal sebagai fallback |
| Nomor WA salah format | Pesan tidak sampai | Validasi digit minimal 8 karakter dan tampilkan format yang diharapkan |
| Kategori dihapus saat masih dipakai | Produk kehilangan kategori | Tolak penghapusan kategori yang sedang dipakai |
| Data hilang saat storage dibersihkan | Perubahan lokal hilang | Jelaskan sifat lokal dan sediakan reset/re-entry data |
| Dua tab tidak sinkron | Tampilan berbeda | Dengarkan event `storage` |

## 7. Out of scope

Backend/database/cloud sync, login dan role, checkout/pembayaran, keranjang, API WhatsApp otomatis, upload server/CDN, analytics produksi, multi-device, backup otomatis, deployment, dan verifikasi legal/etis layanan akademik.

## 8. Acceptance criteria manual

1. Membuka `index.html` menampilkan nama HiHuJoki, tema minimalis, tab Katalog, dan 8 produk contoh.
2. Kartu produk menampilkan foto atau placeholder lokal, nama, kategori, Rupiah, stok, deskripsi, dan tombol WhatsApp.
3. Pencarian, filter kategori, dan sorting mengubah daftar secara benar.
4. Dashboard menampilkan ringkasan yang konsisten dengan data katalog.
5. Form tambah/edit dapat menyimpan nama, kategori, harga, stok, deskripsi, unggulan, dan foto lokal.
6. Memilih file bukan gambar atau lebih dari 1 MB ditolak dengan pesan; gambar valid tampil pada preview/kartu setelah disimpan.
7. Menambah kategori membuatnya tersedia di filter dan form; kategori yang masih dipakai tidak dapat dihapus.
8. Mengubah nomor WA di Pengaturan, menyimpan, lalu menekan pesan membuka `wa.me` dengan nomor baru dan nama produk.
9. Harga negatif/desimal, stok negatif/desimal, field wajib kosong, dan nomor WA tidak valid ditolak.
10. Edit dan hapus memperbarui katalog, tabel, dan statistik; hapus meminta konfirmasi.
11. Refresh browser mempertahankan produk, foto, kategori, dan nomor WA.
12. Reset demo mengembalikan 8 produk, kategori awal, dan nomor WA demo setelah konfirmasi.
13. Tidak ada API key, login palsu, aset eksternal, atau data pribadi pada source.

## 9. Implementation plan per iterasi

### Iterasi 0 — Kontrak data dan minimal theme

Definisikan seed, storage key, settings, token warna minimalis, validasi, dan utilitas format Rupiah.

### Iterasi 1 — Katalog

Bangun kartu foto/placeholder, pencarian, filter kategori, sorting, ringkasan, serta tombol WhatsApp berbasis settings.

### Iterasi 2 — CRUD dan upload foto

Bangun form produk, preview FileReader, validasi tipe/ukuran, simpan Data URL, edit, hapus, dan reset.

### Iterasi 3 — Kategori dan pengaturan WA

Bangun panel tambah/hapus kategori, validasi kategori terpakai, input nomor WA, dan persistensi settings.

### Iterasi 4 — Uji dan handoff

Uji refresh, storage rusak/penuh, viewport sempit, file tidak valid, link WA, serta audit source untuk jaringan eksternal/API key.
