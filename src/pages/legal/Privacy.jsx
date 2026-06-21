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

const Privacy = () => (
  <LegalLayout title="Privacy Policy">
    <p>This Privacy Policy explains how ThriftLink ("we", "us", "our") collects, uses, and protects your personal information when you use our directory and marketplace services. We comply with the Nigeria Data Protection Act (NDPA) 2023.</p>

    <H2>1. Information We Collect</H2>
    <ul>
      <li><strong>Account data:</strong> email address, phone number, full name, password (hashed).</li>
      <li><strong>Vendor KYC data:</strong> National Identification Number (NIN) and a government-issued ID document image, used solely for verification.</li>
      <li><strong>Listing & transaction metadata:</strong> products, orders (intent records), reviews, in-app messages.</li>
      <li><strong>Technical data:</strong> IP address, browser type, device identifiers, log timestamps.</li>
      <li><strong>Behavioural data:</strong> pageviews, clicks, and feature usage captured via PostHog analytics.</li>
    </ul>

    <H2>2. Legal Basis</H2>
    <p>We process your data on the bases of (a) your consent, (b) performance of our contract with you, (c) compliance with legal obligations, and (d) our legitimate interests in operating and securing the Service — consistent with the NDPA 2023.</p>

    <H2>3. How We Use Your Information</H2>
    <ul>
      <li>To create and manage your account and vendor profile.</li>
      <li>To verify vendor identity through KYC review.</li>
      <li>To facilitate buyer–vendor connections via WhatsApp deep-links and in-app chat.</li>
      <li>To detect, prevent, and respond to fraud, abuse, and security incidents.</li>
      <li>To analyse product usage and improve the Service.</li>
      <li>To send transactional emails and important service notices.</li>
    </ul>

    <H2>4. Third-Party Processors</H2>
    <p>We share limited data with vetted processors who help us run the platform:</p>
    <ul>
      <li><strong>Supabase</strong> — authentication and database hosting.</li>
      <li><strong>Cloudinary</strong> — image storage and delivery.</li>
      <li><strong>Resend</strong> — transactional email delivery.</li>
      <li><strong>PostHog</strong> — product analytics.</li>
      <li><strong>Sentry</strong> — error and performance monitoring.</li>
      <li><strong>Mailboxlayer</strong> — email validation at signup.</li>
    </ul>
    <p>Each processor is bound by its own privacy obligations.</p>

    <H2>5. Cookies & Similar Technologies</H2>
    <p>We use cookies and local storage for authentication, session management, and analytics. You can control cookies through your browser settings, but doing so may affect functionality.</p>

    <H2>6. Your Rights</H2>
    <p>Under the NDPA, you have the right to:</p>
    <ul>
      <li>Access the personal data we hold about you.</li>
      <li>Request correction of inaccurate data.</li>
      <li>Request deletion of your data, subject to legal retention obligations.</li>
      <li>Object to or restrict certain processing.</li>
      <li>Lodge a complaint with the Nigeria Data Protection Commission (NDPC).</li>
    </ul>
    <p>To exercise these rights, contact our DPO at <a href="mailto:dpo@thriftlink.ng" style={{ color: '#25D366', fontWeight: 700 }}>dpo@thriftlink.ng</a>.</p>

    <H2>7. Children</H2>
    <p>ThriftLink is not intended for anyone under the age of 18. We do not knowingly collect data from minors. If you believe a minor has provided us data, please contact us so we can delete it.</p>

    <H2>8. Data Retention</H2>
    <p>We retain personal data for as long as your account is active or as needed to provide the Service. KYC documents are retained while you operate as a vendor and for a reasonable period thereafter to satisfy legal and audit requirements.</p>

    <H2>9. Security</H2>
    <p>We use industry-standard technical and organisational measures — including encrypted transport, hashed passwords, access controls, and masking of sensitive identifiers — to protect your data. No system is perfectly secure; please use strong, unique passwords.</p>

    <H2>10. Contact</H2>
    <p>Questions or requests about your privacy? Reach our Data Protection Officer at <a href="mailto:dpo@thriftlink.ng" style={{ color: '#25D366', fontWeight: 700 }}>dpo@thriftlink.ng</a>.</p>
  </LegalLayout>
);

export default Privacy;
