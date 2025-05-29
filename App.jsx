// frontend/src/mockApi.js

// A simple in-memory store for sessions and messages to simulate persistence
const mockDb = {
    sessions: [
        {
            _id: "mock_session_1",
            title: "Mock Invoice Chat 1",
            createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            updatedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
            _id: "mock_session_2",
            title: "Mock Chat - Rejected Invoice",
            createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            updatedAt: new Date(Date.now() - 7200000).toISOString(),
        },
    ],
    messages: {
        "mock_session_1": [
            {
                _id: "msg_1_1",
                sessionId: "mock_session_1",
                role: "assistant",
                content: "Welcome to Invoice Validator! 🧾\n\nI'm here to help you validate invoices. Please upload a PNG, JPG, or PDF file to get started.",
                createdAt: new Date(Date.now() - 3590000).toISOString(),
                metadata: {}
            },
            {
                _id: "msg_1_2",
                sessionId: "mock_session_1",
                role: "user",
                content: "Here's an invoice for validation.",
                createdAt: new Date(Date.now() - 3580000).toISOString(),
                metadata: {}
            },
            {
                _id: "msg_1_3",
                sessionId: "mock_session_1",
                role: "assistant",
                content: "✅ **Invoice Accepted**\n\nAll critical details appear to be present and valid.\n\n**Extracted Details:**\n```json\n{\n  \"vendor_name\": \"Tech Solutions Inc.\",\n  \"invoice_number\": \"INV-2024-001\",\n  \"invoice_date\": \"2024-05-28\",\n  \"total_amount\": 123.45,\n  \"currency\": \"USD\",\n  \"subtotal_amount\": 110.00,\n  \"tax_amount\": 13.45,\n  \"items_count\": 3\n}\n```\n\n💬 Feel free to ask me any questions about this validation or the extracted data!",
                createdAt: new Date(Date.now() - 3570000).toISOString(),
                metadata: {
                    status: "Accepted",
                    summary: "All critical details appear to be present and valid.",
                    extracted_data: {
                        vendor_name: "Tech Solutions Inc.",
                        invoice_number: "INV-2024-001",
                        invoice_date: "2024-05-28",
                        total_amount: 123.45,
                        currency: "USD",
                        subtotal_amount: 110.00,
                        tax_amount: 13.45,
                        items_count: 3
                    },
                    issues: []
                }
            },
            {
                _id: "msg_1_4",
                sessionId: "mock_session_1",
                role: "user",
                content: "What was the total amount?",
                createdAt: new Date(Date.now() - 3560000).toISOString(),
                metadata: {}
            },
            {
                _id: "msg_1_5",
                sessionId: "mock_session_1",
                role: "assistant",
                content: "The total amount extracted from the invoice **INV-2024-001** for **Tech Solutions Inc.** was **$123.45**.",
                createdAt: new Date(Date.now() - 3550000).toISOString(),
                metadata: {}
            },
        ],
        "mock_session_2": [
            {
                _id: "msg_2_1",
                sessionId: "mock_session_2",
                role: "assistant",
                content: "Welcome to Invoice Validator! 🧾\n\nI'm here to help you validate invoices. Please upload a PNG, JPG, or PDF file to get started.",
                createdAt: new Date(Date.now() - 7190000).toISOString(),
                metadata: {}
            },
            {
                _id: "msg_2_2",
                sessionId: "mock_session_2",
                role: "user",
                content: "Please check this blurry invoice.",
                createdAt: new Date(Date.now() - 7180000).toISOString(),
                metadata: {}
            },
            {
                _id: "msg_2_3",
                sessionId: "mock_session_2",
                role: "assistant",
                content: "❌ **Invoice Rejected**\n\nCritical information is missing or unclear.\n\n**Extracted Details (for context):**\n```json\n{\n  \"vendor_name\": \"XYZ Services\",\n  \"invoice_number\": null,\n  \"invoice_date\": \"2024-05-28\",\n  \"total_amount\": null,\n  \"currency\": \"EUR\",\n  \"subtotal_amount\": 80.00,\n  \"tax_amount\": 16.00,\n  \"items_count\": 2\n}\n```\n**Issues Found:**\n- Invoice number could not be clearly identified.\n- Total amount was not found or was ambiguous.\n\n💬 Ask me questions like 'Why was this rejected?' or 'How can I fix these issues?'",
                createdAt: new Date(Date.now() - 7170000).toISOString(),
                metadata: {
                    status: "Rejected",
                    summary: "Critical information is missing or unclear.",
                    extracted_data: {
                        vendor_name: "XYZ Services",
                        invoice_number: null,
                        invoice_date: "2024-05-28",
                        total_amount: null,
                        currency: "EUR",
                        subtotal_amount: 80.00,
                        tax_amount: 16.00,
                        items_count: 2
                    },
                    issues: ["Invoice number could not be clearly identified.", "Total amount was not found or was ambiguous."]
                }
            },
        ],
    }
};

