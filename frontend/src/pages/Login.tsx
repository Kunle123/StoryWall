import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { axiosInstance } from '../api/axios';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: 'demo@example.com',
    password: 'Demo123!'
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // For development, simulate successful login if API isn't ready
      let response;
      try {
        response = await axiosInstance.post('/api/auth/login', formData);
        
        // Store token in localStorage
        const { token, user } = response.data;
        localStorage.setItem('auth-storage', JSON.stringify({
          state: { token, user }
        }));
        
        // Redirect to timeline demo page
        navigate('/timeline-demo');
      } catch (error) {
        console.log('API not available, simulating login');
        // Simulate login with mock data
        if (formData.email === 'demo@example.com' && formData.password === 'Demo123!') {
          localStorage.setItem('auth-storage', JSON.stringify({
            state: { 
              token: 'mock-token-for-development',
              user: {
                id: 'user-123',
                email: formData.email,
                name: 'Demo User'
              }
            }
          }));
          // Redirect to timeline demo page
          navigate('/timeline-demo');
        } else {
          setError('Invalid email or password');
        }
      }
    } catch (err) {
      setError('Login failed. Please check your credentials and try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <FormContainer>
        <Title>Sign In</Title>
        <Subtitle>Use the pre-filled demo account to explore timelines</Subtitle>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </FormGroup>
          
          <ForgotPasswordLink to="/forgot-password">
            Forgot password?
          </ForgotPasswordLink>
          
          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </SubmitButton>
        </Form>
        
        <DemoCredentials>
          <p><strong>Demo Credentials:</strong></p>
          <p>Email: demo@example.com</p>
          <p>Password: Demo123!</p>
        </DemoCredentials>
        
        <SignupText>
          Don't have an account? <SignupLink to="/register">Sign Up</SignupLink>
        </SignupText>
      </FormContainer>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px);
  padding: 20px;
`;

const FormContainer = styled.div`
  width: 100%;
  max-width: 400px;
  padding: 30px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
  color: #333333;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #666666;
  text-align: center;
  margin-bottom: 20px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 5px;
  color: #333333;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #CCCCCC;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #FF9999;
    box-shadow: 0 0 0 2px rgba(255, 153, 153, 0.2);
  }
`;

const ForgotPasswordLink = styled(Link)`
  font-size: 14px;
  color: #666666;
  text-decoration: none;
  align-self: flex-end;
  margin-bottom: 20px;
  
  &:hover {
    color: #FF5555;
    text-decoration: underline;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #FF9999;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: #FF5555;
  }
  
  &:disabled {
    background-color: #CCCCCC;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background-color: #FFEBEE;
  color: #D32F2F;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
`;

const SignupText = styled.p`
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666666;
`;

const SignupLink = styled(Link)`
  color: #FF5555;
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const DemoCredentials = styled.div`
  margin-top: 20px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 14px;
  
  p {
    margin: 5px 0;
    color: #333333;
  }
  
  strong {
    color: #FF5555;
  }
`;

export default Login; 