import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../i18n/I18nProvider";
import type { FridgeItem } from "../lib/firestore/fridgeItems";
import { colors, radius, spacing, typography } from "../theme/tokens";

type FridgeCardProps = {
  item: FridgeItem;
  compact?: boolean;
  onDelete: () => void;
};

export function FridgeCard({ item, compact = false, onDelete }: FridgeCardProps) {
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
        <Text style={styles.meta}>
          {t("fridge_card.expiration", { date: item.expirationDate })}
        </Text>
        <Text style={styles.meta}>{t("fridge_card.calories", { calories: item.calories })}</Text>
        <Pressable onPress={onDelete} style={styles.deleteButton}>
          <Text style={styles.deleteText}>{t("card.delete")}</Text>
        </Pressable>
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
  deleteButton: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSurface,
  },
  deleteText: { color: colors.danger, ...typography.caption },
});
