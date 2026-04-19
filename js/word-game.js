const WORDS = [
  "CRANE","SLATE","AUDIO","POINT","BLAZE","CRIMP","FROST","GLOOM","HARSH","INDEX",
  "JOUST","KNACK","LUNAR","MANOR","NYMPH","OPTIC","PLANK","QUOTA","RAVEN","SHAWL",
  "TAUNT","UMBRA","VIVID","WALTZ","XENON","YACHT","ZONED","BRISK","CLEFT","DELTA",
  "EMBER","FLAIR","GRAFT","HOIST","INGOT","LAPEL","MOURN","NOTCH","ONSET","PRISM",
  "QUIRK","RIVET","SWAMP","THYME","USURP","VENOM","WRUNG","YEARN","ZESTY","ABBEY",
  "BLUNT","CHASE","DROWN","EQUAL","FIEND","GOUGE","HAUNT","ICING","JERKY","KNEEL",
  "LIBEL","MOUND","NUDGE","OXIDE","PLUCK","REPEL","SCOUT","TROVE","ULCER","VOUCH",
  "WHIRL","EXPEL","YODEL","ZILCH","ABYSS","BROOD","CLAMP","DEBUT","EVOKE","FLINT",
  "GRIPE","HEIST","IRONY","KNAVE","LIGHT","MONTH","NERVE","OVOID","PLEAD","QUILL",
  "REACH","SNARE","TRAWL","UNIFY","VIGOR","WRATH","EXPAT","ZIPPY"
];

const ROWS = 6, COLS = 5;
let game = {};

// ── Logic ──────────────────────────────────────────────────────

function pickRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function initGame() {
  game = {
    targetWord: pickRandomWord(),
    currentRow: 0,
    currentCol: 0,
    guesses:  Array.from({ length: ROWS }, () => Array(COLS).fill("")),
    feedback: Array.from({ length: ROWS }, () => Array(COLS).fill(null)),
    state: "playing"
  };
}

function addLetter(letter) {
  if (game.state !== "playing" || game.currentCol >= COLS) return;
  game.guesses[game.currentRow][game.currentCol++] = letter;
}

function removeLetter() {
  if (game.state !== "playing" || game.currentCol <= 0) return;
  game.guesses[game.currentRow][--game.currentCol] = "";
}

function submitGuess() {
  if (game.state !== "playing" || game.currentCol < COLS) return false;

  const guessArr  = game.guesses[game.currentRow];
  const targetArr = game.targetWord.split("");
  const result    = Array(COLS).fill("absent");
  const remaining = [...targetArr];

  // Pass 1 — correct positions
  for (let i = 0; i < COLS; i++) {
    if (guessArr[i] === targetArr[i]) { result[i] = "correct"; remaining[i] = null; }
  }
  // Pass 2 — present letters
  for (let i = 0; i < COLS; i++) {
    if (result[i] === "correct") continue;
    const idx = remaining.indexOf(guessArr[i]);
    if (idx !== -1) { result[i] = "present"; remaining[idx] = null; }
  }

  game.feedback[game.currentRow] = result;

  const guessWord = guessArr.join("");
  if (guessWord === game.targetWord)     game.state = "win";
  else if (game.currentRow === ROWS - 1) game.state = "lose";
  else { game.currentRow++; game.currentCol = 0; }

  return true;
}

// ── Rendering ──────────────────────────────────────────────────

function getTile(r, c) {
  return document.querySelector(`.tile[data-row="${r}"][data-col="${c}"]`);
}

function renderBoard() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile   = getTile(r, c);
      const letter = game.guesses[r][c];
      const fb     = game.feedback[r][c];
      tile.textContent = letter;
      tile.classList.remove("filled", "correct", "present", "absent", "pop");
      if (fb)          tile.classList.add(fb);
      else if (letter) tile.classList.add("filled");
    }
  }
}

function renderStatus() {
  const el = document.getElementById("status-message");
  el.classList.remove("win", "lose");
  if (game.state === "win") {
    el.textContent = "Nice — you got it!";
    el.classList.add("win");
  } else if (game.state === "lose") {
    el.textContent = `The word was ${game.targetWord}.`;
    el.classList.add("lose");
  } else {
    el.textContent = "";
  }
}

function revealRow(row) {
  for (let c = 0; c < COLS; c++) {
    const fb = game.feedback[row][c];
    setTimeout(() => {
      const tile = getTile(row, c);
      tile.classList.remove("filled");
      tile.classList.add("flip-out");
      tile.addEventListener("animationend", () => {
        tile.classList.remove("flip-out");
        tile.classList.add(fb, "flip-in");
        tile.addEventListener("animationend", () => {
          tile.classList.remove("flip-in");
        }, { once: true });
      }, { once: true });
    }, c * 80);
  }

  const done = COLS * 80 + 350 + 50;
  setTimeout(renderStatus, done);
  setTimeout(() => {
    if (game.state !== "playing") {
      document.getElementById("restart-btn").classList.add("active");
    }
  }, done + 50);
}

function shakeRow(row) {
  for (let c = 0; c < COLS; c++) {
    const tile = getTile(row, c);
    tile.classList.add("row-shake");
    tile.addEventListener("animationend", () => tile.classList.remove("row-shake"), { once: true });
  }
}

function popTile(row, col) {
  const tile = getTile(row, col);
  tile.classList.remove("pop");
  void tile.offsetWidth;
  tile.classList.add("pop");
}

// ── Board ──────────────────────────────────────────────────────

function buildBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      tile.dataset.row = r;
      tile.dataset.col = c;
      board.appendChild(tile);
    }
  }
}

// ── Restart ────────────────────────────────────────────────────

function restartGame() {
  initGame();
  buildBoard();
  renderBoard();
  renderStatus();
  document.getElementById("restart-btn").classList.remove("active");
  document.getElementById("restart-btn").blur();
}

// ── Input ──────────────────────────────────────────────────────

document.addEventListener("keydown", (e) => {
  if (game.state !== "playing") {
    if (e.key === "Enter") restartGame();
    return;
  }
  if (e.key === "Backspace") { removeLetter(); renderBoard(); return; }
  if (e.key === "Enter") {
    const prevRow = game.currentRow;
    if (!submitGuess()) { shakeRow(game.currentRow); return; }
    renderBoard();
    revealRow(prevRow);
    return;
  }
  if (/^[a-zA-Z]$/.test(e.key)) {
    const prevCol = game.currentCol;
    addLetter(e.key.toUpperCase());
    if (game.currentCol > prevCol) { renderBoard(); popTile(game.currentRow, prevCol); }
  }
});

document.getElementById("restart-btn").addEventListener("click", restartGame);

// ── Init ───────────────────────────────────────────────────────

initGame();
buildBoard();
renderBoard();
renderStatus();
