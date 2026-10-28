import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import { DonorProfile } from '../models/DonorProfile';
import { RecipientProfile } from '../models/RecipientProfile';
import { BloodBank } from '../models/BloodBank';
import { generateToken, AuthenticatedRequest } from '../middleware/auth';
import { logAuditEvent } from '../services/auditService';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      role = 'donor',
      phone,
      city,
      state,
      coordinates, // [lng, lat]
      // Donor specifics
      bloodGroup,
      dateOfBirth,
      gender,
      weightKg,
      preferredRadiusKm,
      consentContact,
      // Recipient specifics
      hospitalName,
      emergencyPhone,
      // Blood bank specifics
      licenseNumber,
      storageCapacityUnits
    } = req.body;

    if (!name || !email || !password || !phone || !city || !state) {
      res.status(400).json({ success: false, message: 'Missing required registration fields.' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'User with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      phone,
      city,
      state,
      location: {
        type: 'Point',
        coordinates: coordinates || [77.5946, 12.9716] // Default Bangalore coordinates
      },
      isVerified: true
    });

    // Create role-specific profile
    if (role === 'donor') {
      await DonorProfile.create({
        userId: user._id,
        bloodGroup: bloodGroup || 'O+',
        dateOfBirth: dateOfBirth || new Date('1998-05-15'),
        gender: gender || 'male',
        weightKg: weightKg || 65,
        isAvailable: true,
        consentContact: consentContact !== false,
        preferredRadiusKm: preferredRadiusKm || 30
      });
    } else if (role === 'recipient') {
      await RecipientProfile.create({
        userId: user._id,
        hospitalName: hospitalName || 'City Care Hospital',
        emergencyPhone: emergencyPhone || phone
      });
    } else if (role === 'blood_bank') {
      await BloodBank.create({
        userId: user._id,
        name: `${name} Blood Center`,
        licenseNumber: licenseNumber || `LIC-BB-${Math.floor(1000 + Math.random() * 9000)}`,
        storageCapacityUnits: storageCapacityUnits || 1500,
        contactPhone: phone,
        email: email.toLowerCase(),
        address: `${city} Central Area`,
        city,
        state,
        location: {
          type: 'Point',
          coordinates: coordinates || [77.5946, 12.9716]
        },
        status: 'active'
      });
    }

    const token = generateToken(user);
    await logAuditEvent('USER_REGISTER', 'User', user._id.toString(), user, { role });

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        city: user.city,
        state: user.state
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message || 'Registration failed.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user);
    await logAuditEvent('USER_LOGIN', 'User', user._id.toString(), user);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        city: user.city,
        state: user.state,
        isVerified: user.isVerified
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Login failed.' });
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let profile: any = null;

    if (user.role === 'donor') {
      profile = await DonorProfile.findOne({ userId: user._id });
    } else if (user.role === 'recipient') {
      profile = await RecipientProfile.findOne({ userId: user._id });
    } else if (user.role === 'blood_bank') {
      profile = await BloodBank.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        city: user.city,
        state: user.state,
        location: user.location,
        isVerified: user.isVerified
      },
      profile
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Convenient 1-Click Login for Demo Accounts
 */
export const demoLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role = 'donor' } = req.body;
    const user = await User.findOne({ role });

    if (!user) {
      res.status(404).json({ success: false, message: `No demo user found for role: ${role}. Run database seed first.` });
      return;
    }

    const token = generateToken(user);
    res.json({
      success: true,
      message: `Signed in as Demo ${role.toUpperCase()}`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        city: user.city,
        state: user.state
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
