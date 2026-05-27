import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useI18n } from "../../src/i18n/I18nProvider";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

const loginSchema = z.object({
  email: z.string().email("validation.email_invalid"),
  password: z.string().min(6, "validation.password_min"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();
  const router = useRouter();
  const { t, language, setLanguage } = useI18n();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    await signIn(data.email, data.password);
    router.replace("/(app)/tutorial");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.languageSection}>
          <Text style={styles.languageLabel}>{t("login.language_label")}</Text>
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
                {t("login.language_en")}
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
                {t("login.language_ro")}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{t("login.title")}</Text>
          <Text style={styles.subtitle}>{t("login.subtitle")}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{t("login.label.email")}</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder={t("login.placeholder.email")}
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
              />
            )}
          />
          {errors.email ? (
            <Text style={styles.error}>{t(errors.email.message)}</Text>
          ) : null}

          <Text style={styles.label}>{t("login.label.password")}</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                autoCapitalize="none"
                placeholder={t("login.placeholder.password")}
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={styles.input}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
              />
            )}
          />
          {errors.password ? (
            <Text style={styles.error}>{t(errors.password.message)}</Text>
          ) : null}

          <Pressable
            disabled={isLoading}
            onPress={handleSubmit(onSubmit)}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              isLoading && styles.buttonDisabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.buttonText}>{t("login.button")}</Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.footer}>{t("login.footer")}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    justifyContent: "flex-start",
  },
  languageSection: {
    gap: spacing.xs,
  },
  languageLabel: {
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
  header: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    ...typography.h1,
  },
  subtitle: {
    color: colors.muted,
    ...typography.body,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: colors.text,
    backgroundColor: colors.card,
  },
  error: {
    color: "#B00020",
    ...typography.caption,
  },
  button: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.background,
    ...typography.h2,
  },
  footer: {
    textAlign: "center",
    color: colors.muted,
    ...typography.caption,
  },
});
