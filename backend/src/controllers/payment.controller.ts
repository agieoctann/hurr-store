import { Request, Response } from 'express';
import midtransClient from 'midtrans-client';
import prisma from '../lib/prisma';

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
});

/**
 * POST /api/payments/snap-token
 * Body: { orderId }
 * Returns: { token, redirectUrl }
 */
export const createSnapToken = async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user?: { id: string; email: string } }).user?.id;
    const userEmail = (req as Request & { user?: { id: string; email: string } }).user?.email;
    const { orderId } = req.body;

    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    // Fetch order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: { include: { product: { select: { name: true } } } },
        user: { select: { email: true, name: true, phone: true } },
      },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.userId !== userId) return res.status(403).json({ error: 'Forbidden' });
    if (order.paymentStatus !== 'PENDING') {
      return res.status(400).json({ error: 'Order already paid or failed' });
    }

    const parameter = {
      transaction_details: {
        order_id: `HURR-${order.id.slice(0, 8)}-${Date.now()}`,
        gross_amount: Number(order.finalTotalAmount),
      },
      item_details: order.orderItems.map(item => ({
        id: item.id,
        price: Number(item.priceAtBuy),
        quantity: item.qty,
        name: item.product.name.slice(0, 50),
      })),
      customer_details: {
        first_name: order.user.name || order.user.email.split('@')[0],
        email: order.user.email,
        phone: order.user.phone || '',
      },
      callbacks: {
        finish: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?payment=success`,
        error: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?payment=error`,
        pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?payment=pending`,
      },
    };

    const snapResponse = await snap.createTransaction(parameter);

    res.json({
      token: snapResponse.token,
      redirectUrl: snapResponse.redirect_url,
      orderId: order.id,
    });
  } catch (error: unknown) {
    console.error('Midtrans error:', error);
    const msg = error instanceof Error ? error.message : 'Payment gateway error';
    res.status(500).json({ error: msg });
  }
};

/**
 * POST /api/payments/notification
 * Midtrans webhook — verifikasi & update order status
 */
export const handleNotification = async (req: Request, res: Response) => {
  try {
    const notification = await snap.transaction.notification(req.body);
    const { order_id, transaction_status, fraud_status } = notification;

    // Extract real orderId (format: HURR-<8char>-<timestamp>)
    const shortId = order_id.split('-')[1];
    if (!shortId) return res.status(400).json({ error: 'Invalid order_id format' });

    // Find order by partial ID
    const order = await prisma.order.findFirst({
      where: { id: { startsWith: shortId } },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    let newStatus: 'PENDING' | 'COMPLETED' | 'FAILED' = 'PENDING';

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'accept' || fraud_status === undefined) {
        newStatus = 'COMPLETED';
      } else {
        newStatus = 'FAILED';
      }
    } else if (['cancel', 'deny', 'expire', 'refund'].includes(transaction_status)) {
      newStatus = 'FAILED';
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: newStatus },
    });

    // Record to ledger if completed
    if (newStatus === 'COMPLETED') {
      await prisma.financialLedger.create({
        data: {
          type: 'INCOME',
          category: 'SALES_REVENUE',
          amount: order.finalTotalAmount,
          referenceId: order.id,
          description: `Pembayaran Midtrans: ${order_id}`,
        },
      });
    }

    res.json({ status: 'OK' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
