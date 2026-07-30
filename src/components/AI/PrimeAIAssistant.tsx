import React from 'react';
import { AIChatCore } from './AIChatCore';

interface PrimeAIAssistantProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialMode?: 'chat' | 'speaking' | 'essay';
}

export const PrimeAIAssistant: React.FC<PrimeAIAssistantProps> = ({
  isOpen = true,
  onClose,
  initialMode = 'chat'
}) => {
  if (!isOpen) return null;

  return (
    <AIChatCore
      variant="floating"
      isOpen={isOpen}
      onClose={onClose}
      initialMode={initialMode}
    />
  );
};
