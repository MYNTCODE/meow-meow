import { useState } from 'react';
import { getFurnitureAsset } from '../../data/assets';
import { FURNITURE_ITEMS } from '../../data/furniture';
import type { FurnitureItem } from '../../types/game';
import { useGame } from '../../store/GameContext';
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
          const canAfford = state.coins >= item.price;

          return (
            <article className={styles.shopItem} key={item.id}>
              <ShopItemPreview item={item} />
              <div className={styles.itemCopy}>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <strong>{item.price} coins</strong>
              </div>
              <button
                type="button"
                disabled={!canAfford}
                onClick={() => dispatch({ type: 'buyFurniture', furnitureId: item.id })}
              >
                Buy
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
