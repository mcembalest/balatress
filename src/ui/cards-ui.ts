import type { CardDefinition } from "../data/types.js";
import { categoryColor, rarityColor } from "../game/shop.js";
import { playCardSelect } from "./audio.js";

// ── Card Preview (unified, centered on screen) ──
let activePreview: HTMLElement | null = null;

function showCardPreview(card: CardDefinition): void {
  removeCardPreview();
  const overlay = document.createElement("div");
  overlay.className = "card-preview-overlay";
  const cardEl = createCardElement(card, { showCost: false, compact: false });
  cardEl.classList.add("card-preview-size");
  overlay.appendChild(cardEl);
  document.body.appendChild(overlay);
  activePreview = overlay;
}

function removeCardPreview(): void {
  if (activePreview) {
    activePreview.remove();
  }
  activePreview = null;
}

/** Attach hover-preview behavior to any card element */
function attachPreview(el: HTMLElement, card: CardDefinition): void {
  el.addEventListener("mouseenter", () => showCardPreview(card));
  el.addEventListener("mouseleave", () => removeCardPreview());
}

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
    cardEl.classList.add("fan-card");
    attachPreview(cardEl, card);
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

const MAX_JOKER_SLOTS = 5;

export function renderCardsRow(
  container: HTMLElement,
  jokers: CardDefinition[],
  tarots: CardDefinition[],
  maxTarotSlots: number,
  onUseTarot: (index: number) => void,
): void {
  container.innerHTML = "";

  // ── Jokers section ──
  const jokersSection = document.createElement("div");
  jokersSection.className = "cards-section jokers-section";

  const jokersHeader = document.createElement("div");
  jokersHeader.className = "cards-section-header";
  jokersHeader.textContent = `JOKERS ${jokers.length}/${MAX_JOKER_SLOTS}`;
  jokersSection.appendChild(jokersHeader);

  const jokersFan = document.createElement("div");
  jokersFan.className = "cards-fan";

  const jokerOverlap = jokers.length > 3 ? 40 : 20;
  const maxRotation = 3;

  jokers.forEach((card, i) => {
    const cardEl = createCardElement(card, { showCost: false, compact: true });
    cardEl.classList.add("fan-card");

    const center = (jokers.length - 1) / 2;
    const offset = i - center;
    const rotation = offset * (maxRotation / Math.max(jokers.length - 1, 1));
    const marginLeft = i === 0 ? 0 : -jokerOverlap;

    cardEl.style.marginLeft = `${marginLeft}px`;
    cardEl.style.transform = `rotate(${rotation}deg)`;
    cardEl.style.zIndex = `${i + 1}`;

    attachPreview(cardEl, card);
    jokersFan.appendChild(cardEl);
  });

  // Empty joker slots
  for (let i = jokers.length; i < MAX_JOKER_SLOTS; i++) {
    const slot = document.createElement("div");
    slot.className = "empty-card-slot";
    if (i > 0 || jokers.length > 0) {
      slot.style.marginLeft = `${-jokerOverlap}px`;
    }
    jokersFan.appendChild(slot);
  }

  jokersSection.appendChild(jokersFan);
  container.appendChild(jokersSection);

  // ── Divider ──
  const divider = document.createElement("div");
  divider.className = "cards-row-divider";
  container.appendChild(divider);

  // ── Tarots section ──
  const tarotsSection = document.createElement("div");
  tarotsSection.className = "cards-section tarots-section";

  const tarotsHeader = document.createElement("div");
  tarotsHeader.className = "cards-section-header";
  tarotsHeader.textContent = `CONSUMABLES ${tarots.length}/${maxTarotSlots}`;
  tarotsSection.appendChild(tarotsHeader);

  const tarotsFan = document.createElement("div");
  tarotsFan.className = "cards-fan";

  const tarotOverlap = tarots.length > 3 ? 30 : 15;

  tarots.forEach((card, i) => {
    const cardEl = createCardElement(card, {
      showCost: false,
      compact: true,
      onClick: () => onUseTarot(i),
    });
    cardEl.classList.add("fan-card");
    const marginLeft = i === 0 ? 0 : -tarotOverlap;
    cardEl.style.marginLeft = `${marginLeft}px`;
    cardEl.style.zIndex = `${i + 1}`;

    attachPreview(cardEl, card);
    tarotsFan.appendChild(cardEl);
  });

  // Empty tarot slots
  for (let i = tarots.length; i < maxTarotSlots; i++) {
    const slot = document.createElement("div");
    slot.className = "empty-card-slot empty-card-slot-small";
    if (i > 0 || tarots.length > 0) {
      slot.style.marginLeft = `${-tarotOverlap}px`;
    }
    tarotsFan.appendChild(slot);
  }

  tarotsSection.appendChild(tarotsFan);
  container.appendChild(tarotsSection);
}

// Backward-compatible exports
export function renderJokersRow(_container: HTMLElement, _jokers: CardDefinition[]): void {
  // Now handled by renderCardsRow
}

export function renderOwnedJokers(container: HTMLElement, jokers: CardDefinition[]): void {
  // Now handled by renderCardsRow
}

// Trigger activation animation on all joker fan cards
export function animateJokerActivation(): void {
  const cards = document.querySelectorAll(".jokers-section .fan-card");
  cards.forEach((card) => {
    card.classList.add("joker-activating");
    card.addEventListener("animationend", () => {
      card.classList.remove("joker-activating");
    }, { once: true });
  });
}
