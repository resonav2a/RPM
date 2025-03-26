import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiFileText, 
  FiLink, 
  FiMessageCircle, 
  FiFilter,
  FiChevronDown,
  FiCalendar,
  FiClock,
  FiAlertOctagon,
  FiCheckCircle
} from 'react-icons/fi';
import { supabase } from '../services/supabase';
import DocumentUpload from '../components/DocumentUpload';
import TaskDependencies from '../components/TaskDependencies';
import TaskComments from '../components/TaskComments';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';

// Type definitions
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  priority: 'p0' | 'p1' | 'p2' | 'p3';
  due_date?: string;  // Snake case to match database column
  assignee_id?: string;  // Snake case to match database column
  tags?: string[];
  created_at?: string;
  user_id?: string;
  campaign_id?: string; // Foreign key to campaigns table
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
}

interface Campaign {
  id: string;
  title: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
}

// Styled components
const TasksContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 180px);
`;

const TasksHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

const FilterSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 180px;
  
  h4 {
    font-size: ${({ theme }) => theme.typography.body2.fontSize};
    font-weight: 600;
    margin: 0 0 ${({ theme }) => theme.spacing.xs} 0;
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const FiltersRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  background: ${({ $active, theme }) => 
    $active ? theme.colors.primary.main : theme.colors.ui.card};
  color: ${({ $active, theme }) => 
    $active ? theme.colors.primary.contrastText : theme.colors.text.primary};
  border: 1px solid ${({ $active, theme }) => 
    $active ? theme.colors.primary.main : theme.colors.ui.divider};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ $active, theme }) => 
      $active ? theme.colors.primary.dark : theme.colors.ui.hover};
    border-color: ${({ $active, theme }) => 
      $active ? theme.colors.primary.dark : theme.colors.primary.light};
  }
`;

const KanbanBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  flex: 1;
  overflow-x: auto;
  
  @media (min-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const Column = styled.div<{ $status: string }>`
  background: ${({ theme }) => theme.colors.ui.card};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  min-height: 300px;
  max-height: 100%;
  border-top: 4px solid ${({ $status, theme }) => 
    $status === 'todo' ? theme.colors.text.hint : 
    $status === 'in_progress' ? theme.colors.status.info : 
    $status === 'blocked' ? theme.colors.status.error : 
    theme.colors.status.success};
`;

const ColumnHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.ui.divider};
`;

const ColumnTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.h4.fontSize};
  font-weight: ${({ theme }) => theme.typography.h4.fontWeight};
  margin: 0;
  display: flex;
  align-items: center;
`;

const ColumnIcon = styled.div<{ $status: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-right: ${({ theme }) => theme.spacing.sm};
  background: ${({ $status, theme }) => 
    $status === 'todo' ? theme.colors.text.hint + '20' : 
    $status === 'in_progress' ? theme.colors.status.info + '20' : 
    $status === 'blocked' ? theme.colors.status.error + '20' : 
    theme.colors.status.success + '20'};
  color: ${({ $status, theme }) => 
    $status === 'todo' ? theme.colors.text.hint : 
    $status === 'in_progress' ? theme.colors.status.info : 
    $status === 'blocked' ? theme.colors.status.error : 
    theme.colors.status.success};
`;

const ColumnCount = styled.span`
  background: ${({ theme }) => theme.colors.ui.hover};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  margin-left: ${({ theme }) => theme.spacing.sm};
`;

const AddTaskButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.ui.hover};
    color: ${({ theme }) => theme.colors.primary.main};
  }
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  overflow-y: auto;
  flex: 1;
  padding-right: ${({ theme }) => theme.spacing.xs};
`;

const TaskCard = styled.div<{ $priority: string }>`
  background: ${({ theme }) => theme.colors.ui.card};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: all ${({ theme }) => theme.transitions.fast};
  border: 1px solid ${({ theme }) => theme.colors.ui.divider};
  position: relative;
  cursor: pointer;
  
  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
  }
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${({ $priority, theme }) => 
      $priority === 'p0' ? theme.colors.priority.p0 : 
      $priority === 'p1' ? theme.colors.priority.p1 : 
      $priority === 'p2' ? theme.colors.priority.p2 : 
      theme.colors.priority.p3
    };
    border-top-left-radius: ${({ theme }) => theme.borderRadius.md};
    border-bottom-left-radius: ${({ theme }) => theme.borderRadius.md};
  }
`;

const TaskTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const TaskMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const TaskTags = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`;

const TaskDueDate = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
`;

const TaskActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.ui.divider};
`;

const ActionButton = styled.button`
  background: ${({ theme }) => theme.colors.ui.card};
  border: 1px solid ${({ theme }) => theme.colors.ui.divider};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: ${({ theme }) => theme.spacing.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.ui.hover};
    color: ${({ theme }) => theme.colors.primary.main};
    border-color: ${({ theme }) => theme.colors.primary.light};
  }
