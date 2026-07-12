export const DEFAULT_ROOM_NAME = 'Meow Meow Room';
export const MAX_ROOM_NAME_LENGTH = 30;

export function validateRoomName(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 'Room name cannot be empty.';
  }

  if (trimmedValue.length > MAX_ROOM_NAME_LENGTH) {
    return `Room name must be ${MAX_ROOM_NAME_LENGTH} characters or fewer.`;
  }

  return null;
}

export function normalizeRoomName(value: unknown): string {
  if (typeof value !== 'string') {
    return DEFAULT_ROOM_NAME;
  }

  const trimmedValue = value.trim();

  return trimmedValue || DEFAULT_ROOM_NAME;
}
