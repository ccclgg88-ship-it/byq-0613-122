(function () {
  const SCREENS = {
    MENU: 'menu-screen',
    GAME: 'game-screen',
    RESULT: 'result-screen',
    ERROR: 'error-screen'
  };

  let currentSpeed = 'slow';
  let currentLevelId = 'level1';
  let canvasEl = null;

  let levelCards = [];
  let levelNavPrev = null;
  let levelNavNext = null;
  let levelCounter = null;

  function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
  }

  function showPauseOverlay(show) {
    const overlay = document.getElementById('pause-overlay');
    if (!overlay) return;
    if (show) {
      overlay.classList.add('active');
    } else {
      overlay.classList.remove('active');
    }
  }

  function showErrorScreen(message) {
    const msgEl = document.getElementById('error-message');
    if (msgEl) {
      msgEl.textContent = message || '请检查关卡数据是否完整';
    }
    GameEngine.stop();
    showScreen(SCREENS.ERROR);
  }

  function setupLevelSelector() {
    levelCards = document.querySelectorAll('.level-card');
    levelNavPrev = document.getElementById('prev-level');
    levelNavNext = document.getElementById('next-level');
    levelCounter = document.getElementById('level-counter');

    updateLevelCards();

    if (levelNavPrev) {
      levelNavPrev.addEventListener('click', () => {
        navigateLevel(-1);
      });
    }

    if (levelNavNext) {
      levelNavNext.addEventListener('click', () => {
        navigateLevel(1);
      });
    }

    levelCards.forEach((card, index) => {
      card.addEventListener('click', () => {
        const levelId = card.dataset.level;
        if (ProgressManager.isUnlocked(levelId)) {
          selectLevel(index);
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        navigateLevel(-1);
      } else if (e.key === 'ArrowRight') {
        navigateLevel(1);
      }
    });
  }

  function updateLevelCards() {
    const levelList = GameLevels.getLevelList();

    levelCards.forEach((card, index) => {
      const levelId = card.dataset.level;
      const levelInfo = levelList[index];
      const isUnlocked = ProgressManager.isUnlocked(levelId);
      const record = ProgressManager.getRecord(levelId, currentSpeed);

      const lockEl = card.querySelector('.level-lock');
      const cardBg = card.querySelector('.card-bg');
      const titleEl = card.querySelector('.level-title');
      const subtitleEl = card.querySelector('.level-subtitle');
      const artistEl = card.querySelector('.level-artist');
      const bpmEl = card.querySelector('.meta-item');
      const starsEl = card.querySelector('.difficulty-stars');
      const descEl = card.querySelector('.level-desc');
      const recordValues = card.querySelectorAll('.record-value');

      if (isUnlocked) {
        if (lockEl) lockEl.style.display = 'none';
        card.style.pointerEvents = 'auto';
      } else {
        if (lockEl) lockEl.style.display = 'flex';
        card.style.pointerEvents = 'none';
      }

      if (cardBg && levelInfo) {
        cardBg.style.background = `linear-gradient(135deg, ${levelInfo.bgGradient[0]}, ${levelInfo.bgGradient[1]})`;
      }

      if (titleEl && levelInfo) {
        titleEl.textContent = levelInfo.title;
      }
      if (subtitleEl && levelInfo) {
        subtitleEl.textContent = levelInfo.subtitle;
      }
      if (artistEl && levelInfo) {
        artistEl.textContent = levelInfo.artist;
      }
      if (bpmEl && levelInfo) {
        bpmEl.innerHTML = `<span class="meta-icon">♪</span> ${levelInfo.bpm} BPM`;
      }

      if (starsEl && levelInfo) {
        starsEl.innerHTML = '';
        for (let i = 0; i < levelInfo.difficulty; i++) {
          const star = document.createElement('span');
          star.className = 'star';
          star.textContent = '★';
          starsEl.appendChild(star);
        }
      }

      if (descEl && levelInfo) {
        descEl.textContent = levelInfo.description;
      }

      if (recordValues.length >= 3) {
        recordValues[0].textContent = record.score.toLocaleString();
        recordValues[1].textContent = record.rating || '-';
        recordValues[2].textContent = record.maxCombo;
      }

      if (levelId === currentLevelId) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    updateLevelCounter();
  }

  function navigateLevel(direction) {
    const levelList = GameLevels.getLevelList();
    const currentIndex = levelList.findIndex(l => l.id === currentLevelId);
    
    let newIndex = currentIndex + direction;
    
    while (newIndex >= 0 && newIndex < levelList.length) {
      const targetLevelId = levelList[newIndex].id;
      if (ProgressManager.isUnlocked(targetLevelId)) {
        selectLevel(newIndex);
        break;
      }
      newIndex += direction;
    }

    updateNavigationButtons();
  }

  function selectLevel(index) {
    const levelList = GameLevels.getLevelList();
    if (index < 0 || index >= levelList.length) return;

    const levelId = levelList[index].id;
    if (!ProgressManager.isUnlocked(levelId)) return;

    currentLevelId = levelId;

    levelCards.forEach((card, i) => {
      if (i === index) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    const cardsContainer = document.getElementById('level-cards');
    if (cardsContainer) {
      cardsContainer.style.transform = `translateX(-${index * 100}%)`;
    }

    updateLevelCounter();
    updateNavigationButtons();
  }

  function updateLevelCounter() {
    const levelList = GameLevels.getLevelList();
    const currentIndex = levelList.findIndex(l => l.id === currentLevelId);
    const unlockedCount = ProgressManager.getTotalStats().unlockedCount;
    
    if (levelCounter) {
      levelCounter.textContent = `${currentIndex + 1}/${levelList.length} (${unlockedCount}已解锁)`;
    }
  }

  function updateNavigationButtons() {
    const levelList = GameLevels.getLevelList();
    const currentIndex = levelList.findIndex(l => l.id === currentLevelId);

    if (levelNavPrev) {
      levelNavPrev.disabled = currentIndex === 0;
      levelNavPrev.style.opacity = currentIndex === 0 ? '0.3' : '1';
    }

    let canGoNext = false;
    for (let i = currentIndex + 1; i < levelList.length; i++) {
      if (ProgressManager.isUnlocked(levelList[i].id)) {
        canGoNext = true;
        break;
      }
    }

    if (levelNavNext) {
      levelNavNext.disabled = !canGoNext;
      levelNavNext.style.opacity = canGoNext ? '1' : '0.3';
    }
  }

  function setupSpeedSelector() {
    const buttons = document.querySelectorAll('.speed-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSpeed = btn.dataset.speed || 'slow';
        updateLevelCards();
      });
    });
  }

  function setupStartButton() {
    const btn = document.getElementById('start-btn');
    if (!btn) return;
    btn.addEventListener('click', startGame);
  }

  function setupPauseButton() {
    const btn = document.getElementById('pause-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (GameEngine.isPlaying()) {
        GameEngine.pause();
      } else if (GameEngine.isPaused()) {
        GameEngine.resume();
      }
    });
  }

  function setupResumeButton() {
    const btn = document.getElementById('resume-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      GameEngine.resume();
    });
  }

  function setupQuitButton() {
    const btn = document.getElementById('quit-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      GameEngine.stop();
      showPauseOverlay(false);
      showScreen(SCREENS.MENU);
    });
  }

  function setupRetryButton() {
    const btn = document.getElementById('retry-btn');
    if (!btn) return;
    btn.addEventListener('click', startGame);
  }

  function setupMenuButton() {
    const btn = document.getElementById('menu-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      showScreen(SCREENS.MENU);
      updateLevelCards();
    });
  }

  function setupErrorBackButton() {
    const btn = document.getElementById('error-back-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      showScreen(SCREENS.MENU);
    });
  }

  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (GameEngine.isPlaying()) {
          GameEngine.pause();
        } else if (GameEngine.isPaused()) {
          GameEngine.resume();
        }
      }

      if (e.key === ' ' || e.key === 'Enter') {
        const menuScreen = document.getElementById(SCREENS.MENU);
        if (menuScreen && menuScreen.classList.contains('active')) {
          e.preventDefault();
          startGame();
        }
      }
    });
  }

  function updateGameHUD(levelId, speed) {
    const levelInfo = GameLevels.getLevelInfo(levelId);
    if (!levelInfo) return;

    const titleEl = document.getElementById('level-title');
    const artistEl = document.getElementById('level-artist');
    const speedEl = document.getElementById('speed-indicator');

    if (titleEl) titleEl.textContent = levelInfo.title;
    if (artistEl) artistEl.textContent = levelInfo.artist;
    if (speedEl) speedEl.textContent = speed === 'slow' ? '慢' : '快';
  }

  function updateResultScreen(finalState, levelId, speed, newRecord, unlockedLevel) {
    const levelInfo = GameLevels.getLevelInfo(levelId);
    if (!levelInfo) return;

    const titleEl = document.getElementById('result-level-title');
    const artistEl = document.getElementById('result-level-artist');
    const speedEl = document.getElementById('result-speed');
    const bestEl = document.getElementById('result-best');
    const newRecordEl = document.getElementById('result-new-record');
    const unlockEl = document.getElementById('result-unlock');

    if (titleEl) titleEl.textContent = levelInfo.title;
    if (artistEl) artistEl.textContent = levelInfo.artist;
    if (speedEl) speedEl.textContent = speed === 'slow' ? '慢速' : '快速';

    const record = ProgressManager.getRecord(levelId, speed);
    if (bestEl) {
      if (record.rating) {
        bestEl.textContent = `${record.rating} / ${record.score.toLocaleString()}`;
      } else {
        bestEl.textContent = '-';
      }
    }

    if (newRecordEl) {
      if (newRecord.newRecord || newRecord.newCombo) {
        newRecordEl.classList.add('show');
      } else {
        newRecordEl.classList.remove('show');
      }
    }

    if (unlockEl) {
      if (unlockedLevel) {
        unlockEl.classList.add('show');
      } else {
        unlockEl.classList.remove('show');
      }
    }
  }

  function startGame() {
    try {
      const level = GameLevels.getLevel(currentLevelId, currentSpeed);

      const validation = LevelValidator.validate(level);
      if (!validation.valid) {
        const msg = LevelValidator.getUserFriendlyMessage(validation);
        showErrorScreen(msg);
        return;
      }

      if (validation.warnings.length > 0) {
        console.warn('关卡数据警告：', validation.warnings);
      }

      showScreen(SCREENS.GAME);
      showPauseOverlay(false);

      AudioSystem.resumeContext();

      requestAnimationFrame(() => {
        if (!canvasEl) {
          canvasEl = document.getElementById('game-canvas');
        }
        Renderer.init(canvasEl);

        updateGameHUD(currentLevelId, currentSpeed);

        const callbacks = {
          onStart: () => {
            InputSystem.setEnabled(true);
          },
          onPause: () => {
            showPauseOverlay(true);
          },
          onResume: () => {
            AudioSystem.resumeContext();
            showPauseOverlay(false);
          },
          onFinish: (finalState) => {
            showPauseOverlay(false);
            
            const recordResult = ProgressManager.updateRecord(
              currentLevelId,
              currentSpeed,
              finalState.score,
              finalState.rating,
              finalState.maxCombo
            );

            const unlockedLevel = ProgressManager.checkUnlockCondition(
              currentLevelId,
              currentSpeed,
              finalState.rating
            );

            Renderer.updateResult(finalState);
            updateResultScreen(finalState, currentLevelId, currentSpeed, recordResult, unlockedLevel);
            showScreen(SCREENS.RESULT);
            AudioSystem.playResultSound(finalState.rating);
          },
          onHit: (hitInfo) => {
            AudioSystem.playHitSound(hitInfo.result, hitInfo.track);
            if (hitInfo.scoreState && hitInfo.scoreState.combo === 10) {
              AudioSystem.playComboSound(10);
            } else if (hitInfo.scoreState && hitInfo.scoreState.combo === 30) {
              AudioSystem.playComboSound(30);
            } else if (hitInfo.scoreState && hitInfo.scoreState.combo === 50) {
              AudioSystem.playComboSound(50);
            } else if (hitInfo.scoreState && hitInfo.scoreState.combo === 100) {
              AudioSystem.playComboSound(100);
            }
          },
          onBeat: () => {
            AudioSystem.playBeatSound();
          }
        };

        InputSystem.init(canvasEl);
        InputSystem.setEnabled(false);

        GameEngine.init(level, callbacks);
        GameEngine.start();
      });

    } catch (err) {
      console.error('启动游戏出错：', err);
      showErrorScreen('游戏启动失败：' + (err && err.message ? err.message : '未知错误'));
    }
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    AudioSystem.init();

    setupLevelSelector();
    setupSpeedSelector();
    setupStartButton();
    setupPauseButton();
    setupResumeButton();
    setupQuitButton();
    setupRetryButton();
    setupMenuButton();
    setupErrorBackButton();
    setupKeyboardShortcuts();

    showScreen(SCREENS.MENU);
  }

  init();
})();
