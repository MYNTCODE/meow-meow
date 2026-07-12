import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { clearGameState, loadGameState, saveGameState } from './gameStorage';
import {
  createInitialGameState,
  gameReducer,
  type GameAction,
} from './gameReducer';
import type { GameState } from '../types/game';

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    gameReducer,
    undefined,
    () => createInitialGameState(loadGameState()),
  );

  useEffect(() => {
    saveGameState(state);
  }, [state.coins, state.inventory, state.placedFurniture, state]);

  useEffect(() => {
    if (state.coins === 20 && state.inventory.length === 0 && state.placedFurniture.length === 0) {
      clearGameState();
    }
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('useGame must be used inside GameProvider');
  }

  return context;
}
