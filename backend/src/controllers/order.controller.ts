import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { userId, shippingAddressId, items, paymentMethod } = req.body;

    // 1. Calculate totals and verify items
    let finalTotalAmount = 0;
    const orderItemsData: { productId: string; qty: number; priceAtBuy: number; costAtBuy: number }[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return res.status(404).json({ error: `Product not found: ${item.productId}` });
      }

      if (product.stock < item.qty) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }

      const priceAtBuy = Number(product.sellingPrice);
      const costAtBuy = Number(product.costPrice);

      finalTotalAmount += priceAtBuy * item.qty;

      orderItemsData.push({
        productId: item.productId,
        qty: item.qty,
        priceAtBuy: priceAtBuy,
        costAtBuy: costAtBuy
      });
    }

    // 2. Database Transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create Order
      const newOrder = await tx.order.create({
        data: {
          userId,
          shippingAddressId,
          finalTotalAmount,
          paymentMethod,
          paymentStatus: 'PENDING',
          orderItems: {
            create: orderItemsData
          }
        },
        include: { orderItems: true }
      });

      // Update Stock
      for (const item of orderItemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.qty } }
        });
      }

      return newOrder;
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order', details: error });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body; // COMPLETED, FAILED

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.order.update({
        where: { id },
        data: { paymentStatus: status }
      });

      // If PAID, add to Financial Ledger LedgerType.INCOME
      if (status === 'COMPLETED') {
        await tx.financialLedger.create({
          data: {
            type: 'INCOME',
            category: 'SALES_REVENUE',
            amount: order.finalTotalAmount,
            referenceId: order.id,
            description: `Payment for Order ${order.id}`
          }
        });
      }

      return updateResult;
    });

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
