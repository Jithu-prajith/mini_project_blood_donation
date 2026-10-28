import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import {
  User,
  DonorProfile,
  RecipientProfile,
  BloodBank,
  BloodInventoryUnit,
  BloodRequest,
  Donation,
  InventoryTransaction,
  Notification,
  AuditLog
} from '../models';
import {
  BLOOD_GROUPS,
  BLOOD_COMPONENTS,
  COMPONENT_SHELF_LIFE_DAYS,
  BloodGroup,
  BloodComponent
} from '../config/constants';

export const seedDatabase = async () => {
  console.log('[Seed] Starting database reset and seeding...');

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    DonorProfile.deleteMany({}),
    RecipientProfile.deleteMany({}),
    BloodBank.deleteMany({}),
    BloodInventoryUnit.deleteMany({}),
    BloodRequest.deleteMany({}),
    Donation.deleteMany({}),
    InventoryTransaction.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({})
  ]);

  const defaultPassword = 'password123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);
  const adminHash = await bcrypt.hash('admin123', salt);

  // 1. System Administrator
  const adminUser = await User.create({
    name: 'Dr. Sarah Mitchell',
    email: 'admin@hemamatch.org',
    passwordHash: adminHash,
    role: 'admin',
    phone: '+91 98450 11001',
    city: 'Bangalore',
    state: 'Karnataka',
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    isVerified: true
  });

  // 2. Blood Bank Administrators and Centers
  const bankAdmin1 = await User.create({
    name: 'Dr. Ramesh Kulkarni (Apollo Admin)',
    email: 'apollo.bloodbank@hemamatch.org',
    passwordHash,
    role: 'blood_bank',
    phone: '+91 80 2630 4050',
    city: 'Bangalore',
    state: 'Karnataka',
    location: { type: 'Point', coordinates: [77.5995, 12.9348] },
    isVerified: true
  });

  const bloodBank1 = await BloodBank.create({
    userId: bankAdmin1._id,
    name: 'Apollo Central Blood Center',
    licenseNumber: 'KA-BB-2018-0045',
    storageCapacityUnits: 2500,
    operatingHours: '24/7 Continuous Emergency Service',
    contactPhone: '+91 80 2630 4050',
    email: 'apollo.bloodbank@hemamatch.org',
    address: '154/11 Bannerghatta Road, Jayanagar',
    city: 'Bangalore',
    state: 'Karnataka',
    location: { type: 'Point', coordinates: [77.5995, 12.9348] },
    status: 'active',
    alertThresholdPerGroup: 6
  });

  const bankAdmin2 = await User.create({
    name: 'Nurse Elena Gilbert (Red Cross Admin)',
    email: 'redcross.bloodbank@hemamatch.org',
    passwordHash,
    role: 'blood_bank',
    phone: '+91 80 2528 1234',
    city: 'Bangalore',
    state: 'Karnataka',
    location: { type: 'Point', coordinates: [77.6412, 12.9784] },
    isVerified: true
  });

  const bloodBank2 = await BloodBank.create({
    userId: bankAdmin2._id,
    name: 'Indian Red Cross Society Regional Bank',
    licenseNumber: 'KA-BB-2012-0012',
    storageCapacityUnits: 3000,
    operatingHours: '24/7 Critical Transfusion Facility',
    contactPhone: '+91 80 2528 1234',
    email: 'redcross.bloodbank@hemamatch.org',
    address: '26, 1st Main Rd, Indiranagar',
    city: 'Bangalore',
    state: 'Karnataka',
    location: { type: 'Point', coordinates: [77.6412, 12.9784] },
    status: 'active',
    alertThresholdPerGroup: 5
  });

  const bankAdmin3 = await User.create({
    name: 'Dr. Arvind Swaminathan (Manipal Admin)',
    email: 'manipal.bloodbank@hemamatch.org',
    passwordHash,
    role: 'blood_bank',
    phone: '+91 80 2502 4444',
    city: 'Bangalore',
    state: 'Karnataka',
    location: { type: 'Point', coordinates: [77.6521, 12.9592] },
    isVerified: true
  });

  const bloodBank3 = await BloodBank.create({
    userId: bankAdmin3._id,
    name: 'Manipal Comprehensive Blood Bank',
    licenseNumber: 'KA-BB-2015-0078',
    storageCapacityUnits: 1800,
    operatingHours: '24/7 Trauma & Surgical Supply',
    contactPhone: '+91 80 2502 4444',
    email: 'manipal.bloodbank@hemamatch.org',
    address: '98 HAL Old Airport Rd, Kodihalli',
    city: 'Bangalore',
    state: 'Karnataka',
    location: { type: 'Point', coordinates: [77.6521, 12.9592] },
    status: 'active',
    alertThresholdPerGroup: 5
  });

  // 3. Recipients
  const recipientUser1 = await User.create({
    name: 'Priya Sharma (Patient Attendant)',
    email: 'priya.recipient@gmail.com',
    passwordHash,
    role: 'recipient',
    phone: '+91 98860 22334',
    city: 'Bangalore',
    state: 'Karnataka',
    location: { type: 'Point', coordinates: [77.6074, 12.9719] },
    isVerified: true
  });

  await RecipientProfile.create({
    userId: recipientUser1._id,
    hospitalName: 'St. John’s Medical College Hospital',
    defaultDeliveryAddress: 'Koramangala, Bangalore',
    contactPerson: 'Priya Sharma',
    emergencyPhone: '+91 98860 22334',
    medicalRegistrationId: 'SJM-REC-2026-992'
  });

  const recipientUser2 = await User.create({
    name: 'Rajesh Verma (Cardiac ICU Attendant)',
    email: 'rajesh.verma@outlook.com',
    passwordHash,
    role: 'recipient',
    phone: '+91 97412 88990',
    city: 'Bangalore',
    state: 'Karnataka',
    location: { type: 'Point', coordinates: [77.5855, 12.9352] },
    isVerified: true
  });

  await RecipientProfile.create({
    userId: recipientUser2._id,
    hospitalName: 'Jayadeva Institute of Cardiovascular Sciences',
    defaultDeliveryAddress: 'Jayanagar 9th Block, Bangalore',
    contactPerson: 'Rajesh Verma',
    emergencyPhone: '+91 97412 88990',
    medicalRegistrationId: 'JAY-ICU-2026-104'
  });

  // 4. Donors (10 realistic profiles across different groups and coordinates)
  const donorData = [
    {
      name: 'Rahul Sharma',
      email: 'rahul.donor@gmail.com',
      bloodGroup: 'O+' as BloodGroup,
      coords: [77.6095, 12.9348],
      lastDonationDaysAgo: 140,
      totalDonations: 4,
      isAvailable: true,
      gender: 'male',
      dob: '1995-04-12',
      weight: 72,
      canDonate: true
    },
    {
      name: 'Sneha Patil',
      email: 'sneha.donor@gmail.com',
      bloodGroup: 'O-' as BloodGroup, // Universal Donor
      coords: [77.6185, 12.9279],
      lastDonationDaysAgo: 90,
      totalDonations: 6,
      isAvailable: true,
      gender: 'female',
      dob: '1997-08-20',
      weight: 58,
      canDonate: true
    },
    {
      name: 'Ananya Iyer',
      email: 'ananya.iyer@gmail.com',
      bloodGroup: 'A+' as BloodGroup,
      coords: [77.6354, 12.9716],
      lastDonationDaysAgo: 70,
      totalDonations: 3,
      isAvailable: true,
      gender: 'female',
      dob: '1999-11-05',
      weight: 62,
      canDonate: true
    },
    {
      name: 'Mohammed Rizwan',
      email: 'rizwan.donor@gmail.com',
      bloodGroup: 'B+' as BloodGroup,
      coords: [77.5833, 12.9915],
      lastDonationDaysAgo: 999, // First time
      totalDonations: 0,
      isAvailable: true,
      gender: 'male',
      dob: '2001-02-14',
      weight: 68,
      canDonate: true
    },
    {
      name: 'Vikram Singh',
      email: 'vikram.singh@gmail.com',
      bloodGroup: 'AB+' as BloodGroup, // Universal recipient
      coords: [77.6512, 12.9854],
      lastDonationDaysAgo: 180,
      totalDonations: 5,
      isAvailable: true,
      gender: 'male',
      dob: '1992-06-30',
      weight: 76,
      canDonate: true
    },
    {
      name: 'Divya Nair',
      email: 'divya.nair@gmail.com',
      bloodGroup: 'A-' as BloodGroup,
      coords: [77.5645, 12.9512],
      lastDonationDaysAgo: 35, // In cooling-off period (<56 days)
      totalDonations: 2,
      isAvailable: false,
      gender: 'female',
      dob: '1998-03-22',
      weight: 55,
      canDonate: false // Cooling off
    },
    {
      name: 'Karthik Kumar',
      email: 'karthik.kumar@gmail.com',
      bloodGroup: 'B-' as BloodGroup,
      coords: [77.6251, 12.9142],
      lastDonationDaysAgo: 110,
      totalDonations: 3,
      isAvailable: true,
      gender: 'male',
      dob: '1994-09-18',
      weight: 70,
      canDonate: true
    },
    {
      name: 'Pooja Reddy',
      email: 'pooja.reddy@gmail.com',
      bloodGroup: 'O+' as BloodGroup,
      coords: [77.5912, 12.9621],
      lastDonationDaysAgo: 60,
      totalDonations: 2,
      isAvailable: true,
      gender: 'female',
      dob: '2000-01-10',
      weight: 60,
      canDonate: true
    },
    {
      name: 'Arjun Menon',
      email: 'arjun.menon@gmail.com',
      bloodGroup: 'AB-' as BloodGroup,
      coords: [77.6621, 12.9312],
      lastDonationDaysAgo: 220,
      totalDonations: 7,
      isAvailable: true,
      gender: 'male',
      dob: '1990-12-04',
      weight: 80,
      canDonate: true
    },
    {
      name: 'Kavita Rao',
      email: 'kavita.rao@gmail.com',
      bloodGroup: 'B+' as BloodGroup,
      coords: [77.5741, 12.9812],
      lastDonationDaysAgo: 150,
      totalDonations: 4,
      isAvailable: true,
      gender: 'female',
      dob: '1996-07-19',
      weight: 64,
      canDonate: true
    }
  ];

  const now = new Date();
  const createdDonors = [];

  for (const d of donorData) {
    const user = await User.create({
      name: d.name,
      email: d.email,
      passwordHash,
      role: 'donor',
      phone: `+91 9${Math.floor(100000000 + Math.random() * 900000000)}`,
      city: 'Bangalore',
      state: 'Karnataka',
      location: { type: 'Point', coordinates: d.coords },
      isVerified: true
    });

    const lastDonDate =
      d.lastDonationDaysAgo < 900
        ? new Date(now.getTime() - d.lastDonationDaysAgo * 24 * 60 * 60 * 1000)
        : undefined;

    await DonorProfile.create({
      userId: user._id,
      bloodGroup: d.bloodGroup,
      dateOfBirth: new Date(d.dob),
      gender: d.gender,
      weightKg: d.weight,
      lastDonationDate: lastDonDate,
      totalDonations: d.totalDonations,
      isAvailable: d.isAvailable,
      healthStatus: {
        canDonate: d.canDonate,
        reason: d.canDonate ? 'Medically fit and cleared' : 'Cooling-off interval in progress (< 56 days)',
        hemoglobin: 14.2
      },
      consentContact: true,
      preferredRadiusKm: 35
    });

    createdDonors.push(user);
  }

  // 5. Populate Blood Inventory Units across the 3 Blood Banks
  const banks = [bloodBank1, bloodBank2, bloodBank3];
  let unitCounter = 100;
  const createdUnits = [];

  for (let bIndex = 0; bIndex < banks.length; bIndex++) {
    const bank = banks[bIndex];
    const prefix = bIndex === 0 ? 'APO' : bIndex === 1 ? 'IRC' : 'MNP';

    for (const group of BLOOD_GROUPS) {
      for (const comp of BLOOD_COMPONENTS) {
        // Shelf life
        const shelfLife = COMPONENT_SHELF_LIFE_DAYS[comp];

        // Create 2 to 6 units per group and component
        const unitCount = comp === 'Whole Blood' || comp === 'Red Blood Cells' ? 5 : 2;

        for (let u = 0; u < unitCount; u++) {
          unitCounter++;
          const barcode = `${prefix}-${comp.slice(0, 2).toUpperCase()}-${group.replace('+', 'P').replace('-', 'N')}-${unitCounter}`;

          // Vary collection and expiry dates
          // Some units are fresh, some are expiring in 2 days, some are older
          let daysOffset = 10;
          if (u === 0 && comp === 'Platelets') {
            daysOffset = 4; // Platelets expire in 5 days, so collected 4 days ago -> expires in 1 day!
          } else if (u === 0) {
            daysOffset = shelfLife - 2; // Expiring in 2 days!
          } else {
            daysOffset = Math.floor(Math.random() * (shelfLife / 2)) + 1;
          }

          const collectionDate = new Date(now.getTime() - daysOffset * 24 * 60 * 60 * 1000);
          const expiryDate = new Date(collectionDate.getTime() + shelfLife * 24 * 60 * 60 * 1000);

          let status: any = 'available';
          if (expiryDate <= now) {
            status = 'expired';
          } else if (u === 4 && bIndex === 0) {
            status = 'quarantined';
          }

          const unit = await BloodInventoryUnit.create({
            unitIdentifier: barcode,
            bloodBankId: bank._id,
            bloodGroup: group,
            component: comp,
            collectionDate,
            expiryDate,
            volumeMl: comp === 'Platelets' ? 250 : comp === 'Cryoprecipitate' ? 150 : 450,
            status,
            storageLocation: {
              freezerId: comp === 'Fresh Frozen Plasma' ? 'DEEP-FRZ-03' : 'FRZ-01',
              shelfNumber: `SLF-${String.fromCharCode(65 + (u % 4))}`
            },
            discardReason: status === 'quarantined' ? 'Awaiting secondary NAT screening validation' : undefined
          });

          await InventoryTransaction.create({
            unitId: unit._id,
            bloodBankId: bank._id,
            transactionType: 'receipt',
            performedBy: bank.userId,
            previousStatus: 'available',
            newStatus: status,
            notes: `Inventory lot check-in: ${barcode}`,
            timestamp: collectionDate
          });

          createdUnits.push(unit);
        }
      }
    }
  }

  // 6. Create realistic Blood Requests
  // Request 1: Critical Emergency (O- or O+)
  const emergencyReq = await BloodRequest.create({
    requesterId: recipientUser1._id,
    patientName: 'Aarav Mehta',
    patientAge: 34,
    patientGender: 'male',
    bloodGroup: 'O-',
    component: 'Red Blood Cells',
    unitsNeeded: 3,
    unitsFulfilled: 0,
    hospitalName: 'St. John’s Medical College Emergency & Trauma',
    hospitalLocation: {
      type: 'Point',
      coordinates: [77.6192, 12.9298]
    },
    urgencyLevel: 'emergency',
    requiredByDate: new Date(now.getTime() + 2 * 60 * 60 * 1000), // Within 2 hours
    status: 'pending',
    contactNumber: '+91 98860 22334',
    medicalNotes: 'Severe polytrauma with acute hemorrhagic shock. Immediate crossmatched PRBC required.',
    escalationLevel: 1,
    statusHistory: [
      {
        status: 'pending',
        changedAt: new Date(now.getTime() - 20 * 60 * 1000),
        changedBy: recipientUser1._id,
        note: 'Emergency request registered by ICU physician.'
      }
    ]
  });

  // Request 2: Urgent Request (A+)
  const urgentReq = await BloodRequest.create({
    requesterId: recipientUser2._id,
    patientName: 'Sunita Rao',
    patientAge: 58,
    patientGender: 'female',
    bloodGroup: 'A+',
    component: 'Whole Blood',
    unitsNeeded: 2,
    unitsFulfilled: 1,
    hospitalName: 'Jayadeva Cardiac Institute',
    hospitalLocation: {
      type: 'Point',
      coordinates: [77.5855, 12.9352]
    },
    urgencyLevel: 'urgent',
    requiredByDate: new Date(now.getTime() + 8 * 60 * 60 * 1000),
    status: 'partially_fulfilled',
    contactNumber: '+91 97412 88990',
    medicalNotes: 'Scheduled Coronary Artery Bypass Graft (CABG). Transfusion support reserved.',
    statusHistory: [
      {
        status: 'pending',
        changedAt: new Date(now.getTime() - 120 * 60 * 1000),
        changedBy: recipientUser2._id,
        note: 'Urgent pre-surgical request.'
      },
      {
        status: 'partially_fulfilled',
        changedAt: new Date(now.getTime() - 40 * 60 * 1000),
        note: '1 unit reserved from Apollo Central.'
      }
    ]
  });

  // Request 3: Routine Request (B+)
  const routineReq = await BloodRequest.create({
    requesterId: recipientUser1._id,
    patientName: 'Kunal Singhal',
    patientAge: 42,
    patientGender: 'male',
    bloodGroup: 'B+',
    component: 'Platelets',
    unitsNeeded: 2,
    unitsFulfilled: 2,
    hospitalName: 'Manipal Hospital Oncology Care',
    hospitalLocation: {
      type: 'Point',
      coordinates: [77.6521, 12.9592]
    },
    urgencyLevel: 'routine',
    requiredByDate: new Date(now.getTime() + 36 * 60 * 60 * 1000),
    status: 'fulfilled',
    contactNumber: '+91 98860 22334',
    medicalNotes: 'Post-chemotherapy thrombocytopenia support. Complete.',
    statusHistory: [
      {
        status: 'pending',
        changedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        changedBy: recipientUser1._id
      },
      {
        status: 'fulfilled',
        changedAt: new Date(now.getTime() - 10 * 60 * 1000),
        note: 'Units reserved and issued.'
      }
    ]
  });

  // 7. Historical Requests for Analytics (over past 60 days)
  for (let i = 1; i <= 60; i++) {
    const pastDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const rndGroup = BLOOD_GROUPS[i % BLOOD_GROUPS.length];
    const rndComp = (i % 3 === 0 ? 'Platelets' : i % 2 === 0 ? 'Red Blood Cells' : 'Whole Blood') as BloodComponent;
    const units = Math.floor(Math.random() * 3) + 1;

    await BloodRequest.create({
      requesterId: recipientUser1._id,
      patientName: `Historical Patient ${i}`,
      bloodGroup: rndGroup,
      component: rndComp,
      unitsNeeded: units,
      unitsFulfilled: units,
      hospitalName: 'St. John’s Medical College Hospital',
      hospitalLocation: { type: 'Point', coordinates: [77.6192, 12.9298] },
      urgencyLevel: i % 5 === 0 ? 'emergency' : i % 2 === 0 ? 'urgent' : 'routine',
      requiredByDate: pastDate,
      status: 'fulfilled',
      contactNumber: '+91 98860 22334',
      createdAt: pastDate,
      updatedAt: pastDate
    });

    // Add historical donation
    await Donation.create({
      donorId: createdDonors[i % createdDonors.length]._id,
      bloodBankId: banks[i % banks.length]._id,
      donationDate: pastDate,
      unitsCollected: 1,
      bloodGroup: rndGroup,
      component: rndComp,
      status: 'stored'
    });
  }

  // 8. Notifications
  await Notification.create({
    recipientUserId: createdDonors[1]._id, // Sneha (O-)
    title: 'EMERGENCY BLOOD ALERT: O- Needed Urgently!',
    message: 'Patient at St. John’s Emergency requires 3 units of O- Red Blood Cells immediately. Your profile is ranked #1.',
    type: 'emergency_escalation',
    referenceId: emergencyReq._id.toString(),
    referenceType: 'request',
    priority: 'high',
    isRead: false
  });

  await Notification.create({
    recipientUserId: bankAdmin1._id,
    title: 'Low Stock Alert: O- & B- Inventory',
    message: 'Apollo Central has dropped below configured threshold (6 units) for O- and B- units.',
    type: 'shortage_alert',
    priority: 'high',
    isRead: false
  });

  await Notification.create({
    recipientUserId: bankAdmin1._id,
    title: 'Units Approaching Expiry: Platelets Lot #MNP-PL-O-104',
    message: '2 units of Platelets are within 48 hours of expiration. Consider priority issue or transfer.',
    type: 'expiry_warning',
    priority: 'normal',
    isRead: false
  });

  // 9. Initial Audit Log
  await AuditLog.create({
    action: 'SYSTEM_INITIALIZED',
    entityType: 'System',
    performedBy: adminUser._id,
    performedByName: adminUser.name,
    performedByRole: 'admin',
    details: {
      seededDonors: donorData.length,
      seededBloodBanks: banks.length,
      seededUnits: createdUnits.length
    },
    timestamp: new Date()
  });

  console.log('[Seed] Seeding completed successfully!');
  return {
    donorsSeeded: donorData.length,
    bloodBanksSeeded: banks.length,
    inventoryUnitsSeeded: createdUnits.length,
    demoAccounts: {
      admin: { email: 'admin@hemamatch.org', password: 'admin123' },
      bloodBank: { email: 'apollo.bloodbank@hemamatch.org', password: 'password123' },
      recipient: { email: 'priya.recipient@gmail.com', password: 'password123' },
      donor: { email: 'rahul.donor@gmail.com', password: 'password123' }
    }
  };
};

// If run directly via command line
if (require.main === module) {
  connectDB().then(async () => {
    try {
      const summary = await seedDatabase();
      console.log('Seed summary:', JSON.stringify(summary, null, 2));
      process.exit(0);
    } catch (err) {
      console.error('Seed error:', err);
      process.exit(1);
    }
  });
}
