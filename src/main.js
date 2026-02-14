import { Chessground } from "../chessground/dist/chessground.min.js";

const FILES = "abcdefgh";

const UPGRADE_POOL = [
  {
    id: "pawn_side_step",
    name: "Pawns: Side Step",
    text: "Pawns can move one tile sideways and capture sideways.",
    apply: (state) => {
      state.mods.pawnSideStep = true;
    },
  },
  {
    id: "bishop_guard",
    name: "Bishops: Guard Step",
    text: "Bishops can also move one tile orthogonally.",
    apply: (state) => {
      state.mods.bishopGuardStep = true;
    },
  },
  {
    id: "knight_chain",
    name: "Knights: Chain Capture",
    text: "Knight captures grant +1 action this turn.",
    apply: (state) => {
      state.mods.knightChain = true;
    },
  },
  {
    id: "rook_diagonal",
    name: "Rooks: Diagonal Jets",
    text: "Rooks gain diagonal movement up to 2 squares.",
    apply: (state) => {
      state.mods.rookDiagonal = true;
    },
  },
  {
    id: "double_command",
    name: "Global: Double Command",
    text: "You get +1 action every player turn.",
    apply: (state) => {
      state.mods.globalActions += 1;
    },
  },
  {
    id: "tempo_cycle",
    name: "Global: Tempo Cycle",
    text: "Every 3rd player turn, gain +1 action.",
    apply: (state) => {
      state.mods.periodicTempo = true;
    },
  },
  {
    id: "cryo_pulse",
    name: "Power: Cryo Pulse",
    text: "At round start, freeze enemies for one enemy phase.",
    apply: (state) => {
      state.mods.cryoPulse = true;
    },
  },
  {
    id: "royal_reach",
    name: "Kings: Royal Reach",
    text: "King can move up to 2 squares in any direction.",
    apply: (state) => {
      state.mods.kingRange = 2;
    },
  },
];

const BASE_ROUNDS = [
  { boardW: 6, boardH: 6, enemyCount: 5, target: 2, objective: "capture_count", turnLimit: 14, enemyActions: 1 },
  { boardW: 7, boardH: 7, enemyCount: 7, target: 1, objective: "check", turnLimit: 15, enemyActions: 1 },
  { boardW: 8, boardH: 8, enemyCount: 9, target: 4, objective: "capture_count", turnLimit: 16, enemyActions: 1 },
];

const statusEl = document.getElementById("status");
const objectiveEl = document.getElementById("objective");
const roundInfoEl = document.getElementById("roundInfo");
const logEl = document.getElementById("log");
const overlayEl = document.getElementById("overlay");
const overlayTitleEl = document.getElementById("overlayTitle");
const overlayBodyEl = document.getElementById("overlayBody");
const choicesEl = document.getElementById("choices");

const boardElement = document.getElementById("board");
const ground = Chessground(boardElement, {
  orientation: "white",
  movable: {
    free: false,
    color: "white",
    dests: new Map(),
    events: {
      after: (orig, dest) => {
        onPlayerMove(orig, dest);
      },
    },
  },
  premovable: { enabled: false },
  draggable: { enabled: true, showGhost: true },
  animation: { enabled: true, duration: 170 },
});

const state = {
  round: 0,
  turn: 1,
  boardW: 6,
  boardH: 6,
  pieces: [],
  captureCount: 0,
  deliveredCheck: false,
  actionsLeft: 1,
  queuedActions: 0,
  upgrades: [],
  objective: "capture_count",
  target: 2,
  turnLimit: 14,
  enemyActions: 1,
  gameOver: false,
  lastMove: undefined,
  lastInputSig: "",
  lastInputAt: 0,
  mods: {
    pawnSideStep: false,
    bishopGuardStep: false,
    knightChain: false,
    rookDiagonal: false,
    globalActions: 0,
    periodicTempo: false,
    cryoPulse: false,
    kingRange: 1,
  },
  freezeEnemyPhase: false,
};

function toKey(x, y) {
  return `${FILES[x]}${8 - y}`;
}

function fromKey(key) {
  const file = key[0];
  const rank = Number(key[1]);
  return {
    x: FILES.indexOf(file),
    y: 8 - rank,
  };
}

