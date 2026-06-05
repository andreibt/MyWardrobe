import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useI18n } from "../i18n/I18nProvider";
import {
  addFridgeTag,
  deleteFridgeTag,
  subscribeToFridgeTags,
  type FridgeTag,
} from "../lib/firestore/fridgeTags";
import { colors, radius, spacing, typography } from "../theme/tokens";

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
        <Pressable onPress={() => setIsManaging((value) => !value)}>
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
                style={[styles.tagChip, selected && styles.tagChipActive]}
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
            <Pressable onPress={handleAddTag} style={styles.addButton}>
              <Text style={styles.addButtonText}>{t("tags.add_button")}</Text>
            </Pressable>
          </View>
          {tags.map((tag) => (
            <View key={tag.id} style={styles.manageRow}>
              <Text style={styles.manageTagText}>{tag.name}</Text>
              <Pressable onPress={() => handleDeleteTag(tag)}>
                <Text style={styles.deleteText}>{t("tags.delete_button")}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  header: { flexDirection: "row", justifyContent: "space-between" },
  label: { color: colors.text, ...typography.caption, textTransform: "uppercase" },
  manageText: { color: colors.primary, ...typography.caption, textTransform: "uppercase" },
  helperText: { color: colors.muted, ...typography.caption },
  tagList: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tagChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  tagChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tagText: { color: colors.text, ...typography.caption },
  tagTextActive: { color: colors.background },
  manageSection: { gap: spacing.sm },
  addRow: { flexDirection: "row", gap: spacing.sm },
  input: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    backgroundColor: colors.card,
  },
  addButton: {
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  addButtonText: { color: colors.background, ...typography.caption },
  manageRow: { flexDirection: "row", justifyContent: "space-between" },
  manageTagText: { color: colors.text, ...typography.body },
  deleteText: { color: colors.danger, ...typography.caption },
});
