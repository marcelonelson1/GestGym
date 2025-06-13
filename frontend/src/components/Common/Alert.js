// src/components/Common/Alert.js
import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaExclamationCircle } from 'react-icons/fa';
import './Alert.css';

const Alert = ({ type = 'info', message, duration = 5000, onClose }) => {
  const [visible, setVisible] = useState(true);
  
  // Manejar cierre automático
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration]);
  
  // Manejar cierre manual
  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 400); // Tiempo para la animación de salida
  };
  
  // Determinar ícono según tipo
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="alert-icon" />;
      case 'error':
        return <FaExclamationCircle className="alert-icon" />;
      case 'warning':
        return <FaExclamationTriangle className="alert-icon" />;
      case 'info':
      default:
        return <FaInfoCircle className="alert-icon" />;
    }
  };
  
  return (
    <div className={`alert alert-${type} ${visible ? 'show' : 'hide'}`}>
      <div className="alert-content">
        {getIcon()}
        <span className="alert-message">{message}</span>
      </div>
      <button className="alert-close" onClick={handleClose}>
        <FaTimes />
      </button>
    </div>
  );
};

export default Alert;