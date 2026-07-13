import { getFurnitureItem } from '../data/furniture';
import { ROOM_SLOT_POSITIONS } from '../data/roomSlots';
import { defaultCat } from '../data/cats';
import type { EquippedItems, FurnitureId, GameState, OpenPanel } from '../types/game';
import { DEFAULT_ROOM_NAME, normalizeRoomName } from '../utils/roomName';
import type { PlacedFurniture } from '../types/game';

function buildPlacedFurnitureInstanceId(furnitureId: FurnitureId, positionId: string) {
  return `${positionId}:${furnitureId}`;
}

export type GameAction =
  | { type: 'earnCoins'; amount: number }
  | { type: 'buyFurniture'; furnitureId: FurnitureId }
  | { type: 'equipFurniture'; furnitureId: FurnitureId }
  | { type: 'setPlacedFurnitureLayout'; placedFurniture: PlacedFurniture[] }
  | { type: 'setOpenPanel'; panel: OpenPanel }
  | { type: 'setRoomName'; roomName: string }
  | { type: 'resetGame' };

export const DEFAULT_GAME_STATE: GameState = {
  coins: 20,
  roomName: DEFAULT_ROOM_NAME,
  cat: defaultCat,
  inventory: [],
  equippedItems: {},
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
  const slotPosition = ROOM_SLOT_POSITIONS[furniture?.slot ?? positionId as keyof typeof ROOM_SLOT_POSITIONS];

  if (!furniture || !slotPosition || furniture.slot !== positionId) {
    return undefined;
  }

  return {
    instanceId: buildPlacedFurnitureInstanceId(furnitureId, positionId),
    furnitureId,
    positionId: furniture.slot,
    placement: {
      x: slotPosition.x,
      y: slotPosition.y,
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

function buildEquippedItemsFromPlacedFurniture(
  placedFurniture: GameState['placedFurniture'],
): EquippedItems {
  return placedFurniture.reduce<EquippedItems>((equippedItems, item) => {
    const furniture = getFurnitureItem(item.furnitureId);

    if (!furniture) {
      return equippedItems;
    }

    equippedItems[furniture.slot] = item.furnitureId;
    return equippedItems;
  }, {});
}

function buildPlacedFurnitureFromEquippedItems(
  equippedItems: EquippedItems,
  previousPlacedFurniture: GameState['placedFurniture'],
): GameState['placedFurniture'] {
  return Object.entries(equippedItems).flatMap(([slot, furnitureId]) => {
    if (!furnitureId) {
      return [];
    }

    const normalizedItem = getDefaultPlacedFurniture(furnitureId, slot);

    if (!normalizedItem) {
      return [];
    }

    const previousItem = previousPlacedFurniture.find((item) => item.positionId === slot);

    return [
      {
        ...normalizedItem,
        interactionState:
          previousItem?.furnitureId === furnitureId
            ? previousItem.interactionState ?? normalizedItem.interactionState
            : normalizedItem.interactionState,
      },
    ];
  });
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

export function createInitialGameState(
  savedState: Partial<GameState> & { activeItemId?: FurnitureId | null } = {},
): GameState {
  const legacyActiveFurniture = savedState.activeItemId ? getFurnitureItem(savedState.activeItemId) : undefined;
  const migratedEquippedItems =
    savedState.equippedItems && Object.keys(savedState.equippedItems).length > 0
      ? savedState.equippedItems
      : savedState.placedFurniture && savedState.placedFurniture.length > 0
        ? buildEquippedItemsFromPlacedFurniture(savedState.placedFurniture)
        : legacyActiveFurniture
          ? { [legacyActiveFurniture.slot]: legacyActiveFurniture.id }
          : {};
  const normalizedPlacedFurniture = normalizePlacedFurniture(
    savedState.placedFurniture ?? DEFAULT_GAME_STATE.placedFurniture,
  );

  return {
    ...DEFAULT_GAME_STATE,
    coins: savedState.coins ?? DEFAULT_GAME_STATE.coins,
    roomName: normalizeRoomName(savedState.roomName),
    inventory: savedState.inventory ?? DEFAULT_GAME_STATE.inventory,
    equippedItems: migratedEquippedItems,
    placedFurniture: buildPlacedFurnitureFromEquippedItems(
      migratedEquippedItems,
      normalizedPlacedFurniture,
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
      const alreadyOwned = state.inventory.some((item) => item.furnitureId === action.furnitureId);

      if (!furniture || alreadyOwned || state.coins < furniture.price) {
        return state;
      }

      return {
        ...state,
        coins: state.coins - furniture.price,
        inventory: addInventoryItem(state.inventory, action.furnitureId),
      };
    }

    case 'equipFurniture': {
      const furniture = getFurnitureItem(action.furnitureId);
      const inventoryItem = state.inventory.find((item) => item.furnitureId === action.furnitureId);

      if (!furniture || !inventoryItem) {
        return state;
      }

      if (state.equippedItems[furniture.slot] === action.furnitureId) {
        return state;
      }

      const equippedItems = {
        ...state.equippedItems,
        [furniture.slot]: action.furnitureId,
      };

      return {
        ...state,
        equippedItems,
        placedFurniture: buildPlacedFurnitureFromEquippedItems(
          equippedItems,
          state.placedFurniture,
        ),
      };
    }

    case 'setPlacedFurnitureLayout': {
      const normalizedFurniture = normalizePlacedFurniture(action.placedFurniture);

      return {
        ...state,
        equippedItems: buildEquippedItemsFromPlacedFurniture(normalizedFurniture),
        placedFurniture: normalizedFurniture,
      };
    }

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
