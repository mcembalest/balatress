import type { GameState, PieceType, Piece } from "../data/types.js";
import type * as cg from "../../chessground/dist/types.js";
import { BASE_ROUNDS, generateRound, scoreTargetForRound } from "../data/rounds.js";
import { createInitialMods } from "../engine/state.js";
import { pieceAt, fromKey, toKey, legalMovesFor, isKingInCheck, randomOf, applyMoveOn } from "../engine/board.js";
import { chooseEnemyMove, minimax } from "../engine/ai.js";
import { isCheckmate, checkRoundWin, checkLoss } from "../engine/objectives.js";
import { chipsForCapture, chipsForCheck, chipsForCheckmate, addChips, addMult, finalizeRoundScore } from "./scoring.js";
import { calculateGoldEarned } from "./shop.js";

export type FlowCallbacks = {
  render: () => void;
  log: (msg: string) => void;
  showShop: () => void;
  showRestart: (title: string, body: string) => void;
  onCapture: (piece: Piece, target: Piece) => void;
  onCheck: () => void;
  onCheckmate: () => void;
  onScoreEvent: (chips: number, source: string, key?: cg.Key) => void;
};

let callbacks: FlowCallbacks;

export function setFlowCallbacks(cb: FlowCallbacks): void {
  callbacks = cb;
}

function aiDepthForRound(roundIndex: number): number {
  if (roundIndex <= 0) return 1;
  if (roundIndex <= 2) return 2;
  if (roundIndex <= 4) return 3;
  return 4;
}

function difficultyLabelForDepth(depth: number): "Easy" | "Normal" | "Hard" | "Expert" {
  if (depth <= 1) return "Easy";
  if (depth === 2) return "Normal";
  if (depth === 3) return "Hard";
  return "Expert";
}

export function setupRound(state: GameState, roundIndex: number): void {
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
  state.totalChips = 0;
  state.totalMult = 1;
  state.roundScore = 0;
  state.scoreTarget = scoreTargetForRound(roundIndex);
  state.rerollCost = state.baseRerollCost;
  state.fogOfWar = false;
  state.pawnImmuneTurns = 0;
  state.mirrorMods = false;
  state.bossActive = false;

  // Apply boss modifiers
  if (config.boss) {
    state.boss = config.boss;
    state.bossActive = true;
    config.boss.apply(state);
  } else {
    state.boss = undefined;
  }

  spawnSquads(state, config.enemyCount);

  // Apply joker onRoundStart effects
  state.ownedJokers.forEach(j => { if (j.onRoundStart) j.onRoundStart(state); });

  startPlayerTurn(state);
  callbacks.log(`Round ${roundIndex + 1} begins (${state.aiDifficulty}, AI depth ${state.aiDepth}). Objective: ${objectiveText(state)}`);
  if (state.bossActive && state.boss) {
    callbacks.log(`BOSS: ${state.boss.name} — ${state.boss.description}`);
  }
  callbacks.render();
}

function spawnSquads(state: GameState, enemyCount: number): void {
  const playerTypes: PieceType[] = ["king", "queen", "rook", "bishop", "knight", "pawn", "pawn"];

  // Extra pieces from vouchers
  const extraPieces = state.mods.counters.get("extra_pieces") ?? 0;
  for (let i = 0; i < extraPieces; i++) playerTypes.push("pawn");
  const extraPawns = state.mods.counters.get("extra_pawns") ?? 0;
  for (let i = 0; i < extraPawns; i++) playerTypes.push("pawn");

  // Veterans voucher: replace last 2 pawns with knight + bishop
  if (state.mods.flags.has("veterans")) {
    let replaced = 0;
    for (let i = playerTypes.length - 1; i >= 0 && replaced < 2; i--) {
      if (playerTypes[i] === "pawn") {
        playerTypes[i] = replaced === 0 ? "knight" : "bishop";
        replaced++;
      }
    }
  }

  const enemyPool: PieceType[] = ["queen", "rook", "bishop", "knight", "pawn", "pawn", "pawn"];

  const playerBandStart = Math.max(0, state.boardH - Math.max(2, Math.ceil(state.boardH / 3)));
  const enemyBandEnd = Math.min(state.boardH - 1, Math.max(1, Math.floor(state.boardH / 3)));

  placePieces(state, "player", playerTypes, playerBandStart, state.boardH - 1);
  placePieces(state, "enemy", ["king"], 0, 0);
  const extra: PieceType[] = Array.from({ length: Math.max(0, enemyCount - 1) }, () => randomOf(enemyPool));
  placePieces(state, "enemy", extra, 0, enemyBandEnd);
}

