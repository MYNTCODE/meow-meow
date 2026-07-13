import { InventoryPanel } from '../features/inventory/InventoryPanel';
import { ShopPanel } from '../features/shop/ShopPanel';
import type { OpenPanel } from '../types/game';
import styles from './BottomPanel.module.css';

interface BottomPanelProps {
  openPanel: OpenPanel;
}

export function BottomPanel({ openPanel }: BottomPanelProps) {
  if (openPanel === null) {
    return null;
  }

  return (
    <div className={styles.panelWrap}>
      {openPanel === 'shop' ? <ShopPanel /> : <InventoryPanel />}
    </div>
  );
}
