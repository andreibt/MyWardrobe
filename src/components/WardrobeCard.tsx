import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { WardrobeItem } from "../lib/firestore/wardrobeItems";
import { colors, radius, spacing, typography } from "../theme/tokens";

type WardrobeCardProps = {
  item: WardrobeItem;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function WardrobeCard({ item, onEdit, onDelete }: WardrobeCardProps) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.meta}>Color: {item.color}</Text>
        {(onEdit || onDelete) ? (
          <View style={styles.actions}>
            {onEdit ? (
              <Pressable onPress={onEdit} style={styles.actionButton}>
                <Text style={styles.actionText}>Edit</Text>
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable onPress={onDelete} style={[styles.actionButton, styles.deleteButton]}>
                <Text style={styles.deleteText}>Delete</Text>
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
});
