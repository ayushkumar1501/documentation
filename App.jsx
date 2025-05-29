import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import './index.css'; // Import global styles

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
      const res = await axios.get('http://localhost:5050/sessions');
      const fetchedSessions = res.data;
      setSessions(fetchedSessions);
      // Automatically select the most recent session if available
      if (fetchedSessions.length > 0 && !selectedSession) {
        setSelectedSession(fetchedSessions[0]);
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
      const res = await axios.post('http://localhost:5050/sessions', {
        title: 'New Chat'
      });
      const newSession = res.data;

      // Send welcome message to the new session
      await axios.post(`http://localhost:5050/sessions/${newSession._id}/welcome`);

      // Update sessions list and select the new session
      setSessions(prev => [newSession, ...prev]); // Add new session to top
      setSelectedSession(newSession);
    } catch (error) {
      console.error('Error creating new chat:', error.response?.data || error.message);
      alert(`Failed to create new chat: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleSelectSession = (session) => {
    setSelectedSession(session);
  };

  // Optional: Function to refresh the sessions list, e.g., after an upload for `updatedAt` to reflect
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
          onMessageSentOrUploaded={refreshSessions} // Pass refresh prop
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
            style={{ marginTop: '1rem', padding: '12px 25px', fontSize: '1.1em' }}
          >
            Start New Chat
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
