import { CoinBalance } from '../features/economy/CoinBalance';
import { RoomNameDisplay } from '../features/room/RoomNameDisplay';
import styles from './TopStatusBar.module.css';

interface TopStatusBarProps {
  coins: number;
}

export function TopStatusBar({ coins }: TopStatusBarProps) {
  return (
    <header className={styles.statusBar}>
      <div className={styles.roomNameGroup}>
        <RoomNameDisplay />
      </div>
      <CoinBalance coins={coins} />
    </header>
  );
}
