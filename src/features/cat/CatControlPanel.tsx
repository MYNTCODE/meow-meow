import type { CatBehaviorSnapshot } from '../../types/catBehavior';
import styles from './CatControlPanel.module.css';

interface CatControlPanelProps {
  behavior: CatBehaviorSnapshot;
}

function formatItemId(itemId?: string) {
  return itemId ?? 'none';
}

export function CatControlPanel({
  behavior,
}: CatControlPanelProps) {
  const interactionLabel = formatItemId(behavior.currentInteractionItemId);

  return (
    <section className={styles.panel} aria-label="Cat development controls">
      <div className={styles.statusGrid}>
        <span>State: {behavior.state}</span>
        <span>Point: {behavior.currentPointId}</span>
        <span>Destination: none</span>
        <span>Facing: {behavior.facingDirection}</span>
        <span title={`Interaction: ${interactionLabel}`}>
          Interaction: {interactionLabel}
        </span>
      </div>
      <div className={styles.hints} aria-label="Keyboard controls">
        <span>A / ← Move Left</span>
        <span>D / → Move Right</span>
        <span>W / ↑ Move Up</span>
        <span>S / ↓ Move Down</span>
        <span>E Interact</span>
        <span>Space Sit / Stand</span>
      </div>
    </section>
  );
}
