import { ALL_CARDS } from "./data/cards.js";
import type { CardDefinition, CardCategory, CardRarity, CardStatus } from "./data/types.js";

import "./styles/dev.css";

// ── State ──
let activeCategory: CardCategory | null = null;
let activeRarity: CardRarity | null = null;
let activeStatus: CardStatus | null = null;
let searchQuery = "";
let selectedCard: CardDefinition | null = null;

// ── DOM ──
const app = document.querySelector(".dev-app")!;

function init(): void {
  document.body.classList.add("dev-ui");
  renderAll();
}

function getFilteredCards(): CardDefinition[] {
  return ALL_CARDS.filter((card) => {
    if (activeCategory && card.category !== activeCategory) return false;
    if (activeRarity && card.rarity !== activeRarity) return false;
    if (activeStatus && card.status !== activeStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        card.name.toLowerCase().includes(q) ||
        card.description.toLowerCase().includes(q) ||
        card.id.toLowerCase().includes(q) ||
        card.tags.some((t) => t.toLowerCase().includes(q)) ||
        (card.pieceType && card.pieceType.toLowerCase().includes(q)) ||
        (card.designNotes && card.designNotes.toLowerCase().includes(q))
      );
    }
    return true;
  });
}

function renderAll(): void {
  const cards = getFilteredCards();

  // Stats
  const total = ALL_CARDS.length;
  const byCategory = {
    joker: ALL_CARDS.filter((c) => c.category === "joker").length,
    tarot: ALL_CARDS.filter((c) => c.category === "tarot").length,
    planet: ALL_CARDS.filter((c) => c.category === "planet").length,
    voucher: ALL_CARDS.filter((c) => c.category === "voucher").length,
  };
  const byStatus = {
    implemented: ALL_CARDS.filter((c) => c.status === "implemented").length,
    designed: ALL_CARDS.filter((c) => c.status === "designed").length,
    concept: ALL_CARDS.filter((c) => c.status === "concept").length,
    cut: ALL_CARDS.filter((c) => c.status === "cut").length,
  };
  const pctImplemented = total > 0 ? Math.round((byStatus.implemented / total) * 100) : 0;

  app.innerHTML = `
    <div class="dev-header">
      <h1>Balatress Card Browser <span>(${total} cards)</span></h1>
      <div>
        <button class="dev-theme-toggle" id="themeToggle">Toggle Light/Dark</button>
        <button class="dev-export-btn" id="exportBtn">Export JSON</button>
      </div>
    </div>

    <div class="dev-stats">
      <div class="dev-stat">
        <div class="dev-stat-value">${total}</div>
        <div class="dev-stat-label">Total</div>
      </div>
      <div class="dev-stat" style="border-left: 3px solid #009cfd">
        <div class="dev-stat-value">${byCategory.joker}</div>
        <div class="dev-stat-label">Jokers</div>
      </div>
      <div class="dev-stat" style="border-left: 3px solid #fd5f55">
        <div class="dev-stat-value">${byCategory.tarot}</div>
        <div class="dev-stat-label">Tarots</div>
      </div>
      <div class="dev-stat" style="border-left: 3px solid #379639">
        <div class="dev-stat-value">${byCategory.planet}</div>
        <div class="dev-stat-label">Planets</div>
      </div>
      <div class="dev-stat" style="border-left: 3px solid #f2c94c">
        <div class="dev-stat-value">${byCategory.voucher}</div>
        <div class="dev-stat-label">Vouchers</div>
      </div>
      <div class="dev-stat" style="border-left: 3px solid #4caf50">
        <div class="dev-stat-value">${pctImplemented}%</div>
        <div class="dev-stat-label">Implemented</div>
      </div>
      <div class="dev-stat">
        <div class="dev-stat-value">${byStatus.implemented}</div>
        <div class="dev-stat-label">Done</div>
      </div>
      <div class="dev-stat">
        <div class="dev-stat-value">${byStatus.designed}</div>
        <div class="dev-stat-label">Designed</div>
      </div>
    </div>

    <div class="dev-filters">
      <div class="dev-filter-group">
        <label>Category:</label>
        ${renderFilterButtons("category", ["joker", "tarot", "planet", "voucher"], activeCategory)}
      </div>
      <div class="dev-filter-group">
        <label>Rarity:</label>
        ${renderFilterButtons("rarity", ["common", "uncommon", "rare", "legendary"], activeRarity)}
      </div>
      <div class="dev-filter-group">
        <label>Status:</label>
        ${renderFilterButtons("status", ["implemented", "designed", "concept", "cut"], activeStatus)}
      </div>
      <input type="text" class="dev-search" placeholder="Search cards..." value="${searchQuery}" id="searchInput" />
    </div>

    <div class="dev-card-grid" id="cardGrid">
      ${cards.map((card) => renderDevCard(card)).join("")}
    </div>

    <div class="dev-detail" id="detailPanel">
      <button class="dev-detail-close" id="detailClose">&times;</button>
      <div id="detailContent"></div>
    </div>
  `;

  // Bind events
  bindEvents();
}

