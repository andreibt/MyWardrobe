import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { useI18n } from "../i18n/I18nProvider";
import type { RecipeIngredient } from "../lib/firestore/recipes";
import { colors, radius, spacing, typography } from "../theme/tokens";

type RecipeIngredientZoneProps = {
  ingredients: RecipeIngredient[];
  editable?: boolean;
  onRemove?: (fridgeItemId: string) => void;
};

export function RecipeIngredientZone({
  ingredients,
  editable = false,
  onRemove,
}: RecipeIngredientZoneProps) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<RecipeIngredient | null>(null);

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{t("recipes.ingredients")}</Text>
      {ingredients.length === 0 ? (
        <Text style={styles.empty}>{t("recipes.ingredients_empty")}</Text>
      ) : (
        <View style={styles.chips}>
          {ingredients.map((ingredient) => (
            <View key={ingredient.fridgeItemId} style={styles.chip}>
              <Pressable onPress={() => setSelected(ingredient)}>
                <Text style={styles.chipText}>{ingredient.name}</Text>
              </Pressable>
              {editable && onRemove ? (
                <Pressable onPress={() => onRemove(ingredient.fridgeItemId)}>
                  <Text style={styles.removeText}>x</Text>
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
          <View style={styles.modal}>
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
            <Text style={styles.modalText}>
              {selected?.isHistory ? t("recipes.ingredient_history") : t("recipes.ingredient_current")}
            </Text>
            <Pressable onPress={() => setSelected(null)} style={styles.closeButton}>
              <Text style={styles.closeText}>{t("card.close")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  label: { color: colors.text, ...typography.caption, textTransform: "uppercase" },
  empty: { color: colors.muted, ...typography.caption },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.card },
  chipText: { color: colors.text, ...typography.caption },
  removeText: { color: colors.danger, ...typography.body, fontWeight: "700" },
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, backgroundColor: "rgba(0, 0, 0, 0.76)" },
  modal: { width: "100%", maxWidth: 420, padding: spacing.lg, gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.surface },
  modalTitle: { color: colors.text, ...typography.h2 },
  modalText: { color: colors.muted, ...typography.body },
  closeButton: { alignSelf: "flex-start", marginTop: spacing.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.card },
  closeText: { color: colors.text, ...typography.body },
});
