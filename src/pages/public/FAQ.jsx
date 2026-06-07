import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '1rem' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          padding: '1rem 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' 
        }}
      >
        <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937' }}>{question}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && (
        <div style={{ paddingBottom: '1rem', color: '#4b5563', lineHeight: '1.6' }}>
          {answer}
        </div>
      )}
    </div>
  );
};

const FAQ = () => {
  const faqs = [
    { question: "How do I become a vendor?", answer: "To become a vendor, click on the 'Register as Vendor' link in the footer or the 'Become a Vendor' button on the homepage. Fill out the registration form and complete the verification process." },
    { question: "Is ThriftLink safe?", answer: "Yes, ThriftLink is committed to safety. We verify all vendors and provide safety tips for buyers. Always meet in public places and inspect items before payment." },
    { question: "How do I verify my account?", answer: "After registering as a vendor, go to your dashboard and navigate to the Subscription/Verification section to upload the necessary documents." },
    { question: "Can I return items?", answer: "Return policies depend on the individual vendor. We recommend discussing return policies with the vendor before making a purchase." },
    { question: "Is there a fee to sell?", answer: "We offer different subscription plans for vendors. Please check our Pricing Plans page for more details." }
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '8rem 2rem 4rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', textAlign: 'center', color: '#1f2937' }}>Frequently Asked Questions</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '3rem' }}>
          Find answers to common questions about ThriftLink.
        </p>
        
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FAQ;
