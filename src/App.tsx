import { BottomNavigation } from './components/BottomNavigation';
import { BottomPanel } from './components/BottomPanel';
import { TopStatusBar } from './components/TopStatusBar';
import { RoomView } from './features/room/RoomView';
import { useCoinIncome } from './hooks/useCoinIncome';
import { useGame } from './store/GameContext';
import styles from './App.module.css';

export default function App() {
  const { state, dispatch } = useGame();

  useCoinIncome();

  function closePanel() {
    dispatch({
      type: 'setOpenPanel',
      panel: null,
    });
  }

  function handleNavigation(target: 'shop' | 'inventory') {
    dispatch({
      type: 'setOpenPanel',
      panel: state.openPanel === target ? null : target,
    });
  }

  return (
    <main className={styles.gameShell}>
      <TopStatusBar coins={state.coins} />
      <section className={styles.playArea}>
        <RoomView state={state} dispatch={dispatch} />
        <BottomPanel openPanel={state.openPanel} onRequestClose={closePanel} />
      </section>
      <BottomNavigation
        openPanel={state.openPanel}
        onSelectPanel={handleNavigation}
      />
    </main>
  );
}
