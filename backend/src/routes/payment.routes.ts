import { Router } from 'express';
import { createSnapToken, handleNotification } from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Protected: user harus login untuk buat snap token
router.post('/snap-token', authMiddleware, createSnapToken);

// Public: Midtrans webhook (tidak perlu auth, sudah diverifikasi oleh SDK)
router.post('/notification', handleNotification);

export default router;
