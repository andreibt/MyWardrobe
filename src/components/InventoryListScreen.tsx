import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../i18n/I18nProvider";
import {
  archiveInventoryItem,
  subscribeToInventoryItems,
  type InventoryItem,
  type InventoryKind,
} from "../lib/firestore/inventoryItems";
import { useAuth } from "../providers/AuthProvider";
import { useTheme, type AppTheme } from "../providers/ThemeProvider";
import { spacing, typography } from "../theme/tokens";
import { InventoryCard } from "./InventoryCard";

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20];
type ViewMode = "list" | "grid";
type InventoryMode = "active" | "history";
type ExpirationFilter = "all" | "expired" | "soon";

type InventoryCopy = {
  title: string;
  getActiveCount: (count: number) => string;
  searchPlaceholder: string;
  allFilter: string;
  empty: string;
  emptyHistory: string;
  emptyFiltered: string;
  emptySubtitle: string;
  deleteTitle: string;
  deleteMessage: string;
  deleteButton: string;
  addButton: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  addPath: "/(app)/add-pantry-item" | "/(app)/add-cocktail-item";
  editPath: "/(app)/edit-pantry-item" | "/(app)/edit-cocktail-item";
  restorePath: "/(app)/restore-pantry-item" | "/(app)/restore-cocktail-item";
};

type InventoryListScreenProps = {
  kind: InventoryKind;
  copy: InventoryCopy;
};

