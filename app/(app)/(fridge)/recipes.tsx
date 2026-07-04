import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../../../src/i18n/I18nProvider";
import { subscribeToFridgeItems, type FridgeItem } from "../../../src/lib/firestore/fridgeItems";
import { hydrateRecipeIngredients, subscribeToRecipes, type Recipe } from "../../../src/lib/firestore/recipes";
import { addShoppingListItems } from "../../../src/lib/firestore/shoppingList";
import { useAuth } from "../../../src/providers/AuthProvider";
import { useTheme, type AppTheme } from "../../../src/providers/ThemeProvider";
import { spacing, typography } from "../../../src/theme/tokens";

const PAGE_SIZE = 10;

export default function RecipesScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) {
      setRecipes([]);
      return;
    }
    return subscribeToRecipes(user.id, setRecipes);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setFridgeItems([]);
      return;
    }
    return subscribeToFridgeItems(user.id, setFridgeItems);
  }, [user]);

  const currentFridgeItemIds = useMemo(
    () => new Set(fridgeItems.filter((item) => !item.isHistory).map((item) => item.id)),
    [fridgeItems]
  );

  const filteredRecipes = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return recipes;
    }
    return recipes.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(normalizedQuery) ||
        recipe.instructions.toLowerCase().includes(normalizedQuery) ||
        hydrateRecipeIngredients(recipe.ingredients, fridgeItems).some((ingredient) =>
          ingredient.name.toLowerCase().includes(normalizedQuery)
        )
    );
  }, [fridgeItems, recipes, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRecipes.length / PAGE_SIZE));
  const pageRecipes = useMemo(
    () => filteredRecipes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRecipes, page]
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const openRecipe = (pathname: "/(app)/recipe-details" | "/(app)/edit-recipe", recipe: Recipe) => {
    router.push({
      pathname,
      params: {
        recipe: JSON.stringify({
          ...recipe,
          ingredients: hydrateRecipeIngredients(recipe.ingredients, fridgeItems),
        }),
      },
    });
  };

  const addMissingItems = (recipe: Recipe) => {
    if (!user) {
      return;
    }
    const hydratedIngredients = hydrateRecipeIngredients(recipe.ingredients, fridgeItems);
    const missingIngredients = hydratedIngredients.filter(
      (ingredient) => !currentFridgeItemIds.has(ingredient.fridgeItemId)
    );
    const fridgeItemsById = new Map(fridgeItems.map((item) => [item.id, item]));
    addShoppingListItems(
      user.id,
      missingIngredients.map((ingredient) => {
        const fridgeItem = fridgeItemsById.get(ingredient.fridgeItemId);
        return {
          source: fridgeItem?.isHistory ? "fridgeHistory" : "plain",
          fridgeItemId: fridgeItem ? ingredient.fridgeItemId : undefined,
          name: ingredient.name,
          count: 1,
          quantity: ingredient.quantity,
          quantityType: ingredient.quantityType,
        };
      })
    ).catch(() => {});
  };

  const renderRecipe = ({ item }: { item: Recipe }) => {
    const hydratedIngredients = hydrateRecipeIngredients(item.ingredients, fridgeItems);
    const availableIngredients = hydratedIngredients.filter((ingredient) =>
      currentFridgeItemIds.has(ingredient.fridgeItemId)
    );
    const missingIngredients = hydratedIngredients.filter(
      (ingredient) => !currentFridgeItemIds.has(ingredient.fridgeItemId)
    );

    return (
      <Pressable
        onPress={() => openRecipe("/(app)/recipe-details", item)}
        style={({ pressed }) => [styles.card, pressed && styles.buttonPressed]}
      >
        <View style={styles.cardIcon}>
          <MaterialCommunityIcons name="silverware-fork-knife" color={colors.primary} size={24} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.recipeName} numberOfLines={1}>
              {item.name}
            </Text>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                openRecipe("/(app)/edit-recipe", item);
              }}
              style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed]}
              accessibilityRole="button"
              accessibilityLabel={t("card.edit")}
            >
              <MaterialCommunityIcons name="pencil-outline" color={colors.primary} size={16} />
            </Pressable>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <MaterialCommunityIcons name="fire" color={colors.accent} size={13} />
              <Text style={styles.metaText}>
                {t("recipes.calories_value", { calories: item.calories })}
              </Text>
            </View>
            <View style={styles.metaPill}>
              <MaterialCommunityIcons name="account-group-outline" color={colors.textMuted} size={13} />
              <Text style={styles.metaText}>
                {t("recipes.portions_value", { portions: item.portions })}
              </Text>
            </View>
          </View>

          <View style={styles.ingredientSummary}>
            <View style={styles.ingredientGroup}>
              <Text style={styles.groupLabel}>{t("recipes.ingredients_in_fridge")}</Text>
              <View style={styles.chips}>
                {availableIngredients.length === 0 ? (
                  <Text style={styles.mutedChip}>{t("recipes.ingredients_empty")}</Text>
                ) : (
                  availableIngredients.slice(0, 3).map((ingredient) => (
                    <Text key={ingredient.fridgeItemId} style={styles.availableChip} numberOfLines={1}>
                      {ingredient.name}
                    </Text>
                  ))
                )}
              </View>
            </View>
            <View style={styles.ingredientGroup}>
              <Text style={styles.groupLabel}>{t("recipes.ingredients_need_to_buy")}</Text>
              <View style={styles.chips}>
                {missingIngredients.length === 0 ? (
                  <Text style={styles.availableChip}>{t("home.dashboard.everything_organized")}</Text>
                ) : (
                  missingIngredients.slice(0, 3).map((ingredient) => (
                    <Text key={ingredient.fridgeItemId} style={styles.missingChip} numberOfLines={1}>
                      {ingredient.name}
                    </Text>
                  ))
                )}
              </View>
            </View>
          </View>

          {missingIngredients.length > 0 ? (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                addMissingItems(item);
              }}
              style={({ pressed }) => [styles.shoppingButton, pressed && styles.buttonPressed]}
            >
              <MaterialCommunityIcons name="cart-plus" color={colors.primary} size={16} />
              <Text style={styles.shoppingButtonText}>{t("recipes.add_missing")}</Text>
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={pageRecipes}
        keyExtractor={(recipe) => recipe.id}
        renderItem={renderRecipe}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: Math.max(insets.top + spacing.sm, spacing.lg),
            paddingBottom: Math.max(insets.bottom + 96, 120),
          },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>{t("recipes.title")}</Text>
                <Text style={styles.count}>{t("home.dashboard.items", { count: recipes.length })}</Text>
              </View>
            </View>

            <View style={styles.searchBar}>
              <MaterialCommunityIcons name="magnify" color={colors.muted} size={18} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t("recipes.search_placeholder")}
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
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="book-open-page-variant-outline" color={colors.muted} size={46} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? t("recipes.empty_filtered") : t("recipes.empty")}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? t("wardrobe_list.empty_filtered_subtitle") : t("recipes.empty_subtitle")}
            </Text>
          </View>
        }
        ListFooterComponent={
          filteredRecipes.length > 0 ? (
            <View style={styles.pagination}>
              <Pressable
                disabled={page === 1}
                onPress={() => setPage((current) => Math.max(1, current - 1))}
                style={({ pressed }) => [
                  styles.pageButton,
                  pressed && styles.buttonPressed,
                  page === 1 && styles.disabled,
                ]}
              >
                <MaterialCommunityIcons name="chevron-left" color={colors.primary} size={18} />
                <Text style={styles.pageText}>{t("recipes.page_previous")}</Text>
              </Pressable>
              <Text style={styles.pageStatus}>
                {t("recipes.page_status", { page, total: totalPages })}
              </Text>
              <Pressable
                disabled={page === totalPages}
                onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
                style={({ pressed }) => [
                  styles.pageButton,
                  pressed && styles.buttonPressed,
                  page === totalPages && styles.disabled,
                ]}
              >
                <Text style={styles.pageText}>{t("recipes.page_next")}</Text>
                <MaterialCommunityIcons name="chevron-right" color={colors.primary} size={18} />
              </Pressable>
            </View>
          ) : null
        }
      />

      <Pressable
        onPress={() => router.push("/(app)/add-recipe")}
        style={({ pressed }) => [
          styles.fab,
          { bottom: Math.max(insets.bottom + spacing.lg, 76) },
          pressed && styles.fabPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t("recipes.add_button")}
      >
        <MaterialCommunityIcons name="plus" color={colors.logoTint} size={28} />
      </Pressable>
    </View>
  );
}

