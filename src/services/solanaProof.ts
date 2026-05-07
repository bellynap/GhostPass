/**
 * GhostPass Solana Devnet Proof Service
 *
 * Uses an ephemeral demo keypair to send Memo Program transactions on Solana devnet.
 * This is NOT the user's real wallet — it is a session-scoped demo keypair.
 *
 * What goes on-chain:  proof type, passId, GhostPass type, title, location hash,
 *                      expiry, max unlocks, content hash.
 * What stays off-chain: secret reveal text, exact GPS coordinates.
 *
 * GPS is a demo proximity gate — not anti-spoofing fraud prevention.
 * Content hash is MVP-level (not cryptographic SHA-256) — suitable for demo only.
 */

import {
  Connection,
  Keypair,
  Transaction,
  TransactionInstruction,
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { Buffer } from 'buffer';

// ─── Constants ───────────────────────────────────────────────────────────────

const DEVNET_RPC = 'https://api.devnet.solana.com';

/** Human-readable network label for display in UI. */
export const DEVNET_LABEL = 'Solana devnet';

/** Solana Memo Program — the canonical way to store arbitrary text on-chain. */
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

/** Minimum lamport balance before requesting airdrop. */
const MIN_BALANCE_LAMPORTS = 10_000;

/** Proof operation timeout in ms.
 *  Set to 9s for demo conditions — falls back to local proof quickly
 *  rather than leaving a 35s spinner mid-presentation. */
const PROOF_TIMEOUT_MS = 9_000;

// ─── Demo keypair (ephemeral, session-scoped) ─────────────────────────────────

let _demoKeypair: Keypair | null = null;

function getDemoKeypair(): Keypair {
  if (!_demoKeypair) {
    _demoKeypair = Keypair.generate();
  }
  return _demoKeypair;
}

/** Returns the demo keypair's base58 public key (for display only). */
export function getDemoKeypairPubkey(): string {
  return getDemoKeypair().publicKey.toBase58();
}

/**
 * Returns the demo keypair's devnet SOL balance in SOL, or null on error.
 * Used by the devnet status UI to show balance + faucet hint when low.
 */
export async function getProofKeypairBalance(): Promise<number | null> {
  try {
    const connection = new Connection(DEVNET_RPC, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: true,
    });
    const lamports = await connection.getBalance(getDemoKeypair().publicKey);
    return lamports / LAMPORTS_PER_SOL;
  } catch {
    return null;
  }
}

/**
 * Returns the devnet SOL balance of any base58 address in SOL, or null on error.
 * Used to show the connected wallet's balance on the Feed screen.
 */
export async function getDevnetBalance(address: string): Promise<number | null> {
  console.log('[getDevnetBalance] RPC:', DEVNET_RPC);
  console.log('[getDevnetBalance] Querying address:', address);
  try {
    const connection = new Connection(DEVNET_RPC, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: true,
    });
    const lamports = await connection.getBalance(new PublicKey(address));
    const sol = lamports / LAMPORTS_PER_SOL;
    console.log('[getDevnetBalance] Result:', sol, 'SOL (', lamports, 'lamports)');
    return sol;
  } catch (e: any) {
    console.warn('[getDevnetBalance] Error:', e?.message ?? String(e));
    return null;
  }
}

// ─── Proof result type ────────────────────────────────────────────────────────

