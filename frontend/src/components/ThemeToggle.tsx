import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';
import ThemeSettings from './ThemeSettings';

const ThemeToggle: React.FC = () => {
  const { theme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  
  const handleToggleClick = () => {
    setShowSettings(true);
  };
  
  const handleCloseSettings = () => {
    setShowSettings(false);
  };
  
  return (
    <>
      <ToggleButton 
        onClick={handleToggleClick} 
        aria-label={`Theme settings (current: ${theme})`}
        title="Theme settings"
      >
        {theme === 'light' ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="theme-toggle-icon"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="theme-toggle-icon"
          >
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
        )}
      </ToggleButton>
      
      <ThemeSettings 
        isOpen={showSettings}
        onClose={handleCloseSettings}
      />
    </>
  );
};

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast);
  border-radius: 50%;
  
  &:hover {
    color: var(--primary-color);
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  [data-theme="dark"] &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .theme-toggle-icon {
    width: 24px;
    height: 24px;
  }
`;

export default ThemeToggle; 