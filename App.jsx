export const mockSessions = [
  {
    _id: "1",
    title: "Invoice #1234",
    createdAt: "2024-03-20T10:00:00Z",
    updatedAt: "2024-03-20T10:30:00Z",
    messages: [
      {
        _id: "msg1",
        content: "Hello! I've uploaded an invoice for validation.",
        role: "user",
        timestamp: "2024-03-20T10:00:00Z"
      },
      {
        _id: "msg2",
        content: "I've received your invoice. Let me analyze it for you.",
        role: "assistant",
        timestamp: "2024-03-20T10:01:00Z"
      }
    ]
  },
  {
    _id: "2",
    title: "Invoice #5678",
    createdAt: "2024-03-19T15:00:00Z",
    updatedAt: "2024-03-19T15:45:00Z",
    messages: [
      {
        _id: "msg3",
        content: "Please validate this invoice from Supplier XYZ.",
        role: "user",
        timestamp: "2024-03-19T15:00:00Z"
      },
      {
        _id: "msg4",
        content: "I've found some discrepancies in the invoice. Would you like me to explain them?",
        role: "assistant",
        timestamp: "2024-03-19T15:02:00Z"
      }
    ]
  },
  {
    _id: "3",
    title: "New Chat",
    createdAt: "2024-03-18T09:00:00Z",
    updatedAt: "2024-03-18T09:05:00Z",
    messages: [
      {
        _id: "msg5",
        content: "Welcome to Invoice Validator! How can I help you today?",
        role: "assistant",
        timestamp: "2024-03-18T09:00:00Z"
      }
    ]
  }
];

// Mock function to simulate API calls
export const mockApi = {
  getSessions: () => {
    // Simulate a small delay to mimic real API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockSessions);
      }, 500);
    });
  },
  
  createSession: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          _id: `session_${Date.now()}`,
          title: "New Chat",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [
            {
              _id: `msg_${Date.now()}`,
              content: "Welcome to Invoice Validator! How can I help you today?",
              role: "assistant",
              timestamp: new Date().toISOString()
            }
          ]
        });
      }, 500);
    });
  },
  
  sendMessage: (sessionId, message) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          _id: `msg_${Date.now()}`,
          content: message,
          role: "user",
          timestamp: new Date().toISOString()
        });
      }, 500);
    });
  }
};



import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import { mockSessions, mockApi } from './mockData';
import './index.css';

function App() {
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [errorLoadingSessions, setErrorLoadingSessions] = useState(null);

  // Fetch sessions on component mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    setErrorLoadingSessions(null);
    try {
      const fetchedSessions = await mockApi.getSessions();
      if (fetchedSessions && Array.isArray(fetchedSessions)) {
        setSessions(fetchedSessions);
        // Automatically select the most recent session if available
        if (fetchedSessions.length > 0 && !selectedSession) {
          setSelectedSession(fetchedSessions[0]);
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setErrorLoadingSessions('Failed to load chat history. Please refresh.');
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const newSession = await mockApi.createSession();
      if (newSession && newSession._id) {
        setSessions(prev => [newSession, ...prev]);
        setSelectedSession(newSession);
      } else {
        throw new Error('Invalid session data received');
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      alert(`Failed to create new chat: ${error.message}`);
    }
  };

  const handleSelectSession = (session) => {
    setSelectedSession(session);
  };

  const refreshSessions = () => {
    fetchSessions();
  };

  return (
    <div className="app-container">
      <Sidebar
        sessions={sessions}
        selectedSession={selectedSession}
        onSelect={handleSelectSession}
        onNewChat={handleNewChat}
        loading={loadingSessions}
        error={errorLoadingSessions}
      />

      {selectedSession ? (
        <ChatWindow
          sessionId={selectedSession._id}
          sessionTitle={selectedSession.title}
          onMessageSentOrUploaded={refreshSessions}
        />
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          textAlign: 'center',
          padding: '2rem',
          background: '#fff',
          margin: 20,
          borderRadius: 10,
          boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
        }}>
          <h2>Welcome to Invoice Validator</h2>
          <p>Create a new chat to get started with invoice validation.</p>
          <button
            onClick={handleNewChat}
            style={{ 
              marginTop: '1rem', 
              padding: '12px 25px', 
              fontSize: '1.1em',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1565c0'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#1976d2'}
          >
            Start New Chat
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
