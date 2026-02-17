import type { GameState } from "../data/types.js";
import { isKingInCheck } from "../engine/board.js";
import { objectiveText } from "../game/flow.js";

export function updateHud(state: GameState, els: {
  status: HTMLElement;
  objective: HTMLElement;
  roundInfo: HTMLElement;
  goldDisplay: HTMLElement;
  scoreDisplay: HTMLElement;
}): void {
  const playerCheck = isKingInCheck("player", state) ? " | YOUR KING IN CHECK" : "";
  els.status.textContent = `Turn ${state.turn} | Actions: ${state.actionsLeft}${playerCheck}`;
  els.objective.textContent = `Objective: ${objectiveText(state)}`;

  const bossText = state.bossActive && state.boss ? ` | BOSS: ${state.boss.name}` : "";
  els.roundInfo.textContent = `Round ${state.round + 1} | ${state.aiDifficulty} (depth ${state.aiDepth}) | ${state.boardW}x${state.boardH} | Turns left: ${Math.max(0, state.turnLimit - state.turn + 1)}${bossText}`;

  els.goldDisplay.textContent = `${state.gold}g`;
  els.scoreDisplay.innerHTML = `<span class="chips-value">${state.totalChips}</span> chips <span class="mult-sign">x</span> <span class="mult-value">${state.totalMult}</span> mult = <span class="score-value">${state.roundScore}</span>`;
}
