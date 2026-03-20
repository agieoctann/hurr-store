import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller';

const router = Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', createProduct); // Admin only eventually
router.put('/:id', updateProduct); // Admin only eventually
router.delete('/:id', deleteProduct); // Admin only eventually

export default router;
