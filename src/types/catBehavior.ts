import type { CatBehaviorState, FacingDirection, FurnitureId } from './game';

export interface CatBehaviorSnapshot {
  state: CatBehaviorState;
  x: number;
  y: number;
  facingDirection: FacingDirection;
  currentPointId: string;
  currentInteractionItemId?: FurnitureId;
}

export interface CatBehaviorCommands {
  interactNearest: () => void;
  sit: () => void;
  stand: () => void;
}

export interface CatCommandState {
  canInteract: boolean;
  canSit: boolean;
  canStand: boolean;
  isWalking: boolean;
}

export type DirectionInputState = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};
