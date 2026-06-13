window.Renderer = (function () {
  const TRACK_COUNT = 4;
  const TRACK_COLORS = ['#ff2d95', '#00f0ff', '#b829ff', '#39ff14'];
  const JUDGE_LINE_COLOR = '#fff500';

  let canvas = null;
  let ctx = null;
  let width = 0;
  let height = 0;
  let dpr = 1;

  let config = {
    noteSpeed: 400,
    judgeLineY: 0,
    trackWidth: 0,
    trackGap: 0,
    noteSize: 0,
    noteRadius: 0,
    bpm: 120,
    beatMs: 500
  };

  let particles = [];
  let holdEffects = [];
  let beatPulse = 0;
  let lastBeatTime = -1;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    dpr = window.devicePixelRatio || 1;
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    config.trackWidth = width * 0.18;
    config.trackGap = width * 0.04;
    config.noteSize = config.trackWidth * 0.7;
    config.noteRadius = config.noteSize / 2;
    config.judgeLineY = height * 0.85;
  }

  function setNoteSpeed(speed) {
    config.noteSpeed = speed;
  }

  function setBpm(bpm) {
    config.bpm = bpm || 120;
    config.beatMs = 60000 / config.bpm;
  }

  function getBeatProgress(currentTime) {
    if (config.beatMs <= 0) return 0;
    const beatIndex = Math.floor(currentTime / config.beatMs);
    const beatStart = beatIndex * config.beatMs;
    return (currentTime - beatStart) / config.beatMs;
  }

  function getCurrentBeatIndex(currentTime) {
    return Math.floor(currentTime / config.beatMs);
  }

  function updateBeatPulse(currentTime, dt) {
    const beatIdx = getCurrentBeatIndex(currentTime);
    if (beatIdx !== lastBeatTime) {
      lastBeatTime = beatIdx;
      beatPulse = 1;
    }
    beatPulse = Math.max(0, beatPulse - dt / 300);
  }

  function drawBeatScale(currentTime) {
    const travelTime = (config.judgeLineY / config.noteSpeed) * 1000;
    const firstBeatOnScreen = Math.floor((currentTime - travelTime) / config.beatMs) - 1;
    const lastBeatOnScreen = Math.floor(currentTime / config.beatMs) + 2;

    const totalWidth = TRACK_COUNT * config.trackWidth + (TRACK_COUNT - 1) * config.trackGap;
    const startX = (width - totalWidth) / 2;
    const endX = startX + totalWidth;

    ctx.lineWidth = 1;

    for (let i = firstBeatOnScreen; i <= lastBeatOnScreen; i++) {
      if (i < 0) continue;
      const beatTime = i * config.beatMs;
      const y = getNoteY({ time: beatTime }, currentTime);
      const isDownbeat = i % 4 === 0;

      if (isDownbeat) {
        ctx.strokeStyle = 'rgba(255, 245, 0, 0.18)';
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
      }

      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();

      if (isDownbeat) {
        const label = String(Math.floor(i / 4) + 1);
        ctx.font = 'bold 12px Orbitron, sans-serif';
        ctx.fillStyle = 'rgba(255, 245, 0, 0.35)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, startX + 6, y);
      }
    }

    if (beatPulse > 0) {
      const pulseColor = lastBeatTime % 4 === 0 ? 'rgba(255, 245, 0, ' : 'rgba(0, 240, 255, ';
      ctx.strokeStyle = pulseColor + (beatPulse * 0.5) + ')';
      ctx.lineWidth = beatPulse * 4;
      ctx.beginPath();
      ctx.moveTo(startX, config.judgeLineY);
      ctx.lineTo(endX, config.judgeLineY);
      ctx.stroke();
    }
  }

  function getConfig() {
    return { ...config };
  }

  function getTrackX(track) {
    const totalWidth = TRACK_COUNT * config.trackWidth + (TRACK_COUNT - 1) * config.trackGap;
    const startX = (width - totalWidth) / 2;
    return startX + track * (config.trackWidth + config.trackGap);
  }

  function clear() {
    ctx.clearRect(0, 0, width, height);
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#050510');
    gradient.addColorStop(0.5, '#0a0a2a');
    gradient.addColorStop(1, '#050510');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  function drawTracks(pressedTracks) {
    const totalWidth = TRACK_COUNT * config.trackWidth + (TRACK_COUNT - 1) * config.trackGap;
    const startX = (width - totalWidth) / 2;

    for (let i = 0; i < TRACK_COUNT; i++) {
      const x = startX + i * (config.trackWidth + config.trackGap);
      const isPressed = pressedTracks && pressedTracks[i];

      ctx.fillStyle = isPressed 
        ? 'rgba(255, 255, 255, 0.08)' 
        : 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(x, 0, config.trackWidth, height);

      ctx.strokeStyle = TRACK_COLORS[i];
      ctx.lineWidth = isPressed ? 3 : 1;
      ctx.globalAlpha = isPressed ? 0.6 : 0.2;
      ctx.strokeRect(x + 0.5, 0, config.trackWidth - 1, height);
      ctx.globalAlpha = 1;

      if (isPressed) {
        const glowGradient = ctx.createRadialGradient(
          x + config.trackWidth / 2, config.judgeLineY, 0,
          x + config.trackWidth / 2, config.judgeLineY, config.trackWidth
        );
        glowGradient.addColorStop(0, TRACK_COLORS[i] + '60');
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(x - 20, config.judgeLineY - config.trackWidth, config.trackWidth + 40, config.trackWidth * 2);
      }
    }
  }

  function drawJudgeLine(flashIntensity) {
    const intensity = flashIntensity || 0;
    
    ctx.shadowColor = JUDGE_LINE_COLOR;
    ctx.shadowBlur = 20 + intensity * 30;
    ctx.strokeStyle = JUDGE_LINE_COLOR;
    ctx.lineWidth = 4 + intensity * 4;
    ctx.beginPath();
    ctx.moveTo(0, config.judgeLineY);
    ctx.lineTo(width, config.judgeLineY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const gradient = ctx.createLinearGradient(0, config.judgeLineY - 3, 0, config.judgeLineY + 3);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.5, 'rgba(255, 245, 0, ' + (0.3 + intensity * 0.5) + ')');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, config.judgeLineY - 3, width, 6);
  }

  function getNoteY(note, currentTime) {
    const timeDiff = note.time - currentTime;
    const travelTime = (config.judgeLineY / config.noteSpeed) * 1000;
    const progress = 1 - (timeDiff / travelTime);
    return progress * config.judgeLineY;
  }

  function getNoteEndY(note, currentTime) {
    const endTime = note.time + (note.duration || 0);
    const timeDiff = endTime - currentTime;
    const travelTime = (config.judgeLineY / config.noteSpeed) * 1000;
    const progress = 1 - (timeDiff / travelTime);
    return progress * config.judgeLineY;
  }

  function drawNote(note, currentTime, noteStates) {
    const trackX = getTrackX(note.track);
    const centerX = trackX + config.trackWidth / 2;
    const noteY = getNoteY(note, currentTime);

    const state = noteStates ? noteStates[note.id] : null;
    const isHit = state && state.hit;
    const isHoldActive = state && state.holding;
    const isJudgeMissed = state && state.missed;

    if (isJudgeMissed) return;

    const color = TRACK_COLORS[note.track];

    if (note.type === 'hold') {
      const endY = getNoteEndY(note, currentTime);
      const startY = Math.min(noteY, endY);
      const bodyHeight = Math.abs(endY - noteY);

      const clampedStartY = Math.max(startY, -100);
      const clampedEndY = Math.min(Math.max(noteY, endY), height + 100);
      const visibleHeight = clampedEndY - clampedStartY;

      if (visibleHeight > 0) {
        const gradient = ctx.createLinearGradient(0, clampedStartY, 0, clampedEndY);
        gradient.addColorStop(0, color + (isHoldActive ? 'cc' : '40'));
        gradient.addColorStop(0.5, color + (isHoldActive ? '80' : '25'));
        gradient.addColorStop(1, color + (isHoldActive ? 'cc' : '40'));

        ctx.fillStyle = gradient;
        const bodyX = centerX - config.noteRadius * 0.7;
        const bodyWidth = config.noteRadius * 1.4;
        ctx.fillRect(bodyX, clampedStartY, bodyWidth, visibleHeight);

        ctx.strokeStyle = color + (isHoldActive ? 'ff' : '80');
        ctx.lineWidth = isHoldActive ? 2 : 1;
        ctx.strokeRect(bodyX, clampedStartY, bodyWidth, visibleHeight);
      }

      if (noteY >= -50 && noteY <= height + 50 && !isHit) {
        drawNoteCircle(centerX, noteY, color, isHit);
      }
      if (endY >= -50 && endY <= height + 50) {
        const endAlpha = isHoldActive ? 'ff' : 'aa';
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = color + endAlpha;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, endY, config.noteRadius * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    } else {
      if (noteY < -50 || noteY > height + 50 || isHit) return;
      drawNoteCircle(centerX, noteY, color, isHit);
    }
  }

  function drawNoteCircle(x, y, color, isHit) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, config.noteRadius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, color);
    gradient.addColorStop(0.7, color + 'cc');
    gradient.addColorStop(1, color + '40');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, config.noteRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, config.noteRadius * 0.9, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  function drawNotes(notes, currentTime, noteStates) {
    if (!notes) return;
    for (const note of notes) {
      drawNote(note, currentTime, noteStates);
    }
  }

  function spawnHitParticles(track, result) {
    const trackX = getTrackX(track);
    const x = trackX + config.trackWidth / 2;
    const y = config.judgeLineY;
    const color = result === 'miss' ? '#ff2d95' : TRACK_COLORS[track];
    const count = result === 'perfect' ? 20 : result === 'great' ? 12 : 6;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 80 + Math.random() * 120;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        life: 1,
        decay: 1.5 + Math.random() * 1,
        size: 3 + Math.random() * 4,
        color: color
      });
    }
  }

  function spawnHoldEffect(track) {
    holdEffects.push({
      track: track,
      life: 1,
      decay: 0.05
    });
  }

  function updateParticles(dt) {
    const dtSec = dt / 1000;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
      p.vy += 200 * dtSec;
      p.life -= p.decay * dtSec;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    for (let i = holdEffects.length - 1; i >= 0; i--) {
      holdEffects[i].life -= holdEffects[i].decay;
      if (holdEffects[i].life <= 0) {
        holdEffects.splice(i, 1);
      }
    }
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function drawHoldEffects() {
    for (const effect of holdEffects) {
      const trackX = getTrackX(effect.track);
      const x = trackX + config.trackWidth / 2;
      const color = TRACK_COLORS[effect.track];

      ctx.globalAlpha = effect.life * 0.5;
      const gradient = ctx.createRadialGradient(
        x, config.judgeLineY, 0,
        x, config.judgeLineY, config.trackWidth * 1.5
      );
      gradient.addColorStop(0, color + 'aa');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(
        x - config.trackWidth * 1.5,
        config.judgeLineY - config.trackWidth * 1.5,
        config.trackWidth * 3,
        config.trackWidth * 3
      );
    }
    ctx.globalAlpha = 1;
  }

  let judgeLineFlash = 0;

  function flashJudgeLine(intensity) {
    judgeLineFlash = Math.max(judgeLineFlash, intensity || 1);
  }

  function updateJudgeFlash(dt) {
    judgeLineFlash = Math.max(0, judgeLineFlash - dt / 200);
  }

  function showJudgeFeedback(result, track) {
    const container = document.getElementById('judge-feedback');
    if (!container) return;

    const text = document.createElement('div');
    text.className = 'judge-text ' + result;

    const labels = {
      perfect: 'PERFECT',
      great: 'GREAT',
      miss: 'MISS'
    };
    text.textContent = labels[result] || result;

    container.appendChild(text);

    setTimeout(() => {
      if (text.parentNode) {
        text.parentNode.removeChild(text);
      }
    }, 500);
  }

  function updateHUD(scoreState) {
    if (!scoreState) return;

    const scoreEl = document.getElementById('score-value');
    const comboEl = document.getElementById('combo-value');
    const multiEl = document.getElementById('multiplier-value');

    if (scoreEl) scoreEl.textContent = scoreState.score.toLocaleString();
    if (comboEl) comboEl.textContent = scoreState.combo;
    if (multiEl) multiEl.textContent = '×' + scoreState.multiplier.toFixed(1);
  }

  function updateResult(scoreState) {
    if (!scoreState) return;

    const ratingEl = document.getElementById('rating-letter');
    const scoreResultEl = document.getElementById('result-score');
    const accEl = document.getElementById('result-accuracy');
    const perfectEl = document.getElementById('result-perfect');
    const greatEl = document.getElementById('result-great');
    const missEl = document.getElementById('result-miss');
    const maxComboEl = document.getElementById('result-maxcombo');

    if (ratingEl) {
      ratingEl.textContent = scoreState.rating;
      ratingEl.setAttribute('data-rating', scoreState.rating);
    }
    if (scoreResultEl) scoreResultEl.textContent = scoreState.score.toLocaleString();
    if (accEl) accEl.textContent = scoreState.accuracy.toFixed(2) + '%';
    if (perfectEl) perfectEl.textContent = scoreState.counts.perfect;
    if (greatEl) greatEl.textContent = scoreState.counts.great;
    if (missEl) missEl.textContent = scoreState.counts.miss;
    if (maxComboEl) maxComboEl.textContent = scoreState.maxCombo;
  }

  function render(notes, currentTime, noteStates, scoreState) {
    clear();
    drawBackground();
    drawBeatScale(currentTime);
    drawHoldEffects();
    drawTracks(InputSystem ? InputSystem.getPressedTracks() : []);
    drawNotes(notes, currentTime, noteStates);
    drawJudgeLine(judgeLineFlash);
    drawParticles();
    updateHUD(scoreState);
  }

  function update(dt, currentTime) {
    updateParticles(dt);
    updateJudgeFlash(dt);
    if (currentTime !== undefined) {
      updateBeatPulse(currentTime, dt);
    }
  }

  function reset() {
    particles = [];
    holdEffects = [];
    judgeLineFlash = 0;
    beatPulse = 0;
    lastBeatTime = -1;
    const container = document.getElementById('judge-feedback');
    if (container) container.innerHTML = '';
  }

  return {
    init: init,
    resize: resize,
    setNoteSpeed: setNoteSpeed,
    setBpm: setBpm,
    getConfig: getConfig,
    getTrackX: getTrackX,
    getNoteY: getNoteY,
    getNoteEndY: getNoteEndY,
    clear: clear,
    drawBackground: drawBackground,
    drawTracks: drawTracks,
    drawJudgeLine: drawJudgeLine,
    drawNotes: drawNotes,
    render: render,
    update: update,
    reset: reset,
    spawnHitParticles: spawnHitParticles,
    spawnHoldEffect: spawnHoldEffect,
    flashJudgeLine: flashJudgeLine,
    showJudgeFeedback: showJudgeFeedback,
    updateResult: updateResult,
    TRACK_COUNT: TRACK_COUNT,
    TRACK_COLORS: TRACK_COLORS
  };
})();