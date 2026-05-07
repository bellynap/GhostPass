import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPE_COLORS, TYPE_EMOJI } from '../constants/colors';
import { useWallet, shortenAddress } from '../context/WalletContext';
import { usePassesContext } from '../context/PassesContext';
import { shortenSig } from '../services/solanaProof';

export default function PassportScreen() {
  const { connected, publicKey, isDemoMode } = useWallet();
  const { badges } = usePassesContext();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Passport</Text>
        <Text style={styles.headerSub}>Proof-of-being-there badges</Text>
        {connected && publicKey ? (
          <View style={[styles.walletChip, isDemoMode && styles.walletChipDemo]}>
            <Text style={[styles.walletChipText, isDemoMode && styles.walletChipTextDemo]}>
              {isDemoMode ? '⚡ Demo: ' : '◎ '}
              {shortenAddress(publicKey)}
            </Text>
          </View>
        ) : (
          <View style={styles.walletChip}>
            <Text style={styles.walletChipText}>No wallet connected</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {badges.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏅</Text>
            <Text style={styles.emptyTitle}>No badges yet</Text>
            <Text style={styles.emptyText}>
              Explore nearby GhostPasses and unlock them to earn proof-of-being-there
              badges.
            </Text>
          </View>
        ) : (
          badges.map(badge => {
            const color = TYPE_COLORS[badge.passType];
            const emoji = TYPE_EMOJI[badge.passType];
            const date = new Date(badge.unlockedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            return (
              <View
                key={badge.id}
                style={[styles.badge, { borderColor: color + '44' }]}
              >
                <View style={styles.badgeLeft}>
                  <Text style={styles.badgeEmoji}>{emoji}</Text>
                </View>
                <View style={styles.badgeRight}>
                  <View
                    style={[
                      styles.badgeTypePill,
                      { backgroundColor: color + '22' },
                    ]}
                  >
                    <Text style={[styles.badgeTypeText, { color }]}>
                      {badge.passType.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.badgeTitle}>{badge.title}</Text>
                  <Text style={styles.badgeMeta}>Unlocked {date}</Text>
                  <Text style={styles.badgeWallet}>Wallet: {badge.wallet}</Text>
                  {badge.unlockTxSignature ? (
                    <>
                      <Text style={styles.badgeTx}>✅ Solana devnet proof</Text>
                      <Text style={[styles.badgeTx, { fontFamily: 'monospace' }]}>
                        Tx: {shortenSig(badge.unlockTxSignature)}
                      </Text>
                    </>
                  ) : badge.localProofId ? (
                    <>
                      <Text style={styles.badgeTx}>⚡ Demo proof recorded locally</Text>
                      <Text style={[styles.badgeTx, { fontFamily: 'monospace' }]}>
                        ID: {badge.localProofId}
                      </Text>
                    </>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, gap: 4 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: COLORS.textPrimary },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  badge: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
  },
  badgeLeft: { justifyContent: 'center' },
  badgeEmoji: { fontSize: 32 },
  badgeRight: { flex: 1, gap: 4 },
  badgeTypePill: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeTypeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  badgeTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  badgeMeta: { fontSize: 12, color: COLORS.textSecondary },
  badgeWallet: { fontSize: 11, color: COLORS.textMuted },
  badgeTx: { fontSize: 11, color: COLORS.textMuted },
  walletChip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginTop: 6,
  },
  walletChipDemo: { borderColor: COLORS.gold + '44', backgroundColor: COLORS.goldDark },
  walletChipText: { fontSize: 12, color: COLORS.textMuted, fontFamily: 'monospace' },
  walletChipTextDemo: { color: COLORS.gold },
});