const createStyles = (theme: AppTheme) => {
  const colors = theme.colors;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    list: {
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
    titleBlock: {
      flex: 1,
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
    clearSearchButton: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      backgroundColor: colors.surface3,
    },
    separator: {
      height: spacing.sm,
    },
    card: {
      flexDirection: "row",
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      shadowColor: "#000",
      shadowOpacity: theme.isDark ? 0.18 : 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardIcon: {
      width: 56,
      height: 56,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      backgroundColor: colors.surface3,
    },
    cardContent: {
      flex: 1,
      gap: spacing.xs,
    },
    cardTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    recipeName: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "700",
    },
    editButton: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface3,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    metaPill: {
      minHeight: 24,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: spacing.xs,
      borderRadius: 12,
      backgroundColor: colors.surface3,
    },
    metaText: {
      color: colors.textMuted,
      ...typography.caption,
      fontWeight: "600",
    },
    ingredientSummary: {
      gap: spacing.xs,
    },
    ingredientGroup: {
      gap: 4,
    },
    groupLabel: {
      color: colors.textMuted,
      ...typography.caption,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      fontWeight: "700",
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    availableChip: {
      maxWidth: "100%",
      paddingVertical: 5,
      paddingHorizontal: spacing.sm,
      borderRadius: 999,
      color: colors.accent,
      backgroundColor: theme.isDark ? "rgba(0, 230, 118, 0.12)" : "#F6FFED",
      ...typography.caption,
      fontWeight: "700",
    },
    missingChip: {
      maxWidth: "100%",
      paddingVertical: 5,
      paddingHorizontal: spacing.sm,
      borderRadius: 999,
      color: colors.danger,
      backgroundColor: theme.isDark ? "rgba(255, 71, 87, 0.12)" : "#FFF2F0",
      ...typography.caption,
      fontWeight: "700",
    },
    mutedChip: {
      color: colors.textMuted,
      ...typography.caption,
    },
    shoppingButton: {
      minHeight: 36,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      marginTop: spacing.xs,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface3,
    },
    shoppingButtonText: {
      color: colors.primary,
      ...typography.caption,
      fontWeight: "700",
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
    pagination: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
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
    pageText: {
      color: colors.primary,
      ...typography.caption,
      fontWeight: "700",
    },
    pageStatus: {
      flex: 1,
      color: colors.textMuted,
      textAlign: "center",
      ...typography.caption,
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
    disabled: {
      opacity: 0.45,
    },
  });
};
