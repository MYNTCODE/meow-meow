import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import { useFurnitureDrag } from './useFurnitureDrag';
import type { CatBehaviorSnapshot } from '../types/catBehavior';
import type { GameAction } from '../store/gameReducer';
import type { Cat, PlacedFurniture } from '../types/game';
import type { FurniturePlacementInvalidReason } from '../utils/furnitureDrag';
import { validateRoomLayout } from '../utils/roomLayout';

interface UseRoomEditModeOptions {
  cat: Cat;
  catPosition: CatBehaviorSnapshot;
  dispatch: Dispatch<GameAction>;
  isEditing: boolean;
  placedFurniture: PlacedFurniture[];
  roomRef: RefObject<HTMLElement | null>;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
}

const EMPTY_INVALID_IDS = new Set<string>();
const EMPTY_INVALID_REASONS = new Map<string, FurniturePlacementInvalidReason>();

function clonePlacedFurniture(placedFurniture: PlacedFurniture[]) {
  return placedFurniture.map((item) => ({
    ...item,
    placement: {
      ...item.placement,
    },
  }));
}

export function useRoomEditMode({
  cat,
  catPosition,
  dispatch,
  isEditing,
  placedFurniture,
  roomRef,
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
    cancelLayout,
    dragBindings: furnitureDrag.bindings,
    dragDebugState: furnitureDrag.dragDebugState,
    draggingItemId: furnitureDrag.draggingItemId,
    enterEditMode,
    invalidFurnitureIds,
    invalidReasonsById,
    isEditing,
    isLayoutValid: !isEditing || layoutValidation.isValid,
    renderedPlacedFurniture,
    saveLayout,
  };
}
