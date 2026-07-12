import { useGame } from '../store/GameContext';
import { clearGameState } from '../store/gameStorage';
import styles from './DevResetButton.module.css';

export function DevResetButton() {
  const { dispatch } = useGame();

  function handleReset() {
    clearGameState();
    dispatch({ type: 'resetGame' });
  }

  return (
    <button className={styles.resetButton} type="button" onClick={handleReset}>
      Reset
    </button>
  );
}
