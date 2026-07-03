import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useI18n } from "../i18n/I18nProvider";
import {
  addFridgeTag,
  deleteFridgeTag,
  subscribeToFridgeTags,
  type FridgeTag,
} from "../lib/firestore/fridgeTags";
import { useTheme, type AppTheme } from "../providers/ThemeProvider";
import { radius, spacing, typography } from "../theme/tokens";

type FridgeTagSelectorProps = {
  ownerId: string | null;
  selectedTags: string[];
  onChange: (nextTags: string[]) => void;
};

export function FridgeTagSelector({
  ownerId,
  selectedTags,
  onChange,
}: FridgeTagSelectorProps) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
  const [tags, setTags] = useState<FridgeTag[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isManaging, setIsManaging] = useState(false);

  useEffect(() => {
    if (!ownerId) {
      setTags([]);
      return;
    }
    return subscribeToFridgeTags(ownerId, setTags);
  }, [ownerId]);

  const availableTags = useMemo(() => tags.map((tag) => tag.name), [tags]);

  const toggleTag = (tag: string) => {
    onChange(
      selectedTags.includes(tag)
        ? selectedTags.filter((entry) => entry !== tag)
        : [...selectedTags, tag]
    );
  };

  const handleAddTag = async () => {
    const trimmed = newTag.trim();
    if (!ownerId || !trimmed) {
      return;
    }
    if (availableTags.some((tag) => tag.toLowerCase() === trimmed.toLowerCase())) {
      setNewTag("");
      return;
    }
    await addFridgeTag(ownerId, trimmed);
    onChange([...selectedTags, trimmed]);
    setNewTag("");
  };

  const handleDeleteTag = async (tag: FridgeTag) => {
    await deleteFridgeTag(tag.id);
    onChange(selectedTags.filter((entry) => entry !== tag.name));
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.label}>{t("tags.label")}</Text>
        <Pressable
          onPress={() => setIsManaging((value) => !value)}
          style={({ pressed }) => [styles.manageButton, pressed && styles.buttonPressed]}
        >
          <MaterialCommunityIcons name="tag-multiple-outline" color={colors.primary} size={15} />
          <Text style={styles.manageText}>{t("tags.manage_button")}</Text>
        </Pressable>
      </View>
      {availableTags.length === 0 ? (
        <Text style={styles.helperText}>{t("tags.empty")}</Text>
      ) : (
        <View style={styles.tagList}>
          {availableTags.map((tag) => {
            const selected = selectedTags.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => toggleTag(tag)}
                style={({ pressed }) => [
                  styles.tagChip,
                  selected && styles.tagChipActive,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={[styles.tagText, selected && styles.tagTextActive]}>{tag}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
      {isManaging ? (
        <View style={styles.manageSection}>
          <View style={styles.addRow}>
            <TextInput
              value={newTag}
              onChangeText={setNewTag}
              placeholder={t("tags.add_placeholder")}
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
            <Pressable
              onPress={handleAddTag}
              style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]}
              accessibilityRole="button"
              accessibilityLabel={t("tags.add_button")}
            >
              <MaterialCommunityIcons name="plus" color={colors.logoTint} size={18} />
            </Pressable>
          </View>
          {tags.map((tag) => (
            <View key={tag.id} style={styles.manageRow}>
              <Text style={styles.manageTagText}>{tag.name}</Text>
              <Pressable
                onPress={() => handleDeleteTag(tag)}
                style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}
              >
                <MaterialCommunityIcons name="trash-can-outline" color={colors.danger} size={16} />
                <Text style={styles.deleteText}>{t("tags.delete_button")}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (theme: AppTheme) => {
  const colors = theme.colors;
  const primaryDim = theme.isDark ? "rgba(0, 212, 255, 0.15)" : "rgba(22, 27, 34, 0.08)";

  return StyleSheet.create({
    section: {
      gap: spacing.sm,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    label: {
      color: colors.textMuted,
      ...typography.caption,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      fontWeight: "600",
    },
    manageButton: {
      minHeight: 32,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    manageText: {
      color: colors.primary,
      ...typography.caption,
      fontWeight: "700",
    },
    helperText: {
      color: colors.textMuted,
      ...typography.caption,
    },
    tagList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    tagChip: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    tagChipActive: {
      borderColor: colors.primary,
      backgroundColor: primaryDim,
    },
    tagText: {
      color: colors.textMuted,
      ...typography.caption,
      fontWeight: "600",
    },
    tagTextActive: {
      color: colors.primary,
    },
    manageSection: {
      gap: spacing.sm,
    },
    addRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    input: {
      flex: 1,
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
    addButton: {
      width: 46,
      minHeight: 46,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      backgroundColor: colors.primary,
    },
    manageRow: {
      minHeight: 40,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    manageTagText: {
      flex: 1,
      color: colors.text,
      ...typography.body,
    },
    deleteButton: {
      minHeight: 32,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: theme.isDark ? "rgba(255, 71, 87, 0.12)" : "#FFF2F0",
    },
    deleteText: {
      color: colors.danger,
      ...typography.caption,
      fontWeight: "700",
    },
    buttonPressed: {
      opacity: 0.85,
    },
  });
};
