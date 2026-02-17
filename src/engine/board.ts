import type { Piece, Move, Coord, Side, GameState } from "../data/types.js";
import { FILES } from "../data/types.js";
import type * as cg from "../../chessground/dist/types.js";

export function toKey(x: number, y: number): cg.Key {
  return `${FILES[x]}${8 - y}` as cg.Key;
}

export function fromKey(key: cg.Key): Coord {
  const file = key[0];
  const rank = Number(key[1]);
  return { x: FILES.indexOf(file), y: 8 - rank };
}

export function pieceAtOn(pieces: Piece[], x: number, y: number): Piece | undefined {
  return pieces.find((p) => p.x === x && p.y === y);
}

export function pieceAt(state: GameState, x: number, y: number): Piece | undefined {
  return pieceAtOn(state.pieces, x, y);
}

export function inBounds(state: GameState, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < state.boardW && y < state.boardH;
}

export function clonePieces(pieces: Piece[]): Piece[] {
  return pieces.map((p) => ({ ...p }));
}

export function applyMoveOn(pieces: Piece[], pieceId: string, move: Move): Piece[] {
  const next = clonePieces(pieces).filter((p) => !(p.x === move.x && p.y === move.y));
  const moving = next.find((p) => p.id === pieceId);
  if (!moving) return pieces;
  moving.x = move.x;
  moving.y = move.y;
  return next;
}

export function movesFor(piece: Piece, state: GameState, pieces: Piece[] = state.pieces): Move[] {
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
      if (!inBounds(state, nx, ny)) break;
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

  // Endgame specialist: extend all movement if < 5 total pieces
  const endgameBonus = (playerBuffed && state.mods.flags.has("endgame_specialist") && pieces.length < 5) ? 2 : 0;

  if (piece.type === "pawn") {
    const forward = piece.side === "player" ? -1 : 1;
    const fy = piece.y + forward;
    if (inBounds(state, piece.x, fy) && !pieceAtOn(pieces, piece.x, fy)) {
      result.push({ x: piece.x, y: fy, capture: false });
    }
    [piece.x - 1, piece.x + 1].forEach((nx) => {
      if (!inBounds(state, nx, fy)) return;
      const occ = pieceAtOn(pieces, nx, fy);
      if (occ && occ.side !== piece.side) result.push({ x: nx, y: fy, capture: true });
    });
    if (playerBuffed && state.mods.pawnSideStep) {
      [piece.x - 1, piece.x + 1].forEach((nx) => {
        if (!inBounds(state, nx, piece.y)) return;
        const occ = pieceAtOn(pieces, nx, piece.y);
        if (!occ) result.push({ x: nx, y: piece.y, capture: false });
        if (occ && occ.side !== piece.side) result.push({ x: nx, y: piece.y, capture: true });
      });
    }
    if (playerBuffed && state.mods.pawnBackward) {
      const backward = piece.side === "player" ? 1 : -1;
      const by = piece.y + backward;
      if (inBounds(state, piece.x, by) && !pieceAtOn(pieces, piece.x, by)) {
        result.push({ x: piece.x, y: by, capture: false });
      }
    }
    return result;
  }

  if (piece.type === "knight") {
    const jumps: Array<[number, number]> = [
      [1, 2], [2, 1], [-1, 2], [-2, 1],
      [1, -2], [2, -1], [-1, -2], [-2, -1],
    ];
    // Extended knight: also 3-1 L-shapes
    if (playerBuffed && state.mods.knightExtended) {
      jumps.push([1, 3], [3, 1], [-1, 3], [-3, 1], [1, -3], [3, -1], [-1, -3], [-3, -1]);
    }
    jumps.forEach(([dx, dy]) => push(piece.x, piece.y, false, dx, dy, 1));
    return result;
  }

  const dirs: Array<[number, number]> = [];
  if (["rook", "queen"].includes(piece.type)) dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
  if (["bishop", "queen"].includes(piece.type)) dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);

  if (piece.type === "king") {
    const range = (playerBuffed ? state.mods.kingRange || 1 : 1) + endgameBonus;
    [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [1, -1], [-1, 1], [-1, -1],
    ].forEach(([dx, dy]) => {
      push(piece.x, piece.y, true, dx, dy, range);
    });
    return result;
  }

  if (piece.type === "bishop" && playerBuffed && state.mods.bishopGuardStep) {
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) =>
      push(piece.x, piece.y, false, dx, dy, 1)
    );
  }

  if (piece.type === "rook" && playerBuffed && state.mods.rookDiagonal) {
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dx, dy]) =>
      push(piece.x, piece.y, true, dx, dy, 2 + endgameBonus)
    );
  }

  dirs.forEach(([dx, dy]) => push(piece.x, piece.y, true, dx, dy, 99));
  return result;
}

export function isSquareAttacked(side: Side, x: number, y: number, state: GameState, pieces: Piece[] = state.pieces): boolean {
  const attackers = pieces.filter((p) => p.side !== side);
  return attackers.some((piece) => movesFor(piece, state, pieces).some((m) => m.capture && m.x === x && m.y === y));
}

export function kingForSide(side: Side, pieces: Piece[] = []): Piece | undefined {
  return pieces.find((p) => p.side === side && p.type === "king");
}

export function isKingInCheck(side: Side, state: GameState, pieces: Piece[] = state.pieces): boolean {
  const king = kingForSide(side, pieces);
  if (!king) return true;
  return isSquareAttacked(side, king.x, king.y, state, pieces);
}

export function legalMovesFor(piece: Piece, state: GameState, pieces: Piece[] = state.pieces): Move[] {
  return movesFor(piece, state, pieces).filter((move) => {
    const next = applyMoveOn(pieces, piece.id, move);
    return !isKingInCheck(piece.side, state, next);
  });
}

export function allLegalMovesForSide(side: Side, state: GameState, pieces: Piece[] = state.pieces): { piece: Piece; move: Move }[] {
  const list: { piece: Piece; move: Move }[] = [];
  pieces
    .filter((p) => p.side === side)
    .forEach((piece) => {
      legalMovesFor(piece, state, pieces).forEach((move) => {
        list.push({ piece, move });
      });
    });
  return list;
}

export function randomOf<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
