// ─── GhostPass Design System ──────────────────────────────────────────────────
//
// Palette: dark premium + neon purple + teal/cyan + gold
// Background  →  deep navy near-black
// Primary     →  neon purple   (actions, nav active)
// Teal/Cyan   →  secondary brand, Solana proof, success
// Gold        →  demo mode, badges, rewards
// Accent      →  emerald green  (unlockable, claimed, proof success)
// Danger      →  red  (true errors, too-far gate only)
// ─────────────────────────────────────────────────────────────────────────────

export const COLORS = {
  // Backgrounds
  bg:           '#05070F',   // deep near-black / navy
  bgSecondary:  '#0B1020',   // secondary background / tab bar

  // Surfaces
  card:         '#10131C',   // default card / input
  cardElevated: '#181B22',   // slightly lifted surface
  cardBorder:   '#2A2F3A',   // default border

  // Primary brand — purple
  primary:      '#A855F7',   // neon purple, primary buttons & active nav
  primaryDeep:  '#7C3AED',   // deeper purple for pressed/hover

  // Secondary brand — teal/cyan
  teal:         '#22D3EE',   // bright cyan (Confession type, secondary brand)
  tealDeep:     '#14B8A6',   // deeper teal (Community Note type)

  // Reward / demo
  gold:         '#FFB800',   // demo mode, badges, simulate-nearby
  goldDark:     '#120F00',   // dark gold-tinted surface for demo banners

  // Success / unlock / proof
  accent:       '#00E6A8',   // emerald green — unlockable, claimed, proof success

  // Danger — true errors only
  danger:       '#FF4D6D',

  // Text
  textPrimary:   '#FFFFFF',
  textSecondary: '#A7AAB4',
  textMuted:     '#6B7280',

  // Navigation
  tabBar:        '#0B1020',
  tabBarBorder:  '#2A2F3A',
};

// ─── GhostPass type palette ───────────────────────────────────────────────────
// Each type has a distinct hue that harmonizes with the overall dark premium palette.

export const TYPE_COLORS: Record<string, string> = {
  'Secret Invite':   '#A855F7',  // neon purple
  'Confession':      '#22D3EE',  // cyan / teal
  'Treasure Clue':   '#FFB800',  // gold
  'Art Drop':        '#F97316',  // warm orange
  'Community Note':  '#14B8A6',  // deep teal
  'Event Badge':     '#FACC15',  // bright yellow-gold
};

export const TYPE_EMOJI: Record<string, string> = {
  'Secret Invite':   '🔮',
  'Confession':      '👻',
  'Treasure Clue':   '🗝️',
  'Art Drop':        '🎨',
  'Community Note':  '📡',
  'Event Badge':     '🏅',
};
