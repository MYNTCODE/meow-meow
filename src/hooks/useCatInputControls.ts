import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type {
  CatBehaviorCommands,
  CatCommandState,
  DirectionInputState,
} from '../types/catBehavior';

type DirectionKey = keyof DirectionInputState;
type InputSource = 'keyboard' | 'touch';

interface DirectionButtonBinding {
  isPressed: boolean;
  disabled: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onLostPointerCapture: (event: ReactPointerEvent<HTMLButtonElement>) => void;
}

interface InteractButtonBinding {
  isPressed: boolean;
  disabled: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onLostPointerCapture: (event: ReactPointerEvent<HTMLButtonElement>) => void;
}

interface UseCatInputControlsOptions {
  commands: CatBehaviorCommands;
  commandState: CatCommandState;
  disabled?: boolean;
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
const EMPTY_DIRECTION_INPUT_STATE: DirectionInputState = {
  left: false,
  right: false,
  up: false,
  down: false,
};

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

function mergeDirectionInputState(
  sources: Record<InputSource, DirectionInputState>,
): DirectionInputState {
  return {
    left: sources.keyboard.left || sources.touch.left,
    right: sources.keyboard.right || sources.touch.right,
    up: sources.keyboard.up || sources.touch.up,
    down: sources.keyboard.down || sources.touch.down,
  };
}

function cloneEmptyDirectionInputState(): DirectionInputState {
  return { ...EMPTY_DIRECTION_INPUT_STATE };
}

function createEmptySources(): Record<InputSource, DirectionInputState> {
  return {
    keyboard: cloneEmptyDirectionInputState(),
    touch: cloneEmptyDirectionInputState(),
  };
}

function triggerInteractAction(commands: CatBehaviorCommands, commandState: CatCommandState) {
  if (commandState.canStand) {
    commands.stand();
    return;
  }

  if (commandState.canInteract) {
    commands.interactNearest();
  }
}

export function useCatInputControls({
  commands,
  commandState,
  disabled = false,
}: UseCatInputControlsOptions) {
  const [directionInput, setDirectionInput] = useState<DirectionInputState>(EMPTY_DIRECTION_INPUT_STATE);
  const [touchPressedState, setTouchPressedState] = useState<DirectionInputState>(EMPTY_DIRECTION_INPUT_STATE);
  const [isInteractPressed, setIsInteractPressed] = useState(false);
  const commandsRef = useRef(commands);
  const commandStateRef = useRef(commandState);
  const disabledRef = useRef(disabled);
  const inputSourcesRef = useRef<Record<InputSource, DirectionInputState>>(createEmptySources());

  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);

