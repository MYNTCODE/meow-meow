import { useEffect, useRef, useState } from 'react';
import type {
  CatBehaviorCommands,
  CatCommandState,
  CatPressedKeys,
} from '../types/catBehavior';

interface UseCatKeyboardControlsOptions {
  commands: CatBehaviorCommands;
  commandState: CatCommandState;
}

const MOVE_LEFT_KEYS = new Set(['ArrowLeft', 'a', 'A']);
const MOVE_RIGHT_KEYS = new Set(['ArrowRight', 'd', 'D']);
const MOVE_UP_KEYS = new Set(['ArrowUp', 'w', 'W']);
const MOVE_DOWN_KEYS = new Set(['ArrowDown', 's', 'S']);
const PREVENT_SCROLL_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  ' ',
]);

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  );
}

export function useCatKeyboardControls({
  commands,
  commandState,
}: UseCatKeyboardControlsOptions): CatPressedKeys {
  const [pressedKeys, setPressedKeys] = useState<CatPressedKeys>({
    leftPressed: false,
    rightPressed: false,
    upPressed: false,
    downPressed: false,
  });
  const commandsRef = useRef(commands);
  const commandStateRef = useRef(commandState);

  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);

  useEffect(() => {
    commandStateRef.current = commandState;
  }, [commandState]);

  useEffect(() => {
    function clearPressedKeys() {
      setPressedKeys({
        leftPressed: false,
        rightPressed: false,
        upPressed: false,
        downPressed: false,
      });
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) {
        return;
      }

      if (PREVENT_SCROLL_KEYS.has(event.key)) {
        event.preventDefault();
      }

      if (MOVE_LEFT_KEYS.has(event.key)) {
        setPressedKeys((currentKeys) => ({
          ...currentKeys,
          leftPressed: true,
        }));
        return;
      }

      if (MOVE_RIGHT_KEYS.has(event.key)) {
        setPressedKeys((currentKeys) => ({
          ...currentKeys,
          rightPressed: true,
        }));
        return;
      }

      if (MOVE_UP_KEYS.has(event.key)) {
        setPressedKeys((currentKeys) => ({
          ...currentKeys,
          upPressed: true,
        }));
        return;
      }

      if (MOVE_DOWN_KEYS.has(event.key)) {
        setPressedKeys((currentKeys) => ({
          ...currentKeys,
          downPressed: true,
        }));
        return;
      }

      if (event.repeat) {
        return;
      }

      if (event.key === 'e' || event.key === 'E') {
        const currentCommands = commandsRef.current;
        const currentCommandState = commandStateRef.current;

        if (currentCommandState.canStand) {
          currentCommands.stand();
          return;
        }

        if (currentCommandState.canInteract) {
          currentCommands.interactNearest();
        }
        return;
      }

      if (event.key === ' ') {
        const currentCommands = commandsRef.current;
        const currentCommandState = commandStateRef.current;

        if (currentCommandState.canStand) {
          currentCommands.stand();
          return;
        }

        if (currentCommandState.canSit) {
          currentCommands.sit();
        }
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) {
        return;
      }

      if (PREVENT_SCROLL_KEYS.has(event.key)) {
        event.preventDefault();
      }

      if (MOVE_LEFT_KEYS.has(event.key)) {
        setPressedKeys((currentKeys) => ({
          ...currentKeys,
          leftPressed: false,
        }));
        return;
      }

      if (MOVE_RIGHT_KEYS.has(event.key)) {
        setPressedKeys((currentKeys) => ({
          ...currentKeys,
          rightPressed: false,
        }));
        return;
      }

      if (MOVE_UP_KEYS.has(event.key)) {
        setPressedKeys((currentKeys) => ({
          ...currentKeys,
          upPressed: false,
        }));
        return;
      }

      if (MOVE_DOWN_KEYS.has(event.key)) {
        setPressedKeys((currentKeys) => ({
          ...currentKeys,
          downPressed: false,
        }));
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        clearPressedKeys();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearPressedKeys);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearPressedKeys);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return pressedKeys;
}
