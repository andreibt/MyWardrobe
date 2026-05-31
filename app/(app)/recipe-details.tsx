import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { RecipeIngredientZone } from "../../src/components/RecipeIngredientZone";
import { useI18n } from "../../src/i18n/I18nProvider";
import { subscribeToFridgeItems, type FridgeItem } from "../../src/lib/firestore/fridgeItems";
import type { Recipe } from "../../src/lib/firestore/recipes";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

const parseRecipe = (value: string | string[] | undefined): Recipe | null => {
  try {
    return JSON.parse(Array.isArray(value) ? value[0] : value ?? "") as Recipe;
  } catch {
    return null;
  }
};

export default function RecipeDetailsScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ recipe?: string | string[] }>();
  const recipe = parseRecipe(params.recipe);
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);

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
  const inFridgeIngredients = useMemo(
    () => recipe?.ingredients.filter((ingredient) => currentFridgeItemIds.has(ingredient.fridgeItemId)) ?? [],
    [currentFridgeItemIds, recipe]
  );
  const needToBuyIngredients = useMemo(
    () => recipe?.ingredients.filter((ingredient) => !currentFridgeItemIds.has(ingredient.fridgeItemId)) ?? [],
    [currentFridgeItemIds, recipe]
  );

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t("recipes.not_found")}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{recipe.name}</Text>
      <Text style={styles.meta}>{t("recipes.calories_value", { calories: recipe.calories })}</Text>
      <Text style={styles.meta}>{t("recipes.portions_value", { portions: recipe.portions })}</Text>
      <View style={styles.section}>
        <Text style={styles.label}>{t("recipes.instructions")}</Text>
        <Text style={styles.instructions}>{recipe.instructions}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.groupTitle}>{t("recipes.ingredients_in_fridge")}</Text>
        <RecipeIngredientZone ingredients={inFridgeIngredients} hideLabel />
      </View>
      <View style={styles.section}>
        <Text style={styles.groupTitle}>{t("recipes.ingredients_need_to_buy")}</Text>
        <RecipeIngredientZone ingredients={needToBuyIngredients} hideLabel />
      </View>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>{t("recipes.back")}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.background },
  title: { color: colors.text, ...typography.h1 },
  meta: { color: colors.muted, ...typography.body },
  section: { marginTop: spacing.sm, gap: spacing.sm },
  label: { color: colors.text, ...typography.caption, textTransform: "uppercase" },
  groupTitle: { color: colors.primary, ...typography.h2 },
  instructions: { color: colors.text, ...typography.body },
  backButton: { alignSelf: "flex-start", marginTop: spacing.md, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.card },
  backText: { color: colors.primary, ...typography.body },
});
