import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import Dashboard from './components/dashboard/Dashboard';
import SalesModule from './components/sales/SalesModule';
import DesignModule from './components/design/DesignModule';
import ProductionModule from './components/production/ProductionModule';
import InstallationModule from './components/installation/InstallationModule';
import MasterTracker from './components/tracker/MasterTracker';
import ComplaintsModule from './components/complaints/ComplaintsModule';

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

// Auth Route component (redirects to dashboard if already logged in)
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return currentUser ? <Navigate to="/" /> : <>{children}</>;
};

// Login page component
const LoginPage: React.FC = () => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  return (
    <LoginForm
      onToggleMode={() => setIsRegisterMode(!isRegisterMode)}
      isRegisterMode={isRegisterMode}
    />
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
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
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales"
              element={
                <ProtectedRoute>
                  <SalesModule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/design"
              element={
                <ProtectedRoute>
                  <DesignModule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/production"
              element={
                <ProtectedRoute>
                  <ProductionModule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/installation"
              element={
                <ProtectedRoute>
                  <InstallationModule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tracker"
              element={
                <ProtectedRoute>
                  <MasterTracker />
                </ProtectedRoute>
              }
            />
            <Route
              path="/complaints"
              element={
                <ProtectedRoute>
                  <ComplaintsModule />
                </ProtectedRoute>
              }
            />
            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
