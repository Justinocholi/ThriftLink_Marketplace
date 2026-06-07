import React from 'react';
import checklistIcon from '../../assets/checklist.png';
import starIcon from '../../assets/star.png';
import packageIcon from '../../assets/package.png';
import whatsappIcon from '../../assets/whatsapp (1).png';

const FeaturedVendors = () => {
  const vendors = [
    {
      initials: 'JF',
      name: "Jane's Fashion Hub",
      rating: '4.9 (324 reviews)',
      orders: '2,450 orders',
      category: 'Fashion & Beauty',
    },
    {
      initials: 'TE',
      name: 'TechWorld Lagos',
      rating: '4.8 (189 reviews)',
      orders: '1,890 orders',
      category: 'Electronics',
    },
    {
      initials: 'FD',
      name: 'FoodieDelight NG',
      rating: '4.9 (567 reviews)',
      orders: '3,200 orders',
      category: 'Food & Drinks',
    },
    {
      initials: 'HL',
      name: 'Home Essentials',
      rating: '4.7 (412 reviews)',
      orders: '1,560 orders',
      category: 'Home & Living',
    },
    {
      initials: 'SS',
      name: 'SmartFix Services',
      rating: '4.8 (298 reviews)',
      orders: '890 orders',
      category: 'Services',
    },
    {
      initials: 'BW',
      name: 'Beauty World',
      rating: '4.9 (445 reviews)',
      orders: '2,100 orders',
      category: 'Beauty & Health',
    },
  ];

  const handleWhatsAppClick = (e, vendorName) => {
    e.preventDefault();
    // Simulate WhatsApp opening
    const whatsappMessage = `Hi! I found your business "${vendorName}" on Thrift Link. I'm interested in your products.`;
    const whatsappUrl = `https://wa.me/2348123456789?text=${encodeURIComponent(whatsappMessage)}`;
    
    if (window.confirm(`Open WhatsApp to chat with ${vendorName}?`)) {
        // window.open(whatsappUrl, '_blank');
        alert('Opening WhatsApp...');
    }
  };

  return (
    <section className="featured-vendors" id="vendors">
      <div className="section-container">
        <h2 className="section-title">Top Verified Vendors This Week</h2>
        <div className="vendors-grid">
          {vendors.map((vendor, index) => (
            <div className="vendor-card" key={index}>
              <div className="vendor-header">
                <div className="vendor-avatar">{vendor.initials}</div>
                <div className="vendor-info">
                  <h3>{vendor.name}</h3>
                  <span className="verification-badge">
                    <img src={checklistIcon} alt="Verified" className="icon-sm" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>
              <div className="vendor-stats">
                <span className="rating">
                  <img src={starIcon} alt="Rating" className="icon-sm" />
                  <span>{vendor.rating}</span>
                </span>
                <span className="orders-count">
                  <img src={packageIcon} alt="Orders" className="icon-sm" />
                  <span>{vendor.orders}</span>
                </span>
              </div>
              <div className="category-tag">{vendor.category}</div>
              <a href="#" className="btn btn-whatsapp" onClick={(e) => handleWhatsAppClick(e, vendor.name)}>
                <img src={whatsappIcon} alt="Chat" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                Chat on WhatsApp
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedVendors;
