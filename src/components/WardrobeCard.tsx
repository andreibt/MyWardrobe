import { useMemo, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../i18n/I18nProvider";
import type { WardrobeItem } from "../lib/firestore/wardrobeItems";
import { useTheme, type AppTheme } from "../providers/ThemeProvider";
import { radius, spacing, typography } from "../theme/tokens";

type WardrobeCardProps = {
  item: WardrobeItem;
  compact?: boolean;
  onEdit?: () => void;
  onTryOn?: () => void;
  isInTryOn?: boolean;
  onDelete?: () => void;
};

export function WardrobeCard({
  item,
  compact = false,
  onEdit,
  onTryOn,
  isInTryOn,
  onDelete,
}: WardrobeCardProps) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const imageUri = item.imageSerialized || item.imageUrl;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => setIsImagePreviewOpen(true)}
        style={({ pressed }) => [styles.imageButton, pressed && styles.imageButtonPressed]}
        accessibilityRole="imagebutton"
        accessibilityLabel={item.title}
      >
        <Image source={{ uri: imageUri }} style={[styles.image, compact && styles.compactImage]} />
      </Pressable>
      <Modal
        visible={isImagePreviewOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsImagePreviewOpen(false)}
      >
        <View style={styles.previewOverlay}>
          <Pressable
            style={styles.previewBackdrop}
            onPress={() => setIsImagePreviewOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t("card.close")}
          />
          <View style={styles.previewContent}>
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
            <Pressable
              onPress={() => setIsImagePreviewOpen(false)}
              style={({ pressed }) => [styles.closeButton, pressed && styles.imageButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel={t("card.close")}
            >
              <Text style={styles.closeButtonText}>{t("card.close")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <View style={[styles.content, compact && styles.compactContent]}>
        <Text style={[styles.title, compact && styles.compactTitle]}>{item.title}</Text>
        <Text style={[styles.description, compact && styles.compactText]}>
          {item.description}
        </Text>
        <Text style={styles.meta}>{t("card.color", { color: item.color })}</Text>
        {(onEdit || onTryOn || onDelete) ? (
          <View style={[styles.actions, compact && styles.compactActions]}>
            {onEdit ? (
              <Pressable
                onPress={onEdit}
                style={[styles.actionButton, compact && styles.compactActionButton]}
              >
                <Text style={styles.actionText}>{t("card.edit")}</Text>
              </Pressable>
            ) : null}
            {onTryOn ? (
              <Pressable
                onPress={onTryOn}
                style={[
                  styles.actionButton,
                  styles.tryOnButton,
                  compact && styles.compactActionButton,
                ]}
              >
                <Text style={styles.tryOnText}>
                  {isInTryOn ? t("card.try_on_remove") : t("card.try_on")}
                </Text>
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable
                onPress={onDelete}
                style={[
                  styles.actionButton,
                  styles.deleteButton,
                  compact && styles.compactActionButton,
                ]}
              >
                <Text style={styles.deleteText}>{t("card.delete")}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) => {
  const colors = theme.colors;

  return StyleSheet.create({
  card: {
    backgroundColor: colors.surface2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 160,
    backgroundColor: colors.surface3,
  },
  compactImage: {
    height: undefined,
    aspectRatio: 1,
  },
  imageButton: {
    backgroundColor: colors.surface3,
  },
  imageButtonPressed: {
    opacity: 0.85,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.86)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  previewBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  previewContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  previewImage: {
    width: "100%",
    height: "88%",
  },
  closeButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
  },
  closeButtonText: {
    color: colors.text,
    ...typography.body,
  },
  content: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  compactContent: {
    padding: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
  },
  compactTitle: {
    ...typography.body,
    fontWeight: "600",
  },
  description: {
    color: colors.muted,
    ...typography.body,
  },
  compactText: {
    ...typography.caption,
  },
  meta: {
    color: colors.muted,
    ...typography.caption,
  },
  actions: {
    marginTop: spacing.sm,
    flexDirection: "row",
    gap: spacing.sm,
  },
  compactActions: {
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  actionButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactActionButton: {
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    color: colors.text,
    ...typography.caption,
  },
  deleteButton: {
    backgroundColor: theme.isDark ? "#3B1720" : "#FFF2F0",
    borderColor: colors.danger,
  },
  deleteText: {
    color: colors.danger,
    ...typography.caption,
  },
  tryOnButton: {
    backgroundColor: theme.isDark ? "rgba(0, 230, 118, 0.12)" : "#F6FFED",
    borderColor: colors.accent,
  },
  tryOnText: {
    color: colors.accent,
    ...typography.caption,
  },
  });
};
