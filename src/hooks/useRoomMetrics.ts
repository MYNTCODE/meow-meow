import { useEffect, useState, type RefObject } from 'react';
import type { RoomRect } from '../utils/roomCoordinates';
import { getRoomContentRect, getRoomScale } from '../utils/roomCoordinates';

export interface RoomMetrics {
  roomRect: RoomRect | null;
  scaleX: number;
  scaleY: number;
  isReady: boolean;
}

export function useRoomMetrics(roomRef: RefObject<HTMLElement | null>) {
  const [roomRect, setRoomRect] = useState<RoomRect | null>(null);

  useEffect(() => {
    const roomElement = roomRef.current;

    if (!roomElement) {
      setRoomRect(null);
      return undefined;
    }

    function updateRoomRect() {
      setRoomRect(getRoomContentRect(roomElement!));
    }

    updateRoomRect();

    const resizeObserver = new ResizeObserver(updateRoomRect);
    resizeObserver.observe(roomElement);

    window.addEventListener('resize', updateRoomRect);
    window.addEventListener('orientationchange', updateRoomRect);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateRoomRect);
      window.removeEventListener('orientationchange', updateRoomRect);
    };
  }, [roomRef]);

  const scale = roomRect ? getRoomScale(roomRect) : { x: 1, y: 1 };

  return {
    roomRect,
    scaleX: scale.x,
    scaleY: scale.y,
    isReady: roomRect !== null,
  } satisfies RoomMetrics;
}
