import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../i18n/I18nProvider";
import type { FridgeItem } from "../lib/firestore/fridgeItems";
import { useTheme, type AppTheme } from "../providers/ThemeProvider";
import { radius, spacing, typography } from "../theme/tokens";

type FridgeCardProps = {
  item: FridgeItem;
  compact?: boolean;
  isHistory?: boolean;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
};

export function FridgeCard({
  item,
  compact = false,
  isHistory = false,
  onEdit,
  onArchive,
  onRestore,
}: FridgeCardProps) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const imageUri = item.imageSerialized || item.imageUrl;
  const isItemExpired = !isHistory && isExpired(item.expirationDate);

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
        <Image source={{ uri: imageUri }} style={styles.image} />
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
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
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
          <View style={styles.caloriePill}>
            <MaterialCommunityIcons name="fire" color={colors.accent} size={12} />
            <Text style={styles.calorieText}>{item.calories}</Text>
          </View>
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
          {!isHistory ? (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="calendar-clock"
                color={isItemExpired ? colors.danger : colors.textMuted}
                size={14}
              />
              <Text style={[styles.metaText, isItemExpired && styles.expiredText]} numberOfLines={1}>
                {t("fridge_card.expiration", { date: item.expirationDate })}
              </Text>
            </View>
          ) : null}
        </View>

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

function isExpired(expirationDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiration = new Date(`${expirationDate}T00:00:00`);
  if (Number.isNaN(expiration.getTime())) {
    return false;
  }
  expiration.setHours(0, 0, 0, 0);
  return expiration < today;
}

const createStyles = (theme: AppTheme) => {
  const colors = theme.colors;

  return StyleSheet.create({
    card: {
      flexDirection: "row",
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: 16,
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
      width: 64,
      height: 64,
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
    previewBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    previewContent: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
    },
    previewImage: {
      width: "100%",
      height: "88%",
    },
    closeButton: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      backgroundColor: colors.surface2,
    },
    closeButtonText: {
      color: colors.text,
      ...typography.body,
    },
    content: {
      flex: 1,
      gap: 6,
    },
    compactContent: {
      padding: spacing.sm,
      gap: spacing.xs,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    title: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "700",
    },
    compactTitle: {
      ...typography.body,
      fontWeight: "600",
    },
    caloriePill: {
      minHeight: 22,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(0, 230, 118, 0.25)" : "#B7E8C8",
      backgroundColor: theme.isDark ? "rgba(0, 230, 118, 0.1)" : "#F6FFED",
    },
    calorieText: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "700",
    },
    description: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    compactDescription: {
      ...typography.caption,
    },
    metaRow: {
      gap: 3,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    metaText: {
      flex: 1,
      color: colors.textMuted,
      ...typography.caption,
    },
    expiredText: {
      color: colors.danger,
      fontWeight: "700",
    },
    actions: {
      marginTop: 2,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    compactActions: {
      marginTop: spacing.xs,
    },
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
    actionText: {
      color: colors.text,
      ...typography.caption,
      fontWeight: "600",
    },
    archiveButton: {
      borderColor: colors.danger,
      backgroundColor: theme.isDark ? "rgba(255, 71, 87, 0.12)" : "#FFF2F0",
    },
    archiveText: {
      color: colors.danger,
      ...typography.caption,
      fontWeight: "600",
    },
    restoreButton: {
      borderColor: colors.accent,
      backgroundColor: theme.isDark ? "rgba(0, 230, 118, 0.12)" : "#F6FFED",
    },
    restoreText: {
      color: colors.accent,
      ...typography.caption,
      fontWeight: "600",
    },
    pressed: {
      opacity: 0.85,
    },
  });
};
