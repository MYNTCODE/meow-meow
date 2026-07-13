import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch } from 'react';
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
import type { GameAction } from '../store/gameReducer';
import {
  canMoveToPosition,
  clampPositionToRoomBounds,
  findNearestValidPosition,
  type NearbyInteraction,
  findNearbyInteractionOfType,
  getEatInteractionPosition,
  getRestInteractionPosition,
  getPlacedFurnitureFoodState,
} from '../utils/collision';
import { useContinuousCatMovement } from './useContinuousCatMovement';
import { useCatInputControls } from './useCatInputControls';

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
  dispatch: Dispatch<GameAction>,
  inputDisabled = false,
) {
  const [snapshot, setSnapshot] = useState<CatBehaviorSnapshot>(getInitialSnapshot);
  const [movementBlocked, setMovementBlocked] = useState(false);
  const [interactionFeedback, setInteractionFeedback] = useState<string | undefined>();
  const nearestRestInteraction = useMemo(
    () => findNearbyInteractionOfType({
      interactionType: 'rest',
      position: snapshot,
      placedFurniture,
    }),
    [placedFurniture, snapshot],
  );
  const nearestEatInteraction = useMemo(
    () => findNearbyInteractionOfType({
      interactionType: 'eat',
      position: snapshot,
      placedFurniture,
    }),
    [placedFurniture, snapshot],
  );
  const canInteract = Boolean(
    snapshot.state === 'eating' ||
      (snapshot.state === 'idle' && (nearestRestInteraction || nearestEatInteraction)),
  );
  const canSit = Boolean(snapshot.state === 'idle' && nearestRestInteraction);
  const canStand = snapshot.state === 'resting';
  const eatingTimerRef = useRef<number | undefined>(undefined);
  const feedbackTimerRef = useRef<number | undefined>(undefined);
  const currentEatingTargetRef = useRef<NearbyInteraction | undefined>(undefined);
  const placedFurnitureRef = useRef(placedFurniture);
  const clearMovementInputRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    placedFurnitureRef.current = placedFurniture;
  }, [placedFurniture]);

  function clearEatingTimer() {
    if (eatingTimerRef.current !== undefined) {
      window.clearTimeout(eatingTimerRef.current);
      eatingTimerRef.current = undefined;
    }
  }

  function clearFeedbackTimer() {
    if (feedbackTimerRef.current !== undefined) {
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = undefined;
    }
  }

  function clearMovementInput() {
    clearMovementInputRef.current?.();
  }

  const endEating = useCallback(
    (shouldConsumeFood: boolean) => {
      const currentTarget = currentEatingTargetRef.current;

      clearEatingTimer();

      if (shouldConsumeFood && currentTarget?.placedItem.instanceId) {
        dispatch({
          type: 'setPlacedFurnitureLayout',
          placedFurniture: placedFurnitureRef.current.map((item) =>
            item.instanceId === currentTarget.placedItem.instanceId
              ? {
                  ...item,
                  interactionState: {
                    foodState: 'empty',
                  },
                }
              : item,
          ),
        });
      }

      currentEatingTargetRef.current = undefined;
      clearFeedbackTimer();
      setInteractionFeedback(undefined);

      setSnapshot((currentSnapshot) => ({
        ...currentSnapshot,
        state: 'idle',
        currentInteractionItemId: undefined,
        currentInteractionInstanceId: undefined,
        currentInteractionType: undefined,
        lastInteractionItemId: shouldConsumeFood ? currentTarget?.placedItem.furnitureId : undefined,
        lastInteractionInstanceId: shouldConsumeFood
          ? currentTarget?.placedItem.instanceId
          : undefined,
        lastInteractionType: shouldConsumeFood ? 'eat' : undefined,
      }));
      clearMovementInput();
    },
    [dispatch, placedFurnitureRef],
  );

  const cancelEating = useCallback(() => {
    endEating(false);
  }, [endEating]);

  const showFoodBowlRefilledFeedback = useCallback(() => {
    clearFeedbackTimer();
    setInteractionFeedback('Food bowl refilled');
    feedbackTimerRef.current = window.setTimeout(() => {
      setInteractionFeedback(undefined);
      feedbackTimerRef.current = undefined;
    }, 1500);
  }, []);

  const sit = useCallback(() => {
    if (!nearestRestInteraction) {
      return;
    }
    clearFeedbackTimer();
    setInteractionFeedback(undefined);

    setSnapshot((currentSnapshot) => {
      if (currentSnapshot.state !== 'idle') {
        return currentSnapshot;
      }

      const restTarget = getRestInteractionPosition(nearestRestInteraction.placedItem);

      if (!restTarget) {
        return currentSnapshot;
      }

      return {
        ...currentSnapshot,
        state: 'resting',
        x: restTarget.catPosition.x,
        y: restTarget.catPosition.y,
        facingDirection: restTarget.facingDirection,
        currentPointId: restTarget.point.id,
        currentInteractionItemId: nearestRestInteraction.placedItem.furnitureId,
        currentInteractionInstanceId: nearestRestInteraction.placedItem.instanceId,
        currentInteractionType: 'rest',
        lastInteractionItemId: undefined,
        lastInteractionInstanceId: undefined,
        lastInteractionType: undefined,
      };
    });
  }, [nearestRestInteraction]);

  const stand = useCallback(() => {
    clearFeedbackTimer();
    setInteractionFeedback(undefined);

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
        currentInteractionInstanceId: undefined,
        currentInteractionType: undefined,
        lastInteractionItemId: undefined,
        lastInteractionInstanceId: undefined,
        lastInteractionType: undefined,
      };
    });
  }, [cat, placedFurniture]);

  const interactNearest = useCallback(() => {
    if (snapshot.state === 'resting') {
      stand();
      return;
    }

    if (snapshot.state === 'eating') {
      cancelEating();
      return;
    }

    if (snapshot.state !== 'idle') {
      return;
    }

    const nearestInteraction =
      nearestRestInteraction && nearestEatInteraction
        ? nearestRestInteraction.distance <= nearestEatInteraction.distance
          ? nearestRestInteraction
          : nearestEatInteraction
        : nearestRestInteraction ?? nearestEatInteraction;

    if (!nearestInteraction) {
      return;
    }

    if (nearestInteraction.furniture.interaction?.type === 'rest') {
      sit();
      return;
    }

    if (getPlacedFurnitureFoodState(nearestInteraction.placedItem) === 'empty') {
      dispatch({
        type: 'setPlacedFurnitureLayout',
        placedFurniture: placedFurnitureRef.current.map((item) =>
          item.instanceId === nearestInteraction.placedItem.instanceId
            ? {
                ...item,
                interactionState: {
                  foodState: 'full',
                },
              }
            : item,
        ),
      });
      currentEatingTargetRef.current = undefined;
      clearEatingTimer();
      clearFeedbackTimer();
      setInteractionFeedback(undefined);
      showFoodBowlRefilledFeedback();
      return;
    }

    const eatTarget = getEatInteractionPosition(nearestInteraction.placedItem);

    if (!eatTarget) {
      return;
    }

    currentEatingTargetRef.current = nearestInteraction;

    clearEatingTimer();
    clearFeedbackTimer();
    setInteractionFeedback(undefined);
    setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      state: 'eating',
      x: eatTarget.catStandPosition.x,
      y: eatTarget.catStandPosition.y,
      facingDirection: eatTarget.facingDirection,
      currentPointId: eatTarget.bowlAnchorPoint.id,
      currentInteractionItemId: nearestInteraction.placedItem.furnitureId,
      currentInteractionInstanceId: nearestInteraction.placedItem.instanceId,
      currentInteractionType: 'eat',
      lastInteractionItemId: undefined,
      lastInteractionInstanceId: undefined,
      lastInteractionType: undefined,
    }));
    clearMovementInput();
    eatingTimerRef.current = window.setTimeout(() => {
      endEating(true);
    }, 3000);
  }, [
    cancelEating,
    endEating,
    nearestEatInteraction,
    nearestRestInteraction,
    sit,
    snapshot.state,
    stand,
    showFoodBowlRefilledFeedback,
  ]);

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
  const { directionInput, clearMovementInput: clearMovementInputFromControls, touchControls } = useCatInputControls({
    commands,
    commandState,
    disabled: inputDisabled,
  });
  useEffect(() => {
    clearMovementInputRef.current = clearMovementInputFromControls;
  }, [clearMovementInputFromControls]);

  useContinuousCatMovement({
    directionInput,
    behavior: snapshot,
    setBehavior: setSnapshot,
    cat,
    placedFurniture,
    setMovementBlocked,
    disabled: inputDisabled,
  });

  useEffect(
    () => () => {
      clearEatingTimer();
      clearFeedbackTimer();
      currentEatingTargetRef.current = undefined;
    },
    [],
  );

  return {
    catBehavior: snapshot,
    movementPoints: catMovementPoints,
    commands,
    commandState,
    movementBlocked,
    interactionFeedback,
    touchControls,
  };
}
