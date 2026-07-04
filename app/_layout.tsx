import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "../src/providers/AuthProvider";
import { I18nProvider } from "../src/i18n/I18nProvider";
import { TryOnConfigProvider } from "../src/providers/TryOnConfigProvider";
import { NotificationsProvider } from "../src/providers/NotificationsProvider";
import { ThemeProvider, useTheme } from "../src/providers/ThemeProvider";
import { stableStackScreenOptions } from "../src/lib/navigationOptions";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <I18nProvider>
            <TryOnConfigProvider>
              <AuthProvider>
                <NotificationsProvider>
                  <ThemedRootStack />
                </NotificationsProvider>
              </AuthProvider>
            </TryOnConfigProvider>
          </I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedRootStack() {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar
        style={theme.isDark ? "light" : "dark"}
        backgroundColor={theme.colors.background}
      />
      <Stack screenOptions={{ ...stableStackScreenOptions, headerShown: false }} />
    </>
  );
}
