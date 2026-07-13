import { getFurnitureItem } from '../../data/furniture';
import type { CSSProperties } from 'react';
import type { PlayFrameIndex } from './playAnimation';
import type { CatBehaviorSnapshot } from '../../types/catBehavior';
import type {
  Cat,
  PlacedFurniture,
} from '../../types/game';
import {
  getEatInteractionPosition,
  getPlayInteractionPosition,
  getRestInteractionPosition,
} from '../../utils/collision';
import styles from './CatActor.module.css';
import { CatSprite } from './CatSprite';

interface CatActorProps {
  cat: Cat;
  behavior: CatBehaviorSnapshot;
  placedFurniture: PlacedFurniture[];
  playFrameIndex: PlayFrameIndex;
  renderOrder: number;
}

function getCurrentInteraction(
  behavior: CatBehaviorSnapshot,
  placedFurniture: PlacedFurniture[],
) {
  const interactionType =
    behavior.currentInteractionType ??
    (behavior.state === 'idle' &&
    (behavior.lastInteractionType === 'eat' || behavior.lastInteractionType === 'play')
      ? behavior.lastInteractionType
      : undefined) ??
    (behavior.state === 'resting'
      ? 'rest'
      : behavior.state === 'eating'
        ? 'eat'
        : behavior.state === 'playing'
          ? 'play'
        : undefined);

  const interactionItemId = behavior.currentInteractionItemId ?? behavior.lastInteractionItemId;
  const interactionInstanceId =
    behavior.currentInteractionInstanceId ?? behavior.lastInteractionInstanceId;

  if (!interactionType || !interactionItemId) {
    return undefined;
  }

  const placedItem = placedFurniture.find(
    (item) =>
      item.instanceId === interactionInstanceId || item.furnitureId === interactionItemId,
  );
  const furniture = placedItem ? getFurnitureItem(placedItem.furnitureId) : undefined;

  if (!placedItem || !furniture?.interaction || furniture.interaction.type !== interactionType) {
    return undefined;
  }

  if (interactionType === 'rest') {
    const restPosition = getRestInteractionPosition(placedItem);

    return restPosition
      ? {
          placedItem,
          furniture,
          interaction: restPosition.interaction,
          position: restPosition,
          renderPhase: 'rest' as const,
        }
      : undefined;
  }

  if (interactionType === 'eat') {
    const eatPosition = getEatInteractionPosition(placedItem);

    return eatPosition
      ? {
          placedItem,
          furniture,
          interaction: eatPosition.interaction,
          position: eatPosition,
          renderPhase:
            behavior.state === 'idle' && behavior.lastInteractionType === 'eat'
              ? ('postEat' as const)
              : ('eat' as const),
        }
      : undefined;
  }

  const playPosition = getPlayInteractionPosition(placedItem);

  return playPosition
    ? {
        placedItem,
        furniture,
        interaction: playPosition.interaction,
        position: playPosition,
        renderPhase: 'play' as const,
      }
    : undefined;
}

