import React, { useState } from 'react';
import styled from 'styled-components';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare?: () => void;
  title: string;
  timelineId: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, onShare, title, timelineId }) => {
  const [copied, setCopied] = useState(false);
  
  if (!isOpen) return null;
  
  const shareUrl = `${window.location.origin}/timeline/${timelineId}`;
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onShare) onShare();
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const handleShare = (platform: string) => {
    let shareLink = '';
    const encodedTitle = encodeURIComponent(`Check out this timeline: ${title}`);
    const encodedUrl = encodeURIComponent(shareUrl);
    
    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareLink = `https://api.whatsapp.com/send?text=${encodedTitle} ${encodedUrl}`;
        break;
      default:
        return;
    }
    
    window.open(shareLink, '_blank');
    if (onShare) onShare();
  };
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Share Timeline</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <ShareTitle>"{title}"</ShareTitle>
          
          <SocialButtons>
            <SocialButton 
              color="#1DA1F2" 
              onClick={() => handleShare('twitter')}
            >
              <SocialIcon>𝕏</SocialIcon>
              Twitter
            </SocialButton>
            
            <SocialButton 
              color="#3b5998" 
              onClick={() => handleShare('facebook')}
            >
              <SocialIcon>f</SocialIcon>
              Facebook
            </SocialButton>
            
            <SocialButton 
              color="#0077b5" 
              onClick={() => handleShare('linkedin')}
            >
              <SocialIcon>in</SocialIcon>
              LinkedIn
            </SocialButton>
            
            <SocialButton 
              color="#25D366" 
              onClick={() => handleShare('whatsapp')}
            >
              <SocialIcon>W</SocialIcon>
              WhatsApp
            </SocialButton>
          </SocialButtons>
          
          <ShareLinkContainer>
            <ShareLinkLabel>Or copy link:</ShareLinkLabel>
            <ShareLinkInput readOnly value={shareUrl} />
            <CopyButton onClick={handleCopyLink}>
              {copied ? 'Copied!' : 'Copy'}
            </CopyButton>
          </ShareLinkContainer>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
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

const ModalContent = styled.div`
  background-color: var(--modal-background);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
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

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--divider-color);
`;

const ModalTitle = styled.h3`
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

const ModalBody = styled.div`
  padding: 20px;
`;

const ShareTitle = styled.p`
  font-size: 16px;
  color: var(--text-primary);
  margin: 0 0 20px 0;
  text-align: center;
  font-style: italic;
`;

const SocialButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
`;

const SocialButton = styled.button<{ color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border-radius: 4px;
  border: none;
  background-color: ${props => props.color};
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
`;

const SocialIcon = styled.span`
  margin-right: 8px;
  font-weight: bold;
`;

const ShareLinkContainer = styled.div`
  margin-top: 20px;
`;

const ShareLinkLabel = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
`;

const ShareLinkInput = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid var(--divider-color);
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 10px;
  background-color: var(--input-background);
  color: var(--text-primary);
`;

const CopyButton = styled.button`
  width: 100%;
  padding: 10px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: var(--primary-dark);
  }
`;

export default ShareModal; 