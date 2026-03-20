import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { getIO } from '../lib/socket';


export const createOrder = async (req: Request, res: Response) => {
  try {
    // userId dari JWT token (authMiddleware), bukan dari body
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { shippingAddressId, items, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items tidak boleh kosong' });
    }
    if (!paymentMethod) {
      return res.status(400).json({ error: 'Metode pembayaran harus dipilih' });
    }

    // 1. Calculate totals and verify items
    let finalTotalAmount = 0;
    const orderItemsData: { productId: string; qty: number; priceAtBuy: number; costAtBuy: number }[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return res.status(404).json({ error: `Produk tidak ditemukan: ${item.productId}` });
      }

      if (product.stock < item.qty) {
        return res.status(400).json({ error: `Stok tidak cukup untuk ${product.name} (tersedia: ${product.stock})` });
      }

      const priceAtBuy = Number(product.sellingPrice);
      const costAtBuy = Number(product.costPrice);

      finalTotalAmount += priceAtBuy * item.qty;

      orderItemsData.push({
        productId: item.productId,
        qty: item.qty,
        priceAtBuy,
        costAtBuy,
      });
    }

    // 2. Buat order dan update stok (sequential, kompatibel dengan SQLite adapter)
    const newOrder = await prisma.order.create({
      data: {
        userId,
        shippingAddressId: shippingAddressId || null,
        finalTotalAmount,
        paymentMethod,
        paymentStatus: 'PENDING',
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        orderItems: { include: { product: { select: { name: true } } } },
      },
    });

    // Update stok setelah order berhasil dibuat
    for (const item of orderItemsData) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.qty } },
      });
    }

    // Notifikasi real-time ke admin
    try {
      getIO().to('admin_room').emit('new_order', {
        orderId: newOrder.id,
        total: newOrder.finalTotalAmount,
        paymentMethod: newOrder.paymentMethod,
        createdAt: newOrder.createdAt,
      });
    } catch { /* Socket not critical */ }

    res.status(201).json(newOrder);
  } catch (error: unknown) {
    console.error('createOrder error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Gagal membuat pesanan', details: msg });

  }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { paymentStatus: status },
    });

    // Jika COMPLETED, catat ke Financial Ledger
    if (status === 'COMPLETED') {
      await prisma.financialLedger.create({
        data: {
          type: 'INCOME',
          category: 'SALES_REVENUE',
          amount: order.finalTotalAmount,
          referenceId: order.id,
          description: `Payment for Order ${order.id}`,
        },
      });
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment status' });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: { orderItems: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};
