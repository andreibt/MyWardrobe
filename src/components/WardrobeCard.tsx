import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../i18n/I18nProvider";
import type { WardrobeItem } from "../lib/firestore/wardrobeItems";
import { colors, radius, spacing, typography } from "../theme/tokens";

type WardrobeCardProps = {
  item: WardrobeItem;
  onEdit?: () => void;
  onTryOn?: () => void;
  isInTryOn?: boolean;
  onDelete?: () => void;
};

export function WardrobeCard({
  item,
  onEdit,
  onTryOn,
  isInTryOn,
  onDelete,
}: WardrobeCardProps) {
  const { t } = useI18n();

  return (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.meta}>{t("card.color", { color: item.color })}</Text>
        {(onEdit || onTryOn || onDelete) ? (
          <View style={styles.actions}>
            {onEdit ? (
              <Pressable onPress={onEdit} style={styles.actionButton}>
                <Text style={styles.actionText}>{t("card.edit")}</Text>
              </Pressable>
            ) : null}
            {onTryOn ? (
              <Pressable onPress={onTryOn} style={[styles.actionButton, styles.tryOnButton]}>
                <Text style={styles.tryOnText}>
                  {isInTryOn ? t("card.try_on_remove") : t("card.try_on")}
                </Text>
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable onPress={onDelete} style={[styles.actionButton, styles.deleteButton]}>
                <Text style={styles.deleteText}>{t("card.delete")}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 160,
  },
  content: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    ...typography.h2,
  },
  description: {
    color: colors.muted,
    ...typography.body,
  },
  meta: {
    color: colors.muted,
    ...typography.caption,
  },
  actions: {
    marginTop: spacing.sm,
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    color: colors.text,
    ...typography.caption,
  },
  deleteButton: {
    backgroundColor: "#FDECEC",
    borderColor: "#F2C5C5",
  },
  deleteText: {
    color: "#8A1F1F",
    ...typography.caption,
  },
  tryOnButton: {
    backgroundColor: "#E9F2E0",
    borderColor: "#C5DBC0",
  },
  tryOnText: {
    color: "#2D5A4E",
    ...typography.caption,
  },
});
