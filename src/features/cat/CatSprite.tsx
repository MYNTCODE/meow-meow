import { useEffect, useMemo, useState } from 'react';
import { getCatAsset } from '../../data/assets';
import type { PlayFrameIndex } from './playAnimation';
import type {
  CatBehaviorState,
  CatSpriteKey,
  CatVariant,
  FacingDirection,
} from '../../types/game';
import styles from './CatSprite.module.css';

const WALK_FRAME_MS = 220;
const EAT_FRAME_MS = 300;
interface CatSpriteProps {
  behaviorState: CatBehaviorState;
  facingDirection: FacingDirection;
  playFrameIndex?: PlayFrameIndex;
  sourceWidth: number;
  sourceHeight: number;
  variant: CatVariant;
}

function getSpriteKey(behaviorState: CatBehaviorState, walkFrame: 0 | 1): CatSpriteKey {
  if (behaviorState === 'walking') {
    return walkFrame === 0 ? 'walk1' : 'walk2';
  }

  if (behaviorState === 'eating') {
    return walkFrame === 0 ? 'eat1' : 'eat2';
  }

  if (behaviorState === 'playing') {
    return walkFrame === 0 ? 'play1' : 'play2';
  }

  if (behaviorState === 'resting') {
    return 'sit';
  }

  return 'idle';
}

export function CatSprite({
  behaviorState,
  facingDirection,
  playFrameIndex,
  sourceWidth,
  sourceHeight,
  variant,
}: CatSpriteProps) {
  const [walkFrame, setWalkFrame] = useState<0 | 1>(0);
  const [failedSprites, setFailedSprites] = useState<Partial<Record<CatSpriteKey, true>>>(
    {},
  );
  const idleAsset = getCatAsset(variant, 'idle');
  const spriteFrameIndex = behaviorState === 'playing' ? (playFrameIndex ?? 0) : walkFrame;
  const spriteKey = getSpriteKey(behaviorState, spriteFrameIndex);
  const fallbackSpriteKey =
    behaviorState === 'eating'
      ? spriteKey === 'eat1'
        ? 'eat2'
        : 'eat1'
      : behaviorState === 'playing'
        ? spriteKey === 'play1'
          ? 'play2'
          : 'play1'
        : 'idle';
  const spriteAsset = failedSprites[spriteKey]
    ? failedSprites[fallbackSpriteKey]
      ? idleAsset
      : getCatAsset(variant, fallbackSpriteKey)
    : getCatAsset(variant, spriteKey);
  const aspectRatio = useMemo(
    () => `${sourceWidth} / ${sourceHeight}`,
    [sourceHeight, sourceWidth],
  );

  useEffect(() => {
    if (
      behaviorState !== 'walking' && behaviorState !== 'eating'
    ) {
      setWalkFrame(0);
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setWalkFrame((currentFrame) => (currentFrame === 0 ? 1 : 0));
    }, behaviorState === 'eating' ? EAT_FRAME_MS : WALK_FRAME_MS);

    return () => window.clearInterval(intervalId);
  }, [behaviorState]);

  return (
    <div
      className={styles.spriteWrap}
      style={{
        aspectRatio,
        transform: `scaleX(${facingDirection === 'left' ? -1 : 1})`,
      }}
    >
      <img
        className={styles.catImage}
        src={spriteAsset}
        alt=""
        draggable="false"
        onError={() =>
          setFailedSprites((currentFailedSprites) => ({
            ...currentFailedSprites,
            [spriteKey]: true,
          }))
        }
      />
    </div>
  );
}
