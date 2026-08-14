import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Pages
import Login from './pages/Login';
import OtpVerification from './pages/OtpVerification';
import Dashboard from './pages/Dashboard';
import ClassesManagement from './pages/ClassesManagement';
import CollegeForm from './pages/CollegeForm';

// Setup API defaults
const API_URL = import.meta.env.VITE_API_URL;
axios.defaults.baseURL = API_URL;

// Private Route Component
const PrivateRoute = ({ children, isAuthenticated, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f7faf8]">
        <div className="flex items-center gap-2 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
          <span className="text-sm">Chargement</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on mount
    const verifyToken = async () => {
      const token = sessionStorage.getItem('token');
      if (token) {
        try {
          await axios.get(`${API_URL}/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Token verification failed:', err);
          sessionStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" />
            ) : (
              <Login onLoginSuccess={() => setIsAuthenticated(true)} />
            )
          }
        />

        {/* OTP Verification Route */}
        <Route
          path="/verify-otp"
          element={<OtpVerification onLoginSuccess={() => setIsAuthenticated(true)} />}
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated} loading={loading}>
              <Dashboard onLogout={handleLogout} />
            </PrivateRoute>
          }
        />

        {/* Colleges Routes */}
        <Route
          path="/colleges/new"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated} loading={loading}>
              <CollegeForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/colleges/:collegeId/edit"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated} loading={loading}>
              <CollegeForm />
            </PrivateRoute>
          }
        />

        {/* Classes Routes */}
        <Route
          path="/colleges/:collegeId/classes"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated} loading={loading}>
              <ClassesManagement />
            </PrivateRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
