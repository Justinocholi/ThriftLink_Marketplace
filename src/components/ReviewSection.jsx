import React, { useState } from 'react';
import { Star, User } from 'lucide-react';

const ReviewSection = ({ reviews: initialReviews, canReview = true, title = "Reviews" }) => {
  const [reviews, setReviews] = useState(initialReviews || []);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newReview.comment.trim()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const review = {
        id: Date.now(),
        user: "Current User", // In real app, get from auth context
        rating: newReview.rating,
        comment: newReview.comment,
        date: new Date().toLocaleDateString(),
        avatar: null
      };
      
      setReviews([review, ...reviews]);
      setNewReview({ rating: 5, comment: '' });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div style={{ marginTop: '3rem', borderTop: '1px solid #e5e7eb', paddingTop: '3rem' }}>
      <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '2rem' }}>
        {title} ({reviews.length})
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
        {/* Reviews List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {reviews.length === 0 ? (
            <p style={{ color: '#64748b', fontStyle: 'italic' }}>No reviews yet. Be the first to review!</p>
          ) : (
            reviews.map(review => (
              <div key={review.id} style={{ 
                background: '#f9fafb', 
                padding: '1.5rem', 
                borderRadius: '12px',
                border: '1px solid #f3f4f6'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '50%', 
                      background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {review.avatar ? (
                        <img src={review.avatar} alt={review.user} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={20} color="#94a3b8" />
                      )}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.95rem' }}>{review.user}</h4>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{review.date}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        fill={i < review.rating ? "#f59e0b" : "none"} 
                        color={i < review.rating ? "#f59e0b" : "#cbd5e1"} 
                      />
                    ))}
                  </div>
                </div>
                <p style={{ color: '#4b5563', lineHeight: '1.6', fontSize: '0.95rem' }}>{review.comment}</p>
              </div>
            ))
          )}
        </div>

        {/* Add Review Form */}
        {canReview && (
          <div>
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '16px', 
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <h4 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1f2937' }}>Write a Review</h4>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#4b5563' }}>Rating</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          transition: 'transform 0.1s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <Star 
                          size={24} 
                          fill={star <= newReview.rating ? "#f59e0b" : "none"} 
                          color={star <= newReview.rating ? "#f59e0b" : "#cbd5e1"} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#4b5563' }}>Review</label>
                  <textarea
                    rows="4"
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Share your experience..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      outline: 'none',
                      fontFamily: 'inherit',
                      fontSize: '0.95rem',
                      resize: 'vertical'
                    }}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: isSubmitting ? '#93c5fd' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSection;