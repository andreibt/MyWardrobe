import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../../../src/i18n/I18nProvider";
import { subscribeToFridgeItems, type FridgeItem } from "../../../src/lib/firestore/fridgeItems";
import {
  addShoppingListItems,
  saveShoppingListItems,
  subscribeToShoppingList,
  type ShoppingListItem,
} from "../../../src/lib/firestore/shoppingList";
import { useAuth } from "../../../src/providers/AuthProvider";
import { useTheme, type AppTheme } from "../../../src/providers/ThemeProvider";
import { spacing, typography } from "../../../src/theme/tokens";

export default function ShoppingListScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [plainName, setPlainName] = useState("");
  const [plainCount, setPlainCount] = useState("1");

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    return subscribeToShoppingList(user.id, (list) => setItems(list.items));
  }, [user]);

  useEffect(() => {
    if (!user) {
      setFridgeItems([]);
      return;
    }
    return subscribeToFridgeItems(user.id, setFridgeItems);
  }, [user]);

  const activeFridgeItems = useMemo(
    () => fridgeItems.filter((item) => !item.isHistory).slice(0, 8),
    [fridgeItems]
  );
  const historyFridgeItems = useMemo(
    () => fridgeItems.filter((item) => item.isHistory).slice(0, 8),
    [fridgeItems]
  );
  const allItemsChecked = items.length > 0 && items.every((item) => item.checked);

  const saveItems = (nextItems: ShoppingListItem[]) => {
    if (!user) {
      return;
    }
    setItems(nextItems);
    saveShoppingListItems(user.id, nextItems).catch(() => {});
  };

  const addPlainItem = () => {
    const trimmedName = plainName.trim();
    const count = Math.max(1, Number(plainCount || 1));
    if (!user || !trimmedName || !Number.isFinite(count)) {
      return;
    }
    addShoppingListItems(user.id, [
      {
        source: "plain",
        name: trimmedName,
        count,
      },
    ]).catch(() => {});
    setPlainName("");
    setPlainCount("1");
  };

  const addFridgeReference = (item: FridgeItem) => {
    if (!user) {
      return;
    }
    addShoppingListItems(user.id, [
      {
        source: item.isHistory ? "fridgeHistory" : "fridge",
        fridgeItemId: item.id,
        name: item.name,
        count: 1,
        quantity: item.quantity,
        quantityType: item.quantityType,
      },
    ]).catch(() => {});
  };

  const updateItem = (itemId: string, getNext: (item: ShoppingListItem) => ShoppingListItem) => {
    saveItems(items.map((item) => (item.id === itemId ? getNext(item) : item)));
  };

  const removeItem = (itemId: string) => {
    saveItems(items.filter((item) => item.id !== itemId));
  };

  const clearAllItems = () => {
    saveItems([]);
  };

  const renderShoppingItem = ({ item }: { item: ShoppingListItem }) => {
    const sourceLabel =
      item.source === "fridge"
        ? t("shopping_list.source_fridge")
        : item.source === "fridgeHistory"
          ? t("shopping_list.source_history")
          : t("shopping_list.source_plain");

    return (
      <View style={[styles.card, item.checked && styles.cardChecked]}>
        <Pressable
          onPress={() => updateItem(item.id, (current) => ({ ...current, checked: !current.checked }))}
          style={[styles.checkButton, item.checked && styles.checkButtonActive]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.checked }}
          accessibilityLabel={item.name}
        >
          {item.checked ? (
            <MaterialCommunityIcons name="check" color={colors.logoTint} size={18} />
          ) : null}
        </Pressable>

        <View style={styles.itemContent}>
          <Text style={[styles.itemName, item.checked && styles.itemNameChecked]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.sourcePill}>{sourceLabel}</Text>
            {item.quantity && item.quantityType ? (
              <Text style={styles.metaText}>
                {t("shopping_list.quantity", {
                  quantity: item.quantity,
                  type: item.quantityType,
                })}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.countControls}>
          <Pressable
            onPress={() =>
              updateItem(item.id, (current) => ({
                ...current,
                count: Math.max(1, current.count - 1),
              }))
            }
            style={({ pressed }) => [styles.countButton, pressed && styles.buttonPressed]}
          >
            <MaterialCommunityIcons name="minus" color={colors.primary} size={16} />
          </Pressable>
          <Text style={styles.countText}>{item.count}</Text>
          <Pressable
            onPress={() =>
              updateItem(item.id, (current) => ({ ...current, count: current.count + 1 }))
            }
            style={({ pressed }) => [styles.countButton, pressed && styles.buttonPressed]}
          >
            <MaterialCommunityIcons name="plus" color={colors.primary} size={16} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => removeItem(item.id)}
          style={({ pressed }) => [styles.removeButton, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel={t("card.delete")}
        >
          <MaterialCommunityIcons name="trash-can-outline" color={colors.danger} size={18} />
        </Pressable>
      </View>
    );
  };

  const renderReferenceSection = (title: string, data: FridgeItem[]) =>
    data.length > 0 ? (
      <View style={styles.referenceSection}>
        <Text style={styles.sectionLabel}>{title}</Text>
        <View style={styles.referenceList}>
          {data.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => addFridgeReference(item)}
              style={({ pressed }) => [styles.referenceChip, pressed && styles.buttonPressed]}
            >
              <MaterialCommunityIcons
                name={item.isHistory ? "history" : "fridge-outline"}
                color={colors.primary}
                size={14}
              />
              <Text style={styles.referenceText} numberOfLines={1}>
                {item.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    ) : null;

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderShoppingItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + spacing.sm, spacing.lg),
            paddingBottom: Math.max(insets.bottom + 96, 120),
          },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>{t("shopping_list.title")}</Text>
                <Text style={styles.count}>
                  {t("shopping_list.count", { count: items.length })}
                </Text>
              </View>
              {allItemsChecked ? (
                <Pressable
                  onPress={clearAllItems}
                  style={({ pressed }) => [styles.clearAllButton, pressed && styles.buttonPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={t("shopping_list.clear_all")}
                >
                  <MaterialCommunityIcons name="broom" color={colors.danger} size={17} />
                  <Text style={styles.clearAllText}>{t("shopping_list.clear_all")}</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.addPanel}>
              <Text style={styles.sectionLabel}>{t("shopping_list.add_plain")}</Text>
              <View style={styles.addRow}>
                <TextInput
                  value={plainName}
                  onChangeText={setPlainName}
                  placeholder={t("shopping_list.name_placeholder")}
                  placeholderTextColor={colors.muted}
                  style={[styles.input, styles.nameInput]}
                />
                <TextInput
                  value={plainCount}
                  onChangeText={setPlainCount}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, styles.numberInput]}
                />
                <Pressable
                  onPress={addPlainItem}
                  style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={t("shopping_list.add")}
                >
                  <MaterialCommunityIcons name="plus" color={colors.logoTint} size={20} />
                </Pressable>
              </View>
            </View>

            {renderReferenceSection(t("shopping_list.from_fridge"), activeFridgeItems)}
            {renderReferenceSection(t("shopping_list.from_history"), historyFridgeItems)}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="cart-outline" color={colors.muted} size={46} />
            <Text style={styles.emptyTitle}>{t("shopping_list.empty")}</Text>
            <Text style={styles.emptySubtitle}>{t("shopping_list.empty_subtitle")}</Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (theme: AppTheme) => {
  const colors = theme.colors;
  const primaryDim = theme.isDark ? "rgba(0, 212, 255, 0.15)" : "rgba(22, 27, 34, 0.08)";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 20,
    },
    header: {
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    titleBlock: {
      flex: 1,
    },
    title: {
      color: colors.text,
      fontSize: 26,
      lineHeight: 32,
      fontWeight: "700",
    },
    count: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500",
    },
    clearAllButton: {
      minHeight: 38,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: spacing.sm,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.danger,
      backgroundColor: theme.isDark ? "rgba(255, 71, 87, 0.12)" : "#FFF2F0",
    },
    clearAllText: {
      color: colors.danger,
      ...typography.caption,
      fontWeight: "700",
    },
    addPanel: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    sectionLabel: {
      color: colors.textMuted,
      ...typography.caption,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      fontWeight: "700",
    },
    addRow: {
      flexDirection: "row",
      gap: spacing.xs,
    },
    input: {
      minHeight: 44,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: spacing.sm,
      color: colors.text,
      backgroundColor: colors.surface,
      fontSize: 15,
      lineHeight: 20,
    },
    nameInput: {
      flex: 1,
    },
    numberInput: {
      width: 58,
      textAlign: "center",
    },
    addButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      backgroundColor: colors.primary,
    },
    referenceSection: {
      gap: spacing.xs,
    },
    referenceList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    referenceChip: {
      maxWidth: "100%",
      minHeight: 34,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: spacing.sm,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    referenceText: {
      color: colors.textMuted,
      ...typography.caption,
      fontWeight: "700",
    },
    separator: {
      height: spacing.sm,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    cardChecked: {
      opacity: 0.7,
    },
    checkButton: {
      width: 30,
      height: 30,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface3,
    },
    checkButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    itemContent: {
      flex: 1,
      gap: 4,
    },
    itemName: {
      color: colors.text,
      ...typography.body,
      fontWeight: "700",
    },
    itemNameChecked: {
      color: colors.textMuted,
      textDecorationLine: "line-through",
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: spacing.xs,
    },
    sourcePill: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 3,
      borderRadius: 999,
      color: colors.primary,
      backgroundColor: primaryDim,
      ...typography.caption,
      fontWeight: "700",
    },
    metaText: {
      color: colors.textMuted,
      ...typography.caption,
    },
    countControls: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    countButton: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface3,
    },
    countText: {
      minWidth: 22,
      color: colors.text,
      textAlign: "center",
      ...typography.caption,
      fontWeight: "700",
    },
    removeButton: {
      width: 34,
      height: 34,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 17,
      backgroundColor: theme.isDark ? "rgba(255, 71, 87, 0.12)" : "#FFF2F0",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 48,
      paddingHorizontal: spacing.md,
    },
    emptyTitle: {
      marginTop: spacing.sm,
      color: colors.text,
      ...typography.h2,
      textAlign: "center",
    },
    emptySubtitle: {
      marginTop: 4,
      color: colors.textMuted,
      ...typography.body,
      textAlign: "center",
    },
    buttonPressed: {
      opacity: 0.85,
    },
  });
};
