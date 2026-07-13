import { GamePanel } from './GamePanel';
import { InventoryPanel } from '../features/inventory/InventoryPanel';
import { ShopPanel } from '../features/shop/ShopPanel';
import type { OpenPanel } from '../types/game';

interface BottomPanelProps {
  openPanel: OpenPanel;
  onRequestClose: () => void;
}

export function BottomPanel({ openPanel, onRequestClose }: BottomPanelProps) {
  if (openPanel === null) {
    return null;
  }

  return (
    <GamePanel
      isOpen={openPanel !== null}
      title={openPanel === 'shop' ? 'Shop' : 'Inventory'}
      onRequestClose={onRequestClose}
    >
      {openPanel === 'shop' ? <ShopPanel /> : <InventoryPanel />}
    </GamePanel>
  );
}
