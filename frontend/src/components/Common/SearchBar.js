// src/components/Common/SearchBar.js
import React, { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import './SearchBar.css';

const SearchBar = ({ onSearch, placeholder, initialValue = '', delay = 500 }) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  
  // Usar debounce para reducir las llamadas de búsqueda mientras el usuario escribe
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(searchTerm);
      }
    }, delay);
    
    return () => clearTimeout(timer);
  }, [searchTerm, onSearch, delay]);
  
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };
  
  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-input-container">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={placeholder || 'Buscar...'}
          className="search-input"
        />
        <button type="submit" className="search-button">
          <FaSearch />
        </button>
      </div>
    </form>
  );
};

export default SearchBar;