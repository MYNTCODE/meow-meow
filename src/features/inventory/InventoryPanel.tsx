import {
  useMemo,
  useState,
} from 'react';

import { getFurnitureAsset } from '../../data/assets';
import { getFurnitureItem } from '../../data/furniture';
import { DECOR_SLOTS } from '../../data/roomSlots';
import { useGame } from '../../store/GameContext';
import type {
  FurnitureId,
  FurnitureItem,
} from '../../types/game';
import styles from './InventoryPanel.module.css';

type InventoryFilter = 'all' | 'bed' | 'toy' | 'food' | 'decor';

interface InventoryEntry {
  furniture: FurnitureItem;
  isInRoom: boolean;
  equippedItem?: FurnitureItem;
}

interface InventoryPanelProps {
  isRoomEditing: boolean;
  onSelectPlacementFurniture: (furnitureId: FurnitureId) => void;
}

const FILTER_OPTIONS: Array<{ label: string; value: InventoryFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Beds', value: 'bed' },
  { label: 'Toys', value: 'toy' },
  { label: 'Food', value: 'food' },
  { label: 'Decor', value: 'decor' },
];

function getReplaceTargetLabel(furniture: FurnitureItem) {
  switch (furniture.slot) {
    case 'bed':
      return 'bed';
    case 'toy':
      return 'toy';
    case 'food':
      return 'food item';
    default:
      return 'decor item';
  }
}

function matchesFilter(filter: InventoryFilter, furniture: FurnitureItem) {
  if (filter === 'all') {
    return true;
  }

  if (filter === 'decor') {
    return DECOR_SLOTS.includes(furniture.slot);
  }

  return furniture.slot === filter;
}

function InventoryItemPreview({ item }: { item: FurnitureItem }) {
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
      <img src={assetPath} alt="" draggable="false" onError={() => setAssetFailed(true)} />
    </div>
  );
}

export function InventoryPanel({
  isRoomEditing,
  onSelectPlacementFurniture,
}: InventoryPanelProps) {
  const { state, dispatch } = useGame();
  const [activeFilter, setActiveFilter] = useState<InventoryFilter>('all');
  const [pendingReplaceId, setPendingReplaceId] = useState<FurnitureId | null>(null);

  const inventoryEntries = useMemo<InventoryEntry[]>(
    () =>
      state.inventory.flatMap((inventoryItem) => {
        const furniture = getFurnitureItem(inventoryItem.furnitureId);

        if (!furniture) {
          return [];
        }

        const equippedFurnitureId = state.equippedItems[furniture.slot];
        const equippedItem = equippedFurnitureId ? getFurnitureItem(equippedFurnitureId) : undefined;

        return [
          {
            furniture,
            isInRoom: equippedFurnitureId === inventoryItem.furnitureId,
            equippedItem,
          },
        ];
      }),
    [state.equippedItems, state.inventory],
  );

  const filteredEntries = inventoryEntries.filter(({ furniture }) => matchesFilter(activeFilter, furniture));
  const pendingEntry =
    inventoryEntries.find((entry) => entry.furniture.id === pendingReplaceId) ?? null;

  function equipFurniture(furnitureId: FurnitureId) {
    dispatch({
      type: 'equipFurniture',
      furnitureId,
    });
  }

  function handleItemAction(entry: InventoryEntry) {
    if (entry.isInRoom) {
      return;
    }

    if (isRoomEditing) {
      onSelectPlacementFurniture(entry.furniture.id);
      return;
    }

    if (entry.equippedItem) {
      setPendingReplaceId(entry.furniture.id);
      return;
    }

    equipFurniture(entry.furniture.id);
  }

  function handleConfirmReplace() {
    if (!pendingEntry) {
      return;
    }

    if (isRoomEditing) {
      onSelectPlacementFurniture(pendingEntry.furniture.id);
      setPendingReplaceId(null);
      return;
    }

    equipFurniture(pendingEntry.furniture.id);
    setPendingReplaceId(null);
  }

  return (
    <section className={styles.panel} aria-label="Inventory">
      <div className={styles.filters} role="tablist" aria-label="Inventory categories">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={activeFilter === option.value ? styles.filterActive : styles.filterButton}
            type="button"
            onClick={() => setActiveFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {state.inventory.length === 0 ? (
        <p className={styles.emptyState}>No furniture yet.</p>
      ) : filteredEntries.length === 0 ? (
        <p className={styles.emptyState}>Nothing here yet.</p>
      ) : (
        <div className={styles.itemList}>
          {filteredEntries.map((entry) => {
            const { furniture, isInRoom, equippedItem } = entry;
            const actionLabel = isInRoom ? '🏠 In Room' : equippedItem ? 'Replace' : 'Place';

            return (
              <article
                className={`${styles.inventoryItem} ${isInRoom ? styles.inventoryItemInRoom : ''}`}
                key={furniture.id}
              >
                <div className={styles.itemCard}>
                  <InventoryItemPreview item={furniture} />
                  <div className={styles.itemCopy}>
                    <div className={styles.itemHeadingRow}>
                      <h3>{furniture.name}</h3>
                      {isInRoom ? <span className={styles.inRoomBadge}>🏠 In Room</span> : null}
                    </div>
                  </div>
                  <button
                    className={`${styles.actionButton} ${
                      isInRoom ? styles.inRoomButton : styles.primaryActionButton
                    }`}
                    type="button"
                    onClick={() => handleItemAction(entry)}
                    disabled={isInRoom}
                  >
                    {actionLabel}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {pendingEntry ? (
        <div className={styles.modalOverlay} role="presentation">
          <button
            className={styles.modalBackdrop}
            type="button"
            aria-label="Close replace confirmation"
            onClick={() => setPendingReplaceId(null)}
          />
          <section
            className={styles.modalCard}
            aria-modal="true"
            role="dialog"
            aria-labelledby="inventory-replace-title"
            aria-describedby="inventory-replace-description"
          >
            <h3 id="inventory-replace-title" className={styles.modalTitle}>
              Replace current {getReplaceTargetLabel(pendingEntry.furniture)}?
            </h3>
            <p id="inventory-replace-description" className={styles.modalMessage}>
              The current furniture will return to your inventory.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                type="button"
                onClick={() => setPendingReplaceId(null)}
              >
                Cancel
              </button>
              <button
                className={`${styles.actionButton} ${styles.primaryActionButton}`}
                type="button"
                onClick={handleConfirmReplace}
              >
                Replace
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
