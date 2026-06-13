window.GameEngine = (function () {
  const STATE = {
    IDLE: 'idle',
    PLAYING: 'playing',
    PAUSED: 'paused',
    FINISHED: 'finished'
  };

  let state = {
    status: STATE.IDLE,
    level: null,
    notes: [],
    noteStates: {},
    currentTime: 0,
    startTime: 0,
    pauseOffset: 0,
    lastFrameTime: 0,
    rafId: null,
    callbacks: null
  };

  function createNoteStates(notes) {
    const ns = {};
    for (const note of notes) {
      ns[note.id] = {
        hit: false,
        missed: false,
        holding: false,
        startJudged: false,
        startResult: null,
        endJudged: false,
        endResult: null,
        releasedEarly: false
      };
    }
    return ns;
  }

  function init(levelData, callbacks) {
    state.level = levelData;
    state.notes = levelData.notes || [];
    state.noteStates = createNoteStates(state.notes);
    state.currentTime = 0;
    state.startTime = 0;
    state.pauseOffset = 0;
    state.lastFrameTime = 0;
    state.callbacks = callbacks || {};
    state.status = STATE.IDLE;

    JudgeSystem.init(levelData.judgeWindows);
    ScoreSystem.init(state.notes.length);
    Renderer.setNoteSpeed(levelData.noteSpeed);
    Renderer.reset();
    InputSystem.reset();

    return true;
  }

  function start() {
    if (state.status !== STATE.IDLE) return false;
    state.status = STATE.PLAYING;
    state.startTime = performance.now();
    state.lastFrameTime = state.startTime;
    state.rafId = requestAnimationFrame(loop);

    if (state.callbacks.onStart) {
      state.callbacks.onStart();
    }
    return true;
  }

  function pause() {
    if (state.status !== STATE.PLAYING) return false;
    state.status = STATE.PAUSED;
    state.pauseOffset = state.currentTime;
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    InputSystem.setEnabled(false);

    if (state.callbacks.onPause) {
      state.callbacks.onPause();
    }
    return true;
  }

  function resume() {
    if (state.status !== STATE.PAUSED) return false;
    state.status = STATE.PLAYING;
    state.startTime = performance.now();
    state.lastFrameTime = state.startTime;
    InputSystem.setEnabled(true);
    state.rafId = requestAnimationFrame(loop);

    if (state.callbacks.onResume) {
      state.callbacks.onResume();
    }
    return true;
  }

  function stop() {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    state.status = STATE.IDLE;
    InputSystem.setEnabled(false);
  }

  function finish() {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    state.status = STATE.FINISHED;
    InputSystem.setEnabled(false);

    const finalState = ScoreSystem.getState();
    if (state.callbacks.onFinish) {
      state.callbacks.onFinish(finalState);
    }
    return finalState;
  }

  function loop(now) {
    if (state.status !== STATE.PLAYING) return;

    const dt = Math.min(now - state.lastFrameTime, 50);
    state.lastFrameTime = now;
    state.currentTime = state.pauseOffset + (now - state.startTime);

    processInput();
    updateMissed();
    updateHolds();

    Renderer.update(dt);
    Renderer.render(
      state.notes,
      state.currentTime,
      state.noteStates,
      ScoreSystem.getState()
    );

    InputSystem.clearFrame();

    if (checkFinished()) {
      finish();
      return;
    }

    state.rafId = requestAnimationFrame(loop);
  }

  function processInput() {
    for (let track = 0; track < 4; track++) {
      if (InputSystem.wasJustPressed(track)) {
        handleKeyDown(track);
      }
      if (InputSystem.wasJustReleased(track)) {
        handleKeyUp(track);
      }
    }
  }

  function handleKeyDown(track) {
    const closest = JudgeSystem.findClosestNote(
      state.notes,
      track,
      state.currentTime,
      new Set()
    );

    if (!closest) return;

    const ns = state.noteStates[closest.id];
    if (!ns) return;

    if (closest.type === 'tap') {
      if (ns.hit || ns.missed) return;

      const result = JudgeSystem.judgeTap(state.currentTime, closest.time);
      if (result === JudgeSystem.RESULT.NONE) return;

      applyHitResult(closest, result, false);
    } else if (closest.type === 'hold') {
      if (ns.startJudged) return;

      const result = JudgeSystem.judgeHoldStart(state.currentTime, closest.time);
      if (result === JudgeSystem.RESULT.NONE) return;

      ns.startJudged = true;
      ns.startResult = result;
      ns.holding = true;

      applyHitResult(closest, result, false);
    }
  }

  function handleKeyUp(track) {
    for (const note of state.notes) {
      if (note.track !== track) continue;
      if (note.type !== 'hold') continue;

      const ns = state.noteStates[note.id];
      if (!ns || !ns.holding) continue;
      if (ns.endJudged) continue;

      const endTime = note.time + note.duration;
      const wasHolding = ns.holding;
      ns.holding = false;
      ns.endJudged = true;

      if (state.currentTime < endTime - JudgeSystem.getConfig().miss) {
        ns.releasedEarly = true;
        ns.endResult = JudgeSystem.RESULT.MISS;
        applyHitResult(note, JudgeSystem.RESULT.MISS, true);
      } else {
        const result = JudgeSystem.judgeHoldEnd(state.currentTime, endTime, wasHolding);
        ns.endResult = result;
        if (result === JudgeSystem.RESULT.MISS) {
          applyHitResult(note, JudgeSystem.RESULT.MISS, true);
        } else {
          const holdResult = (ns.startResult === JudgeSystem.RESULT.PERFECT && result === JudgeSystem.RESULT.PERFECT)
            ? JudgeSystem.RESULT.PERFECT
            : (ns.startResult === JudgeSystem.RESULT.MISS || result === JudgeSystem.RESULT.MISS)
              ? JudgeSystem.RESULT.MISS
              : JudgeSystem.RESULT.GREAT;
          if (result === JudgeSystem.RESULT.GREAT && holdResult === JudgeSystem.RESULT.GREAT) {
            applyHitResult(note, holdResult, true);
          } else if (holdResult !== JudgeSystem.RESULT.MISS) {
            applyHitResult(note, result, true);
          }
        }
      }
      break;
    }
  }

  function applyHitResult(note, result, isHoldEnd) {
    const ns = state.noteStates[note.id];

    if (result === JudgeSystem.RESULT.MISS) {
      if (ns) ns.missed = true;
    } else {
      if (ns) ns.hit = true;
    }

    ScoreSystem.addHit(result, note.type, isHoldEnd);
    Renderer.spawnHitParticles(note.track, result);
    if (result !== JudgeSystem.RESULT.MISS) {
      Renderer.flashJudgeLine(result === JudgeSystem.RESULT.PERFECT ? 1 : 0.6);
      if (note.type === 'hold' && !isHoldEnd) {
        Renderer.spawnHoldEffect(note.track);
      }
    }
    Renderer.showJudgeFeedback(result, note.track);

    if (state.callbacks.onHit) {
      state.callbacks.onHit({
        noteId: note.id,
        track: note.track,
        result: result,
        scoreState: ScoreSystem.getState()
      });
    }
  }

  function updateMissed() {
    for (const note of state.notes) {
      const ns = state.noteStates[note.id];
      if (!ns) continue;

      if (note.type === 'tap') {
        if (!ns.hit && !ns.missed && JudgeSystem.judgeMiss(state.currentTime, note.time)) {
          applyHitResult(note, JudgeSystem.RESULT.MISS, false);
        }
      } else if (note.type === 'hold') {
        if (!ns.startJudged && JudgeSystem.judgeMiss(state.currentTime, note.time)) {
          ns.startJudged = true;
          ns.startResult = JudgeSystem.RESULT.MISS;
          applyHitResult(note, JudgeSystem.RESULT.MISS, false);
        }

        const endTime = note.time + note.duration;
        if (ns.startJudged && !ns.endJudged && state.currentTime > endTime + JudgeSystem.getConfig().miss * 1.5) {
          ns.endJudged = true;
          if (ns.holding) {
            ns.holding = false;
            ns.endResult = JudgeSystem.RESULT.PERFECT;
          } else {
            if (!ns.releasedEarly) {
              ns.endResult = JudgeSystem.RESULT.MISS;
              applyHitResult(note, JudgeSystem.RESULT.MISS, true);
            }
          }
        }
      }
    }
  }

  function updateHolds() {
    for (const note of state.notes) {
      if (note.type !== 'hold') continue;
      const ns = state.noteStates[note.id];
      if (!ns || !ns.holding) continue;

      if (Math.random() < 0.3) {
        Renderer.spawnHoldEffect(note.track);
      }
    }
  }

  function checkFinished() {
    if (!state.level) return false;

    if (state.currentTime < state.level.duration + 2000) return false;

    for (const note of state.notes) {
      const ns = state.noteStates[note.id];
      if (!ns) continue;
      if (!ns.hit && !ns.missed) return false;
      if (note.type === 'hold' && !ns.endJudged) return false;
    }

    return true;
  }

  function getState() {
    return {
      status: state.status,
      currentTime: state.currentTime,
      level: state.level,
      notesCount: state.notes.length,
      scoreState: ScoreSystem.getState()
    };
  }

  function isPlaying() {
    return state.status === STATE.PLAYING;
  }

  function isPaused() {
    return state.status === STATE.PAUSED;
  }

  return {
    STATE: STATE,
    init: init,
    start: start,
    pause: pause,
    resume: resume,
    stop: stop,
    finish: finish,
    getState: getState,
    isPlaying: isPlaying,
    isPaused: isPaused
  };
})();
