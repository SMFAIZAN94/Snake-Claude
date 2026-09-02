(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  const COLS = 28;
  const ROWS = 16;
  const CELL = canvas.width / COLS; // 12px per cell at native resolution

  const COLOR_BG = '#9bb53c';
  const COLOR_BG_LIGHT = '#aec24a';
  const COLOR_PIXEL = '#33430f';
  const COLOR_PIXEL_MID = '#5c7519';
  const COLOR_GRID = 'rgba(51, 67, 15, 0.08)';

  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

  const START_SPEED_MS = 160;
  const MIN_SPEED_MS = 70;
  const SPEED_STEP_MS = 4; // gets a little faster per food eaten
  const HIGH_SCORE_KEY = 'nokia-snake-high-score';

  let snake, direction, pendingDirection, food, score, speedMs, timer;
  let state = 'ready'; // ready | running | paused | over
  let soundOn = true;
  let audioCtx = null;

  const btnStart = document.getElementById('btn-start');
  const btnSound = document.getElementById('btn-sound');

  function ensureAudio() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtx = new AudioCtx();
    }
    return audioCtx;
  }

  function beep(freq, durationMs) {
    if (!soundOn) return;
    const ctxAudio = ensureAudio();
    if (!ctxAudio) return;
    const osc = ctxAudio.createOscillator();
    const gain = ctxAudio.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctxAudio.destination);
    osc.start();
    osc.stop(ctxAudio.currentTime + durationMs / 1000);
  }

  function getHighScore() {
    return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
  }

  function setHighScore(value) {
    localStorage.setItem(HIGH_SCORE_KEY, String(value));
  }

  function randomCell() {
    return {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS)
    };
  }

  function placeFood() {
    let cell;
    do {
      cell = randomCell();
    } while (snake.some((s) => s.x === cell.x && s.y === cell.y));
    food = cell;
  }

  function resetGame() {
    const cx = Math.floor(COLS / 2);
    const cy = Math.floor(ROWS / 2);
    snake = [
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy },
      { x: cx - 3, y: cy }
    ];
    direction = 'right';
    pendingDirection = 'right';
    score = 0;
    speedMs = START_SPEED_MS;
    placeFood();
    state = 'ready';
    draw();
  }

  function startLoop() {
    clearTimer();
    timer = setInterval(tick, speedMs);
  }

  function clearTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function restartTimerWithCurrentSpeed() {
    clearTimer();
    timer = setInterval(tick, speedMs);
  }

  function tick() {
    if (state !== 'running') return;

    direction = pendingDirection;
    const d = DIRS[direction];
    const head = snake[0];
    const next = { x: head.x + d.x, y: head.y + d.y };

    // Wall collision ends the run, same as the original handset game.
    if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS) {
      return gameOver();
    }
    // Self collision
    if (snake.some((s) => s.x === next.x && s.y === next.y)) {
      return gameOver();
    }

    snake.unshift(next);

    if (next.x === food.x && next.y === food.y) {
      score += 1;
      beep(880, 70);
      speedMs = Math.max(MIN_SPEED_MS, speedMs - SPEED_STEP_MS);
      restartTimerWithCurrentSpeed();
      placeFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function gameOver() {
    state = 'over';
    clearTimer();
    beep(160, 300);
    const hs = Math.max(score, getHighScore());
    setHighScore(hs);
    btnStart.textContent = 'Restart';
    draw();
  }

  function setDirection(dir) {
    if (!dir) return;
    if (state === 'ready') {
      state = 'running';
      btnStart.textContent = 'Pause';
      startLoop();
    }
    if (state !== 'running') return;
    if (OPPOSITE[dir] === direction) return; // no instant reverse
    pendingDirection = dir;
  }

  function togglePause() {
    if (state === 'running') {
      state = 'paused';
      clearTimer();
      btnStart.textContent = 'Resume';
      draw();
    } else if (state === 'paused') {
      state = 'running';
      startLoop();
      btnStart.textContent = 'Pause';
    } else if (state === 'ready') {
      state = 'running';
      startLoop();
      btnStart.textContent = 'Pause';
    } else if (state === 'over') {
      resetGame();
      btnStart.textContent = 'Start';
    }
  }

  function drawPixel(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
  }

  function draw() {
    // Background
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Faint grid, like a real dot-matrix LCD
    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL, 0);
      ctx.lineTo(c * CELL, canvas.height);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL);
      ctx.lineTo(canvas.width, r * CELL);
      ctx.stroke();
    }

    // Food
    drawPixel(food.x, food.y, COLOR_PIXEL_MID);

    // Snake
    snake.forEach((seg, i) => {
      drawPixel(seg.x, seg.y, i === 0 ? COLOR_PIXEL : COLOR_PIXEL_MID);
    });

    // HUD
    ctx.fillStyle = COLOR_PIXEL;
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textBaseline = 'top';
    ctx.fillText(`SCORE ${String(score).padStart(3, '0')}`, 6, 4);
    const hs = getHighScore();
    const hsText = `HI ${String(hs).padStart(3, '0')}`;
    const hsWidth = ctx.measureText(hsText).width;
    ctx.fillText(hsText, canvas.width - hsWidth - 6, 4);

    if (state === 'ready') {
      overlayText(['PRESS START', 'OR AN ARROW KEY']);
    } else if (state === 'paused') {
      overlayText(['PAUSED']);
    } else if (state === 'over') {
      overlayText(['GAME OVER', `SCORE ${score}`, 'PRESS START']);
    }
  }

  function overlayText(lines) {
    ctx.fillStyle = 'rgba(155, 181, 60, 0.88)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = COLOR_PIXEL;
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lineHeight = 18;
    const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
    });
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
  }

  // ---------- Input ----------
  const KEY_TO_DIR = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right',
    W: 'up', S: 'down', A: 'left', D: 'right'
  };

  window.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      togglePause();
      return;
    }
    const dir = KEY_TO_DIR[e.key];
    if (dir) {
      e.preventDefault();
      setDirection(dir);
    }
  });

  document.querySelectorAll('.dpad-btn[data-dir]').forEach((btn) => {
    btn.addEventListener('click', () => setDirection(btn.dataset.dir));
  });

  document.querySelector('.dpad-btn[data-action="pause"]').addEventListener('click', togglePause);

  btnStart.addEventListener('click', togglePause);

  btnSound.addEventListener('click', () => {
    soundOn = !soundOn;
    btnSound.textContent = `Sound: ${soundOn ? 'On' : 'Off'}`;
  });

  // Basic swipe support on the LCD itself
  let touchStart = null;
  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) {
      togglePause();
    } else if (Math.abs(dx) > Math.abs(dy)) {
      setDirection(dx > 0 ? 'right' : 'left');
    } else {
      setDirection(dy > 0 ? 'down' : 'up');
    }
    touchStart = null;
  });

  resetGame();
})();
