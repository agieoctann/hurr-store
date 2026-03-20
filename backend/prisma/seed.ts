import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const dbPath = path.resolve(process.cwd(), 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });


const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ── ADMIN ACCOUNT ──────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hurr.com' },
    update: {},
    create: {
      email: 'admin@hurr.com',
      passwordHash: adminHash,
      role: 'ADMIN',
      name: 'Administrator',
    },
  });
  console.log(`✅ Admin: ${admin.email} / admin123`);

  // ── USER ACCOUNT ────────────────────────────────────────────────────────────
  const userHash = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@hurr.com' },
    update: {},
    create: {
      email: 'user@hurr.com',
      passwordHash: userHash,
      role: 'USER',
      name: 'Pelanggan Demo',
    },
  });
  console.log(`✅ User:  ${user.email} / user123`);

  // ── SAMPLE PRODUCTS ─────────────────────────────────────────────────────────
  const products = [
    {
      name: 'Kaos Polos Premium',
      description: 'Kaos polos berbahan cotton combed 30s, adem dan nyaman dipakai seharian.',
      category: 'Pakaian',
      brand: 'Hurr Basics',
      material: 'Cotton',
      color: 'Putih',
      weight: '180',
      sizes: JSON.stringify(['S','M','L','XL','XXL']),
      stockPerSize: JSON.stringify({ S:15, M:20, L:18, XL:12, XXL:8 }),
      costPrice: 45000,
      sellingPrice: 89000,
      stock: 73,
      minStock: 10,
      discount: 0,
    },
    {
      name: 'Hoodie Fleece Oversize',
      description: 'Hoodie tebal anti angin cocok untuk musim hujan, desain oversize modern.',
      category: 'Pakaian',
      brand: 'Hurr Street',
      material: 'Fleece',
      color: 'Abu-abu',
      weight: '450',
      sizes: JSON.stringify(['M','L','XL','XXL']),
      stockPerSize: JSON.stringify({ M:10, L:14, XL:9, XXL:5 }),
      costPrice: 120000,
      sellingPrice: 229000,
      stock: 38,
      minStock: 5,
      discount: 10,
    },
    {
      name: 'Celana Jogger Casual',
      description: 'Celana jogger elastis bahan cotton stretch, cocok untuk aktivitas santai.',
      category: 'Pakaian',
      brand: 'Hurr Sport',
      material: 'Spandex',
      color: 'Hitam',
      weight: '320',
      sizes: JSON.stringify(['S','M','L','XL']),
      stockPerSize: JSON.stringify({ S:8, M:15, L:13, XL:7 }),
      costPrice: 75000,
      sellingPrice: 149000,
      stock: 43,
      minStock: 8,
      discount: 0,
    },
    {
      name: 'Kemeja Flanel Kotak',
      description: 'Kemeja flanel motif kotak-kotak klasik, cocok untuk gaya casual.',
      category: 'Pakaian',
      brand: 'Hurr Casual',
      material: 'Linen',
      color: 'Merah-Hitam',
      weight: '280',
      sizes: JSON.stringify(['S','M','L','XL','XXL']),
      stockPerSize: JSON.stringify({ S:6, M:10, L:8, XL:5, XXL:3 }),
      costPrice: 95000,
      sellingPrice: 189000,
      stock: 32,
      minStock: 5,
      discount: 5,
    },
    {
      name: 'Tote Bag Canvas Premium',
      description: 'Tas tote berbahan canvas tebal, kuat dan ramah lingkungan.',
      category: 'Aksesoris',
      brand: 'Hurr Eco',
      material: 'Cotton',
      color: 'Natural',
      weight: '200',
      sizes: JSON.stringify([]),
      stockPerSize: JSON.stringify({}),
      costPrice: 35000,
      sellingPrice: 79000,
      stock: 50,
      minStock: 10,
      discount: 0,
    },
    {
      name: 'Jaket Denim Slim Fit',
      description: 'Jaket denim klasik slim fit, awet dan stylish untuk berbagai kesempatan.',
      category: 'Pakaian',
      brand: 'Hurr Denim',
      material: 'Denim',
      color: 'Biru Tua',
      weight: '600',
      sizes: JSON.stringify(['S','M','L','XL']),
      stockPerSize: JSON.stringify({ S:5, M:8, L:7, XL:4 }),
      costPrice: 150000,
      sellingPrice: 299000,
      stock: 24,
      minStock: 5,
      discount: 0,
    },
    {
      name: 'Polo Shirt Pique',
      description: 'Polo shirt bahan pique breathable, formal namun tetap kasual.',
      category: 'Pakaian',
      brand: 'Hurr Formal',
      material: 'Polyester',
      color: 'Navy',
      weight: '200',
      sizes: JSON.stringify(['S','M','L','XL','XXL']),
      stockPerSize: JSON.stringify({ S:10, M:15, L:12, XL:8, XXL:5 }),
      costPrice: 65000,
      sellingPrice: 129000,
      stock: 50,
      minStock: 10,
      discount: 15,
    },
    {
      name: 'Celana Chino Slim',
      description: 'Celana chino slim cut berbahan twill premium, cocok untuk kerja maupun hangout.',
      category: 'Pakaian',
      brand: 'Hurr Casual',
      material: 'Cotton',
      color: 'Khaki',
      weight: '350',
      sizes: JSON.stringify(['28','30','32','34','36']),
      stockPerSize: JSON.stringify({ '28':5, '30':10, '32':12, '34':8, '36':4 }),
      costPrice: 85000,
      sellingPrice: 169000,
      stock: 39,
      minStock: 5,
      discount: 0,
    },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p as Parameters<typeof prisma.product.create>[0]['data'] });
  }
  console.log(`✅ ${products.length} produk berhasil ditambahkan`);

  console.log('\n🎉 Seed selesai!');
  console.log('─────────────────────────────────');
  console.log('  Admin  : admin@hurr.com / admin123');
  console.log('  User   : user@hurr.com  / user123');
  console.log('─────────────────────────────────');
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
