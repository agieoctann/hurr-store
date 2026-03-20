# Product Requirements Document (PRD)

**Nama Proyek:** E-Commerce App (Fashion & Apparel)
**Platform:** Android, iOS, dan Web Apps

## 1. Pendahuluan
Dokumen ini mendefinisikan spesifikasi dan kebutuhan produk untuk pengembangan aplikasi e-commerce penjualan produk pakaian. Aplikasi ini dirancang beroperasi secara multiplatform (Android, iOS, dan Web) dengan berfokus pada kemudahan berbelanja bagi pengguna (pembeli), serta alat manajemen operasional dan keuangan yang komprehensif bagi admin (penjual).

## 2. Tujuan Produk
- Memberikan pengalaman berbelanja pakaian online yang cepat, interaktif, dan mulus pada perangkat mobile maupun web.
- Mendukung pemantauan dan pengelolaan inventaris (stok), pesanan, serta pembaruan produk secara *real-time*.
- Mencatat transaksi keuangan secara akurat beserta arus kas untuk mempermudah perhitungan laba kotor dan bersih dengan otomatis.
- Mempermudah interaksi dan layanan pelanggan antara pembeli dan penjual langsung di dalam aplikasi melalui fitur komunikasi komunikasi interaktif (Live Chat).

---

## 3. Fitur Utama

### 3.1. Autentikasi dan Manajemen Pengguna (Multi-User)
Aplikasi mendukung sistem peran ganda (Role-Based Access Control) untuk memastikan akses yang aman dan relevan.

1. **Admin (Hak Akses Penuh)**
   - Login aman menggunakan email/username & kredensial password admin.
   - Punya kendali penuh untuk CRUD produk, pantau data, lihat keuangan, dan manajemen transaksi keseluruhan platform.

2. **User/Pembeli (Hak Akses Terbatas)**
   - Mendaftar (Register) dan Masuk (Login) menggunakan Email, Nomor Telepon, atau **Social Media** (Google, Facebook, Apple ID).
   - Akses spesifik ke Dashboard Produk (katalog), manajemen Keranjang (Cart), profil akun pribadi, dan histori transaksi belanja.

### 3.2. Dashboard Admin
Pusat kendali utama bagi pengelola/pemilik bisnis:

- **Monitoring Penjualan Real-time:** Menampilkan grafik tren penjualan harian/bulanan, metrik pesanan yang masuk, dan ringkasan aktivitas penjualan hari ini.
- **Manajemen Inventaris & Katalog Produk:**
   - Menambah produk baru ke etalase toko beserta galeri gambar, Harga Jual, HPP (Harga Modal), deskripsi, varian detail seperti ukuran (S, M, L) dan warna.
   - Mengedit/update produk kapan saja serta menerapkan fitur marketing seperti harga **Promo** dan **Diskon** (potongan nominal/persen).
- **Pengingat Stok (Low-Stock Alerts):**
   - Indikator peringatan dan notifikasi *real-time* jika stok suatu SKU / varian produk menyentuh ambang minimum yang telah disetel.
- **Laporan Keuangan & Laporan Laba Rugi:**
   - Kalkulasi otomatis rasio Laba Kotor dan Laba Bersih.
   - Pencatatan keuangan secara *real-time* mencakup uang masuk (pendapatan sales), dan uang keluar (retur barang, biaya layanan, dll).
- **Monitoring Aktivitas Pengguna (User Online):**
   - Menyajikan data berapa jumlah pengguna aktif yang sedang membuka aplikasi saat ini berdasarkan sesi aktif web/mobile.
- **Notifikasi Pesanan (Checkout Alerts):**
   - Push notification seketika untuk perangkat Admin apabila terdapat pengguna yang baru saja mengkonfirmasi/sukses melakukan checkout dan pelunasan pembayaran.

### 3.3. Dashboard User & Proses Checkout
Pengalaman interface interaktif bagian depan (_Front-end storefront_):

- **Katalog Produk & Discovery:** Menampilkan etalase produk pada dashboard utama pengguna. Didukung filter kategori, fitur pencarian produk terpadu, dan sorotan label diskon/promo.
- **Manajemen Profil & Alamat:** Pembeli dapat menambah, mengedit, dan menyimpan satu atau banyak alamat penerima untuk pesanan mereka (Alamat Rumah, Kantor, dll).
- **Sistem Checkout Pesanan:**
   - Halaman perincian akhir sebelum pembelian (Pemilihan kurir pengiriman otomatis dari API Logistik, pemilihan alamat tujuan yang presisi, ringkasan keranjang).
- **Payment Gateway (Pembayaran Aman):**
   - Terintegrasi pihak ketiga Payment Gateway populer (e.g., Midtrans, Xendit).
   - Mendukung pembayaran cepat melalui **QRIS**.
   - Mendukung **Bank Transfer** instan (melalui Virtual Account penerbit bank) yang memverifikasi pelunasan secara otomatis.

