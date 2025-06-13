// src/pages/Auth/ForgotPasswordPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaPaperPlane } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './AuthPages.css';

const ForgotPasswordPage = () => {
  // Estado del formulario
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [resetToken, setResetToken] = useState('');
  const { error: authError, setError: setAuthError, forgotPassword } = useAuth();
  
  // Limpiar errores al montar/desmontar el componente
  useEffect(() => {
    // Limpiar errores de autenticación al montar el componente
    if (setAuthError) {
      setAuthError(null);
    }
    
    // Limpiar errores al desmontar el componente
    return () => {
      if (setAuthError) {
        setAuthError(null);
      }
    };
  }, [setAuthError]);
  
  // Manejar cambio del email
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError('');
  };
  
  // Validar formulario
  const validateForm = () => {
    if (!email) {
      setError('El correo electrónico es obligatorio');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('El correo electrónico no es válido');
      return false;
    }
    return true;
  };
  
  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      console.log('Enviando solicitud de recuperación para:', email);
      setLoading(true);
      
      // Primer intento: usar el AuthContext
      try {
        console.log('Intentando usar forgotPassword del AuthContext');
        const response = await forgotPassword(email);
        console.log('Respuesta del contexto:', response);
        
        // Verificar si hay información de desarrollo
        if (response && response.resetToken) {
          console.log('Token de recuperación:', response.resetToken);
          setResetToken(response.resetToken);
        }
        
        if (response && response.resetLink) {
          console.log('Enlace de recuperación:', response.resetLink);
          setResetLink(response.resetLink);
        }
        
        // Mostrar mensaje de éxito
        setSuccess(true);
        return;
      } catch (contextError) {
        console.error('Error al usar AuthContext:', contextError);
      }
      
      // Segundo intento: llamada directa a la API
      try {
        console.log('Intentando llamada directa a la API');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await axios.post(
          `${apiUrl}/api/auth/forgot-password`, 
          { email }
        );
        
        console.log('Respuesta directa de la API:', response.data);
        
        // Guardar el token y el enlace de recuperación si están disponibles
        if (response.data && response.data.resetToken) {
          console.log('Token de recuperación:', response.data.resetToken);
          setResetToken(response.data.resetToken);
        }
        
        if (response.data && response.data.resetLink) {
          console.log('Enlace de recuperación:', response.data.resetLink);
          setResetLink(response.data.resetLink);
        }
        
        // Mostrar mensaje de éxito
        setSuccess(true);
      } catch (directError) {
        console.error('Error en llamada directa:', directError);
        
        if (directError.response) {
          console.error('Datos de respuesta:', directError.response.data);
          console.error('Estado HTTP:', directError.response.status);
        }
        
        throw directError;
      }
      
    } catch (err) {
      console.error('Error completo:', err);
      
      // No mostrar errores específicos para no revelar si el email existe
      setError('Ha ocurrido un error al procesar tu solicitud. Por favor, intenta nuevamente más tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  // Si la solicitud fue exitosa, mostrar mensaje
  if (success) {
    const isDevEnvironment = process.env.NODE_ENV === 'development' || process.env.REACT_APP_SHOW_RESET_LINK === 'true';
    
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card success-card">
            <h1 className="auth-title">Correo Enviado</h1>
            <p className="success-message">
              Si el correo electrónico proporcionado está registrado en nuestro sistema, 
              recibirás un enlace para restablecer tu contraseña en unos minutos.
            </p>
            <p className="success-message">
              Recuerda revisar tu carpeta de spam si no lo encuentras en tu bandeja de entrada.
            </p>
            
            {/* Mostrar enlace de recuperación en desarrollo */}
            {isDevEnvironment && (resetLink || resetToken) && (
              <div style={{ 
                marginTop: '20px', 
                padding: '15px', 
                background: '#f8f9fa', 
                border: '1px dashed #ccc',
                borderRadius: '5px',
                marginBottom: '20px'
              }}>
                <p style={{ fontWeight: 'bold', color: '#e63946' }}>Información para desarrollo:</p>
                <p>En un entorno de producción, este enlace se enviaría por correo.</p>
                {resetToken && (
                  <p><strong>Token de recuperación:</strong> {resetToken}</p>
                )}
                {resetLink && (
                  <>
                    <p><strong>Enlace de recuperación:</strong></p>
                    <a 
                      href={resetLink} 
                      style={{ 
                        wordBreak: 'break-all', 
                        color: '#1a73e8', 
                        textDecoration: 'underline' 
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {resetLink}
                    </a>
                    <p style={{ marginTop: '10px' }}>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(resetLink);
                          alert('Enlace copiado al portapapeles');
                        }}
                        style={{
                          background: '#4a86e8',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Copiar Enlace
                      </button>
                    </p>
                  </>
                )}
                {!resetLink && !resetToken && (
                  <p style={{ color: '#e63946' }}>
                    <strong>Nota:</strong> No se recibió un enlace de recuperación del servidor.
                    Esto podría indicar que el correo fue enviado correctamente,
                    pero los datos de desarrollo no están disponibles.
                  </p>
                )}
              </div>
            )}
            
            <Link to="/login" className="auth-button">
              Volver a Iniciar Sesión
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
          <h1 className="auth-title">Recuperar Contraseña</h1>
          
          <p className="auth-subtitle" style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#666' }}>
            Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
          </p>
          
          {authError && (
            <div className="auth-error">
              <p>{authError}</p>
            </div>
          )}
          
          {error && !authError && (
            <div className="auth-error">
              <p>{error}</p>
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
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="tucorreo@ejemplo.com"
                  className={error && error.includes('correo') ? 'input-error' : ''}
                  disabled={loading}
                />
              </div>
              {error && error.includes('correo') && <p className="error-text">{error}</p>}
            </div>
            
            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? (
                'Enviando...'
              ) : (
                <>
                  <FaPaperPlane /> Enviar Instrucciones
                </>
              )}
            </button>
          </form>
          
          <div className="auth-links">
            <div className="auth-redirect">
              <Link to="/login" className="login-link">
                Volver a Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;