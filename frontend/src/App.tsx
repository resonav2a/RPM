import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createGlobalStyle } from 'styled-components';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import theme from './utils/theme';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Documentation from './pages/Documentation';
import Marketing from './pages/Marketing';
import Roadmap from './pages/Roadmap';
import Profile from './pages/Profile';
import AuthTroubleshoot from './pages/AuthTroubleshoot';
import WeeklyPlanning from './pages/WeeklyPlanning';
import TodayMode from './pages/TodayMode';
import Layout from './components/layout/Layout';
import { supabase } from './services/supabase';
import { handleAuthRedirect, extractAndProcessAuthToken } from './utils/authRedirect';

// Global styles
const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }
  
  body {
    font-family: ${({ theme }) => theme.typography.fontFamily};
    margin: 0;
    padding: 0;
    background-color: ${({ theme }) => theme.colors.ui.background};
    color: ${({ theme }) => theme.colors.text.primary};
    line-height: 1.5;
  }

  h1, h2, h3, h4, h5, h6 {
    color: ${({ theme }) => theme.colors.text.primary};
    margin-top: 0;
    line-height: 1.2;
  }

  a {
    color: ${({ theme }) => theme.colors.primary.main};
    text-decoration: none;
    transition: color ${({ theme }) => theme.transitions.fast};
    
    &:hover {
      color: ${({ theme }) => theme.colors.primary.dark};
    }
  }

  button, input, select, textarea {
    font-family: inherit;
  }
  
  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.ui.divider};
    border-radius: ${({ theme }) => theme.borderRadius.full};
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #c1c9d6;
  }
`;

// Protected route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    // While checking auth state, show nothing or a loading indicator
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        background: theme.colors.ui.background
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: `3px solid ${theme.colors.ui.divider}`,
          borderTopColor: theme.colors.primary.main,
          animation: 'spin 1s linear infinite'
        }} />
        <div>Loading...</div>
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }
  
  if (!user) {
    // If not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated, render the child component
  return children;
};

// Debug component to test if the app is working
const DebugView = () => {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Loading...");

  useEffect(() => {
    // Check environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      setError("Missing Supabase credentials in .env file");
      setStatus("Failed");
      return;
    }
    
    // Test Supabase connection
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          throw new Error(`Supabase connection error: ${error.message}`);
        }
        
        setStatus("Connected to Supabase successfully");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setStatus("Failed");
      }
    };
    
    testConnection();
  }, []);

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: theme.typography.fontFamily
    }}>
      <h1>RPM Application Status</h1>
      <p>Status: <strong>{status}</strong></p>
      
      {error && (
        <div style={{ 
          background: '#ffebee', 
          padding: '1rem', 
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          <h3>Error:</h3>
          <pre>{error}</pre>
        </div>
      )}
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Environment Variables:</h2>
        <ul>
          <li>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</li>
          <li>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Navigation:</h2>
        <ul>
          <li><a href="/login">Login Page</a></li>
          <li><a href="/">Dashboard</a></li>
        </ul>
      </div>
    </div>
  );
};

function App() {
  const [debugMode, setDebugMode] = useState(false);
  const [processingAuth, setProcessingAuth] = useState(false);
  
  // Check for auth redirects as soon as the app loads
  useEffect(() => {
    const checkForAuthRedirect = async () => {
      setProcessingAuth(true);
      
      try {
        // First try the standard redirect handler
        const redirected = await handleAuthRedirect();
        
        // If that doesn't work, try manual token extraction
        if (!redirected) {
          const result = await extractAndProcessAuthToken();
          if (result && !result.error) {
            console.log('Manual token processing successful');
          }
        }
      } catch (err) {
        console.error('Auth redirect processing error:', err);
      } finally {
        setProcessingAuth(false);
      }
    };
    
    checkForAuthRedirect();
  }, []);
  
  // Exit debug mode after 10 seconds if everything is working
  useEffect(() => {
    // Only for development - start in debug mode to test connection
    if (import.meta.env.DEV) {
      setDebugMode(true);
      const timer = setTimeout(() => {
        setDebugMode(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  if (processingAuth) {
    return (
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          background: theme.colors.ui.background
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            border: `3px solid ${theme.colors.ui.divider}`,
            borderTopColor: theme.colors.primary.main,
            animation: 'spin 1s linear infinite',
            marginBottom: '1.5rem'
          }} />
          <h2>Completing Authentication</h2>
          <p>Please wait while we log you in.</p>
          <style>
            {`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </ThemeProvider>
    );
  }
  
  if (debugMode) {
    return (
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <DebugView />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/tasks" element={
              <ProtectedRoute>
                <Layout>
                  <Tasks />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/marketing" element={
              <ProtectedRoute>
                <Layout>
                  <Marketing />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Planner View (merged Roadmap and Weekly Planning) */}
            <Route path="/planner" element={
              <ProtectedRoute>
                <Layout>
                  <WeeklyPlanning />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Legacy routes redirected to Planner */}
            <Route path="/roadmap" element={<Navigate to="/planner" replace />} />
            <Route path="/weekly" element={<Navigate to="/planner" replace />} />
            
            {/* Campaign-specific roadmap view */}
            <Route path="/roadmap/:campaignId" element={
              <ProtectedRoute>
                <Layout>
                  <WeeklyPlanning />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Today Mode/Focus View */}
            <Route path="/today" element={
              <ProtectedRoute>
                <Layout>
                  <TodayMode />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/docs" element={
              <ProtectedRoute>
                <Layout>
                  <Documentation />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Auth troubleshoot route */}
            <Route path="/auth-help" element={<AuthTroubleshoot />} />
            
            {/* Debug route */}
            <Route path="/debug" element={<DebugView />} />
            
            {/* Catch-all route for 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;