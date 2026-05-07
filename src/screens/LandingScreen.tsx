import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../constants/colors';
import { useWallet } from '../context/WalletContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Landing'>;
};

const TYPES = [
  ['🔮', 'Secret Invite', 'Private event drops'],
  ['👻', 'Confession', 'Anonymous local messages'],
  ['🗝️', 'Treasure Clue', 'Scavenger hunt clues'],
  ['🎨', 'Art Drop', 'Hidden poems and music'],
  ['📡', 'Community Note', 'Group signals'],
  ['🏅', 'Event Badge', 'Proof of presence'],
] as const;

export default function LandingScreen({ navigation }: Props) {
  const { connect, connectDemo, connecting, mwaError, connected, addressChanged } = useWallet();

  const handleConnect = async () => {
    await connect();
    // If connect succeeds (no throw), navigate to Main
    // We read connected from state after the call via a useEffect-free approach:
    // connect() sets state internally; we navigate on press resolution
  };

  React.useEffect(() => {
    if (connected) {
      navigation.navigate('Main');
    }
  }, [connected]);

  const handleDemo = () => {
    connectDemo();
    navigation.navigate('DemoMode');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image
            source={require('../../assets/ghostpass-logo-card.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>
            Location-locked secret experiences on Solana
          </Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, connecting && styles.btnDisabled]}
            onPress={handleConnect}
            disabled={connecting}
            activeOpacity={0.85}
          >
            {connecting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnPrimaryText}>Connect Wallet</Text>
            )}
          </TouchableOpacity>

          {addressChanged ? (
            <View style={styles.resetWarning}>
              <Text style={styles.resetWarningTitle}>⚠️ Wallet address changed</Text>
              <Text style={styles.resetWarningText}>
                Your Solana wallet generated a new address — its previous keypair was lost
                (emulator reset or wallet reinstall). Any SOL sent to the old address is
                inaccessible. Fund the new address before creating proofs.
              </Text>
            </View>
          ) : null}

          {mwaError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>No wallet app found</Text>
              <Text style={styles.errorText}>
                Install Phantom or Solflare on a real device to use wallet signing.
              </Text>
              <TouchableOpacity
                style={styles.demoFallbackBtn}
                onPress={handleDemo}
                activeOpacity={0.85}
              >
                <Text style={styles.demoFallbackText}>⚡ Continue in Demo Mode</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.btn, styles.btnOutline]}
              onPress={handleDemo}
            >
              <Text style={styles.btnOutlineText}>⚡ Demo Mode</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider} />

        <Text style={styles.explainerTitle}>What is GhostPass?</Text>
        <Text style={styles.explainerText}>
          Creators leave temporary digital secrets at real-world GPS locations. Get close
          enough with your Solana wallet to unlock them — before they expire.
        </Text>

        <View style={styles.typeList}>
          {TYPES.map(([emoji, name, desc]) => (
            <View key={name} style={styles.typeRow}>
              <Text style={styles.typeEmoji}>{emoji}</Text>
              <View style={styles.typeInfo}>
                <Text style={styles.typeName}>{name}</Text>
                <Text style={styles.typeDesc}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 40 },
  logo: {
    width: '92%',
    height: 360,
    alignSelf: 'center',
    marginTop: 24,
    marginBottom: 12,
    borderRadius: 24,
  },
  tagline: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  buttons: { gap: 12, marginBottom: 40 },
  btn: { borderRadius: 12, padding: 16, alignItems: 'center' },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnOutline: {
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card,
  },
  btnOutlineText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '600' },
  errorBox: {
    backgroundColor: COLORS.danger + '11',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.danger + '44',
    gap: 8,
  },
  errorTitle: { color: COLORS.danger, fontWeight: '700', fontSize: 14 },
  errorText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
  demoFallbackBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  demoFallbackText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  resetWarning: {
    backgroundColor: COLORS.gold + '11',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.gold + '44',
    gap: 6,
  },
  resetWarningTitle: { color: COLORS.gold, fontWeight: '700', fontSize: 13 },
  resetWarningText: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  divider: { height: 1, backgroundColor: COLORS.cardBorder, marginBottom: 32 },
  explainerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  explainerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 28,
  },
  typeList: { gap: 16 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  typeEmoji: { fontSize: 24, width: 36, textAlign: 'center' },
  typeInfo: { flex: 1 },
  typeName: { color: COLORS.textPrimary, fontWeight: '600', fontSize: 14 },
  typeDesc: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
});
