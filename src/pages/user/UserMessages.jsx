import React from 'react';
import ChatSystem from '../../components/ChatSystem';

const UserMessages = () => {
  return (
    <div>
      <h4 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: '700', marginBottom: '1.5rem' }}>Messages</h4>
      <ChatSystem userType="user" />
    </div>
  );
};

export default UserMessages;