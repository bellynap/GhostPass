import React, { createContext, useContext, useState } from 'react';
import { GhostPass, ProofBadge } from '../data/types';
import { DEMO_PASSES, DEMO_BADGES } from '../data/demoData';

interface PassesContextValue {
  passes: GhostPass[];
  addPass: (pass: GhostPass) => void;
  updatePassSig: (passId: string, sig: string) => void;
  badges: ProofBadge[];
  addBadge: (badge: ProofBadge) => void;
  isPassClaimed: (passId: string) => boolean;
}

const PassesContext = createContext<PassesContextValue | null>(null);

export function PassesProvider({ children }: { children: React.ReactNode }) {
  const [passes, setPasses] = useState<GhostPass[]>([...DEMO_PASSES]);
  const [badges, setBadges] = useState<ProofBadge[]>([...DEMO_BADGES]);

  const addPass = (pass: GhostPass) => {
    setPasses(prev => [pass, ...prev]);
  };

  const updatePassSig = (passId: string, sig: string) => {
    setPasses(prev =>
      prev.map(p => (p.id === passId ? { ...p, createTxSignature: sig } : p)),
    );
  };

  const addBadge = (badge: ProofBadge) => {
    setBadges(prev => {
      // Avoid duplicate badges for the same pass
      if (prev.some(b => b.passId === badge.passId)) return prev;
      return [badge, ...prev];
    });
  };

  const isPassClaimed = (passId: string): boolean =>
    badges.some(b => b.passId === passId);

  return (
    <PassesContext.Provider value={{ passes, addPass, updatePassSig, badges, addBadge, isPassClaimed }}>
      {children}
    </PassesContext.Provider>
  );
}

export function usePassesContext(): PassesContextValue {
  const ctx = useContext(PassesContext);
  if (!ctx) throw new Error('usePassesContext must be used inside PassesProvider');
  return ctx;
}
