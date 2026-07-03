import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../i18n/I18nProvider";
import type { InventoryItem, InventoryKind } from "../lib/firestore/inventoryItems";
import { useTheme, type AppTheme } from "../providers/ThemeProvider";
import { radius, spacing, typography } from "../theme/tokens";

type InventoryCardProps = {
  item: InventoryItem;
  kind: InventoryKind;
  compact?: boolean;
  isHistory?: boolean;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
};

export function InventoryCard({
  item,
  kind,
  compact = false,
  isHistory = false,
  onEdit,
  onArchive,
  onRestore,
}: InventoryCardProps) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, kind), [kind, theme]);
  const colors = theme.colors;
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const imageUri = item.imageSerialized || item.imageUrl;
  const showCalories = kind === "cocktails" && typeof item.calories === "number";

  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <Pressable
        onPress={() => setIsImagePreviewOpen(true)}
        style={({ pressed }) => [
          styles.imageButton,
          compact && styles.compactImageButton,
          pressed && styles.pressed,
        ]}
        accessibilityRole="imagebutton"
        accessibilityLabel={item.name}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <MaterialCommunityIcons
            name={kind === "pantry" ? "food-variant" : "glass-cocktail"}
            color={colors.textMuted}
            size={24}
          />
        )}
      </Pressable>

      <Modal
        visible={isImagePreviewOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsImagePreviewOpen(false)}
      >
        <View style={styles.previewOverlay}>
          <Pressable
            style={styles.previewBackdrop}
            onPress={() => setIsImagePreviewOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t("card.close")}
          />
          <View style={styles.previewContent}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            ) : (
              <View style={styles.previewFallback}>
                <MaterialCommunityIcons
                  name={kind === "pantry" ? "food-variant" : "glass-cocktail"}
                  color={colors.primary}
                  size={48}
                />
              </View>
            )}
            <Pressable
              onPress={() => setIsImagePreviewOpen(false)}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t("card.close")}
            >
              <Text style={styles.closeButtonText}>{t("card.close")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={[styles.content, compact && styles.compactContent]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, compact && styles.compactTitle]} numberOfLines={1}>
            {item.name}
          </Text>
          {showCalories ? (
            <View style={styles.caloriePill}>
              <MaterialCommunityIcons name="flash-outline" color={stylesVars(kind).accent} size={12} />
              <Text style={styles.calorieText}>{item.calories}</Text>
            </View>
          ) : null}
        </View>

        <Text
          style={[styles.description, compact && styles.compactDescription]}
          numberOfLines={compact ? 2 : 1}
        >
          {item.description}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="scale-balance" color={colors.textMuted} size={14} />
            <Text style={styles.metaText} numberOfLines={1}>
              {t("fridge_card.quantity", { quantity: item.quantity, type: item.quantityType })}
            </Text>
          </View>
          {!isHistory && item.expirationDate ? (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="calendar-clock" color={colors.textMuted} size={14} />
              <Text style={styles.metaText} numberOfLines={1}>
                {t("fridge_card.expiration", { date: item.expirationDate })}
              </Text>
            </View>
          ) : null}
        </View>

        {item.tags.length > 0 ? (
          <View style={styles.tags}>
            {item.tags.slice(0, 3).map((tag) => (
              <Text key={tag} style={styles.tag} numberOfLines={1}>
                {tag}
              </Text>
            ))}
          </View>
        ) : null}

        {onEdit || onArchive || onRestore ? (
          <View style={[styles.actions, compact && styles.compactActions]}>
            {onEdit ? (
              <Pressable
                onPress={onEdit}
                style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="pencil-outline" color={colors.text} size={14} />
                <Text style={styles.actionText}>{t("card.edit")}</Text>
              </Pressable>
            ) : null}
            {onArchive ? (
              <Pressable
                onPress={onArchive}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.archiveButton,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialCommunityIcons name="archive-outline" color={colors.danger} size={14} />
                <Text style={styles.archiveText}>{t("fridge_card.archive")}</Text>
              </Pressable>
            ) : null}
            {onRestore ? (
              <Pressable
                onPress={onRestore}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.restoreButton,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialCommunityIcons name="backup-restore" color={colors.accent} size={14} />
                <Text style={styles.restoreText}>{t("fridge_card.restore")}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const stylesVars = (kind: InventoryKind) => ({
  accent: kind === "pantry" ? "#E8A838" : "#3BA4F5",
});

const createStyles = (theme: AppTheme, kind: InventoryKind) => {
  const colors = theme.colors;
  const moduleAccent = stylesVars(kind).accent;
  const accentDim = kind === "pantry" ? "rgba(232, 168, 56, 0.12)" : "rgba(59, 164, 245, 0.12)";

  return StyleSheet.create({
    card: {
      flexDirection: "row",
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      shadowColor: "#000",
      shadowOpacity: theme.isDark ? 0.18 : 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    compactCard: {
      flexDirection: "column",
      gap: 0,
      padding: 0,
      overflow: "hidden",
    },
    imageButton: {
      width: 58,
      height: 58,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      borderRadius: 12,
      backgroundColor: colors.surface3,
    },
    compactImageButton: {
      width: "100%",
      height: undefined,
      aspectRatio: 1,
      borderRadius: 0,
    },
    image: {
      width: "100%",
      height: "100%",
      backgroundColor: colors.surface3,
    },
    previewOverlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.md,
      backgroundColor: "rgba(0, 0, 0, 0.86)",
    },
    previewBackdrop: { ...StyleSheet.absoluteFillObject },
    previewContent: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
    },
    previewImage: { width: "100%", height: "88%" },
    previewFallback: {
      width: "100%",
      height: "88%",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
      backgroundColor: colors.surface2,
    },
    closeButton: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      backgroundColor: colors.surface2,
    },
    closeButtonText: { color: colors.text, ...typography.body },
    content: { flex: 1, gap: 6 },
    compactContent: { padding: spacing.sm, gap: spacing.xs },
    titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    title: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "700",
    },
    compactTitle: { ...typography.body, fontWeight: "600" },
    caloriePill: {
      minHeight: 22,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: moduleAccent,
      backgroundColor: accentDim,
    },
    calorieText: {
      color: moduleAccent,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "700",
    },
    description: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
    compactDescription: { ...typography.caption },
    metaRow: { gap: 3 },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
    metaText: { flex: 1, color: colors.textMuted, ...typography.caption },
    tags: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
    tag: {
      maxWidth: "100%",
      paddingVertical: 2,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.pill,
      color: moduleAccent,
      backgroundColor: accentDim,
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    actions: { marginTop: 2, flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    compactActions: { marginTop: spacing.xs },
    actionButton: {
      minHeight: 32,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 5,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface3,
    },
    actionText: { color: colors.text, ...typography.caption, fontWeight: "600" },
    archiveButton: {
      borderColor: colors.danger,
      backgroundColor: theme.isDark ? "rgba(255, 71, 87, 0.12)" : "#FFF2F0",
    },
    archiveText: { color: colors.danger, ...typography.caption, fontWeight: "600" },
    restoreButton: {
      borderColor: colors.accent,
      backgroundColor: theme.isDark ? "rgba(0, 230, 118, 0.12)" : "#F6FFED",
    },
    restoreText: { color: colors.accent, ...typography.caption, fontWeight: "600" },
    pressed: { opacity: 0.85 },
  });
};
