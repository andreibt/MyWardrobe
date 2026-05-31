import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { RecipeForm, type RecipeFormValue } from "../../src/components/RecipeForm";
import { useI18n } from "../../src/i18n/I18nProvider";
import { updateRecipe, type Recipe } from "../../src/lib/firestore/recipes";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

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

  const initialValue: RecipeFormValue = {
    name: recipe.name,
    instructions: recipe.instructions,
    calories: String(recipe.calories),
    portions: String(recipe.portions),
    ingredients: recipe.ingredients,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("recipes.edit_title")}</Text>
        <Pressable
          onPress={() => router.replace("/(app)/(fridge)/recipes")}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>{t("card.close")}</Text>
        </Pressable>
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
          router.replace("/(app)/(fridge)/recipes");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, padding: spacing.lg, paddingBottom: 0 },
  title: { color: colors.text, ...typography.h1 },
  closeButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.card },
  closeText: { color: colors.primary, ...typography.body },
});
