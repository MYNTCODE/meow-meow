import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PropsWithChildren,
} from 'react';
import styles from './GamePanel.module.css';

const PANEL_ANIMATION_MS = 200;

interface GamePanelProps extends PropsWithChildren {
  isOpen: boolean;
  title: string;
  onRequestClose: () => void;
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) {
    return [];
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'));
}

export function GamePanel({ isOpen, title, onRequestClose, children }: GamePanelProps) {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusedElementRef.current = document.activeElement as HTMLElement | null;
      setIsMounted(true);
      const animationFrameId = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });

      return () => window.cancelAnimationFrame(animationFrameId);
    }

    setIsVisible(false);
    const timeoutId = window.setTimeout(() => {
      setIsMounted(false);
      previousFocusedElementRef.current?.focus?.();
    }, PANEL_ANIMATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  useEffect(() => {
    if (!isMounted) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) {
      return undefined;
    }

    const focusTimer = window.setTimeout(() => {
      const focusableElements = getFocusableElements(panelRef.current);

      if (focusableElements.length > 0) {
        focusableElements[0].focus();
        return;
      }

      panelRef.current?.focus();
    }, 0);

    function handleDocumentKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onRequestClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements(panelRef.current);

      if (focusableElements.length === 0) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener('keydown', handleDocumentKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [isMounted, onRequestClose]);

  if (!isMounted) {
    return null;
  }

  function handleBackdropClick() {
    onRequestClose();
  }

  function handlePanelKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onRequestClose();
    }
  }

  return (
    <div
      className={`${styles.overlay} ${isVisible ? styles.overlayVisible : ''}`}
      aria-hidden={!isVisible}
    >
      <button
        className={styles.backdrop}
        type="button"
        aria-label={`Close ${title}`}
        onClick={handleBackdropClick}
      />
      <section
        ref={panelRef}
        className={`${styles.panel} ${isVisible ? styles.panelVisible : ''}`}
        aria-label={title}
        aria-modal="true"
        role="dialog"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handlePanelKeyDown}
      >
        <header className={styles.header}>
          <h2>{title}</h2>
        </header>
        <div className={styles.content}>{children}</div>
      </section>
    </div>
  );
}
