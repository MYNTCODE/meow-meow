import { useState } from 'react';

import { getFurnitureAsset } from '../../data/assets';
import { FURNITURE_ITEMS } from '../../data/furniture';
import { useGame } from '../../store/GameContext';
import type { FurnitureItem } from '../../types/game';
import styles from './ShopPanel.module.css';

function ShopItemPreview({ item }: { item: FurnitureItem }) {
  const [assetFailed, setAssetFailed] = useState(false);
  const assetPath = getFurnitureAsset(item.assetKey);
  const aspectRatio = `${item.sourceWidth} / ${item.sourceHeight}`;

  if (assetFailed) {
    return (
      <div className={styles.itemPreview} style={{ aspectRatio }} aria-hidden="true">
        <span />
      </div>
    );
  }

  return (
    <div className={styles.itemPreview} style={{ aspectRatio }} aria-hidden="true">
      <img
        src={assetPath}
        alt=""
        draggable="false"
        onError={() => setAssetFailed(true)}
      />
    </div>
  );
}

export function ShopPanel() {
  const { state, dispatch } = useGame();

  return (
    <section className={styles.panel} aria-label="Furniture shop">
      <p className={styles.panelIntro}>Furniture for a warmer room.</p>
      <div className={styles.itemList}>
        {FURNITURE_ITEMS.map((item) => {
          const isOwned = state.inventory.some((inventoryItem) => inventoryItem.furnitureId === item.id);
          const isInRoom = state.equippedItems[item.slot] === item.id;
          const canAfford = !isOwned && state.coins >= item.price;
          const actionLabel = isInRoom ? 'In Room' : isOwned ? '✓ Owned' : 'Buy';
          const actionClassName =
            isInRoom ? styles.inRoomBadge : isOwned ? styles.ownedButton : undefined;

          return (
            <article className={styles.shopItem} key={item.id}>
              <div className={styles.itemThumbnail}>
                <ShopItemPreview item={item} />
              </div>
              <div className={styles.itemContent}>
                <div className={styles.itemCopy}>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  <p className={styles.itemDescription}>{item.description}</p>
                  <strong className={styles.itemPrice}>{item.price} coins</strong>
                </div>
              </div>
              <div className={styles.shopItemAction}>
                {isOwned ? (
                  <span className={actionClassName}>{actionLabel}</span>
                ) : (
                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={() => dispatch({ type: 'buyFurniture', furnitureId: item.id })}
                  >
                    {actionLabel}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
