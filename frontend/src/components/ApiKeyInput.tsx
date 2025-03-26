import React, { useState } from 'react';

// Simple API key input component with plain HTML
// This avoids any styled-components or theme issues

interface ApiKeyInputProps {
  onKeySaved: () => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onKeySaved }) => {
  const [apiKey, setApiKey] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };
  
  const saveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey) {
      localStorage.setItem('openai_api_key', apiKey);
      onKeySaved();
    }
  };
  
  return (
    <div style={{
      backgroundColor: '#ffffff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '20px',
      border: '1px solid #e0e6ed'
    }}>
      <h3 style={{ marginTop: 0 }}>OpenAI API Key Setup</h3>
      <p>Please enter your OpenAI API key to enable AI-powered features:</p>
      
      <form onSubmit={saveKey}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="openai-api-key-input" style={{ display: 'block', marginBottom: '5px' }}>
            OpenAI API Key:
          </label>
          <input
            id="openai-api-key-input"
            type="password"
            value={apiKey}
            onChange={handleChange}
            placeholder="sk-..."
            autoFocus
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #e0e6ed',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
            Your API key is stored locally in your browser and never sent to our servers.
          </p>
        </div>
        
        <button
          type="submit"
          disabled={!apiKey}
          style={{
            backgroundColor: apiKey ? '#3d5afe' : '#e0e6ed',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: apiKey ? 'pointer' : 'not-allowed',
          }}
        >
          Save API Key
        </button>
      </form>
    </div>
  );
};

export default ApiKeyInput;