import { catMovementPoints, getCatMovementPoint } from '../data/catMovementPoints';
import type { CatMovementPoint } from '../data/catMovementPoints';
import { getFurnitureItem } from '../data/furniture';
import type {
  Cat,
  CollisionBox,
  FacingDirection,
  FurnitureItem,
  FurniturePlacement,
  FoodBowlState,
  FurnitureEatInteraction,
  FurnitureRestInteraction,
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

export function getFurnitureRenderScale(furniture: FurnitureItem) {
  return furniture.rendering?.scale ?? 1;
}

export interface NearbyInteraction {
  placedItem: PlacedFurniture;
  furniture: FurnitureItem;
  point: CatMovementPoint;
  distance: number;
  foodState?: FoodBowlState;
}

export interface RestInteractionPosition {
  point: CatMovementPoint;
  catPosition: NormalizedPosition;
  facingDirection: FacingDirection;
  interaction: FurnitureRestInteraction;
}

export interface EatInteractionPosition {
  bowlAnchorPoint: CatMovementPoint;
  catStandPosition: NormalizedPosition;
  catRenderPosition: NormalizedPosition;
  mouthPosition: NormalizedPosition;
  facingDirection: FacingDirection;
  eatCatScale: number;
  interaction: FurnitureEatInteraction;
}

function rectFromCollisionBox(
  position: NormalizedPosition,
  box: CollisionBox,
  scale = 1,
): NormalizedRect {
  return {
    left: position.x + box.offsetX * scale,
    top: position.y + box.offsetY * scale - box.height * scale,
    right: position.x + box.offsetX * scale + box.width * scale,
    bottom: position.y + box.offsetY * scale,
  };
}

export function getFurnitureVisualRect(
  furniture: FurnitureItem,
  placement: FurniturePlacement,
) {
  const scale = getFurnitureRenderScale(furniture);
  const width = placement.width * scale;
  const height = width * (furniture.sourceHeight / furniture.sourceWidth);

  return {
    left: placement.x - width / 2,
    top: placement.y - height,
    right: placement.x + width / 2,
    bottom: placement.y,
  };
}

export function getFurnitureRenderRectFromAnchor(
  furniture: FurnitureItem,
  placement: FurniturePlacement,
) {
  return getFurnitureVisualRect(furniture, placement);
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

export function getCatRenderRectFromAnchor(cat: Cat, position: NormalizedPosition) {
  return getCatCollisionRect(cat, position);
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
    getFurnitureRenderScale(furniture),
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
  const scale = getFurnitureRenderScale(furniture);
  const width = placement.width * scale;
  const height = width * (furniture.sourceHeight / furniture.sourceWidth);

  return {
    ...placement,
    x: Math.min(100 - width / 2, Math.max(width / 2, placement.x)),
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
    ? rectFromCollisionBox(placement, furniture.collision, getFurnitureRenderScale(furniture))
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
  const scale = getFurnitureRenderScale(furniture);

  if (furniture.interaction.type === 'rest') {
    return {
      id: `${placedFurniture.positionId}-interaction`,
      x: placement.x + furniture.interaction.anchorOffsetX * scale,
      y: placement.y + furniture.interaction.anchorOffsetY * scale,
      facingDirection:
        furniture.interaction.catFacingDirection ??
        getCatMovementPoint(placedFurniture.positionId)?.facingDirection ??
        'right',
      furnitureSlotId: placedFurniture.positionId,
    } satisfies CatMovementPoint;
  }

  return {
    id: `${placedFurniture.positionId}-interaction`,
    x: placement.x + furniture.interaction.bowlAnchorOffsetX * scale,
    y: placement.y + furniture.interaction.bowlAnchorOffsetY * scale,
    facingDirection: furniture.interaction.catFacingDirection,
    furnitureSlotId: placedFurniture.positionId,
  } satisfies CatMovementPoint;
}

export function getRestInteractionPosition(placedFurniture: PlacedFurniture) {
  const furniture = getFurnitureItem(placedFurniture.furnitureId);

  if (furniture?.interaction?.type !== 'rest') {
    return undefined;
  }

  const placement = getResolvedFurniturePlacement(furniture, placedFurniture);
  const scale = getFurnitureRenderScale(furniture);
  const point = {
    id: `${placedFurniture.positionId}-interaction`,
    x: placement.x + furniture.interaction.anchorOffsetX * scale,
    y: placement.y + furniture.interaction.anchorOffsetY * scale,
    facingDirection:
      furniture.interaction.catFacingDirection ??
      getCatMovementPoint(placedFurniture.positionId)?.facingDirection ??
      'right',
    furnitureSlotId: placedFurniture.positionId,
  } satisfies CatMovementPoint;

  return {
    point,
    catPosition: {
      x: point.x + furniture.interaction.catOffsetX * scale,
      y: point.y + furniture.interaction.catOffsetY * scale,
    },
    facingDirection: point.facingDirection,
    interaction: furniture.interaction,
  } satisfies RestInteractionPosition;
}

export function getEatInteractionPosition(placedFurniture: PlacedFurniture) {
  const furniture = getFurnitureItem(placedFurniture.furnitureId);

  if (furniture?.interaction?.type !== 'eat') {
    return undefined;
  }

  const placement = getResolvedFurniturePlacement(furniture, placedFurniture);
  const scale = getFurnitureRenderScale(furniture);
  const bowlAnchorPoint = {
    id: `${placedFurniture.positionId}-interaction`,
    x: placement.x + furniture.interaction.bowlAnchorOffsetX * scale,
    y: placement.y + furniture.interaction.bowlAnchorOffsetY * scale,
    facingDirection: furniture.interaction.catFacingDirection,
    furnitureSlotId: placedFurniture.positionId,
  } satisfies CatMovementPoint;

  return {
    bowlAnchorPoint,
    catStandPosition: {
      x: placement.x + furniture.interaction.catStandOffsetX * scale,
      y: placement.y + furniture.interaction.catStandOffsetY * scale,
    },
    catRenderPosition: {
      x:
        placement.x +
        furniture.interaction.catStandOffsetX * scale +
        (furniture.interaction.eatRenderOffsetX ?? 0) * scale,
      y:
        placement.y +
        furniture.interaction.catStandOffsetY * scale +
        (furniture.interaction.eatRenderOffsetY ?? 0) * scale,
    },
    mouthPosition: {
      x: bowlAnchorPoint.x + (furniture.interaction.mouthOffsetX ?? 0) * scale,
      y: bowlAnchorPoint.y + (furniture.interaction.mouthOffsetY ?? 0) * scale,
    },
    facingDirection: furniture.interaction.catFacingDirection,
    eatCatScale: furniture.interaction.eatCatScale ?? 1,
    interaction: furniture.interaction,
  } satisfies EatInteractionPosition;
}

export function getEatRenderPosition(placedFurniture: PlacedFurniture) {
  const eatPosition = getEatInteractionPosition(placedFurniture);

  if (!eatPosition) {
    return undefined;
  }

  return {
    ...eatPosition,
    renderPosition: eatPosition.catRenderPosition,
  };
}

export function getFurnitureDepthAnchorY(
  furniture: FurnitureItem,
  placedFurniture: PlacedFurniture,
) {
  return (
    getResolvedFurniturePlacement(furniture, placedFurniture).y +
    (furniture.rendering?.depthAnchorOffsetY ?? 0) * getFurnitureRenderScale(furniture)
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
}): NearbyInteraction | undefined {
  return placedFurniture.reduce<NearbyInteraction | undefined>((nearestItem, placedItem) => {
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
        furniture,
        point,
        distance,
        foodState: placedItem.interactionState?.foodState,
      };
    }

    return nearestItem;
  }, undefined);
}

export function getPlacedFurnitureFoodState(placedFurniture: PlacedFurniture) {
  return placedFurniture.interactionState?.foodState ?? 'full';
}

export function findNearbyInteractionOfType({
  interactionType,
  position,
  placedFurniture,
}: {
  interactionType: NonNullable<FurnitureItem['interaction']>['type'];
  position: NormalizedPosition;
  placedFurniture: PlacedFurniture[];
}): NearbyInteraction | undefined {
  return placedFurniture.reduce<NearbyInteraction | undefined>((nearestItem, placedItem) => {
    const furniture = getFurnitureItem(placedItem.furnitureId);
    const point = getFurnitureInteractionPoint(placedItem);

    if (!furniture?.interaction || furniture.interaction.type !== interactionType || !point) {
      return nearestItem;
    }

    const distance = Math.hypot(position.x - point.x, position.y - point.y);

    if (distance > furniture.interaction.range) {
      return nearestItem;
    }

    if (!nearestItem || distance < nearestItem.distance) {
      return {
        placedItem,
        furniture,
        point,
        distance,
        foodState: placedItem.interactionState?.foodState,
      };
    }

    return nearestItem;
  }, undefined);
}
