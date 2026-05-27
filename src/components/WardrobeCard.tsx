import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../i18n/I18nProvider";
import type { WardrobeItem } from "../lib/firestore/wardrobeItems";
import { colors, radius, spacing, typography } from "../theme/tokens";

type WardrobeCardProps = {
  item: WardrobeItem;
  onEdit?: () => void;
  onTryOn?: () => void;
  isInTryOn?: boolean;
  onDelete?: () => void;
};

export function WardrobeCard({
  item,
  onEdit,
  onTryOn,
  isInTryOn,
  onDelete,
}: WardrobeCardProps) {
  const { t } = useI18n();
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
        <Image source={{ uri: imageUri }} style={styles.image} />
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
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.meta}>{t("card.color", { color: item.color })}</Text>
        {(onEdit || onTryOn || onDelete) ? (
          <View style={styles.actions}>
            {onEdit ? (
              <Pressable onPress={onEdit} style={styles.actionButton}>
                <Text style={styles.actionText}>{t("card.edit")}</Text>
              </Pressable>
            ) : null}
            {onTryOn ? (
              <Pressable onPress={onTryOn} style={[styles.actionButton, styles.tryOnButton]}>
                <Text style={styles.tryOnText}>
                  {isInTryOn ? t("card.try_on_remove") : t("card.try_on")}
                </Text>
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable onPress={onDelete} style={[styles.actionButton, styles.deleteButton]}>
                <Text style={styles.deleteText}>{t("card.delete")}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
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
  },
  imageButton: {
    backgroundColor: colors.card,
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
    backgroundColor: colors.surface,
  },
  closeButtonText: {
    color: colors.text,
    ...typography.body,
  },
  content: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    ...typography.h2,
  },
  description: {
    color: colors.muted,
    ...typography.body,
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
  actionButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    color: colors.text,
    ...typography.caption,
  },
  deleteButton: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.danger,
  },
  deleteText: {
    color: colors.danger,
    ...typography.caption,
  },
  tryOnButton: {
    backgroundColor: colors.successSurface,
    borderColor: colors.accent,
  },
  tryOnText: {
    color: colors.accent,
    ...typography.caption,
  },
});
