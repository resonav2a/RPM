import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { 
  FiCheckCircle, 
  FiAlertCircle, 
  FiClock, 
  FiCalendar, 
  FiFileText, 
  FiActivity,
  FiTrendingUp,
  FiBarChart2,
  FiInfo,
  FiChevronRight,
  FiPlus
} from 'react-icons/fi';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.xl};
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 3fr 1fr;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const FullWidthSection = styled.div`
  grid-column: 1 / -1;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.h3.fontSize};
  font-weight: ${({ theme }) => theme.typography.h3.fontWeight};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const StatCard = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.ui.card};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
  }
`;

const StatValue = styled.div`
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const StatIcon = styled.div<{ $color?: string }>`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ $color, theme }) => $color ? $color : theme.colors.primary.light};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $color, theme }) => $color ? 'white' : theme.colors.primary.main};
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const TaskItem = styled.div`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.ui.card};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.ui.divider};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.ui.hover};
    transform: translateX(2px);
  }
`;

const TaskContent = styled.div`
  flex: 1;
  margin-left: ${({ theme }) => theme.spacing.md};
`;

const TaskTitle = styled.div`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const TaskMeta = styled.div`
  display: flex;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
  color: ${({ theme }) => theme.colors.text.secondary};
  gap: ${({ theme }) => theme.spacing.sm};
`;

const TaskStatus = styled.span<{ $status: string }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $status, theme }) => 
    $status === 'todo' ? theme.colors.taskStatus.todo : 
    $status === 'in_progress' ? theme.colors.taskStatus.in_progress : 
    $status === 'blocked' ? theme.colors.taskStatus.blocked : 
    theme.colors.taskStatus.done};
  margin-right: ${({ theme }) => theme.spacing.xs};
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ActivityItem = styled.div`
  display: flex;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.ui.card};
  border: 1px solid ${({ theme }) => theme.colors.ui.divider};
`;

const ActivityIcon = styled.div<{ $color?: string }>`
  min-width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ $color, theme }) => $color || theme.colors.ui.hover};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $color, theme }) => $color ? 'white' : theme.colors.text.secondary};
`;

const ActivityContent = styled.div`
  flex: 1;
  margin-left: ${({ theme }) => theme.spacing.md};
`;

const ActivityTitle = styled.div`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ActivityTime = styled.div`
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: 2px;
`;

const SeeAllLink = styled(Link)`
  display: flex;
  align-items: center;
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  color: ${({ theme }) => theme.colors.primary.main};
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
  
  svg {
    margin-left: ${({ theme }) => theme.spacing.xs};
  }
`;

const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  width: 100%;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const DebugPanel = styled.div`
  background: ${({ theme }) => theme.colors.ui.card};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  overflow: auto;
  max-height: 400px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  
  svg {
    font-size: 3rem;
    margin-bottom: ${({ theme }) => theme.spacing.md};
    opacity: 0.5;
  }
  
  p {
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }
`;

