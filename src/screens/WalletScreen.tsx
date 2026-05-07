import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../constants/colors';
import { useWallet, shortenAddress } from '../context/WalletContext';
import {
  DEVNET_LABEL,
  getDemoKeypairPubkey,
  getDevnetBalance,
  getProofKeypairBalance,
} from '../services/solanaProof';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function WalletScreen() {
  const navigation = useNavigation<NavProp>();
  const { connected, publicKey, isDemoMode, addressChanged, disconnect } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // The address used for proof signing in the current session
  const displayAddress = !isDemoMode && publicKey ? publicKey : getDemoKeypairPubkey();
  const isRealWallet = connected && !isDemoMode && publicKey !== null;
  const lowBalance = balance !== null && balance < 0.001;

  const fetchBalance = useCallback(() => {
    setBalance(null);
    if (!isDemoMode && publicKey) {
      getDevnetBalance(publicKey).then(setBalance);
    } else {
      getProofKeypairBalance().then(setBalance);
    }
  }, [isDemoMode, publicKey]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const handleCopy = async () => {
    if (!publicKey) return;
    await Clipboard.setStringAsync(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Disconnect your wallet and return to the landing screen?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            disconnect();
            navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wallet</Text>
          <Text style={styles.headerSub}>
            Manage Solana connection and proof status.
          </Text>
        </View>

        {/* ── Address changed warning ──────────────────────────────────────── */}
        {addressChanged ? (
          <View style={styles.warnCard}>
            <Text style={styles.warnTitle}>⚠️ Wallet address changed</Text>
            <Text style={styles.warnText}>
              Your Solana wallet generated a new address — its previous keypair was lost
              (emulator reset or wallet reinstall). Any SOL sent to the old address is
              inaccessible. Fund the new address shown below before creating proofs.
            </Text>
          </View>
        ) : null}

        {/* ── Connection section ───────────────────────────────────────────── */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>CONNECTION</Text>
        </View>

        <View style={[styles.card, isRealWallet ? styles.cardWallet : styles.cardDemo]}>
          {/* Mode badge */}
          <View style={styles.modeBadgeRow}>
            <View style={[styles.modeBadge, isRealWallet ? styles.modeBadgeWallet : styles.modeBadgeDemo]}>
              <Text style={[styles.modeBadgeText, isRealWallet ? styles.modeBadgeTextWallet : styles.modeBadgeTextDemo]}>
                {isRealWallet ? '◎ Wallet connected' : '⚡ Demo mode'}
              </Text>
            </View>
            {isRealWallet ? (
              <Text style={styles.networkTag}>Solana devnet</Text>
            ) : null}
          </View>

          {/* Address */}
          <Text style={styles.addrLabel}>
            {isRealWallet ? 'Connected address' : 'Demo fallback key (ephemeral — changes each session)'}
          </Text>
          <Text style={styles.addrText} selectable>
            {isRealWallet ? publicKey : displayAddress}
          </Text>

          {/* Copy address button — only for real wallet */}
          {isRealWallet ? (
            <TouchableOpacity
              style={[styles.copyBtn, copied && styles.copyBtnDone]}
              onPress={handleCopy}
              activeOpacity={0.8}
            >
              <Text style={styles.copyBtnText}>
                {copied ? '✓ Copied' : '⎘ Copy Wallet Address'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.demoAddrNote}>
              Not your real wallet. Demo proofs use an ephemeral Solana keypair for signing.
            </Text>
          )}
        </View>

        {/* ── Network / balance section ────────────────────────────────────── */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>NETWORK</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.balanceRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.networkName}>◎ {DEVNET_LABEL}</Text>
              <Text style={styles.balanceLabel}>
                {isRealWallet ? 'Wallet balance' : 'Demo keypair balance'}
              </Text>
            </View>
            <Text style={[styles.balanceValue, lowBalance && styles.balanceLow]}>
              {balance !== null ? `${balance.toFixed(4)} SOL` : '— SOL'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={fetchBalance}
            activeOpacity={0.8}
          >
            <Text style={styles.refreshBtnText}>↻ Refresh Balance</Text>
          </TouchableOpacity>
        </View>

        {/* ── Low SOL warning ─────────────────────────────────────────────── */}
        {lowBalance ? (
          <View style={styles.lowSolCard}>
            <Text style={styles.lowSolTitle}>⚠️ Low devnet SOL</Text>
            <Text style={styles.lowSolText}>
              Live memo proofs may fall back to local demo proof. Fund this address with
              devnet SOL to enable on-chain GHOSTPASS memos.
            </Text>
            {isRealWallet && publicKey ? (
              <Text style={styles.lowSolMono}>
                solana airdrop 1 {shortenAddress(publicKey)} --url devnet
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* ── Proof explanation ────────────────────────────────────────────── */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>HOW PROOFS WORK</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Live Solana memo proofs require devnet SOL. When a GhostPass is created or
            unlocked, GhostPass sends a{' '}
            <Text style={styles.infoCode}>GHOSTPASS_CREATE</Text> or{' '}
            <Text style={styles.infoCode}>GHOSTPASS_UNLOCK</Text> memo transaction to
            Solana devnet — permanently recording the event on-chain.
          </Text>
          <Text style={[styles.infoText, { marginTop: 10 }]}>
            If wallet funding or RPC is unavailable, GhostPass falls back to a{' '}
            <Text style={styles.infoHighlight}>Local Demo Proof — Not On-Chain</Text>.
            The proof ID is saved in-app but is not verifiable on an explorer.
          </Text>
        </View>

        {/* ── Demo note ────────────────────────────────────────────────────── */}
        <View style={styles.demoNoteCard}>
          <Text style={styles.demoNoteText}>
            This demo uses Solana Mobile Wallet Adapter with the Android emulator
            fakewallet. On a real device, connect Phantom or Solflare for on-chain
            signing.
          </Text>
        </View>

        {/* ── Disconnect ───────────────────────────────────────────────────── */}
        {connected && !isDemoMode ? (
          <TouchableOpacity
            style={styles.disconnectBtn}
            onPress={handleDisconnect}
            activeOpacity={0.8}
          >
            <Text style={styles.disconnectBtnText}>Disconnect Wallet</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 40, gap: 0 },

  header: { paddingBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: COLORS.textPrimary },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },

  // Section label
  sectionLabel: { marginBottom: 8, marginTop: 16 },
  sectionLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
  },

  // Generic card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 0,
  },
  cardWallet: { borderColor: COLORS.primary + '44' },
  cardDemo: { borderColor: COLORS.gold + '33', backgroundColor: COLORS.goldDark },

  // Mode badge
  modeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modeBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  modeBadgeWallet: {
    backgroundColor: COLORS.primary + '22',
    borderColor: COLORS.primary + '55',
  },
  modeBadgeDemo: {
    backgroundColor: COLORS.gold + '22',
    borderColor: COLORS.gold + '55',
  },
  modeBadgeText: { fontSize: 12, fontWeight: '700' },
  modeBadgeTextWallet: { color: COLORS.primary },
  modeBadgeTextDemo: { color: COLORS.gold },
  networkTag: { fontSize: 11, color: COLORS.accent, fontWeight: '600' },

  // Address display
  addrLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 6 },
  addrText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 18,
    marginBottom: 12,
  },

  // Copy button
  copyBtn: {
    backgroundColor: COLORS.cardElevated,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
    alignSelf: 'flex-start',
  },
  copyBtnDone: {
    borderColor: COLORS.accent + '55',
    backgroundColor: COLORS.accent + '11',
  },
  copyBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },

  // Demo address note
  demoAddrNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    lineHeight: 16,
  },

  // Balance row
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  networkName: { fontSize: 13, fontWeight: '700', color: COLORS.accent, marginBottom: 2 },
  balanceLabel: { fontSize: 11, color: COLORS.textMuted },
  balanceValue: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  balanceLow: { color: COLORS.danger },

  // Refresh button
  refreshBtn: {
    backgroundColor: COLORS.cardElevated,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  refreshBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },

  // Low SOL warning
  lowSolCard: {
    backgroundColor: COLORS.danger + '0D',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.danger + '44',
    marginTop: 10,
    gap: 6,
  },
  lowSolTitle: { fontSize: 13, fontWeight: '700', color: COLORS.danger },
  lowSolText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  lowSolMono: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    marginTop: 4,
  },

  // Info / proof explanation
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  infoText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  infoCode: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: COLORS.accent,
  },
  infoHighlight: { fontWeight: '700', color: COLORS.textPrimary },

  // Demo note
  demoNoteCard: {
    backgroundColor: COLORS.cardElevated,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginTop: 10,
  },
  demoNoteText: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  // Address changed warning
  warnCard: {
    backgroundColor: COLORS.gold + '11',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.gold + '44',
    marginBottom: 16,
    gap: 6,
  },
  warnTitle: { fontSize: 13, fontWeight: '700', color: COLORS.gold },
  warnText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },

  // Disconnect
  disconnectBtn: {
    marginTop: 24,
    backgroundColor: COLORS.danger + '11',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.danger + '33',
  },
  disconnectBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.danger },
});
