import { Chessground } from "../chessground/dist/chessground.js";
import type { Api } from "../chessground/dist/api.js";
import type { Config } from "../chessground/dist/config.js";
import type * as cg from "../chessground/dist/types.js";

import type { Piece } from "./data/types.js";
import { createInitialState } from "./engine/state.js";
import { fromKey } from "./engine/board.js";
import { setupRound, resetRun, onPlayerMove, useTarot, setFlowCallbacks } from "./game/flow.js";
import { renderBoard } from "./ui/render.js";
import { updateHud } from "./ui/hud.js";
import { showShop, showRestart, hideOverlay } from "./ui/overlay.js";
import { renderCardsRow, animateJokerActivation } from "./ui/cards-ui.js";
import { initCRT, screenShake, particleBurst, squareCenter } from "./ui/effects.js";
import { scorePopup, bossIntroSplash, pieceEntranceAnimation } from "./ui/animations.js";
import { playCapture, playCheck, playCheckmate } from "./ui/audio.js";

import "./styles/base.css";
import "./styles/balatro.css";
import "./styles/crt.css";
import "./styles/cards.css";
import "./styles/chessground-theme.css";

// ── DOM elements ──
function requireElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing required element: #${id}`);
  return el as T;
}

const statusEl = requireElement<HTMLElement>("status");
const objectiveEl = requireElement<HTMLElement>("objective");
const roundInfoEl = requireElement<HTMLElement>("roundInfo");
const goldDisplayEl = requireElement<HTMLElement>("goldDisplay");
const scoreDisplayEl = requireElement<HTMLElement>("scoreDisplay");
const logEl = requireElement<HTMLElement>("log");
const overlayEl = requireElement<HTMLElement>("overlay");
const overlayTitleEl = requireElement<HTMLElement>("overlayTitle");
const overlayBodyEl = requireElement<HTMLElement>("overlayBody");
const choicesEl = requireElement<HTMLElement>("choices");
const cardsRowEl = requireElement<HTMLElement>("cardsRow");
const boardElement = requireElement<HTMLElement>("board");

// ── Game state ──
const state = createInitialState();

// ── Chessground ──
const groundConfig: Config = {
  orientation: "white",
  movable: {
    free: false,
    color: "white",
    dests: new Map<cg.Key, cg.Key[]>(),
    events: {
      after: (orig, dest) => {
        onPlayerMove(state, orig, dest);
      },
    },
  },
  premovable: { enabled: false },
  draggable: { enabled: true, showGhost: true },
  animation: { enabled: true, duration: 170 },
};
const ground: Api = Chessground(boardElement, groundConfig);

// ── Helpers ──
function log(msg: string): void {
  const line = document.createElement("div");
  line.className = "entry";
  line.textContent = msg;
  logEl.prepend(line);
}

function render(): void {
  renderBoard(ground, state);
  updateHud(state, {
    status: statusEl,
    objective: objectiveEl,
    roundInfo: roundInfoEl,
    goldDisplay: goldDisplayEl,
    scoreDisplay: scoreDisplayEl,
  });
  renderCardsRow(cardsRowEl, state.ownedJokers, state.ownedTarots, state.maxTarots, (index) => {
    useTarot(state, index);
  });
}

const overlayEls = {
  overlay: overlayEl,
  overlayTitle: overlayTitleEl,
  overlayBody: overlayBodyEl,
  choices: choicesEl,
};

// ── Flow callbacks ──
setFlowCallbacks({
  render,
  log,
  showShop: () => {
    showShop(state, overlayEls, {
      onDone: () => {
        setupRound(state, state.round + 1);
      },
      render,
      log,
    });
  },
  showRestart: (title, body) => {
    showRestart(state, title, body, overlayEls, () => {
      resetRun(state);
    });
  },
  onCapture: (_piece: Piece, _target: Piece) => {
    playCapture();
    screenShake(4, 200);

    // Particle burst at capture location
    const coord = { x: _target.x, y: _target.y };
    const pos = squareCenter(boardElement, coord.x, coord.y);
    particleBurst(pos.x, pos.y, "#fd5f55");
  },
  onCheck: () => {
    playCheck();
    screenShake(3, 150);
  },
  onCheckmate: () => {
    playCheckmate();
    screenShake(6, 300);
  },
  onScoreEvent: (chips, source, key) => {
    if (key) {
      scorePopup(source, key, boardElement, "#4fc3f7");
    }
    // Animate jokers when scoring occurs
    if (state.ownedJokers.length > 0) {
      animateJokerActivation();
    }
  },
});

// ── Init ──
initCRT();
resetRun(state);
