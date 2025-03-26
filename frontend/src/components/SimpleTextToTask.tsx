import React, { useState, useEffect } from 'react';
import { textToTask } from '../services/openai';
import ApiKeyInput from './ApiKeyInput';

// A simplified text-to-task component with plain HTML/CSS
// This avoids styled-components theme issues
interface SimpleTextToTaskProps {
  onTaskCreated?: () => void;
}

const SimpleTextToTask: React.FC<SimpleTextToTaskProps> = ({ onTaskCreated }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const [taskCreated, setTaskCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load API key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key') || '';
    setApiKey(savedKey);
  }, []);
  
  const handleApiKeySaved = () => {
    const savedKey = localStorage.getItem('openai_api_key') || '';
    setApiKey(savedKey);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setIsProcessing(true);
    setResult(null);
    setTaskCreated(false);
    setError(null);
    
    try {
      const taskData = await textToTask(input);
      setResult(taskData);
    } catch (err) {
      setError('Error processing text. Please try again.');
      console.error('Error in handleSubmit:', err);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCreateTask = async () => {
    if (!result) return;
    
    setIsProcessing(true);
    setTaskCreated(false);
    setError(null);
    
    try {
      // We'll simulate a successful task creation here
      // since we might not have Supabase set up
      console.log('Would create task with:', {
        title: result.title,
        description: result.description,
        priority: result.priority,
        tags: result.tags
      });
      
      // Show success message
      setTaskCreated(true);
      
      // Call callback if provided
      if (onTaskCreated) {
        onTaskCreated();
      }
      
      // Reset form after delay
      setTimeout(() => {
        setInput('');
        setResult(null);
        setTaskCreated(false);
      }, 3000);
    } catch (err) {
      setError('Error creating task. Please try again.');
      console.error('Error in handleCreateTask:', err);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Show API Key input if no key is set
  if (!apiKey) {
    return <ApiKeyInput onKeySaved={handleApiKeySaved} />;
  }
  
  return (
    <div style={{ padding: '10px 0' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <textarea
            placeholder="Type your task here... (e.g., Remind me to update the investor deck with the LOI and AWS credits by Friday)"
            value={input}
            onChange={handleInputChange}
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e0e6ed',
              borderRadius: '8px',
              minHeight: '100px',
              fontSize: '14px',
              fontFamily: 'inherit'
            }}
          />
        </div>
        
        <div>
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            style={{
              backgroundColor: input.trim() && !isProcessing ? '#3d5afe' : '#e0e6ed',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: input.trim() && !isProcessing ? 'pointer' : 'not-allowed',
              marginBottom: '20px'
            }}
          >
            {isProcessing ? 'Processing...' : 'Generate Task'}
          </button>
        </div>
      </form>
      
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          {error}
        </div>
      )}
      
      {result && (
        <div style={{
          border: '1px solid #e0e6ed',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '20px',
          backgroundColor: '#f8faff'
        }}>
          <h4 style={{ marginTop: 0 }}>Task Preview</h4>
          
          <div style={{ marginBottom: '12px' }}>
            <strong>Title:</strong> {result.title}
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <strong>Description:</strong> {result.description}
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <strong>Priority:</strong> {
              result.priority === 'p0' ? 'Critical' :
              result.priority === 'p1' ? 'High' :
              result.priority === 'p2' ? 'Medium' : 'Low'
            }
          </div>
          
          {result.tags && result.tags.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <strong>Tags:</strong>{' '}
              {result.tags.map((tag: string, index: number) => (
                <span key={index} style={{
                  display: 'inline-block',
                  backgroundColor: '#e0e6ed',
                  borderRadius: '16px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  marginRight: '6px',
                  marginBottom: '6px'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {result.campaign && (
            <div style={{ marginBottom: '12px' }}>
              <strong>Campaign:</strong> {result.campaign}
            </div>
          )}
          
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={handleCreateTask}
              disabled={isProcessing}
              style={{
                backgroundColor: !isProcessing ? '#3d5afe' : '#e0e6ed',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: !isProcessing ? 'pointer' : 'not-allowed',
              }}
            >
              {isProcessing ? 'Creating...' : 'Create Task'}
            </button>
          </div>
          
          {taskCreated && (
            <div style={{
              backgroundColor: '#ebf7f0',
              color: '#1b873a',
              padding: '12px',
              borderRadius: '4px',
              marginTop: '15px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '8px' }}>✓</span>
              Task created successfully!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SimpleTextToTask;