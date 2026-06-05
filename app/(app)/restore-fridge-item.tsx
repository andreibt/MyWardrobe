import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useI18n } from "../../src/i18n/I18nProvider";
import { restoreFridgeItem } from "../../src/lib/firestore/fridgeItems";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value ?? "";

export default function RestoreFridgeItemScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[]; name?: string | string[] }>();
  const [expirationDate, setExpirationDate] = useState("");
  const [error, setError] = useState("");
  const itemId = getParam(params.id);

  const handleRestore = async () => {
    if (!itemId || !/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) {
      setError("fridge_add.validation.expiration_date");
      return;
    }
    await restoreFridgeItem(itemId, expirationDate);
    router.replace("/(app)/(fridge)/fridge-list");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("fridge_restore.title")}</Text>
      <Text style={styles.subtitle}>{t("fridge_restore.subtitle", { name: getParam(params.name) })}</Text>
      <Text style={styles.label}>{t("fridge_add.label.expiration_date")}</Text>
      {Platform.OS === "web" ? (
        <input
          type="date"
          value={expirationDate}
          onChange={(event) => setExpirationDate(event.target.value)}
          style={styles.webDateInput}
        />
      ) : (
        <TextInput
          value={expirationDate}
          onChangeText={setExpirationDate}
          placeholder={t("fridge_add.placeholder.expiration_date")}
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
      )}
      {error ? <Text style={styles.error}>{t(error)}</Text> : null}
      <Pressable onPress={handleRestore} style={styles.restoreButton}>
        <Text style={styles.restoreText}>{t("fridge_restore.button")}</Text>
      </Pressable>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.cancelText}>{t("edit.cancel")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.background },
  title: { color: colors.text, ...typography.h1 },
  subtitle: { color: colors.muted, ...typography.body },
  label: { marginTop: spacing.sm, color: colors.text, ...typography.caption, textTransform: "uppercase" },
  input: { padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
  webDateInput: { padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
  error: { color: colors.danger, ...typography.caption },
  restoreButton: { alignItems: "center", marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.accent },
  restoreText: { color: colors.background, ...typography.h2 },
  cancelText: { color: colors.primary, textAlign: "center", ...typography.body },
});
