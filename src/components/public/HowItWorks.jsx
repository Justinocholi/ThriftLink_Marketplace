import React from 'react';
import magnifierIcon from '../../assets/magnifier.png';
import whatsappIcon from '../../assets/whatsapp.png';
import shieldIcon from '../../assets/shield.png';

const HowItWorks = () => {
  return (
    <section className="how-it-works" id="how-it-works">
      <div className="section-container">
        <h2 className="section-title">How Thrift Link Works</h2>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon">
              <img src={magnifierIcon} alt="Search" style={{ width: '40px', height: '40px' }} />
            </div>
            <h3 className="step-title">Search & Discover</h3>
            <p className="step-description">Browse thousands of verified WhatsApp vendors by category or search for specific products and services.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon">
              <img src={whatsappIcon} alt="Message" style={{ width: '40px', height: '40px' }} />
            </div>
            <h3 className="step-title">Connect Instantly</h3>
            <p className="step-description">Click to chat directly with vendors on WhatsApp. No middleman, just instant communication.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon">
              <img src={shieldIcon} alt="Shield" style={{ width: '40px', height: '40px' }} />
            </div>
            <h3 className="step-title">Shop Safely</h3>
            <p className="step-description">All vendors are verified and rated by real customers. Shop with confidence and security.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
