import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Pages admin
import Login from './pages/Login';
import OtpVerification from './pages/OtpVerification';
import Dashboard from './pages/Dashboard';
import ClassesManagement from './pages/ClassesManagement';
import CollegeForm from './pages/CollegeForm';

// Pages espace gestion (directeur / secrétaire)
import LoginGestion from './pages/LoginGestion';
import ActivationCompte from './pages/ActivationCompte';
import ReactivationCompte from './pages/ReactivationCompte';
import DashboardGestion from './pages/DashboardGestion';

const API_URL = import.meta.env.VITE_API_URL;
axios.defaults.baseURL = API_URL;

const getStoredUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

// allowedRoles optionnel : si fourni, restreint la route aux rôles listés
// et redirige vers le bon dashboard sinon (jamais un 403 silencieux côté UI).
const PrivateRoute = ({ children, isAuthenticated, loading, allowedRoles }) => {
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

  if (!isAuthenticated) return <Navigate to="/login" />;

  if (allowedRoles) {
    const user = getStoredUser();
    if (!user || !allowedRoles.includes(user.role)) {
      const fallback = user?.role === 'admin' ? '/dashboard' : '/gestion/dashboard';
      return <Navigate to={fallback} />;
    }
  }

  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = sessionStorage.getItem('token');
      if (token) {
        try {
          await axios.get(`${API_URL}/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Token verification failed:', err);
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  const storedUser = getStoredUser();
  const homeRedirect = !isAuthenticated
    ? '/login'
    : storedUser?.role === 'admin'
      ? '/dashboard'
      : '/gestion/dashboard';

  return (
    <Router>
      <Routes>
        {/* --- Admin --- */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={homeRedirect} />
            ) : (
              <Login onLoginSuccess={() => setIsAuthenticated(true)} />
            )
          }
        />
        <Route
          path="/verify-otp"
          element={<OtpVerification onLoginSuccess={() => setIsAuthenticated(true)} />}
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated} loading={loading} allowedRoles={['admin']}>
              <Dashboard onLogout={handleLogout} />
            </PrivateRoute>
          }
        />
        <Route
          path="/colleges/new"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated} loading={loading} allowedRoles={['admin']}>
              <CollegeForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/colleges/:collegeId/edit"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated} loading={loading} allowedRoles={['admin']}>
              <CollegeForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/colleges/:collegeId/classes"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated} loading={loading} allowedRoles={['admin']}>
              <ClassesManagement />
            </PrivateRoute>
          }
        />

        {/* --- Espace gestion (directeur / secrétaire) --- */}
        <Route
          path="/gestion/login"
          element={
            isAuthenticated ? (
              <Navigate to={homeRedirect} />
            ) : (
              <LoginGestion onLoginSuccess={() => setIsAuthenticated(true)} />
            )
          }
        />
        <Route
          path="/activation-compte"
          element={<ActivationCompte onLoginSuccess={() => setIsAuthenticated(true)} />}
        />
        <Route
          path="/reactivation-compte"
          element={<ReactivationCompte onLoginSuccess={() => setIsAuthenticated(true)} />}
        />
        <Route
          path="/gestion/dashboard"
          element={
            <PrivateRoute
              isAuthenticated={isAuthenticated}
              loading={loading}
              allowedRoles={['directeur', 'secretaire']}
            >
              <DashboardGestion onLogout={handleLogout} />
            </PrivateRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to={homeRedirect} />} />
        <Route path="*" element={<Navigate to={homeRedirect} />} />
      </Routes>
    </Router>
  );
}

export default App;
