import { Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../../../src/i18n/I18nProvider";
import { useAuth } from "../../../src/providers/AuthProvider";
import { colors, radius, spacing, typography } from "../../../src/theme/tokens";

export default function SettingsScreen() {
  const { user, signOut, isLoading } = useAuth();
  const { t, language, setLanguage } = useI18n();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("settings.title")}</Text>
      <Text style={styles.subtitle}>{t("settings.signed_in_as", { email: user?.email ?? "" })}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.language")}</Text>
        <View style={styles.languageRow}>
          <Pressable
            onPress={() => setLanguage("en")}
            style={({ pressed }) => [
              styles.languageButton,
              language === "en" && styles.languageButtonActive,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text
              style={[
                styles.languageText,
                language === "en" && styles.languageTextActive,
              ]}
            >
              {t("settings.language_en")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setLanguage("ro")}
            style={({ pressed }) => [
              styles.languageButton,
              language === "ro" && styles.languageButtonActive,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text
              style={[
                styles.languageText,
                language === "ro" && styles.languageTextActive,
              ]}
            >
              {t("settings.language_ro")}
            </Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        disabled={isLoading}
        onPress={signOut}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>{t("settings.sign_out")}</Text>
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
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  languageRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  languageButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  languageButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  languageText: {
    color: colors.text,
    ...typography.caption,
  },
  languageTextActive: {
    color: colors.surface,
  },
  button: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: colors.background,
    ...typography.body,
  },
});
