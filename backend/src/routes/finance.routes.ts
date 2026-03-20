import { Router } from 'express';
import {
  getFinancialReport,
  createLedgerEntry,
  getLedgerEntries,
} from '../controllers/finance.controller';

const router = Router();

router.get('/reports', getFinancialReport);
router.post('/ledgers', createLedgerEntry);
router.get('/ledgers', getLedgerEntries);

export default router;
