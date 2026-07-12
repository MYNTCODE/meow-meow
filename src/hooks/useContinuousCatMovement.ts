import { useEffect, useRef } from 'react';
import type { CatBehaviorSnapshot, CatPressedKeys } from '../types/catBehavior';
import { roomWalkableArea } from '../data/roomMovementConfig';
import type { Cat, PlacedFurniture } from '../types/game';
import {
  canMoveToPosition,
  clampPositionToRoomBounds,
} from '../utils/collision';

export const CAT_MOVE_SPEED = 18;

function getMovementVector(pressedKeys: CatPressedKeys) {
  const x = Number(pressedKeys.rightPressed) - Number(pressedKeys.leftPressed);
  const y = Number(pressedKeys.downPressed) - Number(pressedKeys.upPressed);
  const magnitude = Math.hypot(x, y);

  if (magnitude === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: x / magnitude,
    y: y / magnitude,
  };
}

interface UseContinuousCatMovementOptions {
  pressedKeys: CatPressedKeys;
  behavior: CatBehaviorSnapshot;
  setBehavior: React.Dispatch<React.SetStateAction<CatBehaviorSnapshot>>;
  cat: Cat;
  placedFurniture: PlacedFurniture[];
  setMovementBlocked: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useContinuousCatMovement({
  pressedKeys,
  behavior,
  setBehavior,
  cat,
  placedFurniture,
  setMovementBlocked,
}: UseContinuousCatMovementOptions) {
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastFrameTimeRef = useRef<number | undefined>(undefined);
  const behaviorRef = useRef(behavior);
  const pressedKeysRef = useRef(pressedKeys);
  const placedFurnitureRef = useRef(placedFurniture);

  useEffect(() => {
    behaviorRef.current = behavior;
  }, [behavior]);

  useEffect(() => {
    pressedKeysRef.current = pressedKeys;
  }, [pressedKeys]);

  useEffect(() => {
    placedFurnitureRef.current = placedFurniture;
  }, [placedFurniture]);

  useEffect(() => {
    function cancelMovementFrame() {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }

      lastFrameTimeRef.current = undefined;
    }

    const shouldMove =
      behavior.state !== 'resting' &&
      (pressedKeys.leftPressed !== pressedKeys.rightPressed ||
        pressedKeys.upPressed !== pressedKeys.downPressed);

    if (!shouldMove) {
      cancelMovementFrame();

      if (behavior.state === 'walking') {
        setBehavior((currentBehavior) => ({
          ...currentBehavior,
          state: 'idle',
          currentInteractionItemId: undefined,
        }));
      }

      setMovementBlocked(false);

      return cancelMovementFrame;
    }

    if (animationFrameRef.current) {
      return cancelMovementFrame;
    }

    function moveCat(frameTime: number) {
      const currentKeys = pressedKeysRef.current;
      const currentBehavior = behaviorRef.current;
      const movementVector = getMovementVector(currentKeys);
      const isMoving = movementVector.x !== 0 || movementVector.y !== 0;

      if (currentBehavior.state === 'resting' || !isMoving) {
        cancelMovementFrame();
        setBehavior((latestBehavior) =>
          latestBehavior.state === 'walking'
            ? {
                ...latestBehavior,
                state: 'idle',
                currentInteractionItemId: undefined,
              }
            : latestBehavior,
        );
        setMovementBlocked(false);
        return;
      }

      const lastFrameTime = lastFrameTimeRef.current ?? frameTime;
      const deltaSeconds = (frameTime - lastFrameTime) / 1000;
      const proposedXPosition = clampPositionToRoomBounds(
        {
          x: currentBehavior.x + movementVector.x * CAT_MOVE_SPEED * deltaSeconds,
          y: currentBehavior.y,
        },
        roomWalkableArea,
      );
      const canMoveX = canMoveToPosition({
        cat,
        position: proposedXPosition,
        placedFurniture: placedFurnitureRef.current,
      });
      const x = canMoveX ? proposedXPosition.x : currentBehavior.x;
      const proposedYPosition = clampPositionToRoomBounds(
        {
          x,
          y: currentBehavior.y + movementVector.y * CAT_MOVE_SPEED * deltaSeconds,
        },
        roomWalkableArea,
      );
      const canMoveY = canMoveToPosition({
        cat,
        position: proposedYPosition,
        placedFurniture: placedFurnitureRef.current,
      });
      const y = canMoveY ? proposedYPosition.y : currentBehavior.y;
      const isBlocked = (!canMoveX && movementVector.x !== 0) || (!canMoveY && movementVector.y !== 0);

      lastFrameTimeRef.current = frameTime;
      setBehavior((currentSnapshot) => ({
        ...currentSnapshot,
        state: 'walking',
        x,
        y,
        facingDirection:
          movementVector.x < 0
            ? 'left'
            : movementVector.x > 0
              ? 'right'
              : currentSnapshot.facingDirection,
        currentInteractionItemId: undefined,
      }));
      setMovementBlocked(isBlocked);

      animationFrameRef.current = window.requestAnimationFrame(moveCat);
    }

    animationFrameRef.current = window.requestAnimationFrame(moveCat);

    return cancelMovementFrame;
  }, [
    behavior.state,
    cat,
    pressedKeys.leftPressed,
    pressedKeys.downPressed,
    pressedKeys.rightPressed,
    pressedKeys.upPressed,
    setBehavior,
    setMovementBlocked,
  ]);
}
