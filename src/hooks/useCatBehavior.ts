import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch } from 'react';
import {
  DEFAULT_CAT_MOVEMENT_POINT_ID,
  catMovementPoints,
  getCatMovementPoint,
} from '../data/catMovementPoints';
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
  findNearbyInteraction,
  getEatInteractionPosition,
  getPlayInteractionPosition,
  getRestInteractionPosition,
  getPlacedFurnitureFoodState,
} from '../utils/collision';
import { useContinuousCatMovement } from './useContinuousCatMovement';
import { useCatInputControls } from './useCatInputControls';
import { PLAY_FRAME_DURATION_MS, type PlayFrameIndex } from '../features/cat/playAnimation';

const EAT_DURATION_MS = 3000;
const PLAY_DURATION_MS = 3000;
const FEEDBACK_DURATION_MS = 1500;

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
  const [playFrameIndex, setPlayFrameIndex] = useState<PlayFrameIndex>(0);
  const nearestInteraction = useMemo(
    () => findNearbyInteraction({ position: snapshot, placedFurniture }),
    [placedFurniture, snapshot],
  );
  const canInteract = Boolean(
    snapshot.state === 'eating' ||
      snapshot.state === 'playing' ||
      (snapshot.state === 'idle' && nearestInteraction),
  );
  const canSit = Boolean(
    snapshot.state === 'idle' && nearestInteraction?.furniture.interaction?.type === 'rest',
  );
  const canStand = snapshot.state === 'resting';
  const interactionTimerRef = useRef<number | undefined>(undefined);
  const feedbackTimerRef = useRef<number | undefined>(undefined);
  const currentTimedInteractionRef = useRef<typeof nearestInteraction | undefined>(undefined);
  const placedFurnitureRef = useRef(placedFurniture);
  const clearMovementInputRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    placedFurnitureRef.current = placedFurniture;
  }, [placedFurniture]);

  useEffect(() => {
    if (snapshot.state !== 'playing') {
      setPlayFrameIndex(0);
      return undefined;
    }

    setPlayFrameIndex(0);

    const intervalId = window.setInterval(() => {
      setPlayFrameIndex((currentFrame) => (currentFrame === 0 ? 1 : 0));
    }, PLAY_FRAME_DURATION_MS);

    return () => window.clearInterval(intervalId);
  }, [snapshot.state]);

  function clearInteractionTimer() {
    if (interactionTimerRef.current !== undefined) {
      window.clearTimeout(interactionTimerRef.current);
      interactionTimerRef.current = undefined;
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

  const finishTimedInteraction = useCallback(
    ({
      consumeFood,
      preserveLastInteraction,
    }: {
      consumeFood: boolean;
      preserveLastInteraction: boolean;
    }) => {
      const currentTarget = currentTimedInteractionRef.current;

      clearInteractionTimer();

      if (consumeFood && currentTarget?.placedItem.instanceId) {
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

      currentTimedInteractionRef.current = undefined;
      clearFeedbackTimer();
      setInteractionFeedback(undefined);

      setSnapshot((currentSnapshot) => ({
        ...currentSnapshot,
        state: 'idle',
        currentInteractionItemId: undefined,
        currentInteractionInstanceId: undefined,
        currentInteractionType: undefined,
        lastInteractionItemId: preserveLastInteraction ? currentTarget?.placedItem.furnitureId : undefined,
        lastInteractionInstanceId: preserveLastInteraction
          ? currentTarget?.placedItem.instanceId
          : undefined,
        lastInteractionType: preserveLastInteraction
          ? currentTarget?.furniture.interaction?.type
          : undefined,
      }));
      clearMovementInput();
    },
    [dispatch, placedFurnitureRef],
  );

  const cancelEating = useCallback(() => {
    finishTimedInteraction({ consumeFood: false, preserveLastInteraction: false });
  }, [finishTimedInteraction]);

  const cancelPlaying = useCallback(() => {
    finishTimedInteraction({ consumeFood: false, preserveLastInteraction: false });
  }, [finishTimedInteraction]);

  const showFoodBowlRefilledFeedback = useCallback(() => {
    clearFeedbackTimer();
    setInteractionFeedback('Food bowl refilled');
    feedbackTimerRef.current = window.setTimeout(() => {
      setInteractionFeedback(undefined);
      feedbackTimerRef.current = undefined;
    }, FEEDBACK_DURATION_MS);
  }, []);

  const sit = useCallback(() => {
    if (nearestInteraction?.furniture.interaction?.type !== 'rest') {
      return;
    }
    clearFeedbackTimer();
    setInteractionFeedback(undefined);

    setSnapshot((currentSnapshot) => {
      if (currentSnapshot.state !== 'idle') {
        return currentSnapshot;
      }

      const restTarget = getRestInteractionPosition(nearestInteraction.placedItem);

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
        currentInteractionItemId: nearestInteraction.placedItem.furnitureId,
        currentInteractionInstanceId: nearestInteraction.placedItem.instanceId,
        currentInteractionType: 'rest',
        lastInteractionItemId: undefined,
        lastInteractionInstanceId: undefined,
        lastInteractionType: undefined,
      };
    });
  }, [nearestInteraction]);

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

    if (snapshot.state === 'playing') {
      cancelPlaying();
      return;
    }

    if (snapshot.state !== 'idle') {
      return;
    }

    if (!nearestInteraction) {
      return;
    }

    switch (nearestInteraction.furniture.interaction?.type) {
      case 'rest':
        sit();
        return;

      case 'eat': {
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
          currentTimedInteractionRef.current = undefined;
          clearInteractionTimer();
          clearFeedbackTimer();
          setInteractionFeedback(undefined);
          showFoodBowlRefilledFeedback();
          return;
        }

        const eatTarget = getEatInteractionPosition(nearestInteraction.placedItem);

        if (!eatTarget) {
          return;
        }

        currentTimedInteractionRef.current = nearestInteraction;
        clearInteractionTimer();
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
        interactionTimerRef.current = window.setTimeout(() => {
          finishTimedInteraction({ consumeFood: true, preserveLastInteraction: true });
        }, EAT_DURATION_MS);
        return;
      }

      case 'play': {
        const playTarget = getPlayInteractionPosition(nearestInteraction.placedItem);

        if (!playTarget) {
          return;
        }

        currentTimedInteractionRef.current = nearestInteraction;
        clearInteractionTimer();
        clearFeedbackTimer();
        setInteractionFeedback(undefined);
        setSnapshot((currentSnapshot) => ({
          ...currentSnapshot,
          state: 'playing',
          x: playTarget.catPosition.x,
          y: playTarget.catPosition.y,
          facingDirection: playTarget.facingDirection,
          currentPointId: playTarget.toyAnchorPoint.id,
          currentInteractionItemId: nearestInteraction.placedItem.furnitureId,
          currentInteractionInstanceId: nearestInteraction.placedItem.instanceId,
          currentInteractionType: 'play',
          lastInteractionItemId: undefined,
          lastInteractionInstanceId: undefined,
          lastInteractionType: undefined,
        }));
        clearMovementInput();
        interactionTimerRef.current = window.setTimeout(() => {
          finishTimedInteraction({ consumeFood: false, preserveLastInteraction: false });
        }, PLAY_DURATION_MS);
        return;
      }

      default:
        return;
    }
  }, [
    cancelEating,
    cancelPlaying,
    finishTimedInteraction,
    nearestInteraction,
    sit,
    snapshot.state,
    stand,
    showFoodBowlRefilledFeedback,
    dispatch,
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
      clearInteractionTimer();
      clearFeedbackTimer();
      currentTimedInteractionRef.current = undefined;
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
    playFrameIndex,
    touchControls,
  };
}
