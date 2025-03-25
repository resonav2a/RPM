import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiUser, FiMail, FiSettings, FiBell, FiSave } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

const ProfileContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const ProfileCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 2rem;
`;

const CardTitle = styled.h2`
  font-size: 1.25rem;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #333;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    text-align: center;
  }
`;

const Avatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #f0f2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: #5c6bc0;
  
  @media (max-width: 768px) {
    margin: 0 auto;
  }
`;

const ProfileInfo = styled.div``;

const ProfileName = styled.h1`
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
`;

const ProfileRole = styled.p`
  font-size: 1rem;
  color: #666;
  margin: 0;
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #555;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #5c6bc0;
  }
`;

const ToggleGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ToggleLabel = styled.div``;

const ToggleTitle = styled.div`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const ToggleDescription = styled.div`
  font-size: 0.875rem;
  color: #777;
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
    background-color: #5c6bc0;
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

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
  grid-column: 1 / -1;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
`;

const PrimaryButton = styled(Button)`
  background: #5c6bc0;
  color: white;
  border: none;
  
  &:hover {
    background: #4a5ab9;
  }
`;

const SecondaryButton = styled(Button)`
  background: white;
  color: #333;
  border: 1px solid #ddd;
  
  &:hover {
    background: #f5f5f5;
  }
`;

const Profile: React.FC = () => {
  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
    role: 'User',
    notifications: {
      email: true,
      taskAssignments: true,
      taskUpdates: true,
      marketingReminders: false
    }
  });
  
  // Load user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
          console.error('Error fetching profile:', error);
          return;
        }
        
        if (data) {
          setFormData({
            fullName: data.full_name || '',
            email: user.email || '',
            role: data.role || 'User',
            notifications: data.notification_preferences || {
              email: true,
              taskAssignments: true,
              taskUpdates: true,
              marketingReminders: false
            }
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    
    fetchUserProfile();
  }, [user]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      notifications: {
        ...formData.notifications,
        [name]: checked
      }
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Save to user_profiles table in Supabase
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user?.id,
          full_name: formData.fullName,
          role: formData.role,
          notification_preferences: formData.notifications
        });
        
      if (error) {
        console.error('Error saving profile:', error);
        alert('Failed to save profile changes. Please try again.');
        return;
      }
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };
  
  return (
    <ProfileContainer>
      <ProfileCard>
        <ProfileHeader>
          <Avatar>
            <FiUser size={48} />
          </Avatar>
          <ProfileInfo>
            <ProfileName>{formData.fullName}</ProfileName>
            <ProfileRole>{formData.role}</ProfileRole>
          </ProfileInfo>
        </ProfileHeader>
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled
            />
          </FormGroup>
          
          <ActionButtons>
            <PrimaryButton type="submit">
              <FiSave size={18} /> Save Changes
            </PrimaryButton>
          </ActionButtons>
        </Form>
      </ProfileCard>
      
      <ProfileCard>
        <CardTitle>
          <FiBell /> Notification Settings
        </CardTitle>
        
        <form onSubmit={handleSubmit}>
          <ToggleGroup>
          <ToggleLabel>
            <ToggleTitle>Email Notifications</ToggleTitle>
            <ToggleDescription>Receive notifications via email</ToggleDescription>
          </ToggleLabel>
          <Toggle>
            <ToggleInput 
              type="checkbox" 
              name="email" 
              checked={formData.notifications.email} 
              onChange={handleToggleChange} 
            />
            <ToggleSlider />
          </Toggle>
        </ToggleGroup>
        
        <ToggleGroup>
          <ToggleLabel>
            <ToggleTitle>Task Assignments</ToggleTitle>
            <ToggleDescription>Get notified when tasks are assigned to you</ToggleDescription>
          </ToggleLabel>
          <Toggle>
            <ToggleInput 
              type="checkbox" 
              name="taskAssignments" 
              checked={formData.notifications.taskAssignments} 
              onChange={handleToggleChange} 
            />
            <ToggleSlider />
          </Toggle>
        </ToggleGroup>
        
        <ToggleGroup>
          <ToggleLabel>
            <ToggleTitle>Task Updates</ToggleTitle>
            <ToggleDescription>Get notified when tasks you created are updated</ToggleDescription>
          </ToggleLabel>
          <Toggle>
            <ToggleInput 
              type="checkbox" 
              name="taskUpdates" 
              checked={formData.notifications.taskUpdates} 
              onChange={handleToggleChange} 
            />
            <ToggleSlider />
          </Toggle>
        </ToggleGroup>
        
        <ToggleGroup>
          <ToggleLabel>
            <ToggleTitle>Marketing Reminders</ToggleTitle>
            <ToggleDescription>Get reminders for scheduled marketing campaigns</ToggleDescription>
          </ToggleLabel>
          <Toggle>
            <ToggleInput 
              type="checkbox" 
              name="marketingReminders" 
              checked={formData.notifications.marketingReminders} 
              onChange={handleToggleChange} 
            />
            <ToggleSlider />
          </Toggle>
        </ToggleGroup>
        
        <ActionButtons>
          <SecondaryButton type="button" onClick={() => {
            setFormData(prev => ({
              ...prev,
              notifications: {
                email: true,
                taskAssignments: true,
                taskUpdates: true,
                marketingReminders: false
              }
            }));
          }}>
            Reset to Defaults
          </SecondaryButton>
          <PrimaryButton type="submit">
            <FiSave size={18} /> Save Settings
          </PrimaryButton>
        </ActionButtons>
        </form>
      </ProfileCard>
      
      <ProfileCard>
        <CardTitle>
          <FiSettings /> Account Settings
        </CardTitle>
        
        <ActionButtons>
          <SecondaryButton type="button" style={{ color: '#e53935' }}>
            Delete Account
          </SecondaryButton>
        </ActionButtons>
      </ProfileCard>
    </ProfileContainer>
  );
};

export default Profile;