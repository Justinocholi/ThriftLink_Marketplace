import React, { useEffect, useState } from 'react';
import { vendorMe } from '../../services/api';
import { ShieldCheck, FileText, Upload, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react';

const STATUS_BADGE = {
  approved: { bg: '#dcfce7', fg: '#166534', icon: CheckCircle2, label: 'Approved' },
  pending:  { bg: '#fef3c7', fg: '#92400e', icon: Clock, label: 'Pending review' },
  rejected: { bg: '#fee2e2', fg: '#991b1b', icon: AlertCircle, label: 'Rejected' },
};

const inputStyle = { padding: '0.875rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box', outline: 'none' };
const labelStyle = { display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569', fontSize: '0.875rem' };

const VendorKycSection = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kyc, setKyc] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    nin: '',
    business_name: '',
    business_address: '',
    business_registration_number: '',
    id_document_type: 'national_id',
  });
  const [idDocument, setIdDocument] = useState(null);

  const load = () => {
    setLoading(true);
    vendorMe.getKyc()
      .then((row) => {
        setKyc(row);
        setForm((f) => ({
          ...f,
          business_name: row.business_name || '',
          business_address: row.business_address || '',
          business_registration_number: row.business_registration_number || '',
          id_document_type: row.id_document_type || 'national_id',
        }));
      })
      .catch((e) => {
        // 404 is normal when KYC was never submitted — ignore the error.
        if (!/not found/i.test(e.message)) setError(e.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const ninValid = /^\d{11}$/.test(form.nin);
  const hasDocOnFile = Boolean(kyc?.id_document_url);
  const docOk = Boolean(idDocument) || hasDocOnFile;
  const canSubmit = ninValid && docOk && form.business_name.trim() && form.business_address.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    if (!ninValid) { setError('NIN must be exactly 11 digits'); return; }
    if (!docOk) { setError('ID document is required'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('nin', form.nin);
      fd.append('business_name', form.business_name);
      fd.append('business_address', form.business_address);
      if (form.business_registration_number) fd.append('business_registration_number', form.business_registration_number);
      fd.append('id_document_type', form.id_document_type);
      if (idDocument) fd.append('id_document', idDocument);
      const res = await vendorMe.submitKyc(fd);
      setMessage(res.message || 'KYC submitted.');
      setIdDocument(null);
      setForm((f) => ({ ...f, nin: '' }));
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={24} color="#25D366" />
      </div>
    );
  }

  const status = kyc?.verification_status || 'not_started';
  const badge = STATUS_BADGE[status];
  const Icon = badge?.icon;

  return (
    <div style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <ShieldCheck size={24} color="#16a34a" />
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>KYC Verification</h3>
        {badge && (
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: badge.bg, color: badge.fg, padding: '0.3rem 0.7rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 700 }}>
            <Icon size={14} /> {badge.label}
          </span>
        )}
      </div>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Submit your NIN and a government-issued ID document so admins can verify your shop. Required before you can subscribe to a premium plan.
      </p>

      {message && <div style={{ background: '#dcfce7', color: '#166534', padding: '0.85rem 1rem', borderRadius: 10, marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>{message}</div>}
      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.85rem 1rem', borderRadius: 10, marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>{error}</div>}
      {kyc?.kyc_review_notes && status === 'rejected' && (
        <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.85rem 1rem', borderRadius: 10, marginBottom: '1rem', fontSize: '0.875rem' }}>
          Admin note: {kyc.kyc_review_notes}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
        <div>
          <label style={labelStyle}>National Identification Number (NIN) *</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{11}"
            maxLength={11}
            required
            value={form.nin}
            onChange={(e) => setForm((f) => ({ ...f, nin: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
            placeholder={kyc?.nin ? `Currently: ${kyc.nin}` : '11-digit NIN'}
            style={inputStyle}
          />
          {form.nin && !ninValid && (
            <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.35rem' }}>NIN must be 11 digits</div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Business Name *</label>
            <input type="text" required value={form.business_name} onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>ID Document Type *</label>
            <select value={form.id_document_type} onChange={(e) => setForm((f) => ({ ...f, id_document_type: e.target.value }))} style={inputStyle}>
              <option value="national_id">National ID</option>
              <option value="drivers_license">Driver's License</option>
              <option value="voters_card">Voter's Card</option>
              <option value="international_passport">International Passport</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Business Address *</label>
          <input type="text" required value={form.business_address} onChange={(e) => setForm((f) => ({ ...f, business_address: e.target.value }))} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>
            <FileText size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            ID Document (required for verification) {hasDocOnFile && <span style={{ color: '#16a34a', fontWeight: 600 }}>— uploaded ✓</span>}
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            required={!hasDocOnFile}
            onChange={(e) => setIdDocument(e.target.files?.[0] || null)}
            style={{ ...inputStyle, padding: '0.6rem' }}
          />
          {hasDocOnFile && (
            <a href={kyc.id_document_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#2563eb', marginTop: 4, display: 'inline-block' }}>
              View current document →
            </a>
          )}
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem' }}>Accepted: image or PDF, max 5MB.</div>
        </div>

        <div>
          <label style={labelStyle}>CAC / Business Registration No. (optional)</label>
          <input type="text" value={form.business_registration_number} onChange={(e) => setForm((f) => ({ ...f, business_registration_number: e.target.value }))} style={inputStyle} />
        </div>

        <div style={{ paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.85rem 1.75rem',
              background: !canSubmit || submitting ? '#cbd5e1' : '#16a34a',
              color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.95rem',
              cursor: !canSubmit || submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
            {status === 'approved' ? 'Resubmit KYC' : 'Submit KYC'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VendorKycSection;
