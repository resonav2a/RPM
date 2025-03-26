import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiMic, FiMicOff, FiCheck, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { textToTask, transcribeSpeech } from '../services/openai';
import { supabase } from '../services/supabase';
import Button from './ui/Button';

const VoiceToTaskContainer = styled.div`
  background: ${({ theme }) => theme.colors.ui.card};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const RecordButton = styled.button<{ $recording: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${({ $recording, theme }) => 
    $recording ? theme.colors.status.error : theme.colors.primary.main};
  color: white;
  border: none;
  cursor: pointer;
  margin: 0 auto;
  transition: all ${({ theme }) => theme.transitions.fast};
  box-shadow: ${({ $recording, theme }) => 
    $recording 
      ? `0 0 0 8px ${theme.colors.status.error}20, 0 4px 8px rgba(0, 0, 0, 0.1)` 
      : `0 4px 8px rgba(0, 0, 0, 0.1)`};
  
  &:hover {
    transform: scale(1.05);
  }
  
  &:disabled {
    background: ${({ theme }) => theme.colors.ui.disabled};
    cursor: not-allowed;
  }
`;

const RecordingStatus = styled.div`
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  min-height: 24px;
`;

const RecordingWaves = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40px;
  margin: ${({ theme }) => theme.spacing.md} 0;
  
  span {
    display: inline-block;
    width: 3px;
    margin: 0 2px;
    background: ${({ theme }) => theme.colors.primary.main};
    border-radius: ${({ theme }) => theme.borderRadius.full};
    animation: recording-wave 1.2s infinite ease-in-out;
    
    &:nth-child(1) { height: 10px; animation-delay: 0s; }
    &:nth-child(2) { height: 16px; animation-delay: 0.1s; }
    &:nth-child(3) { height: 24px; animation-delay: 0.2s; }
    &:nth-child(4) { height: 32px; animation-delay: 0.3s; }
    &:nth-child(5) { height: 24px; animation-delay: 0.4s; }
    &:nth-child(6) { height: 16px; animation-delay: 0.5s; }
    &:nth-child(7) { height: 10px; animation-delay: 0.6s; }
  }
  
  @keyframes recording-wave {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(1.5); }
  }
`;

const ResultContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.ui.divider};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.ui.backgroundAlt};
`;

const TranscriptContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px dashed ${({ theme }) => theme.colors.ui.divider};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const SuccessMessage = styled.div`
  background: ${({ theme }) => theme.colors.status.success}20;
  color: ${({ theme }) => theme.colors.status.success};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-top: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ErrorMessage = styled.div`
  background: ${({ theme }) => theme.colors.status.error}20;
  color: ${({ theme }) => theme.colors.status.error};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-top: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ApiKeyInput = styled.div`
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

const PermissionRequest = styled.div`
  background: ${({ theme }) => theme.colors.ui.backgroundAlt};
  border: 1px dashed ${({ theme }) => theme.colors.ui.divider};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
  text-align: center;
