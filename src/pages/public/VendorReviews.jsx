import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import starIcon from '../../assets/star.png';

const ReviewCard = ({ vendor, user, rating, date, comment }) => (
  <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
      <div>
        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937' }}>{vendor}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
          {[...Array(5)].map((_, i) => (
            <img key={i} src={starIcon} alt="star" style={{ width: '14px', height: '14px', opacity: i < rating ? 1 : 0.3 }} />
          ))}
          <span style={{ fontSize: '0.9rem', color: '#6b7280', marginLeft: '0.5rem' }}>{rating}.0</span>
        </div>
      </div>
      <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{date}</span>
    </div>
    <p style={{ color: '#4b5563', lineHeight: '1.6', marginBottom: '1rem' }}>"{comment}"</p>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '600' }}>
        {user.charAt(0)}
      </div>
      <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>by {user}</span>
    </div>
  </div>
);

const VendorReviews = () => {
  // Mock data
  const reviews = [
    { id: 1, vendor: "Gadget Hub NG", user: "John Doe", rating: 5, date: "2 days ago", comment: "Excellent service! The phone was exactly as described and delivery was super fast." },
    { id: 2, vendor: "Luxe Fashion", user: "Sarah Smith", rating: 4, date: "1 week ago", comment: "Great quality dress, but delivery took a bit longer than expected." },
    { id: 3, vendor: "Tech Solutions", user: "Mike Johnson", rating: 5, date: "2 weeks ago", comment: "Fixed my laptop screen in under an hour. Highly recommended!" },
    { id: 4, vendor: "Home Decor Co", user: "Emily White", rating: 5, date: "3 weeks ago", comment: "Beautiful items for my new apartment. Will definitely shop here again." },
    { id: 5, vendor: "Gadget Hub NG", user: "Alex Brown", rating: 4, date: "1 month ago", comment: "Good product, but communication could be improved." },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <Navbar />
      
      <div style={{ padding: '8rem 2rem 4rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', color: '#1f2937' }}>Vendor Reviews</h1>
        <p style={{ color: '#6b7280', maxWidth: '600px', margin: '0 auto', fontSize: '1.2rem' }}>
          See what other buyers are saying about our trusted vendors.
        </p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem 4rem' }}>
        {/* Review Filters (Mock) */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '1rem' }}>
          <button style={{ padding: '0.6rem 1.2rem', background: '#3b82f6', color: 'white', borderRadius: '20px', border: 'none', fontWeight: '600', whiteSpace: 'nowrap' }}>All Reviews</button>
          <button style={{ padding: '0.6rem 1.2rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', color: '#4b5563', fontWeight: '600', whiteSpace: 'nowrap' }}>5 Stars</button>
          <button style={{ padding: '0.6rem 1.2rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', color: '#4b5563', fontWeight: '600', whiteSpace: 'nowrap' }}>Latest</button>
        </div>

        <div className="reviews-list">
          {reviews.map(review => (
            <ReviewCard key={review.id} {...review} />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default VendorReviews;
