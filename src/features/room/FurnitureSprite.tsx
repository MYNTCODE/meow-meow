import { useState } from 'react';
import { CAT_BALL_PLAY_OFFSETS, type PlayFrameIndex } from '../cat/playAnimation';
import { getFurnitureAssetForPlacement } from '../../data/assets';
import { getFurnitureItem } from '../../data/furniture';
import type { PlacedFurniture } from '../../types/game';
import type { FurnitureDragBindings } from '../../hooks/useFurnitureDrag';
import { getFurnitureRenderScale } from '../../utils/collision';
import styles from './FurnitureSprite.module.css';

interface FurnitureSpriteProps {
  placedFurniture: PlacedFurniture;
  renderOrder: number;
  dragBindings: FurnitureDragBindings;
  isInvalid: boolean;
  isPlayingTarget: boolean;
  playFrameIndex: PlayFrameIndex;
}

export function FurnitureSprite({
  placedFurniture,
  renderOrder,
  dragBindings,
  isInvalid,
  isPlayingTarget,
  playFrameIndex,
}: FurnitureSpriteProps) {
  const [assetFailed, setAssetFailed] = useState(false);
  const furniture = getFurnitureItem(placedFurniture.furnitureId);

  if (!furniture) {
    return null;
  }

  const placement = dragBindings.placement ?? placedFurniture.placement;
  const scale = getFurnitureRenderScale(furniture);
  const assetPath = getFurnitureAssetForPlacement(furniture, placedFurniture);
  const aspectRatio = `${furniture.sourceWidth} / ${furniture.sourceHeight}`;
  const shouldWiggle =
    furniture.id === 'cat-ball' && isPlayingTarget && !dragBindings.isDragging;
  const playBallOffset = shouldWiggle ? CAT_BALL_PLAY_OFFSETS[playFrameIndex] : undefined;

  return (
    <div
      className={`${styles.cushion} ${dragBindings.isEditable ? styles.editable : ''} ${dragBindings.isDragging ? styles.dragging : ''} ${isInvalid ? styles.invalid : ''}`}
      style={{
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        width: `${placement.width * scale}%`,
        aspectRatio,
        zIndex: dragBindings.isDragging ? 1000 : renderOrder,
      }}
      aria-label={`Placed ${furniture.name}`}
      onPointerDown={dragBindings.onPointerDown}
    >
      {!assetFailed ? (
        <span
          className={styles.spriteWrap}
          style={
            playBallOffset
              ? {
                  transform: `translateX(${playBallOffset.translateX}px) rotate(${playBallOffset.rotation}deg)`,
                }
              : undefined
          }
        >
          <img
            className={styles.furnitureImage}
            src={assetPath}
            alt=""
            draggable="false"
            onError={() => setAssetFailed(true)}
          />
        </span>
      ) : (
        <span className={styles.fallbackBlock} />
      )}
    </div>
  );
}
