import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { WalletProvider } from './src/context/WalletContext';
import { PassesProvider } from './src/context/PassesContext';
import { LocationProvider } from './src/context/LocationContext';

// Suppress Solana devnet RPC noise from appearing as bottom error toasts.
// The app already handles these errors gracefully with local demo proof fallback.
LogBox.ignoreLogs([
  'Server responded with 429',
  'Retrying after',
  'Failed to fetch',
  'Network request failed',
  'airdrop',
]);

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <WalletProvider>
        <PassesProvider>
          <LocationProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </LocationProvider>
        </PassesProvider>
      </WalletProvider>
    </SafeAreaProvider>
  );
}
