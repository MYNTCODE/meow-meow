import { useRef, useState, type Dispatch } from 'react';
import { gameAssets, getFurnitureAssetForPlacement } from '../../data/assets';
import { getFurnitureItem } from '../../data/furniture';
import { getRoomPlacementAnchors } from '../../data/roomSlots';
import { useCatBehavior } from '../../hooks/useCatBehavior';
import { useRoomEditMode } from '../../hooks/useRoomEditMode';
import { useRoomMetrics } from '../../hooks/useRoomMetrics';
import { clearGameState } from '../../store/gameStorage';
import type { GameAction } from '../../store/gameReducer';
import type { FurnitureId, GameState } from '../../types/game';
import { getCatDepthAnchorY, getFurnitureDepthAnchorY } from '../../utils/collision';
import { getFurnitureRenderScale } from '../../utils/collision';
import { CatActor } from '../cat/CatActor';
import { CatControlPanel } from '../cat/CatControlPanel';
import { MobileControls } from '../cat/MobileControls';
import { FurnitureSprite } from './FurnitureSprite';
import { RoomDebugOverlay } from './RoomDebugOverlay';
import { RoomEditControls } from './RoomEditControls';
import styles from './RoomView.module.css';

interface RoomViewProps {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  isRoomEditing: boolean;
  onEditingChange: (nextValue: boolean) => void;
  onPlacementSelectionHandled: () => void;
  selectedPlacementFurnitureId: FurnitureId | null;
}

