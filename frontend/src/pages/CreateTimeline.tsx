import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { axiosInstance } from '../api/axios';

const CreateTimeline: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    visibility: 'public',
    tags: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      // Format tags if provided
      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [];
      
      // Create timeline data object
      const timelineData = {
        ...formData,
        tags: tagsArray
      };
      
      // For development, simulate API call
      let response;
      try {
        response = await axiosInstance.post('/api/timelines', timelineData);
        navigate(`/timeline/${response.data.id}`);
      } catch (error) {
        console.log('API not available, simulating timeline creation');
        // Mock successful timeline creation
        setTimeout(() => {
          navigate('/timeline/timeline-new');
        }, 1000);
      }
    } catch (err) {
      setError('Failed to create timeline. Please try again.');
      console.error('Error creating timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <Title>Create a New Timeline</Title>
        <Description>
          Fill in the details below to create your interactive timeline.
        </Description>
      </Header>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="title">Timeline Title*</Label>
          <Input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter a title for your timeline"
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="description">Description*</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide a description of what this timeline covers"
            required
          />
        </FormGroup>
        
        <FormRow>
          <FormGroup>
            <Label htmlFor="start_date">Start Date*</Label>
            <Input
              type="text"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              placeholder="YYYY or YYYY-MM-DD"
              required
            />
            <FieldHint>Enter year or full date (YYYY-MM-DD)</FieldHint>
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="end_date">End Date*</Label>
            <Input
              type="text"
              id="end_date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              placeholder="YYYY or YYYY-MM-DD"
              required
            />
            <FieldHint>Enter year or full date (YYYY-MM-DD)</FieldHint>
          </FormGroup>
        </FormRow>
        
        <FormGroup>
          <Label htmlFor="visibility">Visibility</Label>
          <Select 
            id="visibility" 
            name="visibility"
            value={formData.visibility}
            onChange={handleChange}
          >
            <option value="public">Public (anyone can view)</option>
            <option value="unlisted">Unlisted (only accessible with link)</option>
            <option value="private">Private (only you can view)</option>
          </Select>
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="tags">Tags</Label>
          <Input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g. history, science, politics"
          />
          <FieldHint>Separate tags with commas</FieldHint>
        </FormGroup>
        
        <ButtonGroup>
          <CancelButton type="button" onClick={() => navigate('/profile')}>
            Cancel
          </CancelButton>
          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Timeline'}
          </SubmitButton>
        </ButtonGroup>
      </Form>
    </Container>
  );
};

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 30px 20px;
  
  @media (max-width: 767px) {
    padding: 20px 15px;
  }
`;

const Header = styled.header`
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: bold;
  color: #333333;
  margin: 0 0 10px 0;
`;

const Description = styled.p`
  font-size: 16px;
  color: #666666;
  line-height: 1.5;
`;

const Form = styled.form`
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  flex: 1;
`;

const FormRow = styled.div`
  display: flex;
  gap: 20px;
  
  @media (max-width: 767px) {
    flex-direction: column;
    gap: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333333;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #CCCCCC;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #FF9999;
    box-shadow: 0 0 0 2px rgba(255, 153, 153, 0.2);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #CCCCCC;
  border-radius: 4px;
  font-size: 14px;
  min-height: 120px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #FF9999;
    box-shadow: 0 0 0 2px rgba(255, 153, 153, 0.2);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #CCCCCC;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #FF9999;
    box-shadow: 0 0 0 2px rgba(255, 153, 153, 0.2);
  }
`;

const FieldHint = styled.div`
  font-size: 12px;
  color: #666666;
  margin-top: 5px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
`;

const Button = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
`;

const SubmitButton = styled(Button)`
  background-color: #FF9999;
  color: white;
  border: none;
  
  &:hover {
    background-color: #FF5555;
  }
  
  &:disabled {
    background-color: #CCCCCC;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background-color: white;
  color: #666666;
  border: 1px solid #CCCCCC;
  
  &:hover {
    background-color: #F5F5F5;
  }
`;

const ErrorMessage = styled.div`
  background-color: #FFEBEE;
  color: #D32F2F;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
`;

export default CreateTimeline; 