window.InputSystem = (function () {
  const KEY_MAP = {
    'd': 0, 'D': 0,
    'f': 1, 'F': 1,
    'j': 2, 'J': 2,
    'k': 3, 'K': 3
  };

  const TRACK_COUNT = 4;

  let state = {
    pressed: new Array(TRACK_COUNT).fill(false),
    justPressed: new Array(TRACK_COUNT).fill(false),
    justReleased: new Array(TRACK_COUNT).fill(false)
  };

  let callbacks = {
    onKeyDown: null,
    onKeyUp: null
  };

  let enabled = false;

  function handleKeyDown(e) {
    if (!enabled) return;
    if (e.repeat) return;

    const track = KEY_MAP[e.key];
    if (track === undefined) return;

    e.preventDefault();

    if (!state.pressed[track]) {
      state.pressed[track] = true;
      state.justPressed[track] = true;

      if (callbacks.onKeyDown) {
        callbacks.onKeyDown(track);
      }
    }
  }

  function handleKeyUp(e) {
    if (!enabled) return;

    const track = KEY_MAP[e.key];
    if (track === undefined) return;

    e.preventDefault();

    if (state.pressed[track]) {
      state.pressed[track] = false;
      state.justReleased[track] = true;

      if (callbacks.onKeyUp) {
        callbacks.onKeyUp(track);
      }
    }
  }

  function init(onKeyDown, onKeyUp) {
    callbacks.onKeyDown = onKeyDown || null;
    callbacks.onKeyUp = onKeyUp || null;
    reset();
    enabled = true;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  }

  function reset() {
    state.pressed = new Array(TRACK_COUNT).fill(false);
    state.justPressed = new Array(TRACK_COUNT).fill(false);
    state.justReleased = new Array(TRACK_COUNT).fill(false);
  }

  function clearFrame() {
    state.justPressed = new Array(TRACK_COUNT).fill(false);
    state.justReleased = new Array(TRACK_COUNT).fill(false);
  }

  function isPressed(track) {
    return state.pressed[track] === true;
  }

  function wasJustPressed(track) {
    return state.justPressed[track] === true;
  }

  function wasJustReleased(track) {
    return state.justReleased[track] === true;
  }

  function getPressedTracks() {
    const tracks = [];
    for (let i = 0; i < TRACK_COUNT; i++) {
      if (state.pressed[i]) tracks.push(i);
    }
    return tracks;
  }

  function destroy() {
    enabled = false;
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    reset();
  }

  function setEnabled(val) {
    enabled = val;
    if (!val) {
      reset();
    }
  }

  return {
    init: init,
    reset: reset,
    clearFrame: clearFrame,
    isPressed: isPressed,
    wasJustPressed: wasJustPressed,
    wasJustReleased: wasJustReleased,
    getPressedTracks: getPressedTracks,
    destroy: destroy,
    setEnabled: setEnabled,
    KEY_MAP: KEY_MAP,
    TRACK_COUNT: TRACK_COUNT
  };
})();
