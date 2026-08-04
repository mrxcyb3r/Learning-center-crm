import { useEffect } from 'react';

export interface UseKeyboardShortcutsOptions {
  onEscape?: () => void;
  enabled?: boolean;
}

/**
 * Custom hook to attach global keyboard event listeners.
 * Listens for Escape key presses to close active modals or overlays.
 */
export const useKeyboardShortcuts = ({
  onEscape,
  enabled = true
}: UseKeyboardShortcutsOptions) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        if (onEscape) {
          onEscape();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onEscape, enabled]);
};

export default useKeyboardShortcuts;
