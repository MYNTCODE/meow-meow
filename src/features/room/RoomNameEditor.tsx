import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { validateRoomName } from '../../utils/roomName';
import styles from './RoomName.module.css';

interface RoomNameEditorProps {
  roomName: string;
  onSave: (roomName: string) => void;
  onCancel: () => void;
}

export function RoomNameEditor({ roomName, onSave, onCancel }: RoomNameEditorProps) {
  const inputId = useId();
  const messageId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draftName, setDraftName] = useState(roomName);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const isInvalid = validationMessage !== null;

  useEffect(() => {
    setDraftName(roomName);
    setValidationMessage(null);
  }, [roomName]);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = draftName.trim();
    const errorMessage = validateRoomName(draftName);

    if (errorMessage) {
      setValidationMessage(errorMessage);
      return;
    }

    onSave(trimmedName);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  }

  return (
    <form className={styles.editor} onSubmit={handleSubmit}>
      <div className={styles.inputRow}>
        <input
          id={inputId}
          ref={inputRef}
          className={styles.input}
          type="text"
          value={draftName}
          maxLength={30}
          aria-label="Room name"
          aria-invalid={isInvalid}
          aria-describedby={isInvalid ? messageId : undefined}
          onChange={(event) => {
            setDraftName(event.target.value);
            setValidationMessage(null);
          }}
          onKeyDown={handleKeyDown}
        />
        <button type="submit" className={styles.primaryButton}>
          Save
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onCancel}>
          Cancel
        </button>
      </div>
      <p id={messageId} className={styles.validationMessage} aria-live="polite">
        {validationMessage ?? ' '}
      </p>
    </form>
  );
}