function randomOf(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function log(msg) {
  const line = document.createElement("div");
  line.className = "entry";
  line.textContent = msg;
  logEl.prepend(line);
}

function setupRound(roundIndex) {
  const config = BASE_ROUNDS[roundIndex] || generateRound(roundIndex);
  state.round = roundIndex;
  state.turn = 1;
  state.captureCount = 0;
  state.deliveredCheck = false;
  state.boardW = Math.min(8, config.boardW);
  state.boardH = Math.min(8, config.boardH);
  state.objective = config.objective;
  state.target = config.target;
  state.turnLimit = config.turnLimit;
  state.enemyActions = config.enemyActions;
  state.pieces = [];
  state.lastMove = undefined;
  state.freezeEnemyPhase = state.mods.cryoPulse;

  spawnSquads(config.enemyCount);
  startPlayerTurn();
  log(`Round ${roundIndex + 1} begins. Objective: ${objectiveText()}`);
  render();
}

function generateRound(roundIndex) {
  const wave = roundIndex - BASE_ROUNDS.length + 1;
  return {
    boardW: 8,
    boardH: 8,
    enemyCount: 9 + wave * 2,
    target: 4 + wave,
    objective: wave % 2 === 0 ? "check" : "capture_count",
    turnLimit: Math.max(12, 16 + Math.floor(wave / 2)),
    enemyActions: 1,
  };
}

function spawnSquads(enemyCount) {
  const playerTypes = ["king", "queen", "rook", "bishop", "knight", "pawn", "pawn"];
  const enemyPool = ["queen", "rook", "bishop", "knight", "pawn", "pawn", "pawn"];

  placePieces("player", playerTypes, 0, Math.max(1, Math.floor(state.boardW / 3)));
  placePieces("enemy", ["king"], state.boardW - 1, state.boardW - 1);
  const extra = Array.from({ length: Math.max(0, enemyCount - 1) }, () => randomOf(enemyPool));
  placePieces("enemy", extra, Math.max(0, state.boardW - 3), state.boardW - 1);
}

function placePieces(side, types, minX, maxX) {
  types.forEach((type, index) => {
    let attempts = 0;
    while (attempts < 200) {
      const x = minX + Math.floor(Math.random() * (maxX - minX + 1));
      const y = Math.floor(Math.random() * state.boardH);
      if (!pieceAt(x, y)) {
        state.pieces.push({
          id: `${side}-${type}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
          side,
          type,
          x,
          y,
        });
        break;
      }
      attempts += 1;
    }
  });
}

function pieceAt(x, y) {
  return state.pieces.find((p) => p.x === x && p.y === y);
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < state.boardW && y < state.boardH;
}

function movesFor(piece) {
  const result = [];
  const push = (x, y, sliding = false, sideDx = 0, sideDy = 0, maxRange = 1) => {
    for (let step = 1; step <= maxRange; step += 1) {
      const nx = x + sideDx * step;
      const ny = y + sideDy * step;
      if (!inBounds(nx, ny)) break;
      const occupant = pieceAt(nx, ny);
      if (!occupant) {
        result.push({ x: nx, y: ny, capture: false });
        if (!sliding) break;
      } else {
        if (occupant.side !== piece.side) result.push({ x: nx, y: ny, capture: true });
        break;
      }
    }
  };

  if (piece.type === "pawn") {
    const forward = piece.side === "player" ? 1 : -1;
    const fx = piece.x + forward;
    if (inBounds(fx, piece.y) && !pieceAt(fx, piece.y)) {
      result.push({ x: fx, y: piece.y, capture: false });
    }
    [piece.y - 1, piece.y + 1].forEach((ny) => {
      if (!inBounds(fx, ny)) return;
      const occ = pieceAt(fx, ny);
      if (occ && occ.side !== piece.side) result.push({ x: fx, y: ny, capture: true });
    });
    if (state.mods.pawnSideStep) {
      [piece.y - 1, piece.y + 1].forEach((ny) => {
        if (!inBounds(piece.x, ny)) return;
        const occ = pieceAt(piece.x, ny);
        if (!occ) result.push({ x: piece.x, y: ny, capture: false });
        if (occ && occ.side !== piece.side) result.push({ x: piece.x, y: ny, capture: true });
      });
    }
    return result;
  }

  if (piece.type === "knight") {
    const jumps = [
      [1, 2],
      [2, 1],
      [-1, 2],
      [-2, 1],
      [1, -2],
      [2, -1],
      [-1, -2],
      [-2, -1],
    ];
    jumps.forEach(([dx, dy]) => push(piece.x, piece.y, false, dx, dy, 1));
    return result;
  }

  const dirs = [];
  if (["rook", "queen"].includes(piece.type)) dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
  if (["bishop", "queen"].includes(piece.type)) dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);

  if (piece.type === "king") {
    const range = state.mods.kingRange || 1;
    [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ].forEach(([dx, dy]) => {
      push(piece.x, piece.y, true, dx, dy, range);
    });
    return result;
  }

  if (piece.type === "bishop" && state.mods.bishopGuardStep) {
    [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].forEach(([dx, dy]) => push(piece.x, piece.y, false, dx, dy, 1));
  }

  if (piece.type === "rook" && state.mods.rookDiagonal) {
    [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ].forEach(([dx, dy]) => push(piece.x, piece.y, true, dx, dy, 2));
  }

  dirs.forEach(([dx, dy]) => push(piece.x, piece.y, true, dx, dy, 99));
  return result;
}

function startPlayerTurn() {
  state.lastInputSig = "";
  state.lastInputAt = 0;
  state.actionsLeft = 1 + state.mods.globalActions + state.queuedActions;
  state.queuedActions = 0;
  if (state.mods.periodicTempo && state.turn % 3 === 0) {
    state.actionsLeft += 1;
    log("Tempo Cycle grants +1 action.");
  }
}

function onPlayerMove(origKey, destKey) {
  if (origKey === destKey) return;
  const now = Date.now();
  const sig = `${origKey}-${destKey}`;
  if (state.lastInputSig === sig && now - state.lastInputAt < 250) return;
  state.lastInputSig = sig;
  state.lastInputAt = now;

  if (state.gameOver || state.actionsLeft <= 0) {
    render();
    return;
  }
  const orig = fromKey(origKey);
  const dest = fromKey(destKey);
  const piece = pieceAt(orig.x, orig.y);
  if (!piece || piece.side !== "player") {
    render();
    return;
  }
  const legal = movesFor(piece).find((m) => m.x === dest.x && m.y === dest.y);
  if (!legal) {
    render();
    return;
  }
  state.lastMove = [origKey, destKey];
  applyMove(piece, legal);
}

function applyMove(piece, move) {
  const fromKeyVal = toKey(piece.x, piece.y);
  const toKeyVal = toKey(move.x, move.y);
  const target = pieceAt(move.x, move.y);
  if (target && target.side !== piece.side) {
    state.pieces = state.pieces.filter((p) => p.id !== target.id);
    if (piece.side === "player") {
      state.captureCount += 1;
      log(`Captured enemy ${target.type}.`);
      if (piece.type === "knight" && state.mods.knightChain) {
        state.actionsLeft += 1;
        log("Knight chain grants +1 action.");
      }
    }
  }

  piece.x = move.x;
  piece.y = move.y;
  state.lastMove = [fromKeyVal, toKeyVal];

  if (piece.side === "player" && checkDelivered()) {
    state.deliveredCheck = true;
  }

  if (checkRoundWin()) {
    showUpgradeSelection();
    render();
    return;
  }

  state.actionsLeft -= 1;
  if (state.actionsLeft <= 0) {
    enemyPhase();
    state.turn += 1;
    if (checkLoss()) {
      showRestart("Defeat", "You lost this run. Restart and try a different upgrade path.");
      render();
      return;
    }
    startPlayerTurn();
  }
  render();
}

function checkDelivered() {
  const enemyKings = state.pieces.filter((p) => p.side === "enemy" && p.type === "king");
  const friendlies = state.pieces.filter((p) => p.side === "player");
  return enemyKings.some((king) =>
    friendlies.some((piece) => movesFor(piece).some((m) => m.capture && m.x === king.x && m.y === king.y)),
  );
}

function checkRoundWin() {
  if (state.objective === "capture_count") return state.captureCount >= state.target;
  if (state.objective === "check") return state.deliveredCheck;
  return false;
}

function checkLoss() {
  const hasKing = state.pieces.some((p) => p.side === "player" && p.type === "king");
  const hasPieces = state.pieces.some((p) => p.side === "player");
  return !hasKing || !hasPieces || state.turn > state.turnLimit;
}

function enemyPhase() {
  if (state.freezeEnemyPhase) {
    log("Cryo Pulse froze enemies for this phase.");
    state.freezeEnemyPhase = false;
    return;
  }

  const enemies = state.pieces.filter((p) => p.side === "enemy");
  const actors = enemies.slice(0, Math.min(state.enemyActions, enemies.length));
  log(`Enemy phase: ${actors.length} action${actors.length === 1 ? "" : "s"}.`);

  actors.forEach((enemy) => {
    const from = toKey(enemy.x, enemy.y);
    const allMoves = movesFor(enemy);
    if (!allMoves.length) return;
    const captures = allMoves.filter((m) => m.capture);
    const move = captures[0] || pickGreedyMove(allMoves);
    const target = pieceAt(move.x, move.y);
    if (target && target.side === "player") {
      state.pieces = state.pieces.filter((p) => p.id !== target.id);
      log(`Enemy ${enemy.type} captured your ${target.type}.`);
    }
    enemy.x = move.x;
    enemy.y = move.y;
    state.lastMove = [from, toKey(enemy.x, enemy.y)];
  });
}

function pickGreedyMove(moves) {
  const playerPieces = state.pieces.filter((p) => p.side === "player");
  if (!playerPieces.length) return moves[0];
  const nearestDistance = (move) => {
    let best = Number.POSITIVE_INFINITY;
    playerPieces.forEach((p) => {
      const d = Math.abs(p.x - move.x) + Math.abs(p.y - move.y);
      if (d < best) best = d;
    });
    return best;
  };
  return moves.reduce((best, current) => (nearestDistance(current) < nearestDistance(best) ? current : best), moves[0]);
}

function showUpgradeSelection() {
  if (state.round >= 5) {
    showRestart("Victory", "Prototype run complete. Endless scaling can be added next.");
    return;
  }

  const options = randomUpgradeChoices(3);
  overlayTitleEl.textContent = `Round ${state.round + 1} cleared`;
  overlayBodyEl.textContent = "Choose one upgrade.";
  choicesEl.innerHTML = "";

  options.forEach((upg) => {
    const button = document.createElement("button");
    button.className = "choiceBtn";
    button.innerHTML = `<strong>${upg.name}</strong><br>${upg.text}`;
    button.addEventListener("click", () => {
      upg.apply(state);
      state.upgrades.push(upg.id);
      hideOverlay();
      setupRound(state.round + 1);
    });
    choicesEl.appendChild(button);
  });

  overlayEl.classList.remove("hidden");
}

function showRestart(title, body) {
  state.gameOver = true;
  overlayTitleEl.textContent = title;
  overlayBodyEl.textContent = body;
  choicesEl.innerHTML = "";

  const restart = document.createElement("button");
  restart.className = "choiceBtn";
  restart.textContent = "Start New Run";
  restart.addEventListener("click", () => {
    resetRun();
  });

  choicesEl.appendChild(restart);
  overlayEl.classList.remove("hidden");
}

function hideOverlay() {
  overlayEl.classList.add("hidden");
}

function randomUpgradeChoices(count) {
  const owned = new Set(state.upgrades);
  const pool = UPGRADE_POOL.filter((u) => !owned.has(u.id));
  const choices = [];

  while (choices.length < count && pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    choices.push(pool.splice(idx, 1)[0]);
  }

  return choices;
}

function objectiveText() {
  if (state.objective === "capture_count") return `Capture ${state.target} enemy pieces`;
  if (state.objective === "check") return "Deliver check to enemy king";
  return "Unknown objective";
}

function chessgroundPieces() {
  const map = new Map();
  state.pieces.forEach((piece) => {
    map.set(toKey(piece.x, piece.y), {
      role: piece.type,
      color: piece.side === "player" ? "white" : "black",
    });
  });
  return map;
}

function piecesToFen() {
  const rows = [];
  for (let y = 0; y < 8; y += 1) {
    let row = "";
    let empty = 0;
    for (let x = 0; x < 8; x += 1) {
      const piece = pieceAt(x, y);
      if (!piece) {
        empty += 1;
        continue;
      }
      if (empty > 0) {
        row += String(empty);
        empty = 0;
      }
      const symbol = piece.type === "knight" ? "n" : piece.type[0];
      row += piece.side === "player" ? symbol.toUpperCase() : symbol;
    }
    if (empty > 0) row += String(empty);
    rows.push(row || "8");
  }
  return rows.join("/");
}

function playerDests() {
  const map = new Map();
  state.pieces
    .filter((p) => p.side === "player")
    .forEach((piece) => {
      const destinations = movesFor(piece).map((m) => toKey(m.x, m.y));
      if (destinations.length) map.set(toKey(piece.x, piece.y), destinations);
    });
  return map;
}

function outOfBoundsClasses() {
  const classes = new Map();
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      if (x >= state.boardW || y >= state.boardH) {
        classes.set(toKey(x, y), "outBounds");
      }
    }
  }
  return classes;
}

function render() {
  ground.set({
    fen: piecesToFen(),
    turnColor: "white",
    lastMove: state.lastMove,
    movable: {
      color: state.gameOver ? undefined : "white",
      dests: state.gameOver ? new Map() : playerDests(),
    },
    highlight: {
      lastMove: true,
      check: true,
      custom: outOfBoundsClasses(),
    },
  });

  statusEl.textContent = `Turn ${state.turn} | Actions left: ${state.actionsLeft}`;
  objectiveEl.textContent = `Objective: ${objectiveText()}`;
  roundInfoEl.textContent = `Round ${state.round + 1} | Active area ${state.boardW}x${state.boardH} | Turn limit ${state.turnLimit}`;
}

function resetRun() {
  state.gameOver = false;
  state.upgrades = [];
  state.lastMove = undefined;
  state.mods = {
    pawnSideStep: false,
    bishopGuardStep: false,
    knightChain: false,
    rookDiagonal: false,
    globalActions: 0,
    periodicTempo: false,
    cryoPulse: false,
    kingRange: 1,
  };
  hideOverlay();
  setupRound(0);
}

resetRun();
