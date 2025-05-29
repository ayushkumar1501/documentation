import React, { useState } from 'react';

function UploadModal({ onClose, onFileUpload, isUploading }) {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        width: '400px',
        maxWidth: '90%',
        textAlign: 'center'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Upload Invoice</h3>
        <input
          type="file"
          accept=".png,.jpg,.jpeg,.pdf"
          onChange={handleFileChange}
          style={{ marginBottom: '20px', display: 'block', width: '100%' }}
        />
        {selectedFile && (
          <p style={{ fontSize: '0.9em', color: '#555', marginBottom: '15px' }}>
            Selected: <strong>{selectedFile.name}</strong>
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-around', gap: '10px' }}>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || isUploading}
            style={{
              flex: 1,
              backgroundColor: isUploading ? '#ccc' : '#28a745',
              cursor: isUploading ? 'not-allowed' : 'pointer'
            }}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
          <button
            onClick={onClose}
            disabled={isUploading}
            style={{
              flex: 1,
              backgroundColor: isUploading ? '#ccc' : '#dc3545',
              cursor: isUploading ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
        {isUploading && (
          <p style={{ marginTop: '15px', color: '#007bff', fontSize: '0.9em' }}>
            Please wait while the invoice is being processed.
          </p>
        )}
      </div>
    </div>
  );
}

export default UploadModal;
