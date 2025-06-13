// src/components/Activities/ActivityCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaClock, FaUserAlt, FaMapMarkerAlt } from 'react-icons/fa';
import config from '../../config';
import './ActivityCard.css';

const ActivityCard = ({ activity }) => {
  // Formatear la URL de la imagen
  const imageUrl = activity.imageUrl 
    ? `${config.IMAGE_BASE_URL}/${activity.imageUrl}` 
    : config.DEFAULT_ACTIVITY_IMAGE;

  // Formatear categoría para mostrar
  const formatCategory = (category) => {
    const found = config.CATEGORIES.find(c => c.id === category);
    return found ? found.name : category;
  };

  return (
    <div className="activity-card">
      <div className="activity-card-image">
        <img src={imageUrl} alt={activity.title} />
        <div className="activity-card-category">
          {formatCategory(activity.category)}
        </div>
      </div>
      
      <div className="activity-card-content">
        <h3 className="activity-card-title">{activity.title}</h3>
        
        <div className="activity-card-info">
          <div className="info-item">
            <FaUserAlt className="info-icon" />
            <span>{activity.instructor}</span>
          </div>
          
          <div className="info-item">
            <FaClock className="info-icon" />
            <span>{activity.schedule}</span>
          </div>
          
          {activity.location && (
            <div className="info-item">
              <FaMapMarkerAlt className="info-icon" />
              <span>{activity.location}</span>
            </div>
          )}
        </div>
        
        <div className="activity-card-footer">
          <Link to={`/activities/${activity.id}`} className="activity-card-button">
            Ver detalles
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;