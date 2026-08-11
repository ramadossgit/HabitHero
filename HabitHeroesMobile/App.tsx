// Habit Heroes mobile app.
//
// The mobile app renders the SAME web application (same landing page,
// login, signup, dashboard, Game Zone) inside a native WebView shell, so
// the theme and features always match the website exactly — nothing is
// duplicated or re-skinned for mobile.
//
// The server URL comes from app.json → expo.extra.serverUrl. For a real
// phone on your network, change it to your machine's LAN address, e.g.
// "http://192.168.1.20:5000" (Android emulators can use
// "http://10.0.2.2:5000" to reach the host machine).

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';
// react-native's own SafeAreaView is deprecated and iOS-only; this one
// also honours Android cutouts and provides the insets hook below
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const FALLBACK_URL = 'http://localhost:5000';

export function getServerUrl(): string {
  const configured = (Constants.expoConfig?.extra as any)?.serverUrl;
  const base = typeof configured === 'string' && configured.length > 0 ? configured : FALLBACK_URL;
  // Android emulators cannot reach the host via localhost
  if (Platform.OS === 'android' && /^https?:\/\/localhost(:|\/|$)/.test(base)) {
    return base.replace('localhost', '10.0.2.2');
  }
  return base;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppShell />
    </SafeAreaProvider>
  );
}

function AppShell() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const serverUrl = getServerUrl();
  const insets = useSafeAreaInsets();

  // WKWebView reports env(safe-area-inset-*) as 0 for remote pages, so the
  // page would render under the notch/status bar. Hand the real device
  // insets to the web app as CSS variables instead.
  const safeAreaScript = `
    (function () {
      var r = document.documentElement;
      r.style.setProperty('--safe-top', '${Math.round(insets.top)}px');
      r.style.setProperty('--safe-bottom', '${Math.round(insets.bottom)}px');
      r.style.setProperty('--safe-left', '${Math.round(insets.left)}px');
      r.style.setProperty('--safe-right', '${Math.round(insets.right)}px');
      r.classList.add('native-shell');
    })();
    true;
  `;

  // Android hardware back navigates the web app instead of closing it
  useEffect(() => {
    const onBack = () => {
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [canGoBack]);

  // react-native-webview is native-only — on web it renders a "not supported"
  // placeholder. An iframe shows the same page, which is all the shell does.
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {React.createElement('iframe', {
          src: serverUrl,
          title: 'Habit Heroes',
          style: { width: '100%', height: '100%', border: 'none' },
        })}
      </View>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorScreen}>
          <Text style={styles.errorEmoji}>🦸</Text>
          <Text style={styles.errorTitle}>Can't reach Habit Heroes</Text>
          <Text style={styles.errorDetail}>
            {serverUrl}
            {'\n'}
            {loadError}
          </Text>
          <Text style={styles.errorHint}>
            Make sure the Habit Heroes server is running and that
            app.json → extra.serverUrl points to it (use your computer's
            LAN IP when testing on a phone).
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoadError(null);
              setReloadKey((k) => k + 1);
            }}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  return (
    // Full-bleed: the web app paints edge-to-edge (its gradient covers the
    // notch/home-indicator areas) and pads its own content using the
    // --safe-* CSS variables injected below, so no native-colored bars show
    // and nothing hides under the status bar.
    <View style={styles.container}>
      <WebView
        key={reloadKey}
        ref={webViewRef}
        source={{ uri: serverUrl }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        allowsBackForwardNavigationGestures
        pullToRefreshEnabled
        contentInsetAdjustmentBehavior="never"
        injectedJavaScriptBeforeContentLoaded={safeAreaScript}
        injectedJavaScript={safeAreaScript}
        onLoadEnd={() => webViewRef.current?.injectJavaScript(safeAreaScript)}
        onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
        onError={(e) => setLoadError(e.nativeEvent.description || 'Connection failed')}
        onHttpError={(e) => {
          if (e.nativeEvent.statusCode >= 500) {
            setLoadError(`Server error (${e.nativeEvent.statusCode})`);
          }
        }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingScreen}>
            <Text style={styles.loadingEmoji}>🦸</Text>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading Habit Heroes...</Text>
          </View>
        )}
      />
      <StatusBar style="light" translucent />
    </View>
  );
}

// Shell chrome matches the web app's coral hero theme
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B6B',
  },
  webview: {
    flex: 1,
  },
  loadingScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingEmoji: {
    fontSize: 56,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  errorScreen: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  errorEmoji: {
    fontSize: 56,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorDetail: {
    color: '#FFE3E3',
    fontSize: 13,
    textAlign: 'center',
  },
  errorHint: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  retryText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '800',
  },
});
