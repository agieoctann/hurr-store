import "dotenv/config";
import path from "path";
import { defineConfig } from "prisma/config";

// Jika DATABASE_URL mengarah ke PostgreSQL (Railway), gunakan native driver
// Jika tidak ada, fallback ke SQLite lokal (untuk dev)
const isPostgres = (process.env.DATABASE_URL || '').startsWith('postgres');

let datasource: Parameters<typeof defineConfig>[0]['datasource'];

if (isPostgres) {
  // Production: PostgreSQL via DATABASE_URL
  datasource = {
    url: process.env.DATABASE_URL!,
  };
} else {
  // Development: SQLite dengan adapter
  const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
  const dbPath = path.resolve(__dirname, "dev.db");
  const dbUrl = `file:${dbPath}`;
  datasource = {
    url: dbUrl,
    adapter: new PrismaBetterSqlite3({ url: dbUrl }),
  };
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource,
});
