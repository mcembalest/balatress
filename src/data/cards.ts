import type { CardDefinition } from "./types.js";

export const ALL_CARDS: CardDefinition[] = [
  // ═══════════════════════════════════════════
  // JOKERS — Persistent passive effects (25+)
  // ═══════════════════════════════════════════

  // --- Migrated from original upgrades ---
  {
    id: "pawn_side_step",
    name: "Pawns: Side Step",
    description: "Pawns can move one tile sideways and capture sideways.",
    category: "joker",
    rarity: "common",
    cost: 4,
    pieceType: "pawn",
    tags: ["movement", "pawn", "original"],
    status: "implemented",
    apply: (state) => { state.mods.pawnSideStep = true; },
  },
  {
    id: "bishop_guard",
    name: "Bishops: Guard Step",
    description: "Bishops can also move one tile orthogonally.",
    category: "joker",
    rarity: "common",
    cost: 4,
    pieceType: "bishop",
    tags: ["movement", "bishop", "original"],
    status: "implemented",
    apply: (state) => { state.mods.bishopGuardStep = true; },
  },
  {
    id: "knight_chain",
    name: "Knights: Chain Capture",
    description: "Knight captures grant +1 action this turn.",
    category: "joker",
    rarity: "uncommon",
    cost: 5,
    pieceType: "knight",
    tags: ["action", "knight", "capture", "original"],
    status: "implemented",
    apply: (state) => { state.mods.knightChain = true; },
  },
  {
    id: "rook_diagonal",
    name: "Rooks: Diagonal Jets",
    description: "Rooks gain diagonal movement up to 2 squares.",
    category: "joker",
    rarity: "uncommon",
    cost: 5,
    pieceType: "rook",
    tags: ["movement", "rook", "original"],
    status: "implemented",
    apply: (state) => { state.mods.rookDiagonal = true; },
  },
  {
    id: "double_command",
    name: "Global: Double Command",
    description: "You get +1 action every player turn.",
    category: "joker",
    rarity: "rare",
    cost: 7,
    tags: ["action", "global", "original"],
    status: "implemented",
    apply: (state) => { state.mods.globalActions += 1; },
  },
  {
    id: "tempo_cycle",
    name: "Global: Tempo Cycle",
    description: "Every 3rd player turn, gain +1 action.",
    category: "joker",
    rarity: "common",
    cost: 4,
    tags: ["action", "global", "tempo", "original"],
    status: "implemented",
    apply: (state) => { state.mods.periodicTempo = true; },
  },
  {
    id: "cryo_pulse",
    name: "Power: Cryo Pulse",
    description: "At round start, freeze enemies for one enemy phase.",
    category: "joker",
    rarity: "uncommon",
    cost: 5,
    tags: ["power", "freeze", "original"],
    status: "implemented",
    apply: (state) => { state.mods.cryoPulse = true; },
  },
  {
    id: "royal_reach",
    name: "Kings: Royal Reach",
    description: "King can move up to 2 squares in any direction.",
    category: "joker",
    rarity: "uncommon",
    cost: 5,
    pieceType: "king",
    tags: ["movement", "king", "original"],
    status: "implemented",
    apply: (state) => { state.mods.kingRange = 2; },
  },

  // --- New Jokers ---
  {
    id: "battlefield_promotion",
    name: "Battlefield Promotion",
    description: "Pawns reaching the last 2 rows promote to Queens.",
    flavorText: "Rise through the ranks.",
    category: "joker",
    rarity: "rare",
    cost: 7,
    pieceType: "pawn",
    tags: ["promotion", "pawn", "powerful"],
    designNotes: "Check pawn position after each move. If in last 2 rows, change type to queen.",
    status: "implemented",
    apply: (state) => { state.mods.flags.add("battlefield_promotion"); },
  },
  {
    id: "bishop_pair_synergy",
    name: "Bishop Pair Synergy",
    description: "When you have 2+ bishops, all bishops gain +2 diagonal range.",
    flavorText: "Two heads of the church.",
    category: "joker",
    rarity: "uncommon",
    cost: 5,
    pieceType: "bishop",
    tags: ["synergy", "bishop", "conditional"],
    designNotes: "Checked at move generation time. Count player bishops; if >=2, add flag.",
    status: "implemented",
    apply: (state) => { state.mods.flags.add("bishop_pair_synergy"); },
  },
  {
    id: "castle_keep",
    name: "Castle Keep",
    description: "Rook adjacent to King grants +1 action per turn.",
    flavorText: "The throne's faithful guardian.",
    category: "joker",
    rarity: "uncommon",
    cost: 5,
    pieceType: "rook",
    tags: ["action", "rook", "king", "positional"],
    designNotes: "At turn start, check if any player rook is adjacent (8-dir) to player king.",
    status: "implemented",
    apply: (state) => { state.mods.flags.add("castle_keep"); },
  },
  {
    id: "pawn_storm",
    name: "Pawn Storm",
    description: "3+ pawns on the same rank all get +1 action when moving.",
    flavorText: "March together, fight together.",
    category: "joker",
    rarity: "rare",
    cost: 6,
    pieceType: "pawn",
    tags: ["synergy", "pawn", "positional"],
    designNotes: "After pawn move, check rank. If 3+ player pawns on same rank, grant +1 action.",
    status: "implemented",
    apply: (state) => { state.mods.flags.add("pawn_storm"); },
  },
  {
    id: "scholars_mate",
    name: "Scholar's Mate",
    description: "Delivering check gives x1.5 mult.",
    flavorText: "The ancient technique.",
    category: "joker",
    rarity: "uncommon",
    cost: 5,
    tags: ["scoring", "check", "mult"],
    designNotes: "Applied in scoring when check is delivered.",
    status: "implemented",
    apply: (state) => { state.mods.flags.add("scholars_mate"); },
  },
  {
    id: "material_advantage",
    name: "Material Advantage",
    description: "+5 chips per piece count advantage over enemy.",
    flavorText: "Numbers don't lie.",
    category: "joker",
    rarity: "common",
    cost: 4,
    tags: ["scoring", "chips", "material"],
    designNotes: "At scoring: count player pieces - enemy pieces. If positive, add 5 * diff chips.",
    status: "implemented",
    apply: (state) => { state.mods.flags.add("material_advantage"); },
  },
  {
    id: "endgame_specialist",
    name: "Endgame Specialist",
    description: "When fewer than 5 total pieces remain, all yours get +2 movement range.",
    flavorText: "Mastery in the final moments.",
    category: "joker",
    rarity: "rare",
    cost: 7,
    tags: ["movement", "endgame", "conditional"],
    designNotes: "At move generation: if total pieces < 5, extend movement range by 2.",
    status: "implemented",
    apply: (state) => { state.mods.flags.add("endgame_specialist"); },
  },
  {
    id: "queens_guard",
    name: "Queen's Guard",
    description: "Queen can't be captured if King is not in check.",
    flavorText: "Shielded by royal decree.",
    category: "joker",
    rarity: "rare",
    cost: 8,
    pieceType: "queen",
    tags: ["defense", "queen", "king"],
    designNotes: "During enemy move validation: if target is player queen and player king not in check, prevent capture.",
    status: "designed",
    apply: (state) => { state.mods.flags.add("queens_guard"); },
  },
  {
    id: "grandmasters_eye",
    name: "Grandmaster's Eye",
    description: "See the enemy's next planned move.",
    flavorText: "Three moves ahead.",
    category: "joker",
    rarity: "legendary",
    cost: 12,
    tags: ["information", "legendary", "ai"],
    designNotes: "After player turn, compute enemy's best move and highlight it on board.",
    status: "designed",
    apply: (state) => { state.mods.flags.add("grandmasters_eye"); },
  },
  {
    id: "opening_theory",
    name: "Opening Theory",
    description: "+2 actions on your first turn each round.",
    flavorText: "A strong opening sets the pace.",
    category: "joker",
    rarity: "common",
    cost: 3,
    tags: ["action", "tempo", "opening"],
    status: "implemented",
    apply: (state) => { state.mods.flags.add("opening_theory"); },
  },
  {
    id: "blood_sacrifice",
    name: "Blood Sacrifice",
    description: "Losing a piece grants x0.5 mult bonus.",
    flavorText: "Every loss fuels the flame.",
    category: "joker",
    rarity: "uncommon",
    cost: 5,
    tags: ["scoring", "mult", "sacrifice"],
    status: "implemented",
    apply: (state) => { state.mods.flags.add("blood_sacrifice"); },
  },
  {
    id: "blitz_tactics",
    name: "Blitz Tactics",
    description: "Captures made on the first action of a turn earn double chips.",
    flavorText: "Strike first, strike hard.",
    category: "joker",
    rarity: "common",
    cost: 4,
    tags: ["scoring", "chips", "tempo"],
    status: "implemented",
    apply: (state) => { state.mods.flags.add("blitz_tactics"); },
  },
  {
    id: "fortress_mentality",
    name: "Fortress Mentality",
    description: "If your king hasn't moved this round, +20 chips per turn.",
    flavorText: "Stand your ground.",
    category: "joker",
    rarity: "common",
    cost: 3,
    pieceType: "king",
    tags: ["scoring", "chips", "defensive", "king"],
    status: "implemented",
    apply: (state) => { state.mods.flags.add("fortress_mentality"); },
  },
  {
    id: "cavalry_charge",
    name: "Cavalry Charge",
    description: "Knight captures deal +20 bonus chips.",
    flavorText: "The thundering hooves.",
    category: "joker",
    rarity: "common",
    cost: 4,
    pieceType: "knight",
    tags: ["scoring", "chips", "knight", "capture"],
    status: "implemented",
    apply: (state) => { state.mods.flags.add("cavalry_charge"); },
  },
  {
    id: "rook_battery",
    name: "Rook Battery",
    description: "Two rooks on the same file/rank grant x0.3 mult each.",
    flavorText: "Doubled and dangerous.",
    category: "joker",
    rarity: "uncommon",
    cost: 5,
    pieceType: "rook",
    tags: ["scoring", "mult", "rook", "synergy"],
    status: "designed",
    apply: (state) => { state.mods.flags.add("rook_battery"); },
  },
  {
    id: "gambit_accepted",
    name: "Gambit Accepted",
    description: "When you lose a piece, gain +2 actions next turn.",
    flavorText: "A calculated loss.",
    category: "joker",
    rarity: "rare",
    cost: 6,
    tags: ["action", "sacrifice", "gambit"],
    status: "implemented",
    apply: (state) => { state.mods.flags.add("gambit_accepted"); },
  },

  // ═══════════════════════════════════════════
  // TAROTS — One-time consumable effects (15+)
  // ═══════════════════════════════════════════
  {
    id: "en_passant",
    name: "En Passant",
    description: "Teleport a pawn behind any enemy pawn and capture it.",
    flavorText: "The sneakiest rule.",
    category: "tarot",
    rarity: "uncommon",
    cost: 4,
    pieceType: "pawn",
    tags: ["movement", "capture", "pawn"],
    designNotes: "Select a player pawn and an enemy pawn. Player pawn teleports behind enemy, enemy is captured.",
    status: "designed",
    onActivate: (state) => {
      const playerPawns = state.pieces.filter(p => p.side === "player" && p.type === "pawn");
      const enemyPawns = state.pieces.filter(p => p.side === "enemy" && p.type === "pawn");
      if (playerPawns.length && enemyPawns.length) {
        const ep = enemyPawns[0];
        const pp = playerPawns[0];
        state.pieces = state.pieces.filter(p => p.id !== ep.id);
        pp.x = ep.x;
        pp.y = ep.y + 1;
        state.captureCount += 1;
      }
    },
  },
  {
    id: "fork_lightning",
    name: "Fork Lightning",
    description: "Your knight attacks all adjacent enemies simultaneously.",
    flavorText: "Zeus smiles upon the cavalry.",
    category: "tarot",
    rarity: "rare",
    cost: 6,
    pieceType: "knight",
    tags: ["capture", "knight", "aoe"],
    status: "designed",
    onActivate: (state) => {
      const knight = state.pieces.find(p => p.side === "player" && p.type === "knight");
      if (!knight) return;
      const jumps = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
      const targets = jumps
        .map(([dx,dy]) => state.pieces.find(p => p.side === "enemy" && p.x === knight.x+dx && p.y === knight.y+dy))
        .filter((p): p is NonNullable<typeof p> => !!p);
      targets.forEach(t => {
        state.pieces = state.pieces.filter(p => p.id !== t.id);
        state.captureCount += 1;
      });
    },
  },
  {
    id: "castling_rush",
    name: "Castling Rush",
    description: "Swap King and Rook positions instantly.",
    flavorText: "A royal relocation.",
    category: "tarot",
    rarity: "uncommon",
    cost: 4,
    tags: ["movement", "king", "rook", "positional"],
    status: "designed",
    onActivate: (state) => {
      const king = state.pieces.find(p => p.side === "player" && p.type === "king");
      const rook = state.pieces.find(p => p.side === "player" && p.type === "rook");
      if (king && rook) {
        const [kx, ky] = [king.x, king.y];
        king.x = rook.x; king.y = rook.y;
        rook.x = kx; rook.y = ky;
      }
    },
  },
  {
    id: "promotion_decree",
    name: "Promotion Decree",
    description: "Upgrade any pawn to a queen immediately.",
    flavorText: "By royal decree!",
    category: "tarot",
    rarity: "rare",
    cost: 6,
    pieceType: "pawn",
    tags: ["promotion", "pawn", "powerful"],
    status: "implemented",
    onActivate: (state) => {
      const pawn = state.pieces.find(p => p.side === "player" && p.type === "pawn");
      if (pawn) pawn.type = "queen";
    },
  },
  {
    id: "shield_wall",
    name: "Shield Wall",
    description: "All your pieces are immune for 1 enemy phase.",
    flavorText: "Hold the line!",
    category: "tarot",
    rarity: "rare",
    cost: 7,
    tags: ["defense", "immunity"],
    status: "implemented",
    onActivate: (state) => {
      state.freezeEnemyPhase = true;
    },
  },
  {
    id: "time_walk",
    name: "Time Walk",
    description: "Refresh all actions this turn.",
    flavorText: "Time bends to your will.",
    category: "tarot",
    rarity: "legendary",
    cost: 10,
    tags: ["action", "powerful", "legendary"],
    status: "implemented",
    onActivate: (state) => {
      state.actionsLeft = 1 + state.mods.globalActions;
    },
  },
  {
    id: "retreat",
    name: "Retreat",
    description: "Return any piece to the back rank, gain +1 action.",
    flavorText: "A tactical withdrawal.",
    category: "tarot",
    rarity: "common",
    cost: 3,
    tags: ["movement", "action", "safety"],
    status: "implemented",
    onActivate: (state) => {
      const pieces = state.pieces.filter(p => p.side === "player" && p.type !== "king");
      if (pieces.length) {
        const piece = pieces[0];
        piece.y = state.boardH - 1;
        state.actionsLeft += 1;
      }
    },
  },
  {
    id: "blunder",
    name: "Blunder",
    description: "Force the enemy to make their worst possible move.",
    flavorText: "Everyone makes mistakes.",
    category: "tarot",
    rarity: "uncommon",
    cost: 5,
    tags: ["ai", "disruption", "enemy"],
    status: "designed",
    onActivate: (state) => {
      state.mods.flags.add("force_worst_move");
    },
  },
  {
    id: "kings_gambit",
    name: "King's Gambit",
    description: "Sacrifice a pawn to give your king +3 action range this turn.",
    flavorText: "The oldest trick in the book.",
    category: "tarot",
    rarity: "uncommon",
    cost: 4,
    tags: ["sacrifice", "king", "pawn", "movement"],
    status: "implemented",
    onActivate: (state) => {
      const pawn = state.pieces.find(p => p.side === "player" && p.type === "pawn");
      if (pawn) {
        state.pieces = state.pieces.filter(p => p.id !== pawn.id);
        state.mods.kingRange = Math.max(state.mods.kingRange, 3);
      }
    },
  },
  {
    id: "scouts_report",
    name: "Scout's Report",
    description: "Reveal all enemy pieces for 3 turns (in fog rounds).",
    flavorText: "Knowledge is power.",
    category: "tarot",
    rarity: "common",
    cost: 3,
    tags: ["information", "fog", "reveal"],
    status: "designed",
    onActivate: (state) => {
      state.mods.counters.set("scouts_reveal", 3);
    },
  },
  {
    id: "double_or_nothing",
    name: "Double or Nothing",
    description: "Double your current chips, but halve your mult.",
    flavorText: "Feeling lucky?",
    category: "tarot",
    rarity: "rare",
    cost: 5,
    tags: ["scoring", "gamble", "chips", "mult"],
    status: "implemented",
    onActivate: (state) => {
      state.totalChips *= 2;
      state.totalMult = Math.max(1, Math.floor(state.totalMult / 2));
    },
  },
  {
    id: "mirror_match",
    name: "Mirror Match",
    description: "Clone your strongest non-king piece.",
    flavorText: "Seeing double.",
    category: "tarot",
    rarity: "rare",
    cost: 7,
    tags: ["summon", "clone", "powerful"],
    status: "designed",
    onActivate: (state) => {
      const order: string[] = ["queen", "rook", "bishop", "knight", "pawn"];
      const playerPieces = state.pieces.filter(p => p.side === "player" && p.type !== "king");
      playerPieces.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
      if (playerPieces.length) {
        const best = playerPieces[0];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = best.x + dx, ny = best.y + dy;
            if (nx >= 0 && ny >= 0 && nx < state.boardW && ny < state.boardH &&
                !state.pieces.find(p => p.x === nx && p.y === ny)) {
              state.pieces.push({
                id: `player-${best.type}-clone-${Date.now()}`,
                side: "player", type: best.type, x: nx, y: ny,
              });
              return;
            }
          }
        }
      }
    },
  },
  {
    id: "consecration",
    name: "Consecration",
    description: "All enemy pieces adjacent to your bishops take damage (are captured).",
    flavorText: "Holy ground.",
    category: "tarot",
    rarity: "legendary",
    cost: 10,
    pieceType: "bishop",
    tags: ["capture", "bishop", "aoe", "legendary"],
    status: "designed",
    onActivate: (state) => {
      const bishops = state.pieces.filter(p => p.side === "player" && p.type === "bishop");
      const toRemove = new Set<string>();
      bishops.forEach(b => {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const enemy = state.pieces.find(p => p.side === "enemy" && p.x === b.x+dx && p.y === b.y+dy);
            if (enemy) toRemove.add(enemy.id);
          }
        }
      });
      state.pieces = state.pieces.filter(p => !toRemove.has(p.id));
      state.captureCount += toRemove.size;
    },
  },
  {
    id: "rally",
    name: "Rally",
    description: "All pawns advance one square forward.",
    flavorText: "Forward, march!",
    category: "tarot",
    rarity: "common",
    cost: 3,
    pieceType: "pawn",
    tags: ["movement", "pawn", "mass"],
    status: "implemented",
    onActivate: (state) => {
      state.pieces.filter(p => p.side === "player" && p.type === "pawn").forEach(p => {
        const ny = p.y - 1;
        if (ny >= 0 && !state.pieces.find(q => q.x === p.x && q.y === ny)) {
          p.y = ny;
        }
      });
    },
  },
  {
    id: "overcharge",
    name: "Overcharge",
    description: "Gain +3 actions this turn, but lose 1 action next turn.",
    flavorText: "Burn bright, burn fast.",
    category: "tarot",
    rarity: "uncommon",
    cost: 4,
    tags: ["action", "tempo", "tradeoff"],
    status: "implemented",
    onActivate: (state) => {
      state.actionsLeft += 3;
      state.mods.counters.set("overcharge_debt", 1);
    },
  },

  // ═══════════════════════════════════════════
  // PLANETS — Permanent piece-type-wide upgrades (6)
  // ═══════════════════════════════════════════
  {
    id: "planet_pawn",
    name: "Guerrilla",
    description: "Pawns can move backward 1 square.",
    flavorText: "Retreat is just another advance.",
    category: "planet",
    rarity: "uncommon",
    cost: 6,
    pieceType: "pawn",
    tags: ["movement", "pawn", "permanent"],
    status: "implemented",
    apply: (state) => { state.mods.pawnBackward = true; },
  },
  {
    id: "planet_knight",
    name: "Cavalry",
    description: "Knights also move in 3-1 L-shapes.",
    flavorText: "Extended reach of the horse.",
    category: "planet",
    rarity: "uncommon",
    cost: 6,
    pieceType: "knight",
    tags: ["movement", "knight", "permanent"],
    status: "implemented",
    apply: (state) => { state.mods.knightExtended = true; },
  },
  {
    id: "planet_bishop",
    name: "Inquisition",
    description: "Bishops ignore the first blocking piece in their path.",
    flavorText: "Nothing stands in the way of faith.",
    category: "planet",
    rarity: "rare",
    cost: 7,
    pieceType: "bishop",
    tags: ["movement", "bishop", "permanent"],
    status: "implemented",
    apply: (state) => { state.mods.bishopIgnoreBlock = true; },
  },
  {
    id: "planet_rook",
    name: "Artillery",
    description: "Rooks can capture 2 squares past their movement endpoint.",
    flavorText: "Long-range bombardment.",
    category: "planet",
    rarity: "rare",
    cost: 7,
    pieceType: "rook",
    tags: ["capture", "rook", "permanent"],
    status: "implemented",
    apply: (state) => { state.mods.rookArtillery = true; },
  },
  {
    id: "planet_queen",
    name: "Sovereignty",
    description: "Queen generates +1 gold per round.",
    flavorText: "The crown's treasury.",
    category: "planet",
    rarity: "uncommon",
    cost: 6,
    pieceType: "queen",
    tags: ["economy", "queen", "permanent"],
    status: "implemented",
    apply: (state) => { state.mods.queenGoldGen += 1; },
  },
  {
    id: "planet_king",
    name: "Tyrant",
    description: "King captures grant +3 actions.",
    flavorText: "The tyrant takes what he wants.",
    category: "planet",
    rarity: "rare",
    cost: 8,
    pieceType: "king",
    tags: ["action", "king", "permanent", "capture"],
    status: "implemented",
    apply: (state) => { state.mods.kingCaptureActions = 3; },
  },

  // ═══════════════════════════════════════════
  // VOUCHERS — Meta-progression rule modifiers (8)
  // ═══════════════════════════════════════════
  {
    id: "voucher_reserves",
    name: "Expanded Reserves",
    description: "+1 starting piece per round.",
    flavorText: "Reinforcements have arrived.",
    category: "voucher",
    rarity: "uncommon",
    cost: 6,
    tags: ["meta", "pieces", "spawning"],
    status: "implemented",
    apply: (state) => {
      state.mods.counters.set("extra_pieces", (state.mods.counters.get("extra_pieces") ?? 0) + 1);
    },
  },
  {
    id: "voucher_war_chest",
    name: "War Chest",
    description: "Earn interest on held gold (1g per 5g held, max 5).",
    flavorText: "Money makes money.",
    category: "voucher",
    rarity: "rare",
    cost: 8,
    tags: ["economy", "gold", "interest"],
    status: "implemented",
    apply: (state) => { state.mods.flags.add("war_chest"); },
  },
  {
    id: "voucher_conscription",
    name: "Conscription",
    description: "Start each round with 2 extra pawns.",
    flavorText: "Every citizen serves.",
    category: "voucher",
    rarity: "common",
    cost: 4,
    pieceType: "pawn",
    tags: ["meta", "pawn", "spawning"],
    status: "implemented",
    apply: (state) => {
      state.mods.counters.set("extra_pawns", (state.mods.counters.get("extra_pawns") ?? 0) + 2);
    },
  },
  {
    id: "voucher_intelligence",
    name: "Intelligence Network",
    description: "See 4 shop cards instead of 3.",
    flavorText: "Eyes and ears everywhere.",
    category: "voucher",
    rarity: "uncommon",
    cost: 5,
    tags: ["meta", "shop"],
    status: "implemented",
    apply: (state) => { state.shopCards = 4; },
  },
  {
    id: "voucher_diplomat",
    name: "Diplomat",
    description: "Reroll cost stays fixed at 3g.",
    flavorText: "Friends in high places.",
    category: "voucher",
    rarity: "uncommon",
    cost: 5,
    tags: ["meta", "shop", "reroll"],
    status: "implemented",
    apply: (state) => { state.mods.flags.add("diplomat"); },
  },
  {
    id: "voucher_armory",
    name: "Armory",
    description: "+1 consumable (tarot) slot.",
    flavorText: "A well-stocked arsenal.",
    category: "voucher",
    rarity: "uncommon",
    cost: 5,
    tags: ["meta", "tarot", "slots"],
    status: "implemented",
    apply: (state) => { state.maxTarots += 1; },
  },
  {
    id: "voucher_discount",
    name: "Clearance Sale",
    description: "All shop cards cost 1g less.",
    flavorText: "Everything must go!",
    category: "voucher",
    rarity: "common",
    cost: 4,
    tags: ["meta", "shop", "economy"],
    status: "implemented",
    apply: (state) => {
      state.mods.counters.set("shop_discount", (state.mods.counters.get("shop_discount") ?? 0) + 1);
    },
  },
  {
    id: "voucher_veterans",
    name: "Veterans",
    description: "Start each round with a knight and a bishop instead of 2 pawns.",
    flavorText: "Experienced soldiers make the difference.",
    category: "voucher",
    rarity: "rare",
    cost: 7,
    tags: ["meta", "spawning", "upgrade"],
    status: "designed",
    apply: (state) => { state.mods.flags.add("veterans"); },
  },

  // ═══════════════════════════════════════════
  // Additional cards to round out the roster
  // ═══════════════════════════════════════════
  {
    id: "zugzwang",
    name: "Zugzwang",
    description: "If you pass your turn (no captures), gain x0.5 mult.",
    flavorText: "Sometimes the best move is no move.",
    category: "joker",
    rarity: "uncommon",
    cost: 5,
    tags: ["scoring", "mult", "strategy"],
    status: "designed",
    apply: (state) => { state.mods.flags.add("zugzwang"); },
  },
  {
    id: "fianchetto",
    name: "Fianchetto",
    description: "Bishops on the long diagonal gain +15 chips per capture.",
    flavorText: "Control the diagonal highway.",
    category: "joker",
    rarity: "common",
    cost: 4,
    pieceType: "bishop",
    tags: ["scoring", "chips", "bishop", "positional"],
    status: "designed",
    apply: (state) => { state.mods.flags.add("fianchetto"); },
  },
  {
    id: "desperado",
    name: "Desperado",
    description: "When you have only 3 or fewer pieces, gain +2 actions per turn.",
    flavorText: "Nothing left to lose.",
    category: "joker",
    rarity: "rare",
    cost: 7,
    tags: ["action", "endgame", "conditional"],
    status: "designed",
    apply: (state) => { state.mods.flags.add("desperado"); },
  },
  {
    id: "poisoned_pawn",
    name: "Poisoned Pawn",
    description: "Enemy pieces that capture your pawns lose their next move.",
    flavorText: "A trap disguised as weakness.",
    category: "joker",
    rarity: "uncommon",
    cost: 5,
    pieceType: "pawn",
    tags: ["defense", "pawn", "trap"],
    status: "concept",
    apply: (state) => { state.mods.flags.add("poisoned_pawn"); },
  },
  {
    id: "windmill",
    name: "Windmill",
    description: "Discovered checks earn triple chips.",
    flavorText: "The eternal machine.",
    category: "joker",
    rarity: "rare",
    cost: 7,
    tags: ["scoring", "chips", "check", "tactic"],
    status: "concept",
    apply: (state) => { state.mods.flags.add("windmill"); },
  },
  {
    id: "holy_water",
    name: "Holy Water",
    description: "Heal one captured piece back onto the board.",
    flavorText: "Rise again.",
    category: "tarot",
    rarity: "rare",
    cost: 6,
    tags: ["summon", "recovery"],
    status: "concept",
    onActivate: (_state) => {
      // Would need a captured pieces list to implement
    },
  },
  {
    id: "earthquake",
    name: "Earthquake",
    description: "Randomly move all enemy pieces 1 square in a random direction.",
    flavorText: "The ground trembles.",
    category: "tarot",
    rarity: "uncommon",
    cost: 5,
    tags: ["disruption", "aoe", "random"],
    status: "concept",
    onActivate: (state) => {
      const dirs = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
      state.pieces.filter(p => p.side === "enemy" && p.type !== "king").forEach(p => {
        const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
        const nx = p.x + dx, ny = p.y + dy;
        if (nx >= 0 && ny >= 0 && nx < state.boardW && ny < state.boardH &&
            !state.pieces.find(q => q.x === nx && q.y === ny)) {
          p.x = nx; p.y = ny;
        }
      });
    },
  },
  {
    id: "checkmate_scholar",
    name: "Checkmate in One",
    description: "If the enemy king has only one legal move, capture it instantly.",
    flavorText: "Inevitable.",
    category: "tarot",
    rarity: "legendary",
    cost: 12,
    tags: ["capture", "king", "powerful", "legendary"],
    status: "concept",
    onActivate: (_state) => {
      // Complex implementation — needs enemy king move counting
    },
  },
];

export function getCardsByCategory(category: CardDefinition["category"]): CardDefinition[] {
  return ALL_CARDS.filter(c => c.category === category);
}

export function getCardsByStatus(status: CardDefinition["status"]): CardDefinition[] {
  return ALL_CARDS.filter(c => c.status === status);
}

export function getCardById(id: string): CardDefinition | undefined {
  return ALL_CARDS.find(c => c.id === id);
}

export function getShopPool(ownedIds: Set<string>): CardDefinition[] {
  return ALL_CARDS.filter(c =>
    c.status !== "cut" &&
    !ownedIds.has(c.id) &&
    (c.category === "joker" || c.category === "tarot" || c.category === "planet" || c.category === "voucher")
  );
}
