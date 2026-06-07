import React from 'react';
import ChatSystem from '../../components/ChatSystem';

const VendorMessages = () => {
  return (
    <div>
      <h4 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: '700', marginBottom: '1.5rem' }}>Messages</h4>
      <ChatSystem userType="vendor" />
    </div>
  );
};

export default VendorMessages;
