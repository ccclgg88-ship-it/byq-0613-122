window.AudioSystem = (function () {
  let audioContext = null;
  let enabled = true;

  function init() {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported, sounds disabled');
      enabled = false;
    }
  }

  function playHitSound(result, track) {
    if (!enabled || !audioContext) return;

    const ctx = audioContext;
    const now = ctx.currentTime;

    const frequencies = [261.63, 293.66, 329.63, 349.23];
    const freq = frequencies[track % 4];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    if (result === 'perfect') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 2, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.1);
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (result === 'great') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      
      osc.start(now);
      osc.stop(now + 0.1);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }

  function playBeatSound(time) {
    if (!enabled || !audioContext) return;

    const ctx = audioContext;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  function playHoldSound(track, isStart) {
    if (!enabled || !audioContext) return;

    const ctx = audioContext;
    const now = ctx.currentTime;

    const frequencies = [261.63, 293.66, 329.63, 349.23];
    const freq = frequencies[track % 4];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    
    if (isStart) {
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.1);
      
      osc.start(now);
      osc.stop(now + 0.1);
    } else {
      osc.frequency.setValueAtTime(freq * 1.5, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }

  function playComboSound(combo) {
    if (!enabled || !audioContext) return;
    if (combo !== 10 && combo !== 30 && combo !== 50 && combo !== 100) return;

    const ctx = audioContext;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.50];
    const delays = [0, 0.05, 0.1, 0.15];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delays[i]);

      gain.gain.setValueAtTime(0.15, now + delays[i]);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delays[i] + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delays[i]);
      osc.stop(now + delays[i] + 0.2);
    });
  }

  function playResultSound(rating) {
    if (!enabled || !audioContext) return;

    const ctx = audioContext;
    const now = ctx.currentTime;

    const notes = {
      'S': [523.25, 659.25, 783.99, 1046.50],
      'A': [440, 523.25, 659.25, 783.99],
      'B': [349.23, 440, 523.25, 659.25],
      'C': [261.63, 329.63, 392, 440]
    };

    const noteList = notes[rating] || notes['C'];
    const delays = [0, 0.1, 0.2, 0.3];

    noteList.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delays[i]);

      gain.gain.setValueAtTime(0.2, now + delays[i]);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delays[i] + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delays[i]);
      osc.stop(now + delays[i] + 0.4);
    });
  }

  function setEnabled(val) {
    enabled = val;
  }

  function resumeContext() {
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }

  return {
    init: init,
    playHitSound: playHitSound,
    playBeatSound: playBeatSound,
    playHoldSound: playHoldSound,
    playComboSound: playComboSound,
    playResultSound: playResultSound,
    setEnabled: setEnabled,
    resumeContext: resumeContext
  };
})();
