import React, { useState } from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { FiHome, FiList, FiCalendar, FiFileText, FiUser, FiMenu, FiX, FiMap } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const SidebarContainer = styled.aside<{ isOpen: boolean }>`
  width: 240px;
  background: #1a1a1a;
  color: white;
  height: 100vh;
  transition: all 0.3s ease;
  position: sticky;
  top: 0;
  
  @media (max-width: 768px) {
    position: fixed;
    left: ${({ isOpen }) => (isOpen ? '0' : '-240px')};
    z-index: 1000;
  }
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  padding: 1.5rem;
  text-align: center;
  border-bottom: 1px solid #333;
`;

const NavItems = styled.nav`
  padding: 1rem 0;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: #ccc;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: #333;
    color: white;
  }

  &.active {
    background: #444;
    color: white;
    border-left: 4px solid #5c6bc0;
  }

  svg {
    margin-right: 10px;
  }
`;

const UserSection = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid #333;
  margin-top: auto;
  position: absolute;
  bottom: 0;
  width: 100%;
`;

const MobileToggle = styled.button`
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #5c6bc0;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  z-index: 1001;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const Sidebar: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobileMenu = () => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      <SidebarContainer isOpen={isMobileOpen}>
        <Logo>RPM</Logo>
        <NavItems>
          <NavItem to="/" onClick={closeMobileMenu}>
            <FiHome size={18} /> Dashboard
          </NavItem>
          <NavItem to="/tasks" onClick={closeMobileMenu}>
            <FiList size={18} /> Tasks
          </NavItem>
          <NavItem to="/marketing" onClick={closeMobileMenu}>
            <FiCalendar size={18} /> Marketing
          </NavItem>
          <NavItem to="/roadmap" onClick={closeMobileMenu}>
            <FiMap size={18} /> Roadmap
          </NavItem>
          <NavItem to="/docs" onClick={closeMobileMenu}>
            <FiFileText size={18} /> Documents
          </NavItem>
          <NavItem to="/profile" onClick={closeMobileMenu}>
            <FiUser size={18} /> Profile
          </NavItem>
        </NavItems>
        {user && (
          <UserSection>
            <div>{user.email}</div>
            <button onClick={signOut}>Sign Out</button>
          </UserSection>
        )}
      </SidebarContainer>
      
      <MobileToggle onClick={toggleMobileMenu}>
        {isMobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </MobileToggle>
    </>
  );
};

export default Sidebar;