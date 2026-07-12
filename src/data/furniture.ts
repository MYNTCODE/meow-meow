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
