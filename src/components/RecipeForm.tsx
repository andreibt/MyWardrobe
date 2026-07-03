import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useI18n } from "../i18n/I18nProvider";
import { subscribeToFridgeItems, type FridgeItem } from "../lib/firestore/fridgeItems";
import type { RecipeIngredient } from "../lib/firestore/recipes";
import { useTheme, type AppTheme } from "../providers/ThemeProvider";
import { spacing, typography } from "../theme/tokens";
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
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
  const [value, setValue] = useState(initialValue);
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [infoItem, setInfoItem] = useState<FridgeItem | null>(null);
  const [ingredientQuantity, setIngredientQuantity] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const availableItems = useMemo(() => {
    const ingredientIds = new Set(value.ingredients.map((ingredient) => ingredient.fridgeItemId));
    return fridgeItems.filter((item) => !ingredientIds.has(item.id));
  }, [fridgeItems, value.ingredients]);

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

    setIsSubmitting(true);
    try {
      await onSubmit(value);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>{t("recipes.name")}</Text>
          <TextInput
            value={value.name}
            onChangeText={(name) => setValue({ ...value, name })}
            placeholder={t("recipes.placeholder_name")}
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("recipes.instructions")}</Text>
          <TextInput
            value={value.instructions}
            onChangeText={(instructions) => setValue({ ...value, instructions })}
            placeholder={t("recipes.placeholder_instructions")}
            placeholderTextColor={colors.muted}
            multiline
            style={[styles.input, styles.multiline]}
          />
        </View>

        <View style={styles.splitRow}>
          <View style={[styles.field, styles.splitField]}>
            <Text style={styles.label}>{t("recipes.calories")}</Text>
            <TextInput
              value={value.calories}
              onChangeText={(calories) => setValue({ ...value, calories })}
              keyboardType="numeric"
              placeholder="480"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </View>
          <View style={[styles.field, styles.splitField]}>
            <Text style={styles.label}>{t("recipes.portions")}</Text>
            <TextInput
              value={value.portions}
              onChangeText={(portions) => setValue({ ...value, portions })}
              keyboardType="numeric"
              placeholder="2"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.ingredientPicker}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="fridge-outline" color={colors.primary} size={18} />
            <Text style={styles.sectionTitle}>{t("recipes.add_ingredient")}</Text>
          </View>

          <View style={styles.items}>
            {availableItems.length === 0 ? (
              <Text style={styles.helperText}>{t("recipes.ingredients_empty")}</Text>
            ) : (
              availableItems.map((item) => {
                const selected = selectedItemId === item.id;
                return (
                  <View key={item.id} style={styles.itemRow}>
                    <Pressable
                      onPress={() => setSelectedItemId(item.id)}
                      style={({ pressed }) => [
                        styles.itemButton,
                        selected && styles.itemButtonActive,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text style={[styles.itemText, selected && styles.itemTextActive]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={[styles.itemState, selected && styles.itemTextActive]}>
                        {item.isHistory ? t("recipes.history") : t("recipes.current")}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setInfoItem(item)}
                      style={({ pressed }) => [styles.infoButton, pressed && styles.buttonPressed]}
                      accessibilityRole="button"
                      accessibilityLabel={t("recipes.ingredient_info")}
                    >
                      <MaterialCommunityIcons name="information-outline" color={colors.primary} size={18} />
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.addIngredientRow}>
            <TextInput
              value={ingredientQuantity}
              onChangeText={setIngredientQuantity}
              keyboardType="numeric"
              placeholder={t("recipes.quantity_needed")}
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.quantityInput]}
            />
            <Pressable
              onPress={addIngredient}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            >
              <MaterialCommunityIcons name="plus" color={colors.primary} size={18} />
              <Text style={styles.secondaryText}>{t("recipes.add_ingredient_button")}</Text>
            </Pressable>
          </View>
        </View>

        <RecipeIngredientZone
          ingredients={value.ingredients}
          editable
          onRemove={(id) =>
            setValue({
              ...value,
              ingredients: value.ingredients.filter((entry) => entry.fridgeItemId !== id),
            })
          }
        />

        {error ? <Text style={styles.error}>{t(error)}</Text> : null}

        <Pressable
          onPress={submit}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.submitButton,
            pressed && styles.buttonPressed,
            isSubmitting && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.submitText}>{submitLabel}</Text>
        </Pressable>
      </View>

      <Modal
        visible={Boolean(infoItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoItem(null)}
      >
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setInfoItem(null)}
            accessibilityRole="button"
            accessibilityLabel={t("card.close")}
          />
          <View style={styles.modal}>
            {infoItem ? (
              <Image
                source={{ uri: infoItem.imageSerialized || infoItem.imageUrl }}
                style={styles.infoImage}
              />
            ) : null}
            <Text style={styles.modalTitle}>{infoItem?.name}</Text>
            <Text style={styles.modalText}>{infoItem?.description}</Text>
            <Text style={styles.modalText}>
              {t("fridge_card.quantity", {
                quantity: infoItem?.quantity ?? 0,
                type: infoItem?.quantityType ?? "",
              })}
            </Text>
            {infoItem && !infoItem.isHistory ? (
              <Text style={styles.modalText}>
                {t("fridge_card.expiration", { date: infoItem.expirationDate })}
              </Text>
            ) : null}
            <Text style={styles.modalText}>
              {t("fridge_card.calories", { calories: infoItem?.calories ?? 0 })}
            </Text>
            <Text style={styles.modalText}>
              {infoItem?.isHistory ? t("recipes.ingredient_history") : t("recipes.ingredient_current")}
            </Text>
            <Pressable
              onPress={() => setInfoItem(null)}
              style={({ pressed }) => [styles.closeButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.closeText}>{t("card.close")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const createStyles = (theme: AppTheme) => {
  const colors = theme.colors;
  const primaryDim = theme.isDark ? "rgba(0, 212, 255, 0.15)" : "rgba(22, 27, 34, 0.08)";

  return StyleSheet.create({
    content: {
      paddingHorizontal: 20,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
    },
    form: {
      gap: spacing.md,
    },
    field: {
      gap: spacing.xs,
    },
    splitRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    splitField: {
      flex: 1,
    },
    label: {
      color: colors.textMuted,
      ...typography.caption,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      fontWeight: "700",
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
      color: colors.text,
      backgroundColor: colors.surface,
      fontSize: 15,
      lineHeight: 20,
    },
    multiline: {
      minHeight: 124,
      textAlignVertical: "top",
    },
    ingredientPicker: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    sectionTitle: {
      color: colors.text,
      ...typography.h2,
    },
    items: {
      gap: spacing.xs,
    },
    helperText: {
      color: colors.textMuted,
      ...typography.caption,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    itemButton: {
      minHeight: 44,
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    itemButtonActive: {
      borderColor: colors.primary,
      backgroundColor: primaryDim,
    },
    itemText: {
      flex: 1,
      color: colors.text,
      ...typography.body,
      fontWeight: "600",
    },
    itemState: {
      color: colors.textMuted,
      ...typography.caption,
      fontWeight: "700",
    },
    itemTextActive: {
      color: colors.primary,
    },
    infoButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    addIngredientRow: {
      gap: spacing.sm,
    },
    quantityInput: {
      width: "100%",
    },
    secondaryButton: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface3,
    },
    secondaryText: {
      color: colors.primary,
      ...typography.body,
      fontWeight: "700",
    },
    submitButton: {
      alignItems: "center",
      marginTop: spacing.sm,
      paddingVertical: 15,
      borderRadius: 10,
      backgroundColor: colors.primary,
    },
    submitText: {
      color: colors.logoTint,
      ...typography.h2,
    },
    error: {
      color: colors.danger,
      ...typography.caption,
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
    infoImage: {
      width: "100%",
      height: 180,
      borderRadius: 12,
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
    buttonDisabled: {
      opacity: 0.6,
    },
  });
};
