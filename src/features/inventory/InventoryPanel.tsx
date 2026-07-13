import { getFurnitureItem } from '../../data/furniture';
import { useGame } from '../../store/GameContext';
import styles from './InventoryPanel.module.css';

export function InventoryPanel() {
  const { state, dispatch } = useGame();

  return (
    <section className={styles.panel} aria-label="Inventory">
      <p className={styles.panelIntro}>Place owned furniture in the room.</p>
      {state.inventory.length === 0 ? (
        <p className={styles.emptyState}>No furniture yet.</p>
      ) : (
        <div className={styles.itemList}>
          {state.inventory.map((inventoryItem) => {
            const furniture = getFurnitureItem(inventoryItem.furnitureId);

            if (!furniture) {
              return null;
            }

            const positionFilled = state.placedFurniture.some(
              (item) => item.positionId === furniture.placement.positionId,
            );
            const isPlaced = state.placedFurniture.some(
              (item) =>
                item.positionId === furniture.placement.positionId &&
                item.furnitureId === inventoryItem.furnitureId,
            );

            return (
              <article className={styles.inventoryItem} key={inventoryItem.furnitureId}>
                <div>
                  <h3>{furniture.name}</h3>
                  <p>Owned: {inventoryItem.quantity}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: 'placeFurniture',
                      furnitureId: inventoryItem.furnitureId,
                      positionId: furniture.placement.positionId,
                    })
                  }
                >
                  {positionFilled && !isPlaced ? 'Swap' : 'Place'}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