// Simulate unique IDs (simple increment for mock)
let nextSessionId = mockDb.sessions.length + 1;
let nextMessageId = 1000; // Start higher to avoid collision with static IDs

// Simulate API call delays
const simulateDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
    getSessions: async () => {
        console.log("MOCK API: Fetching sessions...");
        await simulateDelay();
        // Sort by updatedAt descending
        const sortedSessions = [...mockDb.sessions].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return { data: sortedSessions };
    },

    createSession: async (title) => {
        console.log("MOCK API: Creating new session...");
        await simulateDelay(300);
        const newId = `mock_session_${nextSessionId++}`;
        const newSession = {
            _id: newId,
            title: title || `Mock Chat ${nextSessionId - 1}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        mockDb.sessions.unshift(newSession); // Add to the beginning to appear at top
        mockDb.messages[newId] = []; // Initialize messages for new session
        return { data: newSession };
    },

    sendWelcomeMessage: async (sessionId) => {
        console.log(`MOCK API: Sending welcome message for session ${sessionId}...`);
        await simulateDelay(200);
        if (!mockDb.messages[sessionId]) {
            console.error(`MOCK API: Session ${sessionId} not found for welcome message.`);
            throw new Error("Mock session not found.");
        }
        const welcomeMessage = {
            _id: `msg_${sessionId}_${nextMessageId++}`,
            sessionId: sessionId,
            role: "assistant",
            content: "Welcome to Invoice Validator! 🧾\n\nI'm here to help you validate invoices. Please upload a PNG, JPG, or PDF file to get started.",
            createdAt: new Date().toISOString(),
            metadata: {}
        };
        mockDb.messages[sessionId].push(welcomeMessage);
        return { data: { response: welcomeMessage.content } };
    },

    getMessagesForSession: async (sessionId) => {
        console.log(`MOCK API: Fetching messages for session ${sessionId}...`);
        await simulateDelay(400);
        const messages = mockDb.messages[sessionId] || [];
        return { data: messages };
    },

    uploadInvoice: async (formData) => {
        console.log("MOCK API: Uploading invoice...");
        await simulateDelay(2000); // Simulate longer processing time
        const sessionId = formData.get('session_id');
        const fileName = formData.get('invoice')?.name || 'mock_invoice.pdf';

        if (!sessionId || !mockDb.messages[sessionId]) {
             console.error(`MOCK API: Session ${sessionId} not found for invoice upload.`);
             throw { response: { data: { error: 'Mock session not found for upload.' }, status: 404 } };
        }

        // Simulate a fixed sequence of messages during upload/validation
        const processMessages = [
            { role: "system", content: `_Processing file:_ **${fileName}**... Extracting text via OCR.`, createdAt: new Date(Date.now() - 100).toISOString() },
            { role: "system", content: "_Text extracted._ Analyzing invoice with AI...", createdAt: new Date(Date.now() - 50).toISOString() },
        ];

        // Simulate success or failure based on file name or random
        const isSuccess = !fileName.toLowerCase().includes("fail") && !fileName.toLowerCase().includes("rejected") && !fileName.toLowerCase().includes("blurry"); // Simple condition for demo

        let validationResult;
        if (isSuccess) {
            validationResult = {
                status: "Accepted",
                summary: "All critical details appear to be present and valid.",
                extracted_data: {
                    vendor_name: "Mock Company A",
                    invoice_number: `MOCK-INV-${Date.now().toString().slice(-5)}`,
                    invoice_date: new Date().toISOString().slice(0,10),
                    total_amount: Math.round(Math.random() * 500 + 50) + 0.99,
                    currency: "USD",
                    subtotal_amount: Math.round(Math.random() * 400 + 40),
                    tax_amount: Math.round(Math.random() * 50 + 5),
                    items_count: Math.floor(Math.random() * 5) + 1
                },
                issues: []
            };
        } else if (fileName.toLowerCase().includes("duplicate")) {
            validationResult = {
                status: 'Rejected',
                summary: 'Duplicate invoice detected in mock data.',
                extracted_data: {
                    vendor_name: 'Mock Company (Duplicate)',
                    invoice_number: 'DUP-001',
                    invoice_date: '2024-05-01',
                    total_amount: 100.00,
                    currency: 'USD',
                },
                issues: ['This invoice (Hash: mock-hash-dup) was previously processed on 2024-05-02.']
            };
        }
        else {
            validationResult = {
                status: "Rejected",
                summary: "Invoice rejected due to missing critical information.",
                extracted_data: {
                    vendor_name: "Mock Company B",
                    invoice_number: null,
                    invoice_date: new Date().toISOString().slice(0,10),
                    total_amount: null,
                    currency: "USD",
                    subtotal_amount: null,
                    tax_amount: null,
                    items_count: null
                },
                issues: ["Invoice number missing", "Total amount not found or unclear", "Vendor signature required"]
            };
        }

        // Add the processing messages first
        for (const msg of processMessages) {
            mockDb.messages[sessionId].push({ ...msg, _id: `msg_${sessionId}_${nextMessageId++}` });
        }

        // Format and add the final validation message
        const formattedValidationMessage = formatValidationResultForChatMock(validationResult);
        mockDb.messages[sessionId].push({
            _id: `msg_${sessionId}_${nextMessageId++}`,
            sessionId: sessionId,
            role: "assistant",
            content: formattedValidationMessage,
            createdAt: new Date().toISOString(),
            metadata: validationResult // Store the full mock result as metadata
        });

        // Update session's updatedAt for sidebar sorting
        const sessionToUpdate = mockDb.sessions.find(s => s._id === sessionId);
        if (sessionToUpdate) {
            sessionToUpdate.updatedAt = new Date().toISOString();
        }

        return { data: { status: validationResult.status, message: "Validation complete" } };
    },

    sendLlmChat: async (sessionId, content) => {
        console.log(`MOCK API: Sending LLM chat for session ${sessionId}...`);
        await simulateDelay(700);

        if (!mockDb.messages[sessionId]) {
            console.error(`MOCK API: Session ${sessionId} not found for chat.`);
            throw new Error("Mock session not found.");
        }

        let assistantReply = "I received your message! As a mock AI, I'm limited in what I can do. Try asking about a previous invoice if you uploaded one.";

        // Basic keyword response simulation
        if (content.toLowerCase().includes("total amount")) {
            const lastValidation = mockDb.messages[sessionId].slice().reverse().find(m => m.metadata && m.metadata.extracted_data);
            if (lastValidation && lastValidation.metadata.extracted_data?.total_amount) {
                assistantReply = `Based on the last invoice, the total amount extracted was **${lastValidation.metadata.extracted_data.currency || ''}${lastValidation.metadata.extracted_data.total_amount}**.`;
            } else {
                assistantReply = "I don't have a total amount from a validated invoice in this chat to refer to. Please upload an invoice first!";
            }
        } else if (content.toLowerCase().includes("rejected") || content.toLowerCase().includes("why")) {
             const lastValidation = mockDb.messages[sessionId].slice().reverse().find(m => m.metadata && m.metadata.status === "Rejected");
            if (lastValidation && lastValidation.metadata.issues?.length > 0) {
                assistantReply = `The last invoice was rejected for the following reasons: ${lastValidation.metadata.issues.map(issue => `\n- ${issue}`).join('')}.`;
            } else {
                assistantReply = "The last invoice I saw was accepted, or I don't have enough context to explain a rejection.";
            }
        } else if (content.toLowerCase().includes("hello")) {
            assistantReply = "Hello there! How can I assist you with invoice validation today?";
        }


        const assistantMessage = {
            _id: `msg_${sessionId}_${nextMessageId++}`,
            sessionId: sessionId,
            role: "assistant",
            content: assistantReply,
            createdAt: new Date().toISOString(),
            metadata: {}
        };
        mockDb.messages[sessionId].push(assistantMessage);

        // Update session's updatedAt for sidebar sorting
        const sessionToUpdate = mockDb.sessions.find(s => s._id === sessionId);
        if (sessionToUpdate) {
            sessionToUpdate.updatedAt = new Date().toISOString();
        }

        return { data: { response: assistantMessage.content } };
    }
};

// Helper function (copied from backend's format_validation_result)
function formatValidationResultForChatMock(result) {
    const status = result.status || "Rejected";
    const summary = result.summary || "No summary provided.";
    const extracted_data = result.extracted_data || {};
    const issues = result.issues || [];

    let formatted_message = "";

    if (status === "Accepted") {
        formatted_message += "✅ **Invoice Accepted**\n\n";
        formatted_message += `${summary}\n\n`;
        formatted_message += "All critical details appear to be present and valid.\n\n";
        if (extracted_data && Object.keys(extracted_data).length > 0) {
            formatted_message += "**Extracted Details:**\n";
            formatted_message += "```json\n";
            formatted_message += JSON.stringify(extracted_data, null, 2);
            formatted_message += "\n```";
        }
        formatted_message += "\n\n💬 Feel free to ask me any questions about this validation or the extracted data!";
    } else { // status === "Rejected"
        formatted_message += "❌ **Invoice Rejected**\n\n";
        formatted_message += `${summary}\n\n`;
        if (extracted_data && Object.keys(extracted_data).length > 0) {
            formatted_message += "**Extracted Details (for context):**\n";
            formatted_message += "```json\n";
            formatted_message += JSON.stringify(extracted_data, null, 2);
            formatted_message += "\n```\n";
        }

        if (issues && issues.length > 0) {
            formatted_message += "**Issues Found:**\n";
            for (const issue of issues) {
                formatted_message += `- ${issue}\n`;
            }
        } else {
            formatted_message += "*No specific issues provided by mock AI.*\n";
        }

        formatted_message += "\n\n💬 Ask me questions like 'Why was this rejected?' or 'How can I fix these issues?'";
    }
    return formatted_message;
}



