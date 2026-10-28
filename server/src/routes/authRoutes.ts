import { Router } from 'express';
import { register, login, getCurrentUser, demoLogin } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/demo-login', demoLogin);
router.get('/me', authenticateJWT, getCurrentUser);

export default router;
