import { Router } from 'express';
import {
  getAllBloodBanks,
  getBloodBankById,
  getMyBloodBankProfile,
  updateBloodBankProfile
} from '../controllers/bloodBankController';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/', getAllBloodBanks);
router.get('/my-profile', authenticateJWT, getMyBloodBankProfile);
router.get('/:id', getBloodBankById);
router.put('/:id', authenticateJWT, requireRoles('blood_bank', 'admin'), updateBloodBankProfile);

export default router;
