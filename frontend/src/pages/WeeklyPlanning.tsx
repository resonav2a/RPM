import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiCalendar, FiMap } from 'react-icons/fi';
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
  scheduled_day?: string; // Stores the day of the week this task is scheduled for
}

interface TaskForm {
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  priority: 'p0' | 'p1' | 'p2' | 'p3';
  dueDate: string;
  assigneeId: string;
  tags: string;
  campaignId: string;
  scheduledDay: string;
}

interface Campaign {
  id: string;
  title: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
}

interface TeamMember {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
}

// Styled components
const PageContainer = styled.div`
  padding: 1rem;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 0.5rem;
  background: #f0f2f5;
  padding: 0.25rem;
  border-radius: 6px;
`;

const ViewToggleButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: ${({ active }) => active ? '#5c6bc0' : 'transparent'};
  color: ${({ active }) => active ? 'white' : '#555'};
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    background: ${({ active }) => active ? '#5c6bc0' : '#e1e5eb'};
  }
`;

const WeekContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1rem;
  margin-top: 1rem;
  height: calc(100vh - 220px);
`;

const DayColumn = styled.div`
  background: #f5f7fa;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  min-height: 300px;
`;

const DayHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const DayTitle = styled.h3<{ isToday?: boolean }>`
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: ${({ isToday }) => (isToday ? '#5c6bc0' : 'inherit')};
  display: flex;
  align-items: center;
`;

const DayDate = styled.div<{ isToday?: boolean }>`
  font-size: 0.8rem;
  margin-top: 0.25rem;
  color: ${({ isToday }) => (isToday ? '#5c6bc0' : '#666')};
  font-weight: ${({ isToday }) => (isToday ? '500' : 'normal')};
`;

const AddButton = styled.button`
  background: none;
  border: none;
  color: #777;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #5c6bc0;
  }
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  flex: 1;
`;

const TaskCard = styled.div<{ priority: string; isDragging?: boolean }>`
  background: white;
  border-radius: 6px;
  padding: 1rem;
  box-shadow: ${({ isDragging }) => 
    isDragging 
      ? '0 5px 15px rgba(0, 0, 0, 0.2)' 
      : '0 1px 3px rgba(0, 0, 0, 0.1)'
  };
  border-left: 3px solid ${({ priority }) => 
    priority === 'p0' ? '#e74c3c' : 
    priority === 'p1' ? '#f39c12' : 
    priority === 'p2' ? '#3498db' : 
    '#7f8c8d'
  };
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.1s ease;
  
  &:hover {
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  }
`;

const TaskTitle = styled.h4`
  font-size: 0.9rem;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
`;

const TaskMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #777;
`;

const TaskTags = styled.div`
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
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

const AssigneeTag = styled(TaskTag)`
  background: #e8f5e9;
  color: #2e7d32;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const TaskActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #777;
  padding: 0.25rem;
  
  &:hover {
    color: #5c6bc0;
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  align-items: center;
`;

