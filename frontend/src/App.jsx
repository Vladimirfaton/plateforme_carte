import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Pages
import Login from './pages/Login';
import OtpVerification from './pages/OtpVerification';
import Dashboard from './pages/Dashboard';
import ClassesManagement from './pages/ClassesManagement';
import CollegeForm from './pages/CollegeForm';
import StudentsManagement from './pages/StudentsManagement';
import BrouillonExport from './pages/BrouillonExport';
import FinalCards from './pages/FinalCards';

// Setup API defaults
const API_URL = import.meta.env.VITE_API_URL;
axios.defaults.baseURL = API_URL;

// Private Route Component
const PrivateRoute = ({ children, isAuthenticated, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sky-50">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-sky-300 border-t-sky-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600">Chargement...</p>
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
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await axios.get(`${API_URL}/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Token verification failed:', err);
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
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

        {/* Students Routes */}
        <Route
          path="/classes/:classId/students"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated} loading={loading}>
              <StudentsManagement />
            </PrivateRoute>
          }
        />

        {/* Brouillon Routes */}
        <Route
          path="/classes/:classId/brouillon"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated} loading={loading}>
              <BrouillonExport />
            </PrivateRoute>
          }
        />

        {/* Final Cards Routes */}
        <Route
          path="/classes/:classId/cartes"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated} loading={loading}>
              <FinalCards />
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