import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // <--- REMOVE THIS LINE
import { mockApi } from './mockApi'; // <--- ADD THIS LINE
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import './index.css'; // Import global styles

function App() {
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [errorLoadingSessions, setErrorLoadingSessions] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    setErrorLoadingSessions(null);
    try {
      // const res = await axios.get('http://localhost:5050/sessions'); // <--- ORIGINAL LINE
      const res = await mockApi.getSessions(); // <--- MOCKED CALL
      const fetchedSessions = res.data;
      setSessions(fetchedSessions);
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
      // const res = await axios.post('http://localhost:5050/sessions', { title: 'New Chat' }); // <--- ORIGINAL LINE
      const res = await mockApi.createSession('New Chat'); // <--- MOCKED CALL
      const newSession = res.data;

      // await axios.post(`http://localhost:5050/sessions/${newSession._id}/welcome`); // <--- ORIGINAL LINE (if you had this)
      await mockApi.sendWelcomeMessage(newSession._id); // <--- MOCKED CALL

      setSessions(prev => [newSession, ...prev]);
      setSelectedSession(newSession);
    } catch (error) {
      console.error('Error creating new chat:', error.response?.data || error.message);
      alert(`Failed to create new chat: ${error.response?.data?.error || error.message}`);
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



import React, { useState, useEffect, useRef, useCallback } from 'react';
// import axios from 'axios'; // <--- REMOVE THIS LINE
import { mockApi } from './mockApi'; // <--- ADD THIS LINE
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import UploadModal from './UploadModal';

function ChatWindow({ sessionId, sessionTitle, onMessageSentOrUploaded }) {
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const messagesEndRef = useRef(null);

  const fetchChatHistory = useCallback(async () => {
    if (!sessionId) {
      setChatHistory([]);
      return;
    }

    setLoadingHistory(true);
    setUploadStatus('');
    try {
      // const res = await axios.get(`http://localhost:5050/sessions/${sessionId}/messages`); // <--- ORIGINAL LINE
      const res = await mockApi.getMessagesForSession(sessionId); // <--- MOCKED CALL
      setChatHistory(res.data);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setChatHistory([{ role: 'system', content: `_Error loading chat history:_ ${error.message}.` }]);
    } finally {
      setLoadingHistory(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchChatHistory();
  }, [sessionId, fetchChatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const sendPrompt = async () => {
    if (!prompt.trim() || !sessionId) {
      return;
    }

    const userMessage = { role: 'user', content: prompt, createdAt: new Date().toISOString() };
    setChatHistory(prevHistory => [...prevHistory, userMessage]);
    setPrompt('');

    try {
      // const res = await axios.post(`http://localhost:5050/sessions/${sessionId}/llm_chat`, { content: userMessage.content }); // <--- ORIGINAL LINE
      const res = await mockApi.sendLlmChat(sessionId, userMessage.content); // <--- MOCKED CALL
      const assistantReply = res.data.response;
      setChatHistory(prevHistory => [...prevHistory, { role: 'assistant', content: assistantReply, createdAt: new Date().toISOString() }]);
      onMessageSentOrUploaded();
    } catch (error) {
      console.error('Error sending prompt:', error);
      setChatHistory(prevHistory => [...prevHistory, { role: 'error', content: `_Failed to get a response:_ ${error.response?.data?.error || error.message}.` }]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file || !sessionId) {
      return;
    }

    setShowUploadModal(false);
    setUploadStatus('Uploading file...');
    const uploadSystemMessage = { role: 'system', content: `_Uploading file:_ **${file.name}**...`, createdAt: new Date().toISOString() };
    setChatHistory(prevHistory => [...prevHistory, uploadSystemMessage]);

    const formData = new FormData();
    formData.append('invoice', file);
    formData.append('session_id', sessionId);

    try {
      // const res = await axios.post('http://localhost:5050/upload', formData, { ... }); // <--- ORIGINAL LINE
      await mockApi.uploadInvoice(formData); // <--- MOCKED CALL (mockApi handles creating the subsequent messages)

      setUploadStatus('Processing invoice...');
      // After mock upload, fetch the updated mock history to display new messages generated by mockApi
      await fetchChatHistory();
      setUploadStatus('');
      onMessageSentOrUploaded(); // Trigger sidebar refresh
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('');
      setChatHistory(prevHistory => [
          ...prevHistory.filter(msg => !msg.content.includes(`_Uploading file:_ **${file.name}**...`)),
          { role: 'error', content: `❌ _File upload failed:_ ${error.response?.data?.error || error.message}`, createdAt: new Date().toISOString() }
      ]);
    }
  };

  const renderMessageContent = (message) => {
    if (message.role === 'assistant' && message.metadata && Object.keys(message.metadata).length > 0) {
      const extractedData = message.metadata.extracted_data || {};
      return (
        <div>
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{message.content}</ReactMarkdown>
          {extractedData && Object.keys(extractedData).length > 0 && (
            <div className="invoice-preview-container">
              <h4>Extracted Details Preview:</h4>
              {Object.entries(extractedData).map(([key, value]) => (
                <div key={key} className="invoice-preview-field">
                  <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:</strong> {String(value)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return <ReactMarkdown rehypePlugins={[rehypeRaw]}>{message.content}</ReactMarkdown>;
  };

  return (
    <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', background: '#f0f2f5' }}>
      <h2 style={{ marginBottom: 20, color: '#333', textAlign: 'center' }}>
        {sessionTitle || 'New Chat'}
      </h2>

      {loadingHistory && <p style={{ textAlign: 'center', color: '#666' }}>Loading chat history...</p>}

      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginBottom: 10,
        padding: '0 10px',
      }}>
        {chatHistory.length === 0 && !loadingHistory ? (
          <p style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>
            No messages in this chat yet. Start typing or upload an invoice!
          </p>
        ) : (
          chatHistory.map((msg, index) => (
            <div
              key={msg._id || index}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '15px',
              }}
            >
              <div
                style={{
                  maxWidth: '75%',
                  padding: '12px 18px',
                  borderRadius: '20px',
                  lineHeight: '1.5',
                  background: msg.role === 'user' ? '#007bff' : (msg.role === 'assistant' ? '#e9ecef' : '#d1ecf1'),
                  color: msg.role === 'user' ? 'white' : '#333',
                  marginLeft: msg.role === 'user' ? 'auto' : '0',
                  marginRight: msg.role === 'user' ? '0' : 'auto',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  wordBreak: 'break-word'
                }}
              >
                <div style={{
                    fontSize: '0.8em',
                    fontWeight: 'bold',
                    marginBottom: '5px',
                    color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : '#666',
                    textAlign: msg.role === 'user' ? 'right' : 'left'
                }}>
                  {msg.role === 'user' ? 'You' : (msg.role === 'assistant' ? 'AI' : 'System')}
                  {msg.createdAt && (
                     <span style={{ marginLeft: '10px', fontWeight: 'normal', fontSize: '0.8em', color: msg.role === 'user' ? 'rgba(255,255,255,0.5)' : '#999' }}>
                       {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                  )}
                </div>
                {renderMessageContent(msg)}
              </div>
            </div>
          ))
        )}
        {uploadStatus && (
          <div style={{ textAlign: 'center', color: '#6c757d', marginBottom: '10px' }}>
            {uploadStatus}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        display: 'flex',
        padding: '15px 10px',
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
        alignItems: 'center',
      }}>
        <button
          onClick={() => sessionId && setShowUploadModal(true)}
          disabled={!sessionId || uploadStatus}
          style={{
            padding: '10px 18px',
            backgroundColor: !sessionId || uploadStatus ? '#ccc' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: !sessionId || uploadStatus ? 'not-allowed' : 'pointer',
            marginRight: '10px',
            fontSize: '1em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          📎 Attach Invoice
        </button>

        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              sendPrompt();
            }
          }}
          placeholder={sessionId ? "Ask a follow-up question..." : "Select a chat to start typing..."}
          disabled={!sessionId || uploadStatus}
          style={{
            flex: 1,
            padding: '10px 15px',
            borderRadius: '25px',
            border: '1px solid #ddd',
            marginRight: '10px',
            fontSize: '1em',
            outline: 'none',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
          }}
        />
        <button
          onClick={sendPrompt}
          disabled={!sessionId || !prompt.trim() || uploadStatus}
          style={{
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '1em',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          }}
        >
          Send
        </button>
      </div>

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onFileUpload={handleFileUpload}
          isUploading={!!uploadStatus}
        />
      )}
    </div>
  );
}

export default ChatWindow;
