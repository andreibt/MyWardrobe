import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { WardrobeCard } from "../../../src/components/WardrobeCard";
import { sampleWardrobeItems } from "../../../src/lib/wardrobe";
import { colors, radius, spacing, typography } from "../../../src/theme/tokens";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={sampleWardrobeItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Wardrobe Library</Text>
            <Text style={styles.subtitle}>
              A quick visual inventory of the pieces you already own.
            </Text>
            <Pressable style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Add new item</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => <WardrobeCard item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    ...typography.h1,
  },
  subtitle: {
    color: colors.muted,
    ...typography.body,
  },
  addButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  addButtonText: {
    color: colors.text,
    ...typography.body,
  },
  separator: {
    height: spacing.md,
  },
});
