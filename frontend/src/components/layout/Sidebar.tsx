import React from 'react';
import styled, { css } from 'styled-components';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiList, 
  FiCalendar, 
  FiFileText, 
  FiUser, 
  FiTarget,
  FiMap, 
  FiClock,
  FiSettings, 
  FiHelpCircle,
  FiChevronLeft, 
  FiChevronRight 
} from 'react-icons/fi';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const SIDEBAR_EXPANDED_WIDTH = '240px';
const SIDEBAR_COLLAPSED_WIDTH = '72px';

const SidebarContainer = styled.aside<{ $collapsed: boolean }>`
  width: ${({ $collapsed }) => ($collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH)};
  min-width: ${({ $collapsed }) => ($collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH)};
  background: ${({ theme }) => theme.colors.dark.background};
  color: white;
  height: 100vh;
  transition: all ${({ theme }) => theme.transitions.medium};
  position: sticky;
  top: 0;
  overflow-x: hidden;
  
  @media (max-width: 768px) {
    position: fixed;
    left: ${({ $collapsed }) => ($collapsed ? `-${SIDEBAR_COLLAPSED_WIDTH}` : '0')};
    z-index: 1000;
    width: ${SIDEBAR_EXPANDED_WIDTH};
  }
`;

const Logo = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
  height: 64px;
  padding: ${({ $collapsed, theme }) => 
    $collapsed ? theme.spacing.md : `${theme.spacing.md} ${theme.spacing.lg}`};
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.dark.border};
  color: white;
  
  span {
    margin-left: ${({ theme }) => theme.spacing.sm};
    transition: opacity ${({ theme }) => theme.transitions.fast};
    opacity: ${({ $collapsed }) => ($collapsed ? '0' : '1')};
    overflow: hidden;
    white-space: nowrap;
  }
`;

const NavItems = styled.nav`
  padding: ${({ theme }) => theme.spacing.md} 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const SidebarSection = styled.div<{ $collapsed: boolean }>`
  padding: ${({ $collapsed, theme }) => 
    $collapsed ? `${theme.spacing.sm} 0` : `${theme.spacing.sm} ${theme.spacing.md}`};
  margin-top: ${({ theme }) => theme.spacing.sm};
  
  span {
    display: ${({ $collapsed }) => ($collapsed ? 'none' : 'block')};
    font-size: 0.75rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.disabled};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: ${({ theme }) => theme.spacing.xs};
    padding-left: ${({ theme }) => theme.spacing.sm};
  }
`;

const commonNavItemStyles = css<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  padding: ${({ $collapsed, theme }) => 
    $collapsed 
      ? `${theme.spacing.sm} 0` 
      : `${theme.spacing.sm} ${theme.spacing.md}`};
  color: ${({ theme }) => theme.colors.text.hint};
  text-decoration: none;
  transition: all ${({ theme }) => theme.transitions.fast};
  border-radius: ${({ $collapsed }) => ($collapsed ? '0' : '6px')};
  margin: ${({ $collapsed, theme }) => 
    $collapsed 
      ? '0' 
      : `0 ${theme.spacing.xs}`};
  position: relative;
  
  svg {
    min-width: ${SIDEBAR_COLLAPSED_WIDTH};
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  span {
    transition: opacity ${({ theme }) => theme.transitions.fast};
    opacity: ${({ $collapsed }) => ($collapsed ? '0' : '1')};
    overflow: hidden;
    white-space: nowrap;
  }
  
  &:hover {
    color: white;
    background: ${({ theme }) => theme.colors.dark.surface};
  }
`;

const NavItem = styled(NavLink)<{ $collapsed: boolean }>`
  ${commonNavItemStyles}
  
  &.active {
    color: white;
    background: ${({ theme }) => theme.colors.primary.main};
    font-weight: 500;
    
    &:hover {
      background: ${({ theme }) => theme.colors.primary.dark};
    }
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: ${({ theme }) => theme.colors.primary.light};
    }
  }
