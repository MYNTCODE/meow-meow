import { getFurnitureItem } from '../data/furniture';
import { defaultCat } from '../data/cats';
import type { FurnitureId, GameState, OpenPanel } from '../types/game';
import { DEFAULT_ROOM_NAME, normalizeRoomName } from '../utils/roomName';
import type { PlacedFurniture } from '../types/game';

function buildPlacedFurnitureInstanceId(furnitureId: FurnitureId, positionId: string) {
  return `${positionId}:${furnitureId}`;
}

export type GameAction =
  | { type: 'earnCoins'; amount: number }
  | { type: 'buyFurniture'; furnitureId: FurnitureId }
  | { type: 'placeFurniture'; furnitureId: FurnitureId; positionId: string }
  | { type: 'setPlacedFurnitureLayout'; placedFurniture: PlacedFurniture[] }
  | { type: 'setOpenPanel'; panel: OpenPanel }
  | { type: 'setRoomName'; roomName: string }
  | { type: 'resetGame' };

export const DEFAULT_GAME_STATE: GameState = {
  coins: 20,
  roomName: DEFAULT_ROOM_NAME,
  cat: defaultCat,
  inventory: [],
  placedFurniture: [],
  openPanel: null,
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

function getDefaultPlacedFurniture(
  furnitureId: FurnitureId,
  positionId: string,
): PlacedFurniture | undefined {
  const furniture = getFurnitureItem(furnitureId);

  if (!furniture) {
    return undefined;
  }

  return {
    instanceId: buildPlacedFurnitureInstanceId(furnitureId, positionId),
    furnitureId,
    positionId,
    placement: {
      x: furniture.placement.x,
      y: furniture.placement.y,
      width: furniture.placement.width,
      zIndex: furniture.placement.zIndex,
    },
    interactionState:
      furnitureId === 'food-bowl'
        ? {
            foodState: 'full',
          }
        : undefined,
  };
}

function normalizePlacedFurniture(
  placedFurniture: GameState['placedFurniture'],
): GameState['placedFurniture'] {
  return placedFurniture.flatMap((item) => {
    const defaultItem = getDefaultPlacedFurniture(item.furnitureId, item.positionId);

    if (!defaultItem) {
      return [];
    }

    return [
      {
        ...defaultItem,
        instanceId:
          item.instanceId ?? buildPlacedFurnitureInstanceId(item.furnitureId, item.positionId),
        placement: item.placement ?? defaultItem.placement,
        interactionState:
          item.furnitureId === 'food-bowl'
            ? {
                foodState: item.interactionState?.foodState ?? 'full',
              }
            : item.interactionState,
      },
    ];
  });
}

export function createInitialGameState(savedState: Partial<GameState> = {}): GameState {
  return {
    ...DEFAULT_GAME_STATE,
    coins: savedState.coins ?? DEFAULT_GAME_STATE.coins,
    roomName: normalizeRoomName(savedState.roomName),
    inventory: savedState.inventory ?? DEFAULT_GAME_STATE.inventory,
    placedFurniture: normalizePlacedFurniture(
      savedState.placedFurniture ?? DEFAULT_GAME_STATE.placedFurniture,
    ),
    openPanel: null,
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

      const defaultPlacedFurniture = getDefaultPlacedFurniture(
        action.furnitureId,
        action.positionId,
      );

      if (!defaultPlacedFurniture) {
        return state;
      }

      return {
        ...state,
        inventory,
        placedFurniture: [
          ...state.placedFurniture.filter(
            (item) => item.positionId !== action.positionId,
          ),
          defaultPlacedFurniture,
        ],
      };
    }

    case 'setPlacedFurnitureLayout':
      return {
        ...state,
        placedFurniture: normalizePlacedFurniture(action.placedFurniture),
      };

    case 'setOpenPanel':
      return {
        ...state,
        openPanel: action.panel,
      };

    case 'setRoomName':
      return {
        ...state,
        roomName: action.roomName,
      };

    case 'resetGame':
      return createInitialGameState();

    default:
      return state;
  }
}
