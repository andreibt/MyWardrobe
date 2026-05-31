import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { RecipeIngredientZone } from "../../src/components/RecipeIngredientZone";
import { useI18n } from "../../src/i18n/I18nProvider";
import type { Recipe } from "../../src/lib/firestore/recipes";
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
  const router = useRouter();
  const params = useLocalSearchParams<{ recipe?: string | string[] }>();
  const recipe = parseRecipe(params.recipe);

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
      <RecipeIngredientZone ingredients={recipe.ingredients} />
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
  instructions: { color: colors.text, ...typography.body },
  backButton: { alignSelf: "flex-start", marginTop: spacing.md, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.card },
  backText: { color: colors.primary, ...typography.body },
});
