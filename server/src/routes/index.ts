import { Router } from 'express';
import authRoutes from './authRoutes';
import donorRoutes from './donorRoutes';
import bloodBankRoutes from './bloodBankRoutes';
import inventoryRoutes from './inventoryRoutes';
import requestRoutes from './requestRoutes';
import matchingRoutes from './matchingRoutes';
import transferRoutes from './transferRoutes';
import analyticsRoutes from './analyticsRoutes';
import notificationRoutes from './notificationRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/donors', donorRoutes);
router.use('/blood-banks', bloodBankRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/requests', requestRoutes);
router.use('/matching', matchingRoutes);
router.use('/transfers', transferRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    service: 'AI-Based Blood Donor-Recipient Matching and Blood Bank Management API'
  });
});

export default router;
