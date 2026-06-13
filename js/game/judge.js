window.JudgeSystem = (function () {
  const RESULT = {
    PERFECT: 'perfect',
    GREAT: 'great',
    MISS: 'miss',
    NONE: 'none'
  };

  let config = {
    perfect: 50,
    great: 120,
    miss: 180
  };

  function init(judgeWindows) {
    config = {
      perfect: judgeWindows.perfect || 50,
      great: judgeWindows.great || 120,
      miss: judgeWindows.miss || 180
    };
  }

  function judgeTap(currentTime, noteTime) {
    const diff = Math.abs(currentTime - noteTime);

    if (diff <= config.perfect) {
      return RESULT.PERFECT;
    } else if (diff <= config.great) {
      return RESULT.GREAT;
    } else if (diff <= config.miss) {
      return RESULT.MISS;
    }

    return RESULT.NONE;
  }

  function judgeMiss(currentTime, noteTime) {
    return currentTime - noteTime > config.miss;
  }

  function judgeHoldStart(currentTime, noteTime) {
    const diff = Math.abs(currentTime - noteTime);
    if (diff <= config.perfect) return RESULT.PERFECT;
    if (diff <= config.great) return RESULT.GREAT;
    if (diff <= config.miss) return RESULT.MISS;
    return RESULT.NONE;
  }

  function judgeHoldEnd(currentTime, noteEndTime, wasHolding) {
    if (!wasHolding) {
      return RESULT.MISS;
    }
    const diff = Math.abs(currentTime - noteEndTime);
    if (diff <= config.great * 1.5) return RESULT.PERFECT;
    if (diff <= config.miss * 1.5) return RESULT.GREAT;
    return RESULT.MISS;
  }

  function findClosestNote(notes, track, currentTime, hitSet) {
    let closest = null;
    let closestDiff = Infinity;

    for (const note of notes) {
      if (note.track !== track) continue;
      if (hitSet.has(note.id)) continue;
      if (note.judged && note.judged.start) continue;

      const diff = currentTime - note.time;

      if (diff < -config.miss) break;

      const absDiff = Math.abs(diff);
      if (absDiff <= config.miss && absDiff < closestDiff) {
        closest = note;
        closestDiff = absDiff;
      }
    }

    return closest;
  }

  return {
    RESULT: RESULT,
    init: init,
    judgeTap: judgeTap,
    judgeMiss: judgeMiss,
    judgeHoldStart: judgeHoldStart,
    judgeHoldEnd: judgeHoldEnd,
    findClosestNote: findClosestNote,
    getConfig: function () { return { ...config }; }
  };
})();
