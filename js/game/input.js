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
    onKeyUp: null,
    onTrackPress: null,
    onTrackRelease: null
  };

  let enabled = false;
  let canvasEl = null;

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
      if (callbacks.onTrackPress) {
        callbacks.onTrackPress(track);
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
      if (callbacks.onTrackRelease) {
        callbacks.onTrackRelease(track);
      }
    }
  }

  function handleCanvasClick(e) {
    if (!enabled || !canvasEl) return;

    const rect = canvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const scaleX = canvasEl.width / rect.width;

    const trackWidth = rect.width * 0.18;
    const trackGap = rect.width * 0.04;
    const totalWidth = TRACK_COUNT * trackWidth + (TRACK_COUNT - 1) * trackGap;
    const startX = (rect.width - totalWidth) / 2;

    for (let i = 0; i < TRACK_COUNT; i++) {
      const trackLeft = startX + i * (trackWidth + trackGap);
      const trackRight = trackLeft + trackWidth;

      if (x >= trackLeft && x <= trackRight) {
        if (!state.pressed[i]) {
          state.pressed[i] = true;
          state.justPressed[i] = true;
          if (callbacks.onKeyDown) {
            callbacks.onKeyDown(i);
          }
          if (callbacks.onTrackPress) {
            callbacks.onTrackPress(i);
          }
        }
        break;
      }
    }
  }

  function handleCanvasMouseDown(e) {
    if (!enabled || !canvasEl) return;

    const rect = canvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const trackWidth = rect.width * 0.18;
    const trackGap = rect.width * 0.04;
    const totalWidth = TRACK_COUNT * trackWidth + (TRACK_COUNT - 1) * trackGap;
    const startX = (rect.width - totalWidth) / 2;

    for (let i = 0; i < TRACK_COUNT; i++) {
      const trackLeft = startX + i * (trackWidth + trackGap);
      const trackRight = trackLeft + trackWidth;

      if (x >= trackLeft && x <= trackRight) {
        if (!state.pressed[i]) {
          state.pressed[i] = true;
          state.justPressed[i] = true;
          if (callbacks.onKeyDown) {
            callbacks.onKeyDown(i);
          }
          if (callbacks.onTrackPress) {
            callbacks.onTrackPress(i);
          }
        }
        break;
      }
    }
  }

  function handleCanvasMouseUp(e) {
    if (!enabled || !canvasEl) return;

    const rect = canvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const trackWidth = rect.width * 0.18;
    const trackGap = rect.width * 0.04;
    const totalWidth = TRACK_COUNT * trackWidth + (TRACK_COUNT - 1) * trackGap;
    const startX = (rect.width - totalWidth) / 2;

    for (let i = 0; i < TRACK_COUNT; i++) {
      const trackLeft = startX + i * (trackWidth + trackGap);
      const trackRight = trackLeft + trackWidth;

      if (x >= trackLeft && x <= trackRight) {
        if (state.pressed[i]) {
          state.pressed[i] = false;
          state.justReleased[i] = true;
          if (callbacks.onKeyUp) {
            callbacks.onKeyUp(i);
          }
          if (callbacks.onTrackRelease) {
            callbacks.onTrackRelease(i);
          }
        }
        break;
      }
    }
  }

  function handleCanvasTouchStart(e) {
    if (!enabled || !canvasEl) return;
    e.preventDefault();

    const rect = canvasEl.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;

    const trackWidth = rect.width * 0.18;
    const trackGap = rect.width * 0.04;
    const totalWidth = TRACK_COUNT * trackWidth + (TRACK_COUNT - 1) * trackGap;
    const startX = (rect.width - totalWidth) / 2;

    for (let i = 0; i < TRACK_COUNT; i++) {
      const trackLeft = startX + i * (trackWidth + trackGap);
      const trackRight = trackLeft + trackWidth;

      if (x >= trackLeft && x <= trackRight) {
        if (!state.pressed[i]) {
          state.pressed[i] = true;
          state.justPressed[i] = true;
          if (callbacks.onKeyDown) {
            callbacks.onKeyDown(i);
          }
          if (callbacks.onTrackPress) {
            callbacks.onTrackPress(i);
          }
        }
        break;
      }
    }
  }

  function handleCanvasTouchEnd(e) {
    if (!enabled || !canvasEl) return;
    e.preventDefault();

    const rect = canvasEl.getBoundingClientRect();
    
    for (let i = 0; i < TRACK_COUNT; i++) {
      if (state.pressed[i]) {
        state.pressed[i] = false;
        state.justReleased[i] = true;
        if (callbacks.onKeyUp) {
          callbacks.onKeyUp(i);
        }
        if (callbacks.onTrackRelease) {
          callbacks.onTrackRelease(i);
        }
      }
    }
  }

  function init(canvasElement, onKeyDown, onKeyUp) {
    canvasEl = canvasElement;
    callbacks.onKeyDown = onKeyDown || null;
    callbacks.onKeyUp = onKeyUp || null;
    reset();
    enabled = true;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    if (canvasEl) {
      canvasEl.addEventListener('click', handleCanvasClick);
      canvasEl.addEventListener('mousedown', handleCanvasMouseDown);
      canvasEl.addEventListener('mouseup', handleCanvasMouseUp);
      canvasEl.addEventListener('mouseleave', handleCanvasMouseUp);
      canvasEl.addEventListener('touchstart', handleCanvasTouchStart);
      canvasEl.addEventListener('touchend', handleCanvasTouchEnd);
    }
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

    if (canvasEl) {
      canvasEl.removeEventListener('click', handleCanvasClick);
      canvasEl.removeEventListener('mousedown', handleCanvasMouseDown);
      canvasEl.removeEventListener('mouseup', handleCanvasMouseUp);
      canvasEl.removeEventListener('mouseleave', handleCanvasMouseUp);
      canvasEl.removeEventListener('touchstart', handleCanvasTouchStart);
      canvasEl.removeEventListener('touchend', handleCanvasTouchEnd);
    }
    reset();
  }

  function setEnabled(val) {
    enabled = val;
    if (!val) {
      reset();
    }
  }

  function setCallbacks(cb) {
    if (cb.onKeyDown) callbacks.onKeyDown = cb.onKeyDown;
    if (cb.onKeyUp) callbacks.onKeyUp = cb.onKeyUp;
    if (cb.onTrackPress) callbacks.onTrackPress = cb.onTrackPress;
    if (cb.onTrackRelease) callbacks.onTrackRelease = cb.onTrackRelease;
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
    setCallbacks: setCallbacks,
    KEY_MAP: KEY_MAP,
    TRACK_COUNT: TRACK_COUNT
  };
})();
