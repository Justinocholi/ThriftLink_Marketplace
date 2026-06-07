import React from 'react';
import { Link } from 'react-router-dom';
import checklistIcon from '../../assets/checklist.png';
import educationIcon from '../../assets/education.png';

const CTASection = () => {
  return (
    <section className="cta-section">
      <div className="section-container">
        <div className="cta-content">
          <h2>Ready to Start Selling on WhatsApp?</h2>
          <p>Join thousands of successful vendors already using Thrift Link to grow their business</p>
          <div className="cta-buttons">
            <a href="#apply" className="btn btn-white btn-large">
              <img src={checklistIcon} alt="Rocket" className="icon-sm" style={{ marginRight: '8px' }} />
              Get Verified Now
            </a>
            <Link to="/how-it-works" className="btn btn-outline btn-large" style={{ borderColor: 'white', color: 'white' }}>
              <img src={educationIcon} alt="Book" className="icon-sm" style={{ marginRight: '8px' }} />
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
