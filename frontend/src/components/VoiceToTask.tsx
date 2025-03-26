import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiMic, FiMicOff, FiCheck, FiLoader } from 'react-icons/fi';
import { textToTask } from '../services/openai';
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

interface VoiceToTaskProps {
  onTaskCreated?: () => void;
}

// Mock voice recognition service
const mockVoiceRecognition = () => {
  return new Promise<string>((resolve) => {
    const sampleTexts = [
      "Remind me to follow up with David about the investor presentation for next Monday's meeting",
      "Need to update the hiring plan for Q3 with the new budget allocation",
      "Schedule a design review for the new landing page concepts by Friday, mark it high priority",
      "Add a task to prepare for the quarterly review with key metrics from all departments"
    ];
    
    // Simulate transcription time
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * sampleTexts.length);
      resolve(sampleTexts[randomIndex]);
    }, 3000); // 3 seconds delay
  });
};

const VoiceToTask: React.FC<VoiceToTaskProps> = ({ onTaskCreated }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [taskResult, setTaskResult] = useState<any>(null);
  const [taskCreated, setTaskCreated] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  
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
    };
  }, [isRecording]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setIsProcessing(true);
      
      try {
        // Simulate voice recognition
        const text = await mockVoiceRecognition();
        setTranscript(text);
        
        // Process the text to a task
        const taskData = await textToTask(text);
        setTaskResult(taskData);
      } catch (error) {
        console.error('Error processing voice:', error);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingTime(0);
      setTranscript('');
      setTaskResult(null);
      setTaskCreated(false);
    }
  };
  
  const handleCreateTask = async () => {
    if (!taskResult) return;
    
    setIsProcessing(true);
    
    try {
      // Find campaign ID based on campaign name
      let campaignId: string | null = null;
      
      if (taskResult.campaign) {
        const { data: campaignsData } = await supabase
          .from('campaigns')
          .select('id, title')
          .ilike('title', `%${taskResult.campaign}%`)
          .limit(1);
          
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
          campaign_id: campaignId
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
    } finally {
      setIsProcessing(false);
    }
  };
  
  const resetAll = () => {
    setTranscript('');
    setTaskResult(null);
    setTaskCreated(false);
    setRecordingTime(0);
  };
  
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
              
              <ActionButtons>
                <Button
                  variant="primary"
                  onClick={handleCreateTask}
                  disabled={isProcessing}
                >
                  Create Task
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