import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assests/images/logo.jpeg';
import './home.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

import SearchSuggestions from '../search';

const Home = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/searchall?query=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="home-container">
      <img src={logo} alt="Logo" className="logo" />
      <div className="search-bar">
        <div className="search-input-container">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Generative Any Search"
            className="search-input"
          />
          <button className="search-icon-button" onClick={handleSearch}>
            <FontAwesomeIcon icon={faSearch} />
          </button>
        </div>
        <div className="button-container">
          <button onClick={handleSearch} className="search-button">
            Search
          </button>
          <button onClick={handleSearch} className="search-button">
            Search All
          </button>
        </div>
        <div className="suggestions-wrapper">
          <SearchSuggestions />
        </div>
      </div>
    </div>
  );
};

export default Home;
