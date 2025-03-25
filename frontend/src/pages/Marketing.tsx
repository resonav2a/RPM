import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FiPlus, FiFilter, FiMail, FiTwitter, FiInstagram, FiLinkedin, FiFileText, FiEdit, FiTrash2 } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

// Type definitions
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

// Component
const Marketing: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filter, setFilter] = useState<string | null>(null);
  const [blastMode, setBlastMode] = useState<boolean>(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
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

  // Function to fetch campaigns from Supabase
  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('start_date', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setCampaigns(data);
      }
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
                  <EventCard key={campaign.id} style={{ borderLeft: `4px solid ${campaign.color || '#5c6bc0'}` }}>
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
                                onClick={() => openEditModal(campaign)}
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
                                onClick={() => deleteCampaign(campaign.id)}
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