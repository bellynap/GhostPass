import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { GhostPass, GhostPassType } from '../data/types';
import { COLORS, TYPE_COLORS, TYPE_EMOJI } from '../constants/colors';
import { useWallet } from '../context/WalletContext';
import { usePassesContext } from '../context/PassesContext';
import { useLocationContext } from '../context/LocationContext';
import { formatDistance } from '../utils/distance';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// ── Discovery Scope data (simulated — not live production data) ───────────────
const SCOPES = [
  { key: 'state' as const,        label: 'State',        region: 'Florida'         },
  { key: 'city' as const,         label: 'City',         region: 'Miami'           },
  { key: 'town' as const,         label: 'Town',         region: 'Downtown'        },
  { key: 'neighborhood' as const, label: 'Neighborhood', region: 'Hackathon Floor' },
] as const;
type ScopeKey = typeof SCOPES[number]['key'];

// ── By Type data ──────────────────────────────────────────────────────────────
const TYPE_ITEMS: { type: GhostPassType; desc: string }[] = [
  { type: 'Secret Invite',  desc: 'Private event drops hidden at real-world locations.' },
  { type: 'Confession',     desc: 'Anonymous local messages tied to a place.' },
  { type: 'Treasure Clue',  desc: 'Scavenger hunt clues for real-world exploration.' },
  { type: 'Art Drop',       desc: 'Hidden creative drops, poems, images, or music.' },
  { type: 'Community Note', desc: 'Local messages and signals for nearby groups.' },
  { type: 'Event Badge',    desc: 'Proof-of-being-there drops for events.' },
];

// ── Ghost Radar constants ─────────────────────────────────────────────────────
const RADAR_SIZE = 264;
const RADAR_CENTER = RADAR_SIZE / 2;
const BLIP_SIZE = 28;
const BLIP_POSITIONS = [
  { angle: 48,  dist: 70  },
  { angle: 155, dist: 96  },
  { angle: 242, dist: 62  },
  { angle: 318, dist: 104 },
];

