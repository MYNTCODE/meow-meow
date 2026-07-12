import { useEffect } from 'react';
import { useGame } from '../store/GameContext';

const COIN_TICK_MS = 5000;
const COINS_PER_TICK = 5;

export function useCoinIncome() {
  const { dispatch } = useGame();

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      dispatch({ type: 'earnCoins', amount: COINS_PER_TICK });
    }, COIN_TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [dispatch]);
}
