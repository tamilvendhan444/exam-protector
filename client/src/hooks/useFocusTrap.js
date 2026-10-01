import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive) {
  const elementRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    const element = elementRef.current;
    if (!element) return;

    // Save the element that had focus before the modal opened
    const previousFocus = document.activeElement;

    // Find all focusable elements inside the trap
    const focusableElements = element.querySelectorAll(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);

    // Initial focus
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
      // Restore focus when the trap is deactivated
      if (previousFocus) {
        previousFocus.focus();
      }
    };
  }, [isActive]);

  return elementRef;
}
