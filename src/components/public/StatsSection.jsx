import React from 'react';

const StatsSection = () => {
  return (
    <section className="stats-section">
      <div className="section-container">
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">50+</span>
            <span className="stat-label">Verified Vendors</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">2,000+</span>
            <span className="stat-label">Products Listed</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">250+</span>
            <span className="stat-label">Happy Customers</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">36+</span>
            <span className="stat-label">States Covered</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
