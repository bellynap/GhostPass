import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bs58 from 'bs58';
import { sendRawSignedTx, ProofResult } from '../services/solanaProof';

const DEMO_PUBKEY = 'GhostDemoWa11et1111111111111111111111111111';
const APP_IDENTITY = {
  name: 'GhostPass',
  uri: 'https://ghostpass.app',
  icon: 'favicon.ico',
};

/** AsyncStorage key for persisted MWA session. */
const SESSION_KEY = '@ghostpass/mwa_session';

function base64ToSolanaAddress(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bs58.encode(bytes);
}

export function shortenAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/** Result of signAndSendMemoTx. If ok: false, caller falls back to demo proof. */
export type MwaSignResult =
  | { ok: true; result: ProofResult }
  | { ok: false; reason: string };

interface WalletState {
  connected: boolean;
  publicKey: string | null;
  isDemoMode: boolean;
  connecting: boolean;
  mwaError: string | null;
  /**
   * True if the wallet returned a different public key than the previously stored one.
   * Indicates fakewallet data was cleared (emulator reset, reinstall, etc.).
   * Callers can use this to warn that any previously funded address is inaccessible.
   */
  addressChanged: boolean;
}

interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  connectDemo: () => void;
  disconnect: () => void;
  signAndSendMemoTx: (txBase64: string) => Promise<MwaSignResult>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    connected: false,
    publicKey: null,
    isDemoMode: false,
    connecting: false,
    mwaError: null,
    addressChanged: false,
  });

  // Auth token stored in a ref — not UI state, no re-render needed on change.
  const authTokenRef = useRef<string | null>(null);
  // Last known persisted public key — used to detect fakewallet keypair resets.
  const storedPublicKeyRef = useRef<string | null>(null);

  // ── Silent session restore on mount ─────────────────────────────────────────
  // Reads the persisted { authToken, publicKey } from AsyncStorage.
  // Attempts wallet.reauthorize() — no user interaction required if the token is valid.
  // On success: restores connected state, skips the Landing screen.
  // On failure (expired token, fakewallet reset, wallet not installed): clears stale
  // storage and leaves the user on the Landing screen to connect manually.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (!raw) return;

        let parsed: { authToken: string; publicKey: string };
        try {
          parsed = JSON.parse(raw);
        } catch {
          await AsyncStorage.removeItem(SESSION_KEY);
          return;
        }

        const { authToken: storedToken, publicKey: storedKey } = parsed;
        if (!storedToken || !storedKey) return;

        storedPublicKeyRef.current = storedKey;
        setState(s => ({ ...s, connecting: true }));

        await transact(async wallet => {
          const result = await wallet.reauthorize({ auth_token: storedToken, identity: APP_IDENTITY });
          const address = base64ToSolanaAddress(result.accounts[0].address);
          authTokenRef.current = result.auth_token;

          // Detect if fakewallet returned a different address (its data was cleared/reset).
          const addressChanged = address !== storedKey;

          // Persist the (potentially refreshed) token and address.
          await AsyncStorage.setItem(
            SESSION_KEY,
            JSON.stringify({ authToken: result.auth_token, publicKey: address }),
          ).catch(() => {});

          setState({
            connected: true,
            publicKey: address,
            isDemoMode: false,
            connecting: false,
            mwaError: null,
            addressChanged,
          });
        });
      } catch {
        // Reauthorization failed: expired token, no wallet installed, wallet data cleared, etc.
        // Clear stale storage so next manual connect starts fresh.
        await AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
        setState(s => ({ ...s, connecting: false }));
      }
    })();
  }, []);

  // ── Manual connect ───────────────────────────────────────────────────────────
  // Calls wallet.authorize() for a new session. Persists the resulting token + address.
  const connect = useCallback(async () => {
    setState(s => ({ ...s, connecting: true, mwaError: null }));
    try {
      await transact(async wallet => {
        const authResult = await wallet.authorize({
          identity: APP_IDENTITY,
          chain: 'solana:devnet',
        });
        authTokenRef.current = authResult.auth_token;
        const address = base64ToSolanaAddress(authResult.accounts[0].address);

        // Detect if this address differs from the previously stored one.
        const prev = storedPublicKeyRef.current;
        const addressChanged = prev !== null && address !== prev;
        storedPublicKeyRef.current = address;

        // Persist session for next app launch.
        await AsyncStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ authToken: authResult.auth_token, publicKey: address }),
        ).catch(() => {});

        setState({
          connected: true,
          publicKey: address,
          isDemoMode: false,
          connecting: false,
          mwaError: null,
          addressChanged,
        });
      });
    } catch (e: any) {
      const msg: string = e?.message ?? String(e);
      setState(s => ({ ...s, connecting: false, mwaError: msg }));
    }
  }, []);

  // ── MWA signing ─────────────────────────────────────────────────────────────
  const signAndSendMemoTx = useCallback(async (txBase64: string): Promise<MwaSignResult> => {
    const token = authTokenRef.current;
    if (!token) {
      return { ok: false, reason: 'No MWA auth token — not connected via real wallet' };
    }
    try {
      const result = await transact(async wallet => {
        // Reauthorize with the stored token (no user interaction required for this step).
        await wallet.reauthorize({ auth_token: token, identity: APP_IDENTITY });
        // Sign the transaction — wallet app pops up for user approval here.
        const { signed_payloads } = await wallet.signTransactions({ payloads: [txBase64] });
        // Submit and confirm the signed transaction on devnet.
        return await sendRawSignedTx(signed_payloads[0]);
      });
      return { ok: true, result };
    } catch (e: any) {
      return { ok: false, reason: e?.message ?? 'MWA signing failed' };
    }
  }, []);

  // ── Demo mode ────────────────────────────────────────────────────────────────
  const connectDemo = useCallback(() => {
    storedPublicKeyRef.current = null;
    setState({
      connected: true,
      publicKey: DEMO_PUBKEY,
      isDemoMode: true,
      connecting: false,
      mwaError: null,
      addressChanged: false,
    });
  }, []);

  // ── Disconnect ───────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
    authTokenRef.current = null;
    storedPublicKeyRef.current = null;
    setState({
      connected: false,
      publicKey: null,
      isDemoMode: false,
      connecting: false,
      mwaError: null,
      addressChanged: false,
    });
  }, []);

  return (
    <WalletContext.Provider
      value={{ ...state, connect, connectDemo, disconnect, signAndSendMemoTx }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}
