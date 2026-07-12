import { useState } from 'react';
import { getFurnitureAsset } from '../../data/assets';
import { getFurnitureItem, getFurniturePlacement } from '../../data/furniture';
import type { PlacedFurniture } from '../../types/game';
import styles from './FurnitureSprite.module.css';

interface FurnitureSpriteProps {
  placedFurniture: PlacedFurniture;
  renderOrder: number;
}

export function FurnitureSprite({ placedFurniture, renderOrder }: FurnitureSpriteProps) {
  const [assetFailed, setAssetFailed] = useState(false);
  const furniture = getFurnitureItem(placedFurniture.furnitureId);
  const placement = getFurniturePlacement(
    placedFurniture.furnitureId,
    placedFurniture.positionId,
  );

  if (!furniture || !placement) {
    return null;
  }

  const assetPath = getFurnitureAsset(furniture.assetKey);
  const aspectRatio = `${furniture.sourceWidth} / ${furniture.sourceHeight}`;

  return (
    <div
      className={styles.cushion}
      style={{
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        width: `${placement.width}%`,
        aspectRatio,
        zIndex: renderOrder,
      }}
      aria-label={`Placed ${furniture.name}`}
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
