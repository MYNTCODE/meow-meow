import { GamePanel } from './GamePanel';
import { InventoryPanel } from '../features/inventory/InventoryPanel';
import { ShopPanel } from '../features/shop/ShopPanel';
import type { FurnitureId, OpenPanel } from '../types/game';

interface BottomPanelProps {
  isRoomEditing: boolean;
  onRequestClose: () => void;
  onSelectPlacementFurniture: (furnitureId: FurnitureId) => void;
  openPanel: OpenPanel;
}

export function BottomPanel({
  isRoomEditing,
  onRequestClose,
  onSelectPlacementFurniture,
  openPanel,
}: BottomPanelProps) {
  if (openPanel === null) {
    return null;
  }

  return (
    <GamePanel
      isOpen={openPanel !== null}
      isWide={openPanel === 'shop'}
      title={openPanel === 'shop' ? 'Shop' : 'Inventory'}
      onRequestClose={onRequestClose}
    >
      {openPanel === 'shop' ? (
        <ShopPanel />
      ) : (
        <InventoryPanel
          isRoomEditing={isRoomEditing}
          onSelectPlacementFurniture={onSelectPlacementFurniture}
        />
      )}
    </GamePanel>
  );
}
