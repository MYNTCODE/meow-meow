import { catMovementPoints, getCatMovementPoint } from '../data/catMovementPoints';
import type { CatMovementPoint } from '../data/catMovementPoints';
import { getFurnitureItem } from '../data/furniture';
import type {
  Cat,
  CollisionBox,
  FurnitureItem,
  PlacedFurniture,
  RoomWalkableArea,
} from '../types/game';

export interface NormalizedRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface NormalizedPosition {
  x: number;
  y: number;
}

function rectFromCollisionBox(position: NormalizedPosition, box: CollisionBox): NormalizedRect {
  return {
    left: position.x + box.offsetX,
    top: position.y + box.offsetY - box.height,
    right: position.x + box.offsetX + box.width,
    bottom: position.y + box.offsetY,
  };
}

export function rectsOverlap(a: NormalizedRect, b: NormalizedRect) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export function getCatCollisionRect(cat: Cat, position: NormalizedPosition) {
  return rectFromCollisionBox(position, cat.sprite.collisionBox);
}

export function getFurnitureCollisionRect(
  furniture: FurnitureItem,
  placedFurniture: PlacedFurniture,
) {
  if (!furniture.collision) {
    return undefined;
  }

  if (furniture.placement.positionId !== placedFurniture.positionId) {
    return undefined;
  }

  return rectFromCollisionBox(furniture.placement, furniture.collision);
}

export function getSolidFurnitureCollisionRects(placedFurniture: PlacedFurniture[]) {
  return placedFurniture.flatMap((placedItem) => {
    const furniture = getFurnitureItem(placedItem.furnitureId);

    if (!furniture?.collision?.solid) {
      return [];
    }

    const rect = getFurnitureCollisionRect(furniture, placedItem);

    return rect ? [rect] : [];
  });
}

export function clampPositionToRoomBounds(
  position: NormalizedPosition,
  bounds: RoomWalkableArea,
) {
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, position.x)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, position.y)),
  };
}

export function canMoveToPosition({
  cat,
  position,
  placedFurniture,
}: {
  cat: Cat;
  position: NormalizedPosition;
  placedFurniture: PlacedFurniture[];
}) {
  const catRect = getCatCollisionRect(cat, position);
  const solidRects = getSolidFurnitureCollisionRects(placedFurniture);

  return !solidRects.some((rect) => rectsOverlap(catRect, rect));
}

export function findNearestValidPosition({
  cat,
  origin,
  placedFurniture,
  bounds,
}: {
  cat: Cat;
  origin: NormalizedPosition;
  placedFurniture: PlacedFurniture[];
  bounds: RoomWalkableArea;
}) {
  const candidateOffsets = [
    { x: 0, y: 0 },
    { x: -10, y: 0 },
    { x: 10, y: 0 },
    { x: 0, y: 8 },
    { x: 0, y: -8 },
    { x: -14, y: 8 },
    { x: 14, y: 8 },
    { x: -14, y: -8 },
    { x: 14, y: -8 },
  ];

  return candidateOffsets
    .map((offset) =>
      clampPositionToRoomBounds(
        {
          x: origin.x + offset.x,
          y: origin.y + offset.y,
        },
        bounds,
      ),
    )
    .find((position) =>
      canMoveToPosition({
        cat,
        position,
        placedFurniture,
      }),
    );
}

export function getFurnitureInteractionPoint(placedFurniture: PlacedFurniture) {
  return (
    catMovementPoints.find(
      (point) => point.furnitureSlotId === placedFurniture.positionId,
    ) ?? getCatMovementPoint(placedFurniture.positionId)
  );
}

export function getFurnitureDepthAnchorY(
  furniture: FurnitureItem,
  placedFurniture: PlacedFurniture,
) {
  if (furniture.placement.positionId !== placedFurniture.positionId) {
    return 0;
  }

  return furniture.placement.y + (furniture.rendering?.depthAnchorOffsetY ?? 0);
}

export function getCatDepthAnchorY(position: NormalizedPosition) {
  return position.y;
}

export function findNearbyInteraction({
  position,
  placedFurniture,
}: {
  position: NormalizedPosition;
  placedFurniture: PlacedFurniture[];
}) {
  return placedFurniture.reduce<
    | {
        placedItem: PlacedFurniture;
        point: CatMovementPoint;
        distance: number;
      }
    | undefined
  >((nearestItem, placedItem) => {
    const furniture = getFurnitureItem(placedItem.furnitureId);
    const point = getFurnitureInteractionPoint(placedItem);

    if (!furniture?.interaction || !point) {
      return nearestItem;
    }

    const distance = Math.hypot(position.x - point.x, position.y - point.y);

    if (distance > furniture.interaction.range) {
      return nearestItem;
    }

    if (!nearestItem || distance < nearestItem.distance) {
      return {
        placedItem,
        point,
        distance,
      };
    }

    return nearestItem;
  }, undefined);
}
