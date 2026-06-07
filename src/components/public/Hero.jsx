import React from 'react';
import checklistIcon from '../../assets/checklist.png';
import shieldIcon from '../../assets/shield.png';
import whatsappIcon from '../../assets/whatsapp (1).png';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>The #1 Vendor Marketplace</h1>
        <p className="hero-subtitle">Connect with verified vendors • Shop safely • Buy smarter</p>
        <div className="trust-indicators">
          <div className="trust-item">
            <span className="check-icon">
              <img src={checklistIcon} alt="Verified" />
            </span>
            <span>50+ Active Listings</span>
          </div>
          <div className="trust-item">
            <span className="shield-icon">
              <img src={shieldIcon} alt="Security" />
            </span>
            <span>100% Verified Vendors</span>
          </div>
          <div className="trust-item">
            <span className="chat-icon">
              <img src={whatsappIcon} alt="Chat" />
            </span>
            <span>Direct WhatsApp Chat</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
