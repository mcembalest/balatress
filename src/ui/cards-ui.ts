import type { CardDefinition } from "../data/types.js";
import { categoryColor, rarityColor } from "../game/shop.js";
import { playCardSelect } from "./audio.js";

export function createCardElement(
  card: CardDefinition,
  opts: {
    onClick?: () => void;
    showCost?: boolean;
    costOverride?: number;
    disabled?: boolean;
    compact?: boolean;
  } = {},
): HTMLElement {
  const el = document.createElement("div");
  el.className = `card card-${card.rarity}${opts.disabled ? " card-disabled" : ""}${opts.compact ? " card-compact" : ""}`;
  el.dataset.category = card.category;
  el.dataset.rarity = card.rarity;

  const borderColor = rarityColor(card.rarity);
  el.style.borderColor = borderColor;

  const catColor = categoryColor(card.category);

  const cost = opts.costOverride ?? card.cost;

  el.innerHTML = `
    <div class="card-header">
      <span class="card-category" style="color: ${catColor}">${card.category.toUpperCase()}</span>
      ${opts.showCost !== false ? `<span class="card-cost">${cost}g</span>` : ""}
    </div>
    <div class="card-name">${card.name}</div>
    <div class="card-description">${card.description}</div>
    ${card.flavorText ? `<div class="card-flavor">${card.flavorText}</div>` : ""}
    <div class="card-footer">
      <span class="card-rarity" style="color: ${borderColor}">${card.rarity}</span>
      ${card.pieceType ? `<span class="card-piece">${card.pieceType}</span>` : ""}
    </div>
    <div class="card-sheen"></div>
  `;

  // 3D tilt on mousemove
  el.addEventListener("mousemove", (e) => {
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (y - 0.5) * -20;
    const rotateY = (x - 0.5) * 20;
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;

    // Move sheen
    const sheen = el.querySelector(".card-sheen") as HTMLElement | null;
    if (sheen) {
      sheen.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.25) 0%, transparent 60%)`;
    }
  });

  el.addEventListener("mouseleave", () => {
    el.style.transform = "";
    const sheen = el.querySelector(".card-sheen") as HTMLElement | null;
    if (sheen) sheen.style.background = "";
  });

  if (opts.onClick && !opts.disabled) {
    el.addEventListener("click", () => {
      playCardSelect();
      opts.onClick!();
    });
    el.style.cursor = "pointer";
  }

  return el;
}

export function createTarotSlot(
  card: CardDefinition | null,
  index: number,
  onUse?: (index: number) => void,
): HTMLElement {
  const el = document.createElement("div");
  el.className = "tarot-slot";

  if (card) {
    const cardEl = createCardElement(card, {
      showCost: false,
      compact: true,
      onClick: () => { if (onUse) onUse(index); },
    });
    el.appendChild(cardEl);
  } else {
    el.innerHTML = `<div class="tarot-empty">Empty</div>`;
  }

  return el;
}

export function renderTarotHand(
  container: HTMLElement,
  tarots: CardDefinition[],
  maxSlots: number,
  onUse: (index: number) => void,
): void {
  container.innerHTML = "";
  for (let i = 0; i < maxSlots; i++) {
    const card = tarots[i] ?? null;
    container.appendChild(createTarotSlot(card, i, onUse));
  }
}

export function renderOwnedJokers(container: HTMLElement, jokers: CardDefinition[]): void {
  container.innerHTML = "";
  if (jokers.length === 0) {
    container.innerHTML = `<div class="no-jokers">No jokers owned</div>`;
    return;
  }
  jokers.forEach((card) => {
    const el = createCardElement(card, { showCost: false, compact: true });
    container.appendChild(el);
  });
}
