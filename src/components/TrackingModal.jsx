import React from 'react';
import { X, Check, Truck, Package, Clock } from 'lucide-react';

const TrackingModal = ({ order, onClose }) => {
  if (!order) return null;

  const steps = [
    { status: 'Order Placed', date: 'Oct 24, 10:30 AM', icon: <Clock size={18} /> },
    { status: 'Processing', date: 'Oct 24, 02:00 PM', icon: <Package size={18} /> },
    { status: 'Shipped', date: 'Oct 25, 09:00 AM', icon: <Truck size={18} /> },
    { status: 'Out for Delivery', date: 'Oct 26, 08:00 AM', icon: <Truck size={18} /> },
    { status: 'Delivered', date: 'Oct 26, 02:30 PM', icon: <Check size={18} /> }
  ];

  // Determine current step index based on order status
  // Mock logic: if status is 'Delivered', all steps done. If 'Pending', only first.
  let currentStepIndex = 0;
  if (order.status === 'Delivered' || order.status === 'Completed') currentStepIndex = 4;
  else if (order.status === 'Shipped') currentStepIndex = 2;
  else if (order.status === 'Processing') currentStepIndex = 1;
  else if (order.status === 'Pending') currentStepIndex = 0;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '2rem', width: '90%', maxWidth: '500px',
        position: 'relative'
      }} onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} style={{
          position: 'absolute', top: '1.5rem', right: '1.5rem',
          background: 'none', border: 'none', cursor: 'pointer', color: '#64748b'
        }}>
          <X size={24} />
        </button>

        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>Track Order</h3>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>Order ID: {order.id}</p>

        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>{order.item}</h4>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Estimated Delivery: <span style={{ color: '#0f172a', fontWeight: '600' }}>Oct 27, 2023</span></p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {steps.map((step, index) => (
            <div key={index} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
              {/* Line connector */}
              {index < steps.length - 1 && (
                <div style={{
                  position: 'absolute', left: '15px', top: '30px', bottom: '-20px', width: '2px',
                  background: index < currentStepIndex ? '#22c55e' : '#e2e8f0'
                }} />
              )}

              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: index <= currentStepIndex ? '#22c55e' : '#f1f5f9',
                color: index <= currentStepIndex ? 'white' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, zIndex: 1
              }}>
                {index < currentStepIndex ? <Check size={16} /> : step.icon}
              </div>

              <div style={{ paddingBottom: '2rem' }}>
                <h5 style={{ 
                  fontSize: '0.95rem', fontWeight: '600', 
                  color: index <= currentStepIndex ? '#0f172a' : '#94a3b8' 
                }}>
                  {step.status}
                </h5>
                {index <= currentStepIndex && (
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{step.date}</p>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default TrackingModal;