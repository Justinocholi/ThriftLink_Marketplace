import React from 'react';
import { Link } from 'react-router-dom';
import smartphoneIcon from '../../assets/smartphone.png';
import womanIcon from '../../assets/woman.png';
import fastFoodIcon from '../../assets/fast-food.png';
import mansionIcon from '../../assets/mansion.png';
import serviceIcon from '../../assets/customer-service.png';
import briefcaseIcon from '../../assets/briefcase.png';

const Categories = () => {
  return (
    <section className="categories" id="categories">
      <div className="section-container">
        <h2 className="section-title">Browse by Category</h2>
        <div className="categories-grid">
          <Link to="/verified-vendors?category=Electronics" className="category-card">
            <span className="category-icon">
              <img src={smartphoneIcon} alt="Electronics" className="icon-sm" />
            </span>
            <div className="category-name">Electronics</div>
            <div className="category-count">5 vendors</div>
          </Link>
          <Link to="/verified-vendors?category=Fashion" className="category-card">
            <span className="category-icon">
              <img src={womanIcon} alt="fashion" className="icon-sm" />
            </span>
            <div className="category-name">Fashion & Beauty</div>
            <div className="category-count">25 Vendors</div>
          </Link>
          <Link to="/verified-vendors?category=Food" className="category-card">
            <span className="category-icon">
              <img src={fastFoodIcon} alt="food" className="icon-sm" />
            </span>
            <div className="category-name">Food & Drinks</div>
            <div className="category-count">10 Vendors</div>
          </Link>
          <Link to="/verified-vendors?category=Home%20%26%20Living" className="category-card">
            <span className="category-icon">
              <img src={mansionIcon} alt="home" className="icon-sm" />
            </span>
            <div className="category-name">Home & Living</div>
            <div className="category-count">12 Vendors</div>
          </Link>
          <Link to="/verified-vendors?category=Services" className="category-card">
            <span className="category-icon">
              <img src={serviceIcon} alt="service" className="icon-sm" />
            </span>
            <div className="category-name">Services</div>
            <div className="category-count">6 vendors</div>
          </Link>
          <Link to="/verified-vendors?category=Business" className="category-card">
            <span className="category-icon">
              <img src={briefcaseIcon} alt="business" className="icon-sm" />
            </span>
            <div className="category-name">Business</div>
            <div className="category-count">8 vendors</div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Categories;
