export const TIER_THRESHOLDS = {
  LEADING: 75,
  COMPETITIVE: 50,
  NEEDS_WORK: 25,
} as const;

export const TIER_COLORS = {
  LEADING: '#4ade80',
  COMPETITIVE: '#60a5fa',
  NEEDS_WORK: '#f59e0b',
  CRITICAL: '#f87171',
} as const;

export const PROFILE_NAMES = {
  LEADER: 'The Leader',
  CONTENDER: 'The Contender',
  LEAKY_BUCKET: 'The Leaky Bucket',
  HIDDEN_GEM: 'The Hidden Gem',
  INVISIBLE_CLOSER: 'The Invisible Closer',
} as const;

export const P1_WEIGHTS = {
  gbp: 0.2,
  mappack: 0.6,
  onpage: 0.1,
  trust: 0.1,
} as const;

export const P2_WEIGHTS = {
  performance: 0.35,
  conversion: 0.4,
  ux: 0.25,
} as const;

export const P2_WEIGHTS_PSI_FAILED = {
  conversion: 0.615,
  ux: 0.385,
} as const;

export const CATEGORY_DISPLAY_WEIGHTS = {
  gbp_strength: '20%',
  mappack: '60%',
  onpage: '10%',
  trust: '10%',
  performance: '35%',
  conversion: '40%',
  ux: '25%',
} as const;
