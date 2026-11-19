// SnapLoop Chess.com-inspired Social Puzzles Journey & Streaks Engine

export type ChessPieceColor = "w" | "b";
export type ChessPieceType = "p" | "n" | "b" | "r" | "q" | "k";

export type SquareName =
  | "a1" | "b1" | "c1" | "d1" | "e1" | "f1" | "g1" | "h1"
  | "a2" | "b2" | "c2" | "d2" | "e2" | "f2" | "g2" | "h2"
  | "a3" | "b3" | "c3" | "d3" | "e3" | "f3" | "g3" | "h3"
  | "a4" | "b4" | "c4" | "d4" | "e4" | "f4" | "g4" | "h4"
  | "a5" | "b5" | "c5" | "d5" | "e5" | "f5" | "g5" | "h5"
  | "a6" | "b6" | "c6" | "d6" | "e6" | "f6" | "g6" | "h6"
  | "a7" | "b7" | "c7" | "d7" | "e7" | "f7" | "g7" | "h7"
  | "a8" | "b8" | "c8" | "d8" | "e8" | "f8" | "g8" | "h8";

export type MoveStep = {
  from: SquareName;
  to: SquareName;
  promotion?: ChessPieceType;
};

export type Puzzle = {
  id: string;
  level: number;
  title: string;
  subtitle: string;
  theme: string;
  rating: number;
  playerColor: ChessPieceColor;
  description: string;
  hint: string;
  explanation: string;
  initialBoard: Partial<Record<SquareName, string>>;
  solutionSteps: MoveStep[];
};

export type FriendLeaderboardEntry = {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  streak: number;
  level: number; // Current level tile on the puzzle road map
  rating: number;
  solvedToday: boolean;
  themeBadge: string;
  isCurrentUser?: boolean;
};

