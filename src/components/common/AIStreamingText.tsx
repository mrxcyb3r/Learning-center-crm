import React, { useState, useEffect } from 'react';
import { FormattedAIResponse } from '../AI/FormattedAIResponse';

interface AIStreamingTextProps {
  content: string;
  isLatest?: boolean;
  speedMsPerWord?: number;
  onComplete?: () => void;
}

export const AIStreamingText: React.FC<AIStreamingTextProps> = ({
  content,
  isLatest = false,
  speedMsPerWord = 18,
  onComplete,
}) => {
  const [displayedContent, setDisplayedContent] = useState(isLatest ? '' : content);
  const [isFinished, setIsFinished] = useState(!isLatest);

  // Respect reduced motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!isLatest || prefersReducedMotion) {
      setDisplayedContent(content);
      setIsFinished(true);
      return;
    }

    const words = content.split(' ');
    let currentIndex = 0;
    setDisplayedContent('');
    setIsFinished(false);

    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex <= words.length) {
        setDisplayedContent(words.slice(0, currentIndex).join(' '));
      } else {
        clearInterval(interval);
        setIsFinished(true);
        onComplete?.();
      }
    }, speedMsPerWord);

    return () => clearInterval(interval);
  }, [content, isLatest, speedMsPerWord, prefersReducedMotion, onComplete]);

  return (
    <div className="relative">
      <FormattedAIResponse content={displayedContent} />
      {!isFinished && (
        <span className="inline-block w-2 h-3.5 bg-amber-500 font-mono ml-1 animate-pulse align-middle rounded-sm" />
      )}
    </div>
  );
};
