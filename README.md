# AI-Based Blood Donor–Recipient Matching and Blood Bank Management System

A full-stack, database-connected intelligent healthcare platform designed to connect blood donors, recipients, hospitals, and blood bank administrators. The system features an explainable AI donor matching engine, unit-level inventory and expiry management, emergency request escalation, and machine learning blood demand forecasting.

---

## 1. System Architecture & Tech Stack

```
+-----------------------------------------------------------------------------------+
|                        FRONTEND WEB APPLICATION (Port 5173)                       |
|   React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Recharts + Leaflet |
+-----------------------------------------+-----------------------------------------+
                                          | REST API (JWT Authenticated)
                                          v
+-----------------------------------------------------------------------------------+
|                           BACKEND SERVER (Port 5001)                              |
|           Node.js + Express + TypeScript + Mongoose ORM + Bcrypt + JWT            |
+---------------------+---------------------------------------+---------------------+
                      |                                       |
                      v                                       v
+------------------------------------+    +-----------------------------------------+
|     LOCAL DATABASE (Port 27017)     |    |      AI ANALYTICS SERVICE (Port 8000)   |
|         MongoDB (13 Schemas)       |    | Python 3.10 + FastAPI + Scikit-Learn RF |
|  Users, Donors, Inventory, Requests|    | Time-Series Cross-Validated Forecasting |
+------------------------------------+    +-----------------------------------------+
```

### Technology Highlights
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React icons, Recharts (responsive analytics), Leaflet & OpenStreetMap (geospatial visualization).
- **Backend**: Node.js v24, Express, TypeScript, Mongoose, JWT (session security), Bcrypt password hashing.
- **Database**: MongoDB running on `mongodb://127.0.0.1:27017/blood_management_db`.
- **AI & Analytics**: Python FastAPI microservice utilizing Scikit-learn `RandomForestRegressor` and time-series feature engineering with MAE/RMSE cross-validation.
- **Failover / Resiliency**: Built-in native TypeScript statistical forecasting fallback if Python microservice is offline or initializing.

---

## 2. Core Modules

### Module A: AI-Powered Donor–Recipient Matching
- **Component-Aware Compatibility**: Strict ABO/Rh rules differentiating Red Blood Cells / Whole Blood, Platelets, and Fresh Frozen Plasma (FFP).
- **Medical Cooling-Off Period**: Enforces mandatory clinical resting interval (>= 56 days for Whole Blood & packed RBC).
- **Transparent Multi-Criteria Ranking Score**:
  $$\text{Score} = (0.35 \times S_{\text{compat}}) + (0.35 \times S_{\text{dist}}) + (0.20 \times S_{\text{recency}}) + (0.10 \times S_{\text{avail}})$$
- **Explainable Rationale**: Every match returns human-readable justification explaining exact antigen match, Haversine distance, rest interval, and donation track record.
- **Geospatial Map**: Leaflet map plotting patient hospital location, nearby candidate donors, and participating blood bank stock.

### Module B: Intelligent Blood Bank Inventory Management
- **Unit-Level Tracking**: Unique barcode identifiers (e.g. `APO-WB-OP-00142`) across 5 components (*Whole Blood, Red Blood Cells, Platelets, Fresh Frozen Plasma, Cryoprecipitate*).
- **Automated Expiry Lifecycle**: Real-time expiration flags (`<3d`, `<7d`). Expired and quarantined units are strictly excluded from available allocatable stock.
- **Concurrency & Safety**: Atomic reservation prevents negative stock and double-allocation.
- **Audit Ledger**: Comprehensive `InventoryTransaction` logging for receipt, reservation, issue, quarantine, and discard.
- **Inter-Bank Rebalancing**: Analyzes regional supply imbalances and recommends stock transfers from surplus centers to shortage facilities.

### Module C: Emergency Blood Request Management
- **Urgency Levels**: Emergency (<1h), Urgent (<4h), Routine (<24h).
- **Dual-Discovery**: Concurrently queries verified active donors and regional blood bank inventory.
- **Regional Escalation Protocol**: Unfulfilled requests can be escalated to trigger a multi-bank broadcast alert across regional hospital centers.

### Module D: Predictive Blood Demand and Shortage Analytics
- **Forecasting Horizons**: Selectable 7, 14, and 30-day horizons.
- **Machine Learning**: Scikit-learn Random Forest Regressor trained on 90-day historical clinical requests and weekday seasonality.
- **Metrics**: Real-time Root Mean Squared Error (RMSE) and Mean Absolute Error (MAE) with 95% confidence bounds ($\pm 1.96 \times \text{MAE}$).
- **Shortage Risk Index (SRI)**: Flags Critical, High, Moderate, and Low risk blood groups with recommended replenishment unit targets.
- **Expiry Wastage Projection**: Calculates units at risk of expiring before projected demand consumes them.

