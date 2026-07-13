import type { OpenPanel } from '../types/game';
import styles from './BottomNavigation.module.css';

interface BottomNavigationProps {
  openPanel: OpenPanel;
  onSelectPanel: (panel: 'shop' | 'inventory') => void;
}

const NAV_ITEMS: Array<{ label: string; panel: 'shop' | 'inventory' }> = [
  { label: 'Shop', panel: 'shop' },
  { label: 'Inventory', panel: 'inventory' },
];

export function BottomNavigation({ openPanel, onSelectPanel }: BottomNavigationProps) {
  return (
    <nav className={styles.nav} aria-label="Game navigation">
      {NAV_ITEMS.map((item) => (
        <button
          type="button"
          key={item.panel}
          className={openPanel === item.panel ? styles.active : undefined}
          onClick={() => onSelectPanel(item.panel)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
