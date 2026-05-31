import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { RecipeForm } from "../../src/components/RecipeForm";
import { useI18n } from "../../src/i18n/I18nProvider";
import { addRecipe } from "../../src/lib/firestore/recipes";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, spacing, typography } from "../../src/theme/tokens";

export default function AddRecipeScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("recipes.add_title")}</Text>
      <RecipeForm
        ownerId={user?.id ?? null}
        submitLabel={t("recipes.save")}
        onSubmit={async (value) => {
          if (!user) return;
          await addRecipe(user.id, {
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
  title: { padding: spacing.lg, paddingBottom: 0, color: colors.text, ...typography.h1 },
});
