import type * as cg from "../../chessground/dist/types.js";

export type Side = "player" | "enemy";
export type Objective = "capture_count" | "check";
export type PieceType = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";
export type Difficulty = "Easy" | "Normal" | "Hard" | "Expert";
export type CardCategory = "joker" | "tarot" | "planet" | "voucher";
export type CardRarity = "common" | "uncommon" | "rare" | "legendary";
export type CardStatus = "implemented" | "designed" | "concept" | "cut";

export interface Move {
  x: number;
  y: number;
  capture: boolean;
}

export interface Coord {
  x: number;
  y: number;
}

export interface Piece {
  id: string;
  side: Side;
  type: PieceType;
  x: number;
  y: number;
}

export interface MoveSelection {
  piece: Piece;
  move: Move;
}

export interface Mods {
  pawnSideStep: boolean;
  pawnBackward: boolean;
  bishopGuardStep: boolean;
  bishopIgnoreBlock: boolean;
  knightChain: boolean;
  knightExtended: boolean;
  rookDiagonal: boolean;
  rookArtillery: boolean;
  globalActions: number;
  periodicTempo: boolean;
  cryoPulse: boolean;
  kingRange: number;
  kingCaptureActions: number;
  queenGoldGen: number;
  flags: Set<string>;
  counters: Map<string, number>;
}

export interface RoundConfig {
  boardW: number;
  boardH: number;
  enemyCount: number;
  target: number;
  objective: Objective;
  turnLimit: number;
  enemyActions: number;
  aiDepth: number;
  aiDifficulty?: Difficulty;
  boss?: BossConfig;
}

export interface BossConfig {
  name: string;
  description: string;
  apply: (state: GameState) => void;
}

export interface ScoreEvent {
  chips: number;
  source: string;
  key?: cg.Key;
}

export interface GameState {
  round: number;
  turn: number;
  boardW: number;
  boardH: number;
  pieces: Piece[];
  captureCount: number;
  deliveredCheck: boolean;
  actionsLeft: number;
  queuedActions: number;
  ownedJokers: CardDefinition[];
  ownedTarots: CardDefinition[];
  ownedPlanets: string[];
  ownedVouchers: string[];
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
  gold: number;
  totalChips: number;
  totalMult: number;
  roundScore: number;
  scoreTarget: number;
  maxTarots: number;
  shopCards: number;
  rerollCost: number;
  baseRerollCost: number;
  boss?: BossConfig;
  bossActive: boolean;
  fogOfWar: boolean;
  pawnImmuneTurns: number;
  mirrorMods: boolean;
}

export interface CardDefinition {
  id: string;
  name: string;
  description: string;
  flavorText?: string;
  category: CardCategory;
  rarity: CardRarity;
  cost: number;
  pieceType?: PieceType;
  tags: string[];
  designNotes?: string;
  status: CardStatus;
  apply?: (state: GameState) => void;
  onActivate?: (state: GameState) => void;
  onCapture?: (state: GameState, captured: Piece) => void;
  onCheck?: (state: GameState) => void;
  onRoundStart?: (state: GameState) => void;
  onTurnStart?: (state: GameState) => void;
  onScore?: (state: GameState) => void;
}

export const PIECE_VALUE: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 1000,
};

export const PIECE_CHIPS: Record<PieceType, number> = {
  pawn: 10,
  knight: 30,
  bishop: 30,
  rook: 50,
  queen: 90,
  king: 200,
};

export const FILES = "abcdefgh";
