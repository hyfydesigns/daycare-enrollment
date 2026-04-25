import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OrgProvider } from './contexts/OrgContext';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ParentDashboard from './pages/ParentDashboard';
import EnrollmentForm from './pages/EnrollmentForm/index';
import ReviewSubmit from './pages/ReviewSubmit';
import AdminDashboard from './pages/AdminDashboard';
import AdminFormReview from './pages/AdminFormReview';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import PrintView from './pages/PrintView';
import Help from './pages/Help';

// Redirect logged-in users to their home page based on role
function homeFor(user) {
  if (!user) return '/login';
  if (user.role === 'superadmin') return '/superadmin';
  if (user.role === 'admin')      return '/admin';
  return '/dashboard';
}

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
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
      <Route path="/" element={<Landing />} />
      <Route path="/login"    element={user ? <Navigate to={homeFor(user)} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={homeFor(user)} replace /> : <Register />} />

      {/* Parent routes */}
      <Route path="/dashboard"            element={<ProtectedRoute role="parent"><ParentDashboard /></ProtectedRoute>} />
      <Route path="/enrollment/new"       element={<ProtectedRoute role="parent"><EnrollmentForm /></ProtectedRoute>} />
      <Route path="/enrollment/:id/edit"  element={<ProtectedRoute role="parent"><EnrollmentForm /></ProtectedRoute>} />
      <Route path="/enrollment/:id/review" element={<ProtectedRoute role="parent"><ReviewSubmit /></ProtectedRoute>} />

      {/* Org admin routes */}
      <Route path="/admin"                element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/enrollment/:id" element={<ProtectedRoute role="admin"><AdminFormReview /></ProtectedRoute>} />

      {/* Platform superadmin */}
      <Route path="/superadmin" element={<ProtectedRoute role="superadmin"><SuperAdminDashboard /></ProtectedRoute>} />

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
