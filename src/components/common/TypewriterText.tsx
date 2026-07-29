import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  texts: string | string[];
  speed?: number; // ms per char
  deleteSpeed?: number;
  pauseDuration?: number; // ms pause at the end of phrase
  loop?: boolean;
  showCursor?: boolean;
  cursorColorClass?: string;
  className?: string;
  onComplete?: () => void;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  texts,
  speed = 45,
  deleteSpeed = 25,
  pauseDuration = 1800,
  loop = true,
  showCursor = true,
  cursorColorClass = 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]',
  className = '',
  onComplete,
}) => {
  const textArray = Array.isArray(texts) ? texts : [texts];
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayedText(textArray[0] || '');
      return;
    }

    const currentFullText = textArray[currentTextIndex] || '';

    if (isPaused) {
      const timeout = setTimeout(() => {
        setIsPaused(false);
        if (textArray.length > 1 || loop) {
          setIsDeleting(true);
        } else {
          onComplete?.();
        }
      }, pauseDuration);
      return () => clearTimeout(timeout);
    }

    if (!isDeleting) {
      // Typing mode
      if (displayedText.length < currentFullText.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(currentFullText.slice(0, displayedText.length + 1));
        }, speed);
        return () => clearTimeout(timeout);
      } else {
        // Finished typing current string
        if (textArray.length === 1 && !loop) {
          onComplete?.();
          return;
        }
        setIsPaused(true);
      }
    } else {
      // Deleting mode
      if (displayedText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayedText(currentFullText.slice(0, displayedText.length - 1));
        }, deleteSpeed);
        return () => clearTimeout(timeout);
      } else {
        // Finished deleting, move to next text
        setIsDeleting(false);
        setCurrentTextIndex((prev) => (prev + 1) % textArray.length);
      }
    }
  }, [
    displayedText,
    isDeleting,
    isPaused,
    currentTextIndex,
    textArray,
    speed,
    deleteSpeed,
    pauseDuration,
    loop,
    prefersReducedMotion,
    onComplete,
  ]);

  if (prefersReducedMotion) {
    return <span className={className}>{textArray[0]}</span>;
  }

  return (
    <span className={`inline-block ${className}`}>
      {displayedText}
      {showCursor && (
        <span className={`inline-block animate-pulse font-mono ml-0.5 font-bold ${cursorColorClass}`}>
          |
        </span>
      )}
    </span>
  );
};
