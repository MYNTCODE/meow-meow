import type { FurnitureAssetKey } from '../types/game';
import type { FurnitureItem, PlacedFurniture } from '../types/game';

export const gameAssets = {
  cats: {
    gray: {
      idle: '/assets/cats/gray/cat-idle.png',
      walk1: '/assets/cats/gray/cat-walk-1.png',
      walk2: '/assets/cats/gray/cat-walk-2.png',
      sit: '/assets/cats/gray/cat-sit.png',
      eat1: '/assets/cats/gray/cat-eat-1.png',
      eat2: '/assets/cats/gray/cat-eat-2.png',
      play1: '/assets/cats/gray/cat-play-1.png',
      play2: '/assets/cats/gray/cat-play-2.png',
    },
  },
  rooms: {
    starterRoom: '/assets/rooms/starter-room.png',
  },
  furniture: {
    catCushion: '/assets/items/cat-cushion.png',
    catCushionPink: '/assets/items/cat-cushion-pink.png',
    foodBowlEmpty: '/assets/items/food-bowl-empty.png',
    foodBowlFull: '/assets/items/food-bowl-full.png',
    catBall: '/assets/items/cat-ball.png',
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

export function getFurnitureAssetForPlacement(
  furniture: FurnitureItem,
  placedFurniture: PlacedFurniture,
) {
  const foodState = placedFurniture.interactionState?.foodState;
  const foodAssetKey = furniture.statefulAssets?.foodState?.[foodState ?? 'full'];

  return getFurnitureAsset(foodAssetKey ?? furniture.assetKey);
}