function renderFilterButtons(group: string, options: string[], active: string | null): string {
  return options
    .map(
      (opt) =>
        `<button class="dev-filter-btn ${active === opt ? "active" : ""}" data-filter-group="${group}" data-filter-value="${opt}">${opt}</button>`,
    )
    .join("");
}

function renderDevCard(card: CardDefinition): string {
  return `
    <div class="dev-card" data-card-id="${card.id}">
      <div class="dev-card-header">
        <div class="dev-card-name">${card.name}</div>
        <div class="dev-card-badges">
          <span class="dev-badge dev-badge-${card.category}">${card.category}</span>
          <span class="dev-badge dev-badge-${card.status}">${card.status}</span>
        </div>
      </div>
      <div class="dev-card-desc">${card.description}</div>
      <div class="dev-card-meta">
        <span>${card.rarity}</span>
        <span>${card.cost}g</span>
        ${card.pieceType ? `<span>${card.pieceType}</span>` : ""}
        ${card.tags.slice(0, 3).map((t) => `<span>#${t}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderDetailPanel(card: CardDefinition): void {
  const content = document.getElementById("detailContent")!;
  content.innerHTML = `
    <h2>${card.name}</h2>
    <div class="dev-detail-field">
      <label>ID</label>
      <p><code>${card.id}</code></p>
    </div>
    <div class="dev-detail-field">
      <label>Category</label>
      <p>${card.category}</p>
    </div>
    <div class="dev-detail-field">
      <label>Rarity</label>
      <p>${card.rarity}</p>
    </div>
    <div class="dev-detail-field">
      <label>Cost</label>
      <p>${card.cost}g</p>
    </div>
    <div class="dev-detail-field">
      <label>Description</label>
      <p>${card.description}</p>
    </div>
    ${card.flavorText ? `<div class="dev-detail-field"><label>Flavor Text</label><p><em>${card.flavorText}</em></p></div>` : ""}
    ${card.pieceType ? `<div class="dev-detail-field"><label>Piece Type</label><p>${card.pieceType}</p></div>` : ""}
    <div class="dev-detail-field">
      <label>Status</label>
      <p>${card.status}</p>
    </div>
    <div class="dev-detail-field">
      <label>Tags</label>
      <p>${card.tags.map((t) => `<span class="dev-badge" style="background:rgba(255,255,255,0.05)">${t}</span>`).join(" ")}</p>
    </div>
    ${card.designNotes ? `<div class="dev-detail-field"><label>Design Notes</label><p>${card.designNotes}</p></div>` : ""}
    <div class="dev-detail-field">
      <label>Has apply()</label>
      <p>${card.apply ? "Yes" : "No"}</p>
    </div>
    <div class="dev-detail-field">
      <label>Has onActivate()</label>
      <p>${card.onActivate ? "Yes" : "No"}</p>
    </div>
  `;

  const panel = document.getElementById("detailPanel")!;
  panel.classList.add("open");
}

function bindEvents(): void {
  // Filter buttons
  document.querySelectorAll(".dev-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.getAttribute("data-filter-group")!;
      const value = btn.getAttribute("data-filter-value")!;

      if (group === "category") {
        activeCategory = activeCategory === value ? null : (value as CardCategory);
      } else if (group === "rarity") {
        activeRarity = activeRarity === value ? null : (value as CardRarity);
      } else if (group === "status") {
        activeStatus = activeStatus === value ? null : (value as CardStatus);
      }
      renderAll();
    });
  });

  // Search
  const searchInput = document.getElementById("searchInput") as HTMLInputElement | null;
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      searchQuery = searchInput.value;
      // Re-render just the grid
      const grid = document.getElementById("cardGrid")!;
      const cards = getFilteredCards();
      grid.innerHTML = cards.map((c) => renderDevCard(c)).join("");
      bindCardClickEvents();
    });
  }

  // Theme toggle
  document.getElementById("themeToggle")?.addEventListener("click", () => {
    document.body.classList.toggle("light");
  });

  // Export JSON
  document.getElementById("exportBtn")?.addEventListener("click", () => {
    const data = ALL_CARDS.map(({ apply, onActivate, onCapture, onCheck, onRoundStart, onTurnStart, onScore, ...rest }) => rest);
    const json = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      const btn = document.getElementById("exportBtn")!;
      btn.textContent = "Copied!";
      setTimeout(() => { btn.textContent = "Export JSON"; }, 1500);
    });
  });

  // Detail panel close
  document.getElementById("detailClose")?.addEventListener("click", () => {
    document.getElementById("detailPanel")!.classList.remove("open");
    selectedCard = null;
  });

  bindCardClickEvents();
}

function bindCardClickEvents(): void {
  document.querySelectorAll(".dev-card").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-card-id")!;
      const card = ALL_CARDS.find((c) => c.id === id);
      if (card) {
        selectedCard = card;
        renderDetailPanel(card);
      }
    });
  });
}

// ── Init ──
init();
