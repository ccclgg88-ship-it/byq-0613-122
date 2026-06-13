window.ScoreSystem = (function () {
  const BASE_SCORES = {
    perfect: 1000,
    great: 600,
    miss: 0
  };

  const COMBO_BONUS_THRESHOLDS = [
    { combo: 10, bonus: 0.1 },
    { combo: 30, bonus: 0.2 },
    { combo: 50, bonus: 0.3 },
    { combo: 100, bonus: 0.5 },
    { combo: 200, bonus: 0.8 }
  ];

  let state = null;

  function createInitialState() {
    return {
      score: 0,
      combo: 0,
      maxCombo: 0,
      multiplier: 1,
      counts: {
        perfect: 0,
        great: 0,
        miss: 0,
        total: 0
      }
    };
  }

  function init(totalNotes) {
    state = createInitialState();
    state.counts.total = totalNotes || 0;
    return { ...state };
  }

  function calculateMultiplier(combo) {
    let mult = 1;
    for (const threshold of COMBO_BONUS_THRESHOLDS) {
      if (combo >= threshold.combo) {
        mult = 1 + threshold.bonus;
      } else {
        break;
      }
    }
    return mult;
  }

  function calculateExtraBonus(combo) {
    if (combo >= 100) return 500;
    if (combo >= 50) return 200;
    if (combo >= 20) return 100;
    return 0;
  }

  function addHit(result, noteType, isHoldEnd) {
    if (!state) return null;

    const baseScore = BASE_SCORES[result] || 0;

    if (result === 'miss') {
      state.combo = 0;
      state.multiplier = 1;
      state.counts.miss++;
    } else {
      state.combo++;
      if (state.combo > state.maxCombo) {
        state.maxCombo = state.combo;
      }
      state.multiplier = calculateMultiplier(state.combo);
      state.counts[result]++;
    }

    let gained = baseScore * state.multiplier;

    if (result !== 'miss' && !isHoldEnd) {
      gained += calculateExtraBonus(state.combo);
    }

    state.score += Math.floor(gained);

    return {
      gained: Math.floor(gained),
      score: state.score,
      combo: state.combo,
      maxCombo: state.maxCombo,
      multiplier: state.multiplier,
      result: result
    };
  }

  function getAccuracy() {
    if (!state) return 0;
    const { perfect, great, miss } = state.counts;
    const total = perfect + great + miss;
    if (total === 0) return 0;

    const weighted = perfect * 100 + great * 60;
    return (weighted / (total * 100)) * 100;
  }

  function getRating() {
    const accuracy = getAccuracy();
    if (accuracy >= 95) return 'S';
    if (accuracy >= 85) return 'A';
    if (accuracy >= 70) return 'B';
    return 'C';
  }

  function getState() {
    if (!state) return null;
    return {
      score: state.score,
      combo: state.combo,
      maxCombo: state.maxCombo,
      multiplier: state.multiplier,
      counts: { ...state.counts },
      accuracy: getAccuracy(),
      rating: getRating()
    };
  }

  return {
    init: init,
    addHit: addHit,
    getAccuracy: getAccuracy,
    getRating: getRating,
    getState: getState,
    BASE_SCORES: { ...BASE_SCORES },
    COMBO_BONUS_THRESHOLDS: [...COMBO_BONUS_THRESHOLDS]
  };
})();
