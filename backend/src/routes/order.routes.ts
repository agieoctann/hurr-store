import { Router } from 'express';
import {
  createOrder,
  updatePaymentStatus,
  getOrders,
} from '../controllers/order.controller';

const router = Router();

router.get('/', getOrders);
router.post('/', createOrder);
router.put('/:id/status', updatePaymentStatus); // Admin / Webhook only

export default router;
