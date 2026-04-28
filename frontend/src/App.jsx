import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OrgProvider } from './contexts/OrgContext';

import Landing from './pages/Landing';
import PlatformLanding from './pages/PlatformLanding';
import OrgSignup from './pages/OrgSignup';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Login from './pages/Login';
import Register from './pages/Register';
import ParentDashboard from './pages/ParentDashboard';
import EnrollmentForm from './pages/EnrollmentForm/index';
import ReviewSubmit from './pages/ReviewSubmit';
import AdminDashboard from './pages/AdminDashboard';
import AdminFormReview from './pages/AdminFormReview';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminLogin from './pages/SuperAdminLogin';
import ChangePassword from './pages/ChangePassword';
import OrgSettings from './pages/OrgSettings';
import PrintView from './pages/PrintView';
import Help from './pages/Help';

// True when visiting the root platform domain (e.g. enrollpack.com),
// false when on a daycare subdomain (e.g. sunshine.enrollpack.com)
function isRootDomain() {
  const appDomain = import.meta.env.VITE_APP_DOMAIN;
  if (!appDomain) return false;
  const hostname = window.location.hostname;
  return hostname === appDomain || hostname === `www.${appDomain}`;
}

// Redirect logged-in users to their home page based on role
function homeFor(user) {
  if (!user) return '/login';
  if (user.role === 'superadmin') return '/superadmin';
  if (user.role === 'admin')      return '/admin';
  return '/dashboard';
}

function ProtectedRoute({ children, role, skipForceCheck = false }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  // Force password change before accessing anything else
  if (!skipForceCheck && user.force_password_change) {
    return <Navigate to="/change-password" replace />;
  }
  // Superadmins can access any protected route unless a specific role is required
  // and they don't have it (they're not 'admin' or 'parent', only 'superadmin')
  if (role && user.role !== role && user.role !== 'superadmin') {
    return <Navigate to={homeFor(user)} replace />;
  }
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={isRootDomain() ? <PlatformLanding /> : <Landing />} />
      <Route path="/signup"       element={isRootDomain() ? <OrgSignup />     : <Navigate to="/" replace />} />
      <Route path="/admin"        element={isRootDomain() ? (user ? <Navigate to={homeFor(user)} replace /> : <SuperAdminLogin />) : <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/login"            element={isRootDomain() ? <Navigate to="/" replace /> : user ? <Navigate to={homeFor(user)} replace /> : <Login />} />
      <Route path="/register"         element={isRootDomain() ? <Navigate to="/" replace /> : user ? <Navigate to={homeFor(user)} replace /> : <Register />} />
      <Route path="/forgot-password"  element={isRootDomain() ? <Navigate to="/" replace /> : <ForgotPassword />} />
      <Route path="/reset-password"   element={isRootDomain() ? <Navigate to="/" replace /> : <ResetPassword />} />

      {/* Parent routes */}
      <Route path="/dashboard"            element={<ProtectedRoute role="parent"><ParentDashboard /></ProtectedRoute>} />
      <Route path="/enrollment/new"       element={<ProtectedRoute role="parent"><EnrollmentForm /></ProtectedRoute>} />
      <Route path="/enrollment/:id/edit"  element={<ProtectedRoute role="parent"><EnrollmentForm /></ProtectedRoute>} />
      <Route path="/enrollment/:id/review" element={<ProtectedRoute role="parent"><ReviewSubmit /></ProtectedRoute>} />

      {/* Org admin routes */}
      <Route path="/admin/enrollment/:id" element={<ProtectedRoute role="admin"><AdminFormReview /></ProtectedRoute>} />
      <Route path="/admin/settings"       element={<ProtectedRoute role="admin"><OrgSettings /></ProtectedRoute>} />

      {/* Platform superadmin */}
      <Route path="/superadmin" element={<ProtectedRoute role="superadmin"><SuperAdminDashboard /></ProtectedRoute>} />

      {/* Force password change — accessible while logged in but blocks all other routes */}
      <Route path="/change-password" element={<ProtectedRoute skipForceCheck><ChangePassword /></ProtectedRoute>} />

      {/* Shared */}
      <Route path="/print/:id" element={<ProtectedRoute><PrintView /></ProtectedRoute>} />
      <Route path="/help"      element={<Help />} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <OrgProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </OrgProvider>
    </BrowserRouter>
  );
}
