import type { GameState, CardDefinition } from "../data/types.js";
import { generateShopCards, getCardCost, canAfford, buyCard, sellJoker, reroll, categoryColor } from "../game/shop.js";
import { createCardElement, renderOwnedJokers } from "./cards-ui.js";
import { cardDealAnimation } from "./animations.js";
import { playCardBuy, playGoldCoin, playError, playRoundWin } from "./audio.js";
import { goldCounterAnimation } from "./animations.js";

type ShopCallbacks = {
  onDone: () => void;
  render: () => void;
  log: (msg: string) => void;
};

let currentShopCards: CardDefinition[] = [];

export function showShop(state: GameState, els: {
  overlay: HTMLElement;
  overlayTitle: HTMLElement;
  overlayBody: HTMLElement;
  choices: HTMLElement;
}, cb: ShopCallbacks): void {
  playRoundWin();

  currentShopCards = generateShopCards(state);
  state.rerollCost = state.baseRerollCost;

  els.overlayTitle.textContent = `Round ${state.round + 1} Complete!`;
  els.overlayBody.innerHTML = `
    <div class="shop-score">
      Score: <span class="chips-value">${state.totalChips}</span> x <span class="mult-value">${state.totalMult}</span> = <span class="score-value">${state.roundScore}</span>
    </div>
  `;

  renderShopContents(state, els, cb);
  els.overlay.classList.remove("hidden");
}

function renderShopContents(state: GameState, els: {
  overlay: HTMLElement;
  overlayTitle: HTMLElement;
  overlayBody: HTMLElement;
  choices: HTMLElement;
}, cb: ShopCallbacks): void {
  els.choices.innerHTML = "";

  // Gold display
  const goldBar = document.createElement("div");
  goldBar.className = "shop-gold-bar";
  goldBar.innerHTML = `<span class="shop-gold-label">Gold:</span> <span class="shop-gold-value" id="shopGold">${state.gold}g</span>`;
  els.choices.appendChild(goldBar);

  // Shop cards
  const cardsRow = document.createElement("div");
  cardsRow.className = "shop-cards-row";

  currentShopCards.forEach((card, index) => {
    const cost = getCardCost(card, state);
    const affordable = canAfford(card, state);
    const cardEl = createCardElement(card, {
      showCost: true,
      costOverride: cost,
      disabled: !affordable,
      onClick: () => {
        if (buyCard(card, state)) {
          playCardBuy();
          cb.log(`Bought ${card.name} for ${cost}g.`);
          currentShopCards.splice(index, 1);
          renderShopContents(state, els, cb);
        } else {
          playError();
        }
      },
    });
    cardDealAnimation(cardEl, index);
    cardsRow.appendChild(cardEl);
  });

  els.choices.appendChild(cardsRow);

  // Action buttons row
  const actionsRow = document.createElement("div");
  actionsRow.className = "shop-actions-row";

  // Reroll button
  const rerollBtn = document.createElement("button");
  rerollBtn.className = "shop-btn reroll-btn";
  rerollBtn.textContent = `Reroll (${state.rerollCost}g)`;
  rerollBtn.disabled = state.gold < state.rerollCost;
  rerollBtn.addEventListener("click", () => {
    if (reroll(state)) {
      playGoldCoin();
      currentShopCards = generateShopCards(state);
      renderShopContents(state, els, cb);
    } else {
      playError();
    }
  });
  actionsRow.appendChild(rerollBtn);

  // Next round button
  const nextBtn = document.createElement("button");
  nextBtn.className = "shop-btn next-btn";
  nextBtn.textContent = "Next Round";
  nextBtn.addEventListener("click", () => {
    hideOverlay(els.overlay);
    cb.onDone();
  });
  actionsRow.appendChild(nextBtn);

  els.choices.appendChild(actionsRow);

  // Owned jokers section
  if (state.ownedJokers.length > 0) {
    const ownedSection = document.createElement("div");
    ownedSection.className = "shop-owned-section";

    const ownedLabel = document.createElement("div");
    ownedLabel.className = "shop-section-label";
    ownedLabel.textContent = "Owned Jokers (click to sell for 50%)";
    ownedSection.appendChild(ownedLabel);

    const ownedRow = document.createElement("div");
    ownedRow.className = "shop-owned-row";

    state.ownedJokers.forEach((card) => {
      const sellPrice = Math.floor(card.cost / 2);
      const cardEl = createCardElement(card, {
        showCost: true,
        costOverride: sellPrice,
        compact: true,
        onClick: () => {
          sellJoker(card, state);
          playGoldCoin();
          cb.log(`Sold ${card.name} for ${sellPrice}g.`);
          renderShopContents(state, els, cb);
        },
      });
      ownedRow.appendChild(cardEl);
    });

    ownedSection.appendChild(ownedRow);
    els.choices.appendChild(ownedSection);
  }
}

export function showRestart(state: GameState, title: string, body: string, els: {
  overlay: HTMLElement;
  overlayTitle: HTMLElement;
  overlayBody: HTMLElement;
  choices: HTMLElement;
}, onRestart: () => void): void {
  state.gameOver = true;
  els.overlayTitle.textContent = title;
  els.overlayBody.textContent = body;
  els.choices.innerHTML = "";

  // Show final stats
  const stats = document.createElement("div");
  stats.className = "restart-stats";
  stats.innerHTML = `
    <div>Rounds cleared: ${state.round}</div>
    <div>Gold: ${state.gold}g</div>
    <div>Jokers: ${state.ownedJokers.length}</div>
    <div>Final score: ${state.roundScore}</div>
  `;
  els.choices.appendChild(stats);

  const restart = document.createElement("button");
  restart.className = "shop-btn next-btn";
  restart.textContent = "Start New Run";
  restart.addEventListener("click", () => {
    hideOverlay(els.overlay);
    onRestart();
  });
  els.choices.appendChild(restart);
  els.overlay.classList.remove("hidden");
}

export function hideOverlay(overlay: HTMLElement): void {
  overlay.classList.add("hidden");
}
