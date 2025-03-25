import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FiPlus, FiFilter, FiMail, FiTwitter, FiInstagram, FiLinkedin, FiFileText, FiEdit, FiTrash2, FiList, FiCheck, FiEye, FiX } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import DocumentUpload from '../components/DocumentUpload';

// Type definitions
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  priority: 'p0' | 'p1' | 'p2' | 'p3';
  due_date?: string;
  assignee_id?: string;
  tags?: string[];
  created_at?: string;
  user_id?: string;
  campaign_id?: string;
}

interface Campaign {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_all_day: boolean;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  color?: string;
  blast_mode?: boolean;
  channels?: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
  // These are computed properties, not stored in the database
  tasks?: Task[];
  completionPercentage?: number;
}

// Styled components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const TopActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const FilterButton = styled.button<{ active?: boolean }>`
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: #5c6bc0;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #4a5ab9;
  }
`;

const BlastModeToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1rem;
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background-color: #e74c3c;
  }
  
  &:checked + span:before {
    transform: translateX(24px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
`;

const ToggleLabel = styled.span<{ active?: boolean }>`
  font-weight: ${({ active }) => (active ? '600' : '400')};
  color: ${({ active }) => (active ? '#e74c3c' : '#666')};
`;

const CalendarContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  
  @media (min-width: 992px) {
    grid-template-columns: minmax(300px, 2fr) 3fr;
  }
`;

const StyledCalendar = styled.div`
  .react-calendar {
    border: none;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 1rem;
    width: 100%;
    
    .react-calendar__tile--now {
      background: #f0f2ff;
    }
    
    .react-calendar__tile--active {
      background: #5c6bc0;
      color: white;
    }
    
    .react-calendar__tile--hasContent {
      position: relative;
      
      &:after {
        content: "";
        position: absolute;
        bottom: 5px;
        left: 50%;
        transform: translateX(-50%);
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #5c6bc0;
      }
    }
  }
`;

const EventsPanel = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
`;

const EventsPanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const EventsDate = styled.h2`
  font-size: 1.25rem;
  margin: 0;
  font-weight: 600;
`;

const EventsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const EventCard = styled.div`
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  
  &:hover {
    background: #f9f9f9;
  }
`;

const EventIcon = styled.div<{ type: string }>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ type }) => 
    type === 'email' ? '#3498db' :
    type === 'social' ? '#2ecc71' :
    '#f39c12'
  };
  color: white;
`;

const EventContent = styled.div`
  flex: 1;
`;

const EventTitle = styled.h3`
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
`;

const EventDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EventMeta = styled.div`
  font-size: 0.875rem;
  color: #777;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const EventStatus = styled.span<{ status: string }>`
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  background: ${({ status }) => 
    status === 'draft' ? '#f5f5f5' :
    status === 'scheduled' ? '#e3f2fd' :
    status === 'sent' ? '#e8f5e9' :
    '#ffebee'
  };
  color: ${({ status }) => 
    status === 'draft' ? '#757575' :
    status === 'scheduled' ? '#1976d2' :
    status === 'sent' ? '#388e3c' :
    '#d32f2f'
  };
`;

const NoEvents = styled.div`
  text-align: center;
  padding: 2rem;
  color: #777;
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
  max-width: 600px;
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

const CheckboxGroup = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
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

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

// Task related styled components
const CampaignDetailModal = styled(Modal)``;

const CampaignDetailContent = styled(ModalContent)`
  width: 90%;
  max-width: 900px;
`;

const DetailTabs = styled.div`
  display: flex;
  border-bottom: 1px solid #eee;
  margin-bottom: 1.5rem;
`;

const DetailTab = styled.button<{ active?: boolean }>`
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 2px solid ${({ active }) => (active ? '#5c6bc0' : 'transparent')};
  color: ${({ active }) => (active ? '#5c6bc0' : '#666')};
  font-weight: ${({ active }) => (active ? '500' : '400')};
  cursor: pointer;
  
  &:hover {
    color: #5c6bc0;
  }
`;

