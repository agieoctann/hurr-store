import { Router } from 'express';
import {
  createOrder,
  updatePaymentStatus,
  getOrders,
} from '../controllers/order.controller';
import { authMiddleware, adminOnly } from '../middleware/auth';

const router = Router();

router.get('/',            authMiddleware, getOrders);
router.post('/',           authMiddleware, createOrder);
router.put('/:id/status',  authMiddleware, adminOnly, updatePaymentStatus);

export default router;
