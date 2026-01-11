import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { WardrobeCard } from "../../../src/components/WardrobeCard";
import {
  subscribeToWardrobeItems,
  type WardrobeItem,
} from "../../../src/lib/firestore/wardrobeItems";
import { useAuth } from "../../../src/providers/AuthProvider";
import { colors, radius, spacing, typography } from "../../../src/theme/tokens";

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToWardrobeItems(user.id, (nextItems) => {
      setItems(nextItems);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [user]);

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Wardrobe Library</Text>
            <Text style={styles.subtitle}>
              A quick visual inventory of the pieces you already own.
            </Text>
            <Pressable style={styles.addButton} onPress={() => router.push("/(app)/add-item")}>
              <Text style={styles.addButtonText}>+ Add new item</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => <WardrobeCard item={item} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {isLoading ? "Loading items..." : "No wardrobe items yet."}
            </Text>
            <Text style={styles.emptySubtitle}>
              Add your first item to start building your library.
            </Text>
          </View>
        }
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
  emptyState: {
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  emptyTitle: {
    color: colors.text,
    ...typography.h2,
  },
  emptySubtitle: {
    color: colors.muted,
    ...typography.body,
  },
});
