import React from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ContentWrapper = styled.div`
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading application...</div>;
  }

  // Auth check is now handled by ProtectedRoute component in App.tsx
  return (
    <LayoutContainer>
      <Sidebar />
      <MainContent>
        <Header />
        <ContentWrapper>{children}</ContentWrapper>
      </MainContent>
    </LayoutContainer>
  );
};

export default Layout;