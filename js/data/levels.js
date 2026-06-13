window.GameLevels = (function () {
  function generateNotes(bpm, durationSec, speedMultiplier) {
    const notes = [];
    const beatMs = 60000 / bpm;
    const totalBeats = Math.floor((durationSec * 1000) / beatMs);
    let noteId = 0;

    for (let beat = 4; beat < totalBeats - 2; beat++) {
      const time = beat * beatMs / speedMultiplier;
      const beatInMeasure = beat % 4;
      const measure = Math.floor(beat / 4);

      if (beatInMeasure === 0) {
        notes.push({
          id: noteId++,
          track: measure % 4,
          time: time,
          type: 'tap'
        });
      }

      if (beatInMeasure === 2) {
        const track = (measure + 2) % 4;
        notes.push({
          id: noteId++,
          track: track,
          time: time,
          type: 'tap'
        });
      }

      if (measure % 2 === 1 && beatInMeasure === 1) {
        notes.push({
          id: noteId++,
          track: (measure + 1) % 4,
          time: time,
          type: 'tap'
        });
      }

      if (measure % 2 === 1 && beatInMeasure === 3) {
        notes.push({
          id: noteId++,
          track: (measure + 3) % 4,
          time: time,
          type: 'tap'
        });
      }

      if (measure > 0 && measure % 4 === 0 && beatInMeasure === 0) {
        const holdTrack = (measure + 1) % 4;
        const holdDuration = (beatMs * 2) / speedMultiplier;
        notes.push({
          id: noteId++,
          track: holdTrack,
          time: time,
          type: 'hold',
          duration: holdDuration
        });
      }

      if (measure > 2 && measure % 3 === 2 && beatInMeasure === 0) {
        const doubleTracks = [0, 3];
        doubleTracks.forEach(t => {
          notes.push({
            id: noteId++,
            track: t,
            time: time + beatMs * 0.5 / speedMultiplier,
            type: 'tap'
          });
        });
      }
    }

    notes.sort((a, b) => a.time - b.time);
    return notes;
  }

  const levelData = {
    title: 'Inspiration Pulse',
    artist: 'Club Neon',
    bpm: 120,
    duration: 60,
    speeds: {
      slow: {
        noteSpeed: 400,
        multiplier: 0.7
      },
      fast: {
        noteSpeed: 600,
        multiplier: 1.0
      }
    },
    judgeWindows: {
      perfect: 80,
      great: 160,
      miss: 300
    }
  };

  return {
    getLevel: function (speed) {
      const speedCfg = levelData.speeds[speed] || levelData.speeds.slow;
      const notes = generateNotes(levelData.bpm, levelData.duration, speedCfg.multiplier);

      return {
        title: levelData.title,
        artist: levelData.artist,
        bpm: levelData.bpm,
        duration: levelData.duration * 1000 / speedCfg.multiplier,
        noteSpeed: speedCfg.noteSpeed,
        speedMultiplier: speedCfg.multiplier,
        judgeWindows: levelData.judgeWindows,
        notes: notes
      };
    }
  };
})();
