export type CoverTheme = "cream" | "lime" | "sage" | "peach" | "sky" | "lavender";
export type VibeId = "soft" | "sunny" | "cozy" | "fresh" | "dreamy" | "bold";
export type FeedMode = "balanced" | "fresh" | "following" | "inspired";
export type ComfortThemeId = "matcha" | "strawberry" | "lavender" | "honey" | "sage" | "midnight";
export type CozyPatternId = "clean" | "dots" | "grid" | "sparkles" | "paper";

export type ComfortPin = {
  id: string;
  title: string;
  emoji?: string;
  image?: string;
  note?: string;
  color?: string;
};

export type PuzzleStats = {
  streak: number;
  bestStreak: number;
  rating: number;
  totalSolved: number;
  lastSolvedDate?: string;
  solvedToday?: boolean;
};

export type StylePrefs = {
  vibe: VibeId;
  cover: CoverTheme;
  themePreset: ComfortThemeId;
  cozyPattern: CozyPatternId;
  interests: string[];
  feedMode: FeedMode;
  moodEmoji: string;
  showMood: boolean;
  comfortQuote: string;
  comfortStatus: string;
  comfortPins: ComfortPin[];
  stickers: string[];
  puzzleStats: PuzzleStats;
};

export const DEFAULT_PUZZLE_STATS: PuzzleStats = {
  streak: 0,
  bestStreak: 0,
  rating: 1200,
  totalSolved: 0,
  lastSolvedDate: "",
  solvedToday: false,
};

export const DEFAULT_COMFORT_PINS: ComfortPin[] = [];

export const DEFAULT_STYLE_PREFS: StylePrefs = {
  vibe: "soft",
  cover: "cream",
  themePreset: "matcha",
  cozyPattern: "dots",
  interests: [],
  feedMode: "balanced",
  moodEmoji: "🌿",
  showMood: true,
  comfortQuote: "",
  comfortStatus: "",
  comfortPins: [],
  stickers: [],
  puzzleStats: DEFAULT_PUZZLE_STATS,
};

export const COMFORT_THEMES: {
  id: ComfortThemeId;
  label: string;
  blurb: string;
  emoji: string;
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  gradient: string;
}[] = [
  {
    id: "matcha",
    label: "Matcha Latte",
    blurb: "Calm sage & creamy pistachio",
    emoji: "🍵",
    primary: "#5F8520",
    secondary: "#A8D63A",
    accent: "#769A28",
    surface: "#F6F7F0",
    gradient: "linear-gradient(135deg, #EBF5D5, #DCEDB8)",
  },
  {
    id: "strawberry",
    label: "Strawberry Milk",
    blurb: "Soft peach & sweet pastel blush",
    emoji: "🍓",
    primary: "#D85B7A",
    secondary: "#FFAEC0",
    accent: "#E26D8A",
    surface: "#FFF5F7",
    gradient: "linear-gradient(135deg, #FFE4EC, #FFD0DD)",
  },
  {
    id: "lavender",
    label: "Lavender Mist",
    blurb: "Dreamy lilac & twilight clouds",
    emoji: "💜",
    primary: "#7B62B3",
    secondary: "#D4C2FC",
    accent: "#8F74CA",
    surface: "#F7F5FC",
    gradient: "linear-gradient(135deg, #EFE8FA, #DDD0F5)",
  },
  {
    id: "honey",
    label: "Golden Honey",
    blurb: "Warm sunlight & soft amber",
    emoji: "🍯",
    primary: "#B87A1E",
    secondary: "#FCD88C",
    accent: "#D69328",
    surface: "#FFFBF2",
    gradient: "linear-gradient(135deg, #FFF0D4, #FDE3B2)",
  },
  {
    id: "sage",
    label: "Cottage Sage",
    blurb: "Earthy linen & wild eucalyptus",
    emoji: "🍃",
    primary: "#4E7348",
    secondary: "#A3C99C",
    accent: "#5C8556",
    surface: "#F4F7F3",
    gradient: "linear-gradient(135deg, #E2ECE0, #CFDFC9)",
  },
  {
    id: "midnight",
    label: "Velvet Stars",
    blurb: "Deep cozy indigo with glowing stars",
    emoji: "✨",
    primary: "#4F46E5",
    secondary: "#A5B4FC",
    accent: "#6366F1",
    surface: "#F5F5FC",
    gradient: "linear-gradient(135deg, #E8EAFF, #D7DBFF)",
  },
];

