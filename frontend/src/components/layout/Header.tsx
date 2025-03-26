import React, { useState } from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import { FiBell, FiPlus, FiSearch, FiMenu, FiX, FiUser, FiSettings, FiHelpCircle } from 'react-icons/fi';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.xl}`};
  background: ${({ theme }) => theme.colors.ui.card};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  z-index: 10;
  transition: all ${({ theme }) => theme.transitions.fast};

  @media (max-width: 768px) {
    padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const MenuToggle = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.ui.hover};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.h3.fontSize};
  font-weight: ${({ theme }) => theme.typography.h3.fontWeight};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.typography.h4.fontSize};
  }
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-left: ${({ theme }) => theme.spacing.lg};
  
  @media (max-width: 1024px) {
    display: none;
  }
`;

const SearchInput = styled.input`
  background: ${({ theme }) => theme.colors.ui.hover};
  border: 1px solid ${({ theme }) => theme.colors.ui.divider};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.xl} ${theme.spacing.xs} ${theme.spacing.lg}`};
  width: 250px;
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:focus {
    outline: none;
    width: 300px;
    background: ${({ theme }) => theme.colors.ui.card};
    border-color: ${({ theme }) => theme.colors.primary.light};
    box-shadow: 0 0 0 2px rgba(61, 90, 254, 0.1);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  pointer-events: none;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const IconButton = styled.button`
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.secondary};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.ui.hover};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const NotificationIndicator = styled.span`
  position: absolute;
  top: 5px;
  right: 5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.status.error};
`;

const UserMenuContainer = styled.div`
  position: relative;
`;

const UserMenuTrigger = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  background: none;
  border: none;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.ui.hover};
  }
`;

const UserInfo = styled.div`
  text-align: left;
  display: none;
  
  @media (min-width: 640px) {
    display: block;
  }
`;

const UserName = styled.div`
  font-weight: 500;
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const UserEmail = styled.div`
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const UserMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: ${({ theme }) => theme.colors.ui.card};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  width: 220px;
  z-index: 100;
  overflow: hidden;
  
  opacity: ${({ $isOpen }) => ($isOpen ? '1' : '0')};
  visibility: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
  transform: ${({ $isOpen }) => ($isOpen ? 'translateY(0)' : 'translateY(-10px)')};
  transition: all ${({ theme }) => theme.transitions.fast};
`;

const UserMenuHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.ui.divider};
`;

const UserMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.ui.hover};
  }
  
  &.danger {
    color: ${({ theme }) => theme.colors.status.error};
  }
`;

const UserMenuDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.ui.divider};
  margin: ${({ theme }) => `${theme.spacing.xs} 0`};
`;

interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarCollapsed, onToggleSidebar }) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen && !(event.target as Element).closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Determine the page title based on the current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/tasks')) return 'Tasks';
    if (path.startsWith('/marketing')) return 'Marketing Planner';
    if (path.startsWith('/docs')) return 'Documentation';
    if (path.startsWith('/profile')) return 'Profile';
    if (path.startsWith('/today')) return 'Today';
    if (path.startsWith('/planner')) return 'Planning & Roadmap';
    return 'RPM';
  };

  // Determine the create button text based on the current route
  const getCreateButtonText = () => {
    const path = location.pathname;
    if (path.startsWith('/tasks')) return 'New Task';
    if (path.startsWith('/marketing')) return 'New Campaign';
    if (path.startsWith('/docs')) return 'New Document';
    return 'Create';
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleSignOut = () => {
    setUserMenuOpen(false);
    signOut();
  };

  // Get user initials or use a placeholder
  const getUserInitials = () => {
    if (!user || !user.email) return '';
    
    // Try to extract name from email
    const emailName = user.email.split('@')[0];
    if (emailName) {
      // If email has dots or underscores, treat them as space separators
      const nameParts = emailName.replace(/[._]/g, ' ').split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
      }
      return emailName.substring(0, 2).toUpperCase();
    }
    
    return '';
  };

  return (
    <HeaderContainer>
      <LeftSection>
        <MenuToggle onClick={onToggleSidebar}>
          {sidebarCollapsed ? <FiMenu size={20} /> : <FiX size={20} />}
        </MenuToggle>
        <PageTitle>{getPageTitle()}</PageTitle>
        
        <SearchContainer>
          <SearchIcon>
            <FiSearch size={16} />
          </SearchIcon>
          <SearchInput placeholder="Search..." />
        </SearchContainer>
      </LeftSection>
      
      <RightSection>
        <IconButton aria-label="Notifications" style={{ position: 'relative' }}>
          <FiBell size={20} />
          <NotificationIndicator />
        </IconButton>
        
        <Button 
          variant="primary"
          size="medium"
          startIcon={<FiPlus size={16} />}
        >
          {getCreateButtonText()}
        </Button>
        
        <UserMenuContainer className="user-menu-container">
          <UserMenuTrigger onClick={toggleUserMenu}>
            <Avatar 
              name={user?.email || ''} 
              size="sm" 
            />
            
            <UserInfo>
              <UserName>{user?.email?.split('@')[0] || 'User'}</UserName>
              <UserEmail>{user?.email || ''}</UserEmail>
            </UserInfo>
          </UserMenuTrigger>
          
          <UserMenu $isOpen={userMenuOpen}>
            <UserMenuHeader>
              <UserName style={{ marginBottom: '4px' }}>
                {user?.email?.split('@')[0] || 'User'}
              </UserName>
              <UserEmail>{user?.email || ''}</UserEmail>
            </UserMenuHeader>
            
            <UserMenuItem onClick={() => setUserMenuOpen(false)}>
              <FiUser size={16} />
              Profile
            </UserMenuItem>
            
            <UserMenuItem onClick={() => setUserMenuOpen(false)}>
              <FiSettings size={16} />
              Settings
            </UserMenuItem>
            
            <UserMenuItem onClick={() => setUserMenuOpen(false)}>
              <FiHelpCircle size={16} />
              Help & Support
            </UserMenuItem>
            
            <UserMenuDivider />
            
            <UserMenuItem onClick={handleSignOut} className="danger">
              <FiX size={16} />
              Sign Out
            </UserMenuItem>
          </UserMenu>
        </UserMenuContainer>
      </RightSection>
    </HeaderContainer>
  );
};

export default Header;