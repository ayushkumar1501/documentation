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
  getSessions: () => Promise.resolve(mockSessions),
  createSession: () => Promise.resolve({
    _id: "4",
    title: "New Chat",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: []
  }),
  sendMessage: (sessionId, message) => Promise.resolve({
    _id: `msg${Date.now()}`,
    content: message,
    role: "user",
    timestamp: new Date().toISOString()
  })
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
      // Using mock API instead of real API call
      const fetchedSessions = await mockApi.getSessions();
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
      // Using mock API instead of real API call
      const newSession = await mockApi.createSession();
      
      // Update sessions list and select the new session
      setSessions(prev => [newSession, ...prev]); // Add new session to top
      setSelectedSession(newSession);
    } catch (error) {
      console.error('Error creating new chat:', error);
      alert(`Failed to create new chat: ${error.message}`);
    }
  };

  const handleSelectSession = (session) => {
    setSelectedSession(session);
  };

  // Optional: Function to refresh the sessions list
  const refreshSessions = () => {
    fetchSessions();
  };

  // ... rest of the component remains the same ...
// ... existing code ...