export const COZY_PATTERNS: {
  id: CozyPatternId;
  label: string;
  emoji: string;
  cssPattern: string;
}[] = [
  {
    id: "clean",
    label: "Minimal Smooth",
    emoji: "☁️",
    cssPattern: "none",
  },
  {
    id: "dots",
    label: "Bullet Journal",
    emoji: "📖",
    cssPattern: "radial-gradient(rgba(100, 115, 75, 0.12) 1.5px, transparent 1.5px)",
  },
  {
    id: "grid",
    label: "Aesthetic Grid",
    emoji: "📐",
    cssPattern: "linear-gradient(to right, rgba(100, 115, 75, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(100, 115, 75, 0.08) 1px, transparent 1px)",
  },
  {
    id: "sparkles",
    label: "Fairy Sparkles",
    emoji: "✨",
    cssPattern: "radial-gradient(rgba(180, 150, 40, 0.14) 1px, transparent 1px)",
  },
  {
    id: "paper",
    label: "Warm Kraft Paper",
    emoji: "📜",
    cssPattern: "radial-gradient(rgba(140, 110, 80, 0.09) 1.2px, transparent 1.2px)",
  },
];

export const INTEREST_OPTIONS = [
  { id: "nature", label: "Nature", emoji: "🍃" },
  { id: "food", label: "Foodie", emoji: "🍓" },
  { id: "art", label: "Art", emoji: "🎨" },
  { id: "fashion", label: "Style", emoji: "✨" },
  { id: "travel", label: "Travel", emoji: "🗺️" },
  { id: "diy", label: "DIY", emoji: "🧵" },
  { id: "pets", label: "Pets", emoji: "🐾" },
  { id: "cozy", label: "Cozy", emoji: "🕯️" },
  { id: "music", label: "Music", emoji: "🎧" },
  { id: "fitness", label: "Move", emoji: "🏃" },
  { id: "quotes", label: "Quotes", emoji: "💬" },
  { id: "tech", label: "Tech", emoji: "💻" },
] as const;

export const VIBE_OPTIONS: {
  id: VibeId;
  label: string;
  blurb: string;
  emoji: string;
  tint: string;
}[] = [
  { id: "soft", label: "Soft", blurb: "Gentle & calm", emoji: "☁️", tint: "#EEF1E4" },
  { id: "sunny", label: "Sunny", blurb: "Bright energy", emoji: "☀️", tint: "#F7F1C8" },
  { id: "cozy", label: "Cozy", blurb: "Warm & snug", emoji: "🫖", tint: "#F3E6D4" },
  { id: "fresh", label: "Fresh", blurb: "Crisp & green", emoji: "🌱", tint: "#E3F0D4" },
  { id: "dreamy", label: "Dreamy", blurb: "Soft daydream", emoji: "💫", tint: "#E8EAF6" },
  { id: "bold", label: "Bold", blurb: "Loud & proud", emoji: "🍋", tint: "#E8F6A8" },
];

export const COVER_OPTIONS: {
  id: CoverTheme;
  label: string;
  gradient: string;
}[] = [
  { id: "cream", label: "Cream", gradient: "linear-gradient(135deg, #F6F3EB, #E8EBD8)" },
  { id: "lime", label: "Lime", gradient: "linear-gradient(135deg, #D8F08A, #A8D63A)" },
  { id: "sage", label: "Sage", gradient: "linear-gradient(135deg, #C9D9A8, #6B9A23)" },
  { id: "peach", label: "Peach", gradient: "linear-gradient(135deg, #FFE2C8, #F5B989)" },
  { id: "sky", label: "Sky", gradient: "linear-gradient(135deg, #D7ECFF, #9BC7F0)" },
  { id: "lavender", label: "Bloom", gradient: "linear-gradient(135deg, #E8DFF5, #C9B6E4)" },
];

export const FEED_MODE_OPTIONS: {
  id: FeedMode;
  label: string;
  blurb: string;
  emoji: string;
}[] = [
  { id: "balanced", label: "Balanced", blurb: "A little of everything you love", emoji: "⚖️" },
  { id: "fresh", label: "Fresh finds", blurb: "New posts from around SnapLoop", emoji: "🆕" },
  { id: "following", label: "Friends first", blurb: "Mostly people you follow", emoji: "💛" },
  { id: "inspired", label: "Inspired", blurb: "Lean into your interest chips", emoji: "🎯" },
];

export const MOOD_EMOJIS = ["🌿", "😊", "🦥", "✨", "🍵", "🌸", "🍋", "🦋", "🌙", "🎧", "🧸", "🕯️"];

export const STICKER_CATALOG = [
  "🍵 Cafe Enthusiast",
  "🧩 Puzzle Solver",
  "✨ Cozy Soul",
  "🌿 Plant Parent",
  "🎧 Lofi Listener",
  "📚 Bookworm",
  "🎨 Doodler",
  "🐾 Pet Lover",
  "🥐 Bakery Hopper",
  "🕯️ Snug Life",
  "♟️ Chess Tactician",
  "🌙 Night Owl",
];

