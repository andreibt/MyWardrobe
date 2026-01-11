import { Image, StyleSheet, Text, View } from "react-native";

import type { WardrobeItem } from "../lib/wardrobe";
import { colors, radius, spacing, typography } from "../theme/tokens";

type WardrobeCardProps = {
  item: WardrobeItem;
};

export function WardrobeCard({ item }: WardrobeCardProps) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
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
});
