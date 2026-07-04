import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RecipeIngredientZone } from "../../src/components/RecipeIngredientZone";
import { useI18n } from "../../src/i18n/I18nProvider";
import type { CocktailRecipe } from "../../src/lib/firestore/cocktailRecipes";
import { subscribeToCocktailItems, type InventoryItem } from "../../src/lib/firestore/inventoryItems";
import { hydrateRecipeIngredients } from "../../src/lib/firestore/recipes";
import { addShoppingListItems } from "../../src/lib/firestore/shoppingList";
import {
  COCKTAIL_RECIPES_ROUTE,
  dismissToOrReplace,
  goBackOrReplace,
} from "../../src/lib/navigation";
import { useAuth } from "../../src/providers/AuthProvider";
import { useTheme, type AppTheme } from "../../src/providers/ThemeProvider";
import { spacing, typography } from "../../src/theme/tokens";

const parseRecipe = (value: string | string[] | undefined): CocktailRecipe | null => {
  try {
    return JSON.parse(Array.isArray(value) ? value[0] : value ?? "") as CocktailRecipe;
  } catch {
    return null;
  }
};

export default function CocktailRecipeDetailsScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
  const params = useLocalSearchParams<{ recipe?: string | string[] }>();
  const recipe = parseRecipe(params.recipe);
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    return subscribeToCocktailItems(user.id, setItems);
  }, [user]);

  const currentItemIds = useMemo(
    () => new Set(items.filter((item) => !item.isHistory).map((item) => item.id)),
    [items]
  );
  const hydratedIngredients = useMemo(
    () => (recipe ? hydrateRecipeIngredients(recipe.ingredients, items) : []),
    [items, recipe]
  );
  const availableIngredients = useMemo(
    () => hydratedIngredients.filter((ingredient) => currentItemIds.has(ingredient.fridgeItemId)),
    [currentItemIds, hydratedIngredients]
  );
  const missingIngredients = useMemo(
    () => hydratedIngredients.filter((ingredient) => !currentItemIds.has(ingredient.fridgeItemId)),
    [currentItemIds, hydratedIngredients]
  );

  const addMissingItems = () => {
    if (!user || !recipe) return;
    addShoppingListItems(
      user.id,
      missingIngredients.map((ingredient) => ({
        source: "plain",
        name: ingredient.name,
        count: 1,
        quantity: ingredient.quantity,
        quantityType: ingredient.quantityType,
      }))
    ).catch(() => {});
  };

  if (!recipe) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MaterialCommunityIcons name="glass-cocktail-off" color={colors.muted} size={46} />
        <Text style={styles.title}>{t("recipes.not_found")}</Text>
        <Pressable
          onPress={() => dismissToOrReplace(router, COCKTAIL_RECIPES_ROUTE)}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.secondaryButtonText}>{t("cocktail_recipes.back")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top + spacing.sm, spacing.lg),
          paddingBottom: Math.max(insets.bottom + spacing.lg, spacing.xl),
        },
      ]}
    >
      <View style={styles.navBar}>
        <Pressable
          onPress={() => goBackOrReplace(router, COCKTAIL_RECIPES_ROUTE)}
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel={t("cocktail_recipes.back")}
        >
          <MaterialCommunityIcons name="arrow-left" color={colors.text} size={20} />
        </Pressable>
        <Text style={styles.navTitle}>{t("cocktail_recipes.title")}</Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons name="glass-cocktail" color={colors.primary} size={30} />
        </View>
        <Text style={styles.title}>{recipe.name}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <MaterialCommunityIcons name="flash-outline" color={colors.accent} size={14} />
            <Text style={styles.metaText}>
              {t("recipes.calories_value", { calories: recipe.calories })}
            </Text>
          </View>
          <View style={styles.metaPill}>
            <MaterialCommunityIcons name="glass-cocktail" color={colors.textMuted} size={14} />
            <Text style={styles.metaText}>
              {t("recipes.portions_value", { portions: recipe.portions })}
            </Text>
          </View>
        </View>
        {missingIngredients.length > 0 ? (
          <Pressable
            onPress={addMissingItems}
            style={({ pressed }) => [styles.shoppingButton, pressed && styles.buttonPressed]}
          >
            <MaterialCommunityIcons name="cart-plus" color={colors.primary} size={17} />
            <Text style={styles.shoppingButtonText}>{t("recipes.add_missing")}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="text-box-outline" color={colors.primary} size={18} />
          <Text style={styles.label}>{t("recipes.instructions")}</Text>
        </View>
        <Text style={styles.instructions}>{recipe.instructions}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="glass-cocktail" color={colors.accent} size={18} />
          <Text style={styles.groupTitle}>{t("cocktail_recipes.available")}</Text>
        </View>
        <RecipeIngredientZone ingredients={availableIngredients} hideLabel />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="cart-outline" color={colors.danger} size={18} />
          <Text style={styles.groupTitle}>{t("cocktail_recipes.missing")}</Text>
        </View>
        <RecipeIngredientZone ingredients={missingIngredients} hideLabel />
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: AppTheme) => {
  const colors = theme.colors;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.lg },
    content: { flexGrow: 1, paddingHorizontal: 20, gap: spacing.lg, backgroundColor: colors.background },
    navBar: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    backButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2 },
    navTitle: { flex: 1, color: colors.text, fontSize: 18, lineHeight: 24, fontWeight: "600" },
    hero: { gap: spacing.sm, padding: spacing.md, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2 },
    heroIcon: { width: 54, height: 54, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: colors.surface3 },
    title: { color: colors.text, fontSize: 26, lineHeight: 32, fontWeight: "700" },
    metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    metaPill: { minHeight: 28, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: spacing.sm, borderRadius: 14, backgroundColor: colors.surface3 },
    metaText: { color: colors.textMuted, ...typography.caption, fontWeight: "700" },
    section: { gap: spacing.sm },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    label: { color: colors.textMuted, ...typography.caption, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: "700" },
    groupTitle: { color: colors.text, ...typography.h2 },
    instructions: { padding: spacing.md, borderRadius: 16, borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.surface2, ...typography.body, lineHeight: 23 },
    secondaryButton: { minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2 },
    shoppingButton: { minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, marginTop: spacing.xs, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface3 },
    shoppingButtonText: { color: colors.primary, ...typography.body, fontWeight: "700" },
    secondaryButtonText: { color: colors.primary, ...typography.body, fontWeight: "700" },
    buttonPressed: { opacity: 0.85 },
  });
};