export function normalizeStylePrefs(raw: unknown): StylePrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_STYLE_PREFS };
  const r = raw as Partial<StylePrefs>;
  const interests = Array.isArray(r.interests)
    ? r.interests.filter((x): x is string => typeof x === "string").slice(0, 8)
    : DEFAULT_STYLE_PREFS.interests;

  const themePreset = COMFORT_THEMES.some((t) => t.id === r.themePreset)
    ? (r.themePreset as ComfortThemeId)
    : DEFAULT_STYLE_PREFS.themePreset;

  const cozyPattern = COZY_PATTERNS.some((p) => p.id === r.cozyPattern)
    ? (r.cozyPattern as CozyPatternId)
    : DEFAULT_STYLE_PREFS.cozyPattern;

  const comfortPins = Array.isArray(r.comfortPins) && r.comfortPins.length
    ? r.comfortPins.slice(0, 6).map((pin, idx) => ({
        id: pin.id || `pin-${idx}`,
        title: typeof pin.title === "string" ? pin.title : "Cozy moment",
        emoji: typeof pin.emoji === "string" ? pin.emoji : "✨",
        note: typeof pin.note === "string" ? pin.note : "",
        color: typeof pin.color === "string" ? pin.color : "#F4F7F3",
        image: typeof pin.image === "string" ? pin.image : undefined,
      }))
    : DEFAULT_COMFORT_PINS;

  const stickers = Array.isArray(r.stickers)
    ? r.stickers.filter((s): s is string => typeof s === "string").slice(0, 6)
    : DEFAULT_STYLE_PREFS.stickers;

  const puzzleRaw = (r.puzzleStats && typeof r.puzzleStats === "object" ? r.puzzleStats : {}) as Partial<PuzzleStats>;
  const puzzleStats: PuzzleStats = {
    streak: typeof puzzleRaw.streak === "number" ? puzzleRaw.streak : DEFAULT_PUZZLE_STATS.streak,
    bestStreak: typeof puzzleRaw.bestStreak === "number" ? puzzleRaw.bestStreak : DEFAULT_PUZZLE_STATS.bestStreak,
    rating: typeof puzzleRaw.rating === "number" ? puzzleRaw.rating : DEFAULT_PUZZLE_STATS.rating,
    totalSolved: typeof puzzleRaw.totalSolved === "number" ? puzzleRaw.totalSolved : DEFAULT_PUZZLE_STATS.totalSolved,
    lastSolvedDate: typeof puzzleRaw.lastSolvedDate === "string" ? puzzleRaw.lastSolvedDate : "",
    solvedToday: typeof puzzleRaw.solvedToday === "boolean" ? puzzleRaw.solvedToday : false,
  };

  return {
    vibe: VIBE_OPTIONS.some((v) => v.id === r.vibe) ? (r.vibe as VibeId) : DEFAULT_STYLE_PREFS.vibe,
    cover: COVER_OPTIONS.some((c) => c.id === r.cover)
      ? (r.cover as CoverTheme)
      : DEFAULT_STYLE_PREFS.cover,
    themePreset,
    cozyPattern,
    interests,
    feedMode: FEED_MODE_OPTIONS.some((f) => f.id === r.feedMode)
      ? (r.feedMode as FeedMode)
      : DEFAULT_STYLE_PREFS.feedMode,
    moodEmoji: typeof r.moodEmoji === "string" ? r.moodEmoji : DEFAULT_STYLE_PREFS.moodEmoji,
    showMood: typeof r.showMood === "boolean" ? r.showMood : DEFAULT_STYLE_PREFS.showMood,
    comfortQuote: typeof r.comfortQuote === "string" ? r.comfortQuote : DEFAULT_STYLE_PREFS.comfortQuote,
    comfortStatus: typeof r.comfortStatus === "string" ? r.comfortStatus : DEFAULT_STYLE_PREFS.comfortStatus,
    comfortPins,
    stickers,
    puzzleStats,
  };
}

export function coverGradient(cover: CoverTheme) {
  return COVER_OPTIONS.find((c) => c.id === cover)?.gradient ?? COVER_OPTIONS[0].gradient;
}

export function vibeTint(vibe: VibeId) {
  return VIBE_OPTIONS.find((v) => v.id === vibe)?.tint ?? VIBE_OPTIONS[0].tint;
}

export function comfortThemeObj(theme: ComfortThemeId) {
  return COMFORT_THEMES.find((t) => t.id === theme) ?? COMFORT_THEMES[0];
}

export function cozyPatternObj(pattern: CozyPatternId) {
  return COZY_PATTERNS.find((p) => p.id === pattern) ?? COZY_PATTERNS[0];
}

export function interestLabel(id: string) {
  return INTEREST_OPTIONS.find((i) => i.id === id);
}
