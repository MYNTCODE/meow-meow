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
import type { FurniturePlacement, PlacedFurniture } from '../types/game';
import { pointerToRoomCoordinates } from '../utils/furnitureDrag';

type DragPosition = {
  x: number;
  y: number;
};

type FurnitureDragState = {
  itemId: string;
  pointerId: number;
  originalPosition: DragPosition;
  previewPosition: DragPosition;
  pointerOffset: DragPosition;
};

export interface FurnitureDragBindings {
  placement: FurniturePlacement;
  isDragging: boolean;
  isEditable: boolean;
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
  roomRef: RefObject<HTMLElement | null>;
  setPlacedFurniture: Dispatch<SetStateAction<PlacedFurniture[]>>;
}

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

export function useFurnitureDrag({
  enabled,
  roomRef,
  setPlacedFurniture,
}: UseFurnitureDragOptions) {
  const dragStateRef = useRef<FurnitureDragState | null>(null);
  const dragTargetRef = useRef<HTMLDivElement | null>(null);
  const windowCleanupRef = useRef<(() => void) | null>(null);

  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [debugState, setDebugState] = useState<FurnitureDragDebugState | null>(null);

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

      const roomElement = roomRef.current;

      if (!roomElement) {
        return;
      }

      const pointerPosition = pointerToRoomCoordinates(roomElement, event.clientX, event.clientY);
      const nextPosition = {
        x: pointerPosition.x - dragState.pointerOffset.x,
        y: pointerPosition.y - dragState.pointerOffset.y,
      };
      const nextDragState = {
        ...dragState,
        previewPosition: nextPosition,
      };

      dragStateRef.current = nextDragState;
      setPlacedFurniture((currentFurniture) =>
        currentFurniture.map((item) =>
          item.instanceId === nextDragState.itemId
            ? {
                ...item,
                placement: toPlacement(item.placement, nextPosition),
              }
            : item,
        ),
      );
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
      const nextDragState: FurnitureDragState = {
        itemId: placedItem.instanceId,
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

      window.addEventListener('pointermove', handleWindowPointerMove);
      window.addEventListener('pointerup', handleWindowPointerUp);
      window.addEventListener('pointercancel', handleWindowPointerCancel);

      windowCleanupRef.current = () => {
        window.removeEventListener('pointermove', handleWindowPointerMove);
        window.removeEventListener('pointerup', handleWindowPointerUp);
        window.removeEventListener('pointercancel', handleWindowPointerCancel);
      };
    },
    [enabled, finishDrag, handlePointerMove, roomRef, updateDebugState],
  );

  const bindings = useCallback(
    (placedItem: PlacedFurniture): FurnitureDragBindings => ({
      placement: placedItem.placement,
      isDragging: activeItemId === placedItem.instanceId,
      isEditable: enabled,
      onPointerDown: enabled ? (event) => startDrag(placedItem, event) : undefined,
    }),
    [activeItemId, enabled, startDrag],
  );

  return useMemo(
    () => ({
      bindings,
      dragDebugState: debugState,
      draggingItemId: activeItemId,
    }),
    [activeItemId, bindings, debugState],
  );
}
