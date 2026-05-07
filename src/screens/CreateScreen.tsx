import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, TYPE_COLORS, TYPE_EMOJI } from '../constants/colors';
import { GhostPassType, GhostPass } from '../data/types';
import { usePassesContext } from '../context/PassesContext';
import { useWallet } from '../context/WalletContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  sendCreateProof,
  buildCreateTx,
  shortenSig,
  devnetExplorerUrl,
  getDemoKeypairPubkey,
  ProofResult,
} from '../services/solanaProof';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const ALL_TYPES: GhostPassType[] = [
  'Secret Invite',
  'Confession',
  'Treasure Clue',
  'Art Drop',
  'Community Note',
  'Event Badge',
];

const RADIUS_PRESETS = [
  { label: 'Close',      display: '50 ft',  meters: 15  },
  { label: 'Nearby',     display: '150 ft', meters: 46  },
  { label: 'Event area', display: '300 ft', meters: 91  },
  { label: 'Wide',       display: '500 ft', meters: 152 },
];

type ProofState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'done'; result: ProofResult };

export default function CreateScreen() {
  const navigation = useNavigation<NavProp>();
  const { addPass, updatePassSig } = usePassesContext();
  const { publicKey, isDemoMode, signAndSendMemoTx } = useWallet();

  const [selectedType, setSelectedType] = useState<GhostPassType>('Confession');
  const [selectedRadius, setSelectedRadius] = useState(91); // Event area: 300 ft
  const [title, setTitle] = useState('');
  const [clue, setClue] = useState('');
  const [secretReveal, setSecretReveal] = useState('');
  const [proof, setProof] = useState<ProofState>({ status: 'idle' });

  const color = TYPE_COLORS[selectedType];
  const emoji = TYPE_EMOJI[selectedType];
  const isBusy = proof.status === 'sending' || proof.status === 'done';

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a title for your GhostPass.');
      return;
    }
    if (!clue.trim()) {
      Alert.alert('Missing clue', 'Please enter a clue / teaser.');
      return;
    }
    if (!secretReveal.trim()) {
      Alert.alert('Missing secret', 'Please enter the secret reveal text.');
      return;
    }

    const newPass: GhostPass = {
      id: 'gp_user_' + Date.now(),
      type: selectedType,
      title: title.trim(),
      clue: clue.trim(),
      secretReveal: secretReveal.trim(),
      creatorWallet: publicKey ?? getDemoKeypairPubkey(),
      distanceMeters: 0,
      radiusMeters: selectedRadius,
      expiresIn: '24h',
      maxUnlocks: 20,
      unlockCount: 0,
    };

    addPass(newPass);
    setProof({ status: 'sending' });

    let result: ProofResult;
    if (!isDemoMode && publicKey) {
      // Real wallet path: build unsigned tx, ask wallet to sign, submit to devnet.
      try {
        const txBytes = await buildCreateTx(newPass, publicKey);
        const mwaResult = await signAndSendMemoTx(txBytes);
        result = mwaResult.ok ? mwaResult.result : await sendCreateProof(newPass);
      } catch {
        result = await sendCreateProof(newPass);
      }
    } else {
      result = await sendCreateProof(newPass);
    }

    if (result.kind === 'live-devnet-success') {
      updatePassSig(newPass.id, result.sig);
    }
    setProof({ status: 'done', result });
    // Auto-navigate after 2.5s so judges can see the proof status
    setTimeout(() => {
      navigation.navigate('Main');
      resetForm();
    }, 2500);
  };

  const resetForm = () => {
    setTitle('');
    setClue('');
    setSecretReveal('');
    setSelectedType('Confession');
    setSelectedRadius(91);
    setProof({ status: 'idle' });
  };

  // ── Proof overlay ─────────────────────────────────────────────────────────
  if (proof.status === 'sending' || proof.status === 'done') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.proofOverlay}>
          {proof.status === 'sending' && (
            <>
              <ActivityIndicator color={COLORS.primary} size="large" style={{ marginBottom: 20 }} />
              <Text style={styles.proofTitle}>Recording Proof…</Text>
              <Text style={styles.proofSub}>
                Attempting GHOSTPASS_CREATE memo on Solana devnet
              </Text>
              {isDemoMode ? (
                <Text style={styles.proofNote}>⚡ Demo keypair — not your real wallet</Text>
              ) : (
                <Text style={styles.proofNote}>◎ Open your wallet app to approve</Text>
              )}
            </>
          )}

          {proof.status === 'done' && proof.result.kind === 'live-devnet-success' && (
            <>
              <Text style={styles.proofSuccessIcon}>✅</Text>
              <Text style={styles.proofTitle}>Solana Proof Recorded</Text>
              <View style={styles.sigBox}>
                <Text style={styles.sigLabel}>DEVNET TRANSACTION</Text>
                <Text style={styles.sigValue}>{shortenSig(proof.result.sig)}</Text>
              </View>
              <Text style={styles.proofSub}>
                GHOSTPASS_CREATE memo on Solana devnet
              </Text>
              <Text style={styles.proofNote}>
                solana explorer: devnet/{'\n'}{devnetExplorerUrl(proof.result.sig).replace('https://explorer.solana.com/', '')}
              </Text>
              <Text style={styles.proofRedirect}>Navigating to Feed…</Text>
            </>
          )}

          {proof.status === 'done' && proof.result.kind === 'local-demo-fallback' && (
            <>
              <Text style={styles.proofSuccessIcon}>⚡</Text>
              <Text style={styles.proofTitle}>Local Demo Proof</Text>
              <View style={styles.sigBox}>
                <Text style={styles.sigLabel}>LOCAL PROOF ID — NOT ON-CHAIN</Text>
                <Text style={styles.sigValue}>{proof.result.localId}</Text>
              </View>
              <Text style={styles.proofSub}>
                {proof.result.reason}.
              </Text>
              <Text style={styles.proofNote}>
                Live Solana devnet proof records automatically when RPC is available.
              </Text>
              <Text style={styles.proofRedirect}>Navigating to Feed…</Text>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── Normal form ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Create GhostPass</Text>
        <Text style={styles.pageSub}>Hide a secret at your current location.</Text>

        {isDemoMode && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>
              ⚡ Demo Mode — Solana devnet proof via session keypair
            </Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>TYPE</Text>
        <View style={styles.typeGrid}>
          {ALL_TYPES.map(type => {
            const isSelected = type === selectedType;
            const c = TYPE_COLORS[type];
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeBtn,
                  isSelected
                    ? { backgroundColor: c + '22', borderColor: c }
                    : { borderColor: COLORS.cardBorder },
                ]}
                onPress={() => setSelectedType(type)}
                activeOpacity={0.75}
              >
                <Text style={styles.typeBtnEmoji}>{TYPE_EMOJI[type]}</Text>
                <Text
                  style={[
                    styles.typeBtnText,
                    isSelected ? { color: c } : { color: COLORS.textSecondary },
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>TITLE</Text>
        <TextInput
          style={styles.input}
          placeholder="Give your GhostPass a name"
          placeholderTextColor={COLORS.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.sectionLabel}>CLUE / TEASER</Text>
        <Text style={styles.fieldNote}>Visible to all explorers before unlock.</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="A hint that draws people closer..."
          placeholderTextColor={COLORS.textMuted}
          value={clue}
          onChangeText={setClue}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.sectionLabel}>SECRET REVEAL</Text>
        <Text style={styles.fieldNote}>
          Only revealed after location + wallet unlock. Hashed on-chain — not stored as plaintext.
        </Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="Your secret message, invite, or clue..."
          placeholderTextColor={COLORS.textMuted}
          value={secretReveal}
          onChangeText={setSecretReveal}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.sectionLabel}>UNLOCK DISTANCE</Text>
        <Text style={styles.fieldNote}>
          Explorers must be within this distance to reveal the secret.
        </Text>
        <View style={styles.radiusRow}>
          {RADIUS_PRESETS.map(preset => {
            const isSelected = selectedRadius === preset.meters;
            return (
              <TouchableOpacity
                key={preset.label}
                style={[styles.radiusBtn, isSelected && styles.radiusBtnActive]}
                onPress={() => setSelectedRadius(preset.meters)}
                activeOpacity={0.75}
              >
                <Text style={[styles.radiusBtnLabel, isSelected && styles.radiusBtnLabelActive]}>
                  {preset.label}
                </Text>
                <Text style={[styles.radiusBtnFeet, isSelected && styles.radiusBtnFeetActive]}>
                  {preset.display}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.settingsRow}>
          <View style={styles.settingBox}>
            <Text style={styles.settingLabel}>RADIUS</Text>
            <Text style={styles.settingValue}>
              {RADIUS_PRESETS.find(p => p.meters === selectedRadius)?.display ?? '300 ft'}
            </Text>
          </View>
          <View style={styles.settingBox}>
            <Text style={styles.settingLabel}>EXPIRES</Text>
            <Text style={styles.settingValue}>24h</Text>
          </View>
          <View style={styles.settingBox}>
            <Text style={styles.settingLabel}>MAX UNLOCKS</Text>
            <Text style={styles.settingValue}>20</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: color }, isBusy && styles.btnDisabled]}
          onPress={handleCreate}
          disabled={isBusy}
          activeOpacity={0.85}
        >
          <Text style={styles.createBtnText}>{emoji} Create & Record on Solana</Text>
          <Text style={styles.createBtnNote}>Records proof on Solana devnet when available</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 26, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
  pageSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 20 },
  demoBanner: {
    backgroundColor: COLORS.goldDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.gold + '33',
    marginBottom: 16,
  },
  demoBannerText: { color: COLORS.gold, fontSize: 12, fontWeight: '600' },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 20,
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    width: '30.5%',
    alignItems: 'center',
    gap: 4,
  },
  typeBtnEmoji: { fontSize: 20 },
  typeBtnText: { fontSize: 10, textAlign: 'center', fontWeight: '600' },
  fieldNote: { fontSize: 12, color: COLORS.textMuted, marginBottom: 8, marginTop: -4 },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    color: COLORS.textPrimary,
    padding: 14,
    fontSize: 15,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  settingsRow: { flexDirection: 'row', gap: 10, marginTop: 24, marginBottom: 24 },
  settingBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 12,
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  settingValue: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  radiusRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  radiusBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 3,
  },
  radiusBtnActive: {
    backgroundColor: COLORS.primary + '22',
    borderColor: COLORS.primary,
  },
  radiusBtnLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted },
  radiusBtnLabelActive: { color: COLORS.primary },
  radiusBtnFeet: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary },
  radiusBtnFeetActive: { color: COLORS.primary },
  createBtn: { borderRadius: 14, padding: 18, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  createBtnNote: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 },
  // Proof overlay
  proofOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  proofSuccessIcon: { fontSize: 52 },
  proofFailIcon: { fontSize: 52 },
  proofTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  proofSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  proofNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
  sigBox: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.accent + '44',
    alignItems: 'center',
    gap: 4,
  },
  sigLabel: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.5 },
  sigValue: {
    fontSize: 14,
    color: COLORS.accent,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  proofRedirect: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
  continueBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 8,
  },
  continueBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
