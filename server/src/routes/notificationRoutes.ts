import { Router } from 'express';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/notificationController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.get('/', authenticateJWT, getMyNotifications);
router.patch('/:id/read', authenticateJWT, markNotificationRead);
router.patch('/read-all', authenticateJWT, markAllNotificationsRead);

export default router;
