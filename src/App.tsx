import { useState } from 'react';
import { BottomNavigation } from './components/BottomNavigation';
import { BottomPanel } from './components/BottomPanel';
import { TopStatusBar } from './components/TopStatusBar';
import { RoomView } from './features/room/RoomView';
import { useCoinIncome } from './hooks/useCoinIncome';
import { useGame } from './store/GameContext';
import type { FurnitureId } from './types/game';
import styles from './App.module.css';

export default function App() {
  const { state, dispatch } = useGame();
  const [isRoomEditing, setIsRoomEditing] = useState(false);
  const [selectedPlacementFurnitureId, setSelectedPlacementFurnitureId] =
    useState<FurnitureId | null>(null);

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
        <RoomView
          state={state}
          dispatch={dispatch}
          isRoomEditing={isRoomEditing}
          onEditingChange={(nextValue) => {
            setIsRoomEditing(nextValue);
            if (!nextValue) {
              setSelectedPlacementFurnitureId(null);
            }
          }}
          onPlacementSelectionHandled={() => setSelectedPlacementFurnitureId(null)}
          selectedPlacementFurnitureId={selectedPlacementFurnitureId}
        />
        <BottomPanel
          isRoomEditing={isRoomEditing}
          onRequestClose={closePanel}
          onSelectPlacementFurniture={setSelectedPlacementFurnitureId}
          openPanel={state.openPanel}
        />
      </section>
      <BottomNavigation openPanel={state.openPanel} onSelectPanel={handleNavigation} />
      <footer className={styles.footer}>Created by myntp</footer>
    </main>
  );
}
