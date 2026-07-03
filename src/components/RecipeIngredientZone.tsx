import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../i18n/I18nProvider";
import type { RecipeIngredient } from "../lib/firestore/recipes";
import { useTheme, type AppTheme } from "../providers/ThemeProvider";
import { radius, spacing, typography } from "../theme/tokens";

type RecipeIngredientZoneProps = {
  ingredients: RecipeIngredient[];
  editable?: boolean;
  hideLabel?: boolean;
  onRemove?: (fridgeItemId: string) => void;
};

export function RecipeIngredientZone({
  ingredients,
  editable = false,
  hideLabel = false,
  onRemove,
}: RecipeIngredientZoneProps) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
  const [selected, setSelected] = useState<RecipeIngredient | null>(null);

  return (
    <View style={styles.section}>
      {!hideLabel ? <Text style={styles.label}>{t("recipes.ingredients")}</Text> : null}
      {ingredients.length === 0 ? (
        <Text style={styles.empty}>{t("recipes.ingredients_empty")}</Text>
      ) : (
        <View style={styles.chips}>
          {ingredients.map((ingredient) => (
            <View key={ingredient.fridgeItemId} style={styles.chip}>
              <Pressable
                onPress={() => setSelected(ingredient)}
                style={({ pressed }) => [styles.chipButton, pressed && styles.buttonPressed]}
              >
                <MaterialCommunityIcons name="food-variant" color={colors.primary} size={14} />
                <Text style={styles.chipText}>{ingredient.name}</Text>
              </Pressable>
              {editable && onRemove ? (
                <Pressable
                  onPress={() => onRemove(ingredient.fridgeItemId)}
                  style={({ pressed }) => [styles.removeButton, pressed && styles.buttonPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={t("card.delete")}
                >
                  <MaterialCommunityIcons name="close" color={colors.danger} size={14} />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}
      <Modal
        visible={Boolean(selected)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setSelected(null)}
            accessibilityRole="button"
            accessibilityLabel={t("card.close")}
          />
          <View style={styles.modal}>
            <View style={styles.modalIcon}>
              <MaterialCommunityIcons name="food-variant" color={colors.primary} size={24} />
            </View>
            <Text style={styles.modalTitle}>{selected?.name}</Text>
            <Text style={styles.modalText}>{selected?.description}</Text>
            <Text style={styles.modalText}>
              {t("recipes.ingredient_quantity", {
                quantity: selected?.quantity ?? 0,
                type: selected?.quantityType ?? "",
              })}
            </Text>
            <Text style={styles.modalText}>
              {t("recipes.ingredient_calories", { calories: selected?.calories ?? 0 })}
            </Text>
            <Pressable
              onPress={() => setSelected(null)}
              style={({ pressed }) => [styles.closeButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.closeText}>{t("card.close")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: AppTheme) => {
  const colors = theme.colors;

  return StyleSheet.create({
    section: {
      gap: spacing.sm,
    },
    label: {
      color: colors.textMuted,
      ...typography.caption,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      fontWeight: "700",
    },
    empty: {
      color: colors.textMuted,
      ...typography.caption,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    chip: {
      minHeight: 34,
      flexDirection: "row",
      alignItems: "center",
      overflow: "hidden",
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    chipButton: {
      minHeight: 34,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingLeft: spacing.sm,
      paddingRight: spacing.xs,
    },
    chipText: {
      color: colors.text,
      ...typography.caption,
      fontWeight: "600",
    },
    removeButton: {
      width: 30,
      height: 34,
      alignItems: "center",
      justifyContent: "center",
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
      backgroundColor: theme.isDark ? "rgba(255, 71, 87, 0.08)" : "#FFF2F0",
    },
    overlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.lg,
      backgroundColor: "rgba(0, 0, 0, 0.76)",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    modal: {
      width: "100%",
      maxWidth: 420,
      padding: spacing.lg,
      gap: spacing.sm,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    modalIcon: {
      width: 46,
      height: 46,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      backgroundColor: colors.surface3,
    },
    modalTitle: {
      color: colors.text,
      ...typography.h2,
    },
    modalText: {
      color: colors.textMuted,
      ...typography.body,
    },
    closeButton: {
      alignSelf: "flex-start",
      minHeight: 40,
      justifyContent: "center",
      marginTop: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface3,
    },
    closeText: {
      color: colors.text,
      ...typography.body,
      fontWeight: "700",
    },
    buttonPressed: {
      opacity: 0.85,
    },
  });
};
