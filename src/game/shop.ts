import type { GameState, CardDefinition, CardCategory, CardRarity } from "../data/types.js";
import { getShopPool } from "../data/cards.js";

const RARITY_WEIGHTS: Record<CardRarity, number> = {
  common: 60,
  uncommon: 25,
  rare: 12,
  legendary: 3,
};

function weightedRandomRarity(): CardRarity {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    roll -= weight;
    if (roll <= 0) return rarity as CardRarity;
  }
  return "common";
}

export function generateShopCards(state: GameState): CardDefinition[] {
  const ownedIds = new Set<string>([
    ...state.ownedJokers.map(c => c.id),
    ...state.ownedPlanets,
    ...state.ownedVouchers,
    ...state.upgrades,
  ]);
  const pool = getShopPool(ownedIds);

  const count = state.shopCards;
  const cards: CardDefinition[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < count && pool.length > 0; i++) {
    const targetRarity = weightedRandomRarity();
    const filtered = pool.filter(c => c.rarity === targetRarity && !usedIds.has(c.id));
    const source = filtered.length > 0 ? filtered : pool.filter(c => !usedIds.has(c.id));
    if (source.length === 0) break;

    const card = source[Math.floor(Math.random() * source.length)];
    cards.push(card);
    usedIds.add(card.id);
  }

  return cards;
}

export function getCardCost(card: CardDefinition, state: GameState): number {
  const discount = state.mods.counters.get("shop_discount") ?? 0;
  return Math.max(0, card.cost - discount);
}

export function canAfford(card: CardDefinition, state: GameState): boolean {
  return state.gold >= getCardCost(card, state);
}

export function buyCard(card: CardDefinition, state: GameState): boolean {
  const cost = getCardCost(card, state);
  if (state.gold < cost) return false;

  state.gold -= cost;

  switch (card.category) {
    case "joker":
      state.ownedJokers.push(card);
      if (card.apply) card.apply(state);
      state.upgrades.push(card.id);
      break;
    case "tarot":
      if (state.ownedTarots.length < state.maxTarots) {
        state.ownedTarots.push(card);
      } else {
        return false;
      }
      break;
    case "planet":
      state.ownedPlanets.push(card.id);
      if (card.apply) card.apply(state);
      state.upgrades.push(card.id);
      break;
    case "voucher":
      state.ownedVouchers.push(card.id);
      if (card.apply) card.apply(state);
      state.upgrades.push(card.id);
      break;
  }

  return true;
}

export function sellJoker(card: CardDefinition, state: GameState): void {
  const idx = state.ownedJokers.findIndex(c => c.id === card.id);
  if (idx === -1) return;
  state.ownedJokers.splice(idx, 1);
  state.gold += Math.floor(card.cost / 2);
}

export function reroll(state: GameState): boolean {
  if (state.gold < state.rerollCost) return false;
  state.gold -= state.rerollCost;
  if (!state.mods.flags.has("diplomat")) {
    state.rerollCost += 1;
  }
  return true;
}

export function calculateGoldEarned(state: GameState): { base: number; scoreBonus: number; interest: number; queenGold: number; total: number } {
  const base = 3;
  const scoreBonus = Math.floor(state.roundScore / 100);
  let interest = 0;
  if (state.mods.flags.has("war_chest")) {
    interest = Math.min(5, Math.floor(state.gold / 5));
  }
  const queenGold = state.mods.queenGoldGen;
  const total = base + scoreBonus + interest + queenGold;
  return { base, scoreBonus, interest, queenGold, total };
}

export function categoryColor(category: CardCategory): string {
  switch (category) {
    case "joker": return "#009cfd";
    case "tarot": return "#fd5f55";
    case "planet": return "#379639";
    case "voucher": return "#f2c94c";
  }
}

export function rarityColor(rarity: CardRarity): string {
  switch (rarity) {
    case "common": return "#9aa4af";
    case "uncommon": return "#009cfd";
    case "rare": return "#b362ff";
    case "legendary": return "#f2c94c";
  }
}
