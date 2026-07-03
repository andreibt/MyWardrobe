import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RecipeForm } from "../../src/components/RecipeForm";
import { useI18n } from "../../src/i18n/I18nProvider";
import { addCocktailRecipe } from "../../src/lib/firestore/cocktailRecipes";
import { subscribeToCocktailItems } from "../../src/lib/firestore/inventoryItems";
import { useAuth } from "../../src/providers/AuthProvider";
import { useTheme, type AppTheme } from "../../src/providers/ThemeProvider";
import { spacing } from "../../src/theme/tokens";

export default function AddCocktailRecipeScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;

  return (
    <View style={styles.container}>
      <View style={[styles.navBar, { paddingTop: Math.max(insets.top + spacing.sm, spacing.lg) }]}>
        <Pressable
          onPress={() => router.replace("/(app)/(cocktails)/cocktail-recipes")}
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel={t("card.close")}
        >
          <MaterialCommunityIcons name="arrow-left" color={colors.text} size={20} />
        </Pressable>
        <Text style={styles.navTitle}>{t("cocktail_recipes.add_title")}</Text>
      </View>
      <RecipeForm
        ownerId={user?.id ?? null}
        submitLabel={t("cocktail_recipes.save")}
        subscribeItems={subscribeToCocktailItems}
        pickerIcon="glass-cocktail"
        ingredientCurrentLabel={t("cocktails.current")}
        ingredientHistoryLabel={t("cocktails.history")}
        onSubmit={async (value) => {
          if (!user) return;
          await addCocktailRecipe(user.id, {
            ...value,
            calories: Number(value.calories),
            portions: Number(value.portions),
          });
          router.replace("/(app)/(cocktails)/cocktail-recipes");
        }}
      />
    </View>
  );
}

const createStyles = (theme: AppTheme) => {
  const colors = theme.colors;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    navBar: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: 20 },
    backButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2 },
    navTitle: { flex: 1, color: colors.text, fontSize: 18, lineHeight: 24, fontWeight: "600" },
    buttonPressed: { opacity: 0.85 },
  });
};
