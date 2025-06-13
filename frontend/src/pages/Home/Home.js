// src/pages/Home/Home.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCalendarAlt, FaUsers, FaTrophy, FaCheckCircle, FaDumbbell, FaRunning, FaHeart, FaUser, FaClock } from 'react-icons/fa';
import activityService from '../../api/activityService';
import './Home.css';

const Home = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estadísticas del centro
  const stats = [
    { number: '10+', label: 'Años de Experiencia', icon: <FaTrophy /> },
    { number: '500+', label: 'Miembros Activos', icon: <FaUsers /> },
    { number: '20+', label: 'Actividades Disponibles', icon: <FaDumbbell /> },
    { number: '15+', label: 'Instructores Certificados', icon: <FaHeart /> }
  ];

  // Beneficios
  const benefits = [
    'Equipamiento de última generación',
    'Clases para todos los niveles',
    'Horarios flexibles',
    'Instructores certificados',
    'Ambiente motivador',
    'Resultados garantizados'
  ];

  // Cargar actividades al montar el componente
  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await activityService.getActivities();
        setActivities(data.slice(0, 6)); // Solo mostrar 6 en home
      } catch (err) {
        setError('Error al cargar actividades. Por favor, intenta de nuevo más tarde.');
        console.error('Error fetching activities:', err);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, []);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <FaRunning className="badge-icon" />
            <span>Tu Centro Deportivo de Confianza</span>
          </div>
          <h1 className="hero-title">
            Transforma tu Vida con <span className="text-accent">Deporte</span>
          </h1>
          <p className="hero-subtitle">
            Descubre el poder del ejercicio con nuestras actividades diseñadas 
            para mejorar tu salud, energía y bienestar
          </p>
          <div className="hero-buttons">
            <Link to="/activities" className="hero-button primary">
              Explorar Actividades <FaArrowRight />
            </Link>
            <Link to="/register" className="hero-button secondary">
              Comenzar Ahora
            </Link>
          </div>
          <div className="hero-scroll-indicator">
            <div className="scroll-arrow"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">¿Por qué elegirnos?</h2>
          <p className="section-subtitle">
            Ofrecemos una experiencia única para alcanzar tus objetivos fitness
          </p>
        </div>
        <div className="features-container">
          <div className="feature-card">
            <div className="feature-icon">
              <FaCalendarAlt />
            </div>
            <h3 className="feature-title">Horarios Flexibles</h3>
            <p className="feature-description">
              Múltiples horarios que se adaptan a tu rutina diaria
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FaUsers />
            </div>
            <h3 className="feature-title">Instructores Expertos</h3>
            <p className="feature-description">
              Profesionales certificados comprometidos con tu progreso
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FaTrophy />
            </div>
            <h3 className="feature-title">Todos los Niveles</h3>
            <p className="feature-description">
              Programas adaptados desde principiantes hasta avanzados
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefits-container">
          <div className="benefits-content">
            <h2 className="benefits-title">Entrena con nosotros</h2>
            <p className="benefits-description">
              Únete a nuestra comunidad y descubre todos los beneficios
              que tenemos para ofrecerte
            </p>
            <div className="benefits-list">
              {benefits.map((benefit, index) => (
                <div key={index} className="benefit-item">
                  <FaCheckCircle className="benefit-icon" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
            <Link to="/register" className="benefits-button">
              Comenzar mi transformación
            </Link>
          </div>
          <div className="benefits-image">
            {/* Aquí puedes poner una imagen real si tienes una */}
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="activities-section">
        <div className="section-header">
          <h2 className="section-title">Actividades Destacadas</h2>
          <p className="section-subtitle">
            Encuentra la actividad perfecta para ti
          </p>
        </div>
        
        {loading ? (
          <div className="activities-loading">
            <div className="loading-spinner"></div>
            <p>Cargando actividades...</p>
          </div>
        ) : error ? (
          <div className="activities-error">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="activities-preview">
              {activities.length > 0 ? (
                <div className="activities-grid-preview">
                  {activities.map((activity) => (
                    <div key={activity.id} className="activity-preview-card">
                      <div className="activity-preview-image">
                        {activity.image_url ? (
                          <img src={activity.image_url} alt={activity.title} />
                        ) : (
                          <div className="preview-placeholder">
                            <FaDumbbell className="preview-icon" />
                          </div>
                        )}
                        {activity.category && (
                          <div className="preview-category">{activity.category}</div>
                        )}
                      </div>
                      
                      <div className="activity-preview-content">
                        <h3 className="preview-title">{activity.title}</h3>
                        
                        <div className="preview-details">
                          {activity.instructor && (
                            <div className="preview-detail">
                              <FaUser className="preview-detail-icon" />
                              <span>{activity.instructor}</span>
                            </div>
                          )}
                          
                          {activity.day && (
                            <div className="preview-detail">
                              <FaCalendarAlt className="preview-detail-icon" />
                              <span>{activity.day}</span>
                            </div>
                          )}
                          
                          {activity.time && (
                            <div className="preview-detail">
                              <FaClock className="preview-detail-icon" />
                              <span>{activity.time}</span>
                            </div>
                          )}
                        </div>
                        
                        <Link 
                          to={`/activities/${activity.id}`} 
                          className="preview-button"
                        >
                          Ver Detalles
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-activities-preview">
                  <FaDumbbell className="no-activities-icon" />
                  <p>No hay actividades disponibles en este momento</p>
                </div>
              )}
            </div>
          </>
        )}

        <div className="view-all-container">
          <Link to="/activities" className="view-all-button">
            Ver todas las actividades <FaArrowRight />
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-pattern"></div>
          <div className="cta-content">
            <h2 className="cta-title">¿Listo para el cambio?</h2>
            <p className="cta-description">
              Comienza hoy tu viaje hacia una vida más saludable y activa
            </p>
            <div className="cta-buttons">
              <Link to="/register" className="cta-button primary">
                Inscribirme Ahora
              </Link>
              <Link to="/activities" className="cta-button secondary">
                Ver Actividades
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;