import type { Cat } from '../types/game';

export const defaultCat: Cat = {
  id: 'mew',
  name: 'Mew',
  mood: 'idle',
  sprite: {
    variant: 'gray',
    sourceWidth: 635,
    sourceHeight: 620,
    widthPercent: 18.5,
    minDisplayWidth: 72,
    maxDisplayWidth: 132,
    restingDisplayScale: 0.84,
    collisionBox: {
      offsetX: -4,
      offsetY: -4,
      width: 8,
      height: 5,
    },
    showDebugOutline: false,
  },
};