const FilterButton = styled.button<{ active?: boolean }>`
  padding: 0.5rem 1rem;
  background: ${({ active }) => (active ? '#5c6bc0' : 'white')};
  color: ${({ active }) => (active ? 'white' : '#333')};
  border: 1px solid ${({ active }) => (active ? '#5c6bc0' : '#ddd')};
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  
  &:hover {
    background: ${({ active }) => (active ? '#4a5ab9' : '#f5f5f5')};
  }
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

const ToggleSwitch = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ToggleLabel = styled.label`
  position: relative;
  display: inline-block;
  width: 46px;
  height: 24px;
  margin: 0;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background-color: #5c6bc0;
  }
  
  &:checked + span:before {
    transform: translateX(22px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
  
  &:before {
    content: "";
    position: absolute;
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
`;

// Component
const WeeklyPlanning: React.FC = () => {
  const { campaignId } = useParams<{ campaignId?: string }>();
  const navigate = useNavigate();
  
  // State for view mode
  const [viewMode, setViewMode] = useState<'week' | 'roadmap'>('week');
  
  // State for tasks and UI
  const [tasks, setTasks] = useState<Task[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showAssigneeTasks, setShowAssigneeTasks] = useState<Record<string, boolean>>({});
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<TaskForm>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'p2',
    dueDate: '',
    assigneeId: '',
    tags: '',
    campaignId: campaignId || '',
    scheduledDay: ''
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Generate an array of the next 7 days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      name: new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date),
      date: date,
      dateString: date.toISOString().split('T')[0],
      isToday: i === 0
    };
  });

  // Function to check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Fetch tasks, campaigns, and team members on component mount
  useEffect(() => {
    fetchData();
  }, [campaignId]);

  // Function to fetch data from Supabase
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch tasks with optional campaign filter
      let query = supabase
        .from('tasks')
        .select('*, user_profiles(name)'); // Join with user profiles to get assignee name
        
      // Apply campaign filter if specified
      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }
      
      const { data: tasksData, error: tasksError } = await query.order('created_at', { ascending: false });
        
      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        return;
      }
      
      if (tasksData) {
        // Transform the data to include assignee_name
        const transformedTasks = tasksData.map((task: any) => ({
          ...task,
          assignee_name: task.user_profiles?.name || null
        }));
        setTasks(transformedTasks);
      }
      
      // Fetch campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id, title, status, start_date, end_date')
        .order('start_date', { ascending: false });
        
      if (campaignsError) {
        console.error('Error fetching campaigns:', campaignsError);
      } else if (campaignsData) {
        setCampaigns(campaignsData);
      }
      
      // Fetch team members
      const { data: teamData, error: teamError } = await supabase
        .from('user_profiles')
        .select('id, name, email, avatar_url');
        
      if (teamError) {
        console.error('Error fetching team members:', teamError);
      } else if (teamData) {
        setTeamMembers(teamData);
        
        // Initialize show/hide state for each team member
        const initialShowState: Record<string, boolean> = {};
        teamData.forEach(member => {
          initialShowState[member.id] = true;
        });
        setShowAssigneeTasks(initialShowState);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to add a new task
  const addTask = async () => {
    try {
      const { title, description, status, priority, dueDate, assigneeId, tags, campaignId, scheduledDay } = formData;
      
      const parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      // Create task object
      const newTask = {
        title,
        description: description || null,
        status,
        priority,
        due_date: dueDate || null,
        assignee_id: assigneeId || null,
        tags: parsedTags.length > 0 ? parsedTags : null,
        campaign_id: campaignId || null,
        scheduled_day: scheduledDay || null
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
        setTasks([data[0], ...tasks]);
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
      const { title, description, status, priority, dueDate, assigneeId, tags, campaignId, scheduledDay } = formData;
      
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
          assignee_id: assigneeId || null,
          tags: parsedTags.length > 0 ? parsedTags : null,
          campaign_id: campaignId || null,
          scheduled_day: scheduledDay || null
        })
        .eq('id', editingTask.id)
        .select();
        
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      if (data) {
        setTasks(tasks.map(task => 
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
      
      setTasks(tasks.filter(task => task.id !== taskId));
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
  const openAddModal = (day: string) => {
    setSelectedDay(day);
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'p2',
      dueDate: '',
      assigneeId: '',
      tags: '',
      campaignId: '',
      scheduledDay: day
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
      assigneeId: task.assignee_id || '',
      tags: task.tags ? task.tags.join(', ') : '',
      campaignId: task.campaign_id || '',
      scheduledDay: task.scheduled_day || ''
    });
    setEditingTask(task);
    setShowAddModal(true);
  };

  // Close the modal
  const closeModal = () => {
    setShowAddModal(false);
    setEditingTask(null);
    setSelectedDay(null);
  };

  // Function to get tasks for a specific day
  const getTasksForDay = (day: string) => {
    return tasks.filter(task => {
      // First apply day filter
      if (task.scheduled_day !== day) return false;
      
      // Then apply priority filter if selected
      if (selectedPriority && task.priority !== selectedPriority) return false;
      
      // Then apply assignee filter
      if (task.assignee_id && !showAssigneeTasks[task.assignee_id]) return false;
      
      return true;
    });
  };

  // Sort tasks by priority
  const sortByPriority = (tasksToSort: Task[]) => {
    const priorityOrder = { p0: 0, p1: 1, p2: 2, p3: 3 };
    return [...tasksToSort].sort((a, b) => {
      return (priorityOrder[a.priority as keyof typeof priorityOrder] - 
              priorityOrder[b.priority as keyof typeof priorityOrder]);
    });
  };

  // Get campaign name by id
  const getCampaignName = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign ? campaign.title : 'Unknown Campaign';
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.setData('taskId', task.id);
    e.currentTarget.style.opacity = '0.5';
  };

  // Handle drag end
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
    setDraggedTask(null);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Handle drop
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, day: string) => {
    e.preventDefault();
    
    if (!draggedTask) return;
    
    try {
      // Update the task's scheduled day
      const { data, error } = await supabase
        .from('tasks')
        .update({ scheduled_day: day })
        .eq('id', draggedTask.id)
        .select();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Update the local tasks state
        setTasks(tasks.map(task => 
          task.id === draggedTask.id ? { ...task, scheduled_day: day } : task
        ));
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Toggle team member task visibility
  const toggleAssigneeVisibility = (memberId: string) => {
    setShowAssigneeTasks({
      ...showAssigneeTasks,
      [memberId]: !showAssigneeTasks[memberId]
    });
  };

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <h2>Planning & Roadmap</h2>
          {campaignId && campaigns.find(c => c.id === campaignId) && (
            <div>Campaign: {getCampaignName(campaignId)}</div>
          )}
        </div>
        
        <ViewToggle>
          <ViewToggleButton 
            active={viewMode === 'week'} 
            onClick={() => setViewMode('week')}
          >
            <FiCalendar /> Weekly View
          </ViewToggleButton>
          <ViewToggleButton 
            active={viewMode === 'roadmap'} 
            onClick={() => setViewMode('roadmap')}
          >
            <FiMap /> Roadmap View
          </ViewToggleButton>
        </ViewToggle>
      </PageHeader>
      
      <FiltersContainer>
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Priority</h4>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <FilterButton 
              active={selectedPriority === null ? true : undefined} 
              onClick={() => setSelectedPriority(null)}
            >
              All
            </FilterButton>
            <FilterButton 
              active={selectedPriority === 'p0' ? true : undefined} 
              onClick={() => setSelectedPriority('p0')}
            >
              P0 - Critical
            </FilterButton>
            <FilterButton 
              active={selectedPriority === 'p1' ? true : undefined} 
              onClick={() => setSelectedPriority('p1')}
            >
              P1 - High
            </FilterButton>
            <FilterButton 
              active={selectedPriority === 'p2' ? true : undefined} 
              onClick={() => setSelectedPriority('p2')}
            >
              P2 - Medium
            </FilterButton>
            <FilterButton 
              active={selectedPriority === 'p3' ? true : undefined} 
              onClick={() => setSelectedPriority('p3')}
            >
              P3 - Low
            </FilterButton>
          </div>
        </div>
        
        {teamMembers.length > 0 && (
          <div style={{ marginLeft: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Team Members</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {teamMembers.map(member => (
                <ToggleSwitch key={member.id}>
                  <span>{member.name}</span>
                  <ToggleLabel>
                    <ToggleInput 
                      type="checkbox" 
                      checked={showAssigneeTasks[member.id]} 
                      onChange={() => toggleAssigneeVisibility(member.id)}
                    />
                    <ToggleSlider />
                  </ToggleLabel>
                </ToggleSwitch>
              ))}
            </div>
          </div>
        )}
      </FiltersContainer>
      
      {isLoading ? (
        <div>Loading weekly schedule...</div>
      ) : (
        <WeekContainer>
          {weekDays.map(day => (
            <DayColumn 
              key={day.dateString}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day.dateString)}
            >
              <DayHeader>
                <div>
                  <DayTitle isToday={day.isToday}>
                    {day.name}
                    {day.isToday && ' (Today)'}
                  </DayTitle>
                  <DayDate isToday={day.isToday}>
                    {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </DayDate>
                </div>
                <AddButton onClick={() => openAddModal(day.dateString)}>
                  <FiPlus size={18} />
                </AddButton>
              </DayHeader>
              
              <TaskList>
                {sortByPriority(getTasksForDay(day.dateString)).map(task => (
                  <TaskCard 
                    key={task.id} 
                    priority={task.priority}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                  >
                    <TaskTitle>{task.title}</TaskTitle>
                    <TaskMeta>
                      {task.assignee_name && (
                        <AssigneeTag>
                          <FiUser size={10} />
                          {task.assignee_name}
                        </AssigneeTag>
                      )}
                    </TaskMeta>
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
                    <TaskActions>
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
            </DayColumn>
          ))}
        </WeekContainer>
      )}
      
      {/* Task Modal */}
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
                <Label htmlFor="scheduledDay">Day of Week</Label>
                <Select
                  id="scheduledDay"
                  name="scheduledDay"
                  value={formData.scheduledDay}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a day</option>
                  {weekDays.map(day => (
                    <option key={day.dateString} value={day.dateString}>
                      {day.name} ({day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                    </option>
                  ))}
                </Select>
              </FormGroup>
              
              {teamMembers.length > 0 && (
                <FormGroup>
                  <Label htmlFor="assigneeId">Assignee</Label>
                  <Select
                    id="assigneeId"
                    name="assigneeId"
                    value={formData.assigneeId}
                    onChange={handleInputChange}
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </Select>
                </FormGroup>
              )}
              
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
    </PageContainer>
  );
};

export default WeeklyPlanning;