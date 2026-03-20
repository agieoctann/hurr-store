import "dotenv/config";
import path from "path";
import { defineConfig } from "prisma/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const dbPath = path.resolve(__dirname, "dev.db");
const dbUrl = `file:${dbPath}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: dbUrl,
    adapter: new PrismaBetterSqlite3({ url: dbUrl }),
  },
});
