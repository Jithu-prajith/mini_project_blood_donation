import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DonorDashboard } from './pages/DonorDashboard';
import { RecipientDashboard } from './pages/RecipientDashboard';
import { BloodRequestCreatePage } from './pages/BloodRequestCreatePage';
import { DonorMatchingPage } from './pages/DonorMatchingPage';
import { BloodBankDirectoryPage } from './pages/BloodBankDirectoryPage';
import { InventoryManagementPage } from './pages/InventoryManagementPage';
import { EmergencyRequestPage } from './pages/EmergencyRequestPage';
import { PredictiveAnalyticsPage } from './pages/PredictiveAnalyticsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboard } from './pages/AdminDashboard';
import { StockTransfersPage } from './pages/StockTransfersPage';

// Route Guard wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <AppLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/blood-banks" element={<BloodBankDirectoryPage />} />
              <Route path="/emergency-requests" element={<EmergencyRequestPage />} />
              <Route path="/predictive-analytics" element={<PredictiveAnalyticsPage />} />

              {/* Protected Routes */}
              <Route
                path="/donor-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['donor', 'admin']}>
                    <DonorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recipient-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['recipient', 'admin']}>
                    <RecipientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-request"
                element={
                  <ProtectedRoute>
                    <BloodRequestCreatePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/matching/:id" element={<DonorMatchingPage />} />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute allowedRoles={['blood_bank', 'admin']}>
                    <InventoryManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stock-transfers"
                element={
                  <ProtectedRoute allowedRoles={['blood_bank', 'admin']}>
                    <StockTransfersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
