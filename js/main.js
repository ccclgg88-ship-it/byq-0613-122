(function () {
  const SCREENS = {
    MENU: 'menu-screen',
    GAME: 'game-screen',
    RESULT: 'result-screen',
    ERROR: 'error-screen'
  };

  let currentSpeed = 'slow';
  let canvasEl = null;

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

  function setupSpeedSelector() {
    const buttons = document.querySelectorAll('.speed-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSpeed = btn.dataset.speed || 'slow';
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

  function startGame() {
    try {
      const level = GameLevels.getLevel(currentSpeed);

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

      requestAnimationFrame(() => {
        if (!canvasEl) {
          canvasEl = document.getElementById('game-canvas');
        }
        Renderer.init(canvasEl);

        const callbacks = {
          onStart: () => {
            InputSystem.setEnabled(true);
          },
          onPause: () => {
            showPauseOverlay(true);
          },
          onResume: () => {
            showPauseOverlay(false);
          },
          onFinish: (finalState) => {
            showPauseOverlay(false);
            Renderer.updateResult(finalState);
            showScreen(SCREENS.RESULT);
          }
        };

        InputSystem.init();
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
