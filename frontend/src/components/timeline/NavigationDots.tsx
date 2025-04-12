import React from 'react';
import styled from 'styled-components';

interface NavigationDotsProps {
  activeIndex: number;
  count: number;
  onDotClick: (index: number) => void;
}

const NavigationDots: React.FC<NavigationDotsProps> = ({ 
  activeIndex, 
  count, 
  onDotClick 
}) => {
  return (
    <Container>
      {Array.from({ length: count }, (_, index) => (
        <Dot 
          key={index} 
          active={index === activeIndex}
          onClick={() => onDotClick(index)}
          aria-label={`View ${index + 1}`}
          role="button"
          tabIndex={0}
        />
      ))}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
`;

const Dot = styled.div<{ active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props: { active: boolean }) => props.active ? '#333333' : '#CCCCCC'};
  margin: 0 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: ${(props: { active: boolean }) => props.active ? '#333333' : '#999999'};
  }
`;

export default NavigationDots; 