### 3.4. Live Chat Real-time
- **B2C Chat:** Pembeli bisa menekan tombol `Chat Admin` kapan pun saat membuka aplikasi, hingga chat spesifik melampirkan produk yang tengah mereka lihat/ingin tanyakan.
- **Admin Inbox Room:** Admin bisa membalas secara simultan (multi-chat room handling) dengan dukungan read receipts dan penanda unread pesan.

---

## 4. Skema Database (Laporan Keuangan & Laba Rugi) 
Struktur di bawah dirancang untuk Relational Database (seperti PostgreSQL / MySQL) untuk melayani modul Keuangan dan Laba Rugi secara otomatis dari setiap transaksi checkout (sumber kebenaran tunggal).

### Tabel 1: `products` (Katalog Utama)
Fungsi: Menyimpan rincian master produk, sangat krusial agar memisahkan harga modal dan harga jual demi kalkulasi margin.
- `id` (PK, UUID / INT)
- `name` (VARCHAR): Nama baju/produk.
- `cost_price` (DECIMAL): **Harga Modal / Beli** produk (Ini inti untuk penentuan Laba/Rugi).
- `selling_price` (DECIMAL): Harga jual normal ke konsumen.
- `stock` (INT): Kuantitas fisik berjalan.
- `min_stock` (INT): Threshold stok minimal (Trigger peringatan admin).

### Tabel 2: `orders` (Invoice Transaksi)
Fungsi: Bukti transaksi makro.
- `id` (PK, UUID / INT)
- `user_id` (FK, berelasi kepada pembeli).
- `shipping_address_id` (FK, berelasi kepada snapshot alamat pengiriman).
- `final_total_amount` (DECIMAL): Total pembayaran pesanan setelah ongkir & diskon dikalkulasi.
- `payment_method` (ENUM): `QRIS`, `BANK_TRANSFER`.
- `payment_status` (ENUM): `PENDING`, `COMPLETED`, `FAILED`.

### Tabel 3: `order_items` (Snapshot Riwayat Barang Terjual)
Fungsi: Mencatat barang di dalam pesanan. Diperlukan untuk memastikan perubahan harga di tabel `products` ke depannya tidak merusak history pelaporan finansial masa lalu.
- `id` (PK)
- `order_id` (FK, referensi ke tabel orders).
- `product_id` (FK, referensi ke tabel products).
- `qty` (INT): Jumlah barang.
- `price_at_buy` (DECIMAL): Harga aktual saat terjadi deal pesanan (termasuk jika user memakai diskon/promo).
- `cost_at_buy` (DECIMAL): Harga modal (HPP) saat terjadinya deal pesanan (**Variabel mutlak pembentuk Laba Kotor**).

### Tabel 4: `financial_ledgers` (Buku Kas & Uang Real-time)
Fungsi: Mencatat seluruh jejak rekam mutasi Uang Masuk dan Keluar platform secara utuh di luar transaksi order saja, dan ini menjadi rujukan hitungan Laba Bersih.
- `id` (PK)
- `transaction_date` (TIMESTAMP).
- `type` (ENUM): `INCOME` (Uang Masuk) atau `EXPENSE` (Uang Keluar).
- `category` (ENUM): `SALES_REVENUE`, `RESTOCK_COST`, `OPERATIONAL_EXPENSE`, `REFUND`.
- `amount` (DECIMAL): Nominal uang.
- `reference_id` (VARCHAR): (opsional) ID referensi, seperti "Order#1234" jika ini hasil penjualan.
- `description` (TEXT): Catatan lengkap untuk referensi audit.

### Logika Penyajian Laporan Keuangan (Views)
Pendekatan backend query untuk kalkulasi dashboard finansial otomatis:

1. **Total Pembapatan Kotor / Revenue (Uang Masuk)**
   - Agregasi: `SUM(amount)` dari tabel `financial_ledgers` dengan kondisi `type = 'INCOME'` dan payment lunas.
2. **Total Pengeluaran (Uang Keluar)**
   - Agregasi: `SUM(amount)` dari tabel `financial_ledgers` dengan kondisi `type = 'EXPENSE'`.
3. **Laba Kotor (Gross Profit) dari Penjualan**
   - Agregasi dari *setiap produk yang lunas dibeli*: 
     `SUM( (order_items.price_at_buy * order_items.qty) - (order_items.cost_at_buy * order_items.qty) )`
     (Ini membandingkan harga jual real dikurangi modalnya).
4. **Laba Bersih (Net Profit)**
   - Agregasi Laba Kotor _dikurangi_ total biaya Operasional (Dari `financial_ledgers` yang category `OPERATIONAL_EXPENSE`).

---
_**Catatan Teknis Tambahan**: Pembuatan proyek e-commerce semacam ini sangat baik didukung dengan arsitektur microservices terpisah atau Monolithic API (Node.js/Go/PHP Laravel) bersama dengan Socket.io atau Firebase untuk mengakomodir kebutuhan Live Chat dan Webhook Gateway demi notifikasi pembayaran instan secara realtime._
