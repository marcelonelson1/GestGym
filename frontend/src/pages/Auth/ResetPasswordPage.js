// src/pages/Auth/ResetPasswordPage.js (Solución para evitar reintentos excesivos)
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaLock, FaKey, FaExclamationTriangle, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './AuthPages.css';

const ResetPasswordPage = () => {
  const { token } = useParams(); // Obtener el token de la URL
  const navigate = useNavigate();
  const { resetPassword, validateResetToken, error: authError, setError: setAuthError, loading: authLoading } = useAuth();
  
  // Estados
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null); // null = cargando, true = válido, false = inválido
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenEmail, setTokenEmail] = useState(''); // Email asociado al token
  const [validating, setValidating] = useState(true); // Estado para mostrar pantalla de carga durante la validación
  const [resetAttempted, setResetAttempted] = useState(false); // Para evitar múltiples intentos
  
  // Validar token al cargar la página
  useEffect(() => {
    const validateToken = async () => {
      setValidating(true);
      try {
        if (!token) {
          console.log('No se encontró token en los parámetros de URL');
          setTokenValid(false);
          setValidating(false);
          return;
        }
        
        console.log('Iniciando validación de token:', token);
        
        // Validación directa - un solo intento, sin reintentos
        try {
          const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
          const response = await axios.get(`${apiUrl}/api/auth/reset-password/${token}/validate`);
          
          if (response.data && response.data.valid) {
            console.log('Token válido para email:', response.data.email);
            setTokenValid(true);
            setTokenEmail(response.data.email || '');
          } else {
            setTokenValid(false);
          }
        } catch (error) {
          console.error('Error validando token:', error);
          setTokenValid(false);
        }
      } catch (err) {
        console.error('Error general al validar token:', err);
        setTokenValid(false);
      } finally {
        setValidating(false);
      }
    };
    
    validateToken();
    
    // Limpiar errores al montar/desmontar
    return () => {
      if (setAuthError) {
        setAuthError(null);
      }
    };
  }, [token, setAuthError]);
  
  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Limpiar error específico al cambiar el valor
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  // Validar formulario
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.password) {
      newErrors.password = 'La nueva contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Debes confirmar la contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Manejar envío del formulario - OPTIMIZADO PARA EVITAR REINTENTOS
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Evitar múltiples envíos
    if (loading || resetAttempted) return;
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setResetAttempted(true); // Marcar que ya se intentó el reset
      
      console.log('Enviando solicitud de restablecimiento para token:', token);
      
      // Un solo intento directo con Axios, sin reintentos
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.post(`${apiUrl}/api/auth/reset-password`, {
        token,
        password: formData.password
      });
      
      console.log('Contraseña restablecida con éxito');
      
      // Mostrar mensaje de éxito
      setResetSuccess(true);
      
      // Redirigir a login después de unos segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Error al restablecer contraseña:', err);
      
      if (err.response) {
        console.error('Respuesta de error:', err.response.data);
      }
      
      // Si el error indica que el token ya fue usado, consideramos que fue exitoso
      // (porque probablemente ya se cambió la contraseña en una solicitud anterior)
      if (err.response && 
          err.response.data && 
          typeof err.response.data.error === 'string' &&
          (err.response.data.error.includes('usado') || 
           err.response.data.error.includes('utilizado'))) {
        console.log('El token ya ha sido utilizado, considerando la operación como exitosa');
        setResetSuccess(true);
        
        // Redirigir a login después de unos segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setErrors({ 
          form: 'Ha ocurrido un error al restablecer la contraseña. Por favor, intenta nuevamente.' 
        });
        // Permitir un reintento si el error no fue que el token ya fue usado
        setResetAttempted(false);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Mostrar pantalla de carga mientras se valida el token
  if (validating) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <h1 className="auth-title">Validando enlace...</h1>
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <FaSpinner 
                style={{ 
                  animation: 'spin 1s linear infinite',
                  fontSize: '2rem',
                  margin: '1rem 0',
                  color: '#1a73e8'
                }} 
              />
              <p>Por favor espera mientras verificamos tu enlace de recuperación.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Mostrar error si el token es inválido o expirado
  if (tokenValid === false) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <h1 className="auth-title">Enlace Inválido</h1>
            <div style={{ textAlign: 'center', color: '#e63946', marginBottom: '1.5rem' }}>
              <FaExclamationTriangle size={40} />
              <p style={{ marginTop: '1rem' }}>
                El enlace para restablecer tu contraseña es inválido o ha expirado.
              </p>
            </div>
            <p style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              Por favor, solicita un nuevo enlace de recuperación.
            </p>
            <Link to="/forgot-password" className="auth-button">
              Solicitar nuevo enlace
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Mostrar pantalla de éxito
  if (resetSuccess) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card success-card">
            <h1 className="auth-title">¡Contraseña Actualizada!</h1>
            <div style={{ textAlign: 'center', color: '#2ecc71', marginBottom: '1.5rem' }}>
              <FaCheckCircle size={40} />
            </div>
            <p className="success-message">
              Tu contraseña ha sido restablecida correctamente. Serás redirigido a la página de inicio de sesión en unos segundos...
            </p>
            <Link to="/login" className="auth-button">
              Ir a Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Formulario para restablecer contraseña
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Restablecer Contraseña</h1>
          
          {tokenEmail && (
            <p className="auth-subtitle" style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#666' }}>
              Crea una nueva contraseña para <strong>{tokenEmail}</strong>
            </p>
          )}
          
          {authError && (
            <div className="auth-error">
              <p>{authError}</p>
            </div>
          )}
          
          {errors.form && !authError && (
            <div className="auth-error">
              <p>{errors.form}</p>
            </div>
          )}
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">Nueva Contraseña</label>
              <div className="input-with-icon">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Tu nueva contraseña"
                  className={errors.password ? 'input-error' : ''}
                  disabled={loading || authLoading || resetAttempted}
                />
              </div>
              {errors.password && (
                <p className="error-text">{errors.password}</p>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <div className="input-with-icon">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirma tu nueva contraseña"
                  className={errors.confirmPassword ? 'input-error' : ''}
                  disabled={loading || authLoading || resetAttempted}
                />
              </div>
              {errors.confirmPassword && (
                <p className="error-text">{errors.confirmPassword}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="auth-button"
              disabled={loading || authLoading || resetAttempted}
            >
              {loading ? (
                'Actualizando...'
              ) : resetAttempted ? (
                'Procesando...'
              ) : (
                <>
                  <FaKey /> Establecer Nueva Contraseña
                </>
              )}
            </button>
          </form>
          
          <div className="auth-links">
            <div className="auth-redirect">
              ¿Recordaste tu contraseña?{' '}
              <Link to="/login" className="login-link">
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;