export type ProofResult =
  | { kind: 'live-devnet-success'; sig: string }
  | { kind: 'local-demo-fallback'; localId: string; reason: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * MVP content hash — not cryptographic. Prevents secret text from
 * being readable on-chain while still providing a unique fingerprint.
 */
function contentHash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = (Math.imul(h, 33) ^ text.charCodeAt(i)) >>> 0;
  }
  return 'mvp_' + h.toString(16).padStart(8, '0');
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Proof timed out after ${ms / 1000}s`)), ms),
    ),
  ]);
}

/**
 * Try to top-up the demo keypair via airdrop.
 * Silently ignores 429 / rate-limit / network errors — the tx attempt will
 * still proceed and will be caught by the outer try in sendCreateProof /
 * sendUnlockProof if there is genuinely no balance.
 */
async function ensureBalance(connection: Connection, keypair: Keypair): Promise<void> {
  try {
    const balance = await connection.getBalance(keypair.publicKey);
    if (balance >= MIN_BALANCE_LAMPORTS) return;

    const airdropSig = await connection.requestAirdrop(
      keypair.publicKey,
      0.01 * LAMPORTS_PER_SOL,
    );
    const latest = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature: airdropSig,
      blockhash: latest.blockhash,
      lastValidBlockHeight: latest.lastValidBlockHeight,
    });
  } catch {
    // Airdrop failed (429, faucet dry, network) — proceed anyway.
    // If the keypair has any balance, the tx may still succeed.
    // If not, sendMemoTx will throw and be caught upstream.
  }
}

async function sendMemoTx(memoData: object): Promise<string> {
  // disableRetryOnRateLimit stops web3.js from retrying on 429 and
  // suppresses its built-in console.error("Retrying after Xms") messages.
  const connection = new Connection(DEVNET_RPC, {
    commitment: 'confirmed',
    disableRetryOnRateLimit: true,
  });
  const kp = getDemoKeypair();

  await ensureBalance(connection, kp);

  const ix = new TransactionInstruction({
    keys: [{ pubkey: kp.publicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(JSON.stringify(memoData), 'utf-8'),
  });

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: kp.publicKey }).add(ix);
  tx.sign(kp);

  const sig = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
  });
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });
  return sig;
}

// ─── Local proof ID helper ────────────────────────────────────────────────────

function makeLocalId(passId: string): string {
  return 'local_' + passId.slice(-8) + '_' + Date.now().toString(36);
}

function classifyError(e: any): string {
  const msg: string = e?.message ?? '';
  if (msg.includes('429') || msg.toLowerCase().includes('airdrop') || msg.toLowerCase().includes('rate')) {
    return 'Live devnet proof unavailable — faucet rate limited';
  }
  if (msg.includes('timeout')) {
    return 'Live devnet proof unavailable — network timeout';
  }
  return 'Live devnet proof unavailable — RPC error';
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface CreateProofParams {
  id: string;
  type: string;
  title: string;
  secretReveal: string;
  maxUnlocks: number;
  creatorWallet?: string;
}

/**
 * Attempts a GHOSTPASS_CREATE memo on Solana devnet (one try, no retries).
 * Returns a typed ProofResult — never throws.
 */
export async function sendCreateProof(pass: CreateProofParams): Promise<ProofResult> {
  try {
    const sig = await withTimeout(
      sendMemoTx({
        type: 'GHOSTPASS_CREATE',
        passId: pass.id,
        ghostPassType: pass.type,
        title: pass.title,
        creatorWallet: pass.creatorWallet ?? getDemoKeypairPubkey(),
        locationHash: 'demo_location_v1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        maxUnlocks: pass.maxUnlocks,
        contentHash: contentHash(pass.secretReveal),
      }),
      PROOF_TIMEOUT_MS,
    );
    return { kind: 'live-devnet-success', sig };
  } catch (e: any) {
    return {
      kind: 'local-demo-fallback',
      localId: makeLocalId(pass.id),
      reason: classifyError(e),
    };
  }
}

/**
 * Attempts a GHOSTPASS_UNLOCK memo on Solana devnet (one try, no retries).
 * Returns a typed ProofResult — never throws.
 */
export async function sendUnlockProof(passId: string, walletLabel: string): Promise<ProofResult> {
  try {
    const sig = await withTimeout(
      sendMemoTx({
        type: 'GHOSTPASS_UNLOCK',
        passId,
        wallet: walletLabel,
        timestamp: new Date().toISOString(),
      }),
      PROOF_TIMEOUT_MS,
    );
    return { kind: 'live-devnet-success', sig };
  } catch (e: any) {
    return {
      kind: 'local-demo-fallback',
      localId: makeLocalId(passId),
      reason: classifyError(e),
    };
  }
}

// ─── Real-wallet unsigned tx builders ────────────────────────────────────────

/**
 * Builds an unsigned GHOSTPASS_CREATE memo transaction.
 * feePayerAddress is the connected wallet's base58 public key.
 * Returns a base64-encoded serialized transaction suitable for
 * MWA wallet.signTransactions({ payloads: [base64] }).
 * Throws on RPC failure — caller should fall back to sendCreateProof().
 */
export async function buildCreateTx(
  pass: CreateProofParams,
  feePayerAddress: string,
): Promise<string> {
  const connection = new Connection(DEVNET_RPC, {
    commitment: 'confirmed',
    disableRetryOnRateLimit: true,
  });
  const feePayer = new PublicKey(feePayerAddress);
  const { blockhash } = await connection.getLatestBlockhash();

  const ix = new TransactionInstruction({
    keys: [{ pubkey: feePayer, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(
      JSON.stringify({
        type: 'GHOSTPASS_CREATE',
        passId: pass.id,
        ghostPassType: pass.type,
        title: pass.title,
        creatorWallet: pass.creatorWallet ?? feePayerAddress,
        locationHash: 'demo_location_v1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        maxUnlocks: pass.maxUnlocks,
        contentHash: contentHash(pass.secretReveal),
      }),
      'utf-8',
    ),
  });

  const tx = new Transaction({ recentBlockhash: blockhash, feePayer }).add(ix);
  return Buffer.from(
    tx.serialize({ requireAllSignatures: false, verifySignatures: false }),
  ).toString('base64');
}

/**
 * Builds an unsigned GHOSTPASS_UNLOCK memo transaction.
 * feePayerAddress is the connected wallet's base58 public key.
 * Returns a base64-encoded serialized transaction suitable for
 * MWA wallet.signTransactions({ payloads: [base64] }).
 * Throws on RPC failure — caller should fall back to sendUnlockProof().
 */
export async function buildUnlockTx(
  passId: string,
  walletLabel: string,
  feePayerAddress: string,
): Promise<string> {
  const connection = new Connection(DEVNET_RPC, {
    commitment: 'confirmed',
    disableRetryOnRateLimit: true,
  });
  const feePayer = new PublicKey(feePayerAddress);
  const { blockhash } = await connection.getLatestBlockhash();

  const ix = new TransactionInstruction({
    keys: [{ pubkey: feePayer, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(
      JSON.stringify({
        type: 'GHOSTPASS_UNLOCK',
        passId,
        wallet: walletLabel,
        timestamp: new Date().toISOString(),
      }),
      'utf-8',
    ),
  });

  const tx = new Transaction({ recentBlockhash: blockhash, feePayer }).add(ix);
  return Buffer.from(
    tx.serialize({ requireAllSignatures: false, verifySignatures: false }),
  ).toString('base64');
}

/**
 * Submits a signed raw transaction (base64 string from MWA signTransactions) to devnet,
 * confirms it, and returns a ProofResult. Never throws.
 */
export async function sendRawSignedTx(signedTxBase64: string): Promise<ProofResult> {
  try {
    const sig = await withTimeout(
      (async () => {
        const connection = new Connection(DEVNET_RPC, {
          commitment: 'confirmed',
          disableRetryOnRateLimit: true,
        });
        const signedTxBytes = Buffer.from(signedTxBase64, 'base64');
        const txSig = await connection.sendRawTransaction(signedTxBytes, {
          skipPreflight: false,
        });
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        await connection.confirmTransaction({ signature: txSig, blockhash, lastValidBlockHeight });
        return txSig;
      })(),
      PROOF_TIMEOUT_MS,
    );
    return { kind: 'live-devnet-success', sig };
  } catch (e: any) {
    return {
      kind: 'local-demo-fallback',
      localId: 'wallet_' + Date.now().toString(36),
      reason: classifyError(e),
    };
  }
}

/** Shorten a base58 signature for display. */
export function shortenSig(sig: string): string {
  return `${sig.slice(0, 8)}…${sig.slice(-8)}`;
}

/** Solana devnet explorer URL for a transaction. */
export function devnetExplorerUrl(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}
