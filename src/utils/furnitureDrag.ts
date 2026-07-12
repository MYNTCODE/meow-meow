import type { PlacedFurniture } from '../types/game';

export type FurniturePlacementInvalidReason =
  | 'outside-room'
  | 'overlaps-furniture'
  | 'overlaps-cat'
  | 'missing-room-bounds'
  | 'invalid-coordinate';

export interface RoomPointerCoordinates {
  x: number;
  y: number;
}

export function buildFurnitureKey(placedFurniture: PlacedFurniture) {
  return placedFurniture.instanceId;
}

export function pointerToRoomCoordinates(
  roomElement: HTMLElement,
  clientX: number,
  clientY: number,
): RoomPointerCoordinates {
  const rect = roomElement.getBoundingClientRect();

  return {
    x: ((clientX - rect.left) / rect.width) * 100,
    y: ((clientY - rect.top) / rect.height) * 100,
  };
}
