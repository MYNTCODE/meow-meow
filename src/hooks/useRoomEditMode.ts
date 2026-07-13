import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import { getFurnitureItem } from '../data/furniture';
import { getRoomPlacementAnchors } from '../data/roomSlots';
import { useFurnitureDrag } from './useFurnitureDrag';
import type { CatBehaviorSnapshot } from '../types/catBehavior';
import type { GameAction } from '../store/gameReducer';
import type { Cat, FurnitureId, ItemSlot, PlacedFurniture } from '../types/game';
import type { FurniturePlacementInvalidReason } from '../utils/furnitureDrag';
import { validateRoomLayout } from '../utils/roomLayout';

interface UseRoomEditModeOptions {
  cat: Cat;
  catPosition: CatBehaviorSnapshot;
  dispatch: Dispatch<GameAction>;
  isEditing: boolean;
  onPlacementSelectionHandled: () => void;
  placedFurniture: PlacedFurniture[];
  roomRef: RefObject<HTMLElement | null>;
  selectedPlacementFurnitureId: FurnitureId | null;
  setIsEditing: Dispatch<SetStateAction<boolean>> | ((nextValue: boolean) => void);
}

const EMPTY_INVALID_IDS = new Set<string>();
const EMPTY_INVALID_REASONS = new Map<string, FurniturePlacementInvalidReason>();

function clonePlacedFurniture(placedFurniture: PlacedFurniture[]) {
  return placedFurniture.map((item) => ({
    ...item,
    placement: {
      ...item.placement,
    },
    interactionState: item.interactionState
      ? {
          ...item.interactionState,
        }
      : undefined,
  }));
}

export function useRoomEditMode({
  cat,
  catPosition,
  dispatch,
  isEditing,
  onPlacementSelectionHandled,
  placedFurniture,
  roomRef,
  selectedPlacementFurnitureId,
  setIsEditing,
}: UseRoomEditModeOptions) {
  const [draftPlacedFurniture, setDraftPlacedFurniture] = useState<PlacedFurniture[]>([]);

  const layoutValidation = useMemo(
    () =>
      validateRoomLayout({
        cat,
        catPosition,
        placedFurniture: isEditing ? draftPlacedFurniture : placedFurniture,
      }),
    [cat, catPosition, draftPlacedFurniture, isEditing, placedFurniture],
  );

  const furnitureDrag = useFurnitureDrag({
    enabled: isEditing,
    placedFurniture: draftPlacedFurniture,
    roomRef,
    setPlacedFurniture: setDraftPlacedFurniture,
  });

  const enterEditMode = useCallback(() => {
    setDraftPlacedFurniture(clonePlacedFurniture(placedFurniture));
    setIsEditing(true);
  }, [placedFurniture, setIsEditing]);

  const cancelLayout = useCallback(() => {
    setDraftPlacedFurniture([]);
    setIsEditing(false);
  }, [setIsEditing]);

  const saveLayout = useCallback(() => {
    const nextValidation = validateRoomLayout({
      cat,
      catPosition,
      placedFurniture: draftPlacedFurniture,
    });

    if (!nextValidation.isValid) {
      return;
    }

    dispatch({
      type: 'setPlacedFurnitureLayout',
      placedFurniture: clonePlacedFurniture(draftPlacedFurniture),
    });
    setDraftPlacedFurniture([]);
    setIsEditing(false);
  }, [cat, catPosition, dispatch, draftPlacedFurniture, setIsEditing]);

  useEffect(() => {
    if (!isEditing || !selectedPlacementFurnitureId) {
      return;
    }

    const furniture = getFurnitureItem(selectedPlacementFurnitureId);

    if (!furniture) {
      onPlacementSelectionHandled();
      return;
    }

    const anchors = getRoomPlacementAnchors(furniture.slot);
    const fallbackAnchor = anchors[0];

    if (!fallbackAnchor) {
      onPlacementSelectionHandled();
      return;
    }

    setDraftPlacedFurniture((currentFurniture) => {
      const existingItem = currentFurniture.find((item) => item.furnitureId === selectedPlacementFurnitureId);
      const replacedItem = currentFurniture.find((item) => item.positionId === furniture.slot);
      const previewAnchor =
        anchors.find((anchor) => {
          if (!existingItem) {
            return true;
          }

          return (
            Math.abs(existingItem.placement.x - anchor.x) < 0.1 &&
            Math.abs(existingItem.placement.y - anchor.y) < 0.1
          );
        }) ?? fallbackAnchor;

      const nextItem: PlacedFurniture = existingItem ?? {
        instanceId: `preview:${selectedPlacementFurnitureId}`,
        furnitureId: selectedPlacementFurnitureId,
        positionId: furniture.slot,
        placement: {
          x: previewAnchor.x,
          y: previewAnchor.y,
          width: furniture.placement.width,
          zIndex: furniture.placement.zIndex,
        },
        interactionState:
          selectedPlacementFurnitureId === 'food-bowl'
            ? {
                foodState: 'full',
              }
            : undefined,
      };

      return [
        ...currentFurniture.filter(
          (item) =>
            item.instanceId !== existingItem?.instanceId &&
            !(item.positionId === furniture.slot && item.instanceId === replacedItem?.instanceId),
        ),
        {
          ...nextItem,
          placement: {
            ...nextItem.placement,
            x: previewAnchor.x,
            y: previewAnchor.y,
          },
        },
      ];
    });

    onPlacementSelectionHandled();
  }, [isEditing, onPlacementSelectionHandled, selectedPlacementFurnitureId]);

  useEffect(() => {
    if (!isEditing) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }

      if (event.target instanceof HTMLElement) {
        const tagName = event.target.tagName.toLowerCase();

        if (
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          event.target.isContentEditable
        ) {
          return;
        }
      }

      event.preventDefault();
      cancelLayout();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancelLayout, isEditing]);

  const renderedPlacedFurniture = isEditing ? draftPlacedFurniture : placedFurniture;
  const invalidFurnitureIds = isEditing ? layoutValidation.invalidFurnitureIds : EMPTY_INVALID_IDS;
  const invalidReasonsById = isEditing
    ? layoutValidation.invalidReasonsById
    : EMPTY_INVALID_REASONS;

  return {
    activeFurnitureSlot:
      selectedPlacementFurnitureId ? getFurnitureItem(selectedPlacementFurnitureId)?.slot ?? null : null,
    cancelLayout,
    dragBindings: furnitureDrag.bindings,
    dragDebugState: furnitureDrag.dragDebugState,
    draggingItemId: furnitureDrag.draggingItemId,
    enterEditMode,
    ghostPreviews: furnitureDrag.ghostPreviews,
    invalidFurnitureIds,
    invalidReasonsById,
    isNoSpaceAvailable: furnitureDrag.isNoSpaceAvailable,
    isEditing,
    isLayoutValid: !isEditing || layoutValidation.isValid,
    renderedPlacedFurniture,
    saveLayout,
  };
}
