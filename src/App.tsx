import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import Dashboard from './components/dashboard/Dashboard';
import SalesModule from './components/sales/SalesModule';
import VersionFooter from './components/VersionFooter';
import DesignModule from './components/design/DesignModule';
import ProductionModule from './components/production/ProductionModule';
import InstallationModule from './components/installation/InstallationModule';
import MasterTracker from './components/tracker/MasterTracker';
import ComplaintsModule from './components/complaints/ComplaintsModule';
import AdminModule from './components/admin/AdminModule';
import ChangePasswordForm from './components/auth/ChangePasswordForm';
import ProfileSettings from './components/profile/ProfileSettings';
// Test components removed for production
import { initializeFirebaseService } from './services/firebaseService';

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

// Protected Route component - moved outside App component to prevent re-definition
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Log user authentication status for debugging
  if (currentUser) {
    console.log('✅ User authenticated:', {
      uid: currentUser.uid,
      email: currentUser.email,
      employeeId: currentUser.employeeId,
      isTemporary: currentUser.isTemporary,
      passwordSet: currentUser.passwordSet,
      currentPath: location.pathname,
      userFlags: {
        isTemporary: currentUser.isTemporary,
        passwordSet: currentUser.passwordSet,
        hasEmployeeId: !!currentUser.employeeId
      }
    });
  }

  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

// Auth Route component (redirects to dashboard if already logged in) - moved outside App component
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return currentUser ? <Navigate to="/" /> : <>{children}</>;
};

// Login page component - moved outside App component
const LoginPage: React.FC = () => {
  return <LoginForm />;
};

function App() {
  // Initialize Firebase service on app startup
  useEffect(() => {
    initializeFirebaseService();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route
            path="/login"
            element={
              <AuthRoute>
                <LoginPage />
              </AuthRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex flex-col">
                  <div className="flex-1">
                    <Dashboard />
                  </div>
                  <VersionFooter />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex flex-col">
                  <div className="flex-1">
                    <SalesModule />
                  </div>
                  <VersionFooter />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/design"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex flex-col">
                  <div className="flex-1">
                    <DesignModule />
                  </div>
                  <VersionFooter />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/production"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex flex-col">
                  <div className="flex-1">
                    <ProductionModule />
                  </div>
                  <VersionFooter />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/installation"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex flex-col">
                  <div className="flex-1">
                    <InstallationModule />
                  </div>
                  <VersionFooter />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tracker"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex flex-col">
                  <div className="flex-1">
                    <MasterTracker />
                  </div>
                  <VersionFooter />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/complaints"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex flex-col">
                  <div className="flex-1">
                    <ComplaintsModule />
                  </div>
                  <VersionFooter />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex flex-col">
                  <div className="flex-1">
                    <AdminModule />
                  </div>
                  <VersionFooter />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePasswordForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex flex-col">
                  <div className="flex-1">
                    <ProfileSettings />
                  </div>
                  <VersionFooter />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex flex-col">
                  <div className="flex-1">
                    <ProfileSettings />
                  </div>
                  <VersionFooter />
                </div>
              </ProtectedRoute>
            }
          />
          {/* Test routes removed for production */}
          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
