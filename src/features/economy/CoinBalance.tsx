import styles from './CoinBalance.module.css';

interface CoinBalanceProps {
  coins: number;
}

export function CoinBalance({ coins }: CoinBalanceProps) {
  return (
    <div className={styles.balance} aria-label={`${coins} coins`}>
      <span className={styles.coinIcon} />
      <span>{coins}</span>
    </div>
  );
}
