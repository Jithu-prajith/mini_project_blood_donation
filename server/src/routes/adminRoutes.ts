import { Router } from 'express';
import {
  getSystemOverview,
  verifyDonor,
  getAuditLogs,
  resetAndSeedData
} from '../controllers/adminController';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/overview', authenticateJWT, requireRoles('admin'), getSystemOverview);
router.patch('/verify-donor', authenticateJWT, requireRoles('admin'), verifyDonor);
router.get('/audit-logs', authenticateJWT, requireRoles('admin'), getAuditLogs);
router.post('/reseed-data', authenticateJWT, requireRoles('admin'), resetAndSeedData);

export default router;
