import React from 'react';
import styled from 'styled-components';
import { FiBell, FiPlus } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 10;

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
  }
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #444;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f0f0;
  }
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #5c6bc0;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #4a5ab9;
  }

  @media (max-width: 768px) {
    span {
      display: none;
    }
    padding: 0.5rem;
  }
`;

const Header: React.FC = () => {
  const location = useLocation();
  
  // Determine the page title based on the current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/tasks')) return 'Tasks';
    if (path.startsWith('/marketing')) return 'Marketing Planner';
    if (path.startsWith('/docs')) return 'Documentation';
    if (path.startsWith('/profile')) return 'Profile';
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

  return (
    <HeaderContainer>
      <PageTitle>{getPageTitle()}</PageTitle>
      <ActionsContainer>
        <IconButton aria-label="Notifications">
          <FiBell size={20} />
        </IconButton>
        <CreateButton>
          <FiPlus size={18} />
          <span>{getCreateButtonText()}</span>
        </CreateButton>
      </ActionsContainer>
    </HeaderContainer>
  );
};

export default Header;