import { Router } from 'express';
import {
  createOrder,
  updatePaymentStatus,
  getOrders,
  getMyOrders,
} from '../controllers/order.controller';
import { authMiddleware, adminOnly } from '../middleware/auth';

const router = Router();

router.get('/',            authMiddleware, getOrders);
router.get('/my',          authMiddleware, getMyOrders);
router.post('/',           authMiddleware, createOrder);
router.put('/:id/status',  authMiddleware, updatePaymentStatus);

export default router;
