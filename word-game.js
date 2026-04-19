// =============================================================
//  word-game.js
//  Wordle-style game — logic separated from rendering
// =============================================================

// ── Word List ─────────────────────────────────────────────────
const WORDS = [
  "CRANE", "SLATE", "AUDIO", "POINT", "BLAZE", "CRIMP", "FROST",
  "GLOOM", "HARSH", "INDEX", "JOUST", "KNACK", "LUNAR", "MANOR",
  "NYMPH", "OPTIC", "PLANK", "QUOTA", "RAVEN", "SHAWL", "TAUNT",
  "UMBRA", "VIVID", "WALTZ", "XENON", "YACHT", "ZONED", "BRISK",
  "CLEFT", "DELTA", "EMBER", "FLAIR", "GRAFT", "HOIST", "INGOT",
  "LAPEL", "MOURN", "NOTCH", "ONSET", "PRISM", "QUIRK", "RIVET",
  "SWAMP", "THYME", "USURP", "VENOM", "WRUNG", "YEARN", "ZESTY",
  "ABBEY", "BLUNT", "CHASE", "DROWN", "EQUAL", "FIEND", "GOUGE",
  "HAUNT", "ICING", "JERKY", "KNEEL", "LIBEL", "MOUND", "NUDGE",
  "OXIDE", "PLUCK", "REPEL", "SCOUT", "TROVE", "ULCER", "VOUCH",
  "WHIRL", "EXPEL", "YODEL", "ZILCH", "ABYSS", "BROOD", "CLAMP",
  "DEBUT", "EVOKE", "FLINT", "GRIPE", "HEIST", "IRONY", "KNAVE",
  "LIGHT", "MONTH", "NERVE", "OVOID", "PLEAD", "QUILL", "REACH",
  "SNARE", "TRAWL", "UNIFY", "VIGOR", "WRATH", "EXPAT", "ZIPPY"
];

function pickRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

// ── Game State ────────────────────────────────────────────────
const ROWS = 6;
const COLS = 5;

let game = {};

function initGame() {
  game = {
    targetWord:  pickRandomWord(),
    currentRow:  0,
    currentCol:  0,
    guesses:     Array.from({ length: ROWS }, () => Array(COLS).fill("")),
    feedback:    Array.from({ length: ROWS }, () => Array(COLS).fill(null)),
    state:       "playing"   // "playing" | "win" | "lose"
  };
}

// ── Logic ─────────────────────────────────────────────────────

function addLetter(letter) {
  if (game.state !== "playing") return;
  if (game.currentCol >= COLS) return;
  game.guesses[game.currentRow][game.currentCol] = letter;
  game.currentCol++;
}

function removeLetter() {
  if (game.state !== "playing") return;
  if (game.currentCol <= 0) return;
  game.currentCol--;
  game.guesses[game.currentRow][game.currentCol] = "";
}

function submitGuess() {
  if (game.state !== "playing") return false;
  if (game.currentCol < COLS) return false;   // incomplete row

  const guessArr  = game.guesses[game.currentRow];
  const targetArr = game.targetWord.split("");
  const result    = Array(COLS).fill("absent");

  // Pass 1 — mark correct positions
  const remainTarget = [...targetArr];
  for (let i = 0; i < COLS; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = "correct";
      remainTarget[i] = null;
    }
  }

  // Pass 2 — mark present letters
  for (let i = 0; i < COLS; i++) {
    if (result[i] === "correct") continue;
    const idx = remainTarget.indexOf(guessArr[i]);
    if (idx !== -1) {
      result[i] = "present";
      remainTarget[idx] = null;
    }
  }

  game.feedback[game.currentRow] = result;

  // Update state
  const guessWord = guessArr.join("");
  if (guessWord === game.targetWord) {
    game.state = "win";
  } else if (game.currentRow === ROWS - 1) {
    game.state = "lose";
  } else {
    game.currentRow++;
    game.currentCol = 0;
  }

  return true;
}

// ── Rendering ─────────────────────────────────────────────────

function renderBoard() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile  = getTile(r, c);
      const letter = game.guesses[r][c];
      const fb    = game.feedback[r][c];

      tile.textContent = letter;

      // Clear all state classes
      tile.classList.remove("filled", "correct", "present", "absent", "pop");

      if (fb) {
        tile.classList.add(fb);
      } else if (letter) {
        tile.classList.add("filled");
      }
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
    const tile = getTile(row, c);
    // Stagger the flip for each column
    setTimeout(() => {
      tile.classList.add("reveal");
      tile.addEventListener("animationend", () => {
        tile.classList.remove("reveal");
      }, { once: true });
    }, c * 80);
  }
  // Render status after the last tile flips
  setTimeout(() => renderStatus(), COLS * 80 + 350);
}

function shakeRow(row) {
  // Shake each tile in the current row
  for (let c = 0; c < COLS; c++) {
    const tile = getTile(row, c);
    tile.classList.add("row-shake");
    tile.addEventListener("animationend", () => tile.classList.remove("row-shake"), { once: true });
  }
}

function popTile(row, col) {
  const tile = getTile(row, col);
  tile.classList.remove("pop");
  // Force reflow so the animation re-triggers
  void tile.offsetWidth;
  tile.classList.add("pop");
}

function getTile(row, col) {
  return document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
}

// ── Board Initialization ───────────────────────────────────────

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

// ── Input Handling ────────────────────────────────────────────

document.addEventListener("keydown", (e) => {
  if (game.state !== "playing") return;

  const key = e.key;

  if (key === "Backspace") {
    removeLetter();
    renderBoard();
    return;
  }

  if (key === "Enter") {
    const prevRow = game.currentRow;
    const submitted = submitGuess();
    if (!submitted) {
      shakeRow(game.currentRow);
      return;
    }
    renderBoard();
    revealRow(prevRow);
    return;
  }

  if (/^[a-zA-Z]$/.test(key)) {
    const prevCol = game.currentCol;
    addLetter(key.toUpperCase());
    if (game.currentCol > prevCol) {
      renderBoard();
      popTile(game.currentRow, prevCol);
    }
  }
});

// ── Restart ───────────────────────────────────────────────────

document.getElementById("restart-btn").addEventListener("click", () => {
  initGame();
  buildBoard();
  renderBoard();
  renderStatus();
});

// ── Bootstrap ─────────────────────────────────────────────────

initGame();
buildBoard();
renderBoard();
renderStatus();