const ProgressContainer = styled.div`
  margin: 1rem 0;
`;

const ProgressBar = styled.div`
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const ProgressFill = styled.div<{ percentage: number }>`
  height: 100%;
  width: ${({ percentage }) => `${percentage}%`};
  background: ${({ percentage }) => 
    percentage < 25 ? '#e74c3c' :
    percentage < 50 ? '#f39c12' :
    percentage < 75 ? '#3498db' : 
    '#2ecc71'
  };
  transition: width 0.3s ease;
`;

const TasksContainer = styled.div`
  margin-top: 1rem;
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TaskItem = styled.div<{ completed?: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #eee;
  border-radius: 4px;
  background: ${({ completed }) => completed ? '#f9fff9' : 'white'};
  gap: 0.75rem;
  
  &:hover {
    background: ${({ completed }) => completed ? '#f0fff0' : '#f9f9f9'};
  }
`;

const TaskCheckbox = styled.div<{ checked?: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid ${({ checked }) => checked ? '#2ecc71' : '#ddd'};
  background: ${({ checked }) => checked ? '#2ecc71' : 'white'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  
  &:hover {
    border-color: ${({ checked }) => checked ? '#27ae60' : '#bbb'};
  }
`;

const TaskContent = styled.div`
  flex: 1;
`;

const TaskTitle = styled.div<{ completed?: boolean }>`
  font-weight: 500;
  text-decoration: ${({ completed }) => completed ? 'line-through' : 'none'};
  color: ${({ completed }) => completed ? '#888' : '#333'};
`;

const TaskActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionIconButton = styled.button`
  background: none;
  border: none;
  color: #777;
  cursor: pointer;
  padding: 0.25rem;
  
  &:hover {
    color: #5c6bc0;
  }
`;

const AddTaskForm = styled.form`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const NewTaskInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  
  &:focus {
    outline: none;
    border-color: #5c6bc0;
  }
`;

const SortSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 0.75rem;
  
  &:focus {
    outline: none;
    border-color: #5c6bc0;
  }
`;

// Component
const Marketing: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filter, setFilter] = useState<string | null>(null);
  const [blastMode, setBlastMode] = useState<boolean>(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignTasks, setCampaignTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'documents'>('overview');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [taskSortMethod, setTaskSortMethod] = useState<'priority' | 'due_date' | 'status'>('priority');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    is_all_day: true,
    status: 'draft' as 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled',
    color: '#5c6bc0',
    channels: [] as string[]
  });
  
  // Fetch campaigns on component mount
  useEffect(() => {
    fetchCampaigns();
  }, []);
  
  // Fetch tasks for a specific campaign when it's selected
  useEffect(() => {
    if (selectedCampaign) {
      fetchCampaignTasks(selectedCampaign.id);
    }
  }, [selectedCampaign]);

  // Function to fetch campaigns from Supabase
  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      
      // Get all campaigns
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .order('start_date', { ascending: true });
        
      if (campaignError) {
        throw campaignError;
      }
      
      if (!campaignData) {
        return;
      }
      
      // Get all tasks with campaign_id
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .not('campaign_id', 'is', null);
        
      if (taskError) {
        throw taskError;
      }
      
      // Calculate completion percentage for each campaign
      const campaignsWithProgress = campaignData.map(campaign => {
        const campaignTasks = taskData?.filter(task => task.campaign_id === campaign.id) || [];
        const completedTasks = campaignTasks.filter(task => task.status === 'done');
        
        const completionPercentage = campaignTasks.length > 0 
          ? Math.round((completedTasks.length / campaignTasks.length) * 100) 
          : 0;
        
        return {
          ...campaign,
          tasks: campaignTasks,
          completionPercentage
        };
      });
      
      setCampaigns(campaignsWithProgress);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to save blast mode setting
  const toggleBlastMode = async (value: boolean) => {
    setBlastMode(value);
    
    // Update all campaigns in the current month to reflect blast mode
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ blast_mode: value })
        .gte('start_date', startOfMonth.toISOString().split('T')[0])
        .lte('end_date', endOfMonth.toISOString().split('T')[0]);
        
      if (error) {
        throw error;
      }
      
      // Refresh campaigns
      fetchCampaigns();
    } catch (error) {
      console.error('Error updating blast mode:', error);
    }
  };

  // Function to create a new campaign
  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { title, description, start_date, end_date, is_all_day, status, color, channels } = formData;
      
      const { data, error } = await supabase
        .from('campaigns')
        .insert([
          {
            title,
            description,
            start_date,
            end_date,
            is_all_day,
            status,
            color,
            blast_mode: blastMode,
            channels
          }
        ])
        .select();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setCampaigns([...campaigns, data[0]]);
        closeModal();
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Error creating campaign. Check console for details.');
    }
  };

  // Function to update a campaign
  const updateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCampaign) return;
    
    try {
      const { title, description, start_date, end_date, is_all_day, status, color, channels } = formData;
      
      const { data, error } = await supabase
        .from('campaigns')
        .update({
          title,
          description,
          start_date,
          end_date,
          is_all_day,
          status,
          color,
          blast_mode: blastMode,
          channels
        })
        .eq('id', editingCampaign.id)
        .select();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setCampaigns(campaigns.map(campaign => 
          campaign.id === editingCampaign.id ? data[0] : campaign
        ));
        closeModal();
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      alert('Error updating campaign. Check console for details.');
    }
  };

  // Function to delete a campaign
  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);
        
      if (error) {
        throw error;
      }
      
      setCampaigns(campaigns.filter(campaign => campaign.id !== campaignId));
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Error deleting campaign. Check console for details.');
    }
  };
  
  // Function to fetch tasks for a specific campaign
  const fetchCampaignTasks = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('campaign_id', campaignId);
        
      if (error) {
        throw error;
      }
      
      setCampaignTasks(data || []);
    } catch (error) {
      console.error('Error fetching campaign tasks:', error);
    }
  };
  
  // Open campaign detail modal
  const openCampaignDetail = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setActiveTab('overview');
    setShowDetailModal(true);
  };
  
  // Close campaign detail modal
  const closeCampaignDetail = () => {
    setShowDetailModal(false);
    setSelectedCampaign(null);
    setCampaignTasks([]);
  };
  
  // Create a new task for the campaign
  const createCampaignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCampaign || !newTaskTitle.trim()) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const newTask = {
        title: newTaskTitle,
        status: 'todo' as const,
        priority: 'p2' as const,
        due_date: today,
        campaign_id: selectedCampaign.id
      };
      
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setCampaignTasks([...campaignTasks, data[0]]);
        setNewTaskTitle('');
        
        // Refresh the campaign list to update progress
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };
  
  // Update task status (complete/incomplete)
  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'done' ? 'todo' : 'done';
      
      const { data, error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .select();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setCampaignTasks(
          campaignTasks.map(task => (task.id === taskId ? data[0] : task))
        );
        
        // Refresh campaign list to update progress
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };
  
  // Delete a task
  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
        
      if (error) {
        throw error;
      }
      
      setCampaignTasks(campaignTasks.filter(task => task.id !== taskId));
      
      // Refresh campaign list to update progress
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };
  
  // Sort tasks based on selected method
  const sortTasks = (tasks: Task[]) => {
    return [...tasks].sort((a, b) => {
      if (taskSortMethod === 'priority') {
        // p0 is highest priority
        return a.priority.localeCompare(b.priority);
      } else if (taskSortMethod === 'due_date') {
        // Sort by due date (most recent first)
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      } else {
        // Sort by status (todo first, done last)
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (a.status !== 'done' && b.status === 'done') return -1;
        return 0;
      }
    });
  };

  // Function to open the create campaign modal
  const openCreateModal = () => {
    // Set default dates to the selected date
    const formattedDate = selectedDate.toISOString().split('T')[0];
    
    setFormData({
      title: '',
      description: '',
      start_date: formattedDate,
      end_date: formattedDate,
      is_all_day: true,
      status: 'draft',
      color: '#5c6bc0',
      channels: []
    });
    
    setEditingCampaign(null);
    setShowModal(true);
  };

  // Function to open the edit campaign modal
  const openEditModal = (campaign: Campaign) => {
    setFormData({
      title: campaign.title,
      description: campaign.description || '',
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      is_all_day: campaign.is_all_day,
      status: campaign.status,
      color: campaign.color || '#5c6bc0',
      channels: campaign.channels || []
    });
    
    setEditingCampaign(campaign);
    setShowModal(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setShowModal(false);
    setEditingCampaign(null);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle channel checkbox changes
  const handleChannelChange = (channel: string) => {
    setFormData(prev => {
      const channels = [...prev.channels];
      
      if (channels.includes(channel)) {
        return {
          ...prev,
          channels: channels.filter(c => c !== channel)
        };
      } else {
        return {
          ...prev,
          channels: [...channels, channel]
        };
      }
    });
  };

  // Filter campaigns by selected date
  const getEventsForSelectedDate = () => {
    return campaigns.filter(campaign => {
      // Convert string dates to Date objects
      const startDate = new Date(campaign.start_date);
      const endDate = new Date(campaign.end_date);
      
      // Check if selected date is within the campaign range
      const isInRange = 
        selectedDate >= new Date(startDate.setHours(0, 0, 0, 0)) && 
        selectedDate <= new Date(endDate.setHours(23, 59, 59, 999));
      
      // Apply channel filter if active
      if (filter && campaign.channels && !campaign.channels.includes(filter)) {
        return false;
      }
      
      return isInRange;
    });
  };
  
  // Check if a date has events (for highlighting in calendar)
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    
    const hasEvents = campaigns.some(campaign => {
      const startDate = new Date(campaign.start_date);
      const endDate = new Date(campaign.end_date);
      
      return (
        date >= new Date(startDate.setHours(0, 0, 0, 0)) && 
        date <= new Date(endDate.setHours(23, 59, 59, 999))
      );
    });
    
    return hasEvents ? 'has-events' : null;
  };
  
  // Get icon for event channel
  const getEventIcon = (channels?: string[]) => {
    if (!channels || channels.length === 0) {
      return <FiFileText size={20} />;
    }
    
    const primaryChannel = channels[0];
    
    switch (primaryChannel) {
      case 'email':
        return <FiMail size={20} />;
      case 'twitter':
        return <FiTwitter size={20} />;
      case 'linkedin':
        return <FiLinkedin size={20} />;
      case 'instagram':
        return <FiInstagram size={20} />;
      default:
        return <FiFileText size={20} />;
    }
  };
  
  // Format date range for display
  const formatDateRange = (startDate: string, endDate: string, isAllDay: boolean) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      return isAllDay 
        ? start.toLocaleDateString() 
        : `${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
  };
  
  // The events for the selected date
  const eventsForDay = getEventsForSelectedDate();
  
  return (
    <PageContainer>
      <TopActions>
        <FilterContainer>
          <FilterButton 
            active={filter === null} 
            onClick={() => setFilter(null)}
          >
            <FiFilter size={16} /> All
          </FilterButton>
          <FilterButton 
            active={filter === 'email'} 
            onClick={() => setFilter('email')}
          >
            <FiMail size={16} /> Email
          </FilterButton>
          <FilterButton 
            active={filter === 'twitter'} 
            onClick={() => setFilter('twitter')}
          >
            <FiTwitter size={16} /> Twitter
          </FilterButton>
          <FilterButton 
            active={filter === 'linkedin'} 
            onClick={() => setFilter('linkedin')}
          >
            <FiLinkedin size={16} /> LinkedIn
          </FilterButton>
          <FilterButton 
            active={filter === 'instagram'} 
            onClick={() => setFilter('instagram')}
          >
            <FiInstagram size={16} /> Instagram
          </FilterButton>
          <FilterButton 
            active={filter === 'content'} 
            onClick={() => setFilter('content')}
          >
            <FiFileText size={16} /> Content
          </FilterButton>
          
          <BlastModeToggle>
            <ToggleLabel active={blastMode}>Blast Mode</ToggleLabel>
            <Toggle>
              <ToggleInput 
                type="checkbox" 
                checked={blastMode} 
                onChange={() => toggleBlastMode(!blastMode)} 
              />
              <ToggleSlider />
            </Toggle>
          </BlastModeToggle>
        </FilterContainer>
        
        <CreateButton onClick={openCreateModal}>
          <FiPlus size={16} /> New Campaign
        </CreateButton>
      </TopActions>
      
      {isLoading ? (
        <LoadingContainer>
          <p>Loading campaigns...</p>
        </LoadingContainer>
      ) : (
        <CalendarContainer>
          <StyledCalendar>
            <Calendar 
              onChange={setSelectedDate} 
              value={selectedDate} 
              tileClassName={tileContent}
            />
          </StyledCalendar>
          
          <EventsPanel>
            <EventsPanelHeader>
              <EventsDate>
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </EventsDate>
              <CreateButton onClick={openCreateModal}>
                <FiPlus size={16} /> Add to This Day
              </CreateButton>
            </EventsPanelHeader>
            
            <EventsList>
              {eventsForDay.length > 0 ? (
                eventsForDay.map(campaign => (
                  <EventCard 
                    key={campaign.id} 
                    style={{ borderLeft: `4px solid ${campaign.color || '#5c6bc0'}`, cursor: 'pointer' }}
                    onClick={() => openCampaignDetail(campaign)}
                  >
                    <EventIcon type={campaign.channels?.[0] || 'content'}>
                      {getEventIcon(campaign.channels)}
                    </EventIcon>
                    <EventContent>
                      <EventTitle>{campaign.title}</EventTitle>
                      <div>
                        {campaign.description && (
                          <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>{campaign.description}</p>
                        )}
                      </div>
                      
                      {campaign.completionPercentage !== undefined && campaign.completionPercentage > 0 && (
                        <ProgressContainer>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span>Progress</span>
                            <span>{campaign.completionPercentage}%</span>
                          </div>
                          <ProgressBar>
                            <ProgressFill percentage={campaign.completionPercentage} />
                          </ProgressBar>
                        </ProgressContainer>
                      )}
                      
                      <EventDetails>
                        <EventMeta>
                          <span>{formatDateRange(campaign.start_date, campaign.end_date, campaign.is_all_day)}</span>
                          {campaign.channels && campaign.channels.length > 0 && (
                            <span>· {campaign.channels.join(', ')}</span>
                          )}
                        </EventMeta>
                        <div>
                          <EventStatus status={campaign.status}>
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </EventStatus>
                          
                          {user && user.id === campaign.user_id && (
                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent opening details
                                  openEditModal(campaign);
                                }}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  cursor: 'pointer', 
                                  color: '#777',
                                  padding: '4px' 
                                }}
                              >
                                <FiEdit size={16} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent opening details
                                  deleteCampaign(campaign.id);
                                }}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  cursor: 'pointer', 
                                  color: '#777',
                                  padding: '4px' 
                                }}
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </EventDetails>
                    </EventContent>
                  </EventCard>
                ))
              ) : (
                <NoEvents>
                  No campaigns scheduled for this day
                </NoEvents>
              )}
            </EventsList>
          </EventsPanel>
        </CalendarContainer>
      )}
      
      {blastMode && (
        <div style={{ 
          background: 'rgba(231, 76, 60, 0.1)', 
          border: '1px solid #e74c3c',
          borderRadius: '8px',
          padding: '1rem',
          marginTop: '1rem'
        }}>
          <h3 style={{ color: '#e74c3c', marginTop: 0 }}>🔥 Blast Mode Activated</h3>
          <p>Blast mode checklist:</p>
          <ul>
            <li>Schedule at least 3 tweets per day</li>
            <li>Create 1 LinkedIn post daily</li>
            <li>Prepare 2 email campaigns for the week</li>
            <li>Schedule Instagram content every other day</li>
          </ul>
          <p><strong>Note:</strong> Blast mode is designed for high-intensity marketing periods. Use it for product launches or special campaigns.</p>
        </div>
      )}
      
      {/* Campaign Detail Modal */}
      {showDetailModal && selectedCampaign && (
        <CampaignDetailModal>
          <CampaignDetailContent>
            <ModalHeader>
              <ModalTitle>
                {selectedCampaign.title}
              </ModalTitle>
              <CloseButton onClick={closeCampaignDetail}>&times;</CloseButton>
            </ModalHeader>
            
            <DetailTabs>
              <DetailTab 
                active={activeTab === 'overview'} 
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </DetailTab>
              <DetailTab 
                active={activeTab === 'tasks'} 
                onClick={() => setActiveTab('tasks')}
              >
                Tasks
              </DetailTab>
              <DetailTab 
                active={activeTab === 'documents'} 
                onClick={() => setActiveTab('documents')}
              >
                Documents
              </DetailTab>
            </DetailTabs>
            
            {activeTab === 'overview' && (
              <div>
                <div>
                  <h3>Campaign Details</h3>
                  <p><strong>Status:</strong> {selectedCampaign.status}</p>
                  <p><strong>Date Range:</strong> {formatDateRange(selectedCampaign.start_date, selectedCampaign.end_date, selectedCampaign.is_all_day)}</p>
                  <p><strong>Channels:</strong> {selectedCampaign.channels?.join(', ') || 'None'}</p>
                  {selectedCampaign.description && (
                    <>
                      <h3>Description</h3>
                      <p>{selectedCampaign.description}</p>
                    </>
                  )}
                </div>
                
                <ProgressContainer>
                  <h3>Task Progress</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      {campaignTasks.filter(task => task.status === 'done').length} of {campaignTasks.length} tasks completed
                    </span>
                    <span>{selectedCampaign.completionPercentage}%</span>
                  </div>
                  <ProgressBar>
                    <ProgressFill percentage={selectedCampaign.completionPercentage || 0} />
                  </ProgressBar>
                </ProgressContainer>
                
                <div style={{ marginTop: '1.5rem' }}>
                  <Button onClick={() => setActiveTab('tasks')}>Manage Tasks</Button>
                  <Button 
                    onClick={() => openEditModal(selectedCampaign)} 
                    style={{ marginLeft: '0.5rem', background: '#f39c12' }}
                  >
                    Edit Campaign
                  </Button>
                  <Link to={`/roadmap/${selectedCampaign.id}`} style={{ textDecoration: 'none' }}>
                    <Button 
                      style={{ marginLeft: '0.5rem', background: '#2ecc71' }}
                    >
                      View on Roadmap
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            
            {activeTab === 'tasks' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Campaign Tasks</h3>
                  <div>
                    <label style={{ marginRight: '0.5rem' }}>Sort by:</label>
                    <SortSelect 
                      value={taskSortMethod}
                      onChange={(e) => setTaskSortMethod(e.target.value as any)}
                    >
                      <option value="priority">Priority</option>
                      <option value="due_date">Due Date</option>
                      <option value="status">Status</option>
                    </SortSelect>
                  </div>
                </div>
                
                <ProgressContainer>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      {campaignTasks.filter(task => task.status === 'done').length} of {campaignTasks.length} tasks completed
                    </span>
                    <span>{selectedCampaign.completionPercentage}%</span>
                  </div>
                  <ProgressBar>
                    <ProgressFill percentage={selectedCampaign.completionPercentage || 0} />
                  </ProgressBar>
                </ProgressContainer>
                
                <TasksContainer>
                  {campaignTasks.length > 0 ? (
                    <TaskList>
                      {sortTasks(campaignTasks).map(task => (
                        <TaskItem 
                          key={task.id}
                          completed={task.status === 'done'}
                        >
                          <TaskCheckbox 
                            checked={task.status === 'done'}
                            onClick={() => toggleTaskStatus(task.id, task.status)}
                          >
                            {task.status === 'done' && <FiCheck size={14} />}
                          </TaskCheckbox>
                          <TaskContent>
                            <TaskTitle completed={task.status === 'done'}>
                              {task.title}
                            </TaskTitle>
                            {task.description && (
                              <div style={{ fontSize: '0.9rem', marginTop: '0.25rem', color: '#666' }}>
                                {task.description}
                              </div>
                            )}
                          </TaskContent>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {task.priority === 'p0' && (
                              <span style={{ color: '#e74c3c', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                CRITICAL
                              </span>
                            )}
                            {task.due_date && (
                              <span style={{ fontSize: '0.8rem', color: '#777' }}>
                                {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                            <ActionIconButton onClick={() => deleteTask(task.id)}>
                              <FiTrash2 size={16} />
                            </ActionIconButton>
                          </div>
                        </TaskItem>
                      ))}
                    </TaskList>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                      No tasks associated with this campaign yet. Create your first task below.
                    </div>
                  )}
                  
                  <AddTaskForm onSubmit={createCampaignTask}>
                    <NewTaskInput 
                      type="text" 
                      placeholder="Add a new task for this campaign..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      required
                    />
                    <Button type="submit">Add Task</Button>
                  </AddTaskForm>
                </TasksContainer>
              </div>
            )}
            
            {activeTab === 'documents' && (
              <div>
                <h3>Campaign Documents</h3>
                <DocumentUpload 
                  entityType="campaign" 
                  entityId={selectedCampaign.id}
                  onSuccess={() => fetchCampaigns()}
                />
              </div>
            )}
          </CampaignDetailContent>
        </CampaignDetailModal>
      )}
      
      {/* Campaign Modal */}
      {showModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
              </ModalTitle>
              <CloseButton onClick={closeModal}>&times;</CloseButton>
            </ModalHeader>
            <Form onSubmit={editingCampaign ? updateCampaign : createCampaign}>
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
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormGroup>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    required
                  />
                </FormGroup>
              </div>
              
              <FormGroup>
                <CheckboxLabel>
                  <input
                    type="checkbox"
                    name="is_all_day"
                    checked={formData.is_all_day}
                    onChange={handleInputChange}
                  />
                  All Day Event
                </CheckboxLabel>
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="color">Color</Label>
                <Input
                  type="color"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  style={{ height: '40px' }}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Channels</Label>
                <CheckboxGroup>
                  <CheckboxLabel>
                    <input
                      type="checkbox"
                      checked={formData.channels.includes('email')}
                      onChange={() => handleChannelChange('email')}
                    />
                    Email
                  </CheckboxLabel>
                  <CheckboxLabel>
                    <input
                      type="checkbox"
                      checked={formData.channels.includes('twitter')}
                      onChange={() => handleChannelChange('twitter')}
                    />
                    Twitter
                  </CheckboxLabel>
                  <CheckboxLabel>
                    <input
                      type="checkbox"
                      checked={formData.channels.includes('linkedin')}
                      onChange={() => handleChannelChange('linkedin')}
                    />
                    LinkedIn
                  </CheckboxLabel>
                  <CheckboxLabel>
                    <input
                      type="checkbox"
                      checked={formData.channels.includes('instagram')}
                      onChange={() => handleChannelChange('instagram')}
                    />
                    Instagram
                  </CheckboxLabel>
                  <CheckboxLabel>
                    <input
                      type="checkbox"
                      checked={formData.channels.includes('content')}
                      onChange={() => handleChannelChange('content')}
                    />
                    Content
                  </CheckboxLabel>
                </CheckboxGroup>
              </FormGroup>
              
              <Button type="submit">
                {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
              </Button>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </PageContainer>
  );
};

export default Marketing;