export type GhostPassType =
  | 'Secret Invite'
  | 'Confession'
  | 'Treasure Clue'
  | 'Art Drop'
  | 'Community Note'
  | 'Event Badge';

export type GhostPass = {
  id: string;
  type: GhostPassType;
  title: string;
  clue: string;
  secretReveal: string;
  creatorWallet: string;
  latitude?: number;
  longitude?: number;
  distanceMeters: number;   // static fallback when GPS unavailable
  radiusMeters: number;
  expiresIn: string;
  maxUnlocks: number;
  unlockCount: number;
  createTxSignature?: string;
  areas?: {
    state?: string;
    city?: string;
    town?: string;
    neighborhood?: string;
  };
};

export type ProofBadge = {
  id: string;
  passId: string;
  passType: GhostPassType;
  title: string;
  unlockedAt: string;
  wallet: string;
  /** Set when live devnet proof succeeded. */
  unlockTxSignature?: string;
  /** Set when live proof failed — local demo fallback ID. */
  localProofId?: string;
};
