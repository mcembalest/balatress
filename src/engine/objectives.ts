import type { Side, Piece, GameState } from "../data/types.js";
import { isKingInCheck, allLegalMovesForSide } from "./board.js";

export function isCheckmate(side: Side, state: GameState, pieces: Piece[] = state.pieces): boolean {
  return isKingInCheck(side, state, pieces) && allLegalMovesForSide(side, state, pieces).length === 0;
}

export function checkRoundWin(state: GameState): boolean {
  if (state.objective === "capture_count") return state.captureCount >= state.target;
  if (state.objective === "check") return state.deliveredCheck || isKingInCheck("enemy", state) || isCheckmate("enemy", state);
  return false;
}

export function checkLoss(state: GameState): boolean {
  const hasKing = state.pieces.some((p) => p.side === "player" && p.type === "king");
  const hasPieces = state.pieces.some((p) => p.side === "player");
  return !hasKing || !hasPieces || state.turn > state.turnLimit || isCheckmate("player", state);
}
