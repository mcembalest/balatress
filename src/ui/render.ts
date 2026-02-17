import type { GameState } from "../data/types.js";
import type { Api } from "../../chessground/dist/api.js";
import type * as cg from "../../chessground/dist/types.js";
import { toKey, legalMovesFor, isKingInCheck } from "../engine/board.js";

export function chessgroundPieces(state: GameState): cg.Pieces {
  const map = new Map<cg.Key, cg.Piece>();
  state.pieces.forEach((piece) => {
    // Fog of War: hide enemy pieces unless adjacent to a player piece
    if (state.fogOfWar && piece.side === "enemy") {
      const visible = state.pieces.some(
        (p) => p.side === "player" && Math.abs(p.x - piece.x) <= 1 && Math.abs(p.y - piece.y) <= 1,
      );
      // Also visible if scouts_reveal counter > 0
      const scoutsReveal = state.mods.counters.get("scouts_reveal") ?? 0;
      if (!visible && scoutsReveal <= 0) return;
    }

    map.set(toKey(piece.x, piece.y), {
      role: piece.type,
      color: piece.side === "player" ? "white" : "black",
    });
  });
  return map;
}

export function piecesToFen(state: GameState): string {
  const rows: string[] = [];
  for (let y = 0; y < 8; y += 1) {
    let row = "";
    let empty = 0;
    for (let x = 0; x < 8; x += 1) {
      const piece = state.pieces.find((p) => p.x === x && p.y === y);
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

export function playerDests(state: GameState): cg.Dests {
  const map = new Map<cg.Key, cg.Key[]>();
  state.pieces
    .filter((p) => p.side === "player")
    .forEach((piece) => {
      const destinations = legalMovesFor(piece, state).map((m) => toKey(m.x, m.y));
      if (destinations.length) map.set(toKey(piece.x, piece.y), destinations);
    });
  return map;
}

export function outOfBoundsClasses(state: GameState): cg.SquareClasses {
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

export function renderBoard(ground: Api, state: GameState): void {
  const checkSquare = isKingInCheck("player", state);

  ground.set({
    fen: piecesToFen(state),
    turnColor: "white",
    lastMove: state.lastMove,
    check: checkSquare ? "white" : undefined,
    movable: {
      color: state.gameOver ? undefined : "white",
      dests: state.gameOver ? new Map<cg.Key, cg.Key[]>() : playerDests(state),
    },
    highlight: {
      lastMove: true,
      check: true,
      custom: outOfBoundsClasses(state),
    },
  });
}
