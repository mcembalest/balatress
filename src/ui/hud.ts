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
  els.scoreDisplay.innerHTML = `<span class="chips-pill"><span class="chips-value">${state.totalChips}</span><span class="chips-label">chips</span></span><span class="mult-sign">x</span><span class="mult-pill"><span class="mult-value">${state.totalMult}</span><span class="mult-label">mult</span></span><span class="score-eq">=</span><span class="score-pill"><span class="score-value">${state.roundScore}</span><span class="score-label">score</span></span>`;
}
