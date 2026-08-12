import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function OtpVerification({ onLoginSuccess }) {
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Récupérer l'email depuis le state de la navigation
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      // Si pas d'email, rediriger vers le login
      navigate('/login');
    }
  }, [location, navigate]);

  // Décompte du minuteur
  useEffect(() => {
    if (timeLeft <= 0) {
      setError('Le code OTP a expiré. Veuillez vous reconnecter.');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!otpCode || otpCode.length !== 6) {
        setError('Veuillez entrer un code OTP valide (6 chiffres)');
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_URL}/auth/verify-otp`, {
        email,
        otpCode,
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Appeler le callback pour mettre à jour l'état App
      if (onLoginSuccess) {
        onLoginSuccess();
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la vérification du code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      // Note: Vous devriez créer une route /auth/resend-otp au backend
      // Pour l'instant, nous affichons juste un message
      setError('Fonctionnalité de renvoi en cours de développement');
    } catch (err) {
      setError('Erreur lors de l\'envoi du nouveau code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">FVS</h1>
          <p className="text-gray-600 mt-2">Vérification de Connexion</p>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">
            Un code OTP a été envoyé à : <strong>{email}</strong>
          </p>
          <p className="text-xs text-gray-600 mt-2">
            ⏱️ Code valide pendant {formatTime(timeLeft)}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Code OTP (6 chiffres)
            </label>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtpCode(value);
              }}
              maxLength="6"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-center text-3xl font-bold tracking-widest"
              placeholder="000000"
              required
              disabled={timeLeft <= 0}
            />
          </div>

          <button
            type="submit"
            disabled={loading || timeLeft <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Vérification...' : 'Vérifier le Code'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">Vous n'avez pas reçu le code ?</p>
          <button
            onClick={handleResendOTP}
            disabled={loading}
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition disabled:opacity-50"
          >
            Renvoyer le code
          </button>
        </div>

        <div className="mt-6 text-center border-t pt-6">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-600 hover:text-gray-900 text-sm transition"
          >
            ← Retour à la connexion
          </button>
        </div>

        <p className="text-center text-gray-600 text-xs mt-8">
          Plateforme interne FVS • Contact: +229 97 268 741
        </p>
      </div>
    </div>
  );
}
