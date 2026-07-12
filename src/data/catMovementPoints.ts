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
    id: 'floor-center',
    x: 50,
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
    id: 'cushion-rest',
    x: 50,
    y: 73,
    facingDirection: 'right',
    furnitureSlotId: 'floor-center',
  },
];

export const DEFAULT_CAT_MOVEMENT_POINT_ID = 'floor-center';

export function getCatMovementPoint(pointId: string) {
  return catMovementPoints.find((point) => point.id === pointId);
}
