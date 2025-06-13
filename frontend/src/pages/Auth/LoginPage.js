// src/pages/Auth/LoginPage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, error: authError, setError } = useAuth();
  
  // Obtener la URL a la que redirigir después del login (si existe)
  const from = location.state?.from?.pathname || '/';
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Redirigir si el usuario ya está autenticado
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
    
    // Limpiar errores de autenticación al montar/desmontar el componente
    return () => {
      setError(null);
    };
  }, [user, navigate, from, setError]);
  
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
    
    if (!formData.email) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      await login(formData.email, formData.password);
      
      // La redirección se maneja en el useEffect
    } catch (err) {
      console.error('Login error:', err);
      
      // El error de autenticación se maneja en el contexto
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Iniciar Sesión</h1>
          
          {authError && (
            <div className="auth-error">
              <p>{authError}</p>
            </div>
          )}
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <div className="input-with-icon">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tucorreo@ejemplo.com"
                  className={errors.email ? 'input-error' : ''}
                />
              </div>
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="input-with-icon">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Tu contraseña"
                  className={errors.password ? 'input-error' : ''}
                />
              </div>
              {errors.password && (
                <p className="error-text">{errors.password}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? (
                'Iniciando sesión...'
              ) : (
                <>
                  <FaSignInAlt /> Iniciar Sesión
                </>
              )}
            </button>
          </form>
          
          <div className="auth-links">
            <Link to="/forgot-password" className="forgot-password-link">
              ¿Olvidaste tu contraseña?
            </Link>
            <div className="auth-redirect">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="register-link">
                Regístrate
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;