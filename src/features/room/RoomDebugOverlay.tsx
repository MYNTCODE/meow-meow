import type { CatMovementPoint } from '../../data/catMovementPoints';
import { roomWalkableArea } from '../../data/roomMovementConfig';
import type { FurnitureDragDebugState } from '../../hooks/useFurnitureDrag';
import type { RoomMetrics } from '../../hooks/useRoomMetrics';
import type { CatBehaviorSnapshot } from '../../types/catBehavior';
import type { Cat, PlacedFurniture } from '../../types/game';
import {
  getCatCollisionRect,
  getCatDepthAnchorY,
  getEatInteractionPosition,
  getEatRenderPosition,
  getFurnitureCollisionRect,
  getFurnitureDepthAnchorY,
  getFurnitureInteractionPoint,
  getRestInteractionPosition,
  getPlacedFurnitureFoodState,
} from '../../utils/collision';
import { getFurnitureItem } from '../../data/furniture';
import {
  roomRectToScreenRect,
  roomToScreenPoint,
} from '../../utils/roomCoordinates';
import styles from './RoomDebugOverlay.module.css';

interface RoomDebugOverlayProps {
  behavior: CatBehaviorSnapshot;
  cat: Cat;
  movementBlocked: boolean;
  movementPoints: CatMovementPoint[];
  placedFurniture: PlacedFurniture[];
  furnitureDragDebug: FurnitureDragDebugState | null;
  roomMetrics: RoomMetrics;
  showAnchorLabels: boolean;
}

function getRectStyle(rect: { left: number; top: number; right: number; bottom: number }) {
  return {
    left: `${rect.left}%`,
    top: `${rect.top}%`,
    width: `${rect.right - rect.left}%`,
    height: `${rect.bottom - rect.top}%`,
  };
}

function getPointStyle(point: { x: number; y: number }) {
  return {
    left: `${point.x}%`,
    top: `${point.y}%`,
  };
}

function DebugMarker({
  className,
  label,
  point,
  showLabel,
}: {
  className: string;
  label: string;
  point: { x: number; y: number };
  showLabel: boolean;
}) {
  return (
    <span className={styles.markerWrap} style={getPointStyle(point)} title={label}>
      <span className={className} />
      {showLabel ? <span className={styles.markerLabel}>{label}</span> : null}
    </span>
  );
}

