import { Chessground } from "../chessground/dist/chessground.js";
import type { Api } from "../chessground/dist/api.js";
import type { Config } from "../chessground/dist/config.js";
import type * as cg from "../chessground/dist/types.js";

const FILES = "abcdefgh";

type Side = "player" | "enemy";
type Objective = "capture_count" | "check";
type PieceType = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";
type Difficulty = "Easy" | "Normal" | "Hard" | "Expert";

interface Move {
  x: number;
  y: number;
  capture: boolean;
}

interface Coord {
  x: number;
  y: number;
}

interface Piece {
  id: string;
  side: Side;
  type: PieceType;
  x: number;
  y: number;
}

interface Mods {
  pawnSideStep: boolean;
  bishopGuardStep: boolean;
  knightChain: boolean;
  rookDiagonal: boolean;
  globalActions: number;
  periodicTempo: boolean;
  cryoPulse: boolean;
  kingRange: number;
}

interface RoundConfig {
  boardW: number;
  boardH: number;
  enemyCount: number;
  target: number;
  objective: Objective;
  turnLimit: number;
  enemyActions: number;
  aiDepth: number;
  aiDifficulty?: Difficulty;
}

interface Upgrade {
  id: string;
  name: string;
  text: string;
  apply: (state: GameState) => void;
}

interface MoveSelection {
  piece: Piece;
  move: Move;
}

interface GameState {
  round: number;
  turn: number;
  boardW: number;
  boardH: number;
  pieces: Piece[];
  captureCount: number;
  deliveredCheck: boolean;
  actionsLeft: number;
  queuedActions: number;
  upgrades: string[];
  objective: Objective;
  target: number;
  turnLimit: number;
  enemyActions: number;
  aiDepth: number;
  aiDifficulty: Difficulty;
  gameOver: boolean;
  lastMove?: [cg.Key, cg.Key];
  lastInputSig: string;
  lastInputAt: number;
  mods: Mods;
  freezeEnemyPhase: boolean;
}

function requireElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing required element: #${id}`);
  return el as T;
}

const PIECE_VALUE: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 1000,
};

