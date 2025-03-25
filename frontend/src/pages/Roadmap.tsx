import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiCalendar, FiClock, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import { Campaign, Task } from '../types';

// Styled components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 150px);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  margin: 0;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background: #f5f5f5;
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterLabel = styled.span`
  font-weight: 500;
  font-size: 0.9rem;
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

const MonthSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
`;

const MonthButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  color: #555;
  
  &:hover {
    color: #5c6bc0;
  }
`;

const CurrentMonth = styled.div`
  font-weight: 500;
  min-width: 120px;
  text-align: center;
`;

const RoadmapContainer = styled.div`
  flex: 1;
  overflow-x: auto;
  border: 1px solid #eee;
  border-radius: 8px;
  background: white;
`;

const TimelineHeader = styled.div`
  display: flex;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  background: #f9f9f9;
  z-index: 10;
`;

const TimelineHeaderCell = styled.div`
  padding: 1rem;
  min-width: 150px;
  text-align: center;
  font-weight: 500;
  border-right: 1px solid #eee;
  flex-shrink: 0;
  
  &:last-child {
    border-right: none;
  }
`;

const TimelineContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const CampaignRow = styled.div`
  display: flex;
  border-bottom: 1px solid #eee;
  position: relative;
  
  &:last-child {
    border-bottom: none;
  }
`;

const CampaignLabel = styled.div`
  padding: 1rem;
  min-width: 200px;
  font-weight: 500;
  border-right: 1px solid #eee;
  background: #f9f9f9;
  position: sticky;
  left: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CampaignStatus = styled.span<{ status: string }>`
  font-size: 0.7rem;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  background: ${({ status }) => 
    status === 'draft' ? '#f5f5f5' :
    status === 'scheduled' ? '#e3f2fd' :
    status === 'active' ? '#e8f5e9' :
    status === 'completed' ? '#f1f8e9' :
    '#ffebee'
  };
  color: ${({ status }) => 
    status === 'draft' ? '#757575' :
    status === 'scheduled' ? '#1976d2' :
    status === 'active' ? '#388e3c' :
    status === 'completed' ? '#689f38' :
    '#d32f2f'
  };
`;

const TimelineCells = styled.div`
  display: flex;
  flex: 1;
`;

const TimelineCell = styled.div`
  min-width: 150px;
  height: 100%;
  border-right: 1px solid #eee;
  position: relative;
  padding: 0.5rem;
  
  &:last-child {
    border-right: none;
  }
`;

const CampaignBar = styled.div<{ color: string; offsetLeft: number; width: number }>`
  position: absolute;
  height: 30px;
  top: 50%;
  transform: translateY(-50%);
  background: ${({ color }) => color || '#5c6bc0'};
  opacity: 0.8;
  border-radius: 4px;
  left: ${({ offsetLeft }) => `${offsetLeft}px`};
  width: ${({ width }) => `${width}px`};
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    opacity: 1;
  }
`;

const TasksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const TaskItem = styled.div<{ priority: string }>`
  background: white;
  border-radius: 4px;
  padding: 0.5rem;
  font-size: 0.8rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 3px solid ${({ priority }) => 
    priority === 'p0' ? '#e74c3c' : 
    priority === 'p1' ? '#f39c12' : 
    priority === 'p2' ? '#3498db' : 
    '#7f8c8d'
  };
  cursor: grab;
  
  &:hover {
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
`;

const EmptyStateText = styled.p`
  color: #666;
  margin-bottom: 1rem;
`;

const EmptyStateButton = styled.button`
  padding: 0.75rem 1rem;
  background: #5c6bc0;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background: #4a5ab9;
  }
`;

