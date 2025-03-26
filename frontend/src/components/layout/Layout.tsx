import React, { useState } from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.ui.background};
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  transition: all ${({ theme }) => theme.transitions.medium};
`;

const ContentWrapper = styled.div`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.xl};
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const LoadingOverlay = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.ui.background};
  z-index: 999;
  
  h2 {
    margin-top: ${({ theme }) => theme.spacing.md};
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: 600;
  }
  
  p {
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid ${({ theme }) => theme.colors.ui.divider};
  border-radius: 50%;
  border-top-color: ${({ theme }) => theme.colors.primary.main};
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (isLoading) {
    return (
      <LoadingOverlay>
        <LoadingSpinner />
        <h2>Loading RPM</h2>
        <p>Preparing your workspace...</p>
      </LoadingOverlay>
    );
  }

  // Auth check is now handled by ProtectedRoute component in App.tsx
  return (
    <LayoutContainer>
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <MainContent>
        <Header sidebarCollapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />
        <ContentWrapper>{children}</ContentWrapper>
      </MainContent>
    </LayoutContainer>
  );
};

export default Layout;