window.ProgressManager = (function () {
  const STORAGE_KEY = 'inspiration_catcher_progress';
  const INITIAL_DATA = {
    unlockedLevels: ['level1'],
    records: {
      level1: {
        slow: { score: 0, rating: null, maxCombo: 0 },
        fast: { score: 0, rating: null, maxCombo: 0 }
      },
      level2: {
        slow: { score: 0, rating: null, maxCombo: 0 },
        fast: { score: 0, rating: null, maxCombo: 0 }
      },
      level3: {
        slow: { score: 0, rating: null, maxCombo: 0 },
        fast: { score: 0, rating: null, maxCombo: 0 }
      },
      level4: {
        slow: { score: 0, rating: null, maxCombo: 0 },
        fast: { score: 0, rating: null, maxCombo: 0 }
      }
    },
    totalPlayCount: 0,
    totalScore: 0
  };

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        return { ...INITIAL_DATA, ...data };
      }
    } catch (e) {
      console.warn('Failed to load progress:', e);
    }
    return { ...INITIAL_DATA };
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save progress:', e);
    }
  }

  function getProgress() {
    return load();
  }

  function isUnlocked(levelId) {
    const progress = load();
    return progress.unlockedLevels.includes(levelId);
  }

  function unlockLevel(levelId) {
    const progress = load();
    if (!progress.unlockedLevels.includes(levelId)) {
      progress.unlockedLevels.push(levelId);
      save(progress);
      return true;
    }
    return false;
  }

  function updateRecord(levelId, speed, score, rating, maxCombo) {
    const progress = load();
    const current = progress.records[levelId]?.[speed];
    
    if (!current) return { newRecord: false, newCombo: false };

    const newRecord = score > current.score;
    const newCombo = maxCombo > current.maxCombo;

    if (newRecord) {
      current.score = score;
      current.rating = rating;
    }
    if (newCombo) {
      current.maxCombo = maxCombo;
    }

    if (newRecord || newCombo) {
      progress.totalPlayCount++;
      progress.totalScore += score;
      save(progress);
    }

    return { newRecord, newCombo };
  }

  function getRecord(levelId, speed) {
    const progress = load();
    return progress.records[levelId]?.[speed] || { score: 0, rating: null, maxCombo: 0 };
  }

  function checkUnlockCondition(levelId, speed, rating) {
    const ratings = ['B', 'A', 'S'];
    if (ratings.includes(rating)) {
      const levelNum = parseInt(levelId.replace('level', ''));
      const nextLevelId = `level${levelNum + 1}`;
      if (!isUnlocked(nextLevelId)) {
        unlockLevel(nextLevelId);
        return nextLevelId;
      }
    }
    return null;
  }

  function resetProgress() {
    save(INITIAL_DATA);
    return INITIAL_DATA;
  }

  function getTotalStats() {
    const progress = load();
    return {
      totalPlayCount: progress.totalPlayCount,
      totalScore: progress.totalScore,
      unlockedCount: progress.unlockedLevels.length,
      totalLevels: 4
    };
  }

  return {
    getProgress: getProgress,
    isUnlocked: isUnlocked,
    unlockLevel: unlockLevel,
    updateRecord: updateRecord,
    getRecord: getRecord,
    checkUnlockCondition: checkUnlockCondition,
    resetProgress: resetProgress,
    getTotalStats: getTotalStats
  };
})();