---

## 3. Demo Accounts & One-Click Persona Switcher

The application includes a convenient **1-Click Persona Switcher** on the top navigation bar and login screen:

| Role | Name | Email | Password | Primary Dashboard |
|------|------|-------|----------|-------------------|
| **System Admin** | Dr. Sarah Mitchell | `admin@hemamatch.org` | `admin123` | `/admin` |
| **Blood Bank Admin** | Dr. Ramesh Kulkarni | `apollo.bloodbank@hemamatch.org` | `password123` | `/inventory` |
| **Recipient / Hospital** | Priya Sharma | `priya.recipient@gmail.com` | `password123` | `/recipient-dashboard` |
| **Blood Donor** | Rahul Sharma (O+) | `rahul.donor@gmail.com` | `password123` | `/donor-dashboard` |

---

## 4. Quick Start & Execution

### Prerequisites
- Node.js (v18+) & npm
- Python (v3.9+) with `fastapi`, `uvicorn`, `scikit-learn`, `pandas`, `numpy`
- MongoDB running locally on port `27017`

### Step 1: Install Dependencies
```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### Step 2: Seed the Database
Populates 10 donors, 3 certified blood banks, 380+ inventory units, realistic blood requests, and 60 days of historical demand data:
```bash
cd ../server
npm run seed
```

### Step 3: Run the Automated Clinical Test Suite
Verifies ABO/Rh compatibility, plasma inverted rules, cooling-off intervals, Haversine distance, and inventory transaction safety:
```bash
npm run test
```
*Output: 13 Passed, 0 Failed.*

### Step 4: Start the Services
Launch the three services in separate terminals:

**Terminal 1 (Backend Server - Port 5001):**
```bash
cd server
npm run dev
```

**Terminal 2 (AI Python Service - Port 8000):**
```bash
cd ai_service
python main.py
```

**Terminal 3 (Frontend Client - Port 5173):**
```bash
cd client
npm run dev
```

Open your browser to: **`http://localhost:5173`**

---

## 5. REST API Documentation

### Authentication (`/api/auth`)
- `POST /register`: Register donor, recipient, or blood bank.
- `POST /login`: Authenticate and receive JWT.
- `POST /demo-login`: Instant 1-click login for demo personas.
- `GET /me`: Get current authenticated user profile.

### Donor Matching (`/api/matching`)
- `GET /:requestId?radiusKm=50`: Execute explainable AI matching engine.
- `POST /contact`: Dispatch contact notification to candidate donor.

### Blood Requests (`/api/requests`)
- `POST /`: Submit new request.
- `GET /`: List all requests with filters (`urgency`, `status`, `bloodGroup`).
- `GET /my-requests`: Requests submitted by current user.
- `POST /:id/escalate`: Trigger emergency escalation broadcast.
- `PATCH /:id/status`: Update request status (`matched`, `fulfilled`, etc.).

### Inventory & Stock (`/api/inventory`)
- `GET /`: List inventory units with filters.
- `POST /`: Register new unit with automatic shelf life.
- `POST /reserve`: Atomically reserve unit for verified request.
- `POST /issue`: Issue reserved unit for clinical transfusion.
- `POST /dispose`: Mark unit quarantined or discarded with reason.
- `GET /transactions`: Auditable transaction log.

### Inter-Bank Transfers (`/api/transfers`)
- `GET /recommendations`: AI rebalancing suggestions.
- `GET /`: List all transfer logs.
- `POST /`: Initiate stock transfer request.
- `PATCH /:id/status`: Dispatch or confirm receipt of transfer.

### Predictive Analytics (`/api/analytics`)
- `GET /?horizon=14`: Demand forecast curves, shortage risk matrix, and wastage estimates.

### Administration (`/api/admin`)
- `GET /overview`: Global system counters and fulfilment rates.
- `GET /audit-logs`: Security and decision audit trail.
- `POST /reseed-data`: Reset database and reload clean demo records.

---

## 6. Clinical & Regulatory Disclaimer

> **IMPORTANT MEDICAL NOTICE**: Blood compatibility results and algorithmic rankings generated by this application are computerized preliminary coordination filters. They do **not** constitute clinical authorization for blood transfusion. Standard hospital blood bank procedures—including mandatory serological crossmatching, pathogen screening (HIV, HBV, HCV, Syphilis), and authorized physician verification—must be completed prior to any administration.
