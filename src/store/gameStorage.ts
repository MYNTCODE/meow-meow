import type { EquippedItems, FurnitureId, GameState } from '../types/game';

const STORAGE_KEY = 'mew-mew-room-save-v1';

export type PersistedGameState = Pick<
  GameState,
  'coins' | 'roomName' | 'inventory' | 'equippedItems' | 'placedFurniture'
> & {
  activeItemId?: FurnitureId | null;
};

export function loadGameState(): Partial<PersistedGameState> {
  try {
    const rawSave = window.localStorage.getItem(STORAGE_KEY);

    if (!rawSave) {
      return {};
    }

    return JSON.parse(rawSave) as PersistedGameState;
  } catch {
    return {};
  }
}

export function saveGameState(state: GameState) {
  const saveData: PersistedGameState = {
    coins: state.coins,
    roomName: state.roomName,
    inventory: state.inventory,
    equippedItems: state.equippedItems,
    placedFurniture: state.placedFurniture,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
}

export function clearGameState() {
  window.localStorage.removeItem(STORAGE_KEY);
}
