import type { FurnitureItem } from '../types/game';

export const FURNITURE_ITEMS: FurnitureItem[] = [
  {
    id: 'cat-cushion',
    name: 'Cat Cushion',
    description: 'A soft little cushion for the room floor.',
    price: 25,
    category: 'comfort',
    assetKey: 'catCushion',
    sourceWidth: 2390,
    sourceHeight: 1792,
    placement: {
      positionId: 'floor-center',
      x: 50,
      y: 73,
      width: 18,
      zIndex: 2,
    },
    rendering: {
      depthAnchorOffsetY: -8,
    },
    interaction: {
      type: 'rest',
      range: 20,
      anchorOffsetX: 0,
      anchorOffsetY: 0,
      catOffsetX: 0,
      catOffsetY: -1.6,
      catFacingDirection: 'right',
      catRenderOffsetY: -26,
    },
    collision: {
      solid: true,
      offsetX: -9,
      offsetY: -4,
      width: 18,
      height: 8,
    },
  },
  {
    id: 'cat-cushion-pink',
    name: 'Pink Cat Cushion',
    description: 'A soft pink cushion for a cozy floor spot.',
    price: 30,
    category: 'cushion',
    assetKey: 'catCushionPink',
    sourceWidth: 1169,
    sourceHeight: 838,
    placement: {
      positionId: 'floor-center',
      x: 50,
      y: 73,
      width: 18,
      zIndex: 2,
    },
    rendering: {
      depthAnchorOffsetY: -8,
    },
    interaction: {
      type: 'rest',
      range: 20,
      anchorOffsetX: 0,
      anchorOffsetY: 0,
      catOffsetX: 0,
      catOffsetY: -1.6,
      catFacingDirection: 'right',
      catRenderOffsetY: -26,
    },
    collision: {
      solid: true,
      offsetX: -9,
      offsetY: 0,
      width: 18,
      height: 14,
    },
  },
  {
    id: 'food-bowl',
    name: 'Food Bowl',
    description: 'A cozy bowl for feeding the cat.',
    price: 40,
    category: 'food',
    assetKey: 'foodBowlFull',
    draggable: true,
    sourceWidth: 492,
    sourceHeight: 312,
    placement: {
      positionId: 'floor-center',
      x: 50,
      y: 73,
      width: 20,
      zIndex: 2,
    },
    rendering: {
      scale: 0.88,
      depthAnchorOffsetY: -6,
    },
    interaction: {
      type: 'eat',
      range: 24,
      bowlAnchorOffsetX: 0,
      bowlAnchorOffsetY: -4,
      catStandOffsetX: 16,
      catStandOffsetY: -3,
      catFacingDirection: 'left',
      eatSide: 'right',
      mouthOffsetX: -8,
      mouthOffsetY: -6,
      eatRenderOffsetX: -24,
      eatRenderOffsetY: 16,
      eatCatScale: 1.28,
      postEatRenderOffsetX: 0,
      postEatRenderOffsetY: 0,
      postEatTabletRenderOffsetX: 0,
      postEatTabletRenderOffsetY: 0,
      postEatTabletRenderScale: 1,
      postEatMobileRenderOffsetX: 0,
      postEatMobileRenderOffsetY: 0,
      postEatMobileRenderScale: 1,
    },
    statefulAssets: {
      foodState: {
        full: 'foodBowlFull',
        empty: 'foodBowlEmpty',
      },
    },
    collision: {
      solid: true,
      offsetX: -8,
      offsetY: -2,
      width: 16,
      height: 8,
    },
  },
  {
    id: 'cat-ball',
    name: 'Cat Ball',
    description: 'A tiny toy ball for playful zoomies.',
    price: 35,
    category: 'toy',
    assetKey: 'catBall',
    draggable: true,
    sourceWidth: 512,
    sourceHeight: 512,
    placement: {
      positionId: 'floor-center',
      x: 50,
      y: 73,
      width: 10,
      zIndex: 2,
    },
    rendering: {
      depthAnchorOffsetY: -1,
    },
    interaction: {
      type: 'play',
      range: 18,
      toyAnchorOffsetX: 0,
      toyAnchorOffsetY: 0,
      catOffsetX: 15,
      catOffsetY: 0,
      catFacingDirection: 'left',
      catScale: 1.6,
      catRenderOffsetX: -8,
      catRenderOffsetY: 20,
    },
    collision: {
      solid: false,
      offsetX: -2,
      offsetY: -1,
      width: 4,
      height: 2,
    },
  },
];

export function getFurnitureItem(id: FurnitureItem['id']) {
  return FURNITURE_ITEMS.find((item) => item.id === id);
}

export function getFurniturePlacement(id: FurnitureItem['id'], positionId: string) {
  const furniture = getFurnitureItem(id);

  if (furniture?.placement.positionId !== positionId) {
    return undefined;
  }

  return furniture.placement;
}
