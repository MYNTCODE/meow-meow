import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type SetStateAction,
} from 'react';
import { getFurnitureItem } from '../data/furniture';
import { getRoomPlacementAnchors } from '../data/roomSlots';
import type { FurniturePlacement, PlacedFurniture } from '../types/game';
import { pointerToRoomCoordinates } from '../utils/furnitureDrag';

type DragPosition = {
  x: number;
  y: number;
};

type PlacementResolution =
  | {
      status: 'snapped';
      anchorId: string;
      nearestAnchorId: string;
      position: DragPosition;
    }
  | {
      status: 'nearest';
      anchorId: string;
      nearestAnchorId: string;
      position: DragPosition;
    }
  | {
      status: 'invalid';
      reason: 'no-compatible-anchor' | 'all-occupied' | 'outside-room';
    };

type FurnitureDragState = {
  activeAnchorId: string | null;
  itemId: string;
  nearestAnchorId: string | null;
  pointerId: number;
  originalPosition: DragPosition;
  previewPosition: DragPosition;
  pointerOffset: DragPosition;
};

export interface FurnitureDragGhostPreview {
  anchorId: string;
  placement: DragPosition;
  state: 'default' | 'nearest' | 'active';
}

export interface FurnitureDragBindings {
  placement: FurniturePlacement;
  activeAnchorId?: string;
  nearestAnchorId?: string;
  isDragging: boolean;
  isEditable: boolean;
  isNoSpaceAvailable: boolean;
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
}

export interface FurnitureDragDebugState {
  itemId: string;
  originalPosition: DragPosition;
  previewPosition: DragPosition;
  pointerOffset: DragPosition;
}

interface UseFurnitureDragOptions {
  enabled: boolean;
  placedFurniture: PlacedFurniture[];
  roomRef: RefObject<HTMLElement | null>;
  setPlacedFurniture: Dispatch<SetStateAction<PlacedFurniture[]>>;
}

const SNAP_ENTER_RADIUS = 8;
const SNAP_EXIT_RADIUS = 12;
const SNAP_SWITCH_BIAS = 2;

function isPrimaryPointer(event: ReactPointerEvent<HTMLDivElement>) {
  return event.button === 0 || event.pointerType === 'touch';
}

function toPlacement(basePlacement: FurniturePlacement, position: DragPosition) {
  return {
    ...basePlacement,
    x: position.x,
    y: position.y,
  };
}

function isOutsideRoomBounds(position: DragPosition) {
  return position.x < 0 || position.x > 100 || position.y < 0 || position.y > 100;
}

function findMatchingAnchorId(placedItem: PlacedFurniture) {
  return (
    getRoomPlacementAnchors(placedItem.positionId).find(
      (anchor) =>
        Math.abs(anchor.x - placedItem.placement.x) < 0.1 &&
        Math.abs(anchor.y - placedItem.placement.y) < 0.1,
    )?.id ?? null
  );
}

function getAvailableAnchors(item: PlacedFurniture, placedItems: PlacedFurniture[]) {
  const furniture = getFurnitureItem(item.furnitureId);

  if (!furniture) {
    return { availableAnchors: [], invalidReason: 'no-compatible-anchor' as const };
  }

  const anchors = getRoomPlacementAnchors(furniture.slot);

  if (anchors.length === 0) {
    return { availableAnchors: [], invalidReason: 'no-compatible-anchor' as const };
  }

  const occupiedAnchorIds = new Set(
    placedItems
      .filter((placedItem) => placedItem.instanceId !== item.instanceId && placedItem.positionId === item.positionId)
      .flatMap((placedItem) => {
        const matchedAnchorId = findMatchingAnchorId(placedItem);
        return matchedAnchorId ? [matchedAnchorId] : [];
      }),
  );

  const availableAnchors = anchors.filter((anchor) => !occupiedAnchorIds.has(anchor.id));

  return {
    availableAnchors,
    invalidReason: availableAnchors.length === 0 ? ('all-occupied' as const) : null,
  };
}

