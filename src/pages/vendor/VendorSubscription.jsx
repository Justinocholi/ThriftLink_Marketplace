import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { subscriptions as subsApi } from '../../services/api';

const card = {
  background: 'white',
  borderRadius: '16px',
  padding: '2rem',
  marginBottom: '2rem',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
};

const StatusPill = ({ status }) => {
  const colors = {
    pending: { bg: '#fef3c7', fg: '#92400e' },
    approved: { bg: '#d1fae5', fg: '#065f46' },
    rejected: { bg: '#fee2e2', fg: '#991b1b' },
  }[status] || { bg: '#e5e7eb', fg: '#374151' };
  return (
    <span style={{
      display: 'inline-block', padding: '0.25rem 0.6rem', borderRadius: 999,
      fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
      background: colors.bg, color: colors.fg, letterSpacing: 0.4,
    }}>{status}</span>
  );
};

const PlanCard = ({ plan, currentPlan, onUpgrade }) => {
  const isCurrent = currentPlan === plan.id;
  const isFree = plan.id === 'free';
  const isPro = plan.id === 'pro';
  return (
    <div style={{
      border: isPro ? '2px solid #3b82f6' : '1px solid #e2e8f0',
      borderRadius: '12px', padding: '2rem', textAlign: 'center',
      position: 'relative', display: 'flex', flexDirection: 'column',
    }}>
      {isPro && (
        <div style={{
          position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
          background: '#3b82f6', color: 'white', padding: '0.25rem 1rem',
          borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
        }}>RECOMMENDED</div>
      )}
      <h5 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{plan.name}</h5>
      <p style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
        {plan.price === 0 ? 'Free' : `₦${plan.price.toLocaleString()}`}
        {plan.durationDays && (
          <span style={{ fontSize: '1rem', fontWeight: 400, color: '#64748b' }}>
            /{plan.durationDays}d
          </span>
        )}
      </p>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{plan.description}</p>
      <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '2rem', flex: 1 }}>
        {plan.features.map((f) => (
          <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Check size={16} color="#16a34a" /> {f}
          </li>
        ))}
      </ul>
      <button
        onClick={() => !isCurrent && !isFree && onUpgrade(plan)}
        disabled={isCurrent || isFree}
        style={{
          width: '100%', padding: '0.75rem',
          background: isCurrent ? '#e2e8f0' : isPro ? '#3b82f6' : '#1e293b',
          color: isCurrent ? '#64748b' : 'white',
          border: 'none', borderRadius: '8px', fontWeight: 600,
          cursor: isCurrent || isFree ? 'not-allowed' : 'pointer',
        }}
      >
        {isCurrent ? 'Current Plan' : isFree ? 'Default' : 'Upgrade Now'}
      </button>
    </div>
  );
};

const UpgradeModal = ({ plan, narration, paymentAccount, onClose, onSubmitted }) => {
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');

  const copy = (key, val) => {
    navigator.clipboard?.writeText(String(val || ''));
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await subsApi.submitPayment({ plan: plan.id, reference: reference.trim(), note });
      onSubmitted(res);
    } catch (err) {
      setError(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const rows = [
    { key: 'bank', label: 'Bank', value: paymentAccount?.bankName },
    { key: 'number', label: 'Account number', value: paymentAccount?.accountNumber },
    { key: 'name', label: 'Account name', value: paymentAccount?.accountName },
    { key: 'amount', label: 'Amount to transfer', value: `₦${plan.price.toLocaleString()}` },
    { key: 'narration', label: 'Transfer narration', value: narration },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', zIndex: 50, overflowY: 'auto',
    }}>
      <div style={{ background: 'white', borderRadius: 16, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Upgrade to {plan.name} (₦{plan.price.toLocaleString()})
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '1.5rem 2rem' }}>
          <p style={{ color: '#64748b', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
            Transfer the exact amount to the account below using the narration shown, then paste your transfer reference.
          </p>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            {rows.map((r) => (
              <div key={r.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{r.label}</div>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{r.value || '—'}</div>
                </div>
                <button
                  onClick={() => copy(r.key, r.value)}
                  style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.4rem 0.7rem', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#374151' }}
                >
                  {copied === r.key ? <Check size={12} /> : <Copy size={12} />}
                  {copied === r.key ? 'Copied' : 'Copy'}
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={submit}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#374151' }}>
              Transfer reference *
            </label>
            <input
              type="text"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. FT123456789"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: '1rem' }}
            />
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#374151' }}>
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything our team should know about this payment"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, minHeight: 70, marginBottom: '1rem', resize: 'vertical' }}
            />
            {error && (
              <div style={{ color: '#991b1b', background: '#fee2e2', padding: '0.6rem 0.75rem', borderRadius: 8, fontSize: '0.85rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting || !reference.trim()}
              style={{ width: '100%', padding: '0.9rem', background: '#3b82f6', color: 'white', borderRadius: 8, fontWeight: 700, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              {submitting ? 'Submitting…' : 'Submit transfer reference'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const VendorSubscription = () => {
  const [plans, setPlans] = useState([]);
  const [paymentAccount, setPaymentAccount] = useState(null);
  const [me, setMe] = useState(null);
  const [openPlan, setOpenPlan] = useState(null);
  const [banner, setBanner] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [plansRes, meRes] = await Promise.all([subsApi.getPlans(), subsApi.getMine()]);
      setPlans(plansRes.plans);
      setPaymentAccount(plansRes.paymentAccount);
      setMe(meRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const onSubmitted = () => {
    setOpenPlan(null);
    setBanner('Submitted! We will confirm your payment within 1 business day.');
    refresh();
  };

  const pending = me?.pending;
  const expiry = me?.expiresAt ? new Date(me.expiresAt) : null;

  if (loading) {
    return <div style={card}>Loading subscription…</div>;
  }

  return (
    <>
      {banner && (
        <div style={{ ...card, background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '1rem 1.5rem' }}>
          {banner}
        </div>
      )}

      <div style={card}>
        <h4 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 700, marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
          Your Subscription
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Current plan</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              {(me?.plan || 'free').toUpperCase()}
            </div>
          </div>
          {expiry && (
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Renews / expires</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{expiry.toDateString()}</div>
            </div>
          )}
          {pending && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <StatusPill status={pending.status} />
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {pending.plan} • ref <code>{pending.reference}</code>
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={card}>
        <h4 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 700, marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
          Choose a Plan
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              currentPlan={me?.plan}
              onUpgrade={(plan) => {
                if (pending) {
                  setBanner('You already have a pending submission. Wait for review before submitting another.');
                  return;
                }
                setBanner('');
                setOpenPlan(plan);
              }}
            />
          ))}
        </div>
      </div>

      {me?.history?.length > 0 && (
        <div style={card}>
          <h4 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 700, marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
            Recent Submissions
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {me.history.map((h) => (
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>
                    {h.plan.toUpperCase()} • ₦{Number(h.amount).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Ref <code>{h.reference}</code> • {new Date(h.created_at).toLocaleString()}
                  </div>
                  {h.review_notes && (
                    <div style={{ fontSize: '0.8rem', color: '#991b1b', marginTop: '0.3rem' }}>Note: {h.review_notes}</div>
                  )}
                </div>
                <StatusPill status={h.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {openPlan && (
        <UpgradeModal
          plan={openPlan}
          narration={me?.narration || ''}
          paymentAccount={paymentAccount}
          onClose={() => setOpenPlan(null)}
          onSubmitted={onSubmitted}
        />
      )}
    </>
  );
};

export default VendorSubscription;
