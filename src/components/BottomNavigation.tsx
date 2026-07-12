import type { PanelView } from '../types/game';
import styles from './BottomNavigation.module.css';

interface BottomNavigationProps {
  activePanel: PanelView;
  onSelectPanel: (panel: PanelView) => void;
}

const NAV_ITEMS: Array<{ label: string; panel: PanelView }> = [
  { label: 'Room', panel: 'room' },
  { label: 'Shop', panel: 'shop' },
  { label: 'Inventory', panel: 'inventory' },
];

export function BottomNavigation({ activePanel, onSelectPanel }: BottomNavigationProps) {
  return (
    <nav className={styles.nav} aria-label="Game navigation">
      {NAV_ITEMS.map((item) => (
        <button
          type="button"
          key={item.panel}
          className={activePanel === item.panel ? styles.active : undefined}
          onClick={() => onSelectPanel(item.panel)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
