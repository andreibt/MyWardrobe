import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useI18n } from "../i18n/I18nProvider";
import { useTheme, type AppTheme } from "../providers/ThemeProvider";
import { radius, spacing, typography } from "../theme/tokens";
import { DateInput } from "./DateInput";

type RestoreItemModalProps = {
  visible: boolean;
  title: string;
  subtitle: string;
  buttonLabel: string;
  itemName: string;
  imageUri?: string;
  fallbackIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  onClose: () => void;
  onRestore: (expirationDate: string) => Promise<void>;
};

export function RestoreItemModal({
  visible,
  title,
  subtitle,
  buttonLabel,
  itemName,
  imageUri,
  fallbackIcon,
  onClose,
  onRestore,
}: RestoreItemModalProps) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
  const [expirationDate, setExpirationDate] = useState("");
  const [error, setError] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (visible) {
      setExpirationDate("");
      setError("");
      setIsRestoring(false);
    }
  }, [visible]);

  const restore = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) {
      setError("fridge_add.validation.expiration_date");
      return;
    }
    setIsRestoring(true);
    setError("");
    try {
      await onRestore(expirationDate);
      onClose();
    } catch {
      setError("restore_modal.error");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t("card.close")}
            >
              <MaterialCommunityIcons name="close" color={colors.textMuted} size={20} />
            </Pressable>
          </View>

          <View style={styles.preview}>
            <View style={styles.imageFrame}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} />
              ) : (
                <MaterialCommunityIcons name={fallbackIcon} color={colors.textMuted} size={34} />
              )}
            </View>
            <Text style={styles.itemName} numberOfLines={2}>
              {itemName}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t("fridge_add.label.expiration_date")}</Text>
            <DateInput
              value={expirationDate}
              onChange={setExpirationDate}
              placeholder={t("fridge_add.placeholder.expiration_date")}
            />
            {error ? <Text style={styles.error}>{t(error)}</Text> : null}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              disabled={isRestoring}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryText}>{t("edit.cancel")}</Text>
            </Pressable>
            <Pressable
              onPress={restore}
              disabled={isRestoring}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              {isRestoring ? (
                <ActivityIndicator color={colors.logoTint} size="small" />
              ) : (
                <Text style={styles.primaryText}>{buttonLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) => {
  const colors = theme.colors;

  return StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.md,
      backgroundColor: "rgba(0, 0, 0, 0.62)",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    modal: {
      width: "100%",
      maxWidth: 380,
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      shadowColor: "#000",
      shadowOpacity: theme.isDark ? 0.48 : 0.18,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 18 },
      elevation: 10,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
    },
    titleBlock: {
      flex: 1,
      gap: 4,
    },
    title: {
      color: colors.text,
      ...typography.h2,
    },
    subtitle: {
      color: colors.textMuted,
      ...typography.caption,
    },
    closeButton: {
      width: 34,
      height: 34,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface3,
    },
    preview: {
      alignItems: "center",
      gap: spacing.sm,
    },
    imageFrame: {
      width: 132,
      height: 132,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface3,
    },
    image: {
      width: "100%",
      height: "100%",
    },
    itemName: {
      color: colors.text,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "700",
      textAlign: "center",
    },
    field: {
      gap: spacing.xs,
    },
    label: {
      color: colors.textMuted,
      ...typography.caption,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      fontWeight: "700",
    },
    error: {
      color: colors.danger,
      ...typography.caption,
    },
    actions: {
      flexDirection: "row",
      gap: spacing.xs,
    },
    secondaryButton: {
      flex: 1,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface3,
    },
    primaryButton: {
      flex: 1,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
    },
    secondaryText: {
      color: colors.text,
      ...typography.caption,
      fontWeight: "700",
    },
    primaryText: {
      color: colors.logoTint,
      ...typography.caption,
      fontWeight: "700",
      textAlign: "center",
    },
    pressed: {
      opacity: 0.82,
    },
  });
};
