import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "../src/providers/AuthProvider";
import { I18nProvider } from "../src/i18n/I18nProvider";
import { TryOnConfigProvider } from "../src/providers/TryOnConfigProvider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nProvider>
        <TryOnConfigProvider>
          <AuthProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
          </AuthProvider>
        </TryOnConfigProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}
