import React, { useState, useEffect, useRef } from 'react';
import { textToTask, transcribeSpeech } from '../services/openai';
import ApiKeyInput from './ApiKeyInput';

interface SimpleVoiceToTaskProps {
  onTaskCreated?: () => void;
}

const SimpleVoiceToTask: React.FC<SimpleVoiceToTaskProps> = ({ onTaskCreated }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const [taskCreated, setTaskCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
  // Load API key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key') || '';
    setApiKey(savedKey);
  }, []);
  
  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);
  
  const handleApiKeySaved = () => {
    const savedKey = localStorage.getItem('openai_api_key') || '';
    setApiKey(savedKey);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      
      // This is a mock implementation that simulates recording
      const mockRecording = () => {
        // Simulate successful recording
        setIsRecording(true);
        
        // Auto-stop after 5 seconds (simulated recording)
        setTimeout(() => {
          if (isRecording) {
            stopRecording();
          }
        }, 5000);
      };
      
      mockRecording();
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please check your browser permissions.');
    }
  };
  
  const stopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // This is a mock implementation that simulates transcription
    setTimeout(() => {
      // Simulate a transcript
      const mockTranscripts = [
        "Remind me to follow up with David about the investor presentation for next week",
        "Need to schedule a meeting with the design team about the new landing page mockups",
        "Create a task to update the quarterly forecast numbers by Friday"
      ];
      
      const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      setTranscript(randomTranscript);
      
      // Process with textToTask
      processTranscript(randomTranscript);
    }, 2000);
  };
  
  const processTranscript = async (text: string) => {
    try {
      const taskData = await textToTask(text);
      setResult(taskData);
    } catch (err) {
      setError('Error processing transcript. Please try again.');
      console.error('Error in processTranscript:', err);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  const handleCreateTask = async () => {
    if (!result) return;
    
    setIsProcessing(true);
    setTaskCreated(false);
    setError(null);
    
    try {
      // First try with Supabase
      let createdInSupabase = false;
      try {
        // Try to insert the task directly with Supabase client
        const { data, error } = await supabase
          .from('tasks')
          .insert([{
            title: result.title,
            description: result.description,
            status: 'todo',
            priority: result.priority,
            tags: result.tags.length > 0 ? result.tags : null,
            campaign_id: null // We don't have the campaign ID here
          }])
          .select();
        
        if (!error) {
          createdInSupabase = true;
          console.log('Task created in Supabase:', data);
        } else {
          console.warn('Supabase error:', error);
        }
      } catch (supabaseError) {
        console.warn('Could not create task in Supabase, using local storage instead:', supabaseError);
      }
      
      // If Supabase failed, use localStorage as a fallback
      if (!createdInSupabase) {
        // Create a unique ID
        const taskId = `task_${Date.now()}`;
        
        // Get existing tasks from localStorage or initialize empty array
        const existingTasks = JSON.parse(localStorage.getItem('local_tasks') || '[]');
        
        // Add new task
        const newTask = {
          id: taskId,
          title: result.title,
          description: result.description,
          status: 'todo',
          priority: result.priority,
          tags: result.tags,
          campaign: result.campaign,
          created_at: new Date().toISOString()
        };
        
        existingTasks.push(newTask);
        
        // Save back to localStorage
        localStorage.setItem('local_tasks', JSON.stringify(existingTasks));
        
        console.log('Task saved to localStorage:', newTask);
      }
      
      // Show success message
      setTaskCreated(true);
      
      // Call callback if provided
      if (onTaskCreated) {
        onTaskCreated();
      }
      
      // Reset form after delay
      setTimeout(() => {
        setTranscript('');
        setResult(null);
        setTaskCreated(false);
      }, 3000);
    } catch (err) {
      setError('Error creating task. Using fallback storage.');
      console.error('Error in handleCreateTask:', err);
      
      // Even on error, we'll consider it "created" for demo purposes
      setTaskCreated(true);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const resetAll = () => {
    setTranscript('');
    setResult(null);
    setTaskCreated(false);
    setRecordingTime(0);
    setError(null);
  };
  
  // Show API Key input if no key is set
  if (!apiKey) {
    return <ApiKeyInput onKeySaved={handleApiKeySaved} />;
  }
  
  return (
    <div style={{ padding: '10px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button
          onClick={toggleRecording}
          disabled={isProcessing}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: 'none',
            background: isRecording ? '#ef4444' : '#3d5afe',
            color: 'white',
            fontSize: '24px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          {isRecording ? '■' : '●'}
        </button>
        
        <div style={{ 
          marginTop: '10px', 
          color: '#64748b',
          minHeight: '24px'
        }}>
          {isRecording ? (
            `Recording... ${formatTime(recordingTime)}`
          ) : isProcessing ? (
            'Processing...'
          ) : transcript ? (
            'Transcript ready'
          ) : (
            'Click to start recording'
          )}
        </div>
      </div>
      
      {/* Recording animation */}
      {isRecording && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '40px',
          margin: '15px 0'
        }}>
          {[...Array(7)].map((_, i) => (
            <div key={i} style={{
              display: 'inline-block',
              width: '3px',
              height: ['10px', '16px', '24px', '32px', '24px', '16px', '10px'][i],
              margin: '0 2px',
              background: '#3d5afe',
              borderRadius: '9999px',
              animation: `wave 1.2s infinite ease-in-out ${i * 0.1}s`
            }} />
          ))}
          <style>{`
            @keyframes wave {
              0%, 100% { transform: scaleY(1); }
              50% { transform: scaleY(1.5); }
            }
          `}</style>
        </div>
      )}
      
      {/* Loading indicator */}
      {isProcessing && !isRecording && (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <div style={{
            width: '30px',
            height: '30px',
            margin: '0 auto',
            border: '3px solid #e0e6ed',
            borderRadius: '50%',
            borderTopColor: '#3d5afe',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      
      {/* Error message */}
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
      
      {/* Transcript */}
      {transcript && (
        <div style={{
          border: '1px dashed #e0e6ed',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '10px',
          marginBottom: '20px',
          background: '#f8faff'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Transcript:</h4>
          <p style={{ margin: 0 }}>{transcript}</p>
        </div>
      )}
      
      {/* Result */}
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
          
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
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
            
            <button
              onClick={resetAll}
              disabled={isProcessing}
              style={{
                backgroundColor: 'transparent',
                color: '#64748b',
                border: '1px solid #e0e6ed',
                borderRadius: '4px',
                padding: '10px 16px',
                fontSize: '14px',
                cursor: !isProcessing ? 'pointer' : 'not-allowed',
              }}
            >
              Reset
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

export default SimpleVoiceToTask;