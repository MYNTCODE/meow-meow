import styles from './MobileControls.module.css';

type Direction = 'left' | 'right' | 'up' | 'down';

interface DirectionButtonBinding {
  isPressed: boolean;
  disabled: boolean;
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
  direction,
  binding,
}: {
  direction: Direction;
  binding: DirectionButtonBinding;
}) {
  const ariaLabel = {
    up: 'Move up',
    down: 'Move down',
    left: 'Move left',
    right: 'Move right',
  }[direction];
  const directionClassName = {
    up: styles.upButton,
    down: styles.downButton,
    left: styles.leftButton,
    right: styles.rightButton,
  }[direction];

  return (
    <button
      type="button"
      className={`${styles.pixelControlButton} ${styles.directionButton} ${directionClassName}`}
      aria-label={ariaLabel}
      aria-pressed={binding.isPressed}
      disabled={binding.disabled}
      onPointerDown={binding.onPointerDown}
      onPointerUp={binding.onPointerUp}
      onPointerCancel={binding.onPointerCancel}
      onLostPointerCapture={binding.onLostPointerCapture}
    >
      <span className={styles.buttonBase} aria-hidden="true" />
      <span className={styles.buttonFace} aria-hidden="true">
        <span className={styles.pixelDecoration} aria-hidden="true" />
        <span className={styles.arrowIcon} aria-hidden="true">
          <svg viewBox="0 0 20 20" focusable="false" aria-hidden="true">
            {direction === 'up' ? (
              <polygon points="10,2 18,10 13,10 13,18 7,18 7,10 2,10" />
            ) : null}
            {direction === 'down' ? (
              <polygon points="10,18 2,10 7,10 7,2 13,2 13,10 18,10" />
            ) : null}
            {direction === 'left' ? (
              <polygon points="2,10 10,2 10,7 18,7 18,13 10,13 10,18" />
            ) : null}
            {direction === 'right' ? (
              <polygon points="18,10 10,18 10,13 2,13 2,7 10,7 10,2" />
            ) : null}
          </svg>
        </span>
        <span className={styles.pixelDecorationLower} aria-hidden="true" />
      </span>
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
        <DirectionButton direction="up" binding={up} />
        <DirectionButton direction="left" binding={left} />
        <DirectionButton direction="down" binding={down} />
        <DirectionButton direction="right" binding={right} />
      </div>
      <button
        type="button"
        className={`${styles.pixelControlButton} ${styles.interactButton}`}
        aria-pressed={interactButton.isPressed}
        disabled={interactButton.disabled}
        onPointerDown={interactButton.onPointerDown}
        onPointerUp={interactButton.onPointerUp}
        onPointerCancel={interactButton.onPointerCancel}
        onLostPointerCapture={interactButton.onLostPointerCapture}
      >
        <span className={styles.buttonBase} aria-hidden="true" />
        <span className={styles.buttonFace}>
          Interact
          <span className={styles.pixelDecoration} aria-hidden="true" />
          <span className={styles.pixelDecorationLower} aria-hidden="true" />
        </span>
      </button>
    </section>
  );
}
