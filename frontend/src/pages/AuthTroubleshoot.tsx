import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { FiAlertCircle, FiArrowLeft, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import { extractAndProcessAuthToken } from '../utils/authRedirect';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => `
    linear-gradient(
      135deg, 
      ${theme.colors.primary.light}15, 
      ${theme.colors.secondary.light}10
    )
  `};
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.ui.card};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  width: 100%;
  max-width: 480px;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.h2.fontSize};
  font-weight: ${({ theme }) => theme.typography.h2.fontWeight};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Description = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.ui.hover};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.h4.fontSize};
  font-weight: ${({ theme }) => theme.typography.h4.fontWeight};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  
  svg {
    margin-right: ${({ theme }) => theme.spacing.xs};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.primary};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.main};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary.main}20;
  }
`;

const InfoBox = styled.div<{ type: 'info' | 'success' | 'error' }>`
  background: ${({ type, theme }) => 
    type === 'info' ? theme.colors.primary.light + '15' : 
    type === 'success' ? theme.colors.status.success + '15' : 
    theme.colors.status.error + '15'
  };
  border-left: 4px solid ${({ type, theme }) => 
    type === 'info' ? theme.colors.primary.main : 
    type === 'success' ? theme.colors.status.success : 
    theme.colors.status.error
  };
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
`;

const LoginLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.primary.main};
  text-decoration: none;
  margin-top: ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  
  svg {
    margin-right: ${({ theme }) => theme.spacing.xs};
  }
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary.dark};
  }
`;

const InfoText = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  
  strong {
    display: block;
    margin-top: ${({ theme }) => theme.spacing.sm};
    margin-bottom: ${({ theme }) => theme.spacing.xs};
  }
`;

const SuccessMessage = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.status.success};
  margin-top: ${({ theme }) => theme.spacing.sm};
  
  svg {
    margin-right: ${({ theme }) => theme.spacing.xs};
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.status.error};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const Code = styled.code`
  background: ${({ theme }) => theme.colors.ui.background};
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-family: monospace;
  font-size: 0.9em;
  overflow-wrap: break-word;
  display: inline-block;
  margin: 0 ${({ theme }) => theme.spacing.xs};
`;

const AuthDebugInfo = styled.pre`
  background: ${({ theme }) => theme.colors.ui.background};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-family: monospace;
  font-size: 0.8em;
  overflow-x: auto;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: ${({ theme }) => theme.spacing.md};
  max-height: 120px;
`;

const AuthTroubleshoot = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [manualAuthSuccess, setManualAuthSuccess] = useState(false);
  
  // Get debugging info about the current auth state
  useEffect(() => {
    const getAuthDebugInfo = async () => {
      try {
        const session = await supabase.auth.getSession();
        setAuthInfo({
          session: session?.data?.session ? 'Present' : 'Not present',
          user: session?.data?.session?.user ? 'Present' : 'Not present',
          url: window.location.href,
          hasAuthParams: window.location.hash.includes('access_token') || 
                         window.location.search.includes('access_token'),
          redirectUrlEnv: import.meta.env.VITE_PUBLIC_URL || 'Not set',
          isProduction: import.meta.env.PROD ? 'Yes' : 'No'
        });
      } catch (error) {
        console.error('Error getting auth debug info:', error);
      }
    };
    
    getAuthDebugInfo();
    
    // Try automatic token extraction on component mount
    const autoProcess = async () => {
      try {
        const result = await extractAndProcessAuthToken();
        if (result && !result.error) {
          setStatus('success');
          setMessage('Authentication completed automatically!');
          setManualAuthSuccess(true);
          
          // Navigate to dashboard after a brief delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        }
      } catch (err) {
        console.error('Auto token processing error:', err);
      }
    };
    
    autoProcess();
  }, [navigate]);
  
  const handleManualAuth = async () => {
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
        setManualAuthSuccess(true);
        
        // Navigate to dashboard after a brief delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
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
  
  // Try extracting token from URL parameters directly
  const handleExtractFromURL = async () => {
    setStatus('processing');
    
    try {
      const result = await extractAndProcessAuthToken();
      
      if (result && !result.error) {
        setStatus('success');
        setMessage('Authentication completed! Redirecting...');
        setManualAuthSuccess(true);
        
        // Redirect to dashboard after successful manual auth
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setStatus('error');
        setMessage('No valid auth token found in URL parameters.');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };
  
  return (
    <Container>
      <Card>
        <Title>Authentication Help</Title>
        <Description>
          If you're having trouble logging in, this page can help troubleshoot common issues.
        </Description>
        
        <Section>
          <SectionTitle>
            <FiAlertCircle size={18} /> Current Status
          </SectionTitle>
          {isLoading ? (
            <InfoText>Checking authentication status...</InfoText>
          ) : user ? (
            <>
              <SuccessMessage>
                <FiCheckCircle /> You are successfully logged in
              </SuccessMessage>
              <Button 
                variant="primary" 
                fullWidth 
                onClick={() => navigate('/dashboard')}
                style={{ marginTop: '16px' }}
              >
                Go to Dashboard
              </Button>
            </>
          ) : (
            <>
              <InfoText>
                You are not currently logged in. If you came here from a login email link,
                your authentication token might not have been processed correctly.
              </InfoText>
              
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
              
              <SectionTitle>
                <FiInfo size={16} /> Try these fixes:
              </SectionTitle>
              
              <Button 
                variant="primary" 
                fullWidth 
                onClick={handleExtractFromURL}
                style={{ marginTop: '16px', marginBottom: '8px' }}
                loading={status === 'processing'}
              >
                Try Automatic Fix
              </Button>
              
              <InfoText>
                <strong>Option 2: Manual token entry</strong>
                Copy the token from your URL after <Code>access_token=</Code> and paste it below:
              </InfoText>
              
              <Input
                type="text"
                placeholder="Paste your access token here"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              
              <Button 
                variant="secondary" 
                fullWidth
                onClick={handleManualAuth}
                disabled={status === 'processing' || !token.trim()}
              >
                Complete Manual Authentication
              </Button>
            </>
          )}
        </Section>
        
        <Section>
          <SectionTitle>Common Issues</SectionTitle>
          <InfoText>
            <strong>Email link redirects to wrong URL:</strong> If your magic login link is redirecting
            to localhost instead of the deployed site, the app configuration needs to be fixed. We are 
            working on resolving this issue.
            
            <strong>Email never arrived:</strong> Check your spam folder, or request a new login link.
            You can also try using a different email address.
          </InfoText>
        </Section>
        
        {authInfo && (
          <AuthDebugInfo>
            {JSON.stringify(authInfo, null, 2)}
          </AuthDebugInfo>
        )}
        
        <LoginLink to="/login">
          <FiArrowLeft size={14} /> Back to login
        </LoginLink>
      </Card>
    </Container>
  );
};

export default AuthTroubleshoot;