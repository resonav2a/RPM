import React, { useState } from 'react';
import Button from './ui/Button';

// Use inline styles to avoid theme issues
const containerStyle = {
  background: '#ffffff',
  borderRadius: '1rem',
  padding: '1rem',
  marginBottom: '1.5rem',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  border: '1px solid #e0e6ed'
};

const inputWrapperStyle = {
  marginTop: '1rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.5rem',
  border: '1px solid #e0e6ed',
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
  marginTop: '0.25rem'
};

const buttonsStyle = {
  display: 'flex',
  gap: '1rem',
  marginTop: '1rem'
};

interface ApiKeyInputProps {
  onKeySaved: () => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onKeySaved }) => {
  const [apiKey, setApiKey] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };
  
  const saveKey = () => {
    if (apiKey) {
      localStorage.setItem('openai_api_key', apiKey);
      onKeySaved();
    }
  };
  
  return (
    <div style={containerStyle}>
      <h3>OpenAI API Key Setup</h3>
      <p>Please enter your OpenAI API key to enable AI-powered features:</p>
      
      <div style={inputWrapperStyle}>
        <label htmlFor="openai-api-key-input">OpenAI API Key:</label>
        <input
          id="openai-api-key-input"
          type="password"
          value={apiKey}
          onChange={handleChange}
          placeholder="sk-..."
          autoFocus
          style={inputStyle}
        />
        <p>Your API key is stored locally in your browser and never sent to our servers.</p>
      </div>
      
      <div style={buttonsStyle}>
        <Button 
          variant="primary" 
          onClick={saveKey} 
          disabled={!apiKey}
        >
          Save API Key
        </Button>
      </div>
    </div>
  );
};

export default ApiKeyInput;