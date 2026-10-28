import { Router } from 'express';
import {
  createBloodRequest,
  getAllBloodRequests,
  getMyRequests,
  getBloodRequestById,
  escalateBloodRequest,
  updateRequestStatus
} from '../controllers/requestController';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();

router.post('/', authenticateJWT, createBloodRequest);
router.get('/', getAllBloodRequests);
router.get('/my-requests', authenticateJWT, getMyRequests);
router.get('/:id', getBloodRequestById);
router.post('/:id/escalate', authenticateJWT, escalateBloodRequest);
router.patch('/:id/status', authenticateJWT, requireRoles('blood_bank', 'admin', 'recipient'), updateRequestStatus);

export default router;
