import { Request, Response } from 'express';
import { generateDemandAndShortageAnalytics } from '../services/forecastingService';

export const getForecastAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { horizon = '14', bloodBankId } = req.query;
    const horizonDays = [7, 14, 30].includes(Number(horizon)) ? Number(horizon) : 14;

    const analytics = await generateDemandAndShortageAnalytics(
      horizonDays,
      bloodBankId ? String(bloodBankId) : undefined
    );

    res.json({ success: true, ...analytics });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