`;

const DeleteButton = styled(ActionButton)`
  &:hover {
    background: ${({ theme }) => theme.colors.status.error + '10'};
    color: ${({ theme }) => theme.colors.status.error};
    border-color: ${({ theme }) => theme.colors.status.error};
  }
`;

const PriorityBadge = styled.span<{ $priority: string }>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  background: ${({ $priority, theme }) => 
    $priority === 'p0' ? theme.colors.priority.p0 + '20' : 
    $priority === 'p1' ? theme.colors.priority.p1 + '20' : 
    $priority === 'p2' ? theme.colors.priority.p2 + '20' : 
    theme.colors.priority.p3 + '20'
  };
  color: ${({ $priority, theme }) => 
    $priority === 'p0' ? theme.colors.priority.p0 : 
    $priority === 'p1' ? theme.colors.priority.p1 : 
    $priority === 'p2' ? theme.colors.priority.p2 : 
    theme.colors.priority.p3
  };
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: 0.75rem;
  font-weight: 500;
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
  background: ${({ theme }) => theme.colors.ui.card};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  width: 90%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${({ theme }) => theme.shadows.xl};
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.h3.fontSize};
  font-weight: ${({ theme }) => theme.typography.h3.fontWeight};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.secondary};
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  
  &:hover {
    background: ${({ theme }) => theme.colors.ui.hover};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Label = styled.label`
  font-weight: 500;
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Textarea = styled.textarea`
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.ui.divider};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  min-height: 100px;
  resize: vertical;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.main};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary.main}20;
  }
`;

const Select = styled.select`
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.ui.divider};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  background-color: ${({ theme }) => theme.colors.ui.card};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.main};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary.main}20;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  height: 100%;
  
  svg {
    font-size: 2.5rem;
    margin-bottom: ${({ theme }) => theme.spacing.md};
    opacity: 0.5;
  }
  
  p {
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  width: 100%;
`;