  useEffect(() => {
    commandStateRef.current = commandState;
  }, [commandState]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const syncDirectionInput = useCallback(() => {
    setDirectionInput(mergeDirectionInputState(inputSourcesRef.current));
  }, []);

  const clearSource = useCallback(
    (source: InputSource) => {
      inputSourcesRef.current[source] = cloneEmptyDirectionInputState();

      if (source === 'touch') {
        setTouchPressedState(EMPTY_DIRECTION_INPUT_STATE);
        setIsInteractPressed(false);
      }

      syncDirectionInput();
    },
    [syncDirectionInput],
  );

  const setSourceDirectionPressed = useCallback(
    (source: InputSource, direction: DirectionKey, isPressed: boolean) => {
      const currentSourceState = inputSourcesRef.current[source];

      if (currentSourceState[direction] === isPressed) {
        return;
      }

      const nextSourceState = {
        ...currentSourceState,
        [direction]: isPressed,
      };

      inputSourcesRef.current[source] = nextSourceState;

      if (source === 'touch') {
        setTouchPressedState(nextSourceState);
      }

      syncDirectionInput();
    },
    [syncDirectionInput],
  );

  useEffect(() => {
    function clearKeyboardInput() {
      clearSource('keyboard');
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (disabledRef.current) {
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if (PREVENT_SCROLL_KEYS.has(event.key)) {
        event.preventDefault();
      }

      if (MOVE_LEFT_KEYS.has(event.key)) {
        setSourceDirectionPressed('keyboard', 'left', true);
        return;
      }

      if (MOVE_RIGHT_KEYS.has(event.key)) {
        setSourceDirectionPressed('keyboard', 'right', true);
        return;
      }

      if (MOVE_UP_KEYS.has(event.key)) {
        setSourceDirectionPressed('keyboard', 'up', true);
        return;
      }

      if (MOVE_DOWN_KEYS.has(event.key)) {
        setSourceDirectionPressed('keyboard', 'down', true);
        return;
      }

      if (event.repeat) {
        return;
      }

      if (event.key === 'e' || event.key === 'E') {
        triggerInteractAction(commandsRef.current, commandStateRef.current);
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
      if (disabledRef.current) {
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if (PREVENT_SCROLL_KEYS.has(event.key)) {
        event.preventDefault();
      }

      if (MOVE_LEFT_KEYS.has(event.key)) {
        setSourceDirectionPressed('keyboard', 'left', false);
        return;
      }

      if (MOVE_RIGHT_KEYS.has(event.key)) {
        setSourceDirectionPressed('keyboard', 'right', false);
        return;
      }

      if (MOVE_UP_KEYS.has(event.key)) {
        setSourceDirectionPressed('keyboard', 'up', false);
        return;
      }

      if (MOVE_DOWN_KEYS.has(event.key)) {
        setSourceDirectionPressed('keyboard', 'down', false);
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        clearKeyboardInput();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearKeyboardInput);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearKeyboardInput);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearSource, setSourceDirectionPressed]);

  useEffect(() => {
    function clearTouchInput() {
      clearSource('touch');
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        clearTouchInput();
      }
    }

    window.addEventListener('blur', clearTouchInput);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', clearTouchInput);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearSource]);

  useEffect(() => {
    if (!disabled) {
      return;
    }

    inputSourcesRef.current = createEmptySources();
    setDirectionInput(EMPTY_DIRECTION_INPUT_STATE);
    setTouchPressedState(EMPTY_DIRECTION_INPUT_STATE);
    setIsInteractPressed(false);
  }, [disabled]);

  const createDirectionButtonBinding = useCallback(
    (direction: DirectionKey): DirectionButtonBinding => ({
      isPressed: touchPressedState[direction],
      disabled: disabledRef.current,
      onPointerDown: (event) => {
        if (disabledRef.current) {
          return;
        }

        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        setSourceDirectionPressed('touch', direction, true);
      },
      onPointerUp: (event) => {
        event.preventDefault();
        setSourceDirectionPressed('touch', direction, false);
      },
      onPointerCancel: (event) => {
        event.preventDefault();
        setSourceDirectionPressed('touch', direction, false);
      },
      onLostPointerCapture: () => {
        setSourceDirectionPressed('touch', direction, false);
      },
    }),
    [setSourceDirectionPressed, touchPressedState],
  );

  const interactButtonBinding = useMemo<InteractButtonBinding>(
    () => ({
      isPressed: isInteractPressed,
      disabled: disabledRef.current,
      onPointerDown: (event) => {
        if (disabledRef.current) {
          return;
        }

        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        setIsInteractPressed(true);
        triggerInteractAction(commandsRef.current, commandStateRef.current);
      },
      onPointerUp: (event) => {
        event.preventDefault();
        setIsInteractPressed(false);
      },
      onPointerCancel: (event) => {
        event.preventDefault();
        setIsInteractPressed(false);
      },
      onLostPointerCapture: () => {
        setIsInteractPressed(false);
      },
    }),
    [isInteractPressed],
  );

  return {
    directionInput,
    touchControls: {
      bindDirectionButton: createDirectionButtonBinding,
      interactButton: interactButtonBinding,
    },
  };
}