export function CatActor({
  cat,
  behavior,
  placedFurniture,
  playFrameIndex,
  renderOrder,
}: CatActorProps) {
  const sprite = cat.sprite;
  const aspectRatio = `${sprite.sourceWidth} / ${sprite.sourceHeight}`;
  const currentInteraction = getCurrentInteraction(behavior, placedFurniture);
  const isResting = behavior.state === 'resting';
  const isEating = behavior.state === 'eating';
  const isPlaying = behavior.state === 'playing';
  const isPostEating = behavior.state === 'idle' && behavior.lastInteractionType === 'eat';
  const facingDirection =
    (isResting || isEating || isPlaying) &&
    currentInteraction?.interaction.catFacingDirection
      ? currentInteraction.interaction.catFacingDirection
      : behavior.facingDirection;
  const interactionScale =
    isResting && currentInteraction?.interaction.type === 'rest'
      ? sprite.restingDisplayScale
      : 1;
  const displayWidth = `clamp(${sprite.minDisplayWidth * interactionScale}px, ${sprite.widthPercent * interactionScale}%, ${sprite.maxDisplayWidth * interactionScale}px)`;
  const interactionShiftStyle: CSSProperties | undefined =
    currentInteraction?.interaction.type === 'eat' && (isEating || isPostEating)
      ? ({
          ['--eat-render-offset-x' as '--eat-render-offset-x']:
            `${isPostEating
              ? currentInteraction.interaction.postEatRenderOffsetX ?? 0
              : currentInteraction.interaction.eatRenderOffsetX ?? 0}px`,
          ['--eat-render-offset-y' as '--eat-render-offset-y']:
            `${isPostEating
              ? currentInteraction.interaction.postEatRenderOffsetY ?? 0
              : currentInteraction.interaction.eatRenderOffsetY ?? 0}px`,
          ['--eat-render-scale' as '--eat-render-scale']:
            `${isPostEating ? 1 : currentInteraction.interaction.eatCatScale ?? 1}`,
          ['--post-eat-render-offset-x' as '--post-eat-render-offset-x']:
            `${currentInteraction.interaction.postEatRenderOffsetX ?? 0}px`,
          ['--post-eat-render-offset-y' as '--post-eat-render-offset-y']:
            `${currentInteraction.interaction.postEatRenderOffsetY ?? 0}px`,
          ['--post-eat-tablet-render-offset-x' as '--post-eat-tablet-render-offset-x']:
            `${currentInteraction.interaction.postEatTabletRenderOffsetX ?? 0}px`,
          ['--post-eat-tablet-render-offset-y' as '--post-eat-tablet-render-offset-y']:
            `${currentInteraction.interaction.postEatTabletRenderOffsetY ?? 0}px`,
          ['--post-eat-tablet-render-scale' as '--post-eat-tablet-render-scale']:
            `${currentInteraction.interaction.postEatTabletRenderScale ?? 1}`,
          ['--post-eat-mobile-render-offset-x' as '--post-eat-mobile-render-offset-x']:
            `${currentInteraction.interaction.postEatMobileRenderOffsetX ?? 0}px`,
          ['--post-eat-mobile-render-offset-y' as '--post-eat-mobile-render-offset-y']:
            `${currentInteraction.interaction.postEatMobileRenderOffsetY ?? 0}px`,
          ['--post-eat-mobile-render-scale' as '--post-eat-mobile-render-scale']:
            `${currentInteraction.interaction.postEatMobileRenderScale ?? 1}`,
        } as unknown as CSSProperties)
      : currentInteraction?.interaction.type === 'play' && isPlaying
        ? ({
            ['--eat-render-offset-x' as '--eat-render-offset-x']:
              `${currentInteraction.interaction.catRenderOffsetX ?? 0}px`,
            ['--eat-render-offset-y' as '--eat-render-offset-y']:
              `${currentInteraction.interaction.catRenderOffsetY ?? 0}px`,
            ['--eat-render-scale' as '--eat-render-scale']:
              `${currentInteraction.interaction.catScale ?? 1}`,
          } as unknown as CSSProperties)
      : undefined;

  return (
    <div
      className={`${styles.actor} ${sprite.showDebugOutline ? styles.debugOutline : ''}`}
      style={{
        left: `calc(${behavior.x}% + ${
          isResting && currentInteraction?.interaction.type === 'rest'
            ? currentInteraction.interaction.catRenderOffsetX ?? 0
            : 0
        }px)`,
        top:
          isResting && currentInteraction?.interaction.type === 'rest'
            ? `calc(${behavior.y}% + clamp(${(currentInteraction.interaction.catRenderOffsetY ?? 0) * 1.3}px, -4vw, ${(currentInteraction.interaction.catRenderOffsetY ?? 0) * 0.6}px))`
            : `calc(${behavior.y}% + 0px)`,
        width: displayWidth,
        aspectRatio,
        zIndex: renderOrder,
      }}
      aria-label={`${cat.name} is ${behavior.state}`}
    >
      <div
        className={isEating || isPostEating || isPlaying ? styles.eatRenderShift : undefined}
        style={interactionShiftStyle}
        data-phase={isPostEating ? 'postEat' : isEating ? 'eat' : isPlaying ? 'play' : undefined}
      >
        <CatSprite
          behaviorState={behavior.state}
          facingDirection={facingDirection}
          playFrameIndex={playFrameIndex}
          sourceWidth={sprite.sourceWidth}
          sourceHeight={sprite.sourceHeight}
          variant={sprite.variant}
        />
      </div>
      {sprite.showDebugOutline ? <span className={styles.anchorPoint} /> : null}
    </div>
  );
}
