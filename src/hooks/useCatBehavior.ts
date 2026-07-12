import { useCallback, useMemo, useState } from 'react';
import {
  DEFAULT_CAT_MOVEMENT_POINT_ID,
  catMovementPoints,
  getCatMovementPoint,
} from '../data/catMovementPoints';
import { getFurnitureItem } from '../data/furniture';
import { roomWalkableArea } from '../data/roomMovementConfig';
import type {
  CatBehaviorCommands,
  CatBehaviorSnapshot,
  CatCommandState,
} from '../types/catBehavior';
import type { Cat, PlacedFurniture } from '../types/game';
import {
  canMoveToPosition,
  clampPositionToRoomBounds,
  findNearestValidPosition,
  findNearbyInteraction,
} from '../utils/collision';
import { useContinuousCatMovement } from './useContinuousCatMovement';
import { useCatKeyboardControls } from './useCatKeyboardControls';

function getInitialSnapshot(): CatBehaviorSnapshot {
  const defaultPoint = getCatMovementPoint(DEFAULT_CAT_MOVEMENT_POINT_ID) ?? catMovementPoints[0];

  return {
    state: 'idle',
    x: defaultPoint.x,
    y: defaultPoint.y,
    facingDirection: defaultPoint.facingDirection,
    currentPointId: defaultPoint.id,
  };
}

function getFurniturePoint(placedItem: PlacedFurniture) {
  return catMovementPoints.find((point) => point.furnitureSlotId === placedItem.positionId);
}

function getFloorPointForInteractionPoint(pointId: string) {
  const interactionPoint = getCatMovementPoint(pointId);

  if (!interactionPoint?.furnitureSlotId) {
    return undefined;
  }

  return getCatMovementPoint(interactionPoint.furnitureSlotId);
}

export function useCatBehavior(
  cat: Cat,
  placedFurniture: PlacedFurniture[],
  inputDisabled = false,
) {
  const [snapshot, setSnapshot] = useState<CatBehaviorSnapshot>(getInitialSnapshot);
  const [movementBlocked, setMovementBlocked] = useState(false);
  const nearestInteractableFurniture = useMemo(
    () => findNearbyInteraction({ position: snapshot, placedFurniture }),
    [placedFurniture, snapshot],
  );
  const canInteract = Boolean(
    snapshot.state === 'idle' && nearestInteractableFurniture,
  );
  const canSit = canInteract;
  const canStand = snapshot.state === 'resting';

  const sit = useCallback(() => {
    if (!nearestInteractableFurniture) {
      return;
    }

    const furniture = getFurnitureItem(nearestInteractableFurniture.placedItem.furnitureId);

    setSnapshot((currentSnapshot) => {
      if (currentSnapshot.state !== 'idle') {
        return currentSnapshot;
      }

      return {
        ...currentSnapshot,
        state: 'resting',
        x: nearestInteractableFurniture.point.x,
        y: nearestInteractableFurniture.point.y,
        facingDirection:
          furniture?.interaction?.catFacingDirection ?? currentSnapshot.facingDirection,
        currentPointId: nearestInteractableFurniture.point.id,
        currentInteractionItemId: nearestInteractableFurniture.placedItem.furnitureId,
      };
    });
  }, [nearestInteractableFurniture]);

  const stand = useCallback(() => {
    setSnapshot((currentSnapshot) => {
      if (currentSnapshot.state !== 'resting') {
        return currentSnapshot;
      }

      const floorPoint = getFloorPointForInteractionPoint(currentSnapshot.currentPointId);
      const fallbackPosition = clampPositionToRoomBounds(
        {
          x: floorPoint?.x ?? currentSnapshot.x,
          y: floorPoint?.y ?? currentSnapshot.y,
        },
        roomWalkableArea,
      );
      const safePosition = canMoveToPosition({
        cat,
        position: fallbackPosition,
        placedFurniture,
      })
        ? fallbackPosition
        : findNearestValidPosition({
            cat,
            origin: fallbackPosition,
            placedFurniture,
            bounds: roomWalkableArea,
          }) ?? clampPositionToRoomBounds(currentSnapshot, roomWalkableArea);

      return {
        ...currentSnapshot,
        state: 'idle',
        x: safePosition.x,
        y: safePosition.y,
        currentPointId: floorPoint?.id ?? currentSnapshot.currentPointId,
        currentInteractionItemId: undefined,
      };
    });
  }, [cat, placedFurniture]);

  const interactNearest = useCallback(() => {
    if (snapshot.state === 'resting') {
      stand();
      return;
    }

    if (snapshot.state !== 'idle') {
      return;
    }

    sit();
  }, [sit, snapshot.state, stand]);

  const commands: CatBehaviorCommands = {
    interactNearest,
    sit,
    stand,
  };
  const commandState: CatCommandState = {
    canInteract,
    canSit,
    canStand,
    isWalking: snapshot.state === 'walking',
  };
  const pressedKeys = useCatKeyboardControls({ commands, commandState, disabled: inputDisabled });

  useContinuousCatMovement({
    pressedKeys,
    behavior: snapshot,
    setBehavior: setSnapshot,
    cat,
    placedFurniture,
    setMovementBlocked,
    disabled: inputDisabled,
  });

  return {
    catBehavior: snapshot,
    movementPoints: catMovementPoints,
    commands,
    commandState,
    movementBlocked,
  };
}
