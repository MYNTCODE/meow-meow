import { BottomNavigation } from './components/BottomNavigation';
import { BottomPanel } from './components/BottomPanel';
import { DevResetButton } from './components/DevResetButton';
import { TopStatusBar } from './components/TopStatusBar';
import { RoomView } from './features/room/RoomView';
import { useCoinIncome } from './hooks/useCoinIncome';
import { useGame } from './store/GameContext';
import styles from './App.module.css';

export default function App() {
  const { state, dispatch } = useGame();

  useCoinIncome();

  return (
    <main className={styles.gameShell}>
      <TopStatusBar coins={state.coins} />
      <section className={styles.playArea}>
        <RoomView state={state} />
      </section>
      <DevResetButton />
      <BottomPanel activePanel={state.activePanel} />
      <BottomNavigation
        activePanel={state.activePanel}
        onSelectPanel={(panel) => dispatch({ type: 'setActivePanel', panel })}
      />
    </main>
  );
}
