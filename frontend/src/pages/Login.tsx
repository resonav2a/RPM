import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowRight, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const LoginContainer = styled.div`
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

const Logo = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary.main};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  
  span {
    background: ${({ theme }) => theme.colors.primary.main};
    color: white;
    width: 48px;
    height: 48px;
    border-radius: ${({ theme }) => theme.borderRadius.md};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }
`;

const LoginCard = styled.div`
  background: ${({ theme }) => theme.colors.ui.card};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  width: 100%;
  max-width: 420px;
  transition: all ${({ theme }) => theme.transitions.medium};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.h2.fontSize};
  font-weight: ${({ theme }) => theme.typography.h2.fontWeight};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const SubmitButton = styled(Button)`
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const SuccessContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl} 0;
`;

const SuccessIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.status.success}20;
  color: ${({ theme }) => theme.colors.status.success};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SuccessTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.h3.fontSize};
  font-weight: ${({ theme }) => theme.typography.h3.fontWeight};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const SuccessMessage = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
  max-width: 300px;
`;

const LinkText = styled(Link)`
  color: ${({ theme }) => theme.colors.primary.main};
  text-decoration: none;
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.lg};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary.dark};
    
    svg {
      transform: translateX(2px);
    }
  }
  
  svg {
    transition: transform ${({ theme }) => theme.transitions.fast};
  }
`;

const InfoBox = styled.div`
  background: ${({ theme }) => theme.colors.ui.hover};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  color: ${({ theme }) => theme.colors.text.secondary};
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { signIn, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email) {
      setError('Please enter your email');
      return;
    }

    try {
      await signIn(email);
      setIsSubmitted(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during login');
    }
  };

  return (
    <LoginContainer>
      <Logo>
        <span>R</span>
        Rapid PM
      </Logo>
      
      <LoginCard>
        {isSubmitted ? (
          <SuccessContainer>
            <SuccessIcon>
              <FiCheckCircle />
            </SuccessIcon>
            <SuccessTitle>Check your inbox</SuccessTitle>
            <SuccessMessage>
              We've sent a magic login link to <strong>{email}</strong>. 
              Check your email to sign in.
            </SuccessMessage>
            <LinkText to="/auth-help">
              Having trouble logging in? <FiArrowRight size={14} />
            </LinkText>
          </SuccessContainer>
        ) : (
          <>
            <Title>Welcome</Title>
            <Subtitle>Sign in to access your project management workspace</Subtitle>
            
            <Form onSubmit={handleSubmit}>
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                startIcon={<FiMail />}
                fullWidth
                error={error || undefined}
              />
              
              <SubmitButton 
                type="submit" 
                variant="primary"
                loading={isLoading}
                fullWidth
              >
                {isLoading ? 'Sending Link...' : 'Continue with Email'}
              </SubmitButton>
              
              <InfoBox>
                <FiInfo style={{ marginTop: '3px' }} />
                <div>
                  We'll send you a magic link for password-free sign in. 
                  No password to remember!
                </div>
              </InfoBox>
            </Form>
            
            <LinkText to="/auth-help">
              Already received a login link? <FiArrowRight size={14} />
            </LinkText>
          </>
        )}
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;