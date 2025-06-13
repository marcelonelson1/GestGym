// src/pages/Contact/ContactPage.js
import React, { useState } from 'react';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaUser, FaPaperPlane } from 'react-icons/fa';
import Alert from '../../components/Common/Alert';
import Loading from '../../components/Common/Loading';
import contactService from '../../api/contactService';
import './ContactPage.css';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setAlert(null);
      
      await contactService.sendContactMessage(formData);
      
      // Mostrar mensaje de éxito
      setAlert({
        type: 'success',
        message: '¡Mensaje enviado correctamente! Te responderemos a la brevedad.'
      });
      
      // Limpiar formulario
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
      
    } catch (err) {
      console.error('Error sending contact message:', err);
      setAlert({
        type: 'error',
        message: 'Error al enviar el mensaje. Por favor, intenta de nuevo.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      {alert && (
        <Alert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert(null)} 
        />
      )}
      
      <div className="contact-container">
        <div className="contact-header">
          <h1>Contáctanos</h1>
          <p>¿Tienes alguna pregunta o sugerencia? ¡Nos encantaría escucharte!</p>
        </div>

        <div className="contact-content">
          <div className="contact-info">
            <h2>Información de Contacto</h2>
            
            <div className="contact-item">
              <FaEnvelope className="contact-icon" />
              <div>
                <h3>Email</h3>
                <p>info@fitnessplatform.com</p>
              </div>
            </div>
            
            <div className="contact-item">
              <FaPhone className="contact-icon" />
              <div>
                <h3>Teléfono</h3>
                <p>+54 351 123-4567</p>
              </div>
            </div>
            
            <div className="contact-item">
              <FaMapMarkerAlt className="contact-icon" />
              <div>
                <h3>Dirección</h3>
                <p>Córdoba, Argentina</p>
              </div>
            </div>

            <div className="contact-hours">
              <h3>Horarios de Atención</h3>
              <p><strong>Lunes a Viernes:</strong> 8:00 - 20:00</p>
              <p><strong>Sábados:</strong> 9:00 - 18:00</p>
              <p><strong>Domingos:</strong> 10:00 - 16:00</p>
            </div>
          </div>

          <div className="contact-form-container">
            <h2>Envíanos un Mensaje</h2>
            
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="name">
                  <FaUser className="form-icon" />
                  Nombre completo *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Tu nombre completo"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  <FaEnvelope className="form-icon" />
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="tu@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  <FaPhone className="form-icon" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+54 351 123-4567"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">
                  <FaPaperPlane className="form-icon" />
                  Mensaje *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  placeholder="Escribe tu mensaje aquí..."
                />
              </div>

              <button 
                type="submit" 
                className="submit-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loading size="small" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <FaPaperPlane />
                    Enviar Mensaje
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;