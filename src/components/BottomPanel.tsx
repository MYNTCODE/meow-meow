import { InventoryPanel } from '../features/inventory/InventoryPanel';
import { ShopPanel } from '../features/shop/ShopPanel';
import type { PanelView } from '../types/game';
import styles from './BottomPanel.module.css';

interface BottomPanelProps {
  activePanel: PanelView;
}

export function BottomPanel({ activePanel }: BottomPanelProps) {
  if (activePanel === 'room') {
    return null;
  }

  return (
    <div className={styles.panelWrap}>
      {activePanel === 'shop' ? <ShopPanel /> : <InventoryPanel />}
    </div>
  );
}
