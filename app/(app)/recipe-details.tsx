import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RecipeIngredientZone } from "../../src/components/RecipeIngredientZone";
import { useI18n } from "../../src/i18n/I18nProvider";
import { subscribeToFridgeItems, type FridgeItem } from "../../src/lib/firestore/fridgeItems";
import type { Recipe } from "../../src/lib/firestore/recipes";
import { addShoppingListItems } from "../../src/lib/firestore/shoppingList";
import { useAuth } from "../../src/providers/AuthProvider";
import { useTheme, type AppTheme } from "../../src/providers/ThemeProvider";
import { spacing, typography } from "../../src/theme/tokens";

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
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
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

  const addMissingItems = () => {
    if (!user || !recipe) {
      return;
    }
    const fridgeItemsById = new Map(fridgeItems.map((item) => [item.id, item]));
    addShoppingListItems(
      user.id,
      needToBuyIngredients.map((ingredient) => {
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

  if (!recipe) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MaterialCommunityIcons name="book-alert-outline" color={colors.muted} size={46} />
        <Text style={styles.title}>{t("recipes.not_found")}</Text>
        <Pressable
          onPress={() => router.replace("/(app)/(fridge)/recipes")}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.secondaryButtonText}>{t("recipes.back")}</Text>
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
          onPress={() => router.replace("/(app)/(fridge)/recipes")}
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel={t("recipes.back")}
        >
          <MaterialCommunityIcons name="arrow-left" color={colors.text} size={20} />
        </Pressable>
        <Text style={styles.navTitle}>{t("recipes.title")}</Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons name="silverware-fork-knife" color={colors.primary} size={30} />
        </View>
        <Text style={styles.title}>{recipe.name}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <MaterialCommunityIcons name="fire" color={colors.accent} size={14} />
            <Text style={styles.metaText}>
              {t("recipes.calories_value", { calories: recipe.calories })}
            </Text>
          </View>
          <View style={styles.metaPill}>
            <MaterialCommunityIcons name="account-group-outline" color={colors.textMuted} size={14} />
            <Text style={styles.metaText}>
              {t("recipes.portions_value", { portions: recipe.portions })}
            </Text>
          </View>
        </View>
        {needToBuyIngredients.length > 0 ? (
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
          <MaterialCommunityIcons name="fridge-outline" color={colors.accent} size={18} />
          <Text style={styles.groupTitle}>{t("recipes.ingredients_in_fridge")}</Text>
        </View>
        <RecipeIngredientZone ingredients={inFridgeIngredients} hideLabel />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="cart-outline" color={colors.danger} size={18} />
          <Text style={styles.groupTitle}>{t("recipes.ingredients_need_to_buy")}</Text>
        </View>
        <RecipeIngredientZone ingredients={needToBuyIngredients} hideLabel />
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: AppTheme) => {
  const colors = theme.colors;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      padding: spacing.lg,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: 20,
      gap: spacing.lg,
      backgroundColor: colors.background,
    },
    navBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    backButton: {
      width: 38,
      height: 38,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    navTitle: {
      flex: 1,
      color: colors.text,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "600",
    },
    hero: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    heroIcon: {
      width: 54,
      height: 54,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      backgroundColor: colors.surface3,
    },
    title: {
      color: colors.text,
      fontSize: 26,
      lineHeight: 32,
      fontWeight: "700",
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    metaPill: {
      minHeight: 28,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: spacing.sm,
      borderRadius: 14,
      backgroundColor: colors.surface3,
    },
    metaText: {
      color: colors.textMuted,
      ...typography.caption,
      fontWeight: "700",
    },
    section: {
      gap: spacing.sm,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    label: {
      color: colors.textMuted,
      ...typography.caption,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      fontWeight: "700",
    },
    groupTitle: {
      color: colors.text,
      ...typography.h2,
    },
    instructions: {
      padding: spacing.md,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      backgroundColor: colors.surface2,
      ...typography.body,
      lineHeight: 23,
    },
    secondaryButton: {
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.md,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    shoppingButton: {
      minHeight: 40,
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
      ...typography.body,
      fontWeight: "700",
    },
    secondaryButtonText: {
      color: colors.primary,
      ...typography.body,
      fontWeight: "700",
    },
    buttonPressed: {
      opacity: 0.85,
    },
  });
};
