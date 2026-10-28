# System Architecture & Implementation Plan: AI-Based Blood Donor–Recipient Matching and Blood Bank Management System

## 1. System Overview
The **AI-Based Blood Donor–Recipient Matching and Blood Bank Management System** is a full-stack healthcare coordination platform connecting blood donors, recipients, hospitals, and blood bank administrators. It provides:
1. **Explainable AI Matching Engine**: Compatibility filtering (ABO/Rh & component-aware) + multi-criteria ranking (proximity, cooling-off/donation recency, availability status, responsiveness).
2. **Intelligent Inventory Management**: Unit-level lifecycle tracking (Available, Reserved, Issued, Expired, Quarantined, Discarded), batch barcode generation, expiry thresholds (<3d, <7d), low-stock thresholds, and inter-bank transfer recommendations.
3. **Emergency Coordination**: Real-time escalation protocols (Emergency <1h, Urgent <4h, Routine <24h), dual-discovery of stock + candidate donors, and multi-channel notification dispatch.
4. **Predictive Demand & Shortage Analytics**: Time-series demand forecasting with Random Forest/Exponential Smoothing, shortage risk index calculation, projected expiry wastage, and actionable replenishment advice.
5. **Role-Based Access Control**: 4 segregated roles (`donor`, `recipient`, `blood_bank`, `admin`) with authenticated JWT and strict endpoint access guards.

---

## 2. Directory Structure