const UPGRADE_POOL: Upgrade[] = [
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

const BASE_ROUNDS: RoundConfig[] = [
  {
    boardW: 6,
    boardH: 6,
    enemyCount: 5,
    target: 2,
    objective: "capture_count",
    turnLimit: 14,
    enemyActions: 1,
    aiDepth: 1,
    aiDifficulty: "Easy",
  },
  {
    boardW: 7,
    boardH: 7,
    enemyCount: 7,
    target: 1,
    objective: "check",
    turnLimit: 15,
    enemyActions: 1,
    aiDepth: 2,
    aiDifficulty: "Normal",
  },
  {
    boardW: 8,
    boardH: 8,
    enemyCount: 9,
    target: 4,
    objective: "capture_count",
    turnLimit: 16,
    enemyActions: 1,
    aiDepth: 2,
    aiDifficulty: "Normal",
  },
];

const statusEl = requireElement<HTMLElement>("status");
const objectiveEl = requireElement<HTMLElement>("objective");
const roundInfoEl = requireElement<HTMLElement>("roundInfo");
const logEl = requireElement<HTMLElement>("log");
const overlayEl = requireElement<HTMLElement>("overlay");
const overlayTitleEl = requireElement<HTMLElement>("overlayTitle");
const overlayBodyEl = requireElement<HTMLElement>("overlayBody");
const choicesEl = requireElement<HTMLElement>("choices");

const boardElement = requireElement<HTMLElement>("board");
const groundConfig: Config = {
  orientation: "white",
  movable: {
    free: false,
    color: "white",
    dests: new Map<cg.Key, cg.Key[]>(),
    events: {
      after: (orig, dest) => {
        onPlayerMove(orig, dest);
      },
    },
  },
  premovable: { enabled: false },
  draggable: { enabled: true, showGhost: true },
  animation: { enabled: true, duration: 170 },
};
const ground: Api = Chessground(boardElement, groundConfig);

const state: GameState = {
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
  aiDepth: 1,
  aiDifficulty: "Easy",
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

function toKey(x: number, y: number): cg.Key {
  return `${FILES[x]}${8 - y}` as cg.Key;
}

function fromKey(key: cg.Key): Coord {
  const file = key[0];
  const rank = Number(key[1]);
  return {
    x: FILES.indexOf(file),
    y: 8 - rank,
  };
}

function randomOf<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function log(msg: string): void {
  const line = document.createElement("div");
  line.className = "entry";
  line.textContent = msg;
  logEl.prepend(line);
}

function aiDepthForRound(roundIndex: number): number {
  if (roundIndex <= 0) return 1;
  if (roundIndex <= 2) return 2;
  if (roundIndex <= 4) return 3;
  return 4;
}

function difficultyLabelForDepth(depth: number): Difficulty {
  if (depth <= 1) return "Easy";
  if (depth === 2) return "Normal";
  if (depth === 3) return "Hard";
  return "Expert";
}

function setupRound(roundIndex: number): void {
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
  state.aiDepth = config.aiDepth ?? aiDepthForRound(roundIndex);
  state.aiDifficulty = config.aiDifficulty ?? difficultyLabelForDepth(state.aiDepth);
  state.pieces = [];
  state.lastMove = undefined;
  state.freezeEnemyPhase = state.mods.cryoPulse;

  spawnSquads(config.enemyCount);
  startPlayerTurn();
  log(`Round ${roundIndex + 1} begins (${state.aiDifficulty}, AI depth ${state.aiDepth}). Objective: ${objectiveText()}`);
  render();
}

function generateRound(roundIndex: number): RoundConfig {
  const wave = roundIndex - BASE_ROUNDS.length + 1;
  const depth = aiDepthForRound(roundIndex);
  return {
    boardW: 8,
    boardH: 8,
    enemyCount: 9 + wave * 2,
    target: 4 + wave,
    objective: wave % 2 === 0 ? "check" : "capture_count",
    turnLimit: Math.max(12, 16 + Math.floor(wave / 2)),
    enemyActions: 1,
    aiDepth: depth,
    aiDifficulty: difficultyLabelForDepth(depth),
  };
}

function spawnSquads(enemyCount: number): void {
  const playerTypes: PieceType[] = ["king", "queen", "rook", "bishop", "knight", "pawn", "pawn"];
  const enemyPool: PieceType[] = ["queen", "rook", "bishop", "knight", "pawn", "pawn", "pawn"];

  const playerBandStart = Math.max(0, state.boardH - Math.max(2, Math.ceil(state.boardH / 3)));
  const enemyBandEnd = Math.min(state.boardH - 1, Math.max(1, Math.floor(state.boardH / 3)));

  placePieces("player", playerTypes, playerBandStart, state.boardH - 1);
  placePieces("enemy", ["king"], 0, 0);
  const extra: PieceType[] = Array.from({ length: Math.max(0, enemyCount - 1) }, () => randomOf(enemyPool));
  placePieces("enemy", extra, 0, enemyBandEnd);
}

function placePieces(side: Side, types: PieceType[], minY: number, maxY: number): void {
  types.forEach((type, index) => {
    let attempts = 0;
    while (attempts < 200) {
      const x = Math.floor(Math.random() * state.boardW);
      const y = minY + Math.floor(Math.random() * (maxY - minY + 1));
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

function pieceAtOn(pieces: Piece[], x: number, y: number): Piece | undefined {
  return pieces.find((p) => p.x === x && p.y === y);
}

function pieceAt(x: number, y: number): Piece | undefined {
  return pieceAtOn(state.pieces, x, y);
}

function inBounds(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < state.boardW && y < state.boardH;
}

function movesFor(piece: Piece, pieces: Piece[] = state.pieces): Move[] {
  const result: Move[] = [];
  const playerBuffed = piece.side === "player";
  const push = (
    x: number,
    y: number,
    sliding = false,
    sideDx = 0,
    sideDy = 0,
    maxRange = 1,
  ): void => {
    for (let step = 1; step <= maxRange; step += 1) {
      const nx = x + sideDx * step;
      const ny = y + sideDy * step;
      if (!inBounds(nx, ny)) break;
      const occupant = pieceAtOn(pieces, nx, ny);
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
    const forward = piece.side === "player" ? -1 : 1;
    const fy = piece.y + forward;
    if (inBounds(piece.x, fy) && !pieceAtOn(pieces, piece.x, fy)) {
      result.push({ x: piece.x, y: fy, capture: false });
    }
    [piece.x - 1, piece.x + 1].forEach((nx) => {
      if (!inBounds(nx, fy)) return;
      const occ = pieceAtOn(pieces, nx, fy);
      if (occ && occ.side !== piece.side) result.push({ x: nx, y: fy, capture: true });
    });
    if (playerBuffed && state.mods.pawnSideStep) {
      [piece.x - 1, piece.x + 1].forEach((nx) => {
        if (!inBounds(nx, piece.y)) return;
        const occ = pieceAtOn(pieces, nx, piece.y);
        if (!occ) result.push({ x: nx, y: piece.y, capture: false });
        if (occ && occ.side !== piece.side) result.push({ x: nx, y: piece.y, capture: true });
      });
    }
    return result;
  }

  if (piece.type === "knight") {
    const jumps: Array<[number, number]> = [
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

  const dirs: Array<[number, number]> = [];
  if (["rook", "queen"].includes(piece.type)) dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
  if (["bishop", "queen"].includes(piece.type)) dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);

  if (piece.type === "king") {
    const range = playerBuffed ? state.mods.kingRange || 1 : 1;
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

  if (piece.type === "bishop" && playerBuffed && state.mods.bishopGuardStep) {
    [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].forEach(([dx, dy]) => push(piece.x, piece.y, false, dx, dy, 1));
  }

  if (piece.type === "rook" && playerBuffed && state.mods.rookDiagonal) {
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

function clonePieces(pieces: Piece[]): Piece[] {
  return pieces.map((p) => ({ ...p }));
}

function applyMoveOn(pieces: Piece[], pieceId: string, move: Move): Piece[] {
  const next = clonePieces(pieces).filter((p) => !(p.x === move.x && p.y === move.y));
  const moving = next.find((p) => p.id === pieceId);
  if (!moving) return pieces;
  moving.x = move.x;
  moving.y = move.y;
  return next;
}

function isSquareAttacked(side: Side, x: number, y: number, pieces: Piece[] = state.pieces): boolean {
  const attackers = pieces.filter((p) => p.side !== side);
  return attackers.some((piece) => movesFor(piece, pieces).some((m) => m.capture && m.x === x && m.y === y));
}

function kingForSide(side: Side, pieces: Piece[] = state.pieces): Piece | undefined {
  return pieces.find((p) => p.side === side && p.type === "king");
}

function isKingInCheck(side: Side, pieces: Piece[] = state.pieces): boolean {
  const king = kingForSide(side, pieces);
  if (!king) return true;
  return isSquareAttacked(side, king.x, king.y, pieces);
}

function legalMovesFor(piece: Piece, pieces: Piece[] = state.pieces): Move[] {
  return movesFor(piece, pieces).filter((move) => {
    const next = applyMoveOn(pieces, piece.id, move);
    return !isKingInCheck(piece.side, next);
  });
}

function allLegalMovesForSide(side: Side, pieces: Piece[] = state.pieces): MoveSelection[] {
  const list: MoveSelection[] = [];
  pieces
    .filter((p) => p.side === side)
    .forEach((piece) => {
      legalMovesFor(piece, pieces).forEach((move) => {
        list.push({ piece, move });
      });
    });
  return list;
}

function isCheckmate(side: Side, pieces: Piece[] = state.pieces): boolean {
  return isKingInCheck(side, pieces) && allLegalMovesForSide(side, pieces).length === 0;
}

function evaluatePosition(pieces: Piece[]): number {
  if (isCheckmate("player", pieces)) return 100000;
  if (isCheckmate("enemy", pieces)) return -100000;

  let material = 0;
  pieces.forEach((piece) => {
    const value = PIECE_VALUE[piece.type] || 0;
    material += piece.side === "enemy" ? value : -value;
  });

  if (isKingInCheck("player", pieces)) material += 0.5;
  if (isKingInCheck("enemy", pieces)) material -= 0.5;

  return material;
}

function minimax(pieces: Piece[], depth: number, maximizingEnemy: boolean, alpha = -Infinity, beta = Infinity): number {
  if (depth <= 0 || isCheckmate("player", pieces) || isCheckmate("enemy", pieces)) {
    return evaluatePosition(pieces);
  }

  const side = maximizingEnemy ? "enemy" : "player";
  const moves = allLegalMovesForSide(side, pieces);
  if (!moves.length) return evaluatePosition(pieces);

  if (maximizingEnemy) {
    let best = -Infinity;
    for (let i = 0; i < moves.length; i += 1) {
      const { piece, move } = moves[i];
      const next = applyMoveOn(pieces, piece.id, move);
      const score = minimax(next, depth - 1, false, alpha, beta);
      if (score > best) best = score;
      if (best > alpha) alpha = best;
      if (beta <= alpha) break;
    }
    return best;
  }

  let best = Infinity;
  for (let i = 0; i < moves.length; i += 1) {
    const { piece, move } = moves[i];
    const next = applyMoveOn(pieces, piece.id, move);
    const score = minimax(next, depth - 1, true, alpha, beta);
    if (score < best) best = score;
    if (best < beta) beta = best;
    if (beta <= alpha) break;
  }
  return best;
}

function chooseEnemyMove(enemy: Piece, pieces: Piece[]): Move | null {
  const legalMoves = legalMovesFor(enemy, pieces);
  if (!legalMoves.length) return null;

  if (state.aiDepth <= 0) {
    const captures = legalMoves.filter((m) => m.capture);
    return captures[0] || pickGreedyMove(legalMoves);
  }

  let bestMove = legalMoves[0];
  let bestScore = -Infinity;
  for (let i = 0; i < legalMoves.length; i += 1) {
    const move = legalMoves[i];
    const next = applyMoveOn(pieces, enemy.id, move);
    const score = minimax(next, Math.max(0, state.aiDepth - 1), false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

function startPlayerTurn(): void {
  state.lastInputSig = "";
  state.lastInputAt = 0;
  state.actionsLeft = 1 + state.mods.globalActions + state.queuedActions;
  state.queuedActions = 0;
  if (state.mods.periodicTempo && state.turn % 3 === 0) {
    state.actionsLeft += 1;
    log("Tempo Cycle grants +1 action.");
  }
}

function onPlayerMove(origKey: cg.Key, destKey: cg.Key): void {
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
  const legal = legalMovesFor(piece).find((m) => m.x === dest.x && m.y === dest.y);
  if (!legal) {
    render();
    return;
  }
  state.lastMove = [origKey, destKey];
  applyMove(piece, legal);
}

function applyMove(piece: Piece, move: Move): void {
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

  if (piece.side === "player" && isKingInCheck("enemy")) {
    state.deliveredCheck = true;
    if (isCheckmate("enemy")) {
      log("Checkmate on enemy king.");
    } else {
      log("Check on enemy king.");
    }
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

function checkRoundWin(): boolean {
  if (state.objective === "capture_count") return state.captureCount >= state.target;
  if (state.objective === "check") return state.deliveredCheck || isKingInCheck("enemy") || isCheckmate("enemy");
  return false;
}

function checkLoss(): boolean {
  const hasKing = state.pieces.some((p) => p.side === "player" && p.type === "king");
  const hasPieces = state.pieces.some((p) => p.side === "player");
  return !hasKing || !hasPieces || state.turn > state.turnLimit || isCheckmate("player");
}

function enemyPhase(): void {
  if (state.freezeEnemyPhase) {
    log("Cryo Pulse froze enemies for this phase.");
    state.freezeEnemyPhase = false;
    return;
  }

  const moved = new Set<string>();
  let actionsTaken = 0;
  for (let action = 0; action < state.enemyActions; action += 1) {
    const enemies = state.pieces.filter((p) => p.side === "enemy" && !moved.has(p.id));
    const candidates = enemies.filter((enemy) => legalMovesFor(enemy).length > 0);
    if (!candidates.length) break;

    const enemyInCheck = isKingInCheck("enemy");
    const nonKing = candidates.filter((p) => p.type !== "king");
    const pool = !enemyInCheck && nonKing.length ? nonKing : candidates;

    let bestActor = pool[0];
    let bestMove = chooseEnemyMove(bestActor, state.pieces);
    let bestScore = bestMove
      ? minimax(applyMoveOn(state.pieces, bestActor.id, bestMove), Math.max(0, state.aiDepth - 1), false)
      : -Infinity;

    for (let i = 1; i < pool.length; i += 1) {
      const actor = pool[i];
      const move = chooseEnemyMove(actor, state.pieces);
      if (!move) continue;
      const score = minimax(applyMoveOn(state.pieces, actor.id, move), Math.max(0, state.aiDepth - 1), false);
      if (score > bestScore) {
        bestScore = score;
        bestActor = actor;
        bestMove = move;
      }
    }

    if (!bestMove) continue;

    const from = toKey(bestActor.x, bestActor.y);
    const target = pieceAt(bestMove.x, bestMove.y);
    if (target && target.side === "player") {
      state.pieces = state.pieces.filter((p) => p.id !== target.id);
      log(`Enemy ${bestActor.type} captured your ${target.type}.`);
    }
    bestActor.x = bestMove.x;
    bestActor.y = bestMove.y;
    state.lastMove = [from, toKey(bestActor.x, bestActor.y)];
    moved.add(bestActor.id);
    actionsTaken += 1;
  }

  log(
    `Enemy phase: ${actionsTaken} action${actionsTaken === 1 ? "" : "s"} (${state.aiDifficulty}, AI depth ${state.aiDepth}).`,
  );
}

function pickGreedyMove(moves: Move[]): Move {
  const playerPieces = state.pieces.filter((p) => p.side === "player");
  if (!playerPieces.length) return moves[0];
  const nearestDistance = (move: Move): number => {
    let best = Number.POSITIVE_INFINITY;
    playerPieces.forEach((p) => {
      const d = Math.abs(p.x - move.x) + Math.abs(p.y - move.y);
      if (d < best) best = d;
    });
    return best;
  };
  return moves.reduce((best, current) =>
    nearestDistance(current) < nearestDistance(best) ? current : best,
  moves[0]);
}

function showUpgradeSelection(): void {
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

function showRestart(title: string, body: string): void {
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

function hideOverlay(): void {
  overlayEl.classList.add("hidden");
}

function randomUpgradeChoices(count: number): Upgrade[] {
  const owned = new Set<string>(state.upgrades);
  const pool = UPGRADE_POOL.filter((u) => !owned.has(u.id));
  const choices: Upgrade[] = [];

  while (choices.length < count && pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    choices.push(pool.splice(idx, 1)[0]);
  }

  return choices;
}

function objectiveText(): string {
  if (state.objective === "capture_count") return `Capture ${state.target} enemy pieces`;
  if (state.objective === "check") return "Deliver check to enemy king";
  return "Unknown objective";
}

function chessgroundPieces(): cg.Pieces {
  const map = new Map<cg.Key, cg.Piece>();
  state.pieces.forEach((piece) => {
    map.set(toKey(piece.x, piece.y), {
      role: piece.type,
      color: piece.side === "player" ? "white" : "black",
    });
  });
  return map;
}

function piecesToFen(): string {
  const rows: string[] = [];
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

function playerDests(): cg.Dests {
  const map = new Map<cg.Key, cg.Key[]>();
  state.pieces
    .filter((p) => p.side === "player")
    .forEach((piece) => {
      const destinations = legalMovesFor(piece).map((m) => toKey(m.x, m.y));
      if (destinations.length) map.set(toKey(piece.x, piece.y), destinations);
    });
  return map;
}

function outOfBoundsClasses(): cg.SquareClasses {
  const classes = new Map<cg.Key, string>();
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      if (x >= state.boardW || y >= state.boardH) {
        classes.set(toKey(x, y), "outBounds");
      }
    }
  }
  return classes;
}

function render(): void {
  ground.set({
    fen: piecesToFen(),
    turnColor: "white",
    lastMove: state.lastMove,
    movable: {
      color: state.gameOver ? undefined : "white",
      dests: state.gameOver ? new Map<cg.Key, cg.Key[]>() : playerDests(),
    },
    highlight: {
      lastMove: true,
      check: true,
      custom: outOfBoundsClasses(),
    },
  });

  const playerCheck = isKingInCheck("player") ? " | Your king in check" : "";
  statusEl.textContent = `Turn ${state.turn} | Actions left: ${state.actionsLeft}${playerCheck}`;
  objectiveEl.textContent = `Objective: ${objectiveText()}`;
  roundInfoEl.textContent = `Round ${state.round + 1} | Difficulty ${state.aiDifficulty} (AI depth ${state.aiDepth}) | Active area ${state.boardW}x${state.boardH} | Turn limit ${state.turnLimit}`;
}

function resetRun(): void {
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
