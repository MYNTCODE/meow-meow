import type { FacingDirection } from '../types/game';

export interface CatMovementPoint {
  id: string;
  x: number;
  y: number;
  facingDirection: FacingDirection;
  furnitureSlotId?: string;
}

export const catMovementPoints: CatMovementPoint[] = [
  {
    id: 'floor-left',
    x: 34,
    y: 82,
    facingDirection: 'right',
  },
  {
    id: 'bed',
    x: 45,
    y: 82,
    facingDirection: 'right',
  },
  {
    id: 'floor-right',
    x: 66,
    y: 82,
    facingDirection: 'left',
  },
  {
    id: 'food',
    x: 31,
    y: 82,
    facingDirection: 'right',
    furnitureSlotId: 'food',
  },
  {
    id: 'toy',
    x: 68,
    y: 84,
    facingDirection: 'left',
    furnitureSlotId: 'toy',
  },
  {
    id: 'cushion-rest',
    x: 45,
    y: 73,
    facingDirection: 'right',
    furnitureSlotId: 'bed',
  },
];

export const DEFAULT_CAT_MOVEMENT_POINT_ID = 'bed';

export function getCatMovementPoint(pointId: string) {
  return catMovementPoints.find((point) => point.id === pointId);
}
