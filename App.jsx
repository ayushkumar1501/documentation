import React from 'react';

function Sidebar({ sessions, selectedSession, onSelect, onNewChat, loading, error }) {
  return (
    <div style={{
        width: 280,
        borderRight: '1px solid #e0e0e0',
        height: '100vh',
        padding: 16,
        boxSizing: 'border-box',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 5px rgba(0,0,0,0.05)'
    }}>
      <button style={{ width: '100%', marginBottom: 16, padding: '12px 15px', borderRadius: '8px', fontSize: '1em' }} onClick={onNewChat}>+ New Chat</button>

      <h3 style={{ marginTop: 0, marginBottom: 10, color: '#555' }}>Chat History</h3>
      {loading && <p style={{ color: '#888', textAlign: 'center' }}>Loading sessions...</p>}
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      <div style={{
          flexGrow: 1,
          overflowY: 'auto',
          paddingRight: 8, // For scrollbar spacing
          minHeight: 0 // Crucial for flex item shrinking
      }}>
        {sessions.length === 0 && !loading && !error && (
          <p style={{ color: '#888', textAlign: 'center', fontSize: '0.9em' }}>No sessions yet. Click "New Chat"!</p>
        )}
        {sessions.map(session => (
          <div
            key={session._id}
            onClick={() => onSelect(session)}
            style={{
              padding: '12px 15px',
              marginBottom: 8,
              borderRadius: 8,
              background: selectedSession && selectedSession._id === session._id ? '#e3eaff' : '#f0f2f5',
              color: selectedSession && selectedSession._id === session._id ? '#1976d2' : '#333',
              cursor: 'pointer',
              fontWeight: selectedSession && selectedSession._id === session._id ? 'bold' : 'normal',
              border: selectedSession && selectedSession._id === session._id ? '1px solid #1976d2' : '1px solid #f0f0f0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              boxShadow: selectedSession && selectedSession._id === session._id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'background 0.2s ease, border 0.2s ease'
            }}
          >
            {session.title || 'New Chat'}
            <div style={{ fontSize: '0.75em', color: selectedSession && selectedSession._id === session._id ? '#4a8cd4' : '#666' }}>
              {new Date(session.updatedAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;
