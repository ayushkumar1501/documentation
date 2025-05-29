import React, { useState, useEffect, useRef, useCallback } from 'react'; // Import useCallback
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import UploadModal from './UploadModal';

function ChatWindow({ sessionId, sessionTitle, onMessageSentOrUploaded }) {
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(''); // Status like 'Uploading...', 'Processing...'

  const messagesEndRef = useRef(null);

  // Define fetchChatHistory using useCallback so it can be used outside useEffect
  const fetchChatHistory = useCallback(async () => {
    if (!sessionId) {
      setChatHistory([]);
      return;
    }

    setLoadingHistory(true);
    setUploadStatus(''); // Clear status
    try {
      const res = await axios.get(`http://localhost:5050/sessions/${sessionId}/messages`);
      setChatHistory(res.data);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setChatHistory([{ role: 'system', content: `_Error loading chat history:_ ${error.message}.` }]);
    } finally {
      setLoadingHistory(false);
    }
  }, [sessionId]); // Dependency array: recreate if sessionId changes

  // Effect to call fetchChatHistory when sessionId changes
  useEffect(() => {
    fetchChatHistory();
  }, [sessionId, fetchChatHistory]); // Add fetchChatHistory to dependencies

  // Scroll to the bottom of the chat when history updates
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
      const res = await axios.post(`http://localhost:5050/sessions/${sessionId}/llm_chat`, {
        content: userMessage.content
      });
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
    setChatHistory(prevHistory => [...prevHistory, { role: 'system', content: `_Uploading file:_ **${file.name}**...`, createdAt: new Date().toISOString() }]);

    const formData = new FormData();
    formData.append('invoice', file);
    formData.append('session_id', sessionId);

    try {
      const res = await axios.post('http://localhost:5050/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadStatus(`Uploading file... ${percentCompleted}%`);
        }
      });

      setUploadStatus('Processing invoice...');
      // After successful upload, fetch the updated history to display new messages
      await fetchChatHistory(); // This call will now work
      setUploadStatus('');
      onMessageSentOrUploaded();
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('');
      setChatHistory(prevHistory => [
          ...prevHistory.filter(msg => !msg.content.includes(`_Uploading file:_ **${file.name}**...`)), // Be specific about which message to remove
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
