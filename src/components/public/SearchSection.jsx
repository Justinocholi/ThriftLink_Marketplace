import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import magnifierIcon from '../../assets/magnifier.png';
import smartphoneIcon from '../../assets/smartphone.png';
import womanIcon from '../../assets/woman.png';
import fastFoodIcon from '../../assets/fast-food.png';
import mansionIcon from '../../assets/mansion.png';
import beautyIcon from '../../assets/beauty-product.png';
import serviceIcon from '../../assets/customer-service.png';

const SearchSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    navigate(`/verified-vendors?search=${encodeURIComponent(searchTerm)}&location=${encodeURIComponent(location)}`);
  };

  return (
    <section className="search-section">
      <div className="search-container">
        <h2 className="search-title">Find Trusted WhatsApp Vendors Near You</h2>
        <div className="main-search">
          <input 
            type="text" 
            className="search-input" 
            id="searchInput" 
            placeholder="What are you looking for? (e.g. iPhone, fashion, food)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="location-input" 
            id="locationSelect" 
            style={{ background: '#f9fafb', cursor: 'pointer' }}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">All Nigeria</option>
            <option value="Abia">Abia</option>
            <option value="Adamawa">Adamawa</option>
            <option value="Akwa Ibom">Akwa Ibom</option>
            <option value="Anambra">Anambra</option>
            <option value="Bauchi">Bauchi</option>
            <option value="Bayelsa">Bayelsa</option>
            <option value="Benue">Benue</option>
            <option value="Borno">Borno</option>
            <option value="Cross River">Cross River</option>
            <option value="Delta">Delta</option>
            <option value="Ebonyi">Ebonyi</option>
            <option value="Edo">Edo</option>
            <option value="Ekiti">Ekiti</option>
            <option value="Enugu">Enugu</option>
            <option value="FCT">FCT - Abuja</option>
            <option value="Gombe">Gombe</option>
            <option value="Imo">Imo</option>
            <option value="Jigawa">Jigawa</option>
            <option value="Kaduna">Kaduna</option>
            <option value="Kano">Kano</option>
            <option value="Katsina">Katsina</option>
            <option value="Kebbi">Kebbi</option>
            <option value="Kogi">Kogi</option>
            <option value="Kwara">Kwara</option>
            <option value="Lagos">Lagos</option>
            <option value="Nasarawa">Nasarawa</option>
            <option value="Niger">Niger</option>
            <option value="Ogun">Ogun</option>
            <option value="Ondo">Ondo</option>
            <option value="Osun">Osun</option>
            <option value="Oyo">Oyo</option>
            <option value="Plateau">Plateau</option>
            <option value="Rivers">Rivers</option>
            <option value="Sokoto">Sokoto</option>
            <option value="Taraba">Taraba</option>
            <option value="Yobe">Yobe</option>
            <option value="Zamfara">Zamfara</option>
          </select>
          <button className="search-btn" onClick={handleSearch}>
            <img src={magnifierIcon} alt="Search" className="icon-sm" />
            <span>Search</span>
          </button>
        </div>
        <div className="quick-filters">
          <Link to="/verified-vendors?category=Electronics" className="filter-chip">
            <img src={smartphoneIcon} alt="Electronics" className="icon-sm" />
            <span>Electronics</span>
          </Link>
          <Link to="/verified-vendors?category=Fashion" className="filter-chip">
            <img src={womanIcon} alt="Fashion" className="icon-sm" />
            <span>Fashion</span>
          </Link>
          <Link to="/verified-vendors?category=Food" className="filter-chip">
            <img src={fastFoodIcon} alt="Food" className="icon-sm" />
            <span>Food</span>
          </Link>
          <Link to="/verified-vendors?category=Home%20%26%20Living" className="filter-chip">
            <img src={mansionIcon} alt="Home & Living" className="icon-sm" />
            <span>Home &amp; Living</span>
          </Link>
          <Link to="/verified-vendors?category=Beauty" className="filter-chip">
            <img src={beautyIcon} alt="Beauty" className="icon-sm" />
            <span>Beauty</span>
          </Link>
          <Link to="/verified-vendors?category=Services" className="filter-chip">
            <img src={serviceIcon} alt="Services" className="icon-sm" />
            <span>Services</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SearchSection;
