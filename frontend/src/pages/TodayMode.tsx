import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiPlus, FiEdit2, FiTrash2, FiAlertCircle, FiCheck, FiUser, FiCalendar } from 'react-icons/fi';
import { supabase } from '../services/supabase';

// Type definitions
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  priority: 'p0' | 'p1' | 'p2' | 'p3';
  due_date?: string;
  assignee_id?: string;
  assignee_name?: string;
  tags?: string[];
  created_at?: string;
  user_id?: string;
  campaign_id?: string;
  is_blocker?: boolean;
  blocker_reason?: string;
}

// Form state interface
interface TaskForm {
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  priority: 'p0' | 'p1' | 'p2' | 'p3';
  dueDate: string;
  tags: string;
  campaignId: string;
  isBlocker: boolean;
  blockerReason: string;
}

interface Campaign {
  id: string;
  title: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
}

interface DailyIntention {
  id?: string;
  intention: string;
  date: string;
  user_id?: string;
  created_at?: string;
}

// Styled components
const PageContainer = styled.div`
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TodayDate = styled.div`
  font-size: 1rem;
  color: #666;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: #5c6bc0;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background: #4a5ab9;
  }
`;

const IntentionSection = styled.div`
  margin-bottom: 1.5rem;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 1.5rem;
`;

const IntentionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const IntentionInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #5c6bc0;
  }
`;

const IntentionSaveButton = styled.button`
  margin-top: 0.75rem;
  padding: 0.6rem 1rem;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background: #43a047;
  }
`;

const TasksSection = styled.div`
  margin-top: 2rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
`;

const TaskCount = styled.span`
  background: #e0e0e0;
  color: #555;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  margin-left: 0.5rem;
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TaskCard = styled.div<{ priority: string; isComplete: boolean }>`
  background: white;
  border-radius: 6px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 3px solid ${({ priority }) => 
    priority === 'p0' ? '#e74c3c' : 
    priority === 'p1' ? '#f39c12' : 
    priority === 'p2' ? '#3498db' : 
    '#7f8c8d'
  };
  opacity: ${({ isComplete }) => isComplete ? 0.7 : 1};
  text-decoration: ${({ isComplete }) => isComplete ? 'line-through' : 'none'};
`;

const TaskHeader = styled.div`
  display: flex;
  justify-content: space-between;
`;

const TaskTitle = styled.h3`
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
`;

const TaskCheckbox = styled.div`
  cursor: pointer;
`;

const TaskMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #777;
  margin-top: 0.5rem;
`;

const TaskTags = styled.div`
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
`;

const TaskTag = styled.span`
  background: #eef2ff;
  color: #5c6bc0;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-size: 0.7rem;
`;

const CampaignTag = styled(TaskTag)`
  background: #e3f2fd;
  color: #1976d2;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const BlockerTag = styled(TaskTag)`
  background: #ffebee;
  color: #d32f2f;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const TaskActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #777;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  
  &:hover {
    color: #5c6bc0;
  }
`;

const BlockerButton = styled(ActionButton)<{ isBlocker: boolean }>`
  color: ${({ isBlocker }) => isBlocker ? '#d32f2f' : '#777'};
  
  &:hover {
    color: ${({ isBlocker }) => isBlocker ? '#b71c1c' : '#5c6bc0'};
  }
`;

const BlockerReason = styled.div`
  font-size: 0.8rem;
  color: #d32f2f;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #ffebee;
  border-radius: 4px;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #777;
  
  &:hover {
    color: #333;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #5c6bc0;
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #5c6bc0;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #5c6bc0;
  }
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const CheckboxInput = styled.input`
  width: 18px;
  height: 18px;
  margin: 0;
`;

const Button = styled.button`
  padding: 0.75rem 1rem;
  background: #5c6bc0;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background: #4a5ab9;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const KickoffModal = styled(Modal)`
  z-index: 1001;
`;

const ReviewSection = styled.div`
  margin-bottom: 1.5rem;
`;

const ReviewTitle = styled.h3`
  font-size: 1rem;
  margin: 0 0 0.75rem 0;
`;

const TaskPreview = styled.div`
  background: #f5f7fa;
  border-radius: 4px;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