`;

interface VoiceToTaskProps {
  onTaskCreated?: () => void;
}

const VoiceToTask: React.FC<VoiceToTaskProps> = ({ onTaskCreated }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [taskResult, setTaskResult] = useState<any>(null);
  const [taskCreated, setTaskCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const timerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Check for API key on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key') || '';
    setApiKey(savedApiKey);
  }, []);
  
  // Check for microphone permission on mount
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // If we get here, permission was granted
        setHasPermission(true);
        // Stop the stream immediately since we're just checking permissions
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error('Microphone permission denied:', err);
        setHasPermission(false);
      }
    };
    
    checkMicrophonePermission();
  }, []);
  
  useEffect(() => {
    if (isRecording) {
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      // Clear timer
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      
      // Clean up any active media recorder
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const saveApiKey = () => {
    localStorage.setItem('openai_api_key', apiKey);
    setError(null);
  };
  
  const startRecording = async () => {
    try {
      // Reset state
      setError(null);
      audioChunksRef.current = [];
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        // Combine audio chunks into a single blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Process the audio
        await processAudio(audioBlob);
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setTranscript('');
      setTaskResult(null);
      setTaskCreated(false);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please check your browser permissions.');
      setHasPermission(false);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };
  
  const processAudio = async (audioBlob: Blob) => {
    try {
      // Check if we have an API key
      if (!apiKey) {
        setError('OpenAI API key is required for transcription. Please enter your API key.');
        setIsProcessing(false);
        return;
      }
      
      // Transcribe the audio using Whisper API
      const text = await transcribeSpeech(audioBlob);
      setTranscript(text);
      
      // Process the text to a task
      const taskData = await textToTask(text);
      setTaskResult(taskData);
    } catch (err) {
      console.error('Error processing audio:', err);
      setError(`Error processing audio: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  const handleCreateTask = async () => {
    if (!taskResult) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Find campaign ID based on campaign name
      let campaignId: string | null = null;
      
      if (taskResult.campaign) {
        const { data: campaignsData, error: campaignError } = await supabase
          .from('campaigns')
          .select('id, title')
          .ilike('title', `%${taskResult.campaign}%`)
          .limit(1);
          
        if (campaignError) {
          console.error('Error finding campaign:', campaignError);
          throw campaignError;
        }
          
        if (campaignsData && campaignsData.length > 0) {
          campaignId = campaignsData[0].id;
        }
      }
      
      // Create task
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: taskResult.title,
          description: taskResult.description,
          status: 'todo',
          priority: taskResult.priority,
          tags: taskResult.tags.length > 0 ? taskResult.tags : null,
          campaign_id: campaignId,
          due_date: taskResult.due_date || null
        }])
        .select();
        
      if (error) {
        console.error('Error creating task:', error);
        throw error;
      }
      
      console.log('Task created successfully:', data);
      setTaskCreated(true);
      
      // Call the callback if provided
      if (onTaskCreated) {
        onTaskCreated();
      }
      
      // Clear the form after a delay
      setTimeout(() => {
        setTranscript('');
        setTaskResult(null);
        setTaskCreated(false);
      }, 3000);
    } catch (error) {
      console.error('Error creating task:', error);
      setError(`Error creating task: ${error instanceof Error ? error.message : 'Database error'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const resetAll = () => {
    setTranscript('');
    setTaskResult(null);
    setTaskCreated(false);
    setRecordingTime(0);
    setError(null);
  };
  
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      // Stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Failed to get microphone permission:', err);
      setError('Could not access microphone. Please check your browser permissions.');
      setHasPermission(false);
    }
  };
  
  // If we need to set up the API key first
  if (!apiKey) {
    return (
      <VoiceToTaskContainer>
        <h3>Voice to Task Setup</h3>
        <p>Please enter your OpenAI API key to enable voice transcription:</p>
        
        <ApiKeyInput>
          <label htmlFor="openai-api-key">OpenAI API Key:</label>
          <input
            id="openai-api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
          />
          <p>Your API key is stored locally in your browser and never sent to our servers.</p>
          
          <ActionButtons>
            <Button variant="primary" onClick={saveApiKey} disabled={!apiKey}>
              Save API Key
            </Button>
          </ActionButtons>
        </ApiKeyInput>
      </VoiceToTaskContainer>
    );
  }
  
  // If we need microphone permission
  if (hasPermission === false) {
    return (
      <VoiceToTaskContainer>
        <h3>Microphone Access Required</h3>
        <PermissionRequest>
          <FiAlertCircle size={40} style={{ marginBottom: '16px' }} />
          <p>This feature requires microphone access to record your voice.</p>
          <Button variant="primary" onClick={requestMicrophonePermission}>
            Request Microphone Access
          </Button>
        </PermissionRequest>
      </VoiceToTaskContainer>
    );
  }
  
  return (
    <VoiceToTaskContainer>
      <h3>Voice to Task</h3>
      <p>Click the microphone button and speak your task. We'll convert it into a structured task for you.</p>
      
      <RecordButton 
        $recording={isRecording}
        onClick={toggleRecording}
        disabled={isProcessing}
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
      >
        {isRecording ? <FiMicOff size={32} /> : <FiMic size={32} />}
      </RecordButton>
      
      <RecordingStatus>
        {isRecording ? (
          `Recording... ${formatTime(recordingTime)}`
        ) : isProcessing ? (
          'Processing...'
        ) : transcript ? (
          'Transcript ready'
        ) : (
          'Click to start recording'
        )}
      </RecordingStatus>
      
      {isRecording && (
        <RecordingWaves>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </RecordingWaves>
      )}
      
      {isProcessing && (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <FiLoader size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      
      {error && (
        <ErrorMessage>
          <FiAlertCircle size={18} />
          {error}
        </ErrorMessage>
      )}
      
      {transcript && (
        <>
          <TranscriptContainer>
            <h4>Transcript:</h4>
            <p>{transcript}</p>
          </TranscriptContainer>
          
          {taskResult && (
            <ResultContainer>
              <h4>Task Preview:</h4>
              <div>
                <strong>Title:</strong> {taskResult.title}
              </div>
              <div>
                <strong>Description:</strong> {taskResult.description}
              </div>
              <div>
                <strong>Priority:</strong> {taskResult.priority === 'p0' 
                  ? 'Critical' 
                  : taskResult.priority === 'p1' 
                    ? 'High' 
                    : taskResult.priority === 'p2' 
                      ? 'Medium' 
                      : 'Low'}
              </div>
              <div>
                <strong>Tags:</strong> {taskResult.tags.join(', ') || 'None'}
              </div>
              {taskResult.campaign && (
                <div>
                  <strong>Campaign:</strong> {taskResult.campaign}
                </div>
              )}
              {taskResult.due_date && (
                <div>
                  <strong>Due Date:</strong> {taskResult.due_date}
                </div>
              )}
              
              <ActionButtons>
                <Button
                  variant="primary"
                  onClick={handleCreateTask}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <FiLoader size={16} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                      Creating...
                    </>
                  ) : 'Create Task'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={resetAll}
                >
                  Reset
                </Button>
              </ActionButtons>
              
              {taskCreated && (
                <SuccessMessage>
                  <FiCheck size={18} />
                  Task created successfully!
                </SuccessMessage>
              )}
            </ResultContainer>
          )}
        </>
      )}
    </VoiceToTaskContainer>
  );
};

export default VoiceToTask;