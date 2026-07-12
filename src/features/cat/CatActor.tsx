import { getFurnitureItem } from '../../data/furniture';
import type { CatBehaviorSnapshot } from '../../types/catBehavior';
import type {
  Cat,
  PlacedFurniture,
} from '../../types/game';
import styles from './CatActor.module.css';
import { CatSprite } from './CatSprite';

interface CatActorProps {
  cat: Cat;
  behavior: CatBehaviorSnapshot;
  placedFurniture: PlacedFurniture[];
  renderOrder: number;
}

function getRestInteraction(
  behavior: CatBehaviorSnapshot,
  placedFurniture: PlacedFurniture[],
) {
  if (behavior.state !== 'resting' || !behavior.currentInteractionItemId) {
    return undefined;
  }

  const placedItem = placedFurniture.find(
    (item) => item.furnitureId === behavior.currentInteractionItemId,
  );
  const furniture = placedItem ? getFurnitureItem(placedItem.furnitureId) : undefined;

  return furniture?.interaction;
}

export function CatActor({
  cat,
  behavior,
  placedFurniture,
  renderOrder,
}: CatActorProps) {
  const sprite = cat.sprite;
  const aspectRatio = `${sprite.sourceWidth} / ${sprite.sourceHeight}`;
  const restInteraction = getRestInteraction(behavior, placedFurniture);
  const restOffset = {
    x: restInteraction?.catOffsetX ?? 0,
    y: restInteraction?.catOffsetY ?? 0,
  };
  const responsiveRestOffsetY =
    behavior.state === 'resting'
      ? `clamp(${restOffset.y * 1.3}px, -4vw, ${restOffset.y * 0.6}px)`
      : `${restOffset.y}px`;
  const facingDirection =
    behavior.state === 'resting' && restInteraction?.catFacingDirection
      ? restInteraction.catFacingDirection
      : behavior.facingDirection;
  const displayWidth =
    behavior.state === 'resting'
      ? `clamp(${sprite.minDisplayWidth * sprite.restingDisplayScale}px, ${sprite.widthPercent * sprite.restingDisplayScale}%, ${sprite.maxDisplayWidth * sprite.restingDisplayScale}px)`
      : `clamp(${sprite.minDisplayWidth}px, ${sprite.widthPercent}%, ${sprite.maxDisplayWidth}px)`;

  return (
    <div
      className={`${styles.actor} ${sprite.showDebugOutline ? styles.debugOutline : ''}`}
      style={{
        left: `calc(${behavior.x}% + ${restOffset.x}px)`,
        top: `calc(${behavior.y}% + ${responsiveRestOffsetY})`,
        width: displayWidth,
        aspectRatio,
        zIndex: renderOrder,
      }}
      aria-label={`${cat.name} is ${behavior.state}`}
    >
      <CatSprite
        behaviorState={behavior.state}
        facingDirection={facingDirection}
        sourceWidth={sprite.sourceWidth}
        sourceHeight={sprite.sourceHeight}
        variant={sprite.variant}
      />
      {sprite.showDebugOutline ? <span className={styles.anchorPoint} /> : null}
    </div>
  );
}
