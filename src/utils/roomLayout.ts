import { getFurnitureItem } from '../data/furniture';
import type { Cat, PlacedFurniture } from '../types/game';
import type { NormalizedPosition } from './collision';
import { validateFurniturePlacement } from './collision';
import type { FurniturePlacementInvalidReason } from './furnitureDrag';

export interface RoomLayoutValidationResult {
  invalidFurnitureIds: Set<string>;
  invalidReasonsById: Map<string, FurniturePlacementInvalidReason>;
  isValid: boolean;
}

export function validateRoomLayout({
  cat,
  catPosition,
  placedFurniture,
}: {
  cat: Cat;
  catPosition: NormalizedPosition;
  placedFurniture: PlacedFurniture[];
}): RoomLayoutValidationResult {
  const invalidFurnitureIds = new Set<string>();
  const invalidReasonsById = new Map<string, FurniturePlacementInvalidReason>();

  placedFurniture.forEach((placedItem) => {
    const furniture = getFurnitureItem(placedItem.furnitureId);

    if (!furniture) {
      invalidFurnitureIds.add(placedItem.instanceId);
      invalidReasonsById.set(placedItem.instanceId, 'invalid-coordinate');
      return;
    }

    const validation = validateFurniturePlacement({
      furniture,
      placement: placedItem.placement,
      placedFurniture,
      cat,
      catPosition,
      excludedFurniture: placedItem,
    });

    if (!validation.isValid && validation.reason) {
      invalidFurnitureIds.add(placedItem.instanceId);
      invalidReasonsById.set(placedItem.instanceId, validation.reason);
    }
  });

  return {
    invalidFurnitureIds,
    invalidReasonsById,
    isValid: invalidFurnitureIds.size === 0,
  };
}