`;

const UserSection = styled.div<{ $collapsed: boolean }>`
  padding: ${({ $collapsed, theme }) => 
    $collapsed ? theme.spacing.md : `${theme.spacing.md} ${theme.spacing.lg}`};
  border-top: 1px solid ${({ theme }) => theme.colors.dark.border};
  margin-top: auto;
  position: absolute;
  bottom: 0;
  width: 100%;
  background: ${({ theme }) => theme.colors.dark.surface};
  
  .user-info {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.sm};
    margin-bottom: ${({ $collapsed, theme }) => ($collapsed ? '0' : theme.spacing.sm)};
    
    .user-details {
      transition: opacity ${({ theme }) => theme.transitions.fast};
      opacity: ${({ $collapsed }) => ($collapsed ? '0' : '1')};
      overflow: hidden;
      white-space: nowrap;
      
      h4 {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 500;
        color: white;
      }
      
      p {
        margin: 0;
        font-size: 0.75rem;
        color: ${({ theme }) => theme.colors.text.hint};
      }
    }
  }
`;

const SignOutButton = styled.button<{ $collapsed: boolean }>`
  ${commonNavItemStyles}
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: inherit;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
  color: ${({ theme }) => theme.colors.text.hint};
  
  &:hover {
    color: ${({ theme }) => theme.colors.status.error};
  }
`;

const CollapseButton = styled.button<{ $collapsed: boolean }>`
  position: absolute;
  bottom: ${({ theme }) => theme.spacing.xl};
  right: ${({ $collapsed, theme }) => ($collapsed ? '50%' : theme.spacing.sm)};
  transform: ${({ $collapsed }) => ($collapsed ? 'translateX(50%)' : 'none')};
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.dark.surface};
  border: 1px solid ${({ theme }) => theme.colors.dark.border};
  color: ${({ theme }) => theme.colors.text.hint};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.dark.border};
    color: white;
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileOverlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  visibility: ${({ $visible }) => ($visible ? 'visible' : 'hidden')};
  transition: all ${({ theme }) => theme.transitions.medium};
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  
  const isMobile = window.innerWidth <= 768;
  const mobileOverlayVisible = !collapsed && isMobile;

  // Helper to determine if a navitem should be active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Get username from email
  const getUsernameFromEmail = (email: string | undefined) => {
    if (!email) return 'User';
    return email.split('@')[0];
  };

  return (
    <>
      <MobileOverlay $visible={mobileOverlayVisible} onClick={onToggle} />
      <SidebarContainer $collapsed={collapsed}>
        <Logo $collapsed={collapsed}>
          <FiTarget size={24} />
          <span>RPM</span>
        </Logo>
        
        <NavItems>
          <NavItem to="/" $collapsed={collapsed} end>
            <FiHome size={20} />
            <span>Dashboard</span>
          </NavItem>
          
          <NavItem to="/tasks" $collapsed={collapsed}>
            <FiList size={20} />
            <span>All Tasks</span>
          </NavItem>
          
          <NavItem to="/today" $collapsed={collapsed}>
            <FiTarget size={20} />
            <span>Today</span>
          </NavItem>
          
          <NavItem to="/planner" $collapsed={collapsed}>
            <FiMap size={20} />
            <span>Planning & Roadmap</span>
          </NavItem>
          
          <NavItem to="/marketing" $collapsed={collapsed}>
            <FiCalendar size={20} />
            <span>Marketing</span>
          </NavItem>
          
          <NavItem to="/docs" $collapsed={collapsed}>
            <FiFileText size={20} />
            <span>Documents</span>
          </NavItem>
        </NavItems>
        
        <SidebarSection $collapsed={collapsed}>
          <span>Account</span>
          
          <NavItem to="/profile" $collapsed={collapsed}>
            <FiUser size={20} />
            <span>Profile</span>
          </NavItem>
          
          <NavItem to="/settings" $collapsed={collapsed}>
            <FiSettings size={20} />
            <span>Settings</span>
          </NavItem>
          
          <NavItem to="/help" $collapsed={collapsed}>
            <FiHelpCircle size={20} />
            <span>Help</span>
          </NavItem>
        </SidebarSection>
        
        {user && (
          <UserSection $collapsed={collapsed}>
            <div className="user-info">
              <Avatar 
                name={user.email || ''} 
                size="sm"
              />
              <div className="user-details">
                <h4>{getUsernameFromEmail(user.email)}</h4>
                <p>{user.email}</p>
              </div>
            </div>
            <SignOutButton onClick={signOut} $collapsed={collapsed}>
              <FiClock size={20} />
              <span>Sign Out</span>
            </SignOutButton>
          </UserSection>
        )}
        
        <CollapseButton onClick={onToggle} $collapsed={collapsed}>
          {collapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
        </CollapseButton>
      </SidebarContainer>
    </>
  );
};

export default Sidebar;