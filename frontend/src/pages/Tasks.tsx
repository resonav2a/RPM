import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { supabase } from '../services/supabase';

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
  height: calc(100vh - 150px);
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
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

const KanbanBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  flex: 1;
  overflow-x: auto;
  
  @media (min-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const Column = styled.div`
  background: #f5f7fa;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  min-height: 300px;
  max-height: 100%;
`;

const ColumnHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ColumnTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
`;

const ColumnCount = styled.span`
  background: #e0e0e0;
  color: #555;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  margin-left: 0.5rem;
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

const TaskCard = styled.div<{ priority: string }>`
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
  cursor: pointer;
  
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

const TaskDueDate = styled.span``;

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

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
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
  const [formData, setFormData] = useState<TaskForm>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'p2',
    dueDate: '',
    tags: '',
    campaignId: ''
  });
  
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
  
  // Helper function to format due date
  const formatDueDate = (task: Task) => {
    if (task.due_date) {
      return new Date(task.due_date).toLocaleDateString();
    }
    return null;
  };
  
  return (
    <TasksContainer>
      <FiltersContainer>
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Priority</h4>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <FilterButton 
              active={selectedFilter === null ? true : undefined} 
              onClick={() => setSelectedFilter(null)}
            >
              All
            </FilterButton>
            <FilterButton 
              active={selectedFilter === 'p0' ? true : undefined} 
              onClick={() => setSelectedFilter('p0')}
            >
              P0 - Critical
            </FilterButton>
            <FilterButton 
              active={selectedFilter === 'p1' ? true : undefined} 
              onClick={() => setSelectedFilter('p1')}
            >
              P1 - High
            </FilterButton>
            <FilterButton 
              active={selectedFilter === 'p2' ? true : undefined} 
              onClick={() => setSelectedFilter('p2')}
            >
              P2 - Medium
            </FilterButton>
            <FilterButton 
              active={selectedFilter === 'p3' ? true : undefined} 
              onClick={() => setSelectedFilter('p3')}
            >
              P3 - Low
            </FilterButton>
          </div>
        </div>
        
        {campaigns.length > 0 && (
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Campaign</h4>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <FilterButton 
                active={selectedCampaign === null ? true : undefined} 
                onClick={() => setSelectedCampaign(null)}
              >
                All Campaigns
              </FilterButton>
              {campaigns.map(campaign => (
                <FilterButton 
                  key={campaign.id}
                  active={selectedCampaign === campaign.id ? true : undefined} 
                  onClick={() => setSelectedCampaign(campaign.id)}
                >
                  {campaign.title}
                </FilterButton>
              ))}
            </div>
          </div>
        )}
        
        <Button onClick={() => openAddModal('todo')} style={{ marginLeft: 'auto' }}>Add New Task</Button>
      </FiltersContainer>
      
      {isLoading ? (
        <LoadingContainer>
          <p>Loading tasks...</p>
        </LoadingContainer>
      ) : (
        <KanbanBoard>
          {/* To Do Column */}
          <Column>
            <ColumnHeader>
              <ColumnTitle>
                To Do
                <ColumnCount>{getTasksByStatus('todo').length}</ColumnCount>
              </ColumnTitle>
              <AddButton onClick={() => openAddModal('todo')}>
                <FiPlus size={18} />
              </AddButton>
            </ColumnHeader>
            <TaskList>
              {getTasksByStatus('todo')
                .map(task => (
                  <TaskCard key={task.id} priority={task.priority}>
                    <TaskTitle>{task.title}</TaskTitle>
                    <TaskMeta>
                      <TaskTags>
                        {task.campaign_id && (
                          <CampaignTag>
                            <span role="img" aria-label="campaign">📅</span> {getCampaignName(task.campaign_id)}
                          </CampaignTag>
                        )}
                        {task.tags?.map(tag => (
                          <TaskTag key={tag}>{tag}</TaskTag>
                        ))}
                      </TaskTags>
                      {task.due_date && (
                        <TaskDueDate>
                          {new Date(task.due_date).toLocaleDateString()}
                        </TaskDueDate>
                      )}
                    </TaskMeta>
                    <TaskActions>
                      <ActionButton onClick={() => openEditModal(task)}>
                        <FiEdit2 size={16} />
                      </ActionButton>
                      <ActionButton onClick={() => deleteTask(task.id)}>
                        <FiTrash2 size={16} />
                      </ActionButton>
                    </TaskActions>
                  </TaskCard>
                ))}
            </TaskList>
          </Column>
          
          {/* In Progress Column */}
          <Column>
            <ColumnHeader>
              <ColumnTitle>
                In Progress
                <ColumnCount>{getTasksByStatus('in_progress').length}</ColumnCount>
              </ColumnTitle>
              <AddButton onClick={() => openAddModal('in_progress')}>
                <FiPlus size={18} />
              </AddButton>
            </ColumnHeader>
            <TaskList>
              {getTasksByStatus('in_progress')
                .map(task => (
                  <TaskCard key={task.id} priority={task.priority}>
                    <TaskTitle>{task.title}</TaskTitle>
                    <TaskMeta>
                      <TaskTags>
                        {task.campaign_id && (
                          <CampaignTag>
                            <span role="img" aria-label="campaign">📅</span> {getCampaignName(task.campaign_id)}
                          </CampaignTag>
                        )}
                        {task.tags?.map(tag => (
                          <TaskTag key={tag}>{tag}</TaskTag>
                        ))}
                      </TaskTags>
                      {task.due_date && (
                        <TaskDueDate>
                          {new Date(task.due_date).toLocaleDateString()}
                        </TaskDueDate>
                      )}
                    </TaskMeta>
                    <TaskActions>
                      <ActionButton onClick={() => openEditModal(task)}>
                        <FiEdit2 size={16} />
                      </ActionButton>
                      <ActionButton onClick={() => deleteTask(task.id)}>
                        <FiTrash2 size={16} />
                      </ActionButton>
                    </TaskActions>
                  </TaskCard>
                ))}
            </TaskList>
          </Column>
          
          {/* Blocked Column */}
          <Column>
            <ColumnHeader>
              <ColumnTitle>
                Blocked
                <ColumnCount>{getTasksByStatus('blocked').length}</ColumnCount>
              </ColumnTitle>
              <AddButton onClick={() => openAddModal('blocked')}>
                <FiPlus size={18} />
              </AddButton>
            </ColumnHeader>
            <TaskList>
              {getTasksByStatus('blocked')
                .map(task => (
                  <TaskCard key={task.id} priority={task.priority}>
                    <TaskTitle>{task.title}</TaskTitle>
                    <TaskMeta>
                      <TaskTags>
                        {task.campaign_id && (
                          <CampaignTag>
                            <span role="img" aria-label="campaign">📅</span> {getCampaignName(task.campaign_id)}
                          </CampaignTag>
                        )}
                        {task.tags?.map(tag => (
                          <TaskTag key={tag}>{tag}</TaskTag>
                        ))}
                      </TaskTags>
                      {task.due_date && (
                        <TaskDueDate>
                          {new Date(task.due_date).toLocaleDateString()}
                        </TaskDueDate>
                      )}
                    </TaskMeta>
                    <TaskActions>
                      <ActionButton onClick={() => openEditModal(task)}>
                        <FiEdit2 size={16} />
                      </ActionButton>
                      <ActionButton onClick={() => deleteTask(task.id)}>
                        <FiTrash2 size={16} />
                      </ActionButton>
                    </TaskActions>
                  </TaskCard>
                ))}
            </TaskList>
          </Column>
          
          {/* Done Column */}
          <Column>
            <ColumnHeader>
              <ColumnTitle>
                Done
                <ColumnCount>{getTasksByStatus('done').length}</ColumnCount>
              </ColumnTitle>
              <AddButton onClick={() => openAddModal('done')}>
                <FiPlus size={18} />
              </AddButton>
            </ColumnHeader>
            <TaskList>
              {getTasksByStatus('done')
                .map(task => (
                  <TaskCard key={task.id} priority={task.priority}>
                    <TaskTitle>{task.title}</TaskTitle>
                    <TaskMeta>
                      <TaskTags>
                        {task.campaign_id && (
                          <CampaignTag>
                            <span role="img" aria-label="campaign">📅</span> {getCampaignName(task.campaign_id)}
                          </CampaignTag>
                        )}
                        {task.tags?.map(tag => (
                          <TaskTag key={tag}>{tag}</TaskTag>
                        ))}
                      </TaskTags>
                      {task.due_date && (
                        <TaskDueDate>
                          {new Date(task.due_date).toLocaleDateString()}
                        </TaskDueDate>
                      )}
                    </TaskMeta>
                    <TaskActions>
                      <ActionButton onClick={() => openEditModal(task)}>
                        <FiEdit2 size={16} />
                      </ActionButton>
                      <ActionButton onClick={() => deleteTask(task.id)}>
                        <FiTrash2 size={16} />
                      </ActionButton>
                    </TaskActions>
                  </TaskCard>
                ))}
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
    </TasksContainer>
  );
};

export default Tasks;