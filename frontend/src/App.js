// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Componentes comunes
import Navbar from './components/Common/Navbar';
import Footer from './components/Common/Footer';

// Páginas públicas
import Home from './pages/Home/Home';
import Activities from './pages/Activities/Activities'; // Nueva página de actividades
import ActivityDetailsPage from './pages/Activities/ActivityDetailsPage';
import ContactPage from './pages/Contact/ContactPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';

// Páginas de usuario autenticado
import MyActivitiesPage from './pages/Activities/MyActivitiesPage';

// Páginas de administrador
import AdminActivitiesPage from './pages/Admin/AdminActivitiesPage';
import CreateActivityPage from './pages/Admin/CreateActivityPage';
import EditActivityPage from './pages/Admin/EditActivityPage';
import AdminMessagesPage from './pages/Admin/AdminMessagesPage';

import './App.css';

// Ruta protegida para usuarios autenticados
const PrivateRoute = ({ children }) => {
  const { user, loading, tokenChecked, verifyToken } = useAuth();
  
  // Efecto para verificar la validez del token si el usuario está autenticado
  React.useEffect(() => {
    const checkToken = async () => {
      if (user && tokenChecked) {
        await verifyToken();
      }
    };
    
    checkToken();
  }, [user, tokenChecked, verifyToken]);
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Ruta protegida solo para administradores
const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin, tokenChecked, verifyToken } = useAuth();
  
  // Efecto para verificar la validez del token si el usuario está autenticado
  React.useEffect(() => {
    const checkToken = async () => {
      if (user && tokenChecked) {
        await verifyToken();
      }
    };
    
    checkToken();
  }, [user, tokenChecked, verifyToken]);
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }
  
  return user && isAdmin() ? children : <Navigate to="/" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<Home />} />
              <Route path="/activities" element={<Activities />} /> {/* Nueva ruta agregada */}
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/activities/:id" element={<ActivityDetailsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Rutas para recuperación de contraseña */}
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              
              {/* Rutas para usuarios autenticados */}
              <Route 
                path="/my-activities" 
                element={
                  <PrivateRoute>
                    <MyActivitiesPage />
                  </PrivateRoute>
                } 
              />
              
              {/* Rutas para administradores */}
              <Route 
                path="/admin/activities" 
                element={
                  <AdminRoute>
                    <AdminActivitiesPage />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/admin/activities/create" 
                element={
                  <AdminRoute>
                    <CreateActivityPage />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/admin/activities/edit/:id" 
                element={
                  <AdminRoute>
                    <EditActivityPage />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/admin/messages" 
                element={
                  <AdminRoute>
                    <AdminMessagesPage />
                  </AdminRoute>
                } 
              />
              
              {/* Ruta para manejar URLs no encontradas */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

// Añadir estilos para el spinner
const styleElement = document.createElement('style');
styleElement.textContent = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-screen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.9);
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border-left-color: #1a73e8;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}
`;
document.head.appendChild(styleElement);

export default App;