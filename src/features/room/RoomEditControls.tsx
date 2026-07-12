import styles from './RoomEditControls.module.css';

interface RoomEditControlsProps {
  isEditing: boolean;
  isLayoutValid: boolean;
  onCancel: () => void;
  onEdit: () => void;
  onSave: () => void;
}

export function RoomEditControls({
  isEditing,
  isLayoutValid,
  onCancel,
  onEdit,
  onSave,
}: RoomEditControlsProps) {
  return (
    <div className={styles.controls} aria-label="Room layout controls">
      {isEditing ? (
        <>
          <span className={styles.label}>Editing Room</span>
          <button className={styles.button} type="button" onClick={onSave} disabled={!isLayoutValid}>
            Save
          </button>
          <button className={styles.button} type="button" onClick={onCancel}>
            Cancel
          </button>
        </>
      ) : (
        <button className={styles.button} type="button" onClick={onEdit}>
          Edit Room
        </button>
      )}
    </div>
  );
}
