import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useI18n } from "../../../src/i18n/I18nProvider";
import { WardrobeCard } from "../../../src/components/WardrobeCard";
import { subscribeToTags, type WardrobeTag } from "../../../src/lib/firestore/tags";
import { addTryOnItem } from "../../../src/lib/firestore/tryOnList";
import {
  deleteWardrobeItem,
  subscribeToWardrobeItems,
  type WardrobeItem,
} from "../../../src/lib/firestore/wardrobeItems";
import { useAuth } from "../../../src/providers/AuthProvider";
import { colors, radius, spacing, typography } from "../../../src/theme/tokens";

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [tags, setTags] = useState<WardrobeTag[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  useEffect(() => {
    if (!user) {
      setTags([]);
      return;
    }

    return subscribeToTags(user.id, setTags);
  }, [user]);

  const filteredItems = useMemo(() => {
    if (tagFilters.length === 0) {
      return items;
    }

    return items.filter((item) =>
      (item.tags ?? []).some((tag) => tagFilters.includes(tag))
    );
  }, [items, tagFilters]);

  const toggleFilter = (tag: string) => {
    if (tagFilters.includes(tag)) {
      setTagFilters(tagFilters.filter((value) => value !== tag));
    } else {
      setTagFilters([...tagFilters, tag]);
    }
  };

  const confirmDelete = (itemId: string) => {
    const handleDelete = () => {
      deleteWardrobeItem(itemId).catch(() => {});
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(t("home.delete_confirm"))) {
        handleDelete();
      }
      return;
    }

    Alert.alert(
      t("home.delete_title"),
      t("home.delete_message"),
      [
        { text: t("home.delete_cancel"), style: "cancel" },
        {
          text: t("home.delete_confirm_button"),
          style: "destructive",
          onPress: handleDelete,
        },
      ]
    );
  };

  const handleTryOn = (item: WardrobeItem) => {
    if (!user) {
      return;
    }
    addTryOnItem(user.id, item).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        updateCellsBatchingPeriod={50}
        windowSize={5}
        removeClippedSubviews={Platform.OS !== "web"}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{t("home.title")}</Text>
            <Text style={styles.subtitle}>{t("home.subtitle")}</Text>
            <Pressable
              style={styles.filterToggle}
              onPress={() => setIsFilterOpen((value) => !value)}
            >
              <Text style={styles.filterToggleText}>{t("home.filter_title")}</Text>
              <Text style={styles.filterToggleHint}>
                {tagFilters.length > 0
                  ? t("home.filter_count", { count: tagFilters.length })
                  : t("home.filter_hint")}
              </Text>
            </Pressable>
            {isFilterOpen ? (
              <View style={styles.filterPanel}>
                {tags.length === 0 ? (
                  <Text style={styles.filterEmpty}>{t("home.filter_empty")}</Text>
                ) : (
                  <View style={styles.filterTagList}>
                    {tags.map((tag) => {
                      const selected = tagFilters.includes(tag.name);
                      return (
                        <Pressable
                          key={tag.id}
                          onPress={() => toggleFilter(tag.name)}
                          style={({ pressed }) => [
                            styles.filterChip,
                            selected && styles.filterChipActive,
                            pressed && styles.buttonPressed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              selected && styles.filterChipTextActive,
                            ]}
                          >
                            {tag.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
                {tagFilters.length > 0 ? (
                  <Pressable
                    onPress={() => setTagFilters([])}
                    style={({ pressed }) => [styles.clearButton, pressed && styles.buttonPressed]}
                  >
                    <Text style={styles.clearButtonText}>{t("home.filter_clear")}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            <Pressable style={styles.addButton} onPress={() => router.push("/(app)/add-item")}>
              <Text style={styles.addButtonText}>{t("home.add_button")}</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <WardrobeCard
            item={item}
            onEdit={() =>
              router.push({
                pathname: "/(app)/edit-item",
                params: {
                  id: item.id,
                  title: item.title,
                  description: item.description,
                  imageUrl: item.imageUrl,
                  color: item.color,
                  tags: JSON.stringify(item.tags ?? []),
                },
              })
            }
            onTryOn={() => handleTryOn(item)}
            onDelete={() => confirmDelete(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {isLoading
                ? t("home.empty_loading")
                : tagFilters.length > 0
                ? t("home.empty_filtered")
                : t("home.empty")}
            </Text>
            <Text style={styles.emptySubtitle}>
              {tagFilters.length > 0 ? t("home.empty_filtered_subtitle") : t("home.empty_subtitle")}
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
  filterToggle: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterToggleText: {
    color: colors.text,
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  filterToggleHint: {
    color: colors.muted,
    ...typography.caption,
  },
  filterPanel: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  filterEmpty: {
    color: colors.muted,
    ...typography.caption,
  },
  filterTagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  filterChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.text,
    ...typography.caption,
  },
  filterChipTextActive: {
    color: colors.surface,
  },
  clearButton: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
  },
  clearButtonText: {
    color: colors.text,
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
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
  buttonPressed: {
    opacity: 0.85,
  },
});
