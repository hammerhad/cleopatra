export const Colors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────────
  OBSIDIAN: '#0A0908',       // deepest background
  ONYX: '#111111',           // screen background
  ANTHRACITE: '#181614',     // card background
  CHARCOAL: '#201E1B',       // elevated card
  ASH: '#2A2724',            // input background
  STONE: '#3A3632',          // subtle separator / subtle bg

  // ── Gold Palette ─────────────────────────────────────────────────────────────
  GOLD_DEEP: '#8B6914',      // deep shadow gold
  GOLD: '#C9A84C',           // primary brand gold
  GOLD_LIGHT: '#E0C46D',     // highlights
  GOLD_SHIMMER: '#F5DFA0',   // shimmer / bright accent
  GOLD_MUTED: '#7A6030',     // disabled / muted state

  // ── Text ─────────────────────────────────────────────────────────────────────
  IVORY: '#F5F0E8',          // primary text
  PARCHMENT: '#D4C5A9',      // secondary text
  DUST: '#8B7D6B',           // placeholder / muted
  SHADOW: '#4A4035',         // very muted text

  // ── Semantic ──────────────────────────────────────────────────────────────────
  SUCCESS: '#2E7D52',        // emerald green
  SUCCESS_BG: '#0E2A1A',
  ERROR: '#9B2335',          // deep crimson
  ERROR_BG: '#2A0A10',
  WARNING: '#B07820',        // amber
  WARNING_BG: '#2A1E08',
  INFO: '#1A5C8A',           // sapphire
  INFO_BG: '#0A1E2A',

  // ── Moon Cycle Phase Colors ───────────────────────────────────────────────────
  MENSTRUAL: '#7A1A2E',      // deep crimson / blood moon
  FOLLICULAR: '#1A4A3A',     // forest emerald
  OVULATION: '#B07820',      // bright amber / peak energy
  LUTEAL: '#3A2A6A',         // deep violet / inner wisdom

  // ── Accents ───────────────────────────────────────────────────────────────────
  SCARLET: '#C0392B',        // power accent
  SAPPHIRE: '#1A4A7A',       // cool accent
  AMETHYST: '#6A3A8A',       // mystical accent
  EMERALD: '#1A7A4A',        // nature accent

  // ── UI Specifics ──────────────────────────────────────────────────────────────
  DIVIDER: '#2A2520',
  OVERLAY: 'rgba(10,9,8,0.85)',
  MODAL_BG: 'rgba(10,9,8,0.92)',
  SKELETON_BASE: '#1E1C19',
  SKELETON_HIGHLIGHT: '#2A2724',

  // ── Tab Bar ───────────────────────────────────────────────────────────────────
  TAB_ACTIVE: '#C9A84C',
  TAB_INACTIVE: '#4A4035',
  TAB_BG: '#0F0E0C',
} as const;

export type Color = (typeof Colors)[keyof typeof Colors];

// Gradient presets
export const Gradients = {
  GOLD_SHINE: ['#8B6914', '#C9A84C', '#E0C46D', '#C9A84C'],
  GOLD_SUBTLE: ['#1A1510', '#201A10'],
  DARK_CARD: ['#181614', '#201E1B'],
  MENSTRUAL: ['#3A0A15', '#7A1A2E'],
  FOLLICULAR: ['#0A1E18', '#1A4A3A'],
  OVULATION: ['#2A1A00', '#B07820'],
  LUTEAL: ['#150A2A', '#3A2A6A'],
  PREMIUM: ['#0A0908', '#1A140A', '#0A0908'],
} as const;
