import { Request, Response } from 'express';
import { BloodBank } from '../models/BloodBank';
import { AuthenticatedRequest } from '../middleware/auth';
import { getBankStockSummary } from '../services/inventoryService';
import { calculateHaversineDistanceKm } from '../services/compatibilityService';

export const getAllBloodBanks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { city, search, lat, lng } = req.query;
    const query: any = { status: 'active' };

    if (city) {
      query.city = new RegExp(String(city), 'i');
    }
    if (search) {
      query.$or = [
        { name: new RegExp(String(search), 'i') },
        { address: new RegExp(String(search), 'i') }
      ];
    }

    const banks = await BloodBank.find(query);

    let result = banks.map((bank) => {
      let distanceKm: number | null = null;
      if (lat && lng) {
        const [bLng, bLat] = bank.location.coordinates;
        distanceKm = calculateHaversineDistanceKm(Number(lat), Number(lng), bLat, bLng);
      }
      return {
        ...bank.toObject(),
        distanceKm
      };
    });

    if (lat && lng) {
      result.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }

    res.json({ success: true, bloodBanks: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBloodBankById = async (req: Request, res: Response): Promise<void> => {
  try {
    const bank = await BloodBank.findById(req.params.id);
    if (!bank) {
      res.status(404).json({ success: false, message: 'Blood bank not found.' });
      return;
    }

    const stockSummary = await getBankStockSummary(bank._id.toString());

    res.json({ success: true, bloodBank: bank, stockSummary });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyBloodBankProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    let bank = await BloodBank.findOne({ userId });

    if (!bank) {
      // If none found for this user, get the first active bank for demo convenience
      bank = await BloodBank.findOne({ status: 'active' });
    }

    if (!bank) {
      res.status(404).json({ success: false, message: 'Blood bank profile not found.' });
      return;
    }

    const stockSummary = await getBankStockSummary(bank._id.toString());
    res.json({ success: true, bloodBank: bank, stockSummary });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBloodBankProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const bank = await BloodBank.findById(req.params.id);
    if (!bank) {
      res.status(404).json({ success: false, message: 'Blood bank not found.' });
      return;
    }

    const { name, operatingHours, contactPhone, email, address, alertThresholdPerGroup } = req.body;
    if (name) bank.name = name;
    if (operatingHours) bank.operatingHours = operatingHours;
    if (contactPhone) bank.contactPhone = contactPhone;
    if (email) bank.email = email;
    if (address) bank.address = address;
    if (alertThresholdPerGroup) bank.alertThresholdPerGroup = alertThresholdPerGroup;

    await bank.save();
    res.json({ success: true, message: 'Blood bank updated successfully.', bloodBank: bank });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
