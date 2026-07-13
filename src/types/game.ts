export type FurnitureId = 'cat-cushion' | 'cat-cushion-pink' | 'food-bowl' | 'cat-ball';

export type FurnitureCategory = 'comfort' | 'cushion' | 'food' | 'toy';
export type ItemSlot = 'bed' | 'toy' | 'food' | 'window' | 'wallDecor' | 'floorDecor';
export type EquippedItems = Partial<Record<ItemSlot, FurnitureId>>;

export type FurnitureAssetKey =
  | 'catCushion'
  | 'catCushionPink'
  | 'foodBowlEmpty'
  | 'foodBowlFull'
  | 'catBall';

export type FoodBowlState = 'empty' | 'full';

export type FurnitureRestInteraction = {
  type: 'rest';
  range: number;
  anchorOffsetX: number;
  anchorOffsetY: number;
  catOffsetX: number;
  catOffsetY: number;
  catFacingDirection?: FacingDirection;
  catScale?: number;
  catRenderOffsetX?: number;
  catRenderOffsetY?: number;
};

export type FurnitureEatInteraction = {
  type: 'eat';
  range: number;
  bowlAnchorOffsetX: number;
  bowlAnchorOffsetY: number;
  catStandOffsetX: number;
  catStandOffsetY: number;
  catFacingDirection: FacingDirection;
  eatSide: 'left' | 'right' | 'top' | 'bottom';
  mouthOffsetX?: number;
  mouthOffsetY?: number;
  eatRenderOffsetX?: number;
  eatRenderOffsetY?: number;
  eatCatScale?: number;
  postEatRenderOffsetX?: number;
  postEatRenderOffsetY?: number;
  postEatTabletRenderOffsetX?: number;
  postEatTabletRenderOffsetY?: number;
  postEatTabletRenderScale?: number;
  postEatMobileRenderOffsetX?: number;
  postEatMobileRenderOffsetY?: number;
  postEatMobileRenderScale?: number;
};

export type FurniturePlayInteraction = {
  type: 'play';
  range: number;
  toyAnchorOffsetX: number;
  toyAnchorOffsetY: number;
  catOffsetX: number;
  catOffsetY: number;
  catFacingDirection?: FacingDirection;
  catScale?: number;
  catRenderOffsetX?: number;
  catRenderOffsetY?: number;
};

export type FurnitureInteraction =
  | FurnitureRestInteraction
  | FurnitureEatInteraction
  | FurniturePlayInteraction;

export type OpenPanel = 'shop' | 'inventory' | null;

export type CatVariant = 'gray';

export type CatSpriteKey =
  | 'idle'
  | 'walk1'
  | 'walk2'
  | 'sit'
  | 'eat1'
  | 'eat2'
  | 'play1'
  | 'play2';

export type CatBehaviorState = 'idle' | 'walking' | 'resting' | 'eating' | 'playing';

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
  slot: ItemSlot;
  assetKey: FurnitureAssetKey;
  draggable?: boolean;
  sourceWidth: number;
  sourceHeight: number;
  placement: {
    positionId: ItemSlot;
    width: number;
    zIndex: number;
  };
  rendering?: {
    scale?: number;
    depthAnchorOffsetY: number;
  };
  interaction?: FurnitureInteraction;
  statefulAssets?: {
    foodState?: Record<FoodBowlState, FurnitureAssetKey>;
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
  positionId: ItemSlot;
  placement: FurniturePlacement;
  interactionState?: {
    foodState?: FoodBowlState;
  };
}

export interface GameState {
  coins: number;
  roomName: string;
  cat: Cat;
  inventory: InventoryItem[];
  equippedItems: EquippedItems;
  placedFurniture: PlacedFurniture[];
  openPanel: OpenPanel;
}
