// src/components/Common/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaDumbbell, FaBars, FaTimes, FaEnvelope, FaChevronDown } from 'react-icons/fa';
import './Navbar.css';
import config from '../../config';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Detectar scroll para cambiar estilo del navbar
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMenuOpen(false);
    setAdminDropdownOpen(false);
    setDropdownOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''} ${menuOpen ? 'menu-open' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <FaDumbbell className="logo-icon" />
          <span className="logo-text">{config.APP_NAME || 'FitnessApp'}</span>
        </Link>

        {/* Hamburger menu for mobile */}
        <div className="menu-icon" onClick={toggleMenu}>
          {menuOpen ? <FaTimes /> : <FaBars />}
        </div>

        {/* Navigation links */}
        <ul className={`nav-menu ${menuOpen ? 'active' : ''}`}>
          <li className="nav-item">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Inicio
            </Link>
          </li>
          
          <li className="nav-item">
            <Link to="/activities" className={`nav-link ${isActive('/activities') ? 'active' : ''}`}>
              Actividades
            </Link>
          </li>
          
          <li className="nav-item">
            <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`}>
              <FaEnvelope className="nav-icon" />
              Contacto
            </Link>
          </li>
          
          {user ? (
            // Menú para usuarios autenticados
            <>
              <li className="nav-item">
                <Link to="/my-activities" className={`nav-link ${isActive('/my-activities') ? 'active' : ''}`}>
                  Mis Actividades
                </Link>
              </li>
              
              {isAdmin() && (
                <li className="nav-item dropdown admin-dropdown">
                  <div 
                    className="nav-link dropdown-toggle"
                    onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                  >
                    Panel Admin
                    <FaChevronDown className={`dropdown-arrow ${adminDropdownOpen ? 'open' : ''}`} />
                  </div>
                  <ul className={`dropdown-menu ${adminDropdownOpen ? 'show' : ''}`}>
                    <li>
                      <Link to="/admin/activities" className="dropdown-item">
                        Gestionar Actividades
                      </Link>
                    </li>
                    <li>
                      <Link to="/admin/activities/create" className="dropdown-item">
                        Crear Actividad
                      </Link>
                    </li>
                    <li>
                      <Link to="/admin/messages" className="dropdown-item">
                        <FaEnvelope className="dropdown-icon" />
                        Mensajes
                      </Link>
                    </li>
                  </ul>
                </li>
              )}
              
              {/* Dropdown para el perfil */}
              <li className="nav-item dropdown user-dropdown">
                <div 
                  className="nav-link dropdown-toggle"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <div className="user-avatar">
                    {user.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt="Profile" 
                        className="profile-image"
                      />
                    ) : (
                      <FaUser className="avatar-icon" />
                    )}
                  </div>
                  <span className="user-name">{user.nombre || user.name}</span>
                  <FaChevronDown className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`} />
                </div>
                <ul className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`}>
                  <li>
                    <Link to="/profile" className="dropdown-item">
                      Mi Perfil
                    </Link>
                  </li>
                  <li>
                    <Link to="/settings" className="dropdown-item">
                      Configuración
                    </Link>
                  </li>
                  <li className="dropdown-divider"></li>
                  <li>
                    <button onClick={handleLogout} className="dropdown-item">
                      Cerrar Sesión
                    </button>
                  </li>
                </ul>
              </li>
            </>
          ) : (
            // Menú para usuarios no autenticados
            <>
              <li className="nav-item">
                <Link to="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`}>
                  Iniciar Sesión
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className={`nav-link nav-button ${isActive('/register') ? 'active' : ''}`}>
                  Registrarse
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;