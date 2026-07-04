import { zodResolver } from "@hookform/resolvers/zod";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import { z } from "zod";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../../src/i18n/I18nProvider";
import { useAuth } from "../../src/providers/AuthProvider";
import { useTheme, type AppTheme } from "../../src/providers/ThemeProvider";
import { spacing, typography } from "../../src/theme/tokens";

const loginSchema = z.object({
  email: z.string().min(1, "validation.email_required").email("validation.email_invalid"),
  password: z.string().min(1, "validation.password_required").min(6, "validation.password_min"),
});

type LoginForm = z.infer<typeof loginSchema>;

const getLoginErrorKey = (error: unknown) => {
  if (typeof error !== "object" || error === null) {
    return "login.error_generic";
  }

  const payload = error as { code?: string; message?: string };
  if (
    payload.code === "auth/invalid-credential" ||
    payload.message?.includes("INVALID_LOGIN_CREDENTIALS")
  ) {
    return "login.error_invalid_credentials";
  }

  return "login.error_generic";
};

const getRegistrationErrorKey = (error: unknown) => {
  if (typeof error !== "object" || error === null) {
    return "register.error_generic";
  }

  const payload = error as { code?: string };
  if (payload.code === "auth/email-already-in-use") {
    return "register.error_email_in_use";
  }
  if (payload.code === "auth/invalid-email") {
    return "validation.email_invalid";
  }
  if (payload.code === "auth/weak-password") {
    return "validation.password_min";
  }

  return "register.error_generic";
};