function placePieces(state: GameState, side: "player" | "enemy", types: PieceType[], minY: number, maxY: number): void {
  types.forEach((type, index) => {
    let attempts = 0;
    while (attempts < 200) {
      const x = Math.floor(Math.random() * state.boardW);
      const y = minY + Math.floor(Math.random() * (maxY - minY + 1));
      if (!pieceAt(state, x, y)) {
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

export function startPlayerTurn(state: GameState): void {
  state.lastInputSig = "";
  state.lastInputAt = 0;
  state.actionsLeft = 1 + state.mods.globalActions + state.queuedActions;
  state.queuedActions = 0;

  if (state.mods.periodicTempo && state.turn % 3 === 0) {
    state.actionsLeft += 1;
    callbacks.log("Tempo Cycle grants +1 action.");
  }

  // Opening Theory: +2 actions on first turn
  if (state.mods.flags.has("opening_theory") && state.turn === 1) {
    state.actionsLeft += 2;
    callbacks.log("Opening Theory grants +2 actions.");
  }

  // Castle Keep: rook adjacent to king grants +1 action
  if (state.mods.flags.has("castle_keep")) {
    const king = state.pieces.find(p => p.side === "player" && p.type === "king");
    if (king) {
      const hasAdjacentRook = state.pieces.some(p =>
        p.side === "player" && p.type === "rook" &&
        Math.abs(p.x - king.x) <= 1 && Math.abs(p.y - king.y) <= 1
      );
      if (hasAdjacentRook) {
        state.actionsLeft += 1;
        callbacks.log("Castle Keep grants +1 action.");
      }
    }
  }

  // Overcharge debt
  const debt = state.mods.counters.get("overcharge_debt") ?? 0;
  if (debt > 0) {
    state.actionsLeft = Math.max(1, state.actionsLeft - debt);
    state.mods.counters.delete("overcharge_debt");
    callbacks.log("Overcharge debt: -1 action.");
  }

  // Apply joker onTurnStart effects
  state.ownedJokers.forEach(j => { if (j.onTurnStart) j.onTurnStart(state); });

  // Decrement pawn immunity (boss)
  if (state.pawnImmuneTurns > 0) state.pawnImmuneTurns -= 1;
}

export function onPlayerMove(state: GameState, origKey: cg.Key, destKey: cg.Key): void {
  if (origKey === destKey) return;
  const now = Date.now();
  const sig = `${origKey}-${destKey}`;
  if (state.lastInputSig === sig && now - state.lastInputAt < 250) return;
  state.lastInputSig = sig;
  state.lastInputAt = now;

  if (state.gameOver || state.actionsLeft <= 0) {
    callbacks.render();
    return;
  }
  const orig = fromKey(origKey);
  const dest = fromKey(destKey);
  const piece = pieceAt(state, orig.x, orig.y);
  if (!piece || piece.side !== "player") {
    callbacks.render();
    return;
  }
  const legal = legalMovesFor(piece, state).find((m) => m.x === dest.x && m.y === dest.y);
  if (!legal) {
    callbacks.render();
    return;
  }
  state.lastMove = [origKey, destKey];
  applyMove(state, piece, legal);
}

function applyMove(state: GameState, piece: Piece, move: { x: number; y: number; capture: boolean }): void {
  const fromKeyVal = toKey(piece.x, piece.y);
  const toKeyVal = toKey(move.x, move.y);
  const target = pieceAt(state, move.x, move.y);

  if (target && target.side !== piece.side) {
    state.pieces = state.pieces.filter((p) => p.id !== target.id);
    if (piece.side === "player") {
      state.captureCount += 1;
      callbacks.log(`Captured enemy ${target.type}.`);
      callbacks.onCapture(piece, target);

      // Score chips for capture
      const chips = chipsForCapture(target.type, state, piece);
      addChips(state, chips, `Capture ${target.type}`);
      callbacks.onScoreEvent(chips, `+${chips} chips`, toKeyVal);

      if (piece.type === "knight" && state.mods.knightChain) {
        state.actionsLeft += 1;
        callbacks.log("Knight chain grants +1 action.");
      }

      // Tyrant: king captures grant actions
      if (piece.type === "king" && state.mods.kingCaptureActions > 0) {
        state.actionsLeft += state.mods.kingCaptureActions;
        callbacks.log(`Tyrant grants +${state.mods.kingCaptureActions} actions.`);
      }

      // Blood sacrifice scoring (for enemy capturing player — handled in enemyPhase)
      // Gambit accepted (handled in enemyPhase)

      // Pawn Storm: 3+ pawns on same rank
      if (piece.type === "pawn" && state.mods.flags.has("pawn_storm")) {
        const sameRank = state.pieces.filter(p => p.side === "player" && p.type === "pawn" && p.y === piece.y);
        if (sameRank.length >= 3) {
          state.actionsLeft += 1;
          callbacks.log("Pawn Storm grants +1 action.");
        }
      }

      // Apply joker onCapture effects
      state.ownedJokers.forEach(j => { if (j.onCapture) j.onCapture(state, target); });
    }
  }

  piece.x = move.x;
  piece.y = move.y;
  state.lastMove = [fromKeyVal, toKeyVal];

  // Battlefield Promotion: pawns in last 2 rows promote
  if (piece.type === "pawn" && piece.side === "player" && state.mods.flags.has("battlefield_promotion")) {
    if (piece.y <= 1) {
      piece.type = "queen";
      callbacks.log("Battlefield Promotion: Pawn becomes Queen!");
    }
  }

  if (piece.side === "player" && isKingInCheck("enemy", state)) {
    state.deliveredCheck = true;
    if (isCheckmate("enemy", state)) {
      callbacks.log("Checkmate on enemy king.");
      callbacks.onCheckmate();
      const chips = chipsForCheckmate();
      addChips(state, chips, "Checkmate");
      callbacks.onScoreEvent(chips, `+${chips} chips`, toKeyVal);
    } else {
      callbacks.log("Check on enemy king.");
      callbacks.onCheck();
      const chips = chipsForCheck();
      addChips(state, chips, "Check");
      callbacks.onScoreEvent(chips, `+${chips} chips`, toKeyVal);
    }

    // Apply joker onCheck effects
    state.ownedJokers.forEach(j => { if (j.onCheck) j.onCheck(state); });
  }

  if (checkRoundWin(state)) {
    // Finalize scoring
    finalizeRoundScore(state);
    const goldEarned = calculateGoldEarned(state);
    state.gold += goldEarned.total;
    callbacks.log(`Round score: ${state.roundScore} (${state.totalChips} chips x ${state.totalMult} mult)`);
    callbacks.log(`Gold earned: +${goldEarned.total}g (base ${goldEarned.base} + score ${goldEarned.scoreBonus} + interest ${goldEarned.interest})`);
    callbacks.showShop();
    callbacks.render();
    return;
  }

  state.actionsLeft -= 1;
  if (state.actionsLeft <= 0) {
    enemyPhase(state);
    state.turn += 1;
    if (checkLoss(state)) {
      callbacks.showRestart("Defeat", "You lost this run. Restart and try a different strategy.");
      callbacks.render();
      return;
    }
    startPlayerTurn(state);
  }
  callbacks.render();
}

function enemyPhase(state: GameState): void {
  if (state.freezeEnemyPhase) {
    callbacks.log("Cryo Pulse froze enemies for this phase.");
    state.freezeEnemyPhase = false;
    return;
  }

  const moved = new Set<string>();
  let actionsTaken = 0;
  for (let action = 0; action < state.enemyActions; action += 1) {
    const enemies = state.pieces.filter((p) => p.side === "enemy" && !moved.has(p.id));
    const candidates = enemies.filter((enemy) => legalMovesFor(enemy, state).length > 0);
    if (!candidates.length) break;

    const enemyInCheck = isKingInCheck("enemy", state);
    const nonKing = candidates.filter((p) => p.type !== "king");
    const pool = !enemyInCheck && nonKing.length ? nonKing : candidates;

    let bestActor = pool[0];
    let bestMove = chooseEnemyMove(bestActor, state.pieces, state);
    let bestScore = bestMove
      ? minimax(applyMoveOn(state.pieces, bestActor.id, bestMove), Math.max(0, state.aiDepth - 1), false, state)
      : -Infinity;

    for (let i = 1; i < pool.length; i += 1) {
      const actor = pool[i];
      const move = chooseEnemyMove(actor, state.pieces, state);
      if (!move) continue;
      const score = minimax(applyMoveOn(state.pieces, actor.id, move), Math.max(0, state.aiDepth - 1), false, state);
      if (score > bestScore) {
        bestScore = score;
        bestActor = actor;
        bestMove = move;
      }
    }

    if (!bestMove) continue;

    const from = toKey(bestActor.x, bestActor.y);
    const target = pieceAt(state, bestMove.x, bestMove.y);
    if (target && target.side === "player") {
      state.pieces = state.pieces.filter((p) => p.id !== target.id);
      callbacks.log(`Enemy ${bestActor.type} captured your ${target.type}.`);

      // Blood Sacrifice: losing a piece grants +0.5 mult
      if (state.mods.flags.has("blood_sacrifice")) {
        addMult(state, 0.5);
        callbacks.log("Blood Sacrifice: +0.5 mult.");
      }

      // Gambit Accepted: losing a piece grants +2 actions next turn
      if (state.mods.flags.has("gambit_accepted")) {
        state.queuedActions += 2;
        callbacks.log("Gambit Accepted: +2 actions next turn.");
      }
    }
    bestActor.x = bestMove.x;
    bestActor.y = bestMove.y;
    state.lastMove = [from, toKey(bestActor.x, bestActor.y)];
    moved.add(bestActor.id);
    actionsTaken += 1;
  }

  callbacks.log(
    `Enemy phase: ${actionsTaken} action${actionsTaken === 1 ? "" : "s"} (${state.aiDifficulty}, AI depth ${state.aiDepth}).`,
  );
}

export function useTarot(state: GameState, index: number): boolean {
  if (index < 0 || index >= state.ownedTarots.length) return false;
  const card = state.ownedTarots[index];
  if (card.onActivate) {
    card.onActivate(state);
    callbacks.log(`Used ${card.name}: ${card.description}`);
  }
  state.ownedTarots.splice(index, 1);
  callbacks.render();
  return true;
}

export function resetRun(state: GameState): void {
  state.gameOver = false;
  state.upgrades = [];
  state.lastMove = undefined;
  state.mods = createInitialMods();
  state.gold = 0;
  state.ownedJokers = [];
  state.ownedTarots = [];
  state.ownedPlanets = [];
  state.ownedVouchers = [];
  state.totalChips = 0;
  state.totalMult = 1;
  state.roundScore = 0;
  state.maxTarots = 3;
  state.shopCards = 3;
  state.baseRerollCost = 3;
  setupRound(state, 0);
}

export function objectiveText(state: GameState): string {
  if (state.objective === "capture_count") return `Capture ${state.target} enemy pieces`;
  if (state.objective === "check") return "Deliver check to enemy king";
  return "Unknown objective";
}
