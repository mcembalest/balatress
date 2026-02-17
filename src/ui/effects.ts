export function initCRT(): void {
  if (document.getElementById("crt-overlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "crt-overlay";
  overlay.className = "crt-overlay";
  document.body.appendChild(overlay);
}

export function screenShake(intensity = 4, duration = 200): void {
  const el = document.querySelector(".app") as HTMLElement | null;
  if (!el) return;
  el.animate(
    [
      { transform: "translate(0, 0)" },
      { transform: `translate(${intensity}px, ${-intensity}px)` },
      { transform: `translate(${-intensity}px, ${intensity}px)` },
      { transform: `translate(${intensity * 0.5}px, ${-intensity * 0.5}px)` },
      { transform: "translate(0, 0)" },
    ],
    { duration, easing: "ease-out" },
  );
}

export function particleBurst(x: number, y: number, color = "#fd5f55", count = 8): void {
  const container = document.querySelector(".boardHost") as HTMLElement | null;
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const relX = x - rect.left;
  const relY = y - rect.top;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = `${relX}px`;
    particle.style.top = `${relY}px`;
    particle.style.backgroundColor = color;
    container.appendChild(particle);

    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const distance = 30 + Math.random() * 40;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    particle.animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: "1" },
        { transform: `translate(${dx}px, ${dy}px) scale(0)`, opacity: "0" },
      ],
      { duration: 400 + Math.random() * 200, easing: "ease-out" },
    ).onfinish = () => particle.remove();
  }
}

export function squareCenter(boardEl: HTMLElement, file: number, rank: number): { x: number; y: number } {
  const rect = boardEl.getBoundingClientRect();
  const sqSize = rect.width / 8;
  return {
    x: rect.left + file * sqSize + sqSize / 2,
    y: rect.top + rank * sqSize + sqSize / 2,
  };
}
