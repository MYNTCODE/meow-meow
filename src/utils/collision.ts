import { catMovementPoints, getCatMovementPoint } from '../data/catMovementPoints';
import type { CatMovementPoint } from '../data/catMovementPoints';
import { getFurnitureItem } from '../data/furniture';
import type {
  Cat,
  CollisionBox,
  FurnitureItem,
  FurniturePlacement,
  PlacedFurniture,
  RoomWalkableArea,
} from '../types/game';
import type { FurniturePlacementInvalidReason } from './furnitureDrag';

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

export function getFurnitureVisualRect(
  furniture: FurnitureItem,
  placement: FurniturePlacement,
) {
  const height = placement.width * (furniture.sourceHeight / furniture.sourceWidth);

  return {
    left: placement.x - placement.width / 2,
    top: placement.y - height,
    right: placement.x + placement.width / 2,
    bottom: placement.y,
  };
}

export function getResolvedFurniturePlacement(
  furniture: FurnitureItem,
  placedFurniture: PlacedFurniture,
) {
  if (furniture.placement.positionId !== placedFurniture.positionId) {
    return placedFurniture.placement;
  }

  return placedFurniture.placement;
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

  return rectFromCollisionBox(
    getResolvedFurniturePlacement(furniture, placedFurniture),
    furniture.collision,
  );
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

export function getSolidFurnitureCollisionRectsExcept(
  placedFurniture: PlacedFurniture[],
  excludedFurniture: PlacedFurniture,
) {
  return placedFurniture.flatMap((placedItem) => {
    if (placedItem.instanceId === excludedFurniture.instanceId) {
      return [];
    }

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

export function getFurniturePlacementVisualBounds(
  furniture: FurnitureItem,
  placement: FurniturePlacement,
) {
  return getFurnitureVisualRect(furniture, placement);
}

export function clampFurniturePlacementToRoom(
  furniture: FurnitureItem,
  placement: FurniturePlacement,
) {
  const height = placement.width * (furniture.sourceHeight / furniture.sourceWidth);

  return {
    ...placement,
    x: Math.min(100 - placement.width / 2, Math.max(placement.width / 2, placement.x)),
    y: Math.min(100, Math.max(height, placement.y)),
  };
}

export function validateFurniturePlacement({
  furniture,
  placement,
  placedFurniture,
  cat,
  catPosition,
  excludedFurniture,
}: {
  furniture: FurnitureItem;
  placement: FurniturePlacement;
  placedFurniture: PlacedFurniture[];
  cat: Cat;
  catPosition: NormalizedPosition;
  excludedFurniture: PlacedFurniture;
}) {
  if (!Number.isFinite(placement.x) || !Number.isFinite(placement.y)) {
    return {
      isValid: false,
      reason: 'invalid-coordinate' as FurniturePlacementInvalidReason,
    };
  }

  const visualBounds = getFurniturePlacementVisualBounds(furniture, placement);
  const catRect = getCatCollisionRect(cat, catPosition);
  const roomFits =
    visualBounds.left >= 0 &&
    visualBounds.top >= 0 &&
    visualBounds.right <= 100 &&
    visualBounds.bottom <= 100;

  if (!roomFits) {
    return {
      isValid: false,
      reason: 'outside-room' as FurniturePlacementInvalidReason,
    };
  }

  const collisionRect = furniture.collision
    ? rectFromCollisionBox(placement, furniture.collision)
    : undefined;

  if (collisionRect) {
    const otherSolidRects = getSolidFurnitureCollisionRectsExcept(
      placedFurniture,
      excludedFurniture,
    );

    if (otherSolidRects.some((rect) => rectsOverlap(collisionRect, rect))) {
      return {
        isValid: false,
        reason: 'overlaps-furniture' as FurniturePlacementInvalidReason,
      };
    }

    if (rectsOverlap(collisionRect, catRect)) {
      return {
        isValid: false,
        reason: 'overlaps-cat' as FurniturePlacementInvalidReason,
      };
    }
  }

  return {
    isValid: true,
    reason: undefined,
  };
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
  const furniture = getFurnitureItem(placedFurniture.furnitureId);

  if (!furniture?.interaction) {
    return undefined;
  }

  const placement = getResolvedFurniturePlacement(furniture, placedFurniture);

  return {
    id: `${placedFurniture.positionId}-interaction`,
    x: placement.x + furniture.interaction.catOffsetX,
    y: placement.y + furniture.interaction.catOffsetY,
    facingDirection:
      furniture.interaction.catFacingDirection ??
      getCatMovementPoint(placedFurniture.positionId)?.facingDirection ??
      'right',
    furnitureSlotId: placedFurniture.positionId,
  } satisfies CatMovementPoint;
}

export function getFurnitureDepthAnchorY(
  furniture: FurnitureItem,
  placedFurniture: PlacedFurniture,
) {
  return (
    getResolvedFurniturePlacement(furniture, placedFurniture).y +
    (furniture.rendering?.depthAnchorOffsetY ?? 0)
  );
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
