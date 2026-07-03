import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WardrobeCard } from "../../../src/components/WardrobeCard";
import { useI18n } from "../../../src/i18n/I18nProvider";
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
import { useTheme, type AppTheme } from "../../../src/providers/ThemeProvider";
import { useTryOnConfig } from "../../../src/providers/TryOnConfigProvider";
import { spacing, typography } from "../../../src/theme/tokens";

export default function WardrobeListScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
  const { activeConfig } = useTryOnConfig();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [tags, setTags] = useState<WardrobeTag[]>([]);
  const [tryOnItems, setTryOnItems] = useState<TryOnItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    return subscribeToWardrobeItems(user.id, (nextItems) => {
      setItems(nextItems);
      setIsLoading(false);
    });
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

  const tryOnByWardrobeId = useMemo(
    () => new Map(tryOnItems.map((entry) => [entry.wardrobeItemId, entry])),
    [tryOnItems]
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesTags =
        tagFilters.length === 0 ||
        (item.tags ?? []).some((tag) => tagFilters.includes(tag));
      const matchesSearch =
        !normalizedQuery ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery) ||
        item.color.toLowerCase().includes(normalizedQuery) ||
        (item.tags ?? []).some((tag) => tag.toLowerCase().includes(normalizedQuery));
      return matchesTags && matchesSearch;
    });
  }, [items, searchQuery, tagFilters]);

  const toggleFilter = (tag: string) => {
    setTagFilters((current) =>
      current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]
    );
  };

  const confirmDelete = (itemId: string) => {
    const handleDelete = () => {
      deleteWardrobeItem(itemId).catch(() => {});
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(t("wardrobe_list.delete_confirm"))) {
        handleDelete();
      }
      return;
    }

    Alert.alert(t("wardrobe_list.delete_title"), t("wardrobe_list.delete_message"), [
      { text: t("wardrobe_list.delete_cancel"), style: "cancel" },
      {
        text: t("wardrobe_list.delete_confirm_button"),
        style: "destructive",
        onPress: handleDelete,
      },
    ]);
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
        data={filteredItems}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: Math.max(insets.top + spacing.sm, spacing.lg),
            paddingBottom: Math.max(insets.bottom + 96, 120),
          },
        ]}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{t("tabs.wardrobe_list")}</Text>
              <Text style={styles.count}>{t("home.dashboard.items", { count: items.length })}</Text>
            </View>

            {activeConfig ? (
              <View style={styles.configBadge}>
                <Text style={styles.configLabel}>{t("wardrobe_list.active_config")}</Text>
                <Text style={styles.configName}>{activeConfig}</Text>
              </View>
            ) : null}

            <View style={styles.searchBar}>
              <MaterialCommunityIcons name="magnify" color={colors.muted} size={18} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t("wardrobe_list.search_placeholder")}
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
                autoCapitalize="none"
              />
            </View>

            <FlatList
              horizontal
              data={[{ id: "all", name: t("wardrobe_list.filter_hint") }, ...tags]}
              keyExtractor={(tag) => tag.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
              renderItem={({ item }) => {
                const isAll = item.id === "all";
                const selected = isAll ? tagFilters.length === 0 : tagFilters.includes(item.name);
                return (
                  <Pressable
                    onPress={() => (isAll ? setTagFilters([]) : toggleFilter(item.name))}
                    style={({ pressed }) => [
                      styles.filterChip,
                      selected && styles.filterChipActive,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                      {item.name}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <WardrobeCard
              item={item}
              compact
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
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="wardrobe-outline" color={colors.muted} size={46} />
            <Text style={styles.emptyTitle}>
              {isLoading
                ? t("wardrobe_list.empty_loading")
                : tagFilters.length > 0 || searchQuery
                ? t("wardrobe_list.empty_filtered")
                : t("wardrobe_list.empty")}
            </Text>
            <Text style={styles.emptySubtitle}>
              {tagFilters.length > 0 || searchQuery
                ? t("wardrobe_list.empty_filtered_subtitle")
                : t("wardrobe_list.empty_subtitle")}
            </Text>
          </View>
        }
      />

      <Pressable
        onPress={() => router.push("/(app)/add-item")}
        style={({ pressed }) => [
          styles.fab,
          { bottom: Math.max(insets.bottom + spacing.lg, 76) },
          pressed && styles.fabPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t("wardrobe_list.add_button")}
      >
        <MaterialCommunityIcons name="plus" color={colors.logoTint} size={28} />
      </Pressable>
    </View>
  );
}

const createStyles = (theme: AppTheme) => {
  const colors = theme.colors;
  const primaryDim = theme.isDark ? "rgba(0, 212, 255, 0.15)" : "rgba(22, 27, 34, 0.08)";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingHorizontal: 20,
    },
    header: {
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    title: {
      color: colors.text,
      fontSize: 26,
      lineHeight: 32,
      fontWeight: "700",
    },
    count: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500",
    },
    configBadge: {
      alignSelf: "flex-start",
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    configLabel: {
      color: colors.textMuted,
      ...typography.caption,
      textTransform: "uppercase",
      letterSpacing: 0.7,
    },
    configName: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
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
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
      paddingVertical: spacing.xs,
    },
    filterRow: {
      gap: spacing.xs,
      paddingBottom: 4,
    },
    filterChip: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    filterChipActive: {
      borderColor: colors.primary,
      backgroundColor: primaryDim,
    },
    filterChipText: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "600",
    },
    filterChipTextActive: {
      color: colors.primary,
    },
    gridRow: {
      gap: spacing.sm,
    },
    gridItem: {
      flex: 1,
      maxWidth: "50%",
      marginBottom: spacing.sm,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 48,
      paddingHorizontal: spacing.md,
    },
    emptyTitle: {
      marginTop: spacing.sm,
      color: colors.text,
      ...typography.h2,
      textAlign: "center",
    },
    emptySubtitle: {
      marginTop: 4,
      color: colors.textMuted,
      ...typography.body,
      textAlign: "center",
    },
    fab: {
      position: "absolute",
      right: 20,
      width: 52,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 26,
      backgroundColor: colors.primary,
      shadowColor: "#000",
      shadowOpacity: theme.isDark ? 0.6 : 0.18,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 6,
    },
    fabPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.94 }],
    },
    buttonPressed: {
      opacity: 0.85,
    },
  });
};
