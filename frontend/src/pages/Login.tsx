import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f9f9f9;
`;

const LoginCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: #5c6bc0;
    outline: none;
  }
`;

const Button = styled.button`
  background: #5c6bc0;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #4a5ab9;
  }

  &:disabled {
    background: #b0b0b0;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #e53935;
  margin-bottom: 1rem;
  font-size: 0.875rem;
`;

const SuccessMessage = styled.div`
  color: #43a047;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  text-align: center;
`;

const LinkText = styled(Link)`
  color: #5c6bc0;
  text-decoration: none;
  font-size: 0.875rem;
  text-align: center;
  display: block;
  margin-top: 1.5rem;
  
  &:hover {
    text-decoration: underline;
  }
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
      <LoginCard>
        <Title>Welcome to RPM</Title>
        
        {isSubmitted ? (
          <>
            <SuccessMessage>
              Check your email for a login link. It will expire in 24 hours.
            </SuccessMessage>
            <LinkText to="/auth-help">
              Having trouble logging in? Click here for help.
            </LinkText>
          </>
        ) : (
          <>
            <Form onSubmit={handleSubmit}>
              {error && <ErrorMessage>{error}</ErrorMessage>}
              
              <InputGroup>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
              </InputGroup>
              
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Sending Link...' : 'Sign In with Email'}
              </Button>
            </Form>
            <LinkText to="/auth-help">
              Already received a login link? Click here if you're having issues.
            </LinkText>
          </>
        )}
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;