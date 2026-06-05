import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../i18n/I18nProvider";
import type { FridgeItem } from "../lib/firestore/fridgeItems";
import { colors, radius, spacing, typography } from "../theme/tokens";

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
  const imageUri = item.imageSerialized || item.imageUrl;

  return (
    <View style={styles.card}>
      <Image source={{ uri: imageUri }} style={[styles.image, compact && styles.compactImage]} />
      <View style={[styles.content, compact && styles.compactContent]}>
        <Text style={[styles.title, compact && styles.compactTitle]}>{item.name}</Text>
        <Text style={[styles.description, compact && styles.compactText]}>
          {item.description}
        </Text>
        <Text style={styles.meta}>
          {t("fridge_card.quantity", { quantity: item.quantity, type: item.quantityType })}
        </Text>
        {!isHistory ? (
          <Text style={styles.meta}>
            {t("fridge_card.expiration", { date: item.expirationDate })}
          </Text>
        ) : null}
        <Text style={styles.meta}>{t("fridge_card.calories", { calories: item.calories })}</Text>
        <View style={styles.actions}>
          {onEdit ? (
            <Pressable onPress={onEdit} style={styles.editButton}>
              <Text style={styles.editText}>{t("card.edit")}</Text>
            </Pressable>
          ) : null}
          {onArchive ? (
            <Pressable onPress={onArchive} style={styles.deleteButton}>
              <Text style={styles.deleteText}>{t("fridge_card.archive")}</Text>
            </Pressable>
          ) : null}
          {onRestore ? (
            <Pressable onPress={onRestore} style={styles.restoreButton}>
              <Text style={styles.restoreText}>{t("fridge_card.restore")}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  image: { width: "100%", height: 160, backgroundColor: colors.card },
  compactImage: { height: 112 },
  content: { padding: spacing.md, gap: spacing.xs },
  compactContent: { padding: spacing.sm },
  title: { color: colors.text, ...typography.h2 },
  compactTitle: { ...typography.body, fontWeight: "600" },
  description: { color: colors.muted, ...typography.body },
  compactText: { ...typography.caption },
  meta: { color: colors.muted, ...typography.caption },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
  editButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  editText: { color: colors.text, ...typography.caption },
  deleteButton: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSurface,
  },
  deleteText: { color: colors.danger, ...typography.caption },
  restoreButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.successSurface,
  },
  restoreText: { color: colors.accent, ...typography.caption },
});
