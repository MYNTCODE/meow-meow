import type { ItemSlot } from '../types/game';

export const ROOM_SLOT_POSITIONS: Record<ItemSlot, { x: number; y: number }> = {
  bed: { x: 45, y: 73 },
  toy: { x: 68, y: 84 },
  food: { x: 31, y: 83 },
  window: { x: 78, y: 38 },
  wallDecor: { x: 49, y: 33 },
  floorDecor: { x: 56, y: 84 },
};

export const DECOR_SLOTS: ItemSlot[] = ['window', 'wallDecor', 'floorDecor'];

export interface RoomPlacementAnchor {
  id: string;
  slot: ItemSlot;
  x: number;
  y: number;
  snapRadius: number;
  hint: 'floor' | 'wall';
}

export const ROOM_PLACEMENT_ANCHORS: RoomPlacementAnchor[] = [
  
  { id: 'bed-left', slot: 'bed', x: 24, y: 76, snapRadius: 11, hint: 'floor' },
  { id: 'bed-center', slot: 'bed', x: 50, y: 72, snapRadius: 11, hint: 'floor' },
  { id: 'bed-right', slot: 'bed', x: 75, y: 76, snapRadius: 11, hint: 'floor' },

 
  { id: 'food-left', slot: 'food', x: 22, y: 86, snapRadius: 9, hint: 'floor' },
  { id: 'food-center', slot: 'food', x: 46, y: 82, snapRadius: 9, hint: 'floor' },
  { id: 'food-right', slot: 'food', x: 72, y: 87, snapRadius: 9, hint: 'floor' },

 
  { id: 'toy-far-left', slot: 'toy', x: 17, y: 79, snapRadius: 9, hint: 'floor' },
  { id: 'toy-left', slot: 'toy', x: 34, y: 88, snapRadius: 9, hint: 'floor' },
  { id: 'toy-center', slot: 'toy', x: 54, y: 80, snapRadius: 9, hint: 'floor' },
  { id: 'toy-right', slot: 'toy', x: 72, y: 88, snapRadius: 9, hint: 'floor' },
  { id: 'toy-far-right', slot: 'toy', x: 87, y: 78, snapRadius: 9, hint: 'floor' },

  
  { id: 'window-left', slot: 'window', x: 28, y: 34, snapRadius: 9, hint: 'wall' },
  { id: 'window-center', slot: 'window', x: 52, y: 31, snapRadius: 9, hint: 'wall' },
  { id: 'window-right', slot: 'window', x: 78, y: 35, snapRadius: 9, hint: 'wall' },

  
  { id: 'wall-far-left', slot: 'wallDecor', x: 18, y: 39, snapRadius: 8, hint: 'wall' },
  { id: 'wall-left', slot: 'wallDecor', x: 36, y: 29, snapRadius: 8, hint: 'wall' },
  { id: 'wall-center', slot: 'wallDecor', x: 53, y: 40, snapRadius: 8, hint: 'wall' },
  { id: 'wall-right', slot: 'wallDecor', x: 69, y: 28, snapRadius: 8, hint: 'wall' },
  { id: 'wall-far-right', slot: 'wallDecor', x: 86, y: 40, snapRadius: 8, hint: 'wall' },

  
  { id: 'floor-far-left', slot: 'floorDecor', x: 16, y: 84, snapRadius: 9, hint: 'floor' },
  { id: 'floor-left', slot: 'floorDecor', x: 35, y: 76, snapRadius: 9, hint: 'floor' },
  { id: 'floor-center', slot: 'floorDecor', x: 52, y: 88, snapRadius: 9, hint: 'floor' },
  { id: 'floor-right', slot: 'floorDecor', x: 70, y: 77, snapRadius: 9, hint: 'floor' },
  { id: 'floor-far-right', slot: 'floorDecor', x: 87, y: 86, snapRadius: 9, hint: 'floor' },
];

export function getRoomPlacementAnchors(slot: ItemSlot) {
  return ROOM_PLACEMENT_ANCHORS.filter((anchor) => anchor.slot === slot);
}