// ── PassCard ──────────────────────────────────────────────────────────────────
function PassCard({
  pass,
  distanceMeters,
  unlockable,
  claimed,
  areaLabel,
  onPress,
}: {
  pass: GhostPass;
  distanceMeters: number;
  unlockable: boolean;
  claimed: boolean;
  areaLabel?: string;
  onPress: () => void;
}) {
  const color = TYPE_COLORS[pass.type];
  const emoji = TYPE_EMOJI[pass.type];
  const unlocksLeft = pass.maxUnlocks - pass.unlockCount;

  return (
    <TouchableOpacity
      style={[styles.card, claimed && styles.cardClaimed]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.cardHeader}>
        <View
          style={[styles.typeBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}
        >
          <Text style={[styles.typeBadgeText, { color }]}>
            {emoji} {pass.type.toUpperCase()}
          </Text>
        </View>
        {claimed ? (
          <View style={styles.claimedPill}>
            <Text style={styles.claimedPillText}>✅ In Passport</Text>
          </View>
        ) : (
          <Text style={styles.lockIcon}>{unlockable ? '🔓' : '🔒'}</Text>
        )}
      </View>
      <Text style={styles.cardTitle}>{pass.title}</Text>
      <Text style={styles.cardClue} numberOfLines={2}>{pass.clue}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.footerItem}>📍 {formatDistance(distanceMeters)}</Text>
        <Text style={styles.footerItem}>⏱ {pass.expiresIn}</Text>
        {claimed ? (
          <Text style={[styles.footerItem, { color: COLORS.accent }]}>Claimed</Text>
        ) : (
          <Text style={[styles.footerItem, !unlockable && { color: COLORS.danger + 'aa' }]}>
            {unlockable
              ? `${unlocksLeft} unlocks left`
              : `${formatDistance(distanceMeters - pass.radiusMeters)} outside zone`}
          </Text>
        )}
        {areaLabel ? (
          <Text style={styles.footerAreaLabel}>📌 {areaLabel}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ── GhostRadar ────────────────────────────────────────────────────────────────
function GhostRadar({
  passes,
  simulateNearby,
  getDistanceTo,
}: {
  passes: GhostPass[];
  simulateNearby: boolean;
  getDistanceTo: (pass: GhostPass) => number;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.6, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const visiblePasses = passes.slice(0, 4);
  const closest =
    visiblePasses.length > 0
      ? visiblePasses.reduce((a, b) => (getDistanceTo(a) <= getDistanceTo(b) ? a : b))
      : null;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={radarStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={radarStyles.disclaimer}>
        Simulated discovery map for demo{'\n'}Exact reveal unlocks only inside the GPS radius.
      </Text>

      <View style={radarStyles.radarWrap}>
        <View style={radarStyles.radar}>
          {[38, 75, 110].map(r => (
            <View
              key={r}
              style={[
                radarStyles.ring,
                { width: r * 2, height: r * 2, borderRadius: r, top: RADAR_CENTER - r, left: RADAR_CENTER - r },
              ]}
            />
          ))}
          <View style={radarStyles.crossH} />
          <View style={radarStyles.crossV} />

          {visiblePasses.map((pass, i) => {
            const pos = BLIP_POSITIONS[i];
            const rad = (pos.angle * Math.PI) / 180;
            const bx = RADAR_CENTER + pos.dist * Math.cos(rad) - BLIP_SIZE / 2;
            const by = RADAR_CENTER + pos.dist * Math.sin(rad) - BLIP_SIZE / 2;
            const blipColor = TYPE_COLORS[pass.type];
            return (
              <View
                key={pass.id}
                style={[
                  radarStyles.blip,
                  { left: bx, top: by, backgroundColor: blipColor + '33', borderColor: blipColor },
                ]}
              >
                <Text style={radarStyles.blipEmoji}>{TYPE_EMOJI[pass.type]}</Text>
              </View>
            );
          })}

          <View style={radarStyles.youWrap}>
            <Animated.View style={[radarStyles.youPulse, { transform: [{ scale: pulseAnim }] }]} />
            <View style={radarStyles.youDot} />
            <Text style={radarStyles.youLabel}>YOU</Text>
          </View>
        </View>
      </View>

      {closest ? (
        <View style={radarStyles.closestBox}>
          <Text style={radarStyles.closestHeading}>CLOSEST DROP</Text>
          <Text style={radarStyles.closestTitle}>{closest.title}</Text>
          <Text style={radarStyles.closestDist}>{formatDistance(getDistanceTo(closest))} away</Text>
        </View>
      ) : null}

      {simulateNearby ? (
        <Text style={radarStyles.simNote}>⚡ Simulated nearby for demo</Text>
      ) : null}

      {visiblePasses.map(pass => (
        <View key={pass.id} style={radarStyles.radarPassRow}>
          <Text style={radarStyles.radarPassEmoji}>{TYPE_EMOJI[pass.type]}</Text>
          <View style={{ flex: 1 }}>
            <Text style={radarStyles.radarPassTitle}>{pass.title}</Text>
            <Text style={radarStyles.radarPassDist}>{formatDistance(getDistanceTo(pass))}</Text>
          </View>
          <Text style={radarStyles.radarPassLock}>
            {getDistanceTo(pass) <= pass.radiusMeters || simulateNearby ? '🔓' : '🔒'}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ── FeedScreen ────────────────────────────────────────────────────────────────
export default function FeedScreen() {
  const navigation = useNavigation<NavProp>();
  const { connected, isDemoMode } = useWallet();
  const { passes, isPassClaimed } = usePassesContext();
  const {
    permissionStatus,
    loading,
    location,
    simulateNearby,
    setSimulateNearby,
    requestPermission,
    getDistanceTo,
    isUnlockable,
  } = useLocationContext();

  const [mode, setMode] = useState<'nearby' | 'area' | 'type'>('type');
  const [scope, setScope] = useState<ScopeKey>('neighborhood');
  const [viewMode, setViewMode] = useState<'list' | 'radar'>('list');
  const [selectedType, setSelectedType] = useState<GhostPassType | null>(null);

  useEffect(() => {
    if (permissionStatus === 'undetermined') {
      requestPermission();
    }
  }, []);

  const currentScope = SCOPES.find(s => s.key === scope)!;
  const scopePreposition = scope === 'state' || scope === 'city' ? 'in' : 'near';
  const areaLabel = currentScope.region;

  // By Area: counts and filtered list driven by actual pass area metadata
  const scopeCounts: Record<ScopeKey, number> = {
    state:        passes.filter(p => p.areas?.state        === 'Florida').length,
    city:         passes.filter(p => p.areas?.city         === 'Miami').length,
    town:         passes.filter(p => p.areas?.town         === 'Downtown').length,
    neighborhood: passes.filter(p => p.areas?.neighborhood === 'Hackathon Floor').length,
  };
  const scopeFilteredPasses =
    scope === 'state'        ? passes.filter(p => p.areas?.state        === 'Florida') :
    scope === 'city'         ? passes.filter(p => p.areas?.city         === 'Miami') :
    scope === 'town'         ? passes.filter(p => p.areas?.town         === 'Downtown') :
                               passes.filter(p => p.areas?.neighborhood === 'Hackathon Floor');

  // By Type mode computed
  const filteredPasses = selectedType ? passes.filter(p => p.type === selectedType) : [];
  const selectedTypeItem = selectedType ? TYPE_ITEMS.find(i => i.type === selectedType) ?? null : null;

  // Compact status pill — wallet state only, no balance details
  const pillText = isDemoMode
    ? '⚡ Demo mode'
    : connected
    ? '◎ Wallet connected · Devnet'
    : null;

  // Location card state for Nearby mode
  const locState: 'simulating' | 'active' | 'locating' | 'needed' | 'denied' | 'unavailable' =
    simulateNearby
      ? 'simulating'
      : location
      ? 'active'
      : loading
      ? 'locating'
      : permissionStatus === 'denied'
      ? 'denied'
      : permissionStatus === 'undetermined'
      ? 'needed'
      : 'unavailable';

  const isLocActionable = locState === 'needed' || locState === 'denied' || locState === 'unavailable';

  const handleLocationCardTap = () => {
    if (locState === 'denied') {
      Linking.openSettings();
    } else {
      requestPermission();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Explore GhostPasses</Text>
            <Text style={styles.headerSub}>Choose a type, search nearby, or browse by area.</Text>
          </View>
          {pillText ? (
            <View style={[styles.statusPill, isDemoMode && styles.statusPillDemo]}>
              <Text style={[styles.statusPillText, isDemoMode && styles.statusPillTextDemo]}>
                {pillText}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* ── Segmented control ─────────────────────────────────────────────── */}
      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[styles.segmentBtn, mode === 'type' && styles.segmentBtnActive]}
          onPress={() => setMode('type')}
          activeOpacity={0.75}
        >
          <Text style={[styles.segmentText, mode === 'type' && styles.segmentTextActive]}>
            🏷 By Type
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, mode === 'nearby' && styles.segmentBtnActive]}
          onPress={() => setMode('nearby')}
          activeOpacity={0.75}
        >
          <Text style={[styles.segmentText, mode === 'nearby' && styles.segmentTextActive]}>
            📍 Nearby
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, mode === 'area' && styles.segmentBtnActive]}
          onPress={() => setMode('area')}
          activeOpacity={0.75}
        >
          <Text style={[styles.segmentText, mode === 'area' && styles.segmentTextActive]}>
            🗺 By Area
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Nearby mode ───────────────────────────────────────────────────── */}
      {mode === 'nearby' ? (
        <>
          {/* Location Status card */}
          <TouchableOpacity
            style={[
              styles.locationCard,
              locState === 'simulating' && styles.locationCardSimulating,
              locState === 'active' && styles.locationCardActive,
              locState === 'needed' && styles.locationCardNeeded,
              (locState === 'denied' || locState === 'unavailable') && styles.locationCardDenied,
            ]}
            onPress={handleLocationCardTap}
            disabled={!isLocActionable}
            activeOpacity={isLocActionable ? 0.75 : 1}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.locationCardTitle,
                  (locState === 'simulating' || locState === 'active') && { color: COLORS.accent },
                  (locState === 'denied' || locState === 'unavailable') && { color: COLORS.danger },
                  locState === 'needed' && { color: COLORS.primary },
                ]}
              >
                {locState === 'simulating'
                  ? '⚡ Simulating Nearby'
                  : locState === 'active'
                  ? '📍 Using your location'
                  : locState === 'locating'
                  ? '📍 Requesting location…'
                  : locState === 'needed'
                  ? '📵 Location permission needed'
                  : locState === 'denied'
                  ? '📵 Location blocked'
                  : '📵 Location unavailable'}
              </Text>
              <Text style={styles.locationCardSub}>
                {locState === 'simulating'
                  ? 'Demo override — all passes are unlockable'
                  : locState === 'active'
                  ? 'GPS active — distances update from your current position'
                  : locState === 'locating'
                  ? 'Acquiring GPS signal…'
                  : locState === 'needed'
                  ? 'Tap to allow location access for GPS distances'
                  : locState === 'denied'
                  ? 'Location is blocked — tap to open settings'
                  : 'Unable to get location — tap to try again'}
              </Text>
            </View>
            {locState === 'active' ? (
              <TouchableOpacity onPress={requestPermission} style={styles.locationCardBtn} activeOpacity={0.7}>
                <Text style={styles.locationCardBtnText}>Refresh</Text>
              </TouchableOpacity>
            ) : locState === 'needed' ? (
              <TouchableOpacity onPress={requestPermission} style={[styles.locationCardBtn, styles.locationCardBtnPrimary]} activeOpacity={0.7}>
                <Text style={[styles.locationCardBtnText, styles.locationCardBtnTextPrimary]}>Enable Location</Text>
              </TouchableOpacity>
            ) : locState === 'denied' ? (
              <TouchableOpacity onPress={() => Linking.openSettings()} style={[styles.locationCardBtn, styles.locationCardBtnDanger]} activeOpacity={0.7}>
                <Text style={[styles.locationCardBtnText, styles.locationCardBtnTextDanger]}>Open Settings</Text>
              </TouchableOpacity>
            ) : locState === 'unavailable' ? (
              <TouchableOpacity onPress={requestPermission} style={[styles.locationCardBtn, styles.locationCardBtnDanger]} activeOpacity={0.7}>
                <Text style={[styles.locationCardBtnText, styles.locationCardBtnTextDanger]}>Try Again</Text>
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>

          {/* Demo: Simulate Nearby toggle */}
          <View style={[styles.simRow, simulateNearby && styles.simRowActive]}>
            <View style={styles.simLeft}>
              <Text style={[styles.simLabel, simulateNearby && styles.simLabelActive]}>
                {simulateNearby ? '📍 Simulating Nearby' : '📍 Demo: Simulate Nearby'}
              </Text>
              <Text style={styles.simSub}>
                {simulateNearby
                  ? 'ON — demo override makes passes unlockable'
                  : 'OFF — using real GPS distance'}
              </Text>
            </View>
            <Switch
              value={simulateNearby}
              onValueChange={setSimulateNearby}
              trackColor={{ false: COLORS.cardBorder, true: COLORS.accent + '88' }}
              thumbColor={simulateNearby ? COLORS.accent : COLORS.textMuted}
            />
          </View>

          {/* Nearby pass list */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {passes.map(pass => (
              <PassCard
                key={pass.id}
                pass={pass}
                distanceMeters={getDistanceTo(pass)}
                unlockable={isUnlockable(pass)}
                claimed={isPassClaimed(pass.id)}
                onPress={() => navigation.navigate('Detail', { passId: pass.id })}
              />
            ))}
          </ScrollView>
        </>
      ) : mode === 'area' ? (
        /* ── By Area mode ─────────────────────────────────────────────────── */
        <>
          {/* Discovery Scope selector */}
          <View style={styles.discoverSection}>
            <View style={styles.scopeRow}>
              {SCOPES.map(s => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.scopeBtn, scope === s.key && styles.scopeBtnActive]}
                  onPress={() => setScope(s.key)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.scopeCount, scope === s.key && styles.scopeCountActive]}>
                    {scopeCounts[s.key]}
                  </Text>
                  <Text style={[styles.scopeLabel, scope === s.key && styles.scopeLabelActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.scopeRegion}>
              {scopeCounts[scope]} GhostPasses {scopePreposition} {currentScope.region}
            </Text>
            <Text style={styles.discoverDisclaimer}>
              Simulated demo area data · Exact reveal unlocks only inside the GPS radius.
            </Text>
          </View>

          {/* List / Ghost Radar view toggle */}
          <View style={styles.viewToggleRow}>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.75}
            >
              <Text style={[styles.viewToggleText, viewMode === 'list' && styles.viewToggleTextActive]}>
                ☰  List
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'radar' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('radar')}
              activeOpacity={0.75}
            >
              <Text style={[styles.viewToggleText, viewMode === 'radar' && styles.viewToggleTextActive]}>
                👻  Ghost Radar
              </Text>
            </TouchableOpacity>
          </View>

          {/* List or radar content */}
          {viewMode === 'radar' ? (
            <GhostRadar
              passes={scopeFilteredPasses}
              simulateNearby={simulateNearby}
              getDistanceTo={getDistanceTo}
            />
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            >
              {scopeFilteredPasses.map(pass => (
                <PassCard
                  key={pass.id}
                  pass={pass}
                  distanceMeters={getDistanceTo(pass)}
                  unlockable={isUnlockable(pass)}
                  claimed={isPassClaimed(pass.id)}
                  areaLabel={areaLabel}
                  onPress={() => navigation.navigate('Detail', { passId: pass.id })}
                />
              ))}
            </ScrollView>
          )}
        </>
      ) : (
        /* ── By Type mode ──────────────────────────────────────────────────── */
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.typeScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Type bubble grid */}
          <View style={styles.typeGrid}>
            {TYPE_ITEMS.map(item => {
              const count = passes.filter(p => p.type === item.type).length;
              const color = TYPE_COLORS[item.type];
              const isSelected = selectedType === item.type;
              return (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.typeBubble,
                    isSelected && { borderColor: color, backgroundColor: color + '1A' },
                  ]}
                  onPress={() => setSelectedType(isSelected ? null : item.type)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.typeBubbleEmoji}>{TYPE_EMOJI[item.type]}</Text>
                  <Text style={[styles.typeBubbleName, isSelected && { color }]} numberOfLines={2}>
                    {item.type}
                  </Text>
                  <View style={[styles.typeBubbleCountBadge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
                    <Text style={[styles.typeBubbleCountText, { color }]}>{count}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected type detail */}
          {selectedType === null ? (
            <Text style={styles.typeHint}>Tap a type to see matching drops.</Text>
          ) : (
            <>
              <View style={[styles.typeDetailCard, { borderColor: TYPE_COLORS[selectedType] + '33' }]}>
                <Text style={[styles.typeDetailName, { color: TYPE_COLORS[selectedType] }]}>
                  {TYPE_EMOJI[selectedType]} {selectedType}
                </Text>
                <Text style={styles.typeDetailDesc}>{selectedTypeItem!.desc}</Text>
                <Text style={styles.typeDetailCount}>
                  {filteredPasses.length} drop{filteredPasses.length !== 1 ? 's' : ''}
                </Text>
              </View>
              {filteredPasses.length === 0 ? (
                <Text style={styles.typeEmptyText}>No drops of this type yet.</Text>
              ) : (
                filteredPasses.map(pass => (
                  <PassCard
                    key={pass.id}
                    pass={pass}
                    distanceMeters={getDistanceTo(pass)}
                    unlockable={isUnlockable(pass)}
                    claimed={isPassClaimed(pass.id)}
                    onPress={() => navigation.navigate('Detail', { passId: pass.id })}
                  />
                ))
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Main styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3 },

  // Status pill
  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
    backgroundColor: COLORS.card,
    marginTop: 3,
  },
  statusPillDemo: {
    borderColor: COLORS.gold + '44',
    backgroundColor: COLORS.goldDark,
  },
  statusPillText: { fontSize: 10, fontWeight: '600', color: COLORS.primary },
  statusPillTextDemo: { color: COLORS.gold },

  // Segmented control
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: COLORS.primary + '22',
    borderWidth: 1,
    borderColor: COLORS.primary + '66',
  },
  segmentText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  segmentTextActive: { color: COLORS.primary },

  // Location Status card (Nearby mode)
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 10,
  },
  locationCardActive: {
    backgroundColor: COLORS.accent + '0A',
    borderColor: COLORS.accent + '33',
  },
  locationCardSimulating: {
    backgroundColor: COLORS.accent + '11',
    borderColor: COLORS.accent + '55',
  },
  locationCardNeeded: {
    backgroundColor: COLORS.primary + '0A',
    borderColor: COLORS.primary + '33',
  },
  locationCardDenied: {
    backgroundColor: COLORS.danger + '0A',
    borderColor: COLORS.danger + '33',
  },
  locationCardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  locationCardSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  locationCardBtn: {
    backgroundColor: COLORS.cardElevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  locationCardBtnPrimary: {
    backgroundColor: COLORS.primary + '22',
    borderColor: COLORS.primary + '55',
  },
  locationCardBtnTextPrimary: { color: COLORS.primary },
  locationCardBtnDanger: {
    backgroundColor: COLORS.danger + '11',
    borderColor: COLORS.danger + '44',
  },
  locationCardBtnTextDanger: { color: COLORS.danger },
  locationCardBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },

  // Simulate Nearby toggle
  simRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: COLORS.goldDark,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.gold + '44',
  },
  simRowActive: {
    backgroundColor: COLORS.accent + '11',
    borderColor: COLORS.accent + '44',
  },
  simLeft: { flex: 1 },
  simLabel: { color: COLORS.gold, fontSize: 13, fontWeight: '700' },
  simLabelActive: { color: COLORS.accent },
  simSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },

  // Discovery Scope (By Area mode)
  discoverSection: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.primary + '33',
  },
  scopeRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  scopeBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  scopeBtnActive: {
    backgroundColor: COLORS.primary + '22',
    borderColor: COLORS.primary,
  },
  scopeCount: { fontSize: 17, fontWeight: '800', color: COLORS.textSecondary },
  scopeCountActive: { color: COLORS.primary },
  scopeLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  scopeLabelActive: { color: COLORS.primary },
  scopeRegion: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  discoverDisclaimer: { fontSize: 10, color: COLORS.textMuted, fontStyle: 'italic' },

  // View Mode toggle (By Area mode)
  viewToggleRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 3,
    gap: 3,
  },
  viewToggleBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewToggleBtnActive: {
    backgroundColor: COLORS.primary + '2A',
    borderWidth: 1,
    borderColor: COLORS.primary + '66',
  },
  viewToggleText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  viewToggleTextActive: { color: COLORS.primary },

  // Pass list
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardClaimed: { opacity: 0.75, borderColor: COLORS.accent + '44' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  typeBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  lockIcon: { fontSize: 16 },
  claimedPill: {
    backgroundColor: COLORS.accent + '22',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.accent + '55',
  },
  claimedPillText: { fontSize: 11, fontWeight: '700', color: COLORS.accent },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  cardClue: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  footerItem: { fontSize: 12, color: COLORS.textMuted },
  footerAreaLabel: { fontSize: 11, color: COLORS.textMuted, fontStyle: 'italic' },

  // By Type mode
  typeScrollContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  typeBubble: {
    width: '47%',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 10,
    gap: 6,
  },
  typeBubbleEmoji: { fontSize: 30 },
  typeBubbleName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  typeBubbleCountBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  typeBubbleCountText: { fontSize: 10, fontWeight: '700' },
  typeHint: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  typeDetailCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 4,
  },
  typeDetailName: { fontSize: 17, fontWeight: '800' },
  typeDetailDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
  typeDetailCount: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  typeEmptyText: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 16,
    fontStyle: 'italic',
  },
});

// ── Radar styles (scoped to GhostRadar) ───────────────────────────────────────
const radarStyles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32, alignItems: 'center' },
  disclaimer: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 14,
    lineHeight: 16,
  },
  radarWrap: { width: RADAR_SIZE, height: RADAR_SIZE, marginBottom: 16 },
  radar: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADAR_SIZE / 2,
    borderWidth: 1,
    borderColor: COLORS.accent + '44',
    position: 'relative',
    overflow: 'hidden',
  },
  ring: { position: 'absolute', borderWidth: 1, borderColor: COLORS.accent + '22' },
  crossH: {
    position: 'absolute',
    top: RADAR_CENTER - 0.5,
    left: 0, right: 0,
    height: 1,
    backgroundColor: COLORS.accent + '18',
  },
  crossV: {
    position: 'absolute',
    left: RADAR_CENTER - 0.5,
    top: 0, bottom: 0,
    width: 1,
    backgroundColor: COLORS.accent + '18',
  },
  youWrap: {
    position: 'absolute',
    top: RADAR_CENTER - 16,
    left: RADAR_CENTER - 16,
    width: 32, height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  youPulse: {
    position: 'absolute',
    width: 22, height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary + '33',
  },
  youDot: {
    width: 10, height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    position: 'absolute',
  },
  youLabel: {
    position: 'absolute',
    top: 18,
    fontSize: 7,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  blip: {
    position: 'absolute',
    width: BLIP_SIZE, height: BLIP_SIZE,
    borderRadius: BLIP_SIZE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blipEmoji: { fontSize: 13 },
  closestBox: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  closestHeading: {
    fontSize: 9, fontWeight: '700',
    color: COLORS.textMuted, letterSpacing: 1.2, marginBottom: 4,
  },
  closestTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  closestDist: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  simNote: {
    fontSize: 11, color: COLORS.gold,
    fontWeight: '600', marginBottom: 12, textAlign: 'center',
  },
  radarPassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 10,
    width: '100%',
  },
  radarPassEmoji: { fontSize: 20 },
  radarPassTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  radarPassDist: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  radarPassLock: { fontSize: 16 },
});
