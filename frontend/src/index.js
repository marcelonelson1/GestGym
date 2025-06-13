// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Asegúrate de que el elemento con id 'root' exista en tu HTML
const container = document.getElementById('root');

// Verifica que el contenedor existe antes de renderizar
if (container) {
  const root = createRoot(container);
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("No se encontró el elemento con id 'root' en el HTML");
}