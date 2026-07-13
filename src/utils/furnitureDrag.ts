import type { PlacedFurniture } from '../types/game';
import { getRoomContentRect, screenToRoomPoint } from './roomCoordinates';
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
  return screenToRoomPoint(
    getRoomContentRect(roomElement),
    clientX,
    clientY,
  );
}
