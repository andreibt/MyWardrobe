import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { DateInput } from "./DateInput";
import { useI18n } from "../i18n/I18nProvider";
import { restoreInventoryItem, type InventoryKind } from "../lib/firestore/inventoryItems";
import { useTheme, type AppTheme } from "../providers/ThemeProvider";
import { radius, spacing, typography } from "../theme/tokens";

type InventoryRestoreScreenProps = {
  kind: InventoryKind;
  title: string;
  buttonLabel: string;
  returnPath: "/(app)/(pantry)/pantry" | "/(app)/(cocktails)/cocktails";
};

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value ?? "";

export function InventoryRestoreScreen({
  kind,
  title,
  buttonLabel,
  returnPath,
}: InventoryRestoreScreenProps) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme, kind), [kind, theme]);
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const itemId = getParam(params.id);
  const itemName = getParam(params.name);
  const [expirationDate, setExpirationDate] = useState("");
  const [error, setError] = useState("");

  const restore = async () => {
    if (!itemId || !/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) {
      setError("fridge_add.validation.expiration_date");
      return;
    }
    await restoreInventoryItem(kind, itemId, expirationDate);
    router.replace(returnPath);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        {t("inventory.restore_subtitle", { name: itemName })}
      </Text>
      <Text style={styles.label}>{t("fridge_add.label.expiration_date")}</Text>
      <DateInput
        value={expirationDate}
        onChange={setExpirationDate}
        placeholder={t("fridge_add.placeholder.expiration_date")}
      />
      {error ? <Text style={styles.error}>{t(error)}</Text> : null}
      <Pressable onPress={restore} style={({ pressed }) => [styles.restoreButton, pressed && styles.buttonPressed]}>
        <Text style={styles.restoreText}>{buttonLabel}</Text>
      </Pressable>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.cancelText}>{t("edit.cancel")}</Text>
      </Pressable>
    </View>
  );
}

const moduleAccent = (kind: InventoryKind) => (kind === "pantry" ? "#E8A838" : "#3BA4F5");

const createStyles = (theme: AppTheme, kind: InventoryKind) => {
  const colors = theme.colors;
  const accent = moduleAccent(kind);

  return StyleSheet.create({
    container: { flex: 1, padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.background },
    title: { color: colors.text, ...typography.h2 },
    subtitle: { color: colors.textMuted, ...typography.body },
    label: { color: colors.textMuted, ...typography.caption, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: "700" },
    error: { color: colors.danger, ...typography.caption },
    restoreButton: { alignItems: "center", marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.pill, backgroundColor: accent },
    restoreText: { color: colors.logoTint, ...typography.body, fontWeight: "700" },
    cancelText: { color: accent, textAlign: "center", ...typography.body },
    buttonPressed: { opacity: 0.85 },
  });
};
