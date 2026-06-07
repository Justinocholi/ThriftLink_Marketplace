import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const ReportIssues = () => {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '8rem 2rem 4rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', textAlign: 'center', color: '#1f2937' }}>Report an Issue</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '3rem' }}>
          Please let us know if you encounter any problems or have a complaint.
        </p>

        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Issue Type</label>
              <select style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                <option>Select an issue type</option>
                <option>Technical Bug</option>
                <option>Vendor Complaint</option>
                <option>Content Violation</option>
                <option>Other</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Subject</label>
              <input type="text" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} placeholder="Brief summary of the issue" />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Description</label>
              <textarea rows="6" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }} placeholder="Please provide as much detail as possible..."></textarea>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Attachments (Optional)</label>
              <input type="file" style={{ width: '100%', padding: '0.8rem', border: '1px solid #d1d5db', borderRadius: '8px' }} />
            </div>

            <button type="submit" style={{ padding: '1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '1rem' }}>
              Submit Report
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ReportIssues;