// Component
const Tasks: React.FC = () => {
  // State for tasks and UI
  const [tasks, setTasks] = useState<Task[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMoreCampaigns, setShowMoreCampaigns] = useState(false);
  const [formData, setFormData] = useState<TaskForm>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'p2',
    dueDate: '',
    tags: '',
    campaignId: ''
  });
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showDependenciesModal, setShowDependenciesModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Fetch tasks and campaigns on component mount
  useEffect(() => {
    fetchData();
  }, []);
  
  // Function to fetch tasks and campaigns from Supabase
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        
        // Check if it's a "table does not exist" error
        if (tasksError.code === '42P01' || tasksError.message?.includes('relation "tasks" does not exist')) {
          alert('The tasks table has not been set up in your Supabase database. Please run setup_tasks_table.sql in the SQL Editor.');
        }
        
        return; // Return early instead of throwing
      }
      
      if (tasksData) {
        setTasks(tasksData);
      }
      
      // Fetch campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id, title, status, start_date, end_date')
        .order('start_date', { ascending: false });
        
      if (campaignsError) {
        console.error('Error fetching campaigns:', campaignsError);
        return;
      }
      
      if (campaignsData) {
        setCampaigns(campaignsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to fetch tasks from Supabase
  const fetchTasks = async () => {
    await fetchData();
  };
  
  // Function to add a new task
  const addTask = async () => {
    try {
      const { title, description, status, priority, dueDate, tags, campaignId } = formData;
      
      const parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      console.log('Adding task:', formData);
      
      // Create task object with explicit typing to match database schema
      const newTask = {
        title,
        description: description || null,
        status,
        priority,
        // Use due_date instead of dueDate to match the database column name
        due_date: dueDate || null,
        tags: parsedTags.length > 0 ? parsedTags : null,
        // Add campaign_id if selected
        campaign_id: campaignId || null,
        // user_id is now automatically set by RLS
      };
      
      console.log('Prepared task object:', newTask);
      
      // Debug - check authentication status first
      const { data: authData, error: authError } = await supabase.auth.getUser();
      console.log('Current auth status:', authData, authError);
      
      if (!authData?.user) {
        alert('You must be logged in to add tasks. Authentication is required for RLS policies.');
        return;
      }
      
      // First check if table exists with a simple query
      const { count, error: countError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.error('Error checking tasks table:', countError);
        if (countError.code === '42P01') {
          alert('The tasks table does not exist. Please run setup_tasks_table.sql.');
          return;
        }
      }
        
      // Try to insert with more detailed error handling
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select();
        
      if (error) {
        console.error('Supabase error:', error);
        
        // Handle different error cases
        if (error.code === '42P01') {
          alert('The tasks table has not been set up. Please run setup_tasks_table.sql.');
        } else if (error.code === '42501' || error.message?.includes('permission denied')) {
          alert('Permission denied. Row-level security may be preventing this action. Make sure you are logged in and have the right permissions.');
        } else if (error.code === '23502') {
          alert('Missing required field: ' + error.message);
        } else if (error.code === '23503') {
          alert('Foreign key constraint failed. This could be due to missing user_id or invalid campaign_id.');
        } else if (error.code === '400') {
          alert('Bad request: ' + error.message + ' This might be due to missing required fields or invalid data types.');
        } else {
          alert(`Error adding task: ${error.message}`);
        }
        return;
      }
      
      console.log('Task added successfully:', data);
      
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
      const { title, description, status, priority, dueDate, tags, campaignId } = formData;
      
      const parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      console.log('Updating task:', formData);
      
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title,
          description,
          status,
          priority,
          due_date: dueDate || null,  // Use snake_case for database column
          tags: parsedTags.length > 0 ? parsedTags : null,
          campaign_id: campaignId || null
        })
        .eq('id', editingTask.id)
        .select();
        
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Task updated successfully:', data);
      
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
  const openAddModal = (initialStatus: 'todo' | 'in_progress' | 'blocked' | 'done' = 'todo') => {
    setFormData({
      title: '',
      description: '',
      status: initialStatus,
      priority: 'p2',
      dueDate: '',
      tags: '',
      campaignId: ''
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
      dueDate: task.due_date || '',  // Use the snake_case database column
      tags: task.tags ? task.tags.join(', ') : '',
      campaignId: task.campaign_id || ''
    });
    setEditingTask(task);
    setShowAddModal(true);
  };
  
  // Close the modal
  const closeModal = () => {
    setShowAddModal(false);
    setEditingTask(null);
  };
  
  // Function to filter tasks by status and campaign
  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => {
      // First apply status filter
      if (task.status !== status) return false;
      
      // Then apply campaign filter if selected
      if (selectedCampaign && task.campaign_id !== selectedCampaign) return false;
      
      // Then apply priority filter if selected
      if (selectedFilter && task.priority !== selectedFilter) return false;
      
      return true;
    });
  };
  
  // Get campaign name by id
  const getCampaignName = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign ? campaign.title : 'Unknown Campaign';
  };
  
  // Open the documents modal for a task
  const openDocumentsModal = (task: Task) => {
    setSelectedTask(task);
    setShowDocumentsModal(true);
  };
  
  // Close the documents modal
  const closeDocumentsModal = () => {
    setShowDocumentsModal(false);
    setSelectedTask(null);
  };
  
  // Open the dependencies modal for a task
  const openDependenciesModal = (task: Task) => {
    setSelectedTask(task);
    setShowDependenciesModal(true);
  };

  // Close the dependencies modal
  const closeDependenciesModal = () => {
    setShowDependenciesModal(false);
    setSelectedTask(null);
  };
  
  // Open the comments modal for a task
  const openCommentsModal = (task: Task) => {
    setSelectedTask(task);
    setShowCommentsModal(true);
  };

  // Close the comments modal
  const closeCommentsModal = () => {
    setShowCommentsModal(false);
    setSelectedTask(null);
  };
  
  // Helper function to format due date
  const formatDueDate = (task: Task) => {
    if (task.due_date) {
      // Fix: Explicitly preserve the date by parsing it correctly
      const [year, month, day] = task.due_date.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString();
    }
    return null;
  };
  
  // Get column icon based on status
  const getColumnIcon = (status: string) => {
    switch (status) {
      case 'todo':
        return <FiClock size={16} />;
      case 'in_progress':
        return <FiCalendar size={16} />;
      case 'blocked':
        return <FiAlertOctagon size={16} />;
      case 'done':
        return <FiCheckCircle size={16} />;
      default:
        return <FiClock size={16} />;
    }
  };
  
  // Get priority display text
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'p0':
        return 'Critical';
      case 'p1':
        return 'High';
      case 'p2':
        return 'Medium';
      case 'p3':
        return 'Low';
      default:
        return 'Medium';
    }
  };

  // Render task actions (used in all columns)
  const renderTaskActions = (task: Task) => (
    <TaskActions>
      <ActionButton onClick={() => openEditModal(task)} title="Edit Task">
        <FiEdit2 size={16} />
      </ActionButton>
      <ActionButton onClick={() => openDocumentsModal(task)} title="Manage Documents">
        <FiFileText size={16} />
      </ActionButton>
      <ActionButton onClick={() => openDependenciesModal(task)} title="Task Dependencies">
        <FiLink size={16} />
      </ActionButton>
      <ActionButton onClick={() => openCommentsModal(task)} title="Comments">
        <FiMessageCircle size={16} />
      </ActionButton>
      <DeleteButton onClick={() => deleteTask(task.id)} title="Delete Task">
        <FiTrash2 size={16} />
      </DeleteButton>
    </TaskActions>
  );
  
  return (
    <TasksContainer>
      <TasksHeader>
        <h2>Task Management</h2>
        <Button 
          variant="primary"
          startIcon={<FiPlus size={16} />}
          onClick={() => openAddModal('todo')}
        >
          Add New Task
        </Button>
      </TasksHeader>
      
      <FilterSection>
        <Card style={{ marginBottom: '1.5rem' }}>
          <FiltersContainer>
            <FilterGroup>
              <h4>Filter by Priority</h4>
              <FiltersRow>
                <FilterButton 
                  $active={selectedFilter === null ? true : undefined} 
                  onClick={() => setSelectedFilter(null)}
                >
                  All
                </FilterButton>
                <FilterButton 
                  $active={selectedFilter === 'p0' ? true : undefined} 
                  onClick={() => setSelectedFilter('p0')}
                >
                  Critical
                </FilterButton>
                <FilterButton 
                  $active={selectedFilter === 'p1' ? true : undefined} 
                  onClick={() => setSelectedFilter('p1')}
                >
                  High
                </FilterButton>
                <FilterButton 
                  $active={selectedFilter === 'p2' ? true : undefined} 
                  onClick={() => setSelectedFilter('p2')}
                >
                  Medium
                </FilterButton>
                <FilterButton 
                  $active={selectedFilter === 'p3' ? true : undefined} 
                  onClick={() => setSelectedFilter('p3')}
                >
                  Low
                </FilterButton>
              </FiltersRow>
            </FilterGroup>
            
            {campaigns.length > 0 && (
              <FilterGroup>
                <h4>Filter by Campaign</h4>
                <FiltersRow style={{ flexWrap: 'wrap', maxWidth: '100%', gap: '8px' }}>
                  <FilterButton 
                    $active={selectedCampaign === null ? true : undefined} 
                    onClick={() => setSelectedCampaign(null)}
                  >
                    All Campaigns
                  </FilterButton>
                  {campaigns.map(campaign => (
                    <FilterButton 
                      key={campaign.id}
                      $active={selectedCampaign === campaign.id ? true : undefined} 
                      onClick={() => setSelectedCampaign(campaign.id)}
                    >
                      {campaign.title}
                    </FilterButton>
                  ))}
                </FiltersRow>
              </FilterGroup>
            )}
          </FiltersContainer>
        </Card>
      </FilterSection>
      
      {isLoading ? (
        <LoadingContainer>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '2px solid #e2e8f0',
            borderTopColor: '#3d5afe',
            animation: 'spin 0.8s linear infinite'
          }} />
          <style>
            {`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </LoadingContainer>
      ) : (
        <KanbanBoard>
          {/* To Do Column */}
          <Column $status="todo">
            <ColumnHeader>
              <ColumnTitle>
                <ColumnIcon $status="todo">
                  {getColumnIcon('todo')}
                </ColumnIcon>
                To Do
                <ColumnCount>{getTasksByStatus('todo').length}</ColumnCount>
              </ColumnTitle>
              <AddTaskButton onClick={() => openAddModal('todo')} title="Add Task">
                <FiPlus size={20} />
              </AddTaskButton>
            </ColumnHeader>
            
            <TaskList>
              {getTasksByStatus('todo').length === 0 ? (
                <EmptyState>
                  <FiClock size={24} />
                  <p>No tasks yet</p>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<FiPlus />} 
                    onClick={() => openAddModal('todo')}
                  >
                    Add Task
                  </Button>
                </EmptyState>
              ) : (
                getTasksByStatus('todo').map(task => (
                  <TaskCard 
                    key={task.id} 
                    $priority={task.priority}
                    onClick={() => {
                      setSelectedTask(task);
                      setEditingTask(task);
                      setShowAddModal(true);
                    }}
                  >
                    <TaskTitle>{task.title}</TaskTitle>
                    <TaskMeta>
                      <PriorityBadge $priority={task.priority}>
                        {getPriorityText(task.priority)}
                      </PriorityBadge>
                      
                      {task.due_date && (
                        <TaskDueDate>
                          <FiCalendar size={12} />
                          {formatDueDate(task)}
                        </TaskDueDate>
                      )}
                    </TaskMeta>
                    <TaskTags>
                      {task.campaign_id && (
                        <Badge 
                          label={getCampaignName(task.campaign_id)} 
                          variant="info" 
                          size="small" 
                          icon={<FiCalendar size={10} />}
                        />
                      )}
                      {task.tags?.map(tag => (
                        <Badge 
                          key={tag} 
                          label={tag} 
                          variant="default" 
                          size="small"
                        />
                      ))}
                    </TaskTags>
                    {renderTaskActions(task)}
                  </TaskCard>
                ))
              )}
            </TaskList>
          </Column>
          
          {/* In Progress Column */}
          <Column $status="in_progress">
            <ColumnHeader>
              <ColumnTitle>
                <ColumnIcon $status="in_progress">
                  {getColumnIcon('in_progress')}
                </ColumnIcon>
                In Progress
                <ColumnCount>{getTasksByStatus('in_progress').length}</ColumnCount>
              </ColumnTitle>
              <AddTaskButton onClick={() => openAddModal('in_progress')} title="Add Task">
                <FiPlus size={20} />
              </AddTaskButton>
            </ColumnHeader>
            
            <TaskList>
              {getTasksByStatus('in_progress').length === 0 ? (
                <EmptyState>
                  <FiCalendar size={24} />
                  <p>No tasks in progress</p>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<FiPlus />} 
                    onClick={() => openAddModal('in_progress')}
                  >
                    Add Task
                  </Button>
                </EmptyState>
              ) : (
                getTasksByStatus('in_progress').map(task => (
                  <TaskCard 
                    key={task.id} 
                    $priority={task.priority}
                    onClick={() => {
                      setSelectedTask(task);
                      setEditingTask(task);
                      setShowAddModal(true);
                    }}
                  >
                    <TaskTitle>{task.title}</TaskTitle>
                    <TaskMeta>
                      <PriorityBadge $priority={task.priority}>
                        {getPriorityText(task.priority)}
                      </PriorityBadge>
                      
                      {task.due_date && (
                        <TaskDueDate>
                          <FiCalendar size={12} />
                          {formatDueDate(task)}
                        </TaskDueDate>
                      )}
                    </TaskMeta>
                    <TaskTags>
                      {task.campaign_id && (
                        <Badge 
                          label={getCampaignName(task.campaign_id)} 
                          variant="info" 
                          size="small" 
                          icon={<FiCalendar size={10} />}
                        />
                      )}
                      {task.tags?.map(tag => (
                        <Badge 
                          key={tag} 
                          label={tag} 
                          variant="default" 
                          size="small"
                        />
                      ))}
                    </TaskTags>
                    {renderTaskActions(task)}
                  </TaskCard>
                ))
              )}
            </TaskList>
          </Column>
          
          {/* Blocked Column */}
          <Column $status="blocked">
            <ColumnHeader>
              <ColumnTitle>
                <ColumnIcon $status="blocked">
                  {getColumnIcon('blocked')}
                </ColumnIcon>
                Blocked
                <ColumnCount>{getTasksByStatus('blocked').length}</ColumnCount>
              </ColumnTitle>
              <AddTaskButton onClick={() => openAddModal('blocked')} title="Add Task">
                <FiPlus size={20} />
              </AddTaskButton>
            </ColumnHeader>
            
            <TaskList>
              {getTasksByStatus('blocked').length === 0 ? (
                <EmptyState>
                  <FiAlertOctagon size={24} />
                  <p>No blocked tasks</p>
                </EmptyState>
              ) : (
                getTasksByStatus('blocked').map(task => (
                  <TaskCard 
                    key={task.id} 
                    $priority={task.priority}
                    onClick={() => {
                      setSelectedTask(task);
                      setEditingTask(task);
                      setShowAddModal(true);
                    }}
                  >
                    <TaskTitle>{task.title}</TaskTitle>
                    <TaskMeta>
                      <PriorityBadge $priority={task.priority}>
                        {getPriorityText(task.priority)}
                      </PriorityBadge>
                      
                      {task.due_date && (
                        <TaskDueDate>
                          <FiCalendar size={12} />
                          {formatDueDate(task)}
                        </TaskDueDate>
                      )}
                    </TaskMeta>
                    <TaskTags>
                      {task.campaign_id && (
                        <Badge 
                          label={getCampaignName(task.campaign_id)} 
                          variant="info" 
                          size="small" 
                          icon={<FiCalendar size={10} />}
                        />
                      )}
                      {task.tags?.map(tag => (
                        <Badge 
                          key={tag} 
                          label={tag} 
                          variant="default" 
                          size="small"
                        />
                      ))}
                    </TaskTags>
                    {renderTaskActions(task)}
                  </TaskCard>
                ))
              )}
            </TaskList>
          </Column>
          
          {/* Done Column */}
          <Column $status="done">
            <ColumnHeader>
              <ColumnTitle>
                <ColumnIcon $status="done">
                  {getColumnIcon('done')}
                </ColumnIcon>
                Done
                <ColumnCount>{getTasksByStatus('done').length}</ColumnCount>
              </ColumnTitle>
              <AddTaskButton onClick={() => openAddModal('done')} title="Add Task">
                <FiPlus size={20} />
              </AddTaskButton>
            </ColumnHeader>
            
            <TaskList>
              {getTasksByStatus('done').length === 0 ? (
                <EmptyState>
                  <FiCheckCircle size={24} />
                  <p>No completed tasks</p>
                </EmptyState>
              ) : (
                getTasksByStatus('done').map(task => (
                  <TaskCard 
                    key={task.id} 
                    $priority={task.priority}
                    onClick={() => {
                      setSelectedTask(task);
                      setEditingTask(task);
                      setShowAddModal(true);
                    }}
                  >
                    <TaskTitle>{task.title}</TaskTitle>
                    <TaskMeta>
                      <PriorityBadge $priority={task.priority}>
                        {getPriorityText(task.priority)}
                      </PriorityBadge>
                      
                      {task.due_date && (
                        <TaskDueDate>
                          <FiCalendar size={12} />
                          {formatDueDate(task)}
                        </TaskDueDate>
                      )}
                    </TaskMeta>
                    <TaskTags>
                      {task.campaign_id && (
                        <Badge 
                          label={getCampaignName(task.campaign_id)} 
                          variant="info" 
                          size="small" 
                          icon={<FiCalendar size={10} />}
                        />
                      )}
                      {task.tags?.map(tag => (
                        <Badge 
                          key={tag} 
                          label={tag} 
                          variant="default" 
                          size="small"
                        />
                      ))}
                    </TaskTags>
                    {renderTaskActions(task)}
                  </TaskCard>
                ))
              )}
            </TaskList>
          </Column>
        </KanbanBoard>
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
                <Input
                  label="Title"
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  fullWidth
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter task details..."
                />
              </FormGroup>
              
              <FormGrid>
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
              </FormGrid>
              
              <FormGrid>
                <FormGroup>
                  <Input
                    label="Due Date"
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                  />
                </FormGroup>
                
                <FormGroup>
                  <Input
                    label="Tags (comma separated)"
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="design, website, bug"
                  />
                </FormGroup>
              </FormGrid>
              
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
              
              <Button 
                type="submit"
                variant="primary"
                fullWidth
              >
                {editingTask ? 'Update Task' : 'Add Task'}
              </Button>
            </Form>
          </ModalContent>
        </Modal>
      )}
      
      {/* Documents Modal */}
      {showDocumentsModal && selectedTask && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                Documents for "{selectedTask.title}"
              </ModalTitle>
              <CloseButton onClick={closeDocumentsModal}>&times;</CloseButton>
            </ModalHeader>
            
            <DocumentUpload
              entityType="task"
              entityId={selectedTask.id}
              onSuccess={() => fetchData()}
            />
          </ModalContent>
        </Modal>
      )}
      
      {/* Dependencies Modal */}
      {showDependenciesModal && selectedTask && (
        <TaskDependencies
          taskId={selectedTask.id}
          onClose={closeDependenciesModal}
        />
      )}
      
      {/* Comments Modal */}
      {showCommentsModal && selectedTask && (
        <TaskComments
          taskId={selectedTask.id}
          taskTitle={selectedTask.title}
          onClose={closeCommentsModal}
        />
      )}
    </TasksContainer>
  );
};

export default Tasks;