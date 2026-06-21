import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/thriftlink-logo-.png';

const LegalLayout = ({ title, children }) => (
  <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
    <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '1rem 1.25rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <img src={logo} alt="ThriftLink" style={{ height: 36 }} />
          <span style={{ fontWeight: 800, color: '#0f172a' }}>ThriftLink</span>
        </Link>
        <Link to="/" style={{ color: '#25D366', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>← Back to home</Link>
      </div>
    </div>
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.25rem 4rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>{title}</h1>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>Last updated: June 2026</p>
      <div style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#334155' }}>{children}</div>
    </main>
  </div>
);

const H2 = ({ children }) => (
  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '2rem', marginBottom: '0.75rem' }}>{children}</h2>
);

const Terms = () => (
  <LegalLayout title="Terms & Conditions">
    <p>Welcome to ThriftLink. These Terms & Conditions ("Terms") govern your access to and use of the ThriftLink platform, available via our website and mobile experiences ("Service"). By using ThriftLink, you agree to these Terms.</p>

    <H2>1. Acceptance of Terms</H2>
    <p>By creating an account, browsing, or otherwise using the Service, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree, please discontinue use.</p>

    <H2>2. Eligibility</H2>
    <p>You must be at least 18 years old and legally able to enter into binding contracts under Nigerian law to use ThriftLink. By using the Service you represent that you meet this requirement.</p>

    <H2>3. Account Responsibility</H2>
    <p>You are responsible for safeguarding your login credentials and for all activity that occurs under your account. Notify us immediately of any unauthorized access. We are not liable for losses arising from your failure to protect your account.</p>

    <H2>4. Vendor Obligations</H2>
    <p>Vendors using ThriftLink agree to:</p>
    <ul>
      <li>Only list genuine, lawful items — no counterfeit, stolen, or restricted goods.</li>
      <li>Provide accurate descriptions, prices, condition, and photographs of products.</li>
      <li>Complete Know-Your-Customer (KYC) verification, including National Identification Number (NIN) and a valid government-issued ID document.</li>
      <li>Honour communications and reasonable order intents from buyers in good faith.</li>
    </ul>

    <H2>5. Buyer Responsibilities</H2>
    <p>Buyers agree to use the directory in good faith, to communicate respectfully with vendors, and to independently verify products before payment. ThriftLink is a directory; buyers transact with vendors at their own discretion.</p>

    <H2>6. Prohibited Content</H2>
    <p>You may not post or transmit content that is unlawful, fraudulent, defamatory, obscene, hateful, infringes intellectual property, or otherwise violates applicable Nigerian law. We may remove content and suspend accounts at our discretion.</p>

    <H2>7. Payment Disclaimer</H2>
    <p><strong>ThriftLink is a directory — payments for products happen directly between buyer and vendor (typically via WhatsApp). We do not process, hold, or guarantee money for products.</strong> Any dispute arising from a product transaction is between the buyer and the vendor.</p>

    <H2>8. Subscription Billing</H2>
    <p>Vendors may subscribe to premium plans via manual bank transfer to our Moniepoint account. Subscriptions are activated by an admin upon confirmation of payment. Subscription fees are non-refundable after activation. Plans, pricing, and durations are described on the pricing page.</p>

    <H2>9. Intellectual Property</H2>
    <p>The ThriftLink name, logo, website, code, and content are owned by ThriftLink or its licensors. Vendors retain ownership of their listing content but grant ThriftLink a non-exclusive, royalty-free licence to display it on the Service.</p>

    <H2>10. Termination</H2>
    <p>We may suspend or terminate your account at any time if you breach these Terms or engage in conduct that harms other users or the platform. You may close your account at any time by contacting support.</p>

    <H2>11. Disclaimer of Liability</H2>
    <p>The Service is provided "as is" and "as available." To the maximum extent permitted by law, ThriftLink disclaims all warranties and is not liable for indirect, incidental, or consequential damages arising from your use of the Service or from any transaction between buyer and vendor.</p>

    <H2>12. Governing Law</H2>
    <p>These Terms are governed by the laws of the Federal Republic of Nigeria, including the Nigeria Data Protection Act (NDPA) 2023 where applicable. Disputes will be resolved in the competent courts of Nigeria.</p>

    <H2>13. Contact</H2>
    <p>Questions about these Terms? Email us at <a href="mailto:support@thriftlink.ng" style={{ color: '#25D366', fontWeight: 700 }}>support@thriftlink.ng</a>.</p>
  </LegalLayout>
);

export default Terms;
