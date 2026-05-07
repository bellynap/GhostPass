import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS, TYPE_COLORS, TYPE_EMOJI } from '../constants/colors';
import { usePassesContext } from '../context/PassesContext';
import { useLocationContext } from '../context/LocationContext';
import { formatDistance } from '../utils/distance';
import { useIsFocused } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

export default function DetailScreen({ route, navigation }: Props) {
  const { passes, isPassClaimed } = usePassesContext();
  const pass = passes.find(p => p.id === route.params.passId);
  const { getDistanceTo, isUnlockable, permissionStatus, simulateNearby, location } =
    useLocationContext();
  const [unlockPressed, setUnlockPressed] = useState(false);
  const isFocused = useIsFocused();
  React.useEffect(() => {
    if (isFocused) setUnlockPressed(false);
  }, [isFocused]);

  if (!pass) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.notFound}>GhostPass not found.</Text>
      </SafeAreaView>
    );
  }

  const color = TYPE_COLORS[pass.type];
  const emoji = TYPE_EMOJI[pass.type];
  const distanceMeters = getDistanceTo(pass);
  const unlockable = isUnlockable(pass);
  const unlocksLeft = pass.maxUnlocks - pass.unlockCount;
  const claimed = isPassClaimed(pass.id);

  const locationNote = simulateNearby
    ? '⚡ Simulating nearby — demo mode'
    : location
    ? '📍 GPS active'
    : permissionStatus === 'denied'
    ? '📵 Location unavailable — use Demo Mode for judging fallback'
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View
          style={[
            styles.typeBadge,
            { backgroundColor: color + '22', borderColor: color + '55' },
          ]}
        >
          <Text style={[styles.typeBadgeText, { color }]}>
            {emoji} {pass.type.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.title}>{pass.title}</Text>
        <Text style={styles.clue}>{pass.clue}</Text>

        <View
          style={[
            styles.gateBox,
            {
              borderColor: unlockable ? COLORS.accent + '55' : COLORS.danger + '55',
            },
          ]}
        >
          <Text style={styles.gateDistance}>{formatDistance(distanceMeters)}</Text>
          <Text style={styles.gateLabel}>
            {unlockable
              ? `Within ${formatDistance(pass.radiusMeters)} radius`
              : `Unlock radius: ${formatDistance(pass.radiusMeters)}`}
          </Text>
          <View
            style={[
              styles.gateBadge,
              {
                backgroundColor: unlockable
                  ? COLORS.accent + '22'
                  : COLORS.danger + '22',
              },
            ]}
          >
            <Text
              style={[
                styles.gateBadgeText,
                { color: unlockable ? COLORS.accent : COLORS.danger },
              ]}
            >
              {unlockable ? '🔓 UNLOCKABLE' : '🔒 TOO FAR'}
            </Text>
          </View>

          {locationNote ? (
            <Text
              style={[
                styles.locationNote,
                {
                  color: simulateNearby
                    ? COLORS.gold
                    : location
                    ? COLORS.accent
                    : COLORS.textMuted,
                },
              ]}
            >
              {locationNote}
            </Text>
          ) : null}
        </View>

        <View style={styles.meta}>
          <Text style={styles.metaItem}>⏱ Expires in {pass.expiresIn}</Text>
          <Text style={styles.metaItem}>
            👥 {unlocksLeft} of {pass.maxUnlocks} unlocks remaining
          </Text>
          <Text style={styles.metaItem}>🔑 Creator: {pass.creatorWallet}</Text>
        </View>

        {claimed ? (
          <>
            <View style={styles.claimedBanner}>
              <Text style={styles.claimedBannerText}>
                ✅ Already claimed — saved in your Passport.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.passportBtn}
              onPress={() => navigation.navigate('Main', { screen: 'Passport' })}
              activeOpacity={0.85}
            >
              <Text style={styles.passportBtnText}>🏅 View Passport</Text>
            </TouchableOpacity>
          </>
        ) : unlockable ? (
          <>
            <TouchableOpacity
              style={[styles.unlockBtn, { backgroundColor: COLORS.primary }]}
              activeOpacity={0.85}
              onPress={() => {
                console.log('[DetailScreen] Unlock with Wallet pressed, passId:', pass.id);
                setUnlockPressed(true);
                navigation.navigate('SecretReveal', { passId: pass.id });
              }}
            >
              <Text style={styles.unlockBtnText}>
                {unlockPressed ? '⏳ Opening wallet…' : '🔮 Unlock with Wallet'}
              </Text>
              <Text style={styles.unlockBtnNote}>Unlock records proof when available</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => navigation.navigate('SecretReveal', { passId: pass.id })}
              activeOpacity={0.75}
            >
              <Text style={styles.demoBtnText}>⚡ Demo: Skip to Reveal →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.lockedMsg}>
              <Text style={styles.lockedText}>
                You are{' '}
                {formatDistance(Math.max(0, distanceMeters - pass.radiusMeters))} outside
                the unlock zone.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => navigation.navigate('SecretReveal', { passId: pass.id })}
              activeOpacity={0.75}
            >
              <Text style={styles.demoBtnText}>⚡ Demo: Skip to Reveal →</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 40 },
  back: { marginBottom: 20 },
  backText: { color: COLORS.textSecondary, fontSize: 15 },
  notFound: { color: COLORS.textPrimary, padding: 20 },
  typeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    marginBottom: 16,
  },
  typeBadgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  clue: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 23,
    marginBottom: 28,
  },
  gateBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  gateDistance: {
    fontSize: 56,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  gateLabel: { fontSize: 13, color: COLORS.textSecondary },
  gateBadge: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 7 },
  gateBadgeText: { fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
  locationNote: { fontSize: 11, marginTop: 4 },
  meta: { gap: 8, marginBottom: 28 },
  metaItem: { fontSize: 14, color: COLORS.textSecondary },
  lockedMsg: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  lockedText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  unlockBtn: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  unlockBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  unlockBtnNote: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 },
  demoBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
  },
  demoBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  claimedBanner: {
    backgroundColor: COLORS.accent + '15',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.accent + '44',
    marginBottom: 12,
    alignItems: 'center',
  },
  claimedBannerText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  passportBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  passportBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
