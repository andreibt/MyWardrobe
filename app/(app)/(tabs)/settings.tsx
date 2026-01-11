import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../../../src/providers/AuthProvider";
import { colors, radius, spacing, typography } from "../../../src/theme/tokens";

export default function SettingsScreen() {
  const { user, signOut, isLoading } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Signed in as {user?.email ?? ""}</Text>

      <Pressable
        disabled={isLoading}
        onPress={signOut}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    ...typography.h1,
  },
  subtitle: {
    color: colors.muted,
    ...typography.body,
  },
  button: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: colors.surface,
    ...typography.body,
  },
});
