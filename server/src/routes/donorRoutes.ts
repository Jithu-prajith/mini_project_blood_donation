import { Router } from 'express';
import {
  getDonorProfile,
  updateDonorProfile,
  toggleAvailability,
  getMyDonations
} from '../controllers/donorController';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/profile', authenticateJWT, getDonorProfile);
router.put('/profile', authenticateJWT, requireRoles('donor', 'admin'), updateDonorProfile);
router.patch('/availability', authenticateJWT, requireRoles('donor', 'admin'), toggleAvailability);
router.get('/donations', authenticateJWT, getMyDonations);

export default router;
