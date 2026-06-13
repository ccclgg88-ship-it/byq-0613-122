window.GameLevels = (function () {
  function generateWarmupNotes(bpm, durationSec, speedMultiplier) {
    const notes = [];
    const beatMs = 60000 / bpm;
    const totalBeats = Math.floor((durationSec * 1000) / beatMs);
    let noteId = 0;

    for (let beat = 4; beat < totalBeats - 2; beat++) {
      const time = beat * beatMs / speedMultiplier;
      const beatInMeasure = beat % 4;
      const measure = Math.floor(beat / 4);

      if (beatInMeasure === 0) {
        notes.push({ id: noteId++, track: measure % 4, time: time, type: 'tap' });
      }

      if (beatInMeasure === 2) {
        notes.push({ id: noteId++, track: (measure + 2) % 4, time: time, type: 'tap' });
      }

      if (measure > 2 && measure % 3 === 0 && beatInMeasure === 0) {
        notes.push({ id: noteId++, track: (measure + 1) % 4, time: time, type: 'hold', duration: beatMs * 2 / speedMultiplier });
      }
    }

    notes.sort((a, b) => a.time - b.time);
    return notes;
  }

  function generateClimaxNotes(bpm, durationSec, speedMultiplier) {
    const notes = [];
    const beatMs = 60000 / bpm;
    const totalBeats = Math.floor((durationSec * 1000) / beatMs);
    let noteId = 0;

    for (let beat = 4; beat < totalBeats - 2; beat++) {
      const time = beat * beatMs / speedMultiplier;
      const beatInMeasure = beat % 4;
      const measure = Math.floor(beat / 4);

      if (beatInMeasure === 0) {
        notes.push({ id: noteId++, track: measure % 4, time: time, type: 'tap' });
        notes.push({ id: noteId++, track: (measure + 2) % 4, time: time, type: 'tap' });
      }

      if (beatInMeasure === 1) {
        notes.push({ id: noteId++, track: (measure + 1) % 4, time: time, type: 'tap' });
      }

      if (beatInMeasure === 2) {
        notes.push({ id: noteId++, track: (measure + 3) % 4, time: time, type: 'tap' });
        notes.push({ id: noteId++, track: (measure + 1) % 4, time: time + beatMs * 0.25 / speedMultiplier, type: 'tap' });
      }

      if (beatInMeasure === 3) {
        notes.push({ id: noteId++, track: measure % 4, time: time, type: 'tap' });
      }

      if (measure % 4 === 1 && beatInMeasure === 0) {
        notes.push({ id: noteId++, track: 2, time: time, type: 'hold', duration: beatMs * 3 / speedMultiplier });
      }
    }

    notes.sort((a, b) => a.time - b.time);
    return notes;
  }

  function generateSlowjamNotes(bpm, durationSec, speedMultiplier) {
    const notes = [];
    const beatMs = 60000 / bpm;
    const totalBeats = Math.floor((durationSec * 1000) / beatMs);
    let noteId = 0;

    for (let beat = 4; beat < totalBeats - 2; beat++) {
      const time = beat * beatMs / speedMultiplier;
      const beatInMeasure = beat % 8;
      const measure = Math.floor(beat / 8);

      if (beatInMeasure === 0) {
        notes.push({ id: noteId++, track: measure % 4, time: time, type: 'tap' });
      }

      if (beatInMeasure === 2) {
        notes.push({ id: noteId++, track: (measure + 1) % 4, time: time, type: 'tap' });
      }

      if (beatInMeasure === 4) {
        notes.push({ id: noteId++, track: (measure + 2) % 4, time: time, type: 'hold', duration: beatMs * 4 / speedMultiplier });
      }

      if (beatInMeasure === 6) {
        notes.push({ id: noteId++, track: (measure + 3) % 4, time: time, type: 'tap' });
      }

      if (measure % 2 === 1 && beatInMeasure === 0) {
        notes.push({ id: noteId++, track: 0, time: time, type: 'hold', duration: beatMs * 6 / speedMultiplier });
        notes.push({ id: noteId++, track: 3, time: time + beatMs / speedMultiplier, type: 'hold', duration: beatMs * 4 / speedMultiplier });
      }
    }

    notes.sort((a, b) => a.time - b.time);
    return notes;
  }

  function generateFinaleNotes(bpm, durationSec, speedMultiplier) {
    const notes = [];
    const beatMs = 60000 / bpm;
    const totalBeats = Math.floor((durationSec * 1000) / beatMs);
    let noteId = 0;

    for (let beat = 4; beat < totalBeats - 2; beat++) {
      const time = beat * beatMs / speedMultiplier;
      const beatInMeasure = beat % 4;
      const measure = Math.floor(beat / 4);

      if (beatInMeasure === 0) {
        notes.push({ id: noteId++, track: 0, time: time, type: 'tap' });
        notes.push({ id: noteId++, track: 1, time: time, type: 'tap' });
        notes.push({ id: noteId++, track: 2, time: time + beatMs * 0.125 / speedMultiplier, type: 'tap' });
        notes.push({ id: noteId++, track: 3, time: time + beatMs * 0.25 / speedMultiplier, type: 'tap' });
      }

      if (beatInMeasure === 1) {
        notes.push({ id: noteId++, track: (measure + 1) % 4, time: time, type: 'tap' });
        notes.push({ id: noteId++, track: (measure + 3) % 4, time: time + beatMs * 0.125 / speedMultiplier, type: 'tap' });
      }

      if (beatInMeasure === 2) {
        notes.push({ id: noteId++, track: (measure + 2) % 4, time: time, type: 'hold', duration: beatMs * 1.5 / speedMultiplier });
        notes.push({ id: noteId++, track: (measure + 3) % 4, time: time, type: 'tap' });
      }

      if (beatInMeasure === 3) {
        notes.push({ id: noteId++, track: measure % 4, time: time, type: 'tap' });
        notes.push({ id: noteId++, track: (measure + 2) % 4, time: time + beatMs * 0.125 / speedMultiplier, type: 'tap' });
      }

      if (measure % 3 === 0 && measure > 0) {
        notes.push({ id: noteId++, track: 1, time: time + beatMs * 0.5 / speedMultiplier, type: 'hold', duration: beatMs * 2.5 / speedMultiplier });
        notes.push({ id: noteId++, track: 2, time: time + beatMs * 0.5 / speedMultiplier, type: 'hold', duration: beatMs * 2.5 / speedMultiplier });
      }
    }

    notes.sort((a, b) => a.time - b.time);
    return notes;
  }

  const levels = {
    level1: {
      id: 'level1',
      title: '开场暖场',
      subtitle: 'Opening Warm-up',
      artist: 'Club Neon',
      bpm: 95,
      duration: 60,
      difficulty: 1,
      description: '轻松的开场节奏，适合热身',
      bgGradient: ['#1a0a2e', '#2d1b4e'],
      glowColor: '#ff2d95',
      speeds: {
        slow: { noteSpeed: 350, multiplier: 0.7 },
        fast: { noteSpeed: 500, multiplier: 1.0 }
      },
      judgeWindows: { perfect: 80, great: 160, miss: 300 },
      generateNotes: generateWarmupNotes
    },
    level2: {
      id: 'level2',
      title: '舞池高潮',
      subtitle: 'Dancefloor Climax',
      artist: 'DJ Pulse',
      bpm: 125,
      duration: 75,
      difficulty: 3,
      description: '密集的节奏轰炸，舞池沸腾时刻',
      bgGradient: ['#0a1a2e', '#1a2a4e'],
      glowColor: '#00f0ff',
      speeds: {
        slow: { noteSpeed: 400, multiplier: 0.7 },
        fast: { noteSpeed: 600, multiplier: 1.0 }
      },
      judgeWindows: { perfect: 70, great: 140, miss: 280 },
      generateNotes: generateClimaxNotes
    },
    level3: {
      id: 'level3',
      title: '深夜慢摇',
      subtitle: 'Midnight Groove',
      artist: 'Luna Wave',
      bpm: 85,
      duration: 90,
      difficulty: 2,
      description: '慵懒的深夜节奏，绵长的音符流动',
      bgGradient: ['#2e0a2e', '#3d1b3d'],
      glowColor: '#b829ff',
      speeds: {
        slow: { noteSpeed: 320, multiplier: 0.7 },
        fast: { noteSpeed: 450, multiplier: 1.0 }
      },
      judgeWindows: { perfect: 90, great: 180, miss: 320 },
      generateNotes: generateSlowjamNotes
    },
    level4: {
      id: 'level4',
      title: '霓虹终章',
      subtitle: 'Neon Finale',
      artist: 'Final Sequence',
      bpm: 140,
      duration: 90,
      difficulty: 5,
      description: '终章的华丽爆发，最高难度挑战',
      bgGradient: ['#0a2e1a', '#1a3e2a'],
      glowColor: '#39ff14',
      speeds: {
        slow: { noteSpeed: 450, multiplier: 0.7 },
        fast: { noteSpeed: 700, multiplier: 1.0 }
      },
      judgeWindows: { perfect: 60, great: 120, miss: 240 },
      generateNotes: generateFinaleNotes
    }
  };

  function getLevel(levelId, speed) {
    const levelData = levels[levelId];
    if (!levelData) {
      console.error('Level not found:', levelId);
      return null;
    }

    const speedCfg = levelData.speeds[speed] || levelData.speeds.slow;
    const notes = levelData.generateNotes(levelData.bpm, levelData.duration, speedCfg.multiplier);

    return {
      ...levelData,
      duration: levelData.duration * 1000 / speedCfg.multiplier,
      noteSpeed: speedCfg.noteSpeed,
      speedMultiplier: speedCfg.multiplier,
      notes: notes,
      speed: speed
    };
  }

  function getLevelList() {
    return Object.values(levels).map(l => ({
      id: l.id,
      title: l.title,
      subtitle: l.subtitle,
      artist: l.artist,
      bpm: l.bpm,
      difficulty: l.difficulty,
      description: l.description,
      glowColor: l.glowColor,
      bgGradient: l.bgGradient
    }));
  }

  function getLevelInfo(levelId) {
    return levels[levelId] || null;
  }

  return {
    getLevel: getLevel,
    getLevelList: getLevelList,
    getLevelInfo: getLevelInfo,
    levels: levels
  };
})();
