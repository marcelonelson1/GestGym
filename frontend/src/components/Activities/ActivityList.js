// src/components/Activities/ActivityList.js
import React, { useState, useEffect } from 'react';
import ActivityCard from './ActivityCard';
import SearchBar from '../Common/SearchBar';
import Loading from '../Common/Loading';
import config from '../../config';
import './ActivityList.css';

const ActivityList = ({ activities, loading, error, onSearch, onFilter }) => {
  const [selectedCategory, setSelectedCategory] = useState('');

  // Manejar cambio de categoría
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (onFilter) {
      onFilter(category);
    }
  };

  // Manejar búsqueda
  const handleSearch = (searchTerm) => {
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  // Renderizar mensaje de error
  if (error) {
    return (
      <div className="activity-list-error">
        <p>Error al cargar las actividades: {error}</p>
      </div>
    );
  }

  return (
    <div className="activity-list-container">
      <div className="activity-list-header">
        <h2 className="activity-list-title">Nuestras Actividades</h2>
        <p className="activity-list-subtitle">
          Explora todas nuestras actividades deportivas disponibles y encuentra la ideal para ti
        </p>
      </div>

      <div className="activity-list-filters">
        <SearchBar onSearch={handleSearch} placeholder="Buscar actividades..." />
        
        <div className="category-filters">
          <button 
            className={`category-filter ${selectedCategory === '' ? 'active' : ''}`}
            onClick={() => handleCategoryChange('')}
          >
            Todos
          </button>
          
          {config.CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={`category-filter ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryChange(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : activities.length === 0 ? (
        <div className="no-activities">
          <p>No se encontraron actividades con los criterios de búsqueda.</p>
        </div>
      ) : (
        <div className="activity-grid">
          {activities.map((activity) => (
            <div key={activity.id} className="activity-grid-item">
              <ActivityCard activity={activity} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityList;