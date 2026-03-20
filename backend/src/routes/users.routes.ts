import { Router } from 'express';
import { getAllUsers, updateUser, deleteUser, updateProfile } from '../controllers/users.controller';
import { authMiddleware, adminOnly } from '../middleware/auth';

const router = Router();

router.get('/',               authMiddleware, adminOnly, getAllUsers);
// IMPORTANT: /:id/profile MUST be before /:id to avoid Express matching /profile as :id
router.put('/:id/profile',    authMiddleware, updateProfile);
router.put('/:id',            authMiddleware, adminOnly, updateUser);
router.delete('/:id',         authMiddleware, adminOnly, deleteUser);

export default router;
