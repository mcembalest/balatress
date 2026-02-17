import type { RoundConfig, BossConfig, Difficulty } from "./types.js";

export const BASE_ROUNDS: RoundConfig[] = [
  {
    boardW: 6,
    boardH: 6,
    enemyCount: 5,
    target: 2,
    objective: "capture_count",
    turnLimit: 14,
    enemyActions: 1,
    aiDepth: 1,
    aiDifficulty: "Easy",
  },
  {
    boardW: 7,
    boardH: 7,
    enemyCount: 7,
    target: 1,
    objective: "check",
    turnLimit: 15,
    enemyActions: 1,
    aiDepth: 2,
    aiDifficulty: "Normal",
  },
  {
    boardW: 8,
    boardH: 8,
    enemyCount: 9,
    target: 4,
    objective: "capture_count",
    turnLimit: 16,
    enemyActions: 1,
    aiDepth: 2,
    aiDifficulty: "Normal",
  },
];

export const BOSSES: BossConfig[] = [
  {
    name: "The Wall",
    description: "Enemy pawns are immune for the first 3 turns.",
    apply: (state) => {
      state.pawnImmuneTurns = 3;
    },
  },
  {
    name: "The Mirror",
    description: "Enemies copy your movement mods.",
    apply: (state) => {
      state.mirrorMods = true;
    },
  },
  {
    name: "The Clock",
    description: "Turn limit halved.",
    apply: (state) => {
      state.turnLimit = Math.max(5, Math.ceil(state.turnLimit / 2));
    },
  },
  {
    name: "The Fog",
    description: "Enemy pieces hidden until adjacent to yours.",
    apply: (state) => {
      state.fogOfWar = true;
    },
  },
  {
    name: "The Swarm",
    description: "Double enemy count, double score target.",
    apply: (_state) => {
      // Applied during round generation — enemyCount and scoreTarget doubled
    },
  },
  {
    name: "The Fortress",
    description: "Enemy king surrounded by rooks in a defensive formation.",
    apply: (_state) => {
      // Applied during spawn — special formation
    },
  },
];

export function aiDepthForRound(roundIndex: number): number {
  if (roundIndex <= 0) return 1;
  if (roundIndex <= 2) return 2;
  if (roundIndex <= 4) return 3;
  return 4;
}

export function difficultyLabelForDepth(depth: number): Difficulty {
  if (depth <= 1) return "Easy";
  if (depth === 2) return "Normal";
  if (depth === 3) return "Hard";
  return "Expert";
}

export function generateRound(roundIndex: number): RoundConfig {
  const wave = roundIndex - BASE_ROUNDS.length + 1;
  const depth = aiDepthForRound(roundIndex);
  const isBoss = (roundIndex + 1) % 3 === 0;

  let enemyCount = 9 + wave * 2;
  const config: RoundConfig = {
    boardW: 8,
    boardH: 8,
    enemyCount,
    target: 4 + wave,
    objective: wave % 2 === 0 ? "check" : "capture_count",
    turnLimit: Math.max(12, 16 + Math.floor(wave / 2)),
    enemyActions: 1,
    aiDepth: depth,
    aiDifficulty: difficultyLabelForDepth(depth),
  };

  if (isBoss) {
    const bossIndex = Math.floor((roundIndex + 1) / 3) - 1;
    const boss = BOSSES[bossIndex % BOSSES.length];
    config.boss = boss;

    if (boss.name === "The Swarm") {
      config.enemyCount = enemyCount * 2;
    }
  }

  return config;
}

export function scoreTargetForRound(roundIndex: number): number {
  const base = 100 + roundIndex * 75;
  const isBoss = (roundIndex + 1) % 3 === 0;
  return isBoss ? Math.floor(base * 1.5) : base;
}