export default function LoginScreen() {
  const { createAccount, signIn, isLoading } = useAuth();
  const router = useRouter();
  const { t, language, setLanguage } = useI18n();
  const { mode, setMode, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const loginColors = theme.colors;
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
    setLoginError(null);
    try {
      if (isRegistering) {
        await createAccount(data.email, data.password);
      } else {
        await signIn(data.email, data.password);
      }
      router.replace("/(app)/tutorial");
    } catch (error) {
      setLoginError(isRegistering ? getRegistrationErrorKey(error) : getLoginErrorKey(error));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + spacing.sm, spacing.md),
            paddingBottom: Math.max(insets.bottom + spacing.lg, spacing.xl),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <View style={styles.themeRow}>
            {(["light", "dark"] as const).map((themeMode) => {
              const isActive = mode === themeMode;
              return (
                <Pressable
                  key={themeMode}
                  onPress={() => setMode(themeMode)}
                  style={({ pressed }) => [
                    styles.themeButton,
                    isActive && styles.themeButtonActive,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${themeMode} theme`}
                >
                  <MaterialCommunityIcons
                    name={themeMode === "light" ? "white-balance-sunny" : "moon-waning-crescent"}
                    color={isActive ? loginColors.logoTint : loginColors.textMuted}
                    size={16}
                  />
                  <Text style={[styles.themeText, isActive && styles.themeTextActive]}>
                    {themeMode === "light" ? "Light" : "Dark"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.languageRow}>
            {(["en", "ro"] as const).map((code) => {
              const isActive = language === code;
              return (
                <Pressable
                  key={code}
                  onPress={() => setLanguage(code)}
                  style={({ pressed }) => [
                    styles.languageButton,
                    isActive && styles.languageButtonActive,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[styles.languageText, isActive && styles.languageTextActive]}>
                    {t(code === "en" ? "login.language_en" : "login.language_ro")}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.brandArea}>
          <View style={styles.brandIcon}>
            <Image
              source={require("../../src/assets/logos/polarNestLogoNoBg.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>
            {isRegistering ? t("register.button") : "Welcome back"}
          </Text>
          <Text style={styles.subtitle}>
            {isRegistering ? t("register.footer") : "Sign in to manage your home"}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.field}>
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
                  placeholderTextColor={loginColors.muted}
                  style={[styles.input, errors.email && styles.inputError]}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={(nextValue) => {
                    setLoginError(null);
                    onChange(nextValue);
                  }}
                />
              )}
            />
            {errors.email ? (
              <Text style={styles.error}>{t(errors.email.message ?? "")}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t("login.label.password")}</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  autoCapitalize="none"
                  placeholder={t("login.placeholder.password")}
                  placeholderTextColor={loginColors.muted}
                  secureTextEntry
                  style={[styles.input, errors.password && styles.inputError]}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={(nextValue) => {
                    setLoginError(null);
                    onChange(nextValue);
                  }}
                />
              )}
            />
            {errors.password ? (
              <Text style={styles.error}>{t(errors.password.message ?? "")}</Text>
            ) : null}
          </View>
          {loginError ? <Text style={styles.error}>{t(loginError)}</Text> : null}

          {!isRegistering ? (
            <View style={styles.formOptions}>
              <Pressable
                onPress={() => setRememberMe((current) => !current)}
                style={({ pressed }) => [styles.rememberControl, pressed && styles.buttonPressed]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: rememberMe }}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe ? (
                    <MaterialCommunityIcons name="check" color={loginColors.logoTint} size={14} />
                  ) : null}
                </View>
                <Text style={styles.optionText}>Remember me</Text>
              </Pressable>
              <Text style={styles.optionLink}>Forgot password?</Text>
            </View>
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
              <ActivityIndicator color={loginColors.background} />
            ) : (
              <Text style={styles.buttonText}>
                {t(isRegistering ? "register.button" : "login.button")}
              </Text>
            )}
          </Pressable>

          {!isRegistering ? (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialRow}>
                <View style={styles.socialButton}>
                  <MaterialCommunityIcons name="google" color={loginColors.text} size={18} />
                  <Text style={styles.socialText}>Google</Text>
                </View>
                <View style={styles.socialButton}>
                  <MaterialCommunityIcons name="apple" color={loginColors.text} size={20} />
                  <Text style={styles.socialText}>Apple</Text>
                </View>
              </View>
            </>
          ) : null}

          <Pressable
            disabled={isLoading}
            onPress={() => {
              setLoginError(null);
              setIsRegistering((current) => !current);
            }}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
              isLoading && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.secondaryButtonText}>
              {t(isRegistering ? "register.back_to_login" : "register.create_account")}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>
          {t(isRegistering ? "register.footer" : "login.footer")}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: AppTheme) => {
  const loginColors = theme.colors;

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: loginColors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    gap: spacing.md,
    justifyContent: "flex-start",
  },
  topBar: {
    gap: spacing.sm,
  },
  themeRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 6,
    padding: 3,
    borderRadius: 999,
    backgroundColor: loginColors.surface2,
    borderWidth: 1,
    borderColor: loginColors.border,
  },
  themeButton: {
    flex: 1,
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  themeButtonActive: {
    backgroundColor: loginColors.primary,
  },
  themeText: {
    color: loginColors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  themeTextActive: {
    color: loginColors.logoTint,
  },
  languageRow: {
    alignSelf: "flex-end",
    flexDirection: "row",
    gap: 6,
    padding: 3,
    borderRadius: 999,
    backgroundColor: loginColors.surface2,
    borderWidth: 1,
    borderColor: loginColors.border,
  },
  languageButton: {
    minHeight: 30,
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  languageButtonActive: {
    backgroundColor: loginColors.surface3,
  },
  languageText: {
    color: loginColors.textMuted,
    ...typography.caption,
    fontWeight: "600",
  },
  languageTextActive: {
    color: loginColors.primary,
  },
  brandArea: {
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  brandIcon: {
    width: 116,
    height: 116,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    borderRadius: 28,
    backgroundColor: theme.isDark ? loginColors.surface : "#0D1117",
    borderWidth: 1,
    borderColor: loginColors.border,
    shadowColor: loginColors.primary,
    shadowOpacity: theme.isDark ? 0.24 : 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  logo: {
    width: 108,
    height: 108,
  },
  title: {
    color: loginColors.text,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: loginColors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  card: {
    backgroundColor: "transparent",
    borderRadius: 0,
    padding: 0,
    borderWidth: 0,
    gap: spacing.md,
  },
  field: {
    gap: 6,
  },
  label: {
    color: loginColors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: loginColors.border,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: loginColors.text,
    backgroundColor: loginColors.surface,
    fontSize: 15,
    lineHeight: 20,
  },
  inputError: {
    borderColor: loginColors.danger,
  },
  error: {
    color: loginColors.danger,
    ...typography.caption,
  },
  formOptions: {
    marginTop: -2,
    marginBottom: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  rememberControl: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  checkbox: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: loginColors.border,
    backgroundColor: loginColors.surface,
  },
  checkboxActive: {
    borderColor: loginColors.primary,
    backgroundColor: loginColors.primary,
  },
  optionText: {
    color: loginColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  optionLink: {
    color: loginColors.primary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  button: {
    minHeight: 52,
    backgroundColor: loginColors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: loginColors.logoTint,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: loginColors.border,
  },
  dividerText: {
    color: loginColors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  socialRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  socialButton: {
    flex: 1,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: loginColors.border,
    backgroundColor: loginColors.surface2,
  },
  socialText: {
    color: loginColors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  secondaryButton: {
    minHeight: 44,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: loginColors.border,
    backgroundColor: loginColors.surface,
  },
  secondaryButtonText: {
    color: loginColors.primary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  footer: {
    textAlign: "center",
    color: loginColors.textMuted,
    ...typography.caption,
  },
  });
};
