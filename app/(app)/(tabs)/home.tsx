import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useI18n } from "../../../src/i18n/I18nProvider";
import { WardrobeCard } from "../../../src/components/WardrobeCard";
import { subscribeToTags, type WardrobeTag } from "../../../src/lib/firestore/tags";
import {
  addTryOnItem,
  deleteTryOnItem,
  subscribeToTryOnItems,
  type TryOnItem,
} from "../../../src/lib/firestore/tryOnList";
import {
  deleteWardrobeItem,
  subscribeToWardrobeItems,
  type WardrobeItem,
} from "../../../src/lib/firestore/wardrobeItems";
import { useAuth } from "../../../src/providers/AuthProvider";
import { useTryOnConfig } from "../../../src/providers/TryOnConfigProvider";
import { colors, radius, spacing, typography } from "../../../src/theme/tokens";

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20];

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const { activeConfig } = useTryOnConfig();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [tags, setTags] = useState<WardrobeTag[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tryOnItems, setTryOnItems] = useState<TryOnItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

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

  useEffect(() => {
    if (!user) {
      setTryOnItems([]);
      return;
    }

    return subscribeToTryOnItems(user.id, setTryOnItems, activeConfig);
  }, [user, activeConfig]);

  const tryOnByWardrobeId = useMemo(() => {
    return new Map(tryOnItems.map((entry) => [entry.wardrobeItemId, entry]));
  }, [tryOnItems]);

  const filteredItems = useMemo(() => {
    if (tagFilters.length === 0) {
      return items;
    }

    return items.filter((item) =>
      (item.tags ?? []).some((tag) => tagFilters.includes(tag))
    );
  }, [items, tagFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredItems.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredItems, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, tagFilters]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

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
    const existing = tryOnByWardrobeId.get(item.id);
    if (existing) {
      deleteTryOnItem(existing.id).catch(() => {});
      return;
    }
    addTryOnItem(user.id, item, activeConfig).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={paginatedItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        initialNumToRender={pageSize}
        maxToRenderPerBatch={pageSize}
        updateCellsBatchingPeriod={50}
        windowSize={5}
        removeClippedSubviews={Platform.OS !== "web"}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{t("home.title")}</Text>
            <Text style={styles.subtitle}>{t("home.subtitle")}</Text>
            {activeConfig ? (
              <View style={styles.configBadge}>
                <Text style={styles.configLabel}>{t("home.active_config")}</Text>
                <Text style={styles.configName}>{activeConfig}</Text>
              </View>
            ) : null}
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
            isInTryOn={tryOnByWardrobeId.has(item.id)}
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
        ListFooterComponent={
          filteredItems.length > 0 ? (
            <View style={styles.pagination}>
              <View style={styles.pageSizeSection}>
                <Text style={styles.paginationLabel}>{t("home.page_size")}</Text>
                <View style={styles.pageSizeOptions}>
                  {PAGE_SIZE_OPTIONS.map((option) => {
                    const isActive = pageSize === option;
                    return (
                      <Pressable
                        key={option}
                        onPress={() => setPageSize(option)}
                        style={({ pressed }) => [
                          styles.pageSizeButton,
                          isActive && styles.pageSizeButtonActive,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pageSizeButtonText,
                            isActive && styles.pageSizeButtonTextActive,
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.pageControls}>
                <Pressable
                  disabled={currentPage === 1}
                  onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  style={({ pressed }) => [
                    styles.pageButton,
                    currentPage === 1 && styles.pageButtonDisabled,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.pageButtonText}>{t("home.page_previous")}</Text>
                </Pressable>
                <Text style={styles.pageStatus}>
                  {t("home.page_status", { page: currentPage, total: totalPages })}
                </Text>
                <Pressable
                  disabled={currentPage === totalPages}
                  onPress={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  style={({ pressed }) => [
                    styles.pageButton,
                    currentPage === totalPages && styles.pageButtonDisabled,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.pageButtonText}>{t("home.page_next")}</Text>
                </Pressable>
              </View>
            </View>
          ) : null
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
  configBadge: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  configLabel: {
    color: colors.muted,
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  configName: {
    color: colors.text,
    ...typography.body,
  },
  filterToggle: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
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
    borderRadius: radius.pill,
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
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  clearButtonText: {
    color: colors.background,
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  addButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  addButtonText: {
    color: colors.background,
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
  pagination: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  pageSizeSection: {
    gap: spacing.xs,
  },
  paginationLabel: {
    color: colors.muted,
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  pageSizeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pageSizeButton: {
    minWidth: 44,
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  pageSizeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pageSizeButtonText: {
    color: colors.text,
    ...typography.caption,
  },
  pageSizeButtonTextActive: {
    color: colors.background,
  },
  pageControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  pageButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pageButtonDisabled: {
    opacity: 0.45,
  },
  pageButtonText: {
    color: colors.primary,
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  pageStatus: {
    flex: 1,
    textAlign: "center",
    color: colors.muted,
    ...typography.caption,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
