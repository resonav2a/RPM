import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiCheckCircle, FiAlertCircle, FiClock, FiCalendar, FiFileText, FiLink, FiInfo } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
`;

const CardTitle = styled.h2`
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
`;

const StatCard = styled.div`
  background: #f9f9f9;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.75rem;
  font-weight: 600;
  color: #5c6bc0;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.25rem;
`;

const TaskList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const TaskItem = styled.li`
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  &:last-child {
    border-bottom: none;
  }
`;

const TaskStatus = styled.span<{ status: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ status }) => 
    status === 'todo' ? '#f5b041' : 
    status === 'in_progress' ? '#3498db' : 
    status === 'blocked' ? '#e74c3c' : 
    '#2ecc71'
  };
`;

const TaskTitle = styled.span`
  flex: 1;
`;

const TaskDueDate = styled.span`
  font-size: 0.75rem;
  color: #777;
`;

const EventList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const EventItem = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 0.75rem;
  background: #f9f9f9;
  border-radius: 6px;
  gap: 0.75rem;
`;

const EventIcon = styled.div`
  color: #5c6bc0;
`;

const EventContent = styled.div`
  flex: 1;
`;

const EventTitle = styled.div`
  font-weight: 500;
`;

const EventDate = styled.div`
  font-size: 0.75rem;
  color: #777;
  margin-top: 0.25rem;
`;

const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  width: 100%;
  color: #777;
  font-size: 0.9rem;
`;

const DebugPanel = styled.div`
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  overflow: auto;
  max-height: 400px;
`;

const DebugInfo = styled.pre`
  font-family: monospace;
  font-size: 0.8rem;
  margin: 0;
  white-space: pre-wrap;
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
    
    return <FiLink />;
  };

  // Function to format activity text
  const getActivityText = (item: any) => {
    if (item.type === 'task') {
      return `Task ${item.status}: ${item.title}`;
    }
    
    if (item.type === 'document') {
      return `Document updated: ${item.title}`;
    }
    
    if (item.type === 'campaign') {
      return `Campaign ${item.status}: ${item.title}`;
    }
    
    return item.title;
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
        Loading dashboard data...
      </LoadingIndicator>
    );
  }

  return (
    <DashboardContainer>
      {/* Debug Panel */}
      <Card style={{ gridColumn: '1 / -1' }}>
        <CardTitle>
          <FiInfo /> Supabase Connection Debug
          <button 
            onClick={() => setDebugMode(!debugMode)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {debugMode ? 'Hide Details' : 'Show Details'}
          </button>
        </CardTitle>
        
        <div>
          <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
          <p><strong>Connected to Supabase:</strong> {debugInfo.connectionError ? '❌ No' : '✅ Yes'}</p>
          <p><strong>Available Tables:</strong> {availableTables.length > 0 ? availableTables.join(', ') : 'None found'}</p>
          
          {availableTables.length === 0 && (
            <div style={{ 
              background: '#fff3cd', 
              color: '#856404', 
              padding: '0.75rem', 
              borderRadius: '4px',
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
              
              {debugInfo.hasPermissionIssues && (
                <div style={{ 
                  background: '#f8d7da', 
                  color: '#721c24', 
                  padding: '0.75rem', 
                  borderRadius: '4px',
                  marginTop: '1rem' 
                }}>
                  <h4 style={{ marginTop: 0 }}>Authentication Issue Detected</h4>
                  <p>You appear to have permission issues with your tables. This is likely because:</p>
                  <ol>
                    <li>You are not logged in (Row Level Security requires authentication)</li>
                    <li>The tables have RLS policies that are restricting access</li>
                  </ol>
                  <p><strong>Solution:</strong> Make sure you're logged in by visiting the Login page first.</p>
                </div>
              )}
              
              <h4>Environment Variables</h4>
              <p>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
              <p>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
              
              <h4>Raw Debug Information</h4>
              <DebugInfo>{JSON.stringify(debugInfo, null, 2)}</DebugInfo>
              
              <div style={{ marginTop: '1rem' }}>
                <button 
                  onClick={checkSupabaseConnection}
                  style={{ 
                    padding: '0.5rem 1rem', 
                    background: '#5c6bc0', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Refresh Connection Info
                </button>
              </div>
            </DebugPanel>
          )}
        </div>
      </Card>
      
      {/* Regular Dashboard */}
      <Card>
        <CardTitle>
          <FiCheckCircle /> Task Overview
        </CardTitle>
        <StatGrid>
          <StatCard>
            <StatValue>{taskStats.total}</StatValue>
            <StatLabel>Total Tasks</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{taskStats.done}</StatValue>
            <StatLabel>Completed</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{taskStats.inProgress}</StatValue>
            <StatLabel>In Progress</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{taskStats.blocked}</StatValue>
            <StatLabel>Blocked</StatLabel>
          </StatCard>
        </StatGrid>
      </Card>

      <Card>
        <CardTitle>
          <FiAlertCircle /> Priority Tasks
        </CardTitle>
        {priorityTasks.length > 0 ? (
          <TaskList>
            {priorityTasks.map(task => (
              <TaskItem key={task.id}>
                <TaskStatus status={task.status} />
                <TaskTitle>{task.title}</TaskTitle>
                {task.dueDate && (
                  <TaskDueDate>Due: {new Date(task.dueDate).toLocaleDateString()}</TaskDueDate>
                )}
              </TaskItem>
            ))}
          </TaskList>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#777' }}>
            No priority tasks found
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>
          <FiClock /> Recent Activity
        </CardTitle>
        {recentActivity.length > 0 ? (
          <EventList>
            {recentActivity.map((item, index) => (
              <EventItem key={`${item.type}-${item.id}`}>
                <EventIcon>{getActivityIcon(item)}</EventIcon>
                <EventContent>
                  <EventTitle>{getActivityText(item)}</EventTitle>
                  <EventDate>{formatRelativeTime(item.updated_at)}</EventDate>
                </EventContent>
              </EventItem>
            ))}
          </EventList>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#777' }}>
            No recent activity found
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>
          <FiCalendar /> Upcoming Campaigns
        </CardTitle>
        {campaigns.length > 0 ? (
          <EventList>
            {campaigns.map(campaign => (
              <EventItem key={campaign.id}>
                <EventIcon><FiCalendar /></EventIcon>
                <EventContent>
                  <EventTitle>{campaign.title}</EventTitle>
                  <EventDate>{new Date(campaign.start_date).toLocaleDateString()}</EventDate>
                </EventContent>
              </EventItem>
            ))}
          </EventList>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#777' }}>
            No upcoming campaigns found
          </div>
        )}
      </Card>
      
      <Card>
        <CardTitle>
          <FiFileText /> Recent Documents
        </CardTitle>
        {documents.length > 0 ? (
          <EventList>
            {documents.map(doc => (
              <EventItem key={doc.id}>
                <EventIcon><FiFileText /></EventIcon>
                <EventContent>
                  <EventTitle>{doc.title}</EventTitle>
                  <EventDate>{formatRelativeTime(doc.updated_at)}</EventDate>
                </EventContent>
              </EventItem>
            ))}
          </EventList>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#777' }}>
            No documents found
          </div>
        )}
      </Card>
    </DashboardContainer>
  );
};

export default Dashboard;