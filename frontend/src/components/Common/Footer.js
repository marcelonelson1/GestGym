// src/components/Common/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';
import config from '../../config';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3 className="footer-title">{config.APP_NAME}</h3>
          <p className="footer-description">
            Tu centro deportivo de confianza. Únete a nuestra comunidad
            dedicada a la salud, el bienestar y el deporte.
          </p>
          <div className="social-links">
            <a href="#" className="social-link" aria-label="Facebook">
              <FaFacebook />
            </a>
            <a href="#" className="social-link" aria-label="Twitter">
              <FaTwitter />
            </a>
            <a href="#" className="social-link" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="#" className="social-link" aria-label="YouTube">
              <FaYoutube />
            </a>
          </div>
        </div>
        
        <div className="footer-section">
          <h3 className="footer-title">Enlaces Rápidos</h3>
          <ul className="footer-links">
            <li>
              <Link to="/">Inicio</Link>
            </li>
            <li>
              <Link to="/activities">Actividades</Link>
            </li>
            <li>
              <Link to="/instructors">Instructores</Link>
            </li>
            <li>
              <Link to="/schedule">Horarios</Link>
            </li>
            <li>
              <Link to="/contact">Contacto</Link>
            </li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3 className="footer-title">Categorías</h3>
          <ul className="footer-links">
            {config.CATEGORIES.slice(0, 5).map(category => (
              <li key={category.id}>
                <Link to={`/activities?category=${category.id}`}>{category.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="footer-section">
          <h3 className="footer-title">Contacto</h3>
          <ul className="contact-info">
            <li>
              <FaMapMarkerAlt className="contact-icon" />
              <span>Av. Hipólito Yrigoyen 384<br />Córdoba, Argentina</span>
            </li>
            <li>
              <FaPhone className="contact-icon" />
              <span>+54 (351) 123-4567</span>
            </li>
            <li>
              <FaEnvelope className="contact-icon" />
              <span>info@sportcenter.com</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {currentYear} {config.APP_NAME}. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;