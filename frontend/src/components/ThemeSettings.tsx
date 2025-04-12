import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const [preference, setPreference] = useState<string>(theme);
  
  useEffect(() => {
    // Update preference when theme changes externally
    setPreference(theme);
  }, [theme]);
  
  if (!isOpen) return null;
  
  const handlePreferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPreference = e.target.value;
    setPreference(newPreference);
    
    if (newPreference === 'system') {
      // If system preference is selected, remove saved preference
      localStorage.removeItem('theme');
      // Check the system preference
      const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDarkMode ? 'dark' : 'light');
    } else {
      setTheme(newPreference as 'light' | 'dark');
    }
  };
  
  return (
    <SettingsOverlay onClick={onClose}>
      <SettingsContainer onClick={e => e.stopPropagation()}>
        <SettingsHeader>
          <Title>Display Settings</Title>
          <CloseButton onClick={onClose}>×</CloseButton>
        </SettingsHeader>
        
        <SettingsBody>
          <SettingSection>
            <SectionTitle>Theme</SectionTitle>
            <OptionGroup>
              <RadioOption>
                <RadioInput
                  type="radio"
                  name="theme"
                  value="light"
                  checked={preference === 'light'}
                  onChange={handlePreferenceChange}
                  id="theme-light"
                />
                <RadioLabel htmlFor="theme-light">
                  <IconLight />
                  Light
                </RadioLabel>
              </RadioOption>
              
              <RadioOption>
                <RadioInput
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={preference === 'dark'}
                  onChange={handlePreferenceChange}
                  id="theme-dark"
                />
                <RadioLabel htmlFor="theme-dark">
                  <IconDark />
                  Dark
                </RadioLabel>
              </RadioOption>
              
              <RadioOption>
                <RadioInput
                  type="radio"
                  name="theme"
                  value="system"
                  checked={preference === 'system'}
                  onChange={handlePreferenceChange}
                  id="theme-system"
                />
                <RadioLabel htmlFor="theme-system">
                  <IconSystem />
                  System
                </RadioLabel>
              </RadioOption>
            </OptionGroup>
          </SettingSection>
        </SettingsBody>
      </SettingsContainer>
    </SettingsOverlay>
  );
};

const SettingsOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--modal-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const SettingsContainer = styled.div`
  background-color: var(--modal-background);
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: var(--shadow-lg);
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const SettingsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--divider-color);
`;

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  
  &:hover {
    color: var(--text-primary);
  }
`;

const SettingsBody = styled.div`
  padding: 20px;
`;

const SettingSection = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  margin: 0 0 15px 0;
  font-size: 16px;
  color: var(--text-primary);
`;

const OptionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const RadioOption = styled.div`
  display: flex;
  align-items: center;
`;

const RadioInput = styled.input`
  margin: 0;
  opacity: 0;
  position: absolute;
  
  &:checked + label {
    background-color: var(--primary-light);
    color: var(--primary-dark);
    font-weight: 500;
  }
  
  &:focus + label {
    box-shadow: 0 0 0 2px var(--primary-light);
  }
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.2s;
  color: var(--text-primary);
  
  &:hover {
    background-color: var(--divider-color);
  }
`;

const IconLight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

const IconDark = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

const IconSystem = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="8" y1="21" x2="16" y2="21"></line>
    <line x1="12" y1="17" x2="12" y2="21"></line>
  </svg>
);

export default ThemeSettings; 