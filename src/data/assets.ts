import type { FurnitureAssetKey } from '../types/game';

export const gameAssets = {
  cats: {
    gray: {
      idle: '/assets/cats/gray/cat-idle.png',
      walk1: '/assets/cats/gray/cat-walk-1.png',
      walk2: '/assets/cats/gray/cat-walk-2.png',
      sit: '/assets/cats/gray/cat-sit.png',
    },
  },
  rooms: {
    starterRoom: '/assets/rooms/starter-room.png',
  },
  furniture: {
    catCushion: '/assets/items/cat-cushion.png',
    catCushionPink: '/assets/items/cat-cushion-pink.png',
  },
} as const;

export function getCatAsset(
  variant: keyof typeof gameAssets.cats,
  spriteKey: keyof (typeof gameAssets.cats)[keyof typeof gameAssets.cats],
) {
  return gameAssets.cats[variant][spriteKey] ?? gameAssets.cats[variant].idle;
}

export function getFurnitureAsset(assetKey: FurnitureAssetKey) {
  return gameAssets.furniture[assetKey];
}