function resolveFurnitureDrop({
  activeAnchorId,
  item,
  placedItems,
  pointerPosition,
}: {
  activeAnchorId: string | null;
  item: PlacedFurniture;
  placedItems: PlacedFurniture[];
  pointerPosition: DragPosition;
}): PlacementResolution {
  if (isOutsideRoomBounds(pointerPosition)) {
    return {
      status: 'invalid',
      reason: 'outside-room',
    };
  }

  const { availableAnchors, invalidReason } = getAvailableAnchors(item, placedItems);

  if (availableAnchors.length === 0) {
    return {
      status: 'invalid',
      reason: invalidReason ?? 'no-compatible-anchor',
    };
  }

  const nearestAnchor = availableAnchors.reduce<{
    id: string;
    x: number;
    y: number;
    distance: number;
  } | null>((best, anchor) => {
    const distance = Math.hypot(pointerPosition.x - anchor.x, pointerPosition.y - anchor.y);

    if (!best || distance < best.distance) {
      return {
        id: anchor.id,
        x: anchor.x,
        y: anchor.y,
        distance,
      };
    }

    return best;
  }, null);

  if (!nearestAnchor) {
    return {
      status: 'invalid',
      reason: 'no-compatible-anchor',
    };
  }

  const activeAnchor = activeAnchorId
    ? availableAnchors.find((anchor) => anchor.id === activeAnchorId) ?? null
    : null;

  if (activeAnchor) {
    const activeDistance = Math.hypot(pointerPosition.x - activeAnchor.x, pointerPosition.y - activeAnchor.y);

    if (activeDistance <= SNAP_EXIT_RADIUS) {
      return {
        status: 'snapped',
        anchorId: activeAnchor.id,
        nearestAnchorId: nearestAnchor.id,
        position: {
          x: activeAnchor.x,
          y: activeAnchor.y,
        },
      };
    }
  }

  if (nearestAnchor.distance <= SNAP_ENTER_RADIUS) {
    if (
      activeAnchor &&
      nearestAnchor.id !== activeAnchor.id
    ) {
      const activeDistance = Math.hypot(pointerPosition.x - activeAnchor.x, pointerPosition.y - activeAnchor.y);

      if (nearestAnchor.distance + SNAP_SWITCH_BIAS >= activeDistance) {
        return {
          status: 'nearest',
          anchorId: activeAnchor.id,
          nearestAnchorId: nearestAnchor.id,
          position: {
            x: activeAnchor.x,
            y: activeAnchor.y,
          },
        };
      }
    }

    return {
      status: 'snapped',
      anchorId: nearestAnchor.id,
      nearestAnchorId: nearestAnchor.id,
      position: {
        x: nearestAnchor.x,
        y: nearestAnchor.y,
      },
    };
  }

  return {
    status: 'nearest',
    anchorId: nearestAnchor.id,
    nearestAnchorId: nearestAnchor.id,
    position: {
      x: nearestAnchor.x,
      y: nearestAnchor.y,
    },
  };
}

