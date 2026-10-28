import { Router } from 'express';
import {
  getTransferRecommendations,
  createTransferRequest,
  updateTransferStatus,
  getAllTransfers
} from '../controllers/transferController';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/recommendations', authenticateJWT, requireRoles('blood_bank', 'admin'), getTransferRecommendations);
router.get('/', authenticateJWT, requireRoles('blood_bank', 'admin'), getAllTransfers);
router.post('/', authenticateJWT, requireRoles('blood_bank', 'admin'), createTransferRequest);
router.patch('/:id/status', authenticateJWT, requireRoles('blood_bank', 'admin'), updateTransferStatus);

export default router;