```text
f:\mini_project\
├── server\                     # Express + TypeScript + Mongoose Backend
│   ├── src\
│   │   ├── config\             # DB connection, constants, blood compatibility matrices
│   │   ├── models\             # Mongoose schemas (13 core entities)
│   │   ├── controllers\        # Auth, Donors, Inventory, Requests, Analytics, Transfers, etc.
│   │   ├── services\           # Matching engine, Inventory transaction engine, Forecasting engine
│   │   ├── routes\             # Modular REST API endpoints
│   │   ├── middleware\         # JWT auth, role authorization, validation, error handler
│   │   ├── scripts\            # Comprehensive seed generator with realistic demo data
│   │   └── index.ts            # Server entrypoint (Port 5000)
│   ├── package.json
│   └── tsconfig.json
├── ai_service\                 # Python FastAPI Analytics & Forecasting Microservice
│   ├── main.py                 # FastAPI app (Port 8000)
│   ├── forecaster.py           # Scikit-learn Random Forest & Time-Series forecaster
│   ├── matching_model.py       # Candidate scoring & explainability helper
│   └── requirements.txt
├── client\                     # React + Vite + TypeScript + Tailwind CSS Frontend
│   ├── src\
│   │   ├── assets\
│   │   ├── components\         # Reusable UI components (Navbar, Sidebar, MapView, Badges, Charts)
│   │   ├── pages\              # 13 required pages (Dashboards, Matching, Inventory, Emergency, etc.)
│   │   ├── context\            # AuthContext, NotificationContext, AlertContext
│   │   ├── services\           # API client Axios / Fetch wrappers
│   │   ├── types\              # Shared TypeScript definitions
│   │   ├── utils\              # ABO compatibility, formatting, geo-distance (Haversine)
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css           # Tailwind + Custom healthcare design tokens
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

---

## 3. Core Database Entities

1. **User**: `_id, name, email, passwordHash, role ('donor'|'recipient'|'blood_bank'|'admin'), phone, city, state, location: { type: 'Point', coordinates: [lng, lat] }, isVerified, createdAt`
2. **DonorProfile**: `userId, bloodGroup ('A+'|'A-'|'B+'|'B-'|'AB+'|'AB-'|'O+'|'O-'), dateOfBirth, gender, weightKg, lastDonationDate, totalDonations, isAvailable, healthStatus: { canDonate, reason }, consentContact, preferredRadiusKm`
3. **RecipientProfile**: `userId, hospitalName, defaultDeliveryAddress, contactPerson, emergencyPhone`
4. **BloodBank**: `userId, name, licenseNumber, storageCapacityUnits, operatingHours, contactPhone, email, address, location: { type: 'Point', coordinates: [lng, lat] }, status ('active'|'pending'|'suspended')`
5. **BloodInventoryUnit**: `_id, unitIdentifier (barcode), bloodBankId, bloodGroup, component ('Whole Blood'|'Red Blood Cells'|'Platelets'|'Fresh Frozen Plasma'|'Cryoprecipitate'), collectionDate, expiryDate, volumeMl, status ('available'|'reserved'|'issued'|'expired'|'quarantined'|'discarded'), storageLocation: { freezerId, shelfNumber }, reservedForRequestId, discardReason`
6. **BloodRequest**: `_id, requesterId (User), patientName, bloodGroup, component, unitsNeeded, unitsFulfilled, hospitalName, hospitalLocation: { type: 'Point', coordinates: [lng, lat] }, urgencyLevel ('emergency'|'urgent'|'routine'), requiredByDate, status ('pending'|'matched'|'partially_fulfilled'|'fulfilled'|'cancelled'|'expired'), contactNumber, medicalNotes, matchedDonorIds, reservedUnitIds`
7. **DonorMatchingResult**: `requestId, donorId, compatibilityScore, distanceKm, recencyScore, overallScore, rank, recommendationReason, matchFactors: { bloodMatch, distanceMatch, coolingPeriodOk, availabilityOk }, contactedAt, status ('suggested'|'notified'|'accepted'|'declined')`
8. **Donation**: `donorId, bloodBankId, requestId, donationDate, unitsCollected, bloodGroup, component, vitals: { hemoglobin, bpSys, bpDia, pulse }, status ('completed'|'tested'|'stored'|'rejected')`
9. **InventoryTransaction**: `unitId, bloodBankId, transactionType ('receipt'|'reservation'|'issue'|'discard'|'transfer_out'|'transfer_in'), performedBy (UserId), timestamp, notes, previousStatus, newStatus`
10. **StockTransfer**: `sourceBankId, targetBankId, requestedBy, unitIds, bloodGroup, component, quantity, status ('recommended'|'requested'|'in_transit'|'received'|'cancelled'), transferDate, receivedDate`
11. **Notification**: `recipientUserId, title, message, type ('request_match'|'status_change'|'shortage_alert'|'expiry_warning'|'emergency_escalation'|'donation_reminder'), referenceId, referenceType, isRead, createdAt`
12. **ForecastRecord**: `bloodBankId, targetDate, bloodGroup, component, horizonDays (7|14|30), historicalDemandAverage, predictedDemand, confidenceLower, confidenceUpper, shortageRiskScore ('low'|'moderate'|'high'|'critical'), recommendedReplenishmentUnits, modelName, evaluationMetrics: { mae, rmse }`
13. **AuditLog**: `action, entityType, entityId, performedBy, ipAddress, userAgent, details, timestamp`

---

## 4. Matching Algorithm & Safety Protocol

### Clinical ABO/Rh & Component Compatibility Rules
The matching engine evaluates compatibility based on the specific blood component requested:

| Component | Recipient Blood Group | Compatible Donor Blood Groups | Notes |
|-----------|----------------------|-------------------------------|-------|
| **Whole Blood / RBC** | O- | O- | Universal RBC donor |
| | O+ | O+, O- | Rh+ can receive Rh- |
| | A- | A-, O- | |
| | A+ | A+, A-, O+, O- | |
| | B- | B-, O- | |
| | B+ | B+, B-, O+, O- | |
| | AB- | AB-, A-, B-, O- | |
| | AB+ | All groups (Universal Recipient) | |
| **Plasma (FFP)** | AB (AB+, AB-) | AB only (Universal Plasma donor is AB) | Reverse compatibility for plasma |
| | A | A, AB | Plasma carries anti-B |
| | B | B, AB | Plasma carries anti-A |
| | O | O, A, B, AB | Universal plasma recipient |
| **Platelets** | Same ABO/Rh preferred; cross-group acceptable with low isohemagglutinin titer |

### Multi-Criteria Explainable Ranking Score
Candidate donors who pass compatibility and cooling-off eligibility (>= 56 days for Whole Blood) are ranked:
$$\text{Score} = w_{\text{compat}} \cdot S_{\text{compat}} + w_{\text{dist}} \cdot S_{\text{dist}} + w_{\text{recency}} \cdot S_{\text{recency}} + w_{\text{avail}} \cdot S_{\text{avail}}$$
- $S_{\text{compat}}$: 1.0 for exact ABO match, 0.85 for compatible alternate.
- $S_{\text{dist}}$: $\max(0, 1 - \frac{\text{Distance (km)}}{\text{Max Radius (50km)}})$ via Haversine.
- $S_{\text{recency}}$: 1.0 if never donated or $>120$ days; scaled linearly between 56 and 120 days.
- $S_{\text{avail}}$: 1.0 if marked active & verified.
- **Explainability**: Every candidate is returned with human-readable rationale (e.g. *"Exact match (O+), 4.2 km away, fully rested (145 days since last donation), verified active"*).

---

## 5. Forecasting & Shortage Analytics
- Analyzes daily historical requests, issues, and donations grouped by blood group and component.
- Implements Time-Series Moving Average + Day-of-week Seasonal Index + Random Forest regressor (via Python FastAPI, with robust native TypeScript analytical fallback).
- Evaluates metrics: Mean Absolute Error (MAE), Root Mean Square Error (RMSE).
- Computes **Shortage Risk Index (SRI)**:
  $$\text{SRI} = \frac{\text{Projected Demand (Horizon)} - \text{Usable Current Stock}}{\text{Projected Demand}} \times 100\%$$
- Expiry risk analysis: identifies units that will expire before projected demand consumes them, alerting admins to transfer surplus before wastage occurs.
