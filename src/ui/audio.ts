let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function play(frequency: number, type: OscillatorType, duration: number, volume = 0.15): void {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch {
    // Audio not available
  }
}

export function playChipCount(index = 0): void {
  const freq = 440 + index * 60;
  play(freq, "square", 0.08, 0.1);
}

export function playCapture(): void {
  play(110, "sawtooth", 0.15, 0.12);
  setTimeout(() => play(90, "sawtooth", 0.1, 0.08), 50);
}

export function playCheck(): void {
  play(330, "sine", 0.12, 0.12);
  setTimeout(() => play(440, "sine", 0.12, 0.12), 80);
  setTimeout(() => play(550, "sine", 0.15, 0.1), 160);
}

export function playCheckmate(): void {
  play(330, "sine", 0.15, 0.15);
  setTimeout(() => play(440, "sine", 0.15, 0.15), 100);
  setTimeout(() => play(550, "sine", 0.15, 0.15), 200);
  setTimeout(() => play(660, "sine", 0.25, 0.15), 300);
}

export function playCardSelect(): void {
  play(880, "sine", 0.06, 0.08);
}

export function playGoldCoin(): void {
  play(1200, "sine", 0.05, 0.08);
  setTimeout(() => play(1500, "sine", 0.05, 0.06), 60);
}

export function playCardBuy(): void {
  play(660, "sine", 0.08, 0.1);
  setTimeout(() => play(880, "sine", 0.08, 0.08), 70);
}

export function playError(): void {
  play(200, "square", 0.12, 0.08);
}

export function playRoundWin(): void {
  [440, 550, 660, 880].forEach((freq, i) => {
    setTimeout(() => play(freq, "sine", 0.15, 0.12), i * 100);
  });
}

export function playBossIntro(): void {
  play(110, "sawtooth", 0.3, 0.15);
  setTimeout(() => play(100, "sawtooth", 0.4, 0.12), 200);
}
