import { useEffect, useRef, useState } from 'react';
import styles from './RoomEditControls.module.css';

interface RoomEditControlsProps {
  isEditing: boolean;
  isLayoutValid: boolean;
  onEdit: () => void;
  onReset: () => void;
  onSave: () => void;
}

export function RoomEditControls({
  isEditing,
  isLayoutValid,
  onEdit,
  onReset,
  onSave,
}: RoomEditControlsProps) {
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isConfirmingReset) {
      return;
    }

    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      setIsConfirmingReset(false);
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConfirmingReset]);

  function handlePrimaryAction() {
    if (isEditing) {
      onSave();
      return;
    }

    onEdit();
  }

  function handleResetConfirm() {
    setIsConfirmingReset(false);
    onReset();
  }

  return (
    <>
      <div className={styles.roomToolbar} aria-label="Room toolbar">
        <div className={styles.roomToolbarActions}>
          <button
            className={`${styles.roomEditButton} ${isEditing ? styles.roomEditButtonActive : ''}`}
            type="button"
            onClick={handlePrimaryAction}
            disabled={isEditing && !isLayoutValid}
            aria-pressed={isEditing}
          >
            <span className={styles.buttonIcon} aria-hidden="true">
              {isEditing ? '✓' : '✎'}
            </span>
            {isEditing ? 'Done' : 'Edit Room'}
          </button>
          <button
            className={styles.roomResetButton}
            type="button"
            onClick={() => setIsConfirmingReset(true)}
          >
            <span className={styles.buttonIcon} aria-hidden="true">
              ↺
            </span>
            Reset
          </button>
        </div>
      </div>
      {isConfirmingReset ? (
        <div className={styles.modalOverlay} role="presentation">
          <button
            className={styles.modalBackdrop}
            type="button"
            aria-label="Close reset confirmation"
            onClick={() => setIsConfirmingReset(false)}
          />
          <section
            className={styles.modalCard}
            aria-modal="true"
            role="dialog"
            aria-labelledby="reset-room-title"
            aria-describedby="reset-room-description"
          >
            <h2 id="reset-room-title" className={styles.modalTitle}>
              Reset room?
            </h2>
            <p id="reset-room-description" className={styles.modalMessage}>
              All placed furniture will return to its default position.
            </p>
            <div className={styles.modalActions}>
              <button
                ref={cancelButtonRef}
                className={styles.modalSecondaryButton}
                type="button"
                onClick={() => setIsConfirmingReset(false)}
              >
                Cancel
              </button>
              <button
                className={styles.modalPrimaryButton}
                type="button"
                onClick={handleResetConfirm}
              >
                Reset Room
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
