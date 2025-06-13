// src/pages/Auth/RegisterPage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaUserPlus } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, user, error: authError, setError } = useAuth();
  
  // Estado del formulario - ACTUALIZADO para nombre y apellido separados
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  
  // Redirigir si el usuario ya está autenticado
  useEffect(() => {
    if (user) {
      navigate('/');
    }
    
    // Limpiar errores de autenticación al montar/desmontar el componente
    return () => {
      setError(null);
    };
  }, [user, navigate, setError]);
  
  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Limpiar error específico al cambiar el valor
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  // Validar formulario - ACTUALIZADO para validar nombre y apellido
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }
    
    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es obligatorio';
    } else if (formData.apellido.trim().length < 2) {
      newErrors.apellido = 'El apellido debe tener al menos 2 caracteres';
    }
    
    if (!formData.email) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
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
  
  // Manejar envío del formulario - ACTUALIZADO para enviar nombre y apellido separados
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      await register({
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      
      // Mostrar mensaje de éxito
      setRegisterSuccess(true);
      
      // Redirigir a login después de un tiempo
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Registration error:', err);
      // El error de registro se maneja en el contexto
    } finally {
      setLoading(false);
    }
  };
  
  // Si el registro fue exitoso, mostrar mensaje
  if (registerSuccess) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card success-card">
            <h1 className="auth-title">¡Registro Exitoso!</h1>
            <p className="success-message">
              Tu cuenta ha sido creada correctamente. Serás redirigido a la página de inicio de sesión en unos segundos...
            </p>
            <Link to="/login" className="auth-button">
              Ir a Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Crear Cuenta</h1>
          
          {authError && (
            <div className="auth-error">
              <p>{authError}</p>
            </div>
          )}
          
          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Campo Nombre - NUEVO */}
            <div className="form-group">
              <label htmlFor="nombre">Nombre</label>
              <div className="input-with-icon">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  className={errors.nombre ? 'input-error' : ''}
                  disabled={loading}
                />
              </div>
              {errors.nombre && <p className="error-text">{errors.nombre}</p>}
            </div>

            {/* Campo Apellido - NUEVO */}
            <div className="form-group">
              <label htmlFor="apellido">Apellido</label>
              <div className="input-with-icon">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  placeholder="Tu apellido"
                  className={errors.apellido ? 'input-error' : ''}
                  disabled={loading}
                />
              </div>
              {errors.apellido && <p className="error-text">{errors.apellido}</p>}
            </div>
            
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
                  disabled={loading}
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
                  disabled={loading}
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
                  placeholder="Confirma tu contraseña"
                  className={errors.confirmPassword ? 'input-error' : ''}
                  disabled={loading}
                />
              </div>
              {errors.confirmPassword && (
                <p className="error-text">{errors.confirmPassword}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? (
                'Registrando...'
              ) : (
                <>
                  <FaUserPlus /> Registrarse
                </>
              )}
            </button>
          </form>
          
          <div className="auth-links">
            <div className="auth-redirect">
              ¿Ya tienes una cuenta?{' '}
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

export default RegisterPage;