export function InventoryListScreen({ kind, copy }: InventoryListScreenProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ expirationFilter?: ExpirationFilter }>();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, kind), [kind, theme]);
  const colors = theme.colors;
  const accentColor = moduleAccent(kind);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [inventoryMode, setInventoryMode] = useState<InventoryMode>("active");
  const [expirationFilter, setExpirationFilter] = useState<ExpirationFilter>("all");
  const isGridView = viewMode === "grid";
  const isHistoryView = inventoryMode === "history";
  const showsExpirationAlerts = kind === "pantry";

  useEffect(() => {
    if (
      showsExpirationAlerts &&
      (params.expirationFilter === "expired" || params.expirationFilter === "soon")
    ) {
      setInventoryMode("active");
      setExpirationFilter(params.expirationFilter);
    }
  }, [params.expirationFilter, showsExpirationAlerts]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    return subscribeToInventoryItems(kind, user.id, (nextItems) => {
      setItems(nextItems);
      setIsLoading(false);
    });
  }, [kind, user]);

  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach((item) => item.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const inventoryItems = items.filter((item) => item.isHistory === isHistoryView);
    return inventoryItems.filter((item) => {
      const matchesTags =
        tagFilters.length === 0 || item.tags.some((tag) => tagFilters.includes(tag));
      const matchesSearch =
        !normalizedQuery ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery) ||
        item.quantityType.toLowerCase().includes(normalizedQuery) ||
        item.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));
      const matchesExpiration =
        !showsExpirationAlerts ||
        expirationFilter === "all" ||
        (expirationFilter === "expired" && isExpired(item.expirationDate)) ||
        (expirationFilter === "soon" && isExpiringSoon(item.expirationDate));
      return matchesTags && matchesSearch && matchesExpiration;
    });
  }, [expirationFilter, isHistoryView, items, searchQuery, showsExpirationAlerts, tagFilters]);

  const activeCount = useMemo(() => items.filter((item) => !item.isHistory).length, [items]);
  const expiredCount = useMemo(
    () =>
      showsExpirationAlerts
        ? items.filter((item) => !item.isHistory && isExpired(item.expirationDate)).length
        : 0,
    [items, showsExpirationAlerts]
  );
  const expiringCount = useMemo(
    () =>
      showsExpirationAlerts
        ? items.filter((item) => !item.isHistory && isExpiringSoon(item.expirationDate)).length
        : 0,
    [items, showsExpirationAlerts]
  );
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [currentPage, filteredItems, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [expirationFilter, inventoryMode, pageSize, searchQuery, tagFilters]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const toggleFilter = (tag: string) => {
    setTagFilters((current) =>
      current.includes(tag) ? current.filter((entry) => entry !== tag) : [...current, tag]
    );
  };

  const clearFilters = () => {
    setTagFilters([]);
    setExpirationFilter("all");
  };

  const confirmArchive = (itemId: string) => {
    const handleArchive = () => archiveInventoryItem(kind, itemId).catch(() => {});
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(copy.deleteMessage)) {
        handleArchive();
      }
      return;
    }
    Alert.alert(copy.deleteTitle, copy.deleteMessage, [
      { text: t("fridge_list.delete_cancel"), style: "cancel" },
      { text: copy.deleteButton, style: "destructive", onPress: handleArchive },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        key={viewMode}
        data={paginatedItems}
        numColumns={isGridView ? 2 : 1}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: Math.max(insets.top + spacing.sm, spacing.lg),
            paddingBottom: Math.max(insets.bottom + 96, 120),
          },
        ]}
        columnWrapperStyle={isGridView ? styles.gridRow : undefined}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>{copy.title}</Text>
                <Text style={styles.count}>{copy.getActiveCount(activeCount)}</Text>
              </View>
            </View>

            {expiredCount > 0 && !isHistoryView ? (
              <Pressable
                onPress={() => setExpirationFilter((current) => (current === "expired" ? "all" : "expired"))}
                style={({ pressed }) => [
                  styles.alertBanner,
                  styles.expiredBanner,
                  expirationFilter === "expired" && styles.expiredBannerActive,
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t("fridge_list.expired_alert", { count: expiredCount })}
              >
                <MaterialCommunityIcons name="alert-circle-outline" color={colors.danger} size={18} />
                <Text style={[styles.alertText, styles.expiredText]}>
                  {t("fridge_list.expired_alert", { count: expiredCount })}
                </Text>
              </Pressable>
            ) : null}

            {expiringCount > 0 && !isHistoryView ? (
              <Pressable
                onPress={() => setExpirationFilter((current) => (current === "soon" ? "all" : "soon"))}
                style={({ pressed }) => [
                  styles.alertBanner,
                  expirationFilter === "soon" && styles.alertBannerActive,
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t("fridge_list.expiring_alert", { count: expiringCount })}
              >
                <MaterialCommunityIcons name="timer-sand" color={accentColor} size={18} />
                <Text style={styles.alertText}>
                  {t("fridge_list.expiring_alert", { count: expiringCount })}
                </Text>
              </Pressable>
            ) : null}

            <View style={styles.searchBar}>
              <MaterialCommunityIcons name="magnify" color={colors.muted} size={18} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={copy.searchPlaceholder}
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
                autoCapitalize="none"
              />
              {searchQuery ? (
                <Pressable
                  onPress={() => setSearchQuery("")}
                  style={styles.clearSearchButton}
                  accessibilityRole="button"
                  accessibilityLabel={t("fridge_list.filter_clear")}
                >
                  <MaterialCommunityIcons name="close" color={colors.textMuted} size={16} />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.segmentedControl}>
              <Pressable
                onPress={() => setInventoryMode("active")}
                style={[styles.segmentButton, !isHistoryView && styles.segmentButtonActive]}
              >
                <Text style={[styles.segmentText, !isHistoryView && styles.segmentTextActive]}>
                  {t("fridge_list.active")}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setInventoryMode("history");
                  setExpirationFilter("all");
                }}
                style={[styles.segmentButton, isHistoryView && styles.segmentButtonActive]}
              >
                <Text style={[styles.segmentText, isHistoryView && styles.segmentTextActive]}>
                  {t("fridge_list.history")}
                </Text>
              </Pressable>
            </View>

            <FlatList
              horizontal
              data={[copy.allFilter, ...tags]}
              keyExtractor={(tag) => tag}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
              renderItem={({ item }) => {
                const isAll = item === copy.allFilter;
                const selected = isAll ? tagFilters.length === 0 : tagFilters.includes(item);
                return (
                  <Pressable
                    onPress={() => (isAll ? setTagFilters([]) : toggleFilter(item))}
                    style={({ pressed }) => [
                      styles.filterChip,
                      selected && styles.filterChipActive,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                      {item}
                    </Text>
                  </Pressable>
                );
              }}
            />

            <View style={styles.toolbar}>
              <View style={styles.viewToggle}>
                <Pressable
                  onPress={() => setViewMode("list")}
                  style={[styles.viewButton, !isGridView && styles.viewButtonActive]}
                  accessibilityRole="button"
                  accessibilityLabel={t("fridge_list.view_list")}
                >
                  <MaterialCommunityIcons
                    name="view-list-outline"
                    color={!isGridView ? colors.logoTint : colors.textMuted}
                    size={20}
                  />
                </Pressable>
                <Pressable
                  onPress={() => setViewMode("grid")}
                  style={[styles.viewButton, isGridView && styles.viewButtonActive]}
                  accessibilityRole="button"
                  accessibilityLabel={t("fridge_list.view_grid")}
                >
                  <MaterialCommunityIcons
                    name="view-grid-outline"
                    color={isGridView ? colors.logoTint : colors.textMuted}
                    size={20}
                  />
                </Pressable>
              </View>

              {tagFilters.length > 0 || expirationFilter !== "all" ? (
                <Pressable
                  onPress={clearFilters}
                  style={({ pressed }) => [styles.clearButton, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.clearButtonText}>{t("fridge_list.filter_clear")}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={isGridView ? styles.gridItem : undefined}>
            <InventoryCard
              item={item}
              kind={kind}
              compact={isGridView}
              isHistory={isHistoryView}
              onEdit={
                !isHistoryView
                  ? () =>
                      router.push({
                        pathname: copy.editPath,
                        params: {
                          id: item.id,
                          name: item.name,
                          description: item.description,
                          quantity: String(item.quantity),
                          quantityType: item.quantityType,
                          expirationDate: item.expirationDate,
                          calories: String(item.calories ?? 0),
                          imageUrl: item.imageUrl,
                          imageSerialized: item.imageSerialized ?? "",
                          tags: JSON.stringify(item.tags),
                        },
                      })
                  : undefined
              }
              onArchive={!isHistoryView ? () => confirmArchive(item.id) : undefined}
              onRestore={
                isHistoryView
                  ? () =>
                      router.push({
                        pathname: copy.restorePath,
                        params: { id: item.id, name: item.name },
                      })
                  : undefined
              }
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name={copy.icon} color={colors.muted} size={46} />
            <Text style={styles.emptyTitle}>
              {isLoading
                ? t("fridge_list.empty_loading")
                : tagFilters.length > 0 || searchQuery || expirationFilter !== "all"
                  ? copy.emptyFiltered
                  : isHistoryView
                    ? copy.emptyHistory
                    : copy.empty}
            </Text>
            <Text style={styles.emptySubtitle}>
              {tagFilters.length > 0 || searchQuery || expirationFilter !== "all"
                ? t("wardrobe_list.empty_filtered_subtitle")
                : copy.emptySubtitle}
            </Text>
          </View>
        }
        ListFooterComponent={
          filteredItems.length > 0 ? (
            <View style={styles.pagination}>
              <Text style={styles.paginationLabel}>{t("fridge_list.page_size")}</Text>
              <View style={styles.pageSizeOptions}>
                {PAGE_SIZE_OPTIONS.map((option) => {
                  const selected = pageSize === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setPageSize(option)}
                      style={[styles.pageSizeButton, selected && styles.pageSizeButtonActive]}
                    >
                      <Text style={[styles.pageSizeText, selected && styles.pageSizeTextActive]}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.pageControls}>
                <Pressable
                  disabled={currentPage === 1}
                  onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  style={({ pressed }) => [
                    styles.pageButton,
                    pressed && styles.buttonPressed,
                    currentPage === 1 && styles.disabled,
                  ]}
                >
                  <MaterialCommunityIcons name="chevron-left" color={colors.primary} size={18} />
                  <Text style={styles.pageButtonText}>{t("fridge_list.page_previous")}</Text>
                </Pressable>
                <Text style={styles.pageStatus}>
                  {t("fridge_list.page_status", { page: currentPage, total: totalPages })}
                </Text>
                <Pressable
                  disabled={currentPage === totalPages}
                  onPress={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  style={({ pressed }) => [
                    styles.pageButton,
                    pressed && styles.buttonPressed,
                    currentPage === totalPages && styles.disabled,
                  ]}
                >
                  <Text style={styles.pageButtonText}>{t("fridge_list.page_next")}</Text>
                  <MaterialCommunityIcons name="chevron-right" color={colors.primary} size={18} />
                </Pressable>
              </View>
            </View>
          ) : null
        }
      />

      {!isHistoryView ? (
        <Pressable
          onPress={() => router.push(copy.addPath)}
          style={({ pressed }) => [
            styles.fab,
            { bottom: Math.max(insets.bottom + spacing.lg, 76) },
            pressed && styles.fabPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={copy.addButton}
        >
          <MaterialCommunityIcons name="plus" color={colors.logoTint} size={28} />
        </Pressable>
      ) : null}
    </View>
  );
}

function getDaysUntilExpiration(expirationDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiration = new Date(`${expirationDate}T00:00:00`);
  if (Number.isNaN(expiration.getTime())) {
    return null;
  }
  expiration.setHours(0, 0, 0, 0);
  return Math.ceil((expiration.getTime() - today.getTime()) / 86400000);
}

function isExpired(expirationDate: string) {
  const days = getDaysUntilExpiration(expirationDate);
  return days !== null && days < 0;
}

function isExpiringSoon(expirationDate: string) {
  const days = getDaysUntilExpiration(expirationDate);
  return days !== null && days >= 0 && days <= 3;
}

const moduleAccent = (kind: InventoryKind) => (kind === "pantry" ? "#E8A838" : "#3BA4F5");

const createStyles = (theme: AppTheme, kind: InventoryKind) => {
  const colors = theme.colors;
  const accent = moduleAccent(kind);
  const accentDim = kind === "pantry" ? "rgba(232, 168, 56, 0.12)" : "rgba(59, 164, 245, 0.12)";

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    listContent: { paddingHorizontal: 20 },
    header: { gap: spacing.sm, marginBottom: spacing.md },
    titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
    titleBlock: { flex: 1 },
    title: { color: colors.text, fontSize: 26, lineHeight: 32, fontWeight: "700" },
    count: { color: colors.textMuted, fontSize: 14, lineHeight: 20, fontWeight: "500" },
    alertBanner: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: kind === "pantry" ? "rgba(232, 168, 56, 0.3)" : "rgba(59, 164, 245, 0.3)",
      backgroundColor: accentDim,
    },
    alertBannerActive: {
      borderColor: accent,
      backgroundColor: kind === "pantry" ? "rgba(232, 168, 56, 0.18)" : "rgba(59, 164, 245, 0.18)",
    },
    expiredBanner: {
      borderColor: theme.isDark ? "rgba(255, 71, 87, 0.32)" : "#F5B5BC",
      backgroundColor: theme.isDark ? "rgba(255, 71, 87, 0.12)" : "#FFF1F2",
    },
    expiredBannerActive: {
      borderColor: colors.danger,
      backgroundColor: theme.isDark ? "rgba(255, 71, 87, 0.2)" : "#FFE4E6",
    },
    alertText: {
      flex: 1,
      color: accent,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700",
    },
    expiredText: {
      color: colors.danger,
    },
    searchBar: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    searchInput: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20, paddingVertical: spacing.xs },
    clearSearchButton: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      backgroundColor: colors.surface3,
    },
    segmentedControl: {
      flexDirection: "row",
      gap: 3,
      padding: 3,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    segmentButton: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 999 },
    segmentButtonActive: { backgroundColor: accentDim },
    segmentText: { color: colors.textMuted, fontSize: 13, lineHeight: 18, fontWeight: "700" },
    segmentTextActive: { color: accent },
    filterRow: { gap: spacing.xs, paddingBottom: 4 },
    filterChip: {
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    filterChipActive: { borderColor: accent, backgroundColor: accentDim },
    filterChipText: { color: colors.textMuted, fontSize: 12, lineHeight: 16, fontWeight: "600" },
    filterChipTextActive: { color: accent },
    toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
    viewToggle: { flexDirection: "row", gap: spacing.xs },
    viewButton: {
      width: 38,
      height: 38,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    viewButtonActive: { borderColor: accent, backgroundColor: accent },
    clearButton: {
      minHeight: 36,
      justifyContent: "center",
      paddingHorizontal: spacing.md,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    clearButtonText: { color: accent, ...typography.caption, fontWeight: "700" },
    gridRow: { gap: spacing.sm },
    gridItem: { flex: 1, maxWidth: "50%", marginBottom: spacing.sm },
    separator: { height: spacing.sm },
    emptyState: { alignItems: "center", paddingVertical: 48, paddingHorizontal: spacing.md },
    emptyTitle: { marginTop: spacing.sm, color: colors.text, ...typography.h2, textAlign: "center" },
    emptySubtitle: { marginTop: 4, color: colors.textMuted, ...typography.body, textAlign: "center" },
    pagination: { gap: spacing.sm, marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
    paginationLabel: { color: colors.textMuted, ...typography.caption, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: "600" },
    pageSizeOptions: { flexDirection: "row", gap: spacing.xs },
    pageSizeButton: {
      minWidth: 44,
      minHeight: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    pageSizeButtonActive: { borderColor: accent, backgroundColor: accent },
    pageSizeText: { color: colors.textMuted, ...typography.caption, fontWeight: "700" },
    pageSizeTextActive: { color: colors.logoTint },
    pageControls: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    pageButton: {
      minHeight: 38,
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      paddingHorizontal: spacing.sm,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    pageButtonText: { color: colors.primary, ...typography.caption, fontWeight: "700" },
    pageStatus: { flex: 1, color: colors.textMuted, textAlign: "center", ...typography.caption },
    fab: {
      position: "absolute",
      right: 20,
      width: 52,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 26,
      backgroundColor: accent,
      shadowColor: "#000",
      shadowOpacity: theme.isDark ? 0.6 : 0.18,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 6,
    },
    fabPressed: { opacity: 0.88, transform: [{ scale: 0.94 }] },
    buttonPressed: { opacity: 0.85 },
    disabled: { opacity: 0.45 },
  });
};
