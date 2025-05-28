body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f0f2f5;
  color: #333;
}

#root {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

.app-container {
  display: flex;
  width: 100%;
  height: 100vh; /* Ensure it takes full viewport height */
}

/* Scrollbar styling (optional, for better aesthetics) */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Basic button styles */
button {
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  background-color: #007bff;
  color: white;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

button:hover:not(:disabled) {
  background-color: #0056b3;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* Input field styles */
input[type="text"],
input[type="number"],
input[type="email"],
textarea {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1em;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

input[type="text"]:focus,
input[type="number"]:focus,
input[type="email"]:focus,
textarea:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
}

/* Markdown specific styles for chat messages */
.react-markdown p {
  margin-top: 0;
  margin-bottom: 0.5em;
  line-height: 1.5;
}

.react-markdown ul,
.react-markdown ol {
  margin-top: 0;
  margin-bottom: 0.5em;
  padding-left: 20px;
}

.react-markdown li {
  margin-bottom: 0.2em;
}

.react-markdown pre {
  background-color: #e9ecef;
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
  font-family: monospace;
  font-size: 0.9em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.react-markdown code {
  background-color: #e9ecef;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}

/* Specific for invoice extracted data */
.extracted-details-json pre {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #495057;
}

/* Invoice Preview Section (optional) */
.invoice-preview-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}
.invoice-preview-container h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #444;
}
.invoice-preview-field {
  margin-bottom: 5px;
  font-size: 0.9em;
}
.invoice-preview-field strong {
  color: #555;
  min-width: 100px;
  display: inline-block;
}
