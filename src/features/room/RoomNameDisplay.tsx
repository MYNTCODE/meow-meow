import { useGame } from '../../store/GameContext';
import { DEFAULT_ROOM_NAME } from '../../utils/roomName';
import { RoomNameEditor } from './RoomNameEditor';
import { useState } from 'react';
import styles from './RoomName.module.css';

export function RoomNameDisplay() {
  const { state, dispatch } = useGame();
  const [isEditing, setIsEditing] = useState(false);

  function handleSave(roomName: string) {
    dispatch({ type: 'setRoomName', roomName });
    setIsEditing(false);
  }

  function handleCancel() {
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <RoomNameEditor
        roomName={state.roomName || DEFAULT_ROOM_NAME}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className={styles.display}>
      <strong className={styles.roomName} title={state.roomName}>
        {state.roomName}
      </strong>
      {/*
      <button
        type="button"
        className={styles.editButton}
        aria-label="Edit room name"
        onClick={() => setIsEditing(true)}
      >
        Edit
      </button>
      */}
    </div>
  );
}