// Component
const Roadmap: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  
  // Calculate date range based on view mode and current date
  const getDateRange = () => {
    const dates: Date[] = [];
    const startDate = new Date(currentDate);
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    
    if (viewMode === 'month') {
      // Month view: show all days in the current month
      startDate.setDate(1); // First day of month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let i = 0; i < daysInMonth; i++) {
        const date = new Date(year, month, i + 1);
        dates.push(date);
      }
    } else {
      // Week view: show 7 days starting from current date
      const dayOfWeek = startDate.getDay();
      startDate.setDate(startDate.getDate() - dayOfWeek); // Start from Sunday
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        dates.push(date);
      }
    }
    
    return dates;
  };
  
  const dateRange = getDateRange();
  
  // Format month for display
  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  // Format day for display
  const formatDay = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  };
  
  // Navigate to previous period
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };
  
  // Navigate to next period
  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };
  
  // Fetch campaigns and tasks on component mount and when date range changes
  useEffect(() => {
    fetchData();
  }, [currentDate, viewMode]);
  
  // Function to fetch campaigns and tasks
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range for fetching data
      const startOfRange = dateRange[0];
      const endOfRange = dateRange[dateRange.length - 1];
      
      startOfRange.setHours(0, 0, 0, 0);
      endOfRange.setHours(23, 59, 59, 999);
      
      // Format dates for Supabase query
      const startDate = startOfRange.toISOString();
      const endDate = endOfRange.toISOString();
      
      // Fetch campaigns that overlap with the date range
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);
        
      if (campaignError) {
        throw campaignError;
      }
      
      // If status filter is applied, filter campaigns
      let filteredCampaigns = campaignData || [];
      if (selectedStatus) {
        filteredCampaigns = filteredCampaigns.filter(
          campaign => campaign.status === selectedStatus
        );
      }
      
      setCampaigns(filteredCampaigns);
      
      // Fetch tasks associated with these campaigns
      if (filteredCampaigns.length > 0) {
        const campaignIds = filteredCampaigns.map(c => c.id);
        
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .in('campaign_id', campaignIds);
          
        if (taskError) {
          throw taskError;
        }
        
        setTasks(taskData || []);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get tasks for a specific campaign
  const getTasksForCampaign = (campaignId: string) => {
    return tasks.filter(task => task.campaign_id === campaignId);
  };
  
  // Calculate campaign bar position and width
  const calculateCampaignPosition = (campaign: Campaign) => {
    const startDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);
    
    // Find the index of the start date in our date range
    const startIdx = dateRange.findIndex(date => 
      date.getDate() === startDate.getDate() && 
      date.getMonth() === startDate.getMonth() && 
      date.getFullYear() === startDate.getFullYear()
    );
    
    // If campaign starts before our date range, adjust
    const adjustedStartIdx = startIdx === -1 ? 0 : startIdx;
    
    // Find the index of the end date in our date range
    const endIdx = dateRange.findIndex(date => 
      date.getDate() === endDate.getDate() && 
      date.getMonth() === endDate.getMonth() && 
      date.getFullYear() === endDate.getFullYear()
    );
    
    // If campaign ends after our date range, adjust
    const adjustedEndIdx = endIdx === -1 ? dateRange.length - 1 : endIdx;
    
    // Calculate width (number of days * cell width)
    const cellWidth = 150; // Should match TimelineCell min-width
    const daysSpan = adjustedEndIdx - adjustedStartIdx + 1;
    const width = daysSpan * cellWidth;
    
    // Calculate left offset
    const offsetLeft = adjustedStartIdx * cellWidth;
    
    return { width, offsetLeft };
  };
  
  // Function to handle drag start for tasks
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };
  
  // Function to handle drag over for timeline cells
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  // Function to handle drop for timeline cells
  const handleDrop = async (e: React.DragEvent, date: Date, campaignId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    
    // Update task due date and campaign
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          due_date: date.toISOString().split('T')[0],
          campaign_id: campaignId
        })
        .eq('id', taskId);
        
      if (error) {
        throw error;
      }
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };
  
  return (
    <Container>
      <Header>
        <Title>Marketing Roadmap</Title>
        <Actions>
          <ActionButton onClick={() => setViewMode('month')}>
            <FiCalendar size={16} /> Month View
          </ActionButton>
          <ActionButton onClick={() => setViewMode('week')}>
            <FiClock size={16} /> Week View
          </ActionButton>
        </Actions>
      </Header>
      
      <FiltersContainer>
        <FilterLabel>
          <FiFilter size={16} style={{ marginRight: '0.5rem' }} />
          Status:
        </FilterLabel>
        <FilterButton 
          active={selectedStatus === null ? true : undefined} 
          onClick={() => setSelectedStatus(null)}
        >
          All
        </FilterButton>
        <FilterButton 
          active={selectedStatus === 'draft' ? true : undefined} 
          onClick={() => setSelectedStatus('draft')}
        >
          Draft
        </FilterButton>
        <FilterButton 
          active={selectedStatus === 'scheduled' ? true : undefined} 
          onClick={() => setSelectedStatus('scheduled')}
        >
          Scheduled
        </FilterButton>
        <FilterButton 
          active={selectedStatus === 'active' ? true : undefined} 
          onClick={() => setSelectedStatus('active')}
        >
          Active
        </FilterButton>
        <FilterButton 
          active={selectedStatus === 'completed' ? true : undefined} 
          onClick={() => setSelectedStatus('completed')}
        >
          Completed
        </FilterButton>
        
        <MonthSelector>
          <MonthButton onClick={goToPrevious}>
            <FiChevronLeft size={20} />
          </MonthButton>
          <CurrentMonth>
            {viewMode === 'month' 
              ? formatMonth(currentDate) 
              : `Week of ${dateRange[0].toLocaleDateString()}`
            }
          </CurrentMonth>
          <MonthButton onClick={goToNext}>
            <FiChevronRight size={20} />
          </MonthButton>
        </MonthSelector>
      </FiltersContainer>
      
      {isLoading ? (
        <LoadingContainer>
          <p>Loading roadmap...</p>
        </LoadingContainer>
      ) : campaigns.length > 0 ? (
        <RoadmapContainer>
          <TimelineHeader>
            {/* Empty cell for campaign labels */}
            <TimelineHeaderCell style={{ minWidth: '200px' }}>
              Campaign
            </TimelineHeaderCell>
            
            {/* Date cells */}
            {dateRange.map((date, index) => (
              <TimelineHeaderCell key={index}>
                {formatDay(date)}
              </TimelineHeaderCell>
            ))}
          </TimelineHeader>
          
          <TimelineContent>
            {campaigns.map(campaign => {
              const campaignPosition = calculateCampaignPosition(campaign);
              const campaignTasks = getTasksForCampaign(campaign.id);
              
              return (
                <CampaignRow key={campaign.id}>
                  <CampaignLabel>
                    <span>{campaign.title}</span>
                    <CampaignStatus status={campaign.status}>
                      {campaign.status}
                    </CampaignStatus>
                  </CampaignLabel>
                  
                  <TimelineCells>
                    {/* Render the campaign bar */}
                    <CampaignBar 
                      color={campaign.color || '#5c6bc0'} 
                      offsetLeft={campaignPosition.offsetLeft} 
                      width={campaignPosition.width}
                    >
                      {campaign.title}
                    </CampaignBar>
                    
                    {/* Render cells for each date */}
                    {dateRange.map((date, index) => (
                      <TimelineCell 
                        key={index}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, date, campaign.id)}
                      >
                        {/* Show tasks that are due on this date for this campaign */}
                        <TasksList>
                          {campaignTasks
                            .filter(task => {
                              if (!task.due_date) return false;
                              const taskDate = new Date(task.due_date);
                              return (
                                taskDate.getDate() === date.getDate() &&
                                taskDate.getMonth() === date.getMonth() &&
                                taskDate.getFullYear() === date.getFullYear()
                              );
                            })
                            .map(task => (
                              <TaskItem 
                                key={task.id} 
                                priority={task.priority}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task.id)}
                              >
                                {task.title}
                              </TaskItem>
                            ))}
                        </TasksList>
                      </TimelineCell>
                    ))}
                  </TimelineCells>
                </CampaignRow>
              );
            })}
          </TimelineContent>
        </RoadmapContainer>
      ) : (
        <EmptyState>
          <EmptyStateText>
            No campaigns found for this time period. 
            Try changing the date range or creating a new campaign.
          </EmptyStateText>
          <EmptyStateButton onClick={() => window.location.href = '/marketing'}>
            Go to Marketing Calendar
          </EmptyStateButton>
        </EmptyState>
      )}
    </Container>
  );
};

export default Roadmap;