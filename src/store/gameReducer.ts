import { getFurnitureItem } from '../data/furniture';
import { defaultCat } from '../data/cats';
import type { FurnitureId, GameState, PanelView } from '../types/game';

export type GameAction =
  | { type: 'earnCoins'; amount: number }
  | { type: 'buyFurniture'; furnitureId: FurnitureId }
  | { type: 'placeFurniture'; furnitureId: FurnitureId; positionId: string }
  | { type: 'setActivePanel'; panel: PanelView }
  | { type: 'resetGame' };

export const DEFAULT_GAME_STATE: GameState = {
  coins: 20,
  cat: defaultCat,
  inventory: [],
  placedFurniture: [],
  activePanel: 'room',
};

function addInventoryItem(
  inventory: GameState['inventory'],
  furnitureId: FurnitureId,
): GameState['inventory'] {
  const existingItem = inventory.find((item) => item.furnitureId === furnitureId);

  if (existingItem) {
    return inventory.map((item) =>
      item.furnitureId === furnitureId
        ? { ...item, quantity: item.quantity + 1 }
        : item,
    );
  }

  return [...inventory, { furnitureId, quantity: 1 }];
}

export function createInitialGameState(savedState: Partial<GameState> = {}): GameState {
  return {
    ...DEFAULT_GAME_STATE,
    coins: savedState.coins ?? DEFAULT_GAME_STATE.coins,
    inventory: savedState.inventory ?? DEFAULT_GAME_STATE.inventory,
    placedFurniture: savedState.placedFurniture ?? DEFAULT_GAME_STATE.placedFurniture,
    activePanel: 'room',
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'earnCoins':
      return {
        ...state,
        coins: state.coins + action.amount,
      };

    case 'buyFurniture': {
      const furniture = getFurnitureItem(action.furnitureId);

      if (!furniture || state.coins < furniture.price) {
        return state;
      }

      return {
        ...state,
        coins: state.coins - furniture.price,
        inventory: addInventoryItem(state.inventory, action.furnitureId),
      };
    }

    case 'placeFurniture': {
      const inventoryItem = state.inventory.find(
        (item) => item.furnitureId === action.furnitureId,
      );
      const existingPlacedItem = state.placedFurniture.find(
        (item) => item.positionId === action.positionId,
      );

      if (!inventoryItem || inventoryItem.quantity < 1) {
        return state;
      }

      const inventoryAfterPlacement = state.inventory
        .map((item) =>
          item.furnitureId === action.furnitureId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0);
      const inventory = existingPlacedItem
        ? addInventoryItem(inventoryAfterPlacement, existingPlacedItem.furnitureId)
        : inventoryAfterPlacement;

      return {
        ...state,
        inventory,
        placedFurniture: [
          ...state.placedFurniture.filter(
            (item) => item.positionId !== action.positionId,
          ),
          {
            furnitureId: action.furnitureId,
            positionId: action.positionId,
          },
        ],
      };
    }

    case 'setActivePanel':
      return {
        ...state,
        activePanel: action.panel,
      };

    case 'resetGame':
      return createInitialGameState();

    default:
      return state;
  }
}