export function useFurnitureDrag({
  enabled,
  placedFurniture,
  roomRef,
  setPlacedFurniture,
}: UseFurnitureDragOptions) {
  const dragStateRef = useRef<FurnitureDragState | null>(null);
  const dragTargetRef = useRef<HTMLDivElement | null>(null);
  const windowCleanupRef = useRef<(() => void) | null>(null);

  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [activeAnchorId, setActiveAnchorId] = useState<string | null>(null);
  const [nearestAnchorId, setNearestAnchorId] = useState<string | null>(null);
  const [debugState, setDebugState] = useState<FurnitureDragDebugState | null>(null);
  const [isNoSpaceAvailable, setIsNoSpaceAvailable] = useState(false);

  const clearWindowListeners = useCallback(() => {
    windowCleanupRef.current?.();
    windowCleanupRef.current = null;
  }, []);

  const clearDragState = useCallback(() => {
    clearWindowListeners();

    const currentDragTarget = dragTargetRef.current;
    const currentDragState = dragStateRef.current;

    if (
      currentDragTarget &&
      currentDragState &&
      currentDragTarget.hasPointerCapture(currentDragState.pointerId)
    ) {
      currentDragTarget.releasePointerCapture(currentDragState.pointerId);
    }

    dragTargetRef.current = null;
    dragStateRef.current = null;
    setActiveItemId(null);
    setActiveAnchorId(null);
    setNearestAnchorId(null);
    setIsNoSpaceAvailable(false);

    if (import.meta.env.DEV) {
      setDebugState(null);
    }
  }, [clearWindowListeners]);

  useEffect(() => {
    if (!enabled) {
      clearDragState();
    }
  }, [clearDragState, enabled]);

  useEffect(() => clearDragState, [clearDragState]);

  const updateDebugState = useCallback((dragState: FurnitureDragState) => {
    if (!import.meta.env.DEV) {
      return;
    }

    setDebugState({
      itemId: dragState.itemId,
      originalPosition: dragState.originalPosition,
      previewPosition: dragState.previewPosition,
      pointerOffset: dragState.pointerOffset,
    });
  }, []);

  const handlePointerMove = useCallback(
    (event: globalThis.PointerEvent) => {
      const dragState = dragStateRef.current;

      if (!enabled || !dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      event.preventDefault();

      const roomElement = roomRef.current;

      if (!roomElement) {
        return;
      }

      const pointerPosition = pointerToRoomCoordinates(roomElement, event.clientX, event.clientY);
      const rawPosition = {
        x: pointerPosition.x - dragState.pointerOffset.x,
        y: pointerPosition.y - dragState.pointerOffset.y,
      };

      let resolvedActiveAnchorId: string | null = null;
      let resolvedNearestAnchorId: string | null = null;
      let hasNoSpace = false;

      setPlacedFurniture((currentFurniture) => {
        const draggedItem = currentFurniture.find((item) => item.instanceId === dragState.itemId);

        if (!draggedItem) {
          return currentFurniture;
        }

        const resolution = resolveFurnitureDrop({
          activeAnchorId: dragState.activeAnchorId,
          item: draggedItem,
          placedItems: currentFurniture,
          pointerPosition: rawPosition,
        });

        if (resolution.status === 'snapped') {
          resolvedActiveAnchorId = resolution.anchorId;
          resolvedNearestAnchorId = resolution.nearestAnchorId;
        } else if (resolution.status === 'nearest') {
          resolvedNearestAnchorId = resolution.nearestAnchorId;
        } else if (resolution.reason === 'all-occupied' || resolution.reason === 'no-compatible-anchor') {
          hasNoSpace = true;
        }

        const nextPosition =
          resolution.status === 'snapped'
            ? resolution.position
            : rawPosition;

        return currentFurniture.map((item) =>
          item.instanceId === dragState.itemId
            ? {
                ...item,
                placement: toPlacement(item.placement, nextPosition),
              }
            : item,
        );
      });

      const nextDragState = {
        ...dragState,
        activeAnchorId: resolvedActiveAnchorId,
        nearestAnchorId: resolvedNearestAnchorId,
        previewPosition: rawPosition,
      };

      dragStateRef.current = nextDragState;
      setActiveAnchorId(nextDragState.activeAnchorId);
      setNearestAnchorId(nextDragState.nearestAnchorId);
      setIsNoSpaceAvailable(hasNoSpace);
      updateDebugState(nextDragState);
    },
    [enabled, roomRef, setPlacedFurniture, updateDebugState],
  );

  const finishDrag = useCallback(
    (event: globalThis.PointerEvent, cancelled: boolean) => {
      const dragState = dragStateRef.current;

      if (!dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      event.preventDefault();

      if (cancelled) {
        setPlacedFurniture((currentFurniture) =>
          currentFurniture.map((item) =>
            item.instanceId === dragState.itemId
              ? {
                  ...item,
                  placement: toPlacement(item.placement, dragState.originalPosition),
                }
              : item,
          ),
        );
        clearDragState();
        return;
      }

      let resolutionStatus: PlacementResolution['status'] = 'invalid';
      let resolvedPosition: DragPosition | null = null;

      setPlacedFurniture((currentFurniture) => {
        const draggedItem = currentFurniture.find((item) => item.instanceId === dragState.itemId);

        if (!draggedItem) {
          return currentFurniture;
        }

        const resolution = resolveFurnitureDrop({
          activeAnchorId: dragState.activeAnchorId,
          item: draggedItem,
          placedItems: currentFurniture,
          pointerPosition: dragState.previewPosition,
        });

        if (resolution.status === 'snapped' || resolution.status === 'nearest') {
          resolutionStatus = resolution.status;
          resolvedPosition = resolution.position;

          return currentFurniture.map((item) =>
            item.instanceId === dragState.itemId
              ? {
                  ...item,
                  placement: toPlacement(item.placement, resolution.position),
                }
              : item,
          );
        }

        return currentFurniture.map((item) =>
          item.instanceId === dragState.itemId
            ? {
                ...item,
                placement: toPlacement(item.placement, dragState.originalPosition),
              }
            : item,
        );
      });

      if (resolutionStatus === 'invalid' || resolvedPosition === null) {
        setIsNoSpaceAvailable(true);
      }

      clearDragState();
    },
    [clearDragState, setPlacedFurniture],
  );

  const startDrag = useCallback(
    (placedItem: PlacedFurniture, event: ReactPointerEvent<HTMLDivElement>) => {
      if (!enabled || !isPrimaryPointer(event) || dragStateRef.current) {
        return;
      }

      const roomElement = roomRef.current;

      if (!roomElement) {
        return;
      }

      const pointerPosition = pointerToRoomCoordinates(roomElement, event.clientX, event.clientY);
      const currentPosition = {
        x: placedItem.placement.x,
        y: placedItem.placement.y,
      };
      const matchedAnchorId = findMatchingAnchorId(placedItem);
      const nextDragState: FurnitureDragState = {
        activeAnchorId: matchedAnchorId,
        itemId: placedItem.instanceId,
        nearestAnchorId: matchedAnchorId,
        pointerId: event.pointerId,
        originalPosition: currentPosition,
        previewPosition: currentPosition,
        pointerOffset: {
          x: pointerPosition.x - currentPosition.x,
          y: pointerPosition.y - currentPosition.y,
        },
      };

      dragTargetRef.current = event.currentTarget;
      dragStateRef.current = nextDragState;
      setActiveItemId(placedItem.instanceId);
      setActiveAnchorId(matchedAnchorId);
      setNearestAnchorId(matchedAnchorId);
      setIsNoSpaceAvailable(false);
      updateDebugState(nextDragState);

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);

      const handleWindowPointerMove = (windowEvent: globalThis.PointerEvent) => {
        handlePointerMove(windowEvent);
      };
      const handleWindowPointerUp = (windowEvent: globalThis.PointerEvent) => {
        finishDrag(windowEvent, false);
      };
      const handleWindowPointerCancel = (windowEvent: globalThis.PointerEvent) => {
        finishDrag(windowEvent, true);
      };
      const handleWindowBlur = () => {
        clearDragState();
      };
      const handleVisibilityChange = () => {
        if (document.hidden) {
          clearDragState();
        }
      };

      window.addEventListener('pointermove', handleWindowPointerMove);
      window.addEventListener('pointerup', handleWindowPointerUp);
      window.addEventListener('pointercancel', handleWindowPointerCancel);
      window.addEventListener('blur', handleWindowBlur);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      windowCleanupRef.current = () => {
        window.removeEventListener('pointermove', handleWindowPointerMove);
        window.removeEventListener('pointerup', handleWindowPointerUp);
        window.removeEventListener('pointercancel', handleWindowPointerCancel);
        window.removeEventListener('blur', handleWindowBlur);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    },
    [clearDragState, enabled, finishDrag, handlePointerMove, roomRef, updateDebugState],
  );

  const ghostPreviews = useMemo<FurnitureDragGhostPreview[]>(() => {
    if (!activeItemId) {
      return [];
    }

    const draggedItem = placedFurniture.find((item) => item.instanceId === activeItemId);

    if (!draggedItem) {
      return [];
    }

    const { availableAnchors } = getAvailableAnchors(draggedItem, placedFurniture);

    return availableAnchors.map((anchor) => ({
      anchorId: anchor.id,
      placement: {
        x: anchor.x,
        y: anchor.y,
      },
      state:
        activeAnchorId === anchor.id
          ? 'active'
          : nearestAnchorId === anchor.id
            ? 'nearest'
            : 'default',
    }));
  }, [activeAnchorId, activeItemId, nearestAnchorId, placedFurniture]);

  const bindings = useCallback(
    (placedItem: PlacedFurniture): FurnitureDragBindings => ({
      placement: placedItem.placement,
      activeAnchorId: activeItemId === placedItem.instanceId ? activeAnchorId ?? undefined : undefined,
      nearestAnchorId:
        activeItemId === placedItem.instanceId ? nearestAnchorId ?? undefined : undefined,
      isDragging: activeItemId === placedItem.instanceId,
      isEditable: enabled,
      isNoSpaceAvailable: activeItemId === placedItem.instanceId && isNoSpaceAvailable,
      onPointerDown: enabled ? (event) => startDrag(placedItem, event) : undefined,
    }),
    [activeAnchorId, activeItemId, enabled, isNoSpaceAvailable, nearestAnchorId, startDrag],
  );

  return useMemo(
    () => ({
      bindings,
      dragDebugState: debugState,
      draggingItemId: activeItemId,
      ghostPreviews,
      isNoSpaceAvailable,
    }),
    [activeItemId, bindings, debugState, ghostPreviews, isNoSpaceAvailable],
  );
}
