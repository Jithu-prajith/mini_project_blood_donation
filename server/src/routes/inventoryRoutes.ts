import { Router } from 'express';
import {
  getInventoryList,
  addInventoryUnit,
  reserveUnits,
  issueUnits,
  discardOrQuarantineUnit,
  getInventoryTransactions
} from '../controllers/inventoryController';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/', authenticateJWT, getInventoryList);
router.post('/', authenticateJWT, requireRoles('blood_bank', 'admin'), addInventoryUnit);
router.post('/reserve', authenticateJWT, requireRoles('blood_bank', 'admin', 'recipient'), reserveUnits);
router.post('/issue', authenticateJWT, requireRoles('blood_bank', 'admin'), issueUnits);
router.post('/dispose', authenticateJWT, requireRoles('blood_bank', 'admin'), discardOrQuarantineUnit);
router.get('/transactions', authenticateJWT, requireRoles('blood_bank', 'admin'), getInventoryTransactions);

export default router;
