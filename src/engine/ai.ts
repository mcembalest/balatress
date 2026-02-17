import type { Piece, Move, GameState } from "../data/types.js";
import { PIECE_VALUE } from "../data/types.js";
import { applyMoveOn, legalMovesFor, allLegalMovesForSide, isKingInCheck } from "./board.js";
import { isCheckmate } from "./objectives.js";

export function evaluatePosition(pieces: Piece[], state: GameState): number {
  if (isCheckmate("player", state, pieces)) return 100000;
  if (isCheckmate("enemy", state, pieces)) return -100000;

  let material = 0;
  pieces.forEach((piece) => {
    const value = PIECE_VALUE[piece.type] || 0;
    material += piece.side === "enemy" ? value : -value;
  });

  if (isKingInCheck("player", state, pieces)) material += 0.5;
  if (isKingInCheck("enemy", state, pieces)) material -= 0.5;

  return material;
}

export function minimax(
  pieces: Piece[],
  depth: number,
  maximizingEnemy: boolean,
  state: GameState,
  alpha = -Infinity,
  beta = Infinity,
): number {
  if (depth <= 0 || isCheckmate("player", state, pieces) || isCheckmate("enemy", state, pieces)) {
    return evaluatePosition(pieces, state);
  }

  const side = maximizingEnemy ? "enemy" : "player";
  const moves = allLegalMovesForSide(side, state, pieces);
  if (!moves.length) return evaluatePosition(pieces, state);

  if (maximizingEnemy) {
    let best = -Infinity;
    for (let i = 0; i < moves.length; i += 1) {
      const { piece, move } = moves[i];
      const next = applyMoveOn(pieces, piece.id, move);
      const score = minimax(next, depth - 1, false, state, alpha, beta);
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
    const score = minimax(next, depth - 1, true, state, alpha, beta);
    if (score < best) best = score;
    if (best < beta) beta = best;
    if (beta <= alpha) break;
  }
  return best;
}

export function chooseEnemyMove(enemy: Piece, pieces: Piece[], state: GameState): Move | null {
  const legalMoves = legalMovesFor(enemy, state, pieces);
  if (!legalMoves.length) return null;

  if (state.aiDepth <= 0) {
    const captures = legalMoves.filter((m) => m.capture);
    return captures[0] || pickGreedyMove(legalMoves, state);
  }

  let bestMove = legalMoves[0];
  let bestScore = -Infinity;
  for (let i = 0; i < legalMoves.length; i += 1) {
    const move = legalMoves[i];
    const next = applyMoveOn(pieces, enemy.id, move);
    const score = minimax(next, Math.max(0, state.aiDepth - 1), false, state);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

export function pickGreedyMove(moves: Move[], state: GameState): Move {
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
  return moves.reduce(
    (best, current) => (nearestDistance(current) < nearestDistance(best) ? current : best),
    moves[0],
  );
}
