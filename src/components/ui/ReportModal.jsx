import React, { useState } from 'react';
import { X, Flag, Loader2 } from 'lucide-react';
import { reports as reportsApi } from '../../services/api';
import { useToast } from './Toast';
import { useAuth } from '../../context/AuthContext';
import { useAuthGate } from '../../context/UIContext';

const REASONS = [
  'Scam/Fraud',
  'Fake Product',
  'Harassment',
  'Spam',
  'Inappropriate Content',
  'Other',
];

const TARGET_LABEL = {
  product: 'Listing',
  vendor: 'Seller',
  user: 'User',
};

const ReportModal = ({ open, targetType = 'product', targetId, targetName, onClose }) => {
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;
    if (!user) {
      requireAuth({ label: 'submit a report', onAuthed: () => {} });
      return;
    }
    setSubmitting(true);
    try {
      await reportsApi.submit({
        target_type: targetType,
        target_id: targetId,
        reason,
        details,
      });
      toast.success('Report submitted. Our team will review it shortly.');
      onClose?.();
      setReason('');
      setDetails('');
    } catch (err) {
      toast.error(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="tl-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="tl-modal" role="dialog" aria-modal="true">
        <div
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flag size={20} color="#ef4444" />
            <h3 style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Report {TARGET_LABEL[targetType] || 'Item'}
            </h3>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem' }}>
          {targetName && (
            <div
              style={{
                background: '#f8fafc',
                borderRadius: 10,
                padding: '0.6rem 0.85rem',
                fontSize: '0.85rem',
                color: '#475569',
                marginBottom: '1rem',
              }}
            >
              Reporting: <strong>{targetName}</strong>
            </div>
          )}

          <p
            style={{
              fontSize: '0.85rem',
              color: '#475569',
              marginBottom: '0.75rem',
              fontWeight: 600,
            }}
          >
            Why are you reporting this?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1rem' }}>
            {REASONS.map((r) => (
              <label
                key={r}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '0.7rem 0.85rem',
                  borderRadius: 10,
                  border: `1.5px solid ${reason === r ? '#25D366' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  background: reason === r ? 'rgba(37,211,102,0.06)' : 'white',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: '#0f172a',
                  transition: 'all 0.18s',
                }}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  style={{ accentColor: '#25D366' }}
                />
                {r}
              </label>
            ))}
          </div>

          <textarea
            className="tl-input"
            placeholder="Additional details (optional)"
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            style={{ resize: 'vertical', marginBottom: '1rem' }}
          />

          <button
            type="submit"
            disabled={!reason || submitting}
            className="tl-btn tl-btn-primary tl-btn-block"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Submit Report
          </button>
          <p
            style={{
              textAlign: 'center',
              fontSize: '0.75rem',
              color: '#94a3b8',
              marginTop: '0.75rem',
            }}
          >
            Reports are confidential and reviewed by our moderation team.
          </p>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
