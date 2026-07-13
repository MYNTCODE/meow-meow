import styles from './MobileControls.module.css';

type Direction = 'left' | 'right' | 'up' | 'down';

interface DirectionButtonBinding {
  isPressed: boolean;
  onPointerDown: React.PointerEventHandler<HTMLButtonElement>;
  onPointerUp: React.PointerEventHandler<HTMLButtonElement>;
  onPointerCancel: React.PointerEventHandler<HTMLButtonElement>;
  onLostPointerCapture: React.PointerEventHandler<HTMLButtonElement>;
}

interface InteractButtonBinding extends DirectionButtonBinding {}

interface MobileControlsProps {
  bindDirectionButton: (direction: Direction) => DirectionButtonBinding;
  interactButton: InteractButtonBinding;
}

function DirectionButton({
  label,
  binding,
}: {
  label: string;
  binding: DirectionButtonBinding;
}) {
  return (
    <button
      type="button"
      className={`${styles.button} ${binding.isPressed ? styles.pressed : ''}`}
      aria-pressed={binding.isPressed}
      onPointerDown={binding.onPointerDown}
      onPointerUp={binding.onPointerUp}
      onPointerCancel={binding.onPointerCancel}
      onLostPointerCapture={binding.onLostPointerCapture}
    >
      {label}
    </button>
  );
}

export function MobileControls({
  bindDirectionButton,
  interactButton,
}: MobileControlsProps) {
  const left = bindDirectionButton('left');
  const right = bindDirectionButton('right');
  const up = bindDirectionButton('up');
  const down = bindDirectionButton('down');

  return (
    <section className={styles.wrap} aria-label="Touch controls">
      <div className={styles.mobileDpad} aria-label="Movement controls">
        <div className={styles.upSlot}>
          <DirectionButton label="Up" binding={up} />
        </div>
        <div className={styles.leftSlot}>
          <DirectionButton label="Left" binding={left} />
        </div>
        <div className={styles.downSlot}>
          <DirectionButton label="Down" binding={down} />
        </div>
        <div className={styles.rightSlot}>
          <DirectionButton label="Right" binding={right} />
        </div>
      </div>
      <button
        type="button"
        className={`${styles.button} ${styles.interactButton} ${interactButton.isPressed ? styles.pressed : ''}`}
        aria-pressed={interactButton.isPressed}
        onPointerDown={interactButton.onPointerDown}
        onPointerUp={interactButton.onPointerUp}
        onPointerCancel={interactButton.onPointerCancel}
        onLostPointerCapture={interactButton.onLostPointerCapture}
      >
        Interact
      </button>
    </section>
  );
}
