import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { FridgeCard } from "../../../src/components/FridgeCard";
import { useI18n } from "../../../src/i18n/I18nProvider";
import {
  archiveFridgeItem,
  subscribeToFridgeItems,
  type FridgeItem,
} from "../../../src/lib/firestore/fridgeItems";
import {
  subscribeToFridgeTags,
  type FridgeTag,
} from "../../../src/lib/firestore/fridgeTags";
import { useAuth } from "../../../src/providers/AuthProvider";
import { colors, radius, spacing, typography } from "../../../src/theme/tokens";

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20];
type ViewMode = "list" | "grid";
type InventoryMode = "active" | "history";

export default function FridgeListScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [tags, setTags] = useState<FridgeTag[]>([]);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [inventoryMode, setInventoryMode] = useState<InventoryMode>("active");
  const isGridView = viewMode === "grid";
  const isHistoryView = inventoryMode === "history";

  useEffect(() => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    return subscribeToFridgeItems(user.id, (nextItems) => {
      setItems(nextItems);
      setIsLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!user) {
      setTags([]);
      return;
    }
    return subscribeToFridgeTags(user.id, setTags);
  }, [user]);

  const filteredItems = useMemo(() => {
    const inventoryItems = items.filter((item) => item.isHistory === isHistoryView);
    if (tagFilters.length === 0) {
      return inventoryItems;
    }
    return inventoryItems.filter((item) => item.tags.some((tag) => tagFilters.includes(tag)));
  }, [isHistoryView, items, tagFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [currentPage, filteredItems, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [inventoryMode, pageSize, tagFilters]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const toggleFilter = (tag: string) => {
    setTagFilters((current) =>
      current.includes(tag) ? current.filter((entry) => entry !== tag) : [...current, tag]
    );
  };

  const confirmArchive = (itemId: string) => {
    const handleArchive = () => archiveFridgeItem(itemId).catch(() => {});
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(t("fridge_list.delete_confirm"))) {
        handleArchive();
      }
      return;
    }
    Alert.alert(t("fridge_list.delete_title"), t("fridge_list.delete_message"), [
      { text: t("fridge_list.delete_cancel"), style: "cancel" },
      { text: t("fridge_list.delete_button"), style: "destructive", onPress: handleArchive },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        key={viewMode}
        data={paginatedItems}
        numColumns={isGridView ? 2 : 1}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={isGridView ? styles.gridRow : undefined}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{t("fridge_list.title")}</Text>
            <Text style={styles.subtitle}>{t("fridge_list.subtitle")}</Text>
            <View style={styles.inventoryToggle}>
              <Pressable
                onPress={() => setInventoryMode("active")}
                style={[styles.inventoryButton, !isHistoryView && styles.inventoryButtonActive]}
              >
                <Text style={styles.inventoryButtonText}>{t("fridge_list.active")}</Text>
              </Pressable>
              <Pressable
                onPress={() => setInventoryMode("history")}
                style={[styles.inventoryButton, isHistoryView && styles.inventoryButtonActive]}
              >
                <Text style={styles.inventoryButtonText}>{t("fridge_list.history")}</Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => setIsFilterOpen((value) => !value)}
              style={styles.filterToggle}
            >
              <Text style={styles.filterToggleText}>{t("fridge_list.filter_title")}</Text>
              <Text style={styles.filterHint}>
                {tagFilters.length > 0
                  ? t("fridge_list.filter_count", { count: tagFilters.length })
                  : t("fridge_list.filter_hint")}
              </Text>
            </Pressable>
            {isFilterOpen ? (
              <View style={styles.filterPanel}>
                {tags.length === 0 ? (
                  <Text style={styles.filterHint}>{t("fridge_list.filter_empty")}</Text>
                ) : (
                  <View style={styles.filterTagList}>
                    {tags.map((tag) => {
                      const selected = tagFilters.includes(tag.name);
                      return (
                        <Pressable
                          key={tag.id}
                          onPress={() => toggleFilter(tag.name)}
                          style={[styles.filterChip, selected && styles.filterChipActive]}
                        >
                          <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                            {tag.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
                {tagFilters.length > 0 ? (
                  <Pressable onPress={() => setTagFilters([])} style={styles.clearButton}>
                    <Text style={styles.clearButtonText}>{t("fridge_list.filter_clear")}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            <View style={styles.viewToggle}>
              <Pressable
                onPress={() => setViewMode("grid")}
                style={[styles.viewButton, isGridView && styles.viewButtonActive]}
                accessibilityLabel={t("fridge_list.view_grid")}
              >
                <MaterialCommunityIcons
                  name="view-grid-outline"
                  color={isGridView ? colors.background : colors.muted}
                  size={22}
                />
              </Pressable>
              <Pressable
                onPress={() => setViewMode("list")}
                style={[styles.viewButton, !isGridView && styles.viewButtonActive]}
                accessibilityLabel={t("fridge_list.view_list")}
              >
                <MaterialCommunityIcons
                  name="view-list-outline"
                  color={!isGridView ? colors.background : colors.muted}
                  size={22}
                />
              </Pressable>
            </View>
            {!isHistoryView ? (
              <Pressable
                onPress={() => router.push("/(app)/add-fridge-item")}
                style={styles.addButton}
              >
                <Text style={styles.addButtonText}>{t("fridge_list.add_button")}</Text>
              </Pressable>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={isGridView ? styles.gridItem : undefined}>
            <FridgeCard
              item={item}
              compact={isGridView}
              isHistory={isHistoryView}
              onEdit={!isHistoryView ? () =>
                router.push({
                  pathname: "/(app)/edit-fridge-item",
                  params: {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    quantity: String(item.quantity),
                    quantityType: item.quantityType,
                    expirationDate: item.expirationDate,
                    calories: String(item.calories),
                    imageUrl: item.imageUrl,
                    imageSerialized: item.imageSerialized ?? "",
                    tags: JSON.stringify(item.tags),
                  },
                })
              : undefined}
              onArchive={!isHistoryView ? () => confirmArchive(item.id) : undefined}
              onRestore={isHistoryView ? () =>
                router.push({
                  pathname: "/(app)/restore-fridge-item",
                  params: { id: item.id, name: item.name },
                })
              : undefined}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {isLoading
                ? t("fridge_list.empty_loading")
                : tagFilters.length > 0
                ? t("fridge_list.empty_filtered")
                : isHistoryView
                ? t("fridge_list.empty_history")
                : t("fridge_list.empty")}
            </Text>
          </View>
        }
        ListFooterComponent={
          filteredItems.length > 0 ? (
            <View style={styles.pagination}>
              <Text style={styles.paginationLabel}>{t("fridge_list.page_size")}</Text>
              <View style={styles.pageSizeOptions}>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setPageSize(option)}
                    style={[styles.pageSizeButton, pageSize === option && styles.viewButtonActive]}
                  >
                    <Text style={styles.pageSizeText}>{option}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.pageControls}>
                <Pressable
                  disabled={currentPage === 1}
                  onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  style={[styles.pageButton, currentPage === 1 && styles.disabled]}
                >
                  <Text style={styles.pageButtonText}>{t("fridge_list.page_previous")}</Text>
                </Pressable>
                <Text style={styles.pageStatus}>
                  {t("fridge_list.page_status", { page: currentPage, total: totalPages })}
                </Text>
                <Pressable
                  disabled={currentPage === totalPages}
                  onPress={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  style={[styles.pageButton, currentPage === totalPages && styles.disabled]}
                >
                  <Text style={styles.pageButtonText}>{t("fridge_list.page_next")}</Text>
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
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.lg },
  header: { gap: spacing.sm, marginBottom: spacing.lg },
  title: { color: colors.text, ...typography.h1 },
  subtitle: { color: colors.muted, ...typography.body },
  inventoryToggle: { flexDirection: "row", gap: spacing.xs },
  inventoryButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  inventoryButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  inventoryButtonText: { color: colors.text, ...typography.caption },
  gridRow: { gap: spacing.md },
  gridItem: { flex: 1, maxWidth: "50%" },
  separator: { height: spacing.md },
  filterToggle: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterToggleText: { color: colors.text, ...typography.caption, textTransform: "uppercase" },
  filterHint: { color: colors.muted, ...typography.caption },
  filterPanel: { gap: spacing.sm },
  filterTagList: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  filterChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { color: colors.text, ...typography.caption },
  filterChipTextActive: { color: colors.background },
  clearButton: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  clearButtonText: { color: colors.background, ...typography.caption },
  viewToggle: { flexDirection: "row", gap: spacing.xs },
  viewButton: {
    padding: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  viewButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  addButton: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  addButtonText: { color: colors.background, ...typography.body },
  emptyState: { paddingVertical: spacing.xl },
  emptyTitle: { color: colors.text, ...typography.h2 },
  pagination: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paginationLabel: { color: colors.muted, ...typography.caption, textTransform: "uppercase" },
  pageSizeOptions: { flexDirection: "row", gap: spacing.sm },
  pageSizeButton: {
    minWidth: 44,
    alignItems: "center",
    padding: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  pageSizeText: { color: colors.text, ...typography.caption },
  pageControls: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  pageButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pageButtonText: { color: colors.primary, ...typography.caption },
  pageStatus: { flex: 1, color: colors.muted, textAlign: "center", ...typography.caption },
  disabled: { opacity: 0.45 },
});
