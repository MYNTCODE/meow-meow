import { useState } from 'react';
import { gameAssets } from '../../data/assets';
import { useCatBehavior } from '../../hooks/useCatBehavior';
import { CatActor } from '../cat/CatActor';
import { CatControlPanel } from '../cat/CatControlPanel';
import { FurnitureSprite } from './FurnitureSprite';
import { RoomDebugOverlay } from './RoomDebugOverlay';
import type { GameState } from '../../types/game';
import { getFurnitureItem } from '../../data/furniture';
import { getCatDepthAnchorY, getFurnitureDepthAnchorY } from '../../utils/collision';
import styles from './RoomView.module.css';

interface RoomViewProps {
  state: GameState;
}

export function RoomView({ state }: RoomViewProps) {
  const [assetFailed, setAssetFailed] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const canShowDebug = import.meta.env.DEV;
  const {
    catBehavior,
    movementPoints,
    movementBlocked,
  } = useCatBehavior(state.cat, state.placedFurniture);
  const roomObjects = [
    ...state.placedFurniture.map((placedItem) => {
      const furniture = getFurnitureItem(placedItem.furnitureId);
      const depth = furniture ? getFurnitureDepthAnchorY(furniture, placedItem) : 0;
      const isInteracted =
        catBehavior.state === 'resting' &&
        catBehavior.currentInteractionItemId === placedItem.furnitureId;

      return {
        id: `furniture-${placedItem.positionId}`,
        type: 'furniture' as const,
        depth,
        placedItem,
        sortBoost: isInteracted ? -0.01 : 0,
      };
    }),
    {
      id: 'cat',
      type: 'cat' as const,
      depth: getCatDepthAnchorY(catBehavior),
      sortBoost: catBehavior.state === 'resting' ? 0.01 : 0,
    },
  ].sort((a, b) => a.depth + a.sortBoost - (b.depth + b.sortBoost));

  return (
    <div className={styles.roomStack}>
      <section className={styles.roomFrame} aria-label="Mew Mew room">
        {canShowDebug ? (
          <button
            className={styles.debugToggle}
            type="button"
            onClick={() => setShowDebug((currentValue) => !currentValue)}
          >
            Debug
          </button>
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
                />
              );
            }

            return (
              <CatActor
                key={object.id}
                cat={state.cat}
                behavior={catBehavior}
                placedFurniture={state.placedFurniture}
              />
            );
          })}
        </div>
        {canShowDebug && showDebug ? (
          <RoomDebugOverlay
            behavior={catBehavior}
            movementBlocked={movementBlocked}
            movementPoints={movementPoints}
            placedFurniture={state.placedFurniture}
            cat={state.cat}
          />
        ) : null}
      </section>
      <CatControlPanel behavior={catBehavior} />
    </div>
  );
}
