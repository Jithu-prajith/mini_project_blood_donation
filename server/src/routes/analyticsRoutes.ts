import { Router } from 'express';
import { getForecastAnalytics } from '../controllers/analyticsController';

const router = Router();

router.get('/', getForecastAnalytics);

export default router;
