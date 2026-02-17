import type * as cg from "../../chessground/dist/types.js";
import { fromKey } from "../engine/board.js";
import { playChipCount } from "./audio.js";

export function scorePopup(text: string, key: cg.Key, boardEl: HTMLElement, color = "#4fc3f7"): void {
  const coord = fromKey(key);
  const rect = boardEl.getBoundingClientRect();
  const sqSize = rect.width / 8;
  const x = coord.x * sqSize + sqSize / 2;
  const y = coord.y * sqSize + sqSize / 2;

  const el = document.createElement("div");
  el.className = "score-popup";
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.color = color;
  boardEl.parentElement?.appendChild(el);

  el.animate(
    [
      { transform: "translateY(0) scale(1)", opacity: "1" },
      { transform: "translateY(-60px) scale(1.3)", opacity: "0" },
    ],
    { duration: 800, easing: "ease-out" },
  ).onfinish = () => el.remove();
}

export function goldCounterAnimation(el: HTMLElement, from: number, to: number): void {
  const duration = 600;
  const start = performance.now();
  const diff = to - from;

  function tick(now: number): void {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    const current = Math.round(from + diff * eased);
    el.textContent = `${current}g`;

    if (t < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

export function chipCountAnimation(el: HTMLElement, from: number, to: number): void {
  const steps = Math.min(15, Math.abs(to - from));
  const duration = 500;
  const stepTime = duration / Math.max(1, steps);
  let current = from;
  const diff = to - from;
  let step = 0;

  function tick(): void {
    step++;
    const t = step / steps;
    current = Math.round(from + diff * t);
    el.textContent = String(current);
    playChipCount(step);

    if (step < steps) {
      setTimeout(tick, stepTime);
    }
  }

  setTimeout(tick, stepTime);
}

export function cardDealAnimation(el: HTMLElement, index: number): void {
  el.style.opacity = "0";
  el.style.transform = "translateX(100px) rotate(10deg)";

  setTimeout(() => {
    el.animate(
      [
        { transform: "translateX(100px) rotate(10deg)", opacity: "0" },
        { transform: "translateX(0) rotate(0deg)", opacity: "1" },
      ],
      { duration: 300, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", fill: "forwards" },
    );
  }, index * 80);
}

export function bossIntroSplash(name: string, description: string): Promise<void> {
  return new Promise((resolve) => {
    const splash = document.createElement("div");
    splash.className = "boss-splash";
    splash.innerHTML = `
      <div class="boss-splash-inner">
        <div class="boss-splash-label">BOSS</div>
        <div class="boss-splash-name">${name}</div>
        <div class="boss-splash-desc">${description}</div>
      </div>
    `;
    document.body.appendChild(splash);

    splash.animate(
      [
        { opacity: "0", transform: "scale(0.8)" },
        { opacity: "1", transform: "scale(1)", offset: 0.2 },
        { opacity: "1", transform: "scale(1)", offset: 0.8 },
        { opacity: "0", transform: "scale(1.1)" },
      ],
      { duration: 2000, easing: "ease-out" },
    ).onfinish = () => {
      splash.remove();
      resolve();
    };
  });
}

export function pieceEntranceAnimation(boardEl: HTMLElement): void {
  const pieces = boardEl.querySelectorAll("piece");
  pieces.forEach((piece, i) => {
    const el = piece as HTMLElement;
    el.animate(
      [
        { transform: "translateY(-30px)", opacity: "0" },
        { transform: "translateY(0)", opacity: "1" },
      ],
      { duration: 200, delay: i * 30, easing: "ease-out", fill: "forwards" },
    );
  });
}
