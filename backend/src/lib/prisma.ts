import { PrismaClient } from '@prisma/client';

const prisma = global.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});

// Prevent hot-reload creating multiple connections in development
if (process.env.NODE_ENV !== 'production') {
  (global as typeof globalThis & { prisma?: PrismaClient }).prisma = prisma;
}

export default prisma;
