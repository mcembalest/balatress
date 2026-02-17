import type { GameState, Piece, PieceType, ScoreEvent } from "../data/types.js";
import { PIECE_CHIPS } from "../data/types.js";

export function chipsForCapture(capturedType: PieceType, state: GameState, capturingPiece?: Piece): number {
  let chips = PIECE_CHIPS[capturedType];

  // Blitz Tactics: double chips on first action of turn
  if (state.mods.flags.has("blitz_tactics") && state.actionsLeft === 1 + state.mods.globalActions + state.queuedActions) {
    chips *= 2;
  }

  // Cavalry Charge: +20 for knight captures
  if (capturingPiece && capturingPiece.type === "knight" && state.mods.flags.has("cavalry_charge")) {
    chips += 20;
  }

  return chips;
}

export function chipsForCheck(): number {
  return 40;
}

export function chipsForCheckmate(): number {
  return 200;
}

export function chipsForFork(attackCount: number): number {
  return attackCount >= 2 ? 25 : 0;
}

export function chipsForPinSkewer(): number {
  return 20;
}

export function calculateRoundMult(state: GameState): number {
  let mult = state.totalMult;

  // Scholar's Mate: delivering check gives x1.5
  if (state.mods.flags.has("scholars_mate") && state.deliveredCheck) {
    mult *= 1.5;
  }

  return mult;
}

export function calculateBonusChips(state: GameState): ScoreEvent[] {
  const events: ScoreEvent[] = [];

  // Material Advantage
  if (state.mods.flags.has("material_advantage")) {
    const playerCount = state.pieces.filter(p => p.side === "player").length;
    const enemyCount = state.pieces.filter(p => p.side === "enemy").length;
    const advantage = playerCount - enemyCount;
    if (advantage > 0) {
      events.push({ chips: advantage * 5, source: "Material Advantage" });
    }
  }

  // Fortress Mentality
  if (state.mods.flags.has("fortress_mentality")) {
    events.push({ chips: 20, source: "Fortress Mentality" });
  }

  return events;
}

export function addChips(state: GameState, chips: number, source: string): ScoreEvent {
  state.totalChips += chips;
  state.roundScore = state.totalChips * state.totalMult;
  return { chips, source };
}

export function addMult(state: GameState, mult: number): void {
  state.totalMult += mult;
  state.roundScore = state.totalChips * state.totalMult;
}

export function finalizeRoundScore(state: GameState): number {
  const mult = calculateRoundMult(state);
  const bonusEvents = calculateBonusChips(state);
  bonusEvents.forEach(e => { state.totalChips += e.chips; });
  state.roundScore = Math.floor(state.totalChips * mult);
  return state.roundScore;
}
