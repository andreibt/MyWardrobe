import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useI18n } from "../../../src/i18n/I18nProvider";
import { getAISettings, saveAISettings, type AIMode } from "../../../src/lib/aiSettings";
import { useAuth } from "../../../src/providers/AuthProvider";
import { colors, radius, spacing, typography } from "../../../src/theme/tokens";

export default function SettingsScreen() {
  const { user, signOut, isLoading } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const [aiMode, setAIMode] = useState<AIMode>("local");
  const [apiKey, setApiKey] = useState("");
  const [isSavingAI, setIsSavingAI] = useState(false);
  const [isAISaved, setIsAISaved] = useState(false);

  useEffect(() => {
    getAISettings().then((settings) => {
      setAIMode(settings.mode);
      setApiKey(settings.apiKey);
    });
  }, []);

  const saveSettings = async (nextMode = aiMode) => {
    setIsSavingAI(true);
    setIsAISaved(false);
    try {
      await saveAISettings({ mode: nextMode, apiKey: apiKey.trim() });
      setIsAISaved(true);
    } finally {
      setIsSavingAI(false);
    }
  };

  const selectAIMode = (nextMode: AIMode) => {
    setAIMode(nextMode);
    saveSettings(nextMode).catch(() => {});
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.ai")}</Text>
        <View style={styles.languageRow}>
          {(["local", "cloud"] as const).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => selectAIMode(mode)}
              style={({ pressed }) => [
                styles.languageButton,
                aiMode === mode && styles.languageButtonActive,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={[styles.languageText, aiMode === mode && styles.languageTextActive]}>
                {t(mode === "local" ? "settings.ai_local" : "settings.ai_cloud")}
              </Text>
            </Pressable>
          ))}
        </View>
        {aiMode === "cloud" ? (
          <>
            {Platform.OS === "web" ? (
              <Text style={styles.hintText}>{t("settings.ai_cloud_web_hint")}</Text>
            ) : null}
            <Text style={styles.sectionTitle}>{t("settings.ai_api_key")}</Text>
            <TextInput
              value={apiKey}
              onChangeText={(value) => {
                setApiKey(value);
                setIsAISaved(false);
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t("settings.ai_api_key_placeholder")}
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
            <Pressable
              disabled={isSavingAI}
              onPress={() => saveSettings()}
              style={({ pressed }) => [styles.saveButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.buttonText}>
                {t(isSavingAI ? "settings.ai_saving" : "settings.ai_save")}
              </Text>
            </Pressable>
            {isAISaved ? <Text style={styles.savedText}>{t("settings.ai_saved")}</Text> : null}
          </>
        ) : null}
      </View>

      <Pressable
        disabled={isLoading}
        onPress={signOut}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>{t("settings.sign_out")}</Text>
      </Pressable>
    </ScrollView>
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: colors.text,
    backgroundColor: colors.card,
  },
  saveButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  savedText: {
    color: colors.accent,
    ...typography.caption,
  },
  hintText: {
    color: colors.muted,
    ...typography.caption,
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
