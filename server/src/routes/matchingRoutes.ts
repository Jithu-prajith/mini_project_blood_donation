import { Router } from 'express';
import { getMatchingDonors, contactMatchedDonor } from '../controllers/matchingController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.get('/:requestId', getMatchingDonors);
router.post('/contact', authenticateJWT, contactMatchedDonor);

export default router;
