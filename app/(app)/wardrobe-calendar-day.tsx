import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../../src/i18n/I18nProvider";
import { subscribeToTryOnConfigs, type TryOnConfig } from "../../src/lib/firestore/tryOnConfigs";
import { subscribeToTryOnItems, type TryOnItem } from "../../src/lib/firestore/tryOnList";
import {
  saveWardrobeCalendarDay,
  subscribeToWardrobeCalendarDay,
} from "../../src/lib/firestore/wardrobeCalendar";
import { useAuth } from "../../src/providers/AuthProvider";
import { useTheme, type AppTheme } from "../../src/providers/ThemeProvider";
import { spacing, typography } from "../../src/theme/tokens";

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value ?? "";

export default function WardrobeCalendarDayScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
  const params = useLocalSearchParams<{ date?: string | string[] }>();
  const date = getParam(params.date) || formatDateKey(new Date());
  const [selectedConfigNames, setSelectedConfigNames] = useState<string[]>([]);
  const [configs, setConfigs] = useState<TryOnConfig[]>([]);
  const [tryOnItems, setTryOnItems] = useState<TryOnItem[]>([]);
  const [previewConfigName, setPreviewConfigName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSelectedConfigNames([]);
      return;
    }
    return subscribeToWardrobeCalendarDay(user.id, date, (day) =>
      setSelectedConfigNames(day.configNames)
    );
  }, [date, user]);

  useEffect(() => {
    if (!user) {
      setConfigs([]);
      return;
    }
    return subscribeToTryOnConfigs(user.id, setConfigs);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setTryOnItems([]);
      return;
    }
    return subscribeToTryOnItems(user.id, setTryOnItems);
  }, [user]);

  const itemsByConfig = useMemo(() => groupTryOnItemsByConfig(tryOnItems), [tryOnItems]);
  const previewItems = previewConfigName ? itemsByConfig.get(previewConfigName) ?? [] : [];

  const toggleConfig = (configName: string) => {
    if (!user) {
      return;
    }
    const nextNames = selectedConfigNames.includes(configName)
      ? selectedConfigNames.filter((name) => name !== configName)
      : [...selectedConfigNames, configName];
    setSelectedConfigNames(nextNames);
    saveWardrobeCalendarDay(user.id, date, nextNames).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + spacing.sm, spacing.lg),
            paddingBottom: Math.max(insets.bottom + spacing.lg, spacing.xl),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.navBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          >
            <MaterialCommunityIcons name="arrow-left" color={colors.text} size={20} />
          </Pressable>
          <View style={styles.navText}>
            <Text style={styles.navTitle}>{t("wardrobe_calendar.day_title")}</Text>
            <Text style={styles.navSubtitle}>{formatLongDate(date)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("wardrobe_calendar.selected_configs")}</Text>
          {selectedConfigNames.length === 0 ? (
            <Text style={styles.emptyText}>{t("wardrobe_calendar.no_configs")}</Text>
          ) : (
            selectedConfigNames.map((configName) => (
              <ConfigurationPreview
                key={configName}
                configName={configName}
                items={itemsByConfig.get(configName) ?? []}
                styles={styles}
                colors={colors}
                onPreview={() => setPreviewConfigName(configName)}
                previewLabel={t("wardrobe_calendar.preview_config")}
              />
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("wardrobe_calendar.choose_configs")}</Text>
          {configs.length === 0 ? (
            <Text style={styles.emptyText}>{t("try_on.config_empty")}</Text>
          ) : (
            <View style={styles.configList}>
              {configs.map((config) => {
                const selected = selectedConfigNames.includes(config.name);
                return (
                  <Pressable
                    key={config.id}
                    onPress={() => toggleConfig(config.name)}
                    style={({ pressed }) => [
                      styles.configRow,
                      selected && styles.configRowActive,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <View style={styles.configRowText}>
                      <Text style={[styles.configName, selected && styles.configNameActive]}>
                        {config.name}
                      </Text>
                      <Text style={styles.configMeta}>
                        {t("wardrobe_calendar.item_count", {
                          count: itemsByConfig.get(config.name)?.length ?? 0,
                        })}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name={selected ? "check-circle" : "plus-circle-outline"}
                      color={selected ? colors.primary : colors.textMuted}
                      size={22}
                    />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
      <Modal
        visible={previewConfigName !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewConfigName(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("wardrobe_calendar.close_preview")}
            style={styles.modalBackdrop}
            onPress={() => setPreviewConfigName(null)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleBlock}>
                <Text style={styles.modalTitle}>{previewConfigName}</Text>
                <Text style={styles.modalSubtitle}>
                  {t("wardrobe_calendar.item_count", { count: previewItems.length })}
                </Text>
              </View>
              <Pressable
                onPress={() => setPreviewConfigName(null)}
                style={({ pressed }) => [styles.closeButton, pressed && styles.buttonPressed]}
                accessibilityRole="button"
                accessibilityLabel={t("wardrobe_calendar.close_preview")}
              >
                <MaterialCommunityIcons name="close" color={colors.text} size={20} />
              </Pressable>
            </View>
            {previewItems.length === 0 ? (
              <Text style={styles.emptyText}>{t("wardrobe_calendar.no_items")}</Text>
            ) : (
              <ScrollView
                contentContainerStyle={styles.expandedGrid}
                showsVerticalScrollIndicator={false}
              >
                {previewItems.map((item) => (
                  <View key={item.id} style={styles.expandedItem}>
                    <Image
                      source={{ uri: item.imageSerialized || item.imageUrl }}
                      style={styles.expandedImage}
                    />
                    <Text style={styles.expandedTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ConfigurationPreview({
  configName,
  items,
  styles,
  colors,
  onPreview,
  previewLabel,
}: {
  configName: string;
  items: TryOnItem[];
  styles: ReturnType<typeof createStyles>;
  colors: AppTheme["colors"];
  onPreview: () => void;
  previewLabel: string;
}) {
  return (
    <View style={styles.previewCard}>
      <View style={styles.previewHeader}>
        <Text style={styles.previewTitle} numberOfLines={1}>
          {configName}
        </Text>
        <Pressable
          onPress={onPreview}
          style={({ pressed }) => [styles.previewButton, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel={previewLabel}
        >
          <MaterialCommunityIcons name="eye-outline" color={colors.primary} size={18} />
          <Text style={styles.previewButtonText}>{previewLabel}</Text>
        </Pressable>
      </View>
      <View style={styles.previewImages}>
        {items.slice(0, 4).map((item) => (
          <Image
            key={item.id}
            source={{ uri: item.imageSerialized || item.imageUrl }}
            style={styles.previewImage}
          />
        ))}
      </View>
    </View>
  );
}

function groupTryOnItemsByConfig(items: TryOnItem[]) {
  const grouped = new Map<string, TryOnItem[]>();
  items.forEach((item) => {
    if (!item.configuration) return;
    grouped.set(item.configuration, [...(grouped.get(item.configuration) ?? []), item]);
  });
  return grouped;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLongDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const createStyles = (theme: AppTheme) => {
  const colors = theme.colors;
  const primaryDim = theme.isDark ? "rgba(0, 212, 255, 0.15)" : "rgba(22, 27, 34, 0.08)";

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20, gap: spacing.lg },
    navBar: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    backButton: {
      width: 38,
      height: 38,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    navText: { flex: 1 },
    navTitle: { color: colors.text, fontSize: 18, lineHeight: 24, fontWeight: "700" },
    navSubtitle: { color: colors.textMuted, ...typography.caption },
    section: { gap: spacing.sm },
    sectionTitle: { color: colors.text, ...typography.h2 },
    emptyText: { color: colors.textMuted, ...typography.body },
    previewCard: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    previewHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    previewTitle: { flex: 1, color: colors.text, ...typography.body, fontWeight: "700" },
    previewButton: {
      minHeight: 34,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: spacing.sm,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface3,
    },
    previewButtonText: { color: colors.primary, ...typography.caption, fontWeight: "700" },
    previewImages: { flexDirection: "row", gap: spacing.xs },
    previewImage: {
      width: 58,
      height: 58,
      borderRadius: 12,
      backgroundColor: colors.surface3,
    },
    configList: { gap: spacing.xs },
    configRow: {
      minHeight: 54,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    configRowActive: { borderColor: colors.primary, backgroundColor: primaryDim },
    configRowText: { flex: 1 },
    configName: { color: colors.text, ...typography.body, fontWeight: "700" },
    configNameActive: { color: colors.primary },
    configMeta: { color: colors.textMuted, ...typography.caption },
    modalOverlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      backgroundColor: "rgba(0, 0, 0, 0.52)",
    },
    modalBackdrop: { ...StyleSheet.absoluteFillObject },
    modalContent: {
      width: "100%",
      maxWidth: 420,
      maxHeight: "82%",
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    modalHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    modalTitleBlock: { flex: 1 },
    modalTitle: { color: colors.text, ...typography.h2 },
    modalSubtitle: { color: colors.textMuted, ...typography.caption },
    closeButton: {
      width: 38,
      height: 38,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface3,
    },
    expandedGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    expandedItem: {
      width: "47.5%",
      gap: spacing.xs,
      padding: spacing.xs,
      borderRadius: 14,
      backgroundColor: colors.surface3,
    },
    expandedImage: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    expandedTitle: { minHeight: 34, color: colors.text, ...typography.caption, fontWeight: "700" },
    buttonPressed: { opacity: 0.85 },
  });
};
