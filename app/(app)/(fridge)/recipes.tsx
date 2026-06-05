import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useI18n } from "../../../src/i18n/I18nProvider";
import { subscribeToFridgeItems, type FridgeItem } from "../../../src/lib/firestore/fridgeItems";
import { subscribeToRecipes, type Recipe } from "../../../src/lib/firestore/recipes";
import { useAuth } from "../../../src/providers/AuthProvider";
import { colors, radius, spacing, typography } from "../../../src/theme/tokens";

const PAGE_SIZE = 10;

export default function RecipesScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
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
  const totalPages = Math.max(1, Math.ceil(recipes.length / PAGE_SIZE));
  const pageRecipes = useMemo(
    () => recipes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, recipes]
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const openRecipe = (pathname: "/(app)/recipe-details" | "/(app)/edit-recipe", recipe: Recipe) => {
    router.push({ pathname, params: { recipe: JSON.stringify(recipe) } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("recipes.title")}</Text>
        <Pressable onPress={() => router.push("/(app)/add-recipe")} style={styles.addButton}>
          <Text style={styles.addText}>{t("recipes.add_button")}</Text>
        </Pressable>
      </View>
      <FlatList
        data={pageRecipes}
        keyExtractor={(recipe) => recipe.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t("recipes.empty")}</Text>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openRecipe("/(app)/recipe-details", item)}
            style={styles.card}
          >
            <View style={styles.cardContent}>
              <Text style={styles.recipeName}>{item.name}</Text>
              <Text style={styles.meta}>{t("recipes.calories_value", { calories: item.calories })}</Text>
              <Text style={styles.meta}>{t("recipes.portions_value", { portions: item.portions })}</Text>
              <View style={styles.ingredientGroup}>
                <Text style={styles.groupLabel}>{t("recipes.ingredients_in_fridge")}</Text>
                <View style={styles.chips}>
                  {item.ingredients
                    .filter((ingredient) => currentFridgeItemIds.has(ingredient.fridgeItemId))
                    .map((ingredient) => (
                      <Text key={ingredient.fridgeItemId} style={styles.availableChip}>
                        {ingredient.name}
                      </Text>
                    ))}
                </View>
              </View>
              <View style={styles.ingredientGroup}>
                <Text style={styles.groupLabel}>{t("recipes.ingredients_need_to_buy")}</Text>
                <View style={styles.chips}>
                  {item.ingredients
                    .filter((ingredient) => !currentFridgeItemIds.has(ingredient.fridgeItemId))
                    .map((ingredient) => (
                      <Text key={ingredient.fridgeItemId} style={styles.missingChip}>
                        {ingredient.name}
                      </Text>
                    ))}
                </View>
              </View>
            </View>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                openRecipe("/(app)/edit-recipe", item);
              }}
              style={styles.editButton}
            >
              <Text style={styles.editText}>{t("card.edit")}</Text>
            </Pressable>
          </Pressable>
        )}
      />
      <View style={styles.pagination}>
        <Pressable
          disabled={page === 1}
          onPress={() => setPage((current) => current - 1)}
          style={[styles.pageButton, page === 1 && styles.disabled]}
        >
          <Text style={styles.pageText}>{t("recipes.page_previous")}</Text>
        </Pressable>
        <Text style={styles.pageStatus}>{t("recipes.page_status", { page, total: totalPages })}</Text>
        <Pressable
          disabled={page === totalPages}
          onPress={() => setPage((current) => current + 1)}
          style={[styles.pageButton, page === totalPages && styles.disabled]}
        >
          <Text style={styles.pageText}>{t("recipes.page_next")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  title: { color: colors.text, ...typography.h1 },
  addButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.accent },
  addText: { color: colors.background, ...typography.body, fontWeight: "700" },
  list: { flexGrow: 1, gap: spacing.sm },
  empty: { color: colors.muted, ...typography.body },
  card: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface },
  cardContent: { flex: 1, gap: spacing.xs },
  recipeName: { color: colors.text, ...typography.h2 },
  meta: { color: colors.muted, ...typography.caption },
  ingredientGroup: { gap: spacing.xs, marginTop: spacing.xs },
  groupLabel: { color: colors.text, ...typography.caption, textTransform: "uppercase" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  availableChip: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radius.pill, color: colors.accent, backgroundColor: colors.successSurface, ...typography.caption },
  missingChip: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radius.pill, color: colors.danger, backgroundColor: colors.dangerSurface, ...typography.caption },
  editButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.card },
  editText: { color: colors.primary, ...typography.body },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  pageButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.card },
  pageText: { color: colors.primary, ...typography.caption },
  pageStatus: { color: colors.muted, ...typography.caption },
  disabled: { opacity: 0.4 },
});
