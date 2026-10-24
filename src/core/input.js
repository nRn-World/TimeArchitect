// Keyboard, pointer-swipe and gamepad input.
const KEY_MOVES = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
  W: 'up',
  A: 'left',
  S: 'down',
  D: 'right'
};

export function createInput({ onAction, isActive }) {
  const keydown = (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;

    if (!isActive()) {
      if (event.key === 'Escape') onAction({ type: 'escape' });
      return;
    }

    const move = KEY_MOVES[event.key];
    if (move) {
      event.preventDefault();
      onAction({ type: 'move', dir: move });
      return;
    }
    switch (event.key) {
      case ' ':
      case '.':
        event.preventDefault();
        onAction({ type: 'wait' });
        break;
      case 'z':
      case 'Z':
      case 'Backspace':
        event.preventDefault();
        onAction({ type: 'undo' });
        break;
      case 'r':
      case 'R':
        onAction({ type: 'restart' });
        break;
      case 'Escape':
      case 'p':
      case 'P':
        event.preventDefault();
        onAction({ type: 'pause' });
        break;
      case 'q':
      case 'Q':
        onAction({ type: 'cycle', delta: -1 });
        break;
      case 'e':
      case 'E':
        onAction({ type: 'cycle', delta: 1 });
        break;
      case 'Tab':
        event.preventDefault();
        onAction({ type: 'cycle', delta: event.shiftKey ? -1 : 1 });
        break;
      case '1':
        onAction({ type: 'rate', rate: -1 });
        break;
      case '2':
        onAction({ type: 'rate', rate: 0 });
        break;
      case '3':
        onAction({ type: 'rate', rate: 1 });
        break;
      case '4':
        onAction({ type: 'rate', rate: 2 });
        break;
      case 'h':
      case 'H':
        onAction({ type: 'hint' });
        break;
      default:
        break;
    }
  };

  window.addEventListener('keydown', keydown, { passive: false });

  // Gamepad polling with edge detection.
  const pressed = new Map();
  let padFrame = 0;
  let lastPadTime = 0;

  const pollPad = (time) => {
    padFrame = window.requestAnimationFrame(pollPad);
    if (!isActive() || time - lastPadTime < 90) return;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = pads && Array.from(pads).find((candidate) => candidate && candidate.connected);
    if (!pad) return;
    const fire = (key, action) => {
      const isDown = Boolean(key);
      const wasDown = pressed.get(action.type + (action.dir || '') + (action.rate ?? '') + (action.delta ?? '')) || false;
      if (isDown && !wasDown) {
        onAction(action);
        lastPadTime = time;
      }
      pressed.set(action.type + (action.dir || '') + (action.rate ?? '') + (action.delta ?? ''), isDown);
    };

    const axisX = pad.axes[0] || 0;
    const axisY = pad.axes[1] || 0;
    fire(axisY < -0.55 || pad.buttons[12]?.pressed, { type: 'move', dir: 'up' });
    fire(axisY > 0.55 || pad.buttons[13]?.pressed, { type: 'move', dir: 'down' });
    fire(axisX < -0.55 || pad.buttons[14]?.pressed, { type: 'move', dir: 'left' });
    fire(axisX > 0.55 || pad.buttons[15]?.pressed, { type: 'move', dir: 'right' });
    fire(pad.buttons[0]?.pressed, { type: 'wait' });
    fire(pad.buttons[1]?.pressed, { type: 'undo' });
    fire(pad.buttons[2]?.pressed, { type: 'cycle', delta: 1 });
    fire(pad.buttons[3]?.pressed, { type: 'pause' });
    fire(pad.buttons[4]?.pressed, { type: 'rate', rate: -1 });
    fire(pad.buttons[5]?.pressed, { type: 'rate', rate: 1 });
  };

  padFrame = window.requestAnimationFrame(pollPad);

  return {
    destroy() {
      window.removeEventListener('keydown', keydown);
      window.cancelAnimationFrame(padFrame);
    }
  };
}

/** Attaches swipe handling to the canvas and returns a detach function. */
export function attachSwipe(element, onSwipe) {
  let start = null;
  const down = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    start = { x: event.clientX, y: event.clientY, id: event.pointerId, time: performance.now() };
  };
  const up = (event) => {
    if (!start || (event.pointerId !== undefined && start.id !== event.pointerId)) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const distance = Math.hypot(dx, dy);
    const elapsed = performance.now() - start.time;
    start = null;
    if (distance < 24 || elapsed > 900) return;
    if (Math.abs(dx) > Math.abs(dy)) onSwipe(dx > 0 ? 'right' : 'left');
    else onSwipe(dy > 0 ? 'down' : 'up');
  };
  const cancel = () => {
    start = null;
  };
  element.addEventListener('pointerdown', down);
  element.addEventListener('pointerup', up);
  element.addEventListener('pointercancel', cancel);
  return () => {
    element.removeEventListener('pointerdown', down);
    element.removeEventListener('pointerup', up);
    element.removeEventListener('pointercancel', cancel);
  };
}
