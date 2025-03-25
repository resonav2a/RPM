import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiLink, FiUnlink, FiArrowRight, FiInfo, FiX } from 'react-icons/fi';
import { supabase } from '../services/supabase';

// Types
interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  priority: 'p0' | 'p1' | 'p2' | 'p3';
}

interface TaskDependency {
  id: string;
  parent_task_id: string;
  dependent_task_id: string;
  dependency_type: string;
  created_at?: string;
}

interface TaskDependenciesProps {
  taskId: string;
  onClose: () => void;
}

// Styled components
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #ddd;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.75rem 1.5rem;
  background: ${props => props.active ? '#5c6bc0' : 'transparent'};
  color: ${props => props.active ? 'white' : '#333'};
  border: none;
  border-bottom: ${props => props.active ? '2px solid #3f51b5' : 'none'};
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  
  &:hover {
    background: ${props => props.active ? '#5c6bc0' : '#f5f5f5'};
  }
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InfoText = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin: 0 0 1rem 0;
  background: #f5f7fa;
  padding: 0.75rem;
  border-radius: 4px;
  border-left: 3px solid #5c6bc0;
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TaskCard = styled.div<{ priority: string; isComplete: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  border-left: 3px solid ${({ priority }) => 
    priority === 'p0' ? '#e74c3c' : 
    priority === 'p1' ? '#f39c12' : 
    priority === 'p2' ? '#3498db' : 
    '#7f8c8d'
  };
  opacity: ${({ isComplete }) => isComplete ? 0.7 : 1};
`;

const TaskTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 500;
`;

const TaskStatus = styled.div<{ status: string }>`
  font-size: 0.8rem;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  background: ${({ status }) => 
    status === 'done' ? '#e8f5e9' : 
    status === 'in_progress' ? '#e3f2fd' : 
    status === 'blocked' ? '#ffebee' : 
    '#f5f5f5'
  };
  color: ${({ status }) => 
    status === 'done' ? '#2e7d32' : 
    status === 'in_progress' ? '#1976d2' : 
    status === 'blocked' ? '#c62828' : 
    '#757575'
  };
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #777;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #5c6bc0;
  }
`;

const AddDependencySection = styled.div`
  margin-top: 1.5rem;
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Label = styled.label`
  font-weight: 500;
  font-size: 0.9rem;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: #4a5ab9;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 0.9rem;
`;

const DependencyRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 4px;
`;

const ArrowIcon = styled(FiArrowRight)`
  margin: 0 0.75rem;
  flex-shrink: 0;
  color: #5c6bc0;
`;

const DependencyType = styled.span`
  font-size: 0.8rem;
  color: #666;
  margin-left: 0.5rem;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #777;
  padding: 0.25rem;
  margin-left: auto;
  display: flex;
  align-items: center;
  
  &:hover {
    color: #e53935;
  }
`;

// Component
const TaskDependencies: React.FC<TaskDependenciesProps> = ({ taskId, onClose }) => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('outgoing');
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [incomingDependencies, setIncomingDependencies] = useState<TaskDependency[]>([]);
  const [outgoingDependencies, setOutgoingDependencies] = useState<TaskDependency[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedDependencyType, setSelectedDependencyType] = useState<string>('blocks');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [taskId]);

  // Function to fetch data from Supabase
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch current task
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('id, title, status, priority')
        .eq('id', taskId)
        .single();
        
      if (taskError) {
        console.error('Error fetching task:', taskError);
        return;
      }
      
      if (taskData) {
        setCurrentTask(taskData);
      }
      
      // Fetch all other tasks (excluding current task)
      const { data: allTasksData, error: allTasksError } = await supabase
        .from('tasks')
        .select('id, title, status, priority')
        .neq('id', taskId)
        .order('created_at', { ascending: false });
        
      if (allTasksError) {
        console.error('Error fetching all tasks:', allTasksError);
      } else if (allTasksData) {
        setAllTasks(allTasksData);
      }
      
      // Fetch outgoing dependencies (where current task is parent)
      const { data: outgoingData, error: outgoingError } = await supabase
        .from('task_dependencies')
        .select('*, tasks:dependent_task_id(id, title, status, priority)')
        .eq('parent_task_id', taskId);
        
      if (outgoingError) {
        console.error('Error fetching outgoing dependencies:', outgoingError);
      } else if (outgoingData) {
        setOutgoingDependencies(outgoingData);
      }
      
      // Fetch incoming dependencies (where current task is dependent)
      const { data: incomingData, error: incomingError } = await supabase
        .from('task_dependencies')
        .select('*, tasks:parent_task_id(id, title, status, priority)')
        .eq('dependent_task_id', taskId);
        
      if (incomingError) {
        console.error('Error fetching incoming dependencies:', incomingError);
      } else if (incomingData) {
        setIncomingDependencies(incomingData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to add a new dependency
  const addDependency = async () => {
    if (!selectedTaskId || !currentTask) return;
    
    try {
      const newDependency = {
        parent_task_id: activeTab === 'outgoing' ? taskId : selectedTaskId,
        dependent_task_id: activeTab === 'outgoing' ? selectedTaskId : taskId,
        dependency_type: selectedDependencyType
      };
      
      const { data, error } = await supabase
        .from('task_dependencies')
        .insert([newDependency])
        .select();
        
      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation - dependency already exists
          alert('This dependency already exists.');
        } else {
          console.error('Error adding dependency:', error);
          alert('Error adding dependency. Check console for details.');
        }
        return;
      }
      
      if (data) {
        // Refresh dependencies
        fetchData();
        // Reset selection
        setSelectedTaskId('');
      }
    } catch (error) {
      console.error('Error adding dependency:', error);
    }
  };

  // Function to remove a dependency
  const removeDependency = async (dependencyId: string) => {
    try {
      const { error } = await supabase
        .from('task_dependencies')
        .delete()
        .eq('id', dependencyId);
        
      if (error) {
        console.error('Error removing dependency:', error);
        return;
      }
      
      // Refresh dependencies
      fetchData();
    } catch (error) {
      console.error('Error removing dependency:', error);
    }
  };

  // Get task details by id
  const getTaskById = (id: string): Task | undefined => {
    return allTasks.find(task => task.id === id);
  };

  // Check if a task is completed
  const isTaskComplete = (status: string): boolean => {
    return status === 'done';
  };

  // Filter available tasks based on current dependencies
  const getAvailableTasks = (): Task[] => {
    if (activeTab === 'outgoing') {
      // For outgoing dependencies, exclude tasks that are already dependent on this task
      const existingDependentIds = outgoingDependencies.map(dep => dep.dependent_task_id);
      return allTasks.filter(task => !existingDependentIds.includes(task.id));
    } else {
      // For incoming dependencies, exclude tasks that this task already depends on
      const existingParentIds = incomingDependencies.map(dep => dep.parent_task_id);
      return allTasks.filter(task => !existingParentIds.includes(task.id));
    }
  };

  return (
    <Modal>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            <FiLink /> Task Dependencies
          </ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        
        {currentTask && (
          <>
            <InfoText>
              <strong>Current Task:</strong> {currentTask.title}
            </InfoText>
            
            <TabContainer>
              <Tab 
                active={activeTab === 'outgoing'} 
                onClick={() => setActiveTab('outgoing')}
              >
                This Task Blocks
              </Tab>
              <Tab 
                active={activeTab === 'incoming'} 
                onClick={() => setActiveTab('incoming')}
              >
                Blocked By
              </Tab>
            </TabContainer>
            
            {activeTab === 'outgoing' ? (
              <Section>
                <SectionTitle>
                  <FiArrowRight /> Tasks That Depend On This Task
                </SectionTitle>
                <InfoText>
                  <FiInfo style={{ marginRight: '0.5rem' }} />
                  These tasks cannot be started until this task is completed.
                </InfoText>
                
                {outgoingDependencies.length === 0 ? (
                  <EmptyState>
                    No tasks are currently dependent on this task.
                  </EmptyState>
                ) : (
                  <TaskList>
                    {outgoingDependencies.map(dependency => {
                      const dependentTask = (dependency as any).tasks;
                      return (
                        <DependencyRow key={dependency.id}>
                          <TaskTitle>
                            {currentTask.title} 
                            <DependencyType>({dependency.dependency_type})</DependencyType>
                          </TaskTitle>
                          <ArrowIcon />
                          <TaskTitle>{dependentTask?.title}</TaskTitle>
                          <TaskStatus status={dependentTask?.status}>
                            {dependentTask?.status.replace('_', ' ')}
                          </TaskStatus>
                          <RemoveButton 
                            onClick={() => removeDependency(dependency.id)}
                            title="Remove dependency"
                          >
                            <FiX />
                          </RemoveButton>
                        </DependencyRow>
                      );
                    })}
                  </TaskList>
                )}
                
                <AddDependencySection>
                  <SectionTitle>Add New Dependency</SectionTitle>
                  <FormGroup>
                    <Label htmlFor="dependentTaskId">Select Task That Can't Start Until This Task is Done:</Label>
                    <Select
                      id="dependentTaskId"
                      value={selectedTaskId}
                      onChange={(e) => setSelectedTaskId(e.target.value)}
                    >
                      <option value="">Select a task...</option>
                      {getAvailableTasks().map(task => (
                        <option key={task.id} value={task.id}>
                          {task.title} ({task.status.replace('_', ' ')})
                        </option>
                      ))}
                    </Select>
                  </FormGroup>
                  
                  <FormGroup>
                    <Label htmlFor="dependencyType">Dependency Type:</Label>
                    <Select
                      id="dependencyType"
                      value={selectedDependencyType}
                      onChange={(e) => setSelectedDependencyType(e.target.value)}
                    >
                      <option value="blocks">Blocks</option>
                      <option value="relates_to">Relates To</option>
                      <option value="duplicates">Duplicates</option>
                    </Select>
                  </FormGroup>
                  
                  <Button 
                    onClick={addDependency} 
                    disabled={!selectedTaskId}
                  >
                    <FiLink /> Add Dependency
                  </Button>
                </AddDependencySection>
              </Section>
            ) : (
              <Section>
                <SectionTitle>
                  <FiArrowRight /> Tasks That This Task Depends On
                </SectionTitle>
                <InfoText>
                  <FiInfo style={{ marginRight: '0.5rem' }} />
                  This task cannot be started until these tasks are completed.
                </InfoText>
                
                {incomingDependencies.length === 0 ? (
                  <EmptyState>
                    This task doesn't depend on any other tasks.
                  </EmptyState>
                ) : (
                  <TaskList>
                    {incomingDependencies.map(dependency => {
                      const parentTask = (dependency as any).tasks;
                      return (
                        <DependencyRow key={dependency.id}>
                          <TaskTitle>{parentTask?.title}</TaskTitle>
                          <TaskStatus status={parentTask?.status}>
                            {parentTask?.status.replace('_', ' ')}
                          </TaskStatus>
                          <ArrowIcon />
                          <TaskTitle>
                            {currentTask.title}
                            <DependencyType>({dependency.dependency_type})</DependencyType>
                          </TaskTitle>
                          <RemoveButton 
                            onClick={() => removeDependency(dependency.id)}
                            title="Remove dependency"
                          >
                            <FiX />
                          </RemoveButton>
                        </DependencyRow>
                      );
                    })}
                  </TaskList>
                )}
                
                <AddDependencySection>
                  <SectionTitle>Add New Dependency</SectionTitle>
                  <FormGroup>
                    <Label htmlFor="parentTaskId">Select Task That Must Be Completed First:</Label>
                    <Select
                      id="parentTaskId"
                      value={selectedTaskId}
                      onChange={(e) => setSelectedTaskId(e.target.value)}
                    >
                      <option value="">Select a task...</option>
                      {getAvailableTasks().map(task => (
                        <option key={task.id} value={task.id}>
                          {task.title} ({task.status.replace('_', ' ')})
                        </option>
                      ))}
                    </Select>
                  </FormGroup>
                  
                  <FormGroup>
                    <Label htmlFor="dependencyType">Dependency Type:</Label>
                    <Select
                      id="dependencyType"
                      value={selectedDependencyType}
                      onChange={(e) => setSelectedDependencyType(e.target.value)}
                    >
                      <option value="blocks">Blocks</option>
                      <option value="relates_to">Relates To</option>
                      <option value="duplicates">Duplicates</option>
                    </Select>
                  </FormGroup>
                  
                  <Button 
                    onClick={addDependency} 
                    disabled={!selectedTaskId}
                  >
                    <FiLink /> Add Dependency
                  </Button>
                </AddDependencySection>
              </Section>
            )}
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default TaskDependencies;