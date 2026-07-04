import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RecipeForm, type RecipeFormValue } from "../../src/components/RecipeForm";
import { useI18n } from "../../src/i18n/I18nProvider";
import { updateRecipe, type Recipe } from "../../src/lib/firestore/recipes";
import {
  dismissToOrReplace,
  FRIDGE_RECIPES_ROUTE,
  goBackOrReplace,
} from "../../src/lib/navigation";
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

export default function EditRecipeScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
  const params = useLocalSearchParams<{ recipe?: string | string[] }>();
  const recipe = parseRecipe(params.recipe);

  if (!recipe) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MaterialCommunityIcons name="book-alert-outline" color={colors.muted} size={46} />
        <Text style={styles.title}>{t("recipes.not_found")}</Text>
        <Pressable
          onPress={() => dismissToOrReplace(router, FRIDGE_RECIPES_ROUTE)}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.secondaryButtonText}>{t("recipes.back")}</Text>
        </Pressable>
      </View>
    );
  }

  const initialValue: RecipeFormValue = {
    name: recipe.name,
    instructions: recipe.instructions,
    calories: String(recipe.calories),
    portions: String(recipe.portions),
    ingredients: recipe.ingredients,
  };

  return (
    <View style={styles.container}>
      <View style={[styles.navBar, { paddingTop: Math.max(insets.top + spacing.sm, spacing.lg) }]}>
        <Pressable
          onPress={() => goBackOrReplace(router, FRIDGE_RECIPES_ROUTE)}
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel={t("card.close")}
        >
          <MaterialCommunityIcons name="arrow-left" color={colors.text} size={20} />
        </Pressable>
        <Text style={styles.navTitle}>{t("recipes.edit_title")}</Text>
      </View>
      <RecipeForm
        ownerId={user?.id ?? null}
        initialValue={initialValue}
        submitLabel={t("recipes.save_changes")}
        onSubmit={async (value) => {
          await updateRecipe(recipe.id, {
            ...value,
            calories: Number(value.calories),
            portions: Number(value.portions),
          });
          dismissToOrReplace(router, FRIDGE_RECIPES_ROUTE);
        }}
      />
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
    centered: {
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      padding: spacing.lg,
    },
    navBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: 20,
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
    title: {
      color: colors.text,
      ...typography.h2,
      textAlign: "center",
    },
    secondaryButton: {
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: spacing.md,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
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