// Curated interactive chess tactical puzzles mapped to journey levels
export const PUZZLES_COLLECTION: Puzzle[] = [
  {
    id: "puzzle-1",
    level: 1,
    title: "Back-Rank Breakthrough",
    subtitle: "Rook Infiltration",
    theme: "Back-Rank Mate",
    rating: 800,
    playerColor: "w",
    description: "White to play. Black forgot to create an escape square ('luft') for their king!",
    hint: "Attack the 8th rank with your rook!",
    explanation: "Re8+ forces Rxe8, followed by Rxe8# delivering a decisive back-rank checkmate!",
    initialBoard: {
      g8: "bK",
      f7: "bP",
      g7: "bP",
      h7: "bP",
      d8: "bR",
      e1: "wR",
      a1: "wR",
      g1: "wK",
      f2: "wP",
      g2: "wP",
      h2: "wP",
    },
    solutionSteps: [
      { from: "e1", to: "e8" },
      { from: "d8", to: "e8" },
      { from: "a1", to: "e8" },
    ],
  },
  {
    id: "puzzle-2",
    level: 2,
    title: "The Royal Fork",
    subtitle: "Knight Double Attack",
    theme: "Tactical Fork",
    rating: 950,
    playerColor: "w",
    description: "White to play. Black's King and Queen are lined up on vulnerable light squares.",
    hint: "Your Knight can attack both royalty pieces at once!",
    explanation: "Nc7+ forks both the Black King on e8 and Queen on a8! Winning the Queen next turn.",
    initialBoard: {
      e8: "bK",
      a8: "bQ",
      c8: "bB",
      e7: "bP",
      d5: "wN",
      e1: "wK",
      h1: "wR",
      f2: "wP",
      g2: "wP",
    },
    solutionSteps: [
      { from: "d5", to: "c7" },
      { from: "e8", to: "d8" },
      { from: "c7", to: "a8" },
    ],
  },
  {
    id: "puzzle-3",
    level: 3,
    title: "Smothered Checkmate",
    subtitle: "Philidor's Classic Sacrifice",
    theme: "Checkmate in 2",
    rating: 1100,
    playerColor: "w",
    description: "White to move. Black's king is boxed into the corner. Find the brilliant sacrifice!",
    hint: "Sacrifice your most valuable piece to seal the black king's fate!",
    explanation: "Qg8+ forces Rxg8! With the king surrounded, Nf7# delivers the iconic smothered checkmate!",
    initialBoard: {
      g8: "bK",
      f8: "bR",
      h7: "bP",
      g7: "bP",
      f7: "bP",
      f6: "wN",
      c4: "wB",
      d5: "wQ",
      a1: "wR",
      h1: "wK",
    },
    solutionSteps: [
      { from: "d5", to: "g8" },
      { from: "f8", to: "g8" },
      { from: "f6", to: "f7" },
    ],
  },
  {
    id: "puzzle-4",
    level: 4,
    title: "Anastasia's Mate",
    subtitle: "Knight & Rook Coordination",
    theme: "Checkmate Attack",
    rating: 1250,
    playerColor: "w",
    description: "White to move. The Knight controls the escape squares e7 and g7. Break open the h-file!",
    hint: "A Queen sacrifice opens the doorway for the Rook to strike!",
    explanation: "Qxh7+! forces Kxh7, and Rh1# finishes off the Black King along the open h-file!",
    initialBoard: {
      g8: "bK",
      h7: "bP",
      g7: "bP",
      e7: "wN",
      h3: "wQ",
      a1: "wR",
      g1: "wK",
      f2: "wP",
      g2: "wP",
    },
    solutionSteps: [
      { from: "h3", to: "h7" },
      { from: "g8", to: "h7" },
      { from: "a1", to: "h1" },
    ],
  },
  {
    id: "puzzle-5",
    level: 5,
    title: "Opera House Pin",
    subtitle: "Morphy's Masterpiece",
    theme: "Pin & Deflection",
    rating: 1300,
    playerColor: "w",
    description: "White to play. The black knight on d7 is pinned to the king. Deliver the final blow!",
    hint: "Use your rook on the open d-file with maximum impact!",
    explanation: "Rd8+! deflects the black defender and leads straight into checkmate by bishop and rook!",
    initialBoard: {
      e8: "bK",
      d7: "bN",
      f8: "bB",
      g4: "wB",
      d1: "wR",
      e1: "wK",
      c1: "wB",
      a1: "wR",
    },
    solutionSteps: [
      { from: "d1", to: "d8" },
      { from: "e8", to: "e7" },
      { from: "g4", to: "e6" },
    ],
  },
  {
    id: "puzzle-6",
    level: 6,
    title: "Queen & Bishop Battery",
    subtitle: "Diagonal Precision",
    theme: "Mating Net",
    rating: 1400,
    playerColor: "w",
    description: "White to play. The black king's kingside pawn cover has been loosened.",
    hint: "Direct your queen towards h7 protected by the light-squared bishop!",
    explanation: "Qh7# delivers checkmate with the bishop on c2 protecting the queen!",
    initialBoard: {
      g8: "bK",
      f7: "bP",
      h7: "bP",
      c2: "wB",
      e4: "wQ",
      g1: "wK",
      a1: "wR",
    },
    solutionSteps: [
      { from: "e4", to: "h7" },
    ],
  },
  {
    id: "puzzle-7",
    level: 7,
    title: "The Greek Gift Sacrifice",
    subtitle: "Kingside Castle Breach",
    theme: "Attacking Sacrifice",
    rating: 1450,
    playerColor: "w",
    description: "White to play. Shatter Black's pawn shield with a classic bishop sacrifice on h7!",
    hint: "Take the h7 pawn with check to expose the king!",
    explanation: "Bxh7+ Kxh7, Qh5+ Kg8, Ng5 with an unstoppable mating attack on h7!",
    initialBoard: {
      g8: "bK",
      h7: "bP",
      g7: "bP",
      d3: "wB",
      f3: "wN",
      d1: "wQ",
      g1: "wK",
    },
    solutionSteps: [
      { from: "d3", to: "h7" },
      { from: "g8", to: "h7" },
      { from: "d1", to: "h5" },
    ],
  },
];

// Friends on the Puzzle Journey trail (Loaded dynamically from database)
export const SAMPLE_FRIENDS_LEADERBOARD: FriendLeaderboardEntry[] = [];

// Sound generator with Web Audio API for satisfying tactile game feel
export function playChessSound(type: "move" | "capture" | "check" | "solve" | "wrong" | "cheer") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === "move") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "capture") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "check") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(560, now);
      osc.frequency.setValueAtTime(740, now + 0.07);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "solve") {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = freq;
        o.connect(g);
        g.connect(ctx.destination);
        const start = now + idx * 0.08;
        g.gain.setValueAtTime(0.2, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        o.start(start);
        o.stop(start + 0.3);
      });
    } else if (type === "wrong") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.22);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === "cheer") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch {
    // Fail gracefully
  }
}

export function getDailyPuzzle(levelOverride?: number): Puzzle {
  if (levelOverride) {
    const found = PUZZLES_COLLECTION.find((p) => p.level === levelOverride);
    if (found) return found;
  }
  return PUZZLES_COLLECTION[0];
}
