import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
import { GhostPass } from '../data/types';
import { haversineDistance } from '../utils/distance';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface LocationState {
  location: LocationCoords | null;
  permissionStatus: PermissionStatus;
  loading: boolean;
  simulateNearby: boolean;
}

interface LocationContextValue extends LocationState {
  requestPermission: () => Promise<void>;
  setSimulateNearby: (value: boolean) => void;
  /** Returns computed distance in meters (or static fallback if GPS unavailable). */
  getDistanceTo: (pass: GhostPass) => number;
  /** True if user is within unlock radius, or simulateNearby is on. */
  isUnlockable: (pass: GhostPass) => boolean;
}

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LocationState>({
    location: null,
    permissionStatus: 'undetermined',
    loading: false,
    simulateNearby: false,
  });

  // Check existing permission on mount — get location if already granted
  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        await fetchLocation();
      } else {
        setState(s => ({
          ...s,
          permissionStatus: status === 'denied' ? 'denied' : 'undetermined',
        }));
      }
    })();
  }, []);

  const fetchLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setState(s => ({
        ...s,
        location: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
        permissionStatus: 'granted',
        loading: false,
      }));
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  };

  const requestPermission = useCallback(async () => {
    if (state.permissionStatus === 'granted') {
      // Already granted — just refresh location
      setState(s => ({ ...s, loading: true }));
      await fetchLocation();
      return;
    }
    setState(s => ({ ...s, loading: true }));
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      await fetchLocation();
    } else {
      setState(s => ({ ...s, permissionStatus: 'denied', loading: false }));
    }
  }, [state.permissionStatus]);

  const setSimulateNearby = useCallback((value: boolean) => {
    setState(s => ({ ...s, simulateNearby: value }));
  }, []);

  const getDistanceTo = useCallback(
    (pass: GhostPass): number => {
      if (state.simulateNearby) return 0;
      if (
        state.location &&
        pass.latitude != null &&
        pass.longitude != null
      ) {
        return Math.round(
          haversineDistance(
            state.location.latitude,
            state.location.longitude,
            pass.latitude,
            pass.longitude,
          ),
        );
      }
      return pass.distanceMeters;
    },
    [state.location, state.simulateNearby],
  );

  const isUnlockable = useCallback(
    (pass: GhostPass): boolean => {
      if (state.simulateNearby) return true;
      return getDistanceTo(pass) <= pass.radiusMeters;
    },
    [getDistanceTo, state.simulateNearby],
  );

  return (
    <LocationContext.Provider
      value={{ ...state, requestPermission, setSimulateNearby, getDistanceTo, isUnlockable }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationContext must be used inside LocationProvider');
  return ctx;
}
