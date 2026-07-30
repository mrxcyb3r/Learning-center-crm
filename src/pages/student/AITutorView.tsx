import React from 'react';
import { AIChatCore } from '../../components/AI/AIChatCore';

interface AITutorViewProps {
  onBackToDashboard?: () => void;
}

export const AITutorView: React.FC<AITutorViewProps> = ({ onBackToDashboard }) => {
  return (
    <AIChatCore
      variant="full"
      onBackToDashboard={onBackToDashboard}
    />
  );
};