const ProgressBar = styled.div<{ $progress: number }>`
  width: 100%;
  height: 8px;
  background: ${({ theme }) => theme.colors.ui.hover};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  margin-top: ${({ theme }) => theme.spacing.sm};
  overflow: hidden;
  
  &::after {
    content: "";
    display: block;
    height: 100%;
    width: ${({ $progress }) => `${$progress}%`};
    background: ${({ theme }) => theme.colors.primary.main};
    border-radius: ${({ theme }) => theme.borderRadius.full};
    transition: width 0.5s ease;
  }
`;

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  // State for data
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    done: 0,
    inProgress: 0,
    blocked: 0
  });
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [availableTables, setAvailableTables] = useState<string[]>([]);

  // Progress calculation
  const weeklyTasksProgress = taskStats.total > 0 
    ? Math.round((taskStats.done / taskStats.total) * 100) 
    : 0;

  // Fetch all data on component mount
  useEffect(() => {
    fetchDashboardData();
    checkSupabaseConnection();
  }, []);
  
  // Debug - Check Supabase connection
  const checkSupabaseConnection = async () => {
    try {
      setDebugInfo(prev => ({ ...prev, checking: true }));
      
      // Check authentication first
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const authStatus = {
        isAuthenticated: !!authData?.user,
        userId: authData?.user?.id || null,
        userEmail: authData?.user?.email || null,
        authError: authError || null
      };
      
      // Try to query known tables directly with more info on errors
      const documentsTest = await supabase
        .from('documents')
        .select('count(*)', { count: 'exact', head: true });
      
      const tasksTest = await supabase
        .from('tasks')
        .select('count(*)', { count: 'exact', head: true });
      
      const campaignsTest = await supabase
        .from('campaigns')
        .select('count(*)', { count: 'exact', head: true });
      
      // Collect tables that exist
      const existingTables = [];
      const tablesStatus = {};
      
      // Function to determine if a table exists based on error
      const tableExists = (result) => {
        // If no error, table exists
        if (!result.error) return true;
        
        // If error is not about table existence, table might exist but have other issues
        return !(
          result.error.code === '42P01' || 
          (result.error.message && result.error.message.includes('does not exist'))
        );
      };
      
      // Check documents table
      if (tableExists(documentsTest)) {
        existingTables.push('documents');
        tablesStatus.documents = { 
          exists: true, 
          count: documentsTest.count,
          error: documentsTest.error,
          errorCode: documentsTest.error?.code,
          errorMessage: documentsTest.error?.message,
          isPermissionIssue: documentsTest.error?.code === '42501' || 
                            (documentsTest.error?.message && documentsTest.error.message.includes('permission denied'))
        };
      } else {
        tablesStatus.documents = { 
          exists: false, 
          error: documentsTest.error 
        };
      }
      
      // Check tasks table
      if (tableExists(tasksTest)) {
        existingTables.push('tasks');
        tablesStatus.tasks = { 
          exists: true, 
          count: tasksTest.count,
          error: tasksTest.error,
          errorCode: tasksTest.error?.code,
          errorMessage: tasksTest.error?.message,
          isPermissionIssue: tasksTest.error?.code === '42501' || 
                            (tasksTest.error?.message && tasksTest.error.message.includes('permission denied'))
        };
      } else {
        tablesStatus.tasks = { 
          exists: false, 
          error: tasksTest.error 
        };
      }
      
      // Check campaigns table
      if (tableExists(campaignsTest)) {
        existingTables.push('campaigns');
        tablesStatus.campaigns = { 
          exists: true, 
          count: campaignsTest.count,
          error: campaignsTest.error,
          errorCode: campaignsTest.error?.code,
          errorMessage: campaignsTest.error?.message,
          isPermissionIssue: campaignsTest.error?.code === '42501' || 
                            (campaignsTest.error?.message && campaignsTest.error.message.includes('permission denied'))
        };
      } else {
        tablesStatus.campaigns = { 
          exists: false, 
          error: campaignsTest.error 
        };
      }
      
      // Set state
      setAvailableTables(existingTables);
      
      // Check for special cases - tables exist but RLS prevents access
      const hasPermissionIssues = Object.values(tablesStatus).some(t => t.isPermissionIssue);
      
      setDebugInfo(prev => ({
        ...prev,
        checking: false,
        connectionError: existingTables.length === 0 ? { message: "No tables found" } : null,
        authStatus,
        tablesStatus,
        hasPermissionIssues,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL
      }));
      
    } catch (error) {
      console.error('Debug - Error checking Supabase connection:', error);
      setDebugInfo(prev => ({ 
        ...prev, 
        unexpectedError: error,
        checking: false 
      }));
    }
  };

  // Function to fetch all dashboard data
  const fetchDashboardData = async () => {
    setIsLoading(true);
    
    try {
      await Promise.all([
        fetchTasks(),
        fetchCampaigns(),
        fetchDocuments(),
        fetchRecentActivity()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch tasks
  const fetchTasks = async () => {
    try {
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .order('updated_at', { ascending: false });
        
      if (taskError) throw taskError;
      
      if (taskData) {
        // Set tasks
        setTasks(taskData);
        
        // Calculate stats
        setTaskStats({
          total: taskData.length,
          done: taskData.filter(task => task.status === 'done').length,
          inProgress: taskData.filter(task => task.status === 'in_progress').length,
          blocked: taskData.filter(task => task.status === 'blocked').length
        });
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Function to fetch campaigns
  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('start_date', { ascending: true })
        .gte('start_date', new Date().toISOString().split('T')[0])
        .limit(5);
        
      if (error) throw error;
      
      if (data) {
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  // Function to fetch documents
  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(3);
        
      if (error) throw error;
      
      if (data) {
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  // Function to fetch recent activity from all tables
  const fetchRecentActivity = async () => {
    try {
      // Fetch recent tasks
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(3);
        
      if (taskError) throw taskError;
      
      // Fetch recent docs
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(3);
        
      if (docError) throw docError;
      
      // Fetch recent campaigns
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(3);
        
      if (campaignError) throw campaignError;
      
      // Combine and sort all activity by updated_at
      const allActivity = [
        ...(taskData || []).map(item => ({ ...item, type: 'task' })),
        ...(docData || []).map(item => ({ ...item, type: 'document' })),
        ...(campaignData || []).map(item => ({ ...item, type: 'campaign' }))
      ].sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ).slice(0, 5);
      
      setRecentActivity(allActivity);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  // Function to get activity icon based on type
  const getActivityIcon = (item: any) => {
    if (item.type === 'task') {
      if (item.status === 'done') return <FiCheckCircle />;
      if (item.status === 'blocked') return <FiAlertCircle />;
      return <FiClock />;
    }
    
    if (item.type === 'document') return <FiFileText />;
    
    if (item.type === 'campaign') return <FiCalendar />;
    
    return <FiActivity />;
  };

  // Format relative time (e.g. "2 hours ago")
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
    }
    
    if (diffHour > 0) {
      return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
    }
    
    if (diffMin > 0) {
      return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    }
    
    return 'Just now';
  };

  // Priority tasks (P0 and P1)
  const priorityTasks = tasks.filter(task => 
    (task.priority === 'p0' || task.priority === 'p1') && 
    task.status !== 'done'
  ).slice(0, 5);

  if (isLoading) {
    return (
      <LoadingIndicator>
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
      </LoadingIndicator>
    );
  }

  return (
    <>
      {/* Debug Panel */}
      {availableTables.length === 0 && (
        <Card 
          variant="elevated" 
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FiInfo size={20} style={{ marginRight: '8px', color: '#f59e0b' }} />
              Database Connection Status
            </div>
          }
          headerAction={
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => setDebugMode(!debugMode)}
            >
              {debugMode ? 'Hide Details' : 'Show Details'}
            </Button>
          }
          style={{ marginBottom: '1.5rem' }}
        >
          <div>
            <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
            <p><strong>Connected to Supabase:</strong> {debugInfo.connectionError ? '❌ No' : '✅ Yes'}</p>
            <p><strong>Available Tables:</strong> {availableTables.length > 0 ? availableTables.join(', ') : 'None found'}</p>
            
            {availableTables.length === 0 && (
              <div style={{ 
                background: '#fffbeb', 
                color: '#92400e', 
                padding: '1rem', 
                borderRadius: '8px',
                marginTop: '1rem' 
              }}>
                <h4 style={{ marginTop: 0 }}>Database Tables Not Found</h4>
                <p>You need to set up the database tables in Supabase. Follow these steps:</p>
                <ol>
                  <li>Go to <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer">https://app.supabase.com</a> and select your project</li>
                  <li>Navigate to the <strong>SQL Editor</strong> section</li>
                  <li>Open the file <code>setup_documents_table.sql</code> from your project</li>
                  <li>Copy <strong>ALL</strong> of its contents into the SQL Editor</li>
                  <li>Click the <strong>Run</strong> button to execute the SQL</li>
                  <li>Return to this app and click "Refresh Connection Info" below</li>
                </ol>
              </div>
            )}
            
            {debugMode && (
              <DebugPanel>
                <h4>Authentication Status</h4>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                  <li>
                    <strong>Authenticated:</strong> {debugInfo.authStatus?.isAuthenticated ? 
                      '✅ Yes' : 
                      '❌ No - Login required for RLS to work'}
                  </li>
                  {debugInfo.authStatus?.isAuthenticated && (
                    <>
                      <li><strong>User ID:</strong> {debugInfo.authStatus.userId}</li>
                      <li><strong>Email:</strong> {debugInfo.authStatus.userEmail}</li>
                    </>
                  )}
                </ul>

                <h4>Table Status</h4>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                  <li>
                    <strong>documents:</strong> {debugInfo.tablesStatus?.documents?.exists ? 
                      '✅ Exists' : 
                      '❌ Missing - Execute setup_documents_table.sql in Supabase SQL Editor'}
                    {debugInfo.tablesStatus?.documents?.isPermissionIssue && (
                      <span style={{ color: 'red', marginLeft: '8px' }}>
                        ⚠️ Permission issue - Make sure you're logged in
                      </span>
                    )}
                  </li>
                  <li>
                    <strong>tasks:</strong> {debugInfo.tablesStatus?.tasks?.exists ? 
                      '✅ Exists' : 
                      '❌ Missing - Execute setup_tasks_table.sql in Supabase SQL Editor'}
                    {debugInfo.tablesStatus?.tasks?.isPermissionIssue && (
                      <span style={{ color: 'red', marginLeft: '8px' }}>
                        ⚠️ Permission issue - Make sure you're logged in
                      </span>
                    )}
                  </li>
                  <li>
                    <strong>campaigns:</strong> {debugInfo.tablesStatus?.campaigns?.exists ? 
                      '✅ Exists' : 
                      '❌ Missing - Execute setup_campaigns_table.sql in Supabase SQL Editor'}
                    {debugInfo.tablesStatus?.campaigns?.isPermissionIssue && (
                      <span style={{ color: 'red', marginLeft: '8px' }}>
                        ⚠️ Permission issue - Make sure you're logged in
                      </span>
                    )}
                  </li>
                </ul>
                
                <div style={{ marginTop: '1rem' }}>
                  <Button
                    onClick={checkSupabaseConnection}
                    variant="primary"
                    size="small"
                  >
                    Refresh Connection Info
                  </Button>
                </div>
              </DebugPanel>
            )}
          </div>
        </Card>
      )}
      
      {/* Main Dashboard */}
      <DashboardContainer>
        <FullWidthSection>
          <SectionHeader>
            <SectionTitle>Weekly Progress</SectionTitle>
          </SectionHeader>
          
          <StatsGrid>
            <StatCard>
              <StatIcon $color="#e0f2fe">
                <FiBarChart2 color="#0284c7" />
              </StatIcon>
              <StatValue>{taskStats.total}</StatValue>
              <StatLabel>Total Tasks</StatLabel>
            </StatCard>
            
            <StatCard>
              <StatIcon $color="#dcfce7">
                <FiCheckCircle color="#16a34a" />
              </StatIcon>
              <StatValue>{taskStats.done}</StatValue>
              <StatLabel>Completed</StatLabel>
            </StatCard>
            
            <StatCard>
              <StatIcon $color="#dbeafe">
                <FiClock color="#2563eb" />
              </StatIcon>
              <StatValue>{taskStats.inProgress}</StatValue>
              <StatLabel>In Progress</StatLabel>
            </StatCard>
            
            <StatCard>
              <StatIcon $color="#fee2e2">
                <FiAlertCircle color="#dc2626" />
              </StatIcon>
              <StatValue>{taskStats.blocked}</StatValue>
              <StatLabel>Blocked</StatLabel>
            </StatCard>
          </StatsGrid>
          
          <Card 
            style={{ marginTop: '1.5rem' }}
            title="Task Completion"
            subtitle={`${weeklyTasksProgress}% of tasks completed`}
          >
            <ProgressBar $progress={weeklyTasksProgress} />
          </Card>
        </FullWidthSection>
        
        <MainContent>
          <Section>
            <SectionHeader>
              <SectionTitle>
                <FiAlertCircle color="#f59e0b" /> Priority Tasks
              </SectionTitle>
              
              <SeeAllLink to="/tasks">
                See all <FiChevronRight size={14} />
              </SeeAllLink>
            </SectionHeader>
            
            {priorityTasks.length > 0 ? (
              <TaskList>
                {priorityTasks.map(task => (
                  <TaskItem key={task.id}>
                    <TaskStatus $status={task.status} />
                    <TaskContent>
                      <TaskTitle>{task.title}</TaskTitle>
                      <TaskMeta>
                        <Badge 
                          label={task.priority === 'p0' ? 'Critical' : 'High'} 
                          variant={task.priority === 'p0' ? 'error' : 'warning'} 
                          size="small"
                        />
                        {task.due_date && (
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        )}
                      </TaskMeta>
                    </TaskContent>
                  </TaskItem>
                ))}
              </TaskList>
            ) : (
              <Card>
                <EmptyState>
                  <FiCheckCircle />
                  <p>No priority tasks at the moment. Great job!</p>
                  <Button 
                    variant="outlined" 
                    size="small"
                    startIcon={<FiPlus />}
                  >
                    Add Task
                  </Button>
                </EmptyState>
              </Card>
            )}
          </Section>
          
          <Section>
            <SectionHeader>
              <SectionTitle>
                <FiActivity color="#3b82f6" /> Recent Activity
              </SectionTitle>
            </SectionHeader>
            
            {recentActivity.length > 0 ? (
              <ActivityList>
                {recentActivity.map((item, index) => {
                  const activityColors = {
                    task: item.status === 'done' ? '#16a34a' : item.status === 'blocked' ? '#dc2626' : '#3b82f6',
                    document: '#8b5cf6',
                    campaign: '#0891b2'
                  };
                  
                  return (
                    <ActivityItem key={`${item.type}-${item.id}`}>
                      <ActivityIcon $color={activityColors[item.type]}>
                        {getActivityIcon(item)}
                      </ActivityIcon>
                      <ActivityContent>
                        <ActivityTitle>
                          {item.type === 'task' && `Task ${item.status}: ${item.title}`}
                          {item.type === 'document' && `Document updated: ${item.title}`}
                          {item.type === 'campaign' && `Campaign ${item.status}: ${item.title || item.name}`}
                        </ActivityTitle>
                        <ActivityTime>{formatRelativeTime(item.updated_at)}</ActivityTime>
                      </ActivityContent>
                    </ActivityItem>
                  );
                })}
              </ActivityList>
            ) : (
              <Card>
                <EmptyState>
                  <FiActivity />
                  <p>No recent activity to display</p>
                </EmptyState>
              </Card>
            )}
          </Section>
        </MainContent>
        
        <Sidebar>
          <Card 
            title="Team Activity"
            variant="elevated"
          >
            {user && (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                padding: '1rem 0'
              }}>
                <Avatar name={user.email || ''} size="lg" />
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{ margin: '0 0 0.25rem' }}>{user.email?.split('@')[0] || 'User'}</h4>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#64748b'
                  }}>
                    Active Now
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '1rem',
                  width: '100%',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '1rem'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold' }}>{taskStats.done}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Completed</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold' }}>{taskStats.inProgress}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>In Progress</div>
                  </div>
                </div>
              </div>
            )}
          </Card>
          
          <Card 
            title="Upcoming Campaigns"
            variant="outlined"
            headerAction={
              <SeeAllLink to="/marketing">
                All <FiChevronRight size={14} />
              </SeeAllLink>
            }
          >
            {campaigns.length > 0 ? (
              <ActivityList>
                {campaigns.slice(0, 3).map(campaign => (
                  <ActivityItem key={campaign.id} style={{ padding: '0.75rem' }}>
                    <ActivityIcon $color="#0891b2">
                      <FiCalendar />
                    </ActivityIcon>
                    <ActivityContent>
                      <ActivityTitle>{campaign.title || campaign.name}</ActivityTitle>
                      <ActivityTime>
                        {new Date(campaign.start_date).toLocaleDateString()}
                      </ActivityTime>
                    </ActivityContent>
                  </ActivityItem>
                ))}
              </ActivityList>
            ) : (
              <EmptyState>
                <FiCalendar />
                <p>No upcoming campaigns</p>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<FiPlus />}
                >
                  Add Campaign
                </Button>
              </EmptyState>
            )}
          </Card>
          
          <Card 
            title="Recent Documents"
            variant="outlined"
            headerAction={
              <SeeAllLink to="/docs">
                All <FiChevronRight size={14} />
              </SeeAllLink>
            }
          >
            {documents.length > 0 ? (
              <ActivityList>
                {documents.map(doc => (
                  <ActivityItem key={doc.id} style={{ padding: '0.75rem' }}>
                    <ActivityIcon $color="#8b5cf6">
                      <FiFileText />
                    </ActivityIcon>
                    <ActivityContent>
                      <ActivityTitle>{doc.title}</ActivityTitle>
                      <ActivityTime>{formatRelativeTime(doc.updated_at)}</ActivityTime>
                    </ActivityContent>
                  </ActivityItem>
                ))}
              </ActivityList>
            ) : (
              <EmptyState>
                <FiFileText />
                <p>No documents yet</p>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<FiPlus />}
                >
                  Add Document
                </Button>
              </EmptyState>
            )}
          </Card>
        </Sidebar>
      </DashboardContainer>
    </>
  );
};

export default Dashboard;