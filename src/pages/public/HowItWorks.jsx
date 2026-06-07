import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

// Import Assets
import magnifierIcon from '../../assets/magnifier.png';
import visibilityIcon from '../../assets/visibility.png';
import whatsappIcon from '../../assets/whatsapp (1).png';
import shoppingCartIcon from '../../assets/shopping-cart.png';
import starIcon from '../../assets/star.png';
import shieldIcon from '../../assets/shield.png';
import lightIcon from '../../assets/light.png';
import checklistIcon from '../../assets/checklist.png';

const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState('buyers');
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // Scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, [activeTab]); // Re-run when tab changes to animate new content

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', color: '#333', minHeight: '100vh' }}>
      <style>
        {`
          @media (max-width: 768px) {
            .page-header h1 { font-size: 2rem !important; }
            .overview-section { padding: 2rem !important; }
            .steps-container { grid-template-columns: 1fr !important; }
            .user-types-tabs { flex-direction: column; max-width: 200px; }
            .safety-tips { grid-template-columns: 1fr !important; }
            .cta-buttons { flex-direction: column; align-items: center; }
            .nav-links { display: none; }
          }
          .faq-icon.rotated { transform: rotate(180deg); }
          .step-card:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1) !important; }
          .feature-item:hover { transform: translateY(-2px); }
        `}
      </style>
      <Navbar />

      {/* Page Header */}
      <section className="page-header" style={{
        background: 'linear-gradient(135deg, #25D366, #128C7E)',
        color: 'white',
        padding: '8rem 2rem 4rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>How Thrift Link Works</h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '700px', margin: '0 auto' }}>
          Your complete guide to buying and selling on Nigeria's most trusted WhatsApp vendor marketplace. Simple, secure, and reliable.
        </p>
      </section>

      {/* Main Content */}
      <div className="main-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        
        {/* Overview Section */}
        <section className="overview-section" style={{
          background: 'white',
          borderRadius: '12px',
          padding: '3rem',
          margin: '-2rem 0 3rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          zIndex: 10
        }}>
          <div className="overview-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            alignItems: 'center'
          }}>
            <div className="overview-text">
              <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>Why Choose Thrift Link?</h2>
              <p style={{ color: '#6b7280', fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '1.5rem' }}>
                We connect you directly with verified WhatsApp vendors across Nigeria. No complicated registration, no payment hassles, no middleman fees. Just instant connection with trusted sellers in your area.
              </p>
              <a href="/signin" className="btn btn-primary" style={{
                background: '#25D366',
                color: 'white',
                padding: '0.7rem 1.5rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'background 0.3s ease'
              }}>Get Started Now</a>
            </div>
            <div className="overview-features" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="feature-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                <div className="feature-icon" style={{
                  width: '50px',
                  height: '50px',
                  background: '#25D366',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <img src={whatsappIcon} alt="Message" style={{ width: '30px', height: '30px', filter: 'brightness(0) invert(1)' }} />
                </div>
                <div className="feature-text">
                  <h4 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.3rem', margin: 0 }}>Direct Communication</h4>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>Chat instantly with vendors on WhatsApp - no app downloads required</p>
                </div>
              </div>
              <div className="feature-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                <div className="feature-icon" style={{
                  width: '50px',
                  height: '50px',
                  background: '#25D366',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <img src={shieldIcon} alt="Shield" style={{ width: '30px', height: '30px', filter: 'brightness(0) invert(1)' }} />
                </div>
                <div className="feature-text">
                  <h4 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.3rem', margin: 0 }}>Verified Sellers</h4>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>All vendors go through our strict verification process for your safety</p>
                </div>
              </div>
              <div className="feature-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                <div className="feature-icon" style={{
                  width: '50px',
                  height: '50px',
                  background: '#25D366',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <img src={lightIcon} alt="Light" style={{ width: '30px', height: '30px', filter: 'brightness(0) invert(1)' }} />
                </div>
                <div className="feature-text">
                  <h4 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.3rem', margin: 0 }}>Fast & Free</h4>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>Browse, connect, and buy - all completely free with no hidden fees</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section className="steps-section" style={{ padding: '4rem 0' }}>
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="section-title" style={{ fontSize: '2.2rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>How to Buy on Thrift Link</h2>
            <p className="section-subtitle" style={{ fontSize: '1.1rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>Follow these simple steps to connect with verified vendors and shop safely</p>
          </div>
          
          <div className="steps-container" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            {[
              { num: 1, icon: magnifierIcon, title: 'Search & Discover', desc: 'Browse categories or search for specific products. Filter by location, rating, and vendor type to find exactly what you need.', action: 'Start Browsing', link: '/categories' },
              { num: 2, icon: visibilityIcon, title: 'View Vendor Profile', desc: 'Check vendor ratings, reviews, and specialties. See their verification status and response time to make informed decisions.', action: 'See Example Profile', link: '/verified-vendors' },
              { num: 3, icon: whatsappIcon, title: 'Chat on WhatsApp', desc: 'Click "Chat on WhatsApp" to instantly connect. Discuss products, prices, and delivery directly with the vendor.', action: 'Try Demo Chat', link: '#' },
              { num: 4, icon: shoppingCartIcon, title: 'Complete Your Purchase', desc: 'Agree on terms, make payment (bank transfer, cash on delivery), and arrange delivery or pickup with the vendor.', action: 'Safety Tips', link: '#safety' },
              { num: 5, icon: starIcon, title: 'Rate & Review', desc: 'Share your experience to help other buyers. Your honest feedback keeps our marketplace trustworthy.', action: 'Leave Review', link: '#' }
            ].map((step, idx) => (
              <div key={idx} className="step-card animate-on-scroll" style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2.5rem',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                position: 'relative',
                border: '1px solid #e5e7eb',
                transition: 'all 0.3s ease'
              }}>
                <div className="step-number" style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#25D366',
                  color: 'white',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
                }}>{step.num}</div>
                <div className="step-icon" style={{ fontSize: '3rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                  <img src={step.icon} alt={step.title} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                </div>
                <h3 className="step-title" style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1rem', color: '#1f2937' }}>{step.title}</h3>
                <p className="step-description" style={{ color: '#6b7280', lineHeight: '1.6', fontSize: '1rem', marginBottom: '1.5rem' }}>{step.desc}</p>
                <a href={step.link} className="step-action" style={{
                  background: '#f3f4f6',
                  color: '#25D366',
                  padding: '0.7rem 1.5rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  display: 'inline-block'
                }}>{step.action}</a>
              </div>
            ))}
          </div>
        </section>

        {/* User Types Section */}
        <section className="user-types-section" style={{
          background: 'white',
          borderRadius: '12px',
          padding: '3rem',
          margin: '3rem 0'
        }}>
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="section-title" style={{ fontSize: '2.2rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>Detailed Guides</h2>
            <p className="section-subtitle" style={{ fontSize: '1.1rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>Choose your path - detailed step-by-step guides for buyers and sellers</p>
          </div>
          
          <div className="user-types-tabs" style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '3rem',
            background: '#f3f4f6',
            borderRadius: '8px',
            padding: '0.5rem',
            maxWidth: '400px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            <button 
              className={`tab-btn ${activeTab === 'buyers' ? 'active' : ''}`}
              onClick={() => setActiveTab('buyers')}
              style={{
                flex: 1,
                padding: '1rem 2rem',
                border: 'none',
                background: activeTab === 'buyers' ? '#25D366' : 'transparent',
                color: activeTab === 'buyers' ? 'white' : '#333',
                cursor: 'pointer',
                fontWeight: '600',
                borderRadius: '6px',
                transition: 'all 0.3s ease'
              }}
            >For Buyers</button>
            <button 
              className={`tab-btn ${activeTab === 'sellers' ? 'active' : ''}`}
              onClick={() => setActiveTab('sellers')}
              style={{
                flex: 1,
                padding: '1rem 2rem',
                border: 'none',
                background: activeTab === 'sellers' ? '#25D366' : 'transparent',
                color: activeTab === 'sellers' ? 'white' : '#333',
                cursor: 'pointer',
                fontWeight: '600',
                borderRadius: '6px',
                transition: 'all 0.3s ease'
              }}
            >For Sellers</button>
          </div>
          
          <div className="tab-content animate-on-scroll">
            <div className="user-guide-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem'
            }}>
              {activeTab === 'buyers' ? (
                <>
                  <GuideCard title="Finding Vendors" items={['Use category filters to narrow results', 'Set location preferences for nearby vendors', 'Check vendor ratings and reviews', 'Look for verification badges', 'Compare multiple vendors before choosing']} />
                  <GuideCard title="Safe Communication" items={['Always chat through WhatsApp first', 'Ask for product photos and details', 'Confirm pricing and delivery terms', 'Keep conversation records', 'Report suspicious behavior immediately']} />
                  <GuideCard title="Making Purchases" items={['Agree on payment method upfront', 'Use secure payment options', 'Arrange delivery or pickup location', 'Inspect items before final payment', 'Keep receipts and transaction records']} />
                  <GuideCard title="After Purchase" items={['Test products immediately upon receipt', 'Contact vendor if issues arise', 'Leave honest reviews and ratings', 'Save vendor contact for future purchases', 'Report problems to Thrift Link support']} />
                </>
              ) : (
                <>
                  <GuideCard title="Getting Verified" items={['Submit business registration documents', 'Provide valid ID and contact information', 'Complete phone verification process', 'Upload clear product photos', 'Wait 24-48 hours for approval']} />
                  <GuideCard title="Creating Your Profile" items={['Write detailed business description', 'List your product categories', 'Set your location and delivery areas', 'Upload professional photos', 'Add contact information and hours']} />
                  <GuideCard title="Managing Customers" items={['Respond to inquiries within 2 hours', 'Provide clear product information', 'Be transparent about pricing', 'Offer multiple payment options', 'Maintain professional communication']} />
                  <GuideCard title="Building Reputation" items={['Deliver products as promised', 'Provide excellent customer service', 'Encourage satisfied customers to review', 'Handle complaints professionally', 'Maintain consistent quality standards']} />
                </>
              )}
            </div>
          </div>
        </section>

        {/* Safety Section */}
        <section id="safety" className="safety-section" style={{
          background: 'linear-gradient(135deg, #1f2937, #374151)',
          color: 'white',
          borderRadius: '12px',
          padding: '3rem',
          margin: '3rem 0',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>Stay Safe on Thrift Link</h2>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '2rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
            Your security is our top priority. Follow these guidelines to shop and sell safely on our platform.
          </p>
          
          <div className="safety-tips" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            {[
              { icon: '🔒', title: 'Verify Before You Buy', text: 'Only deal with verified vendors. Check their badges, ratings, and reviews before making any purchase.' },
              { icon: '💳', title: 'Use Secure Payments', text: 'Prefer bank transfers or cash on delivery. Avoid unusual payment methods or upfront payments to strangers.' },
              { icon: '📍', title: 'Meet in Safe Places', text: 'For pickups, choose public, well-lit locations. For deliveries, verify the vendor\'s identity first.' },
              { icon: '📝', title: 'Keep Records', text: 'Save all chat conversations, receipts, and transaction details. This helps resolve any disputes.' }
            ].map((tip, idx) => (
              <div key={idx} className="safety-tip" style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '1.5rem',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                textAlign: 'left'
              }}>
                <h4 style={{ fontWeight: '600', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {tip.icon} {tip.title}
                </h4>
                <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>{tip.text}</p>
              </div>
            ))}
          </div>
          
          <a href="#" className="btn btn-white" style={{
            background: 'white',
            color: '#25D366',
            padding: '0.7rem 1.5rem',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            textDecoration: 'none',
            display: 'inline-block',
            transition: 'all 0.3s ease'
          }}>Read Full Safety Guide</a>
        </section>

        {/* FAQ Section */}
        <section className="faq-section" style={{
          background: 'white',
          borderRadius: '12px',
          padding: '3rem',
          margin: '3rem 0'
        }}>
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="section-title" style={{ fontSize: '2.2rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>Frequently Asked Questions</h2>
          </div>
          
          {[
            { q: 'How do I know if a vendor is trustworthy?', a: 'Look for the verified badge, check their ratings and reviews, see how long they\'ve been on the platform, and review their response time. Verified vendors have gone through our strict verification process including ID verification and business documentation.' },
            { q: 'Is it free to use Thrift Link?', a: 'Yes, browsing and connecting with vendors is completely free for buyers. Vendors pay a small fee only when they receive orders through the platform, helping us maintain quality and security.' },
            { q: 'What if I have a problem with my order?', a: 'First, try to resolve the issue directly with the vendor through WhatsApp. If that doesn\'t work, contact our support team with your order details and chat records. We\'ll help mediate and find a fair solution.' },
            { q: 'How long does vendor verification take?', a: 'Vendor verification typically takes 24-48 hours after submitting all required documents. This includes ID verification, business registration (if applicable), and phone number confirmation.' },
            { q: 'Can I sell without WhatsApp Business?', a: 'While regular WhatsApp works, we highly recommend WhatsApp Business for sellers. It provides better tools for managing customer communications, automated responses, and business profiles.' },
            { q: 'What payment methods are accepted?', a: 'Vendors typically accept bank transfers, mobile money, and cash on delivery. Payment is arranged directly between you and the vendor. We recommend using secure, traceable payment methods.' }
          ].map((item, idx) => (
            <div key={idx} className="faq-item" style={{
              borderBottom: idx === 5 ? 'none' : '1px solid #e5e7eb',
              padding: '1.5rem 0'
            }}>
              <div 
                className="faq-question" 
                onClick={() => toggleFaq(idx)}
                style={{
                  fontWeight: '600',
                  color: '#1f2937',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '1.1rem'
                }}
              >
                <span>{item.q}</span>
                <span className={`faq-icon ${activeFaq === idx ? 'rotated' : ''}`} style={{ transition: 'transform 0.3s ease' }}>▼</span>
              </div>
              <div className="faq-answer" style={{
                color: '#6b7280',
                marginTop: '1rem',
                lineHeight: '1.6',
                display: activeFaq === idx ? 'block' : 'none'
              }}>
                {item.a}
              </div>
            </div>
          ))}
        </section>

        {/* CTA Section */}
        <section className="cta-section" style={{
          background: '#25D366',
          color: 'white',
          borderRadius: '12px',
          padding: '3rem',
          textAlign: 'center',
          margin: '3rem 0'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>Ready to Get Started?</h2>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '2rem' }}>Join thousands of happy customers and trusted vendors on Nigeria's fastest-growing WhatsApp marketplace</p>
          <div className="cta-buttons" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/categories" className="btn btn-white" style={{
              background: 'white',
              color: '#25D366',
              padding: '0.7rem 1.5rem',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'transform 0.3s ease'
            }}>
              <img src={shoppingCartIcon} alt="Cart" style={{ width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle' }} />
              Start Shopping
            </a>
            <a href="/signin" className="btn btn-outline" style={{
              border: '1px solid white',
              color: 'white',
              background: 'transparent',
              padding: '0.7rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'background 0.3s ease'
            }}>
              <img src={checklistIcon} alt="Vendor" style={{ width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle', filter: 'brightness(0) invert(1)' }} />
              Become a Vendor
            </a>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

const GuideCard = ({ title, items }) => (
  <div className="guide-card animate-on-scroll" style={{
    padding: '2rem',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    background: '#f9fafb'
  }}>
    <h4 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>{title}</h4>
    <ul className="guide-steps" style={{ listStyle: 'none', padding: 0 }}>
      {items.map((item, idx) => (
        <li key={idx} style={{
          padding: '0.5rem 0',
          color: '#6b7280',
          borderBottom: idx === items.length - 1 ? 'none' : '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ color: '#25D366', fontWeight: 'bold', fontSize: '0.9rem' }}>✓</span> {item}
        </li>
      ))}
    </ul>
  </div>
);

export default HowItWorks;
