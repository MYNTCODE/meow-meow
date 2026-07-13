export interface RoomRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface RoomPoint {
  x: number;
  y: number;
}

export interface RoomRectBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// Room gameplay coordinates are normalized percentages in the inclusive 0-100 space.
// RoomRect values represent the rendered room content box, not the outer border box.
export const ROOM_LOGICAL_SIZE = {
  width: 100,
  height: 100,
} as const;

export function getRoomContentRect(roomElement: HTMLElement): RoomRect {
  const rect = roomElement.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(roomElement);
  const borderLeft = Number.parseFloat(computedStyle.borderLeftWidth) || 0;
  const borderTop = Number.parseFloat(computedStyle.borderTopWidth) || 0;

  return {
    left: rect.left + borderLeft,
    top: rect.top + borderTop,
    width: roomElement.clientWidth,
    height: roomElement.clientHeight,
  };
}

export function getRoomScale(roomRect: RoomRect) {
  return {
    x: roomRect.width / ROOM_LOGICAL_SIZE.width,
    y: roomRect.height / ROOM_LOGICAL_SIZE.height,
  };
}

export function screenToRoomPoint(roomRect: RoomRect, clientX: number, clientY: number): RoomPoint {
  return {
    x: ((clientX - roomRect.left) / roomRect.width) * ROOM_LOGICAL_SIZE.width,
    y: ((clientY - roomRect.top) / roomRect.height) * ROOM_LOGICAL_SIZE.height,
  };
}

export function roomToScreenPoint(roomRect: RoomRect, point: RoomPoint): RoomPoint {
  return {
    x: roomRect.left + (point.x / ROOM_LOGICAL_SIZE.width) * roomRect.width,
    y: roomRect.top + (point.y / ROOM_LOGICAL_SIZE.height) * roomRect.height,
  };
}

export function roomRectToScreenRect(roomRect: RoomRect, rect: RoomRectBounds) {
  return {
    left: roomRect.left + (rect.left / ROOM_LOGICAL_SIZE.width) * roomRect.width,
    top: roomRect.top + (rect.top / ROOM_LOGICAL_SIZE.height) * roomRect.height,
    right: roomRect.left + (rect.right / ROOM_LOGICAL_SIZE.width) * roomRect.width,
    bottom: roomRect.top + (rect.bottom / ROOM_LOGICAL_SIZE.height) * roomRect.height,
  };
}
