import { useRef, useState, type Dispatch } from 'react';
import { gameAssets } from '../../data/assets';
import { useCatBehavior } from '../../hooks/useCatBehavior';
import { useRoomEditMode } from '../../hooks/useRoomEditMode';
import { useRoomMetrics } from '../../hooks/useRoomMetrics';
import { clearGameState } from '../../store/gameStorage';
import { CatActor } from '../cat/CatActor';
import { CatControlPanel } from '../cat/CatControlPanel';
import { MobileControls } from '../cat/MobileControls';
import { FurnitureSprite } from './FurnitureSprite';
import { RoomEditControls } from './RoomEditControls';
import { RoomDebugOverlay } from './RoomDebugOverlay';
import type { GameState } from '../../types/game';
import type { GameAction } from '../../store/gameReducer';
import { getFurnitureItem } from '../../data/furniture';
import { getCatDepthAnchorY, getFurnitureDepthAnchorY } from '../../utils/collision';
import styles from './RoomView.module.css';

interface RoomViewProps {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}

export function RoomView({ state, dispatch }: RoomViewProps) {
  const [assetFailed, setAssetFailed] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showAnchorLabels, setShowAnchorLabels] = useState(false);
  const [isRoomEditing, setIsRoomEditing] = useState(false);
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
    placedFurniture: state.placedFurniture,
    roomRef,
    setIsEditing: setIsRoomEditing,
  });
  const placedFurniture = roomEdit.renderedPlacedFurniture;
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
      <MobileControls
        bindDirectionButton={touchControls.bindDirectionButton}
        interactButton={touchControls.interactButton}
      />
      {interactionFeedback ? (
        <div className={styles.interactionFeedback} role="status" aria-live="polite">
          {interactionFeedback}
        </div>
      ) : null}
      <CatControlPanel behavior={catBehavior} />
    </div>
  );
}