`;

const TodayMode: React.FC = () => {
  // State for tasks and UI
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBlockerModal, setShowBlockerModal] = useState(false);
  const [showKickoffModal, setShowKickoffModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<TaskForm>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'p2',
    dueDate: new Date().toISOString().split('T')[0], // Default to today
    tags: '',
    campaignId: '',
    isBlocker: false,
    blockerReason: ''
  });
  const [intention, setIntention] = useState('');
  const [intentionId, setIntentionId] = useState<string | null>(null);
  const [intentionSaved, setIntentionSaved] = useState(false);
  const [isSavingIntention, setIsSavingIntention] = useState(false);
  const [blockerTask, setBlockerTask] = useState<Task | null>(null);

  // Get today's date in readable format
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Fetch tasks and campaigns on component mount
  useEffect(() => {
    fetchData();
    checkShowKickoff();
  }, []);

  // Check if we should show the kickoff modal (once per day)
  const checkShowKickoff = () => {
    const today = new Date().toISOString().split('T')[0];
    const lastKickoff = localStorage.getItem('lastDailyKickoff');
    
    if (lastKickoff !== today) {
      setShowKickoffModal(true);
    }
  };

  // Function to fetch data from Supabase
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch today's tasks
      const today = new Date().toISOString().split('T')[0];
      
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .or(`due_date.eq.${today},status.eq.todo,status.eq.in_progress,status.eq.blocked`)
        .order('created_at', { ascending: false });
        
      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        return;
      }
      
      if (tasksData) {
        setTodayTasks(tasksData);
      }
      
      // Fetch campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id, title, status')
        .order('start_date', { ascending: false });
        
      if (campaignsError) {
        console.error('Error fetching campaigns:', campaignsError);
      } else if (campaignsData) {
        setCampaigns(campaignsData);
      }
      
      // Fetch today's intention
      const { data: intentionData, error: intentionError } = await supabase
        .from('daily_intentions')
        .select('*')
        .eq('date', today)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (intentionError) {
        console.error('Error fetching intention:', intentionError);
      } else if (intentionData && intentionData.length > 0) {
        setIntention(intentionData[0].intention);
        setIntentionId(intentionData[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save today's intention
  const saveIntention = async () => {
    try {
      setIsSavingIntention(true);
      const today = new Date().toISOString().split('T')[0];
      
      if (intentionId) {
        // Update existing intention
        const { error } = await supabase
          .from('daily_intentions')
          .update({ intention })
          .eq('id', intentionId);
          
        if (error) throw error;
        
        setIntentionSaved(true);
        setTimeout(() => setIntentionSaved(false), 3000);
      } else {
        // Create new intention
        const { data, error } = await supabase
          .from('daily_intentions')
          .insert([{ intention, date: today }])
          .select();
          
        if (error) throw error;
        if (data && data.length > 0) {
          setIntentionId(data[0].id);
          setIntentionSaved(true);
          setTimeout(() => setIntentionSaved(false), 3000);
        }
      }
    } catch (error) {
      console.error('Error saving intention:', error);
      alert('Failed to save your intention. Please try again.');
    } finally {
      setIsSavingIntention(false);
    }
  };

  // Toggle task status
  const toggleTaskStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'done' ? 'todo' : 'done';
      
      const { data, error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id)
        .select();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setTodayTasks(todayTasks.map(t => 
          t.id === task.id ? data[0] : t
        ));
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  // Toggle blocker status
  const toggleBlocker = async (task: Task) => {
    if (!task.is_blocker) {
      // Open blocker modal when setting as blocker
      setBlockerTask(task);
      setShowBlockerModal(true);
    } else {
      // Directly remove blocker status
      try {
        const { data, error } = await supabase
          .from('tasks')
          .update({ 
            is_blocker: false,
            blocker_reason: null
          })
          .eq('id', task.id)
          .select();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setTodayTasks(todayTasks.map(t => 
            t.id === task.id ? data[0] : t
          ));
        }
      } catch (error) {
        console.error('Error updating blocker status:', error);
      }
    }
  };

  // Set blocker reason
  const setBlockerReason = async (reason: string) => {
    if (!blockerTask) return;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ 
          is_blocker: true,
          blocker_reason: reason
        })
        .eq('id', blockerTask.id)
        .select();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setTodayTasks(todayTasks.map(t => 
          t.id === blockerTask.id ? data[0] : t
        ));
        setShowBlockerModal(false);
        setBlockerTask(null);
      }
    } catch (error) {
      console.error('Error setting blocker reason:', error);
    }
  };

  // Function to add a new task
  const addTask = async () => {
    try {
      const { title, description, status, priority, dueDate, tags, campaignId, isBlocker, blockerReason } = formData;
      
      const parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      // Create task object
      const newTask = {
        title,
        description: description || null,
        status,
        priority,
        due_date: dueDate || null,
        tags: parsedTags.length > 0 ? parsedTags : null,
        campaign_id: campaignId || null,
        is_blocker: isBlocker,
        blocker_reason: isBlocker ? blockerReason : null
      };
      
      // Insert task to database
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select();
        
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      if (data) {
        setTodayTasks([data[0], ...todayTasks]);
        closeModal();
      }
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Error adding task. Check console for details.');
    }
  };

  // Function to update an existing task
  const updateTask = async () => {
    if (!editingTask) return;
    
    try {
      const { title, description, status, priority, dueDate, tags, campaignId, isBlocker, blockerReason } = formData;
      
      const parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      // Update task in database
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title,
          description,
          status,
          priority,
          due_date: dueDate || null,
          tags: parsedTags.length > 0 ? parsedTags : null,
          campaign_id: campaignId || null,
          is_blocker: isBlocker,
          blocker_reason: isBlocker ? blockerReason : null
        })
        .eq('id', editingTask.id)
        .select();
        
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      if (data) {
        setTodayTasks(todayTasks.map(task => 
          task.id === editingTask.id ? data[0] : task
        ));
        closeModal();
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task. Check console for details.');
    }
  };

  // Function to delete a task
  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
        
      if (error) {
        throw error;
      }
      
      setTodayTasks(todayTasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
      updateTask();
    } else {
      addTask();
    }
  };

  // Open modal for adding a new task
  const openAddModal = () => {
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'p2',
      dueDate: new Date().toISOString().split('T')[0], // Default to today
      tags: '',
      campaignId: '',
      isBlocker: false,
      blockerReason: ''
    });
    setEditingTask(null);
    setShowAddModal(true);
  };

  // Open modal for editing a task
  const openEditModal = (task: Task) => {
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date || '',
      tags: task.tags ? task.tags.join(', ') : '',
      campaignId: task.campaign_id || '',
      isBlocker: task.is_blocker || false,
      blockerReason: task.blocker_reason || ''
    });
    setEditingTask(task);
    setShowAddModal(true);
  };

  // Close the modal
  const closeModal = () => {
    setShowAddModal(false);
    setShowBlockerModal(false);
    setEditingTask(null);
    setBlockerTask(null);
  };

  // Handle kickoff completion
  const completeKickoff = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('lastDailyKickoff', today);
    setShowKickoffModal(false);
  };

  // Filter tasks for specific sections
  const getActiveTasks = () => todayTasks.filter(task => !task.is_blocker && task.status !== 'done');
  const getBlockerTasks = () => todayTasks.filter(task => task.is_blocker && task.status !== 'done');
  const getCompletedTasks = () => todayTasks.filter(task => task.status === 'done');

  // Get campaign name by id
  const getCampaignName = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign ? campaign.title : 'Unknown Campaign';
  };

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle>
            <FiCalendar /> Today
          </PageTitle>
          <TodayDate>{formattedDate}</TodayDate>
        </div>
        <AddButton onClick={openAddModal}>
          <FiPlus /> Add Task
        </AddButton>
      </PageHeader>
      
      <IntentionSection>
        <IntentionTitle>Today's Intention</IntentionTitle>
        <IntentionInput 
          placeholder="What's your main focus for today? (e.g., Finish project proposal, Solve key bug)"
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
        />
        <IntentionSaveButton 
          onClick={saveIntention} 
          disabled={isSavingIntention}
        >
          {isSavingIntention ? 'Saving...' : intentionSaved ? 'Saved!' : 'Save Intention'}
        </IntentionSaveButton>
      </IntentionSection>
      
      {isLoading ? (
        <div>Loading today's tasks...</div>
      ) : (
        <TasksSection>
          {/* Blockers Section */}
          {getBlockerTasks().length > 0 && (
            <>
              <SectionHeader>
                <SectionTitle>
                  Blockers <TaskCount>{getBlockerTasks().length}</TaskCount>
                </SectionTitle>
              </SectionHeader>
              <TaskList>
                {getBlockerTasks().map(task => (
                  <TaskCard key={task.id} priority={task.priority} isComplete={false}>
                    <TaskHeader>
                      <TaskTitle>{task.title}</TaskTitle>
                      <TaskCheckbox onClick={() => toggleTaskStatus(task)}>
                        {task.status === 'done' ? <FiCheck size={20} color="#4caf50" /> : <div style={{ width: 20, height: 20, border: '2px solid #ccc', borderRadius: 4 }} />}
                      </TaskCheckbox>
                    </TaskHeader>
                    
                    {task.description && <div>{task.description}</div>}
                    
                    {task.blocker_reason && (
                      <BlockerReason>
                        <strong>Blocker:</strong> {task.blocker_reason}
                      </BlockerReason>
                    )}
                    
                    <TaskMeta>
                      <TaskTags>
                        <BlockerTag>
                          <FiAlertCircle size={10} />
                          Blocker
                        </BlockerTag>
                        {task.campaign_id && (
                          <CampaignTag>
                            <span role="img" aria-label="campaign">📅</span> 
                            {getCampaignName(task.campaign_id)}
                          </CampaignTag>
                        )}
                        {task.tags?.map(tag => (
                          <TaskTag key={tag}>{tag}</TaskTag>
                        ))}
                      </TaskTags>
                      
                      {task.due_date && (
                        <div>
                          {(() => {
                            const [year, month, day] = task.due_date.split('-').map(Number);
                            return new Date(year, month - 1, day).toLocaleDateString();
                          })()}
                        </div>
                      )}
                    </TaskMeta>
                    
                    <TaskActions>
                      <BlockerButton 
                        onClick={() => toggleBlocker(task)} 
                        isBlocker={task.is_blocker || false}
                        title={task.is_blocker ? "Remove blocker" : "Mark as blocker"}
                      >
                        <FiAlertCircle size={16} />
                      </BlockerButton>
                      <ActionButton onClick={() => openEditModal(task)} title="Edit Task">
                        <FiEdit2 size={16} />
                      </ActionButton>
                      <ActionButton onClick={() => deleteTask(task.id)} title="Delete Task">
                        <FiTrash2 size={16} />
                      </ActionButton>
                    </TaskActions>
                  </TaskCard>
                ))}
              </TaskList>
            </>
          )}
          
          {/* Active Tasks */}
          <SectionHeader style={{ marginTop: getBlockerTasks().length > 0 ? '2rem' : 0 }}>
            <SectionTitle>
              Tasks <TaskCount>{getActiveTasks().length}</TaskCount>
            </SectionTitle>
          </SectionHeader>
          <TaskList>
            {getActiveTasks().map(task => (
              <TaskCard key={task.id} priority={task.priority} isComplete={task.status === 'done'}>
                <TaskHeader>
                  <TaskTitle>{task.title}</TaskTitle>
                  <TaskCheckbox onClick={() => toggleTaskStatus(task)}>
                    {task.status === 'done' ? <FiCheck size={20} color="#4caf50" /> : <div style={{ width: 20, height: 20, border: '2px solid #ccc', borderRadius: 4 }} />}
                  </TaskCheckbox>
                </TaskHeader>
                
                {task.description && <div>{task.description}</div>}
                
                <TaskMeta>
                  <TaskTags>
                    {task.campaign_id && (
                      <CampaignTag>
                        <span role="img" aria-label="campaign">📅</span> 
                        {getCampaignName(task.campaign_id)}
                      </CampaignTag>
                    )}
                    {task.tags?.map(tag => (
                      <TaskTag key={tag}>{tag}</TaskTag>
                    ))}
                  </TaskTags>
                  
                  {task.due_date && (
                    <div>
                      {(() => {
                        const [year, month, day] = task.due_date.split('-').map(Number);
                        return new Date(year, month - 1, day).toLocaleDateString();
                      })()}
                    </div>
                  )}
                </TaskMeta>
                
                <TaskActions>
                  <BlockerButton 
                    onClick={() => toggleBlocker(task)} 
                    isBlocker={task.is_blocker || false}
                    title={task.is_blocker ? "Remove blocker" : "Mark as blocker"}
                  >
                    <FiAlertCircle size={16} />
                  </BlockerButton>
                  <ActionButton onClick={() => openEditModal(task)} title="Edit Task">
                    <FiEdit2 size={16} />
                  </ActionButton>
                  <ActionButton onClick={() => deleteTask(task.id)} title="Delete Task">
                    <FiTrash2 size={16} />
                  </ActionButton>
                </TaskActions>
              </TaskCard>
            ))}
          </TaskList>
          
          {/* Completed Tasks */}
          {getCompletedTasks().length > 0 && (
            <>
              <SectionHeader style={{ marginTop: '2rem' }}>
                <SectionTitle>
                  Completed <TaskCount>{getCompletedTasks().length}</TaskCount>
                </SectionTitle>
              </SectionHeader>
              <TaskList>
                {getCompletedTasks().map(task => (
                  <TaskCard key={task.id} priority={task.priority} isComplete={true}>
                    <TaskHeader>
                      <TaskTitle>{task.title}</TaskTitle>
                      <TaskCheckbox onClick={() => toggleTaskStatus(task)}>
                        <FiCheck size={20} color="#4caf50" />
                      </TaskCheckbox>
                    </TaskHeader>
                    
                    <TaskMeta>
                      <TaskTags>
                        {task.campaign_id && (
                          <CampaignTag>
                            <span role="img" aria-label="campaign">📅</span> 
                            {getCampaignName(task.campaign_id)}
                          </CampaignTag>
                        )}
                      </TaskTags>
                    </TaskMeta>
                  </TaskCard>
                ))}
              </TaskList>
            </>
          )}
        </TasksSection>
      )}
      
      {/* Add/Edit Task Modal */}
      {showAddModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </ModalTitle>
              <CloseButton onClick={closeModal}>&times;</CloseButton>
            </ModalHeader>
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="title">Title</Label>
                <Input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Done</option>
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                >
                  <option value="p0">P0 - Critical</option>
                  <option value="p1">P1 - High</option>
                  <option value="p2">P2 - Medium</option>
                  <option value="p3">P3 - Low</option>
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="design, website, bug"
                />
              </FormGroup>
              
              <Checkbox>
                <CheckboxInput
                  type="checkbox"
                  id="isBlocker"
                  name="isBlocker"
                  checked={formData.isBlocker}
                  onChange={handleCheckboxChange}
                />
                <Label htmlFor="isBlocker" style={{ marginBottom: 0 }}>This task is blocking progress</Label>
              </Checkbox>
              
              {formData.isBlocker && (
                <FormGroup>
                  <Label htmlFor="blockerReason">What's blocking this?</Label>
                  <Input
                    type="text"
                    id="blockerReason"
                    name="blockerReason"
                    value={formData.blockerReason}
                    onChange={handleInputChange}
                    placeholder="e.g., Waiting for design feedback, API not working"
                    required={formData.isBlocker}
                  />
                </FormGroup>
              )}
              
              {campaigns.length > 0 && (
                <FormGroup>
                  <Label htmlFor="campaignId">Linked Campaign</Label>
                  <Select
                    id="campaignId"
                    name="campaignId"
                    value={formData.campaignId}
                    onChange={handleInputChange}
                  >
                    <option value="">No Campaign</option>
                    {campaigns.map(campaign => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.title} ({campaign.status})
                      </option>
                    ))}
                  </Select>
                </FormGroup>
              )}
              
              <Button type="submit">
                {editingTask ? 'Update Task' : 'Add Task'}
              </Button>
            </Form>
          </ModalContent>
        </Modal>
      )}
      
      {/* Blocker Reason Modal */}
      {showBlockerModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>What's Blocking This Task?</ModalTitle>
              <CloseButton onClick={closeModal}>&times;</CloseButton>
            </ModalHeader>
            <Form onSubmit={(e) => {
              e.preventDefault();
              setBlockerReason(formData.blockerReason);
            }}>
              <FormGroup>
                <Label htmlFor="blockerReasonInput">Tell us what's in the way:</Label>
                <Input
                  type="text"
                  id="blockerReasonInput"
                  value={formData.blockerReason}
                  onChange={(e) => setFormData({...formData, blockerReason: e.target.value})}
                  placeholder="e.g., Waiting for design feedback, API not working"
                  required
                />
              </FormGroup>
              
              <Button type="submit">
                Save Blocker
              </Button>
            </Form>
          </ModalContent>
        </Modal>
      )}
      
      {/* Daily Kickoff Modal */}
      {showKickoffModal && (
        <KickoffModal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Daily Kickoff</ModalTitle>
              <CloseButton onClick={completeKickoff}>&times;</CloseButton>
            </ModalHeader>
            
            <ReviewSection>
              <ReviewTitle>Your Active Tasks</ReviewTitle>
              {getActiveTasks().length === 0 ? (
                <p>No active tasks for today. Consider adding some!</p>
              ) : (
                getActiveTasks().map(task => (
                  <TaskPreview key={task.id}>
                    • {task.title}
                    {task.priority === 'p0' && ' (Critical!)'}
                  </TaskPreview>
                ))
              )}
            </ReviewSection>
            
            <Form onSubmit={(e) => {
              e.preventDefault();
              saveIntention();
              completeKickoff();
            }}>
              <FormGroup>
                <Label htmlFor="intentionInput">What's your main focus for today?</Label>
                <Textarea
                  id="intentionInput"
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                  placeholder="e.g., Complete the API integration, Finish the marketing proposal"
                  required
                  style={{ minHeight: '80px' }}
                />
              </FormGroup>
              
              <Button type="submit">
                Start My Day
              </Button>
            </Form>
          </ModalContent>
        </KickoffModal>
      )}
    </PageContainer>
  );
};

export default TodayMode;