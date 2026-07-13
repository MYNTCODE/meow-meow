export type PlayFrameIndex = 0 | 1;

export const PLAY_FRAME_DURATION_MS = 420;

export const CAT_BALL_PLAY_OFFSETS: Record<
  PlayFrameIndex,
  {
    translateX: number;
    rotation: number;
  }
> = {
  0: {
    translateX: -3,
    rotation: -2,
  },
  1: {
    translateX: 3,
    rotation: 2,
  },
};
