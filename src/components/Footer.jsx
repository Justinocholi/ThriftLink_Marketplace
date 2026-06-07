import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/thriftlink-logo-.png';
import shieldIcon from '../assets/shield.png';
import checklistIcon from '../assets/checklist.png';

const Footer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleVendorRegister = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
    } else if (user.role === 'vendor') {
      navigate('/vendor');
    } else {
      // Logic for user -> vendor upgrade could go here
      navigate('/vendor/guide');
    }
  };

  const handleGetVerified = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
    } else if (user.role === 'vendor') {
      navigate('/vendor/subscription');
    } else {
      navigate('/vendor/guide');
    }
  };

  return (
    <footer className="footer">
      <div className="section-container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="logo footer-logo">
              <img src={logo} alt="Thrift Link Logo" />
            </div>

            <p>The most trusted WhatsApp vendor marketplace. Connecting buyers with verified sellers since 2024.</p>
            <div className="trust-indicators">
              <div className="trust-item">
                <span className="icon">
                  <img src={shieldIcon} alt="Shield" className="icon-sm" />
                </span>
                <span>Secure Platform</span>
              </div>
              <div className="trust-item">
                <span className="icon">
                  <img src={checklistIcon} alt="Check" className="icon-sm" />
                </span>
                <span>Verified Vendors</span>
              </div>
            </div>
          </div>
          <div className="footer-section">
            <h4>For Buyers</h4>
            <div className="footer-links">
              <Link to="/vendors">Browse Vendors</Link>
              <Link to="/all-categories">Shop by Category</Link>
              <Link to="/buyer/safety">Safety Tips</Link>
              <Link to="/buyer/reviews">Vendor Reviews</Link>
            </div>
          </div>
          <div className="footer-section">
            <h4>For Vendors</h4>
            <div className="footer-links">
              <a href="#" onClick={handleVendorRegister}>Register as Vendor</a>
              <a href="#" onClick={handleGetVerified}>Get Verified</a>
              <Link to="/vendor/pricing">Pricing Plans</Link>
              <Link to="/vendor/guide">Vendor Guide</Link>
            </div>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <div className="footer-links">
              <Link to="/support/help">Help Center</Link>
              <Link to="/support/contact">Contact Us</Link>
              <Link to="/support/faq">FAQ</Link>
              <Link to="/support/report">Report Issues</Link>
            </div>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <div className="footer-links">
              <Link to="/legal/privacy">Privacy Policy</Link>
              <Link to="/legal/terms">Terms of Service</Link>
              <Link to="/legal/vendor-policy">Vendor Policy</Link>
              <Link to="/legal/cookies">Cookie Policy</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Thrift Link Nigeria. All rights reserved. | Made with ❤️ in Nigeria</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
