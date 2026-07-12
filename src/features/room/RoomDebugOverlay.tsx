import type { CatMovementPoint } from '../../data/catMovementPoints';
import { roomWalkableArea } from '../../data/roomMovementConfig';
import type { FurnitureDragDebugState } from '../../hooks/useFurnitureDrag';
import type { CatBehaviorSnapshot } from '../../types/catBehavior';
import type { Cat, PlacedFurniture } from '../../types/game';
import {
  getCatCollisionRect,
  getCatDepthAnchorY,
  getFurnitureCollisionRect,
  getFurnitureDepthAnchorY,
  getFurnitureInteractionPoint,
} from '../../utils/collision';
import { getFurnitureItem } from '../../data/furniture';
import styles from './RoomDebugOverlay.module.css';

interface RoomDebugOverlayProps {
  behavior: CatBehaviorSnapshot;
  cat: Cat;
  movementBlocked: boolean;
  movementPoints: CatMovementPoint[];
  placedFurniture: PlacedFurniture[];
  furnitureDragDebug: FurnitureDragDebugState | null;
}

function getRectStyle(rect: { left: number; top: number; right: number; bottom: number }) {
  return {
    left: `${rect.left}%`,
    top: `${rect.top}%`,
    width: `${rect.right - rect.left}%`,
    height: `${rect.bottom - rect.top}%`,
  };
}

export function RoomDebugOverlay({
  behavior,
  cat,
  movementBlocked,
  movementPoints,
  placedFurniture,
  furnitureDragDebug,
}: RoomDebugOverlayProps) {
  const catCollisionRect = getCatCollisionRect(cat, behavior);
  const catDepthAnchorY = getCatDepthAnchorY(behavior);
  const furnitureDebugItems = placedFurniture.flatMap((placedItem) => {
    const furniture = getFurnitureItem(placedItem.furnitureId);

    if (!furniture) {
      return [];
    }

    const collisionRect = getFurnitureCollisionRect(furniture, placedItem);
    const interactionPoint = getFurnitureInteractionPoint(placedItem);

    return [
      {
        collisionRect,
        depthAnchorY: getFurnitureDepthAnchorY(furniture, placedItem),
        furniture,
        interactionPoint,
        placedItem,
      },
    ];
  });

  return (
    <div className={styles.debugOverlay} aria-label="Cat behavior debug overlay">
      <span
        className={styles.bounds}
        style={{
          left: `${roomWalkableArea.minX}%`,
          top: `${roomWalkableArea.minY}%`,
          width: `${roomWalkableArea.maxX - roomWalkableArea.minX}%`,
          height: `${roomWalkableArea.maxY - roomWalkableArea.minY}%`,
        }}
      />
      {movementPoints.map((point) => (
        <span
          className={styles.point}
          key={point.id}
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
          }}
          title={point.id}
        />
      ))}
      <span className={styles.catCollision} style={getRectStyle(catCollisionRect)} />
      {furnitureDebugItems.map(({ collisionRect, depthAnchorY, furniture, interactionPoint, placedItem }) => (
        <span key={placedItem.instanceId}>
          {collisionRect ? (
            <span
              className={
                furniture.collision?.solid
                  ? styles.solidFurnitureCollision
                  : styles.passableFurnitureCollision
              }
              style={getRectStyle(collisionRect)}
            />
          ) : null}
          {interactionPoint && furniture.interaction ? (
            <span
              className={styles.interactionRange}
              style={{
                left: `${interactionPoint.x}%`,
                top: `${interactionPoint.y}%`,
                width: `${furniture.interaction.range * 2}%`,
                height: `${furniture.interaction.range * 2}%`,
              }}
            />
          ) : null}
          <span
            className={styles.depthAnchor}
            style={{
              left: `${placedItem.placement.x}%`,
              top: `${depthAnchorY}%`,
            }}
          />
        </span>
      ))}
      <span
        className={styles.catDepthAnchor}
        style={{
          left: `${behavior.x}%`,
          top: `${catDepthAnchorY}%`,
        }}
      />
      <span
        className={styles.anchor}
        style={{
          left: `${behavior.x}%`,
          top: `${behavior.y}%`,
        }}
      />
      <div className={styles.readout}>
        <span>State: {behavior.state}</span>
        <span>Position: {behavior.x.toFixed(1)}, {behavior.y.toFixed(1)}</span>
        <span>Facing: {behavior.facingDirection}</span>
        <span>Blocked: {movementBlocked ? 'yes' : 'no'}</span>
        <span>Cat depth: {catDepthAnchorY.toFixed(1)}</span>
        {furnitureDragDebug ? (
          <>
            <span>Drag item: {furnitureDragDebug.itemId}</span>
            <span>
              Drag original: {furnitureDragDebug.originalPosition.x.toFixed(1)},
              {' '}
              {furnitureDragDebug.originalPosition.y.toFixed(1)}
            </span>
            <span>
              Drag preview: {furnitureDragDebug.previewPosition.x.toFixed(1)},
              {' '}
              {furnitureDragDebug.previewPosition.y.toFixed(1)}
            </span>
            <span>
              Drag offset: {furnitureDragDebug.pointerOffset.x.toFixed(1)},
              {' '}
              {furnitureDragDebug.pointerOffset.y.toFixed(1)}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
