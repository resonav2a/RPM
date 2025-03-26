import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Button from './ui/Button';

const ApiKeyContainer = styled.div`
  background: ${({ theme }) => theme.colors.ui.card};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const InputWrapper = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  
  input {
    width: 100%;
    padding: ${({ theme }) => theme.spacing.sm};
    border: 1px solid ${({ theme }) => theme.colors.ui.divider};
    border-radius: ${({ theme }) => theme.borderRadius.md};
    font-size: ${({ theme }) => theme.typography.body2.fontSize};
    margin-top: ${({ theme }) => theme.spacing.xs};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

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
    <ApiKeyContainer>
      <h3>OpenAI API Key Setup</h3>
      <p>Please enter your OpenAI API key to enable AI-powered features:</p>
      
      <InputWrapper>
        <label htmlFor="openai-api-key-input">OpenAI API Key:</label>
        <input
          id="openai-api-key-input"
          type="password"
          value={apiKey}
          onChange={handleChange}
          placeholder="sk-..."
          autoFocus
        />
        <p>Your API key is stored locally in your browser and never sent to our servers.</p>
      </InputWrapper>
      
      <ActionButtons>
        <Button 
          variant="primary" 
          onClick={saveKey} 
          disabled={!apiKey}
        >
          Save API Key
        </Button>
      </ActionButtons>
    </ApiKeyContainer>
  );
};

export default ApiKeyInput;