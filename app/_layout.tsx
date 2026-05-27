import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "../src/providers/AuthProvider";
import { I18nProvider } from "../src/i18n/I18nProvider";
import { TryOnConfigProvider } from "../src/providers/TryOnConfigProvider";
import { NotificationsProvider } from "../src/providers/NotificationsProvider";
import { colors } from "../src/theme/tokens";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nProvider>
        <TryOnConfigProvider>
          <AuthProvider>
            <NotificationsProvider>
              <StatusBar style="light" backgroundColor={colors.background} />
              <Stack screenOptions={{ headerShown: false }} />
            </NotificationsProvider>
          </AuthProvider>
        </TryOnConfigProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}
