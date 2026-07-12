import { useState } from 'react';
import { getFurnitureAsset } from '../../data/assets';
import { getFurnitureItem } from '../../data/furniture';
import type { PlacedFurniture } from '../../types/game';
import type { FurnitureDragBindings } from '../../hooks/useFurnitureDrag';
import styles from './FurnitureSprite.module.css';

interface FurnitureSpriteProps {
  placedFurniture: PlacedFurniture;
  renderOrder: number;
  dragBindings: FurnitureDragBindings;
  isInvalid: boolean;
}

export function FurnitureSprite({
  placedFurniture,
  renderOrder,
  dragBindings,
  isInvalid,
}: FurnitureSpriteProps) {
  const [assetFailed, setAssetFailed] = useState(false);
  const furniture = getFurnitureItem(placedFurniture.furnitureId);

  if (!furniture) {
    return null;
  }

  const placement = dragBindings.placement ?? placedFurniture.placement;
  const assetPath = getFurnitureAsset(furniture.assetKey);
  const aspectRatio = `${furniture.sourceWidth} / ${furniture.sourceHeight}`;

  return (
    <div
      className={`${styles.cushion} ${dragBindings.isEditable ? styles.editable : ''} ${dragBindings.isDragging ? styles.dragging : ''} ${isInvalid ? styles.invalid : ''}`}
      style={{
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        width: `${placement.width}%`,
        aspectRatio,
        zIndex: dragBindings.isDragging ? 1000 : renderOrder,
      }}
      aria-label={`Placed ${furniture.name}`}
      onPointerDown={dragBindings.onPointerDown}
    >
      {!assetFailed ? (
        <img
          className={styles.furnitureImage}
          src={assetPath}
          alt=""
          draggable="false"
          onError={() => setAssetFailed(true)}
        />
      ) : (
        <span />
      )}
    </div>
  );
}
