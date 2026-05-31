import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useI18n } from "../i18n/I18nProvider";
import { subscribeToFridgeItems, type FridgeItem } from "../lib/firestore/fridgeItems";
import type { RecipeIngredient } from "../lib/firestore/recipes";
import { colors, radius, spacing, typography } from "../theme/tokens";
import { RecipeIngredientZone } from "./RecipeIngredientZone";

export type RecipeFormValue = {
  name: string;
  instructions: string;
  calories: string;
  portions: string;
  ingredients: RecipeIngredient[];
};

type RecipeFormProps = {
  ownerId: string | null;
  initialValue?: RecipeFormValue;
  submitLabel: string;
  onSubmit: (value: RecipeFormValue) => Promise<void>;
};

const EMPTY_VALUE: RecipeFormValue = {
  name: "",
  instructions: "",
  calories: "",
  portions: "",
  ingredients: [],
};

export function RecipeForm({ ownerId, initialValue = EMPTY_VALUE, submitLabel, onSubmit }: RecipeFormProps) {
  const { t } = useI18n();
  const [value, setValue] = useState(initialValue);
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [ingredientQuantity, setIngredientQuantity] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ownerId) {
      setFridgeItems([]);
      return;
    }
    return subscribeToFridgeItems(ownerId, setFridgeItems);
  }, [ownerId]);

  const selectedItem = useMemo(
    () => fridgeItems.find((item) => item.id === selectedItemId),
    [fridgeItems, selectedItemId]
  );

  const addIngredient = () => {
    const quantity = Number(ingredientQuantity);
    if (!selectedItem || !Number.isFinite(quantity) || quantity <= 0) {
      setError("recipes.validation.ingredient");
      return;
    }
    const ingredient: RecipeIngredient = {
      fridgeItemId: selectedItem.id,
      name: selectedItem.name,
      quantity,
      quantityType: selectedItem.quantityType,
      description: selectedItem.description,
      calories: selectedItem.calories,
      isHistory: selectedItem.isHistory,
    };
    setValue((current) => ({
      ...current,
      ingredients: [
        ...current.ingredients.filter((entry) => entry.fridgeItemId !== selectedItem.id),
        ingredient,
      ],
    }));
    setSelectedItemId("");
    setIngredientQuantity("");
    setError("");
  };

  const submit = async () => {
    const calories = Number(value.calories);
    const portions = Number(value.portions);
    if (
      value.name.trim().length < 2 ||
      value.instructions.trim().length < 2 ||
      value.calories.trim().length === 0 ||
      !Number.isFinite(calories) ||
      calories < 0 ||
      value.portions.trim().length === 0 ||
      !Number.isFinite(portions) ||
      portions <= 0 ||
      value.ingredients.length === 0
    ) {
      setError("recipes.validation.form");
      return;
    }
    await onSubmit(value);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>{t("recipes.name")}</Text>
      <TextInput value={value.name} onChangeText={(name) => setValue({ ...value, name })} style={styles.input} />
      <Text style={styles.label}>{t("recipes.instructions")}</Text>
      <TextInput value={value.instructions} onChangeText={(instructions) => setValue({ ...value, instructions })} multiline style={[styles.input, styles.multiline]} />
      <Text style={styles.label}>{t("recipes.calories")}</Text>
      <TextInput value={value.calories} onChangeText={(calories) => setValue({ ...value, calories })} keyboardType="numeric" style={styles.input} />
      <Text style={styles.label}>{t("recipes.portions")}</Text>
      <TextInput value={value.portions} onChangeText={(portions) => setValue({ ...value, portions })} keyboardType="numeric" style={styles.input} />
      <View style={styles.ingredientPicker}>
        <Text style={styles.label}>{t("recipes.add_ingredient")}</Text>
        <View style={styles.items}>
          {fridgeItems.map((item) => (
            <Pressable key={item.id} onPress={() => setSelectedItemId(item.id)} style={[styles.itemButton, selectedItemId === item.id && styles.itemButtonActive]}>
              <Text style={styles.itemText}>
                {item.name} ({item.isHistory ? t("recipes.history") : t("recipes.current")})
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput value={ingredientQuantity} onChangeText={setIngredientQuantity} keyboardType="numeric" placeholder={t("recipes.quantity_needed")} placeholderTextColor={colors.muted} style={styles.input} />
        <Pressable onPress={addIngredient} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>{t("recipes.add_ingredient_button")}</Text>
        </Pressable>
      </View>
      <RecipeIngredientZone ingredients={value.ingredients} editable onRemove={(id) => setValue({ ...value, ingredients: value.ingredients.filter((entry) => entry.fridgeItemId !== id) })} />
      {error ? <Text style={styles.error}>{t(error)}</Text> : null}
      <Pressable onPress={submit} style={styles.submitButton}>
        <Text style={styles.submitText}>{submitLabel}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm },
  label: { color: colors.text, ...typography.caption, textTransform: "uppercase" },
  input: { padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
  multiline: { minHeight: 120, textAlignVertical: "top" },
  ingredientPicker: { gap: spacing.sm, marginTop: spacing.sm },
  items: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  itemButton: { padding: spacing.xs, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  itemButtonActive: { borderColor: colors.primary, backgroundColor: colors.surface },
  itemText: { color: colors.text, ...typography.caption },
  secondaryButton: { alignSelf: "flex-start", paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.card },
  secondaryText: { color: colors.primary, ...typography.body },
  submitButton: { alignItems: "center", marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.accent },
  submitText: { color: colors.background, ...typography.h2 },
  error: { color: colors.danger, ...typography.caption },
});