export function RoomDebugOverlay({
  behavior,
  cat,
  movementBlocked,
  movementPoints,
  placedFurniture,
  furnitureDragDebug,
  roomMetrics,
  showAnchorLabels,
}: RoomDebugOverlayProps) {
  const catCollisionRect = getCatCollisionRect(cat, behavior);
  const catDepthAnchorY = getCatDepthAnchorY(behavior);
  const catScreenPoint = roomMetrics.roomRect
    ? roomToScreenPoint(roomMetrics.roomRect, {
        x: behavior.x,
        y: behavior.y,
      })
    : null;
  const catScreenCollisionRect = roomMetrics.roomRect
    ? roomRectToScreenRect(roomMetrics.roomRect, catCollisionRect)
    : null;
  const currentPlacedFurniture =
    behavior.state === 'eating' && behavior.currentInteractionInstanceId
      ? placedFurniture.find((item) => item.instanceId === behavior.currentInteractionInstanceId)
      : undefined;
  const currentEatRenderPosition = currentPlacedFurniture
    ? getEatRenderPosition(currentPlacedFurniture)
    : undefined;
  const furnitureDebugItems = placedFurniture.flatMap((placedItem) => {
    const furniture = getFurnitureItem(placedItem.furnitureId);

    if (!furniture) {
      return [];
    }

    const collisionRect = getFurnitureCollisionRect(furniture, placedItem);
    const interactionPoint = getFurnitureInteractionPoint(placedItem);
    const restPosition = getRestInteractionPosition(placedItem);
    const eatPosition = getEatInteractionPosition(placedItem);
    const screenAnchor = roomMetrics.roomRect
      ? roomToScreenPoint(roomMetrics.roomRect, {
          x: placedItem.placement.x,
          y: placedItem.placement.y,
        })
      : null;
    const screenCollisionRect =
      roomMetrics.roomRect && collisionRect
        ? roomRectToScreenRect(roomMetrics.roomRect, collisionRect)
        : null;
    const screenInteractionPoint =
      roomMetrics.roomRect && interactionPoint
        ? roomToScreenPoint(roomMetrics.roomRect, {
            x: interactionPoint.x,
            y: interactionPoint.y,
          })
        : null;

    return [
      {
        collisionRect,
        depthAnchorY: getFurnitureDepthAnchorY(furniture, placedItem),
        furniture,
        interactionPoint,
        restPosition,
        eatPosition,
        placedItem,
        screenAnchor,
        screenCollisionRect,
        screenInteractionPoint,
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
      {furnitureDebugItems.map(
        ({
          collisionRect,
          depthAnchorY,
          furniture,
          interactionPoint,
          restPosition,
          eatPosition,
          placedItem,
        }) => (
          <span key={placedItem.instanceId}>
            <DebugMarker
              className={styles.floorAnchor}
              label="Floor anchor"
              point={{
                x: placedItem.placement.x,
                y: placedItem.placement.y,
              }}
              showLabel={showAnchorLabels}
            />
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
            {restPosition ? (
              <>
                <span
                  className={styles.interactionRange}
                  style={{
                    left: `${restPosition.point.x}%`,
                    top: `${restPosition.point.y}%`,
                    width: `${restPosition.interaction.range * 2}%`,
                    height: `${restPosition.interaction.range * 2}%`,
                  }}
                  title="Rest interaction range"
                />
                <DebugMarker
                  className={styles.interactionAnchor}
                  label="Rest anchor"
                  point={restPosition.point}
                  showLabel={showAnchorLabels}
                />
                <DebugMarker
                  className={styles.restTarget}
                  label="Rest cat target"
                  point={restPosition.catPosition}
                  showLabel={showAnchorLabels}
                />
              </>
            ) : null}
            {eatPosition ? (
              <>
                <span
                  className={styles.interactionRange}
                  style={{
                    left: `${eatPosition.bowlAnchorPoint.x}%`,
                    top: `${eatPosition.bowlAnchorPoint.y}%`,
                    width: `${eatPosition.interaction.range * 2}%`,
                    height: `${eatPosition.interaction.range * 2}%`,
                  }}
                  title="Eat interaction range"
                />
                <DebugMarker
                  className={styles.eatAnchor}
                  label="Eat bowl anchor"
                  point={eatPosition.bowlAnchorPoint}
                  showLabel={showAnchorLabels}
                />
                <DebugMarker
                  className={styles.eatTarget}
                  label="Eat cat target"
                  point={eatPosition.catStandPosition}
                  showLabel={showAnchorLabels}
                />
                <DebugMarker
                  className={styles.mouthTarget}
                  label="Eat mouth target"
                  point={eatPosition.mouthPosition}
                  showLabel={showAnchorLabels}
                />
              </>
            ) : null}
            <span
              className={styles.depthAnchor}
              style={{
                left: `${placedItem.placement.x}%`,
                top: `${depthAnchorY}%`,
              }}
            />
          </span>
        ),
      )}
      <span
        className={styles.catDepthAnchor}
        style={{
          left: `${behavior.x}%`,
          top: `${catDepthAnchorY}%`,
        }}
      />
      {currentEatRenderPosition ? (
        <DebugMarker
          className={styles.eatTarget}
          label="Eat render position"
          point={currentEatRenderPosition.renderPosition}
          showLabel={showAnchorLabels}
        />
      ) : null}
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
        <span>
          Logical room: {roomWalkableArea.minX.toFixed(0)}..{roomWalkableArea.maxX.toFixed(0)} x{' '}
          {roomWalkableArea.minY.toFixed(0)}..{roomWalkableArea.maxY.toFixed(0)}
        </span>
        <span>
          Rendered room content:{' '}
          {roomMetrics.roomRect
            ? `${roomMetrics.roomRect.left.toFixed(1)}, ${roomMetrics.roomRect.top.toFixed(1)} -> ${(
                roomMetrics.roomRect.left + roomMetrics.roomRect.width
              ).toFixed(1)}, ${(roomMetrics.roomRect.top + roomMetrics.roomRect.height).toFixed(1)}`
            : 'none'}
        </span>
        <span>
          Room scale: {roomMetrics.scaleX.toFixed(3)} x {roomMetrics.scaleY.toFixed(3)}
        </span>
        <span>Metrics ready: {roomMetrics.isReady ? 'yes' : 'no'}</span>
        <span>
          Cat screen:{' '}
          {catScreenPoint ? `${catScreenPoint.x.toFixed(1)}, ${catScreenPoint.y.toFixed(1)}` : 'none'}
        </span>
        <span>
          Cat collision screen:{' '}
          {catScreenCollisionRect
            ? `${catScreenCollisionRect.left.toFixed(1)}, ${catScreenCollisionRect.top.toFixed(1)} -> ${catScreenCollisionRect.right.toFixed(1)}, ${catScreenCollisionRect.bottom.toFixed(1)}`
            : 'none'}
        </span>
        {currentEatRenderPosition ? (
          <>
            <span>
              Eat render: {currentEatRenderPosition.renderPosition.x.toFixed(1)}, {' '}
              {currentEatRenderPosition.renderPosition.y.toFixed(1)}
            </span>
            <span>Eat scale: {currentEatRenderPosition.eatCatScale.toFixed(2)}</span>
          </>
        ) : null}
        <span>Eating target: {behavior.currentInteractionInstanceId ?? 'none'}</span>
        {furnitureDragDebug ? (
          <>
            <span>Drag item: {furnitureDragDebug.itemId}</span>
            <span>
              Drag original: {furnitureDragDebug.originalPosition.x.toFixed(1)}, {' '}
              {furnitureDragDebug.originalPosition.y.toFixed(1)}
            </span>
            <span>
              Drag preview: {furnitureDragDebug.previewPosition.x.toFixed(1)}, {' '}
              {furnitureDragDebug.previewPosition.y.toFixed(1)}
            </span>
            <span>
              Drag offset: {furnitureDragDebug.pointerOffset.x.toFixed(1)}, {' '}
              {furnitureDragDebug.pointerOffset.y.toFixed(1)}
            </span>
          </>
        ) : null}
        {furnitureDebugItems.some(({ furniture }) => furniture.id === 'food-bowl') ? (
          <>
            {furnitureDebugItems
              .filter(({ furniture }) => furniture.id === 'food-bowl')
              .map(
                ({
                  furniture,
                  interactionPoint,
                  restPosition,
                  eatPosition,
                  placedItem,
                  collisionRect,
                  screenAnchor,
                  screenCollisionRect,
                  screenInteractionPoint,
                }) => (
                  <span key={placedItem.instanceId}>
                    Food bowl state: {getPlacedFurnitureFoodState(placedItem)} {' '}
                    | Floor anchor: {placedItem.placement.x.toFixed(1)}, {placedItem.placement.y.toFixed(1)} {' '}
                    | Rendered anchor: {screenAnchor ? `${screenAnchor.x.toFixed(1)}, ${screenAnchor.y.toFixed(1)}` : 'none'} {' '}
                    | Collision: {collisionRect
                      ? `${collisionRect.left.toFixed(1)}, ${collisionRect.top.toFixed(1)} -> ${collisionRect.right.toFixed(1)}, ${collisionRect.bottom.toFixed(1)}`
                      : 'none'}{' '}
                    | Collision screen: {screenCollisionRect
                      ? `${screenCollisionRect.left.toFixed(1)}, ${screenCollisionRect.top.toFixed(1)} -> ${screenCollisionRect.right.toFixed(1)}, ${screenCollisionRect.bottom.toFixed(1)}`
                      : 'none'}{' '}
                    | Interaction: {interactionPoint ? `${interactionPoint.x.toFixed(1)}, ${interactionPoint.y.toFixed(1)}` : 'none'}{' '}
                    | Interaction screen: {screenInteractionPoint ? `${screenInteractionPoint.x.toFixed(1)}, ${screenInteractionPoint.y.toFixed(1)}` : 'none'}{' '}
                    | Range: {furniture.interaction?.range ?? 0}{' '}
                    | Eat cat: {eatPosition ? `${eatPosition.catStandPosition.x.toFixed(1)}, ${eatPosition.catStandPosition.y.toFixed(1)}` : 'none'}{' '}
                    | Eat mouth: {eatPosition ? `${eatPosition.mouthPosition.x.toFixed(1)}, ${eatPosition.mouthPosition.y.toFixed(1)}` : 'none'}{' '}
                    | Rest target: {restPosition ? `${restPosition.catPosition.x.toFixed(1)}, ${restPosition.catPosition.y.toFixed(1)}` : 'none'}
                  </span>
                ),
              )}
          </>
        ) : null}
      </div>
    </div>
  );
}
