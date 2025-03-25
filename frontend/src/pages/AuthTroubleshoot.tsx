import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../services/supabase';
import { extractAndProcessAuthToken } from '../utils/authRedirect';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Header = styled.header`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 1.1rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
`;

const CardTitle = styled.h2`
  color: #333;
  margin-top: 0;
  margin-bottom: 1rem;
`;

const Button = styled.button`
  background: #5c6bc0;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1rem;
  
  &:hover {
    background: #4a5ab9;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  margin-bottom: 1rem;
  
  &:focus {
    outline: none;
    border-color: #5c6bc0;
  }
`;

const InfoBox = styled.div<{ type: 'info' | 'success' | 'error' }>`
  background: ${({ type }) => 
    type === 'info' ? '#e3f2fd' : 
    type === 'success' ? '#e8f5e9' : 
    '#ffebee'
  };
  border-left: 4px solid ${({ type }) => 
    type === 'info' ? '#2196f3' : 
    type === 'success' ? '#4caf50' : 
    '#f44336'
  };
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 4px;
`;

const AuthTroubleshoot = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check current auth status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsAuthenticated(true);
      }
    };
    
    checkAuth();
    
    // Try automatic token extraction first
    const autoProcess = async () => {
      try {
        const result = await extractAndProcessAuthToken();
        if (result && !result.error) {
          setStatus('success');
          setMessage('Authentication completed automatically!');
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Auto token processing error:', err);
      }
    };
    
    autoProcess();
  }, []);
  
  const handleTokenSubmit = async () => {
    if (!token.trim()) {
      setStatus('error');
      setMessage('Please enter a valid token');
      return;
    }
    
    setStatus('processing');
    
    try {
      // Trying to manually set the session with the token
      const { data, error } = await supabase.auth.setSession({
        access_token: token.trim(),
        refresh_token: '',
      });
      
      if (error) {
        throw error;
      }
      
      if (data.session) {
        setStatus('success');
        setMessage('Authentication successful! Redirecting to dashboard...');
        setIsAuthenticated(true);
        
        // Navigate to dashboard after a brief delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setStatus('error');
        setMessage('Authentication failed. The token may be invalid or expired.');
      }
    } catch (err) {
      console.error('Manual auth error:', err);
      setStatus('error');
      setMessage('Authentication error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };
  
  const handleGoToLogin = () => {
    navigate('/login');
  };
  
  const handleGoToDashboard = () => {
    navigate('/');
  };
  
  return (
    <Container>
      <Header>
        <Title>Authentication Troubleshooter</Title>
        <Subtitle>Fix login issues with your RPM account</Subtitle>
      </Header>
      
      {isAuthenticated ? (
        <Card>
          <CardTitle>Already Authenticated</CardTitle>
          <p>You are already logged in to your RPM account.</p>
          <Button onClick={handleGoToDashboard}>Go to Dashboard</Button>
        </Card>
      ) : (
        <>
          <Card>
            <CardTitle>Authentication Helper</CardTitle>
            
            {status === 'success' && (
              <InfoBox type="success">
                <p>{message}</p>
              </InfoBox>
            )}
            
            {status === 'error' && (
              <InfoBox type="error">
                <p>{message}</p>
              </InfoBox>
            )}
            
            <p>
              This tool helps you manually complete your login if the automatic redirect didn't work.
              When you clicked the magic link in your email, it should have brought you to this app with
              an authentication token.
            </p>
            
            <p>
              <strong>Option 1:</strong> Copy the token from your URL after <code>#access_token=</code> or <code>?access_token=</code> and 
              paste it below:
            </p>
            
            <Input
              type="text"
              placeholder="Paste your access token here"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            
            <Button 
              onClick={handleTokenSubmit}
              disabled={status === 'processing' || !token.trim()}
            >
              {status === 'processing' ? 'Processing...' : 'Complete Authentication'}
            </Button>
          </Card>
          
          <Card>
            <CardTitle>Start Over</CardTitle>
            <p>
              If you'd prefer to start the login process again, you can return to the login page
              and request a new magic link.
            </p>
            <Button onClick={handleGoToLogin}>Back to Login</Button>
          </Card>
        </>
      )}
    </Container>
  );
};

export default AuthTroubleshoot;