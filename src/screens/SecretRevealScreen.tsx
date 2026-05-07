import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS, TYPE_COLORS, TYPE_EMOJI } from '../constants/colors';
import { usePassesContext } from '../context/PassesContext';
import { useWallet } from '../context/WalletContext';
import {
  sendUnlockProof,
  buildUnlockTx,
  shortenSig,
  getDemoKeypairPubkey,
  ProofResult,
} from '../services/solanaProof';

type Props = NativeStackScreenProps<RootStackParamList, 'SecretReveal'>;

type ProofState =
  | { status: 'sending' }
  | { status: 'done'; result: ProofResult };

export default function SecretRevealScreen({ route, navigation }: Props) {
  const { passes, addBadge } = usePassesContext();
  const { publicKey, isDemoMode, signAndSendMemoTx } = useWallet();
  const pass = passes.find(p => p.id === route.params.passId);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const [proof, setProof] = useState<ProofState>({ status: 'sending' });
  const [badgeClaimed, setBadgeClaimed] = useState(false);
  const [mwaError, setMwaError] = useState<string | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  // Auto-send unlock proof on mount.
  // Real wallet path: build unsigned tx → MWA signing → submit to devnet.
  // Demo/fallback path: demo keypair signs and submits (or falls back to local proof).
  useEffect(() => {
    if (!pass) return;
    const walletLabel = publicKey ?? getDemoKeypairPubkey();

    const runProof = async () => {
      if (!isDemoMode && publicKey) {
        try {
          console.log('[SecretReveal] Building unlock tx for wallet:', publicKey);
          const txBytes = await buildUnlockTx(pass.id, walletLabel, publicKey);
          console.log('[SecretReveal] Calling signAndSendMemoTx…');
          const mwaResult = await signAndSendMemoTx(txBytes);
          if (mwaResult.ok) {
            console.log('[SecretReveal] MWA signing succeeded, sig:', mwaResult.result.kind === 'live-devnet-success' ? mwaResult.result.sig : 'local');
            setProof({ status: 'done', result: mwaResult.result });
            return;
          }
          console.warn('[SecretReveal] MWA signing failed:', mwaResult.reason);
          setMwaError(mwaResult.reason);
        } catch (e: any) {
          const msg = e?.message ?? 'Failed to build transaction';
          console.warn('[SecretReveal] MWA path threw:', msg);
          setMwaError(msg);
        }
      }
      console.log('[SecretReveal] Falling back to demo proof path');
      const result = await sendUnlockProof(pass.id, walletLabel);
      setProof({ status: 'done', result });
    };

    runProof();
  }, [pass?.id]);

  const handleClaimBadge = () => {
    if (!pass || badgeClaimed) return;
    const result = proof.status === 'done' ? proof.result : undefined;
    addBadge({
      id: 'badge_' + pass.id + '_' + Date.now(),
      passId: pass.id,
      passType: pass.type,
      title: pass.title,
      unlockedAt: new Date().toISOString(),
      wallet: publicKey ?? getDemoKeypairPubkey(),
      unlockTxSignature: result?.kind === 'live-devnet-success' ? result.sig : undefined,
      localProofId: result?.kind === 'local-demo-fallback' ? result.localId : undefined,
    });
    setBadgeClaimed(true);
    navigation.navigate('Main');
  };

  if (!pass) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: COLORS.textPrimary, padding: 20 }}>Pass not found.</Text>
      </SafeAreaView>
    );
  }

  const color = TYPE_COLORS[pass.type];
  const emoji = TYPE_EMOJI[pass.type];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.header}>✨ Secret Unlocked</Text>

        <Animated.View
          style={[
            styles.revealBox,
            { opacity, transform: [{ scale }], borderColor: color + '66' },
          ]}
        >
          <Text style={styles.revealEmoji}>{emoji}</Text>
          <Text style={[styles.revealType, { color }]}>{pass.type.toUpperCase()}</Text>
          <Text style={styles.revealTitle}>{pass.title}</Text>
          <View style={styles.revealDivider} />
          <Text style={styles.revealSecret}>{pass.secretReveal}</Text>
        </Animated.View>

        {/* ── Proof status ── */}
        <View style={styles.proof}>
          {proof.status === 'sending' ? (
            <>
              <ActivityIndicator color={COLORS.accent} size="small" style={{ marginBottom: 6 }} />
              <Text style={styles.proofLabel}>⏳ Recording Proof…</Text>
              <Text style={styles.proofNote}>
                Attempting GHOSTPASS_UNLOCK memo on Solana devnet
              </Text>
              {isDemoMode ? (
                <Text style={styles.proofNote}>⚡ Demo keypair — not your real wallet</Text>
              ) : (
                <Text style={styles.proofNote}>◎ Open your wallet app to approve</Text>
              )}
            </>
          ) : proof.result.kind === 'live-devnet-success' ? (
            <>
              <Text style={styles.proofLabel}>✅ Solana Proof Recorded</Text>
              <Text style={styles.proofTx}>Tx: {shortenSig(proof.result.sig)}</Text>
              <Text style={styles.proofNote}>
                GHOSTPASS_UNLOCK memo on Solana devnet
              </Text>
              <Text style={styles.proofNote}>
                explorer.solana.com · devnet
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.proofLabel}>⚡ Local Demo Proof — Not On-Chain</Text>
              <Text style={styles.proofTx}>ID: {proof.result.localId}</Text>
              {mwaError ? (
                <Text style={[styles.proofNote, { color: COLORS.danger }]}>
                  ⚠️ Wallet signing failed: {mwaError}
                </Text>
              ) : null}
              <Text style={styles.proofNote}>
                {proof.result.reason}
              </Text>
              <Text style={styles.proofNote}>
                Live Solana devnet proof records automatically when RPC is available.
              </Text>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.badgeBtn, { backgroundColor: badgeClaimed ? COLORS.textMuted : color }]}
          onPress={handleClaimBadge}
          activeOpacity={0.85}
          disabled={badgeClaimed}
        >
          <Text style={styles.badgeBtnText}>
            {badgeClaimed ? '🏅 Badge Claimed' : '🏅 Claim Your Badge'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 24, paddingBottom: 40 },
  back: { marginBottom: 20 },
  backText: { color: COLORS.textSecondary, fontSize: 15 },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 28,
    textAlign: 'center',
  },
  revealBox: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 28,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 28,
  },
  revealEmoji: { fontSize: 48, marginBottom: 8 },
  revealType: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  revealTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  revealDivider: {
    width: 40,
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  revealSecret: {
    fontSize: 17,
    color: COLORS.textPrimary,
    lineHeight: 27,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  proof: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 24,
    alignItems: 'center',
    gap: 4,
  },
  proofLabel: { color: COLORS.accent, fontWeight: '700', fontSize: 13 },
  proofTx: { color: COLORS.textSecondary, fontSize: 12, fontFamily: 'monospace' },
  proofNote: { color: COLORS.textMuted, fontSize: 11, textAlign: 'center' },
  badgeBtn: { borderRadius: 14, padding: 18, alignItems: 'center' },
  badgeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