export function RoomView({
  state,
  dispatch,
  isRoomEditing,
  onEditingChange,
  onPlacementSelectionHandled,
  selectedPlacementFurnitureId,
}: RoomViewProps) {
  const [assetFailed, setAssetFailed] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showAnchorLabels, setShowAnchorLabels] = useState(false);
  const roomRef = useRef<HTMLElement | null>(null);
  const canShowDebug = import.meta.env.DEV;
  const roomMetrics = useRoomMetrics(roomRef);
  const {
    catBehavior,
    commands,
    commandState,
    interactionFeedback,
    movementPoints,
    movementBlocked,
    playFrameIndex,
    touchControls,
  } = useCatBehavior(state.cat, state.placedFurniture, dispatch, isRoomEditing);
  const roomEdit = useRoomEditMode({
    cat: state.cat,
    catPosition: catBehavior,
    dispatch,
    isEditing: isRoomEditing,
    onPlacementSelectionHandled,
    placedFurniture: state.placedFurniture,
    roomRef,
    selectedPlacementFurnitureId,
    setIsEditing: onEditingChange,
  });
  const placedFurniture = roomEdit.renderedPlacedFurniture;
  const draggedPlacedItem =
    roomEdit.draggingItemId
      ? placedFurniture.find((item) => item.instanceId === roomEdit.draggingItemId) ?? null
      : null;
  const draggedFurniture = draggedPlacedItem ? getFurnitureItem(draggedPlacedItem.furnitureId) : null;
  const draggedAssetPath =
    draggedFurniture && draggedPlacedItem
      ? getFurnitureAssetForPlacement(draggedFurniture, draggedPlacedItem)
      : null;
  const roomObjects = [
    ...placedFurniture.map((placedItem) => {
      const furniture = getFurnitureItem(placedItem.furnitureId);
      const depth = furniture ? getFurnitureDepthAnchorY(furniture, placedItem) : 0;
      const dragBindings = roomEdit.dragBindings(placedItem);
      const isInteracted =
        catBehavior.state === 'resting' &&
        catBehavior.currentInteractionInstanceId === placedItem.instanceId;
      const isEatingTarget =
        catBehavior.state === 'eating' &&
        catBehavior.currentInteractionInstanceId === placedItem.instanceId;
      const isPlayingTarget =
        !isRoomEditing &&
        catBehavior.state === 'playing' &&
        catBehavior.currentInteractionType === 'play' &&
        catBehavior.currentInteractionInstanceId === placedItem.instanceId;

      return {
        id: `furniture-${placedItem.instanceId}`,
        type: 'furniture' as const,
        depth,
        placedItem,
        dragBindings,
        isPlayingTarget,
        sortBoost: dragBindings.isDragging ? 1000 : isEatingTarget ? 0.02 : isInteracted ? -0.01 : 0,
      };
    }),
    {
      id: 'cat',
      type: 'cat' as const,
      depth: getCatDepthAnchorY(catBehavior),
      sortBoost: catBehavior.state === 'resting' ? 0.01 : 0,
    },
  ].sort((a, b) => a.depth + a.sortBoost - (b.depth + b.sortBoost));

  function handleEditRoom() {
    if (commandState.canStand) {
      commands.stand();
    }

    roomEdit.enterEditMode();
  }

  function handleResetRoom() {
    roomEdit.cancelLayout();
    clearGameState();
    dispatch({ type: 'resetGame' });
  }

  return (
    <div className={styles.roomStack}>
      <RoomEditControls
        isEditing={roomEdit.isEditing}
        isLayoutValid={roomEdit.isLayoutValid}
        onEdit={handleEditRoom}
        onReset={handleResetRoom}
        onSave={roomEdit.saveLayout}
      />
      <section ref={roomRef} className={styles.roomFrame} aria-label="Mew Mew room">
        {draggedFurniture && draggedPlacedItem && draggedAssetPath && roomEdit.ghostPreviews.length > 0 ? (
          <div className={styles.ghostPreviewLayer} aria-hidden="true">
            {roomEdit.ghostPreviews.map((preview) => (
              <div
                key={preview.anchorId}
                className={`${styles.ghostPreview} ${
                  preview.state === 'active'
                    ? styles.ghostPreviewActive
                    : preview.state === 'nearest'
                      ? styles.ghostPreviewNearest
                      : styles.ghostPreviewDefault
                }`}
                style={{
                  left: `${preview.placement.x}%`,
                  top: `${preview.placement.y}%`,
                  width: `${draggedPlacedItem.placement.width * getFurnitureRenderScale(draggedFurniture)}%`,
                  aspectRatio: `${draggedFurniture.sourceWidth} / ${draggedFurniture.sourceHeight}`,
                }}
              >
                <img src={draggedAssetPath} alt="" draggable="false" />
              </div>
            ))}
          </div>
        ) : null}
        {isRoomEditing && roomEdit.activeFurnitureSlot && !roomEdit.draggingItemId ? (
          <div className={styles.placementHintLayer} aria-hidden="true">
            {getRoomPlacementAnchors(roomEdit.activeFurnitureSlot).map((anchor) => (
              <span
                key={anchor.id}
                className={`${styles.placementHint} ${
                  anchor.hint === 'wall' ? styles.wallHint : styles.floorHint
                } ${
                  roomEdit.draggingItemId && roomObjects.some(
                    (object) =>
                      object.type === 'furniture' &&
                      object.dragBindings.nearestAnchorId === anchor.id,
                  )
                    ? styles.hintNearest
                    : ''
                } ${
                  roomEdit.draggingItemId && roomObjects.some(
                    (object) =>
                      object.type === 'furniture' &&
                      object.dragBindings.activeAnchorId === anchor.id,
                  )
                    ? styles.hintActive
                    : ''
                }`}
                style={{
                  left: `${anchor.x}%`,
                  top: `${anchor.y}%`,
                }}
              />
            ))}
          </div>
        ) : null}
        {canShowDebug ? (
          <div className={styles.debugControls}>
            <button
              className={styles.debugToggle}
              type="button"
              onClick={() => setShowDebug((currentValue) => !currentValue)}
            >
              Debug
            </button>
            {showDebug ? (
              <button
                className={styles.debugToggleSecondary}
                type="button"
                onClick={() => setShowAnchorLabels((currentValue) => !currentValue)}
              >
                Labels {showAnchorLabels ? 'On' : 'Off'}
              </button>
            ) : null}
          </div>
        ) : null}
        {!assetFailed ? (
          <img
            className={styles.roomImage}
            src={gameAssets.rooms.starterRoom}
            alt=""
            draggable="false"
            onError={() => setAssetFailed(true)}
          />
        ) : (
          <>
            <div className={styles.wall}>
              <div className={styles.window}>
                <span />
                <span />
              </div>
            </div>
            <div className={styles.floor} />
          </>
        )}
        <div className={styles.objectLayer}>
          {roomObjects.map((object, index) => {
            if (object.type === 'furniture') {
              return (
                <FurnitureSprite
                  key={object.id}
                  placedFurniture={object.placedItem}
                  renderOrder={index + 1}
                  dragBindings={object.dragBindings}
                  isGhost={Boolean(
                    selectedPlacementFurnitureId &&
                      object.placedItem.furnitureId === selectedPlacementFurnitureId,
                  )}
                  isInvalid={roomEdit.invalidFurnitureIds.has(object.placedItem.instanceId)}
                  isPlayingTarget={object.isPlayingTarget}
                  playFrameIndex={playFrameIndex}
                />
              );
            }

            return (
              <CatActor
                key={object.id}
                cat={state.cat}
                behavior={catBehavior}
                placedFurniture={placedFurniture}
                playFrameIndex={playFrameIndex}
                renderOrder={index + 1}
              />
            );
          })}
        </div>
        {canShowDebug && showDebug ? (
          <RoomDebugOverlay
            behavior={catBehavior}
            movementBlocked={movementBlocked}
            movementPoints={movementPoints}
            placedFurniture={placedFurniture}
            cat={state.cat}
            furnitureDragDebug={roomEdit.dragDebugState}
            roomMetrics={roomMetrics}
            showAnchorLabels={showAnchorLabels}
          />
        ) : null}
      </section>
      {!isRoomEditing ? (
        <MobileControls
          bindDirectionButton={touchControls.bindDirectionButton}
          interactButton={touchControls.interactButton}
        />
      ) : null}
      {isRoomEditing && roomEdit.isNoSpaceAvailable ? (
        <div className={styles.interactionFeedback} role="status" aria-live="polite">
          No space available
        </div>
      ) : null}
      {!isRoomEditing && interactionFeedback ? (
        <div className={styles.interactionFeedback} role="status" aria-live="polite">
          {interactionFeedback}
        </div>
      ) : null}
      {!isRoomEditing ? <CatControlPanel behavior={catBehavior} /> : null}
    </div>
  );
}
