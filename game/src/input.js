// input.js — keyboard and mouse.
// One job: turn browser events into the game's key state and clicks.
// WASD / arrows move, Shift sneaks, R restarts, P pauses, M mutes.
// A mouse click sets a walk target; clicks on menu buttons are
// reported back to the game through `onClick`.

export class Input {
  constructor(canvas) {
    this.keys = { up: false, down: false, left: false, right: false, sneak: false };
    this.onClick = null; // (x, y) in canvas pixels
    this.onKey = null; // (code) for one-shot keys: R, P, M, Enter, Escape
    this._down = new Set();
    this._attach(canvas);
  }

  _attach(canvas) {
    const keyMap = {
      ArrowUp: 'up', KeyW: 'up',
      ArrowDown: 'down', KeyS: 'down',
      ArrowLeft: 'left', KeyA: 'left',
      ArrowRight: 'right', KeyD: 'right',
      ShiftLeft: 'sneak', ShiftRight: 'sneak',
    };
    const oneShot = new Set(['KeyR', 'KeyP', 'KeyM', 'Enter', 'Escape', 'Space']);

    window.addEventListener('keydown', (e) => {
      if (keyMap[e.code] !== undefined) {
        this.keys[keyMap[e.code]] = true;
        e.preventDefault();
      } else if (oneShot.has(e.code)) {
        if (!e.repeat && this.onKey) this.onKey(e.code);
        if (e.code === 'Space') e.preventDefault();
      }
      this._down.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      if (keyMap[e.code] !== undefined) this.keys[keyMap[e.code]] = false;
      this._down.delete(e.code);
    });
    window.addEventListener('blur', () => {
      for (const k of Object.keys(this.keys)) this.keys[k] = false;
      this._down.clear();
    });

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      if (this.onClick) this.onClick(x, y);
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  pressed(code) {
    return this._down.has(code);
  }
}
