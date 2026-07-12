export type FurnitureId = 'cat-cushion' | 'cat-cushion-pink';

export type FurnitureCategory = 'comfort' | 'cushion';

export type FurnitureAssetKey = 'catCushion' | 'catCushionPink';

export type PanelView = 'room' | 'shop' | 'inventory';

export type CatVariant = 'gray';

export type CatSpriteKey = 'idle' | 'walk1' | 'walk2' | 'sit';

export type CatBehaviorState = 'idle' | 'walking' | 'resting';

export type FacingDirection = 'left' | 'right';

export interface RoomWalkableArea {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface CollisionBox {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

export interface FurniturePlacement {
  x: number;
  y: number;
  width: number;
  zIndex: number;
}

export interface CatPosition {
  leftPercent: number;
  floorOffsetPx: number;
}

export interface CatSpriteConfig {
  variant: CatVariant;
  sourceWidth: number;
  sourceHeight: number;
  widthPercent: number;
  minDisplayWidth: number;
  maxDisplayWidth: number;
  restingDisplayScale: number;
  collisionBox: CollisionBox;
  showDebugOutline: boolean;
}

export interface Cat {
  id: string;
  name: string;
  mood: 'idle';
  sprite: CatSpriteConfig;
}

export interface FurnitureItem {
  id: FurnitureId;
  name: string;
  description: string;
  price: number;
  category: FurnitureCategory;
  assetKey: FurnitureAssetKey;
  sourceWidth: number;
  sourceHeight: number;
  placement: {
    positionId: string;
    x: number;
    y: number;
    width: number;
    zIndex: number;
  };
  rendering?: {
    depthAnchorOffsetY: number;
  };
  interaction?: {
    type: 'rest';
    range: number;
    catOffsetX: number;
    catOffsetY: number;
    catFacingDirection?: FacingDirection;
    catRenderOffsetX?: number;
    catRenderOffsetY?: number;
  };
  collision?: CollisionBox & {
    solid: boolean;
  };
}

export interface InventoryItem {
  furnitureId: FurnitureId;
  quantity: number;
}

export interface PlacedFurniture {
  instanceId: string;
  furnitureId: FurnitureId;
  positionId: string;
  placement: FurniturePlacement;
}

export interface GameState {
  coins: number;
  roomName: string;
  cat: Cat;
  inventory: InventoryItem[];
  placedFurniture: PlacedFurniture[];
  activePanel: PanelView;
}
