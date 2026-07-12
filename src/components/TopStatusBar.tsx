import { CoinBalance } from '../features/economy/CoinBalance';
import styles from './TopStatusBar.module.css';

interface TopStatusBarProps {
  coins: number;
}

export function TopStatusBar({ coins }: TopStatusBarProps) {
  return (
    <header className={styles.statusBar}>
      <h1>Meow Meow Room</h1>
      <CoinBalance coins={coins} />
    </header>
  );
}
