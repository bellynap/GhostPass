import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { DEMO_PASSES } from '../data/demoData';
import { COLORS, TYPE_COLORS, TYPE_EMOJI } from '../constants/colors';
import { useLocationContext } from '../context/LocationContext';

type Props = NativeStackScreenProps<RootStackParamList, 'DemoMode'>;

export default function DemoModeScreen({ navigation }: Props) {
  const { simulateNearby, setSimulateNearby, isUnlockable } = useLocationContext();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerLabel}>⚡ DEMO MODE</Text>
          <Text style={styles.demoBannerSub}>
            Demo wallet · Simulated GPS · Solana devnet
          </Text>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <Text style={styles.toggleLabel}>📍 Simulate Nearby Location</Text>
            <Text style={styles.toggleSub}>All passes appear unlockable</Text>
          </View>
          <Switch
            value={simulateNearby}
            onValueChange={setSimulateNearby}
            trackColor={{ false: COLORS.cardBorder, true: COLORS.primary + '88' }}
            thumbColor={simulateNearby ? COLORS.primary : COLORS.textMuted}
          />
        </View>

        <TouchableOpacity
          style={styles.enterBtn}
          onPress={() => navigation.navigate('Main')}
          activeOpacity={0.85}
        >
          <Text style={styles.enterBtnText}>Enter App →</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>DEMO GHOSTPASSES</Text>

        {DEMO_PASSES.map(pass => {
          const color = TYPE_COLORS[pass.type];
          const emoji = TYPE_EMOJI[pass.type];
          const unlockable = isUnlockable(pass);

          return (
            <View key={pass.id} style={styles.demoCard}>
              <View style={styles.demoCardHeader}>
                <Text style={styles.demoCardEmoji}>{emoji}</Text>
                <View style={styles.demoCardInfo}>
                  <Text style={[styles.demoCardType, { color }]}>{pass.type}</Text>
                  <Text style={styles.demoCardTitle}>{pass.title}</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: unlockable
                        ? COLORS.accent + '22'
                        : COLORS.danger + '22',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: unlockable ? COLORS.accent : COLORS.danger },
                    ]}
                  >
                    {unlockable ? 'OPEN' : 'LOCKED'}
                  </Text>
                </View>
              </View>

              <View style={styles.demoCardActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() =>
                    navigation.navigate('Detail', { passId: pass.id })
                  }
                  activeOpacity={0.75}
                >
                  <Text style={styles.actionBtnText}>View Detail</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnReveal]}
                  onPress={() =>
                    navigation.navigate('SecretReveal', { passId: pass.id })
                  }
                  activeOpacity={0.75}
                >
                  <Text style={[styles.actionBtnText, { color: COLORS.accent }]}>
                    Reveal →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 40 },
  back: { marginBottom: 20 },
  backText: { color: COLORS.textSecondary, fontSize: 15 },
  demoBanner: {
    backgroundColor: COLORS.goldDark,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gold + '44',
    marginBottom: 20,
    alignItems: 'center',
  },
  demoBannerLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 2,
  },
  demoBannerSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  toggleRow: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  toggleLeft: { flex: 1 },
  toggleLabel: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  toggleSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  enterBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 28,
  },
  enterBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  demoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 10,
  },
  demoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  demoCardEmoji: { fontSize: 28 },
  demoCardInfo: { flex: 1 },
  demoCardType: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
  demoCardTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  statusPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
  demoCardActions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.cardElevated,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  actionBtnReveal: { borderColor: COLORS.accent + '44' },
  actionBtnText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
});
