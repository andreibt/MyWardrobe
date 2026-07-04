import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useI18n } from "../i18n/I18nProvider";
import { addTag, deleteTag, subscribeToTags, type WardrobeTag } from "../lib/firestore/tags";
import { useTheme, type AppTheme } from "../providers/ThemeProvider";
import { radius, spacing, typography } from "../theme/tokens";

type TagSelectorProps = {
  ownerId: string | null;
  selectedTags: string[];
  onChange: (nextTags: string[]) => void;
};

export function TagSelector({ ownerId, selectedTags, onChange }: TagSelectorProps) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
  const [tags, setTags] = useState<WardrobeTag[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isManaging, setIsManaging] = useState(false);

  useEffect(() => {
    if (!ownerId) {
      setTags([]);
      return;
    }

    return subscribeToTags(ownerId, setTags);
  }, [ownerId]);

  const availableTags = useMemo(() => tags.map((tag) => tag.name), [tags]);
  const allTags = useMemo(() => {
    const merged = [...availableTags];
    selectedTags.forEach((tag) => {
      if (!merged.includes(tag)) {
        merged.push(tag);
      }
    });
    return merged;
  }, [availableTags, selectedTags]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((entry) => entry !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const handleAddTag = async () => {
    if (!ownerId) {
      return;
    }
    const trimmed = newTag.trim();
    if (!trimmed) {
      return;
    }
    const exists = availableTags.some(
      (tag) => tag.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setNewTag("");
      return;
    }
    try {
      await addTag(ownerId, trimmed);
      if (!selectedTags.includes(trimmed)) {
        onChange([...selectedTags, trimmed]);
      }
      setNewTag("");
    } catch {}
  };

  const handleDeleteTag = async (tag: WardrobeTag) => {
    try {
      await deleteTag(tag.id);
      if (selectedTags.includes(tag.name)) {
        onChange(selectedTags.filter((entry) => entry !== tag.name));
      }
    } catch {}
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("tags.label")}</Text>
        <Pressable
          onPress={() => setIsManaging((value) => !value)}
          style={({ pressed }) => pressed && styles.buttonPressed}
        >
          <Text style={styles.manageButtonText}>{t("tags.manage_button")}</Text>
        </Pressable>
      </View>

      {allTags.length === 0 ? (
        <Text style={styles.helperText}>{t("tags.empty")}</Text>
      ) : (
        <View style={styles.tagList}>
          {allTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => toggleTag(tag)}
                style={({ pressed }) => [
                  styles.tagChip,
                  isSelected && styles.tagChipActive,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {isManaging ? (
        <View style={styles.manageSection}>
          <View style={styles.addRow}>
            <TextInput
              placeholder={t("tags.add_placeholder")}
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={newTag}
              onChangeText={setNewTag}
            />
            <Pressable
              onPress={handleAddTag}
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.buttonPressed,
                !ownerId && styles.buttonDisabled,
              ]}
              disabled={!ownerId}
            >
              <Text style={styles.addButtonText}>{t("tags.add_button")}</Text>
            </Pressable>
          </View>

          {tags.length > 0 ? (
            <View style={styles.manageList}>
              {tags.map((tag) => (
                <View key={tag.id} style={styles.manageRow}>
                  <Text style={styles.manageTagText}>{tag.name}</Text>
                  <Pressable
                    onPress={() => handleDeleteTag(tag)}
                    style={({ pressed }) => pressed && styles.buttonPressed}
                  >
                    <Text style={styles.deleteText}>{t("tags.delete_button")}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (theme: AppTheme) => {
  const colors = theme.colors;

  return StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.text,
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  manageButtonText: {
    color: colors.primary,
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  helperText: {
    color: colors.muted,
    ...typography.caption,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tagChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tagChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagText: {
    color: colors.text,
    ...typography.caption,
  },
  tagTextActive: {
    color: colors.logoTint,
  },
  manageSection: {
    gap: spacing.sm,
  },
  addRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  addButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  addButtonText: {
    color: colors.logoTint,
    ...typography.caption,
  },
  manageList: {
    gap: spacing.xs,
  },
  manageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  manageTagText: {
    color: colors.text,
    ...typography.body,
  },
  deleteText: {
    color: colors.danger,
    ...typography.caption,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  });
};
