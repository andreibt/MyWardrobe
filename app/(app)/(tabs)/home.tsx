import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../../../src/i18n/I18nProvider";
import {
  subscribeToFridgeItems,
  type FridgeItem,
} from "../../../src/lib/firestore/fridgeItems";
import {
  subscribeToCocktailItems,
  subscribeToPantryItems,
  type InventoryItem,
} from "../../../src/lib/firestore/inventoryItems";
import { subscribeToTryOnItems, type TryOnItem } from "../../../src/lib/firestore/tryOnList";
import {
  subscribeToWardrobeCalendarDays,
  type WardrobeCalendarDay,
} from "../../../src/lib/firestore/wardrobeCalendar";
import {
  subscribeToWardrobeItems,
  type WardrobeItem,
} from "../../../src/lib/firestore/wardrobeItems";
import { useAuth } from "../../../src/providers/AuthProvider";
import { useTheme, type AppTheme } from "../../../src/providers/ThemeProvider";
import { spacing } from "../../../src/theme/tokens";

type RecentItem = {
  id: string;
  name: string;
  meta: string;
  kind: "wardrobe" | "fridge" | "expiring";
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

type ExpiringHomeItem = {
  id: string;
  name: string;
  meta: string;
  location: "fridge" | "pantry";
  daysUntilExpiration: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const palette = theme.colors;
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [pantryItems, setPantryItems] = useState<InventoryItem[]>([]);
  const [cocktailItems, setCocktailItems] = useState<InventoryItem[]>([]);
  const [calendarDays, setCalendarDays] = useState<WardrobeCalendarDay[]>([]);
  const [tryOnItems, setTryOnItems] = useState<TryOnItem[]>([]);

  useEffect(() => {
    if (!user) {
      setWardrobeItems([]);
      return;
    }
    return subscribeToWardrobeItems(user.id, setWardrobeItems);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setFridgeItems([]);
      return;
    }
    return subscribeToFridgeItems(user.id, setFridgeItems);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setPantryItems([]);
      return;
    }
    return subscribeToPantryItems(user.id, setPantryItems);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCocktailItems([]);
      return;
    }
    return subscribeToCocktailItems(user.id, setCocktailItems);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCalendarDays([]);
      return;
    }
    return subscribeToWardrobeCalendarDays(user.id, setCalendarDays);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setTryOnItems([]);
      return;
    }
    return subscribeToTryOnItems(user.id, setTryOnItems);
  }, [user]);

  const activeFridgeItems = useMemo(
    () => fridgeItems.filter((item) => !item.isHistory),
    [fridgeItems]
  );
  const activePantryItems = useMemo(
    () => pantryItems.filter((item) => !item.isHistory),
    [pantryItems]
  );
  const activeCocktailItems = useMemo(
    () => cocktailItems.filter((item) => !item.isHistory),
    [cocktailItems]
  );

  const allExpiringHomeItems = useMemo<ExpiringHomeItem[]>(() => {
    const fridgeExpiring = activeFridgeItems
      .map((item) => toExpiringHomeItem(item, "fridge", t))
      .filter((item): item is ExpiringHomeItem => Boolean(item));
    const pantryExpiring = activePantryItems
      .map((item) => toExpiringHomeItem(item, "pantry", t))
      .filter((item): item is ExpiringHomeItem => Boolean(item));

    return [...fridgeExpiring, ...pantryExpiring]
      .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
  }, [activeFridgeItems, activePantryItems, t]);
  const expiringHomeItems = allExpiringHomeItems.slice(0, 4);
  const expiringCount = allExpiringHomeItems.length;
  const fridgeExpiringCount = useMemo(
    () => activeFridgeItems.filter((item) => isExpiringSoon(item.expirationDate)).length,
    [activeFridgeItems]
  );
  const pantryExpiringCount = useMemo(
    () => activePantryItems.filter((item) => isExpiringSoon(item.expirationDate)).length,
    [activePantryItems]
  );

  const recentItems = useMemo<RecentItem[]>(() => {
    const wardrobeRecent = wardrobeItems.slice(0, 2).map((item) => ({
      id: `wardrobe-${item.id}`,
      name: item.title,
      meta: t("home.dashboard.meta_wardrobe"),
      kind: "wardrobe" as const,
      icon: "tshirt-crew-outline" as const,
    }));

    const fridgeRecent = activeFridgeItems.slice(0, 2).map((item) => ({
      id: `fridge-${item.id}`,
      name: item.name,
      meta: item.expirationDate
        ? t("home.dashboard.expires", { date: item.expirationDate })
        : t("home.dashboard.meta_fridge"),
      kind: isExpiringSoon(item.expirationDate) ? ("expiring" as const) : ("fridge" as const),
      icon: "food-apple-outline" as const,
    }));

    return [...wardrobeRecent, ...fridgeRecent].slice(0, 3);
  }, [activeFridgeItems, t, wardrobeItems]);

  const totalItems =
    wardrobeItems.length +
    activeFridgeItems.length +
    activePantryItems.length +
    activeCocktailItems.length;
  const todayKey = formatDateKey(new Date());
  const todayCalendarDay = useMemo(
    () => calendarDays.find((day) => day.date === todayKey),
    [calendarDays, todayKey]
  );
  const todayPreviewItems = useMemo(() => {
    if (!todayCalendarDay) {
      return [];
    }
    const selectedConfigs = new Set(todayCalendarDay.configNames);
    return tryOnItems
      .filter((item) => item.configuration && selectedConfigs.has(item.configuration))
      .slice(0, 4);
  }, [todayCalendarDay, tryOnItems]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + spacing.sm, spacing.lg),
            paddingBottom: Math.max(insets.bottom + 96, 120),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t("home.dashboard.greeting")}</Text>
            <Text style={styles.title}>{t("home.dashboard.title")}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Search"
            >
              <MaterialCommunityIcons name="magnify" color={palette.textMuted} size={20} />
            </Pressable>
            <Pressable
              onPress={() => router.push("/(app)/(tabs)/settings")}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t("tabs.settings")}
            >
              <MaterialCommunityIcons name="cog-outline" color={palette.textMuted} size={20} />
            </Pressable>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard label={t("home.dashboard.total")} value={totalItems} styles={styles} />
          <StatCard
            label={t("home.wardrobe")}
            value={wardrobeItems.length}
            color={palette.primary}
            styles={styles}
          />
          <StatCard
            label={t("home.fridge")}
            value={activeFridgeItems.length}
            color={homeColors.secondary}
            styles={styles}
          />
        </View>

        <View style={styles.moduleGrid}>
          <Pressable
            onPress={() => router.push("/(app)/(wardrobe)/wardrobe-list")}
            style={({ pressed }) => [styles.moduleCard, pressed && styles.cardPressed]}
            accessibilityRole="button"
            accessibilityLabel={t("home.wardrobe")}
          >
            <View style={[styles.moduleIcon, styles.wardrobeIcon]}>
              <MaterialCommunityIcons name="wardrobe-outline" color={palette.primary} size={22} />
            </View>
            <Text style={styles.moduleTitle}>{t("home.wardrobe")}</Text>
            <Text style={styles.moduleSubtitle}>
              {t("home.dashboard.items", { count: wardrobeItems.length })}
            </Text>
            <Text style={styles.moduleLink}>{t("home.dashboard.browse")}</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(app)/(fridge)/fridge-list")}
            style={({ pressed }) => [styles.moduleCard, pressed && styles.cardPressed]}
            accessibilityRole="button"
            accessibilityLabel={t("home.fridge")}
          >
            <View style={[styles.moduleIcon, styles.fridgeIcon]}>
              <MaterialCommunityIcons name="fridge-outline" color={homeColors.secondary} size={22} />
            </View>
            <Text style={styles.moduleTitle}>{t("home.fridge")}</Text>
            <Text style={styles.moduleSubtitle}>
              {t("home.dashboard.active_items", { count: activeFridgeItems.length })}
            </Text>
            <Text style={[styles.moduleLink, fridgeExpiringCount > 0 && styles.warningText]}>
              {fridgeExpiringCount > 0
                ? t("home.dashboard.expiring", { count: fridgeExpiringCount })
                : t("home.dashboard.browse")}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(app)/(pantry)/pantry")}
            style={({ pressed }) => [styles.moduleCard, pressed && styles.cardPressed]}
            accessibilityRole="button"
            accessibilityLabel={t("tabs.pantry")}
          >
            <View style={[styles.moduleIcon, styles.pantryIcon]}>
              <MaterialCommunityIcons name="food-variant" color={homeColors.pantry} size={22} />
            </View>
            <Text style={styles.moduleTitle}>{t("tabs.pantry")}</Text>
            <Text style={styles.moduleSubtitle}>
              {t("home.dashboard.active_items", { count: activePantryItems.length })}
            </Text>
            <Text style={[styles.moduleLink, pantryExpiringCount > 0 ? styles.warningText : styles.pantryText]}>
              {pantryExpiringCount > 0
                ? t("home.dashboard.expiring", { count: pantryExpiringCount })
                : t("home.dashboard.browse")}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(app)/(cocktails)/cocktails")}
            style={({ pressed }) => [styles.moduleCard, pressed && styles.cardPressed]}
            accessibilityRole="button"
            accessibilityLabel={t("tabs.cocktails")}
          >
            <View style={[styles.moduleIcon, styles.cocktailIcon]}>
              <MaterialCommunityIcons name="glass-cocktail" color={homeColors.cocktails} size={22} />
            </View>
            <Text style={styles.moduleTitle}>{t("tabs.cocktails")}</Text>
            <Text style={styles.moduleSubtitle}>
              {t("cocktails.count", { count: activeCocktailItems.length })}
            </Text>
            <Text style={styles.moduleLink}>{t("home.dashboard.browse")}</Text>
          </Pressable>
        </View>

        <View>
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionTitle}>{t("home.dashboard.expiring_soon_title")}</Text>
            <Text style={styles.sectionAction}>
              {t("home.dashboard.expiring_soon_count", { count: expiringCount })}
            </Text>
          </View>

          <View style={styles.recentList}>
            {expiringHomeItems.length > 0 ? (
              expiringHomeItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    router.push({
                      pathname:
                        item.location === "fridge"
                          ? "/(app)/(fridge)/fridge-list"
                          : "/(app)/(pantry)/pantry",
                      params: { expirationFilter: "soon" },
                    })
                  }
                  style={({ pressed }) => [styles.expiringItem, pressed && styles.cardPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={item.name}
                >
                  <View style={styles.recentIcon}>
                    <MaterialCommunityIcons name={item.icon} color={palette.muted} size={22} />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.recentMeta} numberOfLines={1}>
                      {item.meta}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.expiringBadge,
                      item.daysUntilExpiration <= 1 && styles.expiringBadgeCritical,
                    ]}
                  >
                    <Text
                      style={[
                        styles.expiringBadgeText,
                        item.daysUntilExpiration <= 1 && styles.expiringBadgeCriticalText,
                      ]}
                    >
                      {formatExpiryBadge(item.daysUntilExpiration, t)}
                    </Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyListText}>{t("home.dashboard.no_expiring")}</Text>
            )}
          </View>
        </View>

        <View>
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionTitle}>{t("home.dashboard.recent_activity")}</Text>
            <Text style={styles.sectionAction}>{t("home.dashboard.see_all")}</Text>
          </View>

          <View style={styles.recentList}>
            {todayCalendarDay && todayCalendarDay.configNames.length > 0 ? (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(app)/wardrobe-calendar-day",
                    params: { date: todayKey },
                  })
                }
                style={({ pressed }) => [styles.todayCalendarCard, pressed && styles.cardPressed]}
              >
                <View style={styles.todayCalendarHeader}>
                  <View style={styles.recentIcon}>
                    <MaterialCommunityIcons name="calendar-today-outline" color={palette.primary} size={22} />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName} numberOfLines={1}>
                      {t("home.dashboard.today_calendar")}
                    </Text>
                    <Text style={styles.recentMeta} numberOfLines={1}>
                      {formatHomeDate(new Date())} · {t("home.dashboard.configurations", {
                        count: todayCalendarDay.configNames.length,
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.todayPreviewRow}>
                  {todayPreviewItems.map((item) => (
                    <View key={item.id} style={styles.todayPreviewTile}>
                      <MaterialCommunityIcons name="tshirt-crew-outline" color={palette.primary} size={18} />
                    </View>
                  ))}
                  <Text style={styles.todayConfigText} numberOfLines={1}>
                    {todayCalendarDay.configNames.join(", ")}
                  </Text>
                </View>
              </Pressable>
            ) : null}
            {recentItems.length > 0 ? (
              recentItems.map((item) => (
                <View key={item.id} style={styles.recentItem}>
                  <View style={styles.recentIcon}>
                    <MaterialCommunityIcons name={item.icon} color={palette.muted} size={22} />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.recentMeta} numberOfLines={1}>
                      {item.meta}
                    </Text>
                  </View>
                  <View style={[styles.recentTag, getTagStyle(item.kind, styles)]}>
                    <Text style={[styles.recentTagText, getTagTextStyle(item.kind, styles)]}>
                      {item.kind === "expiring"
                        ? t("home.dashboard.tag_expiring")
                        : item.kind === "fridge"
                        ? t("home.dashboard.tag_fridge")
                        : t("home.dashboard.tag_new")}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyListText}>{t("home.dashboard.no_recent")}</Text>
            )}
          </View>
        </View>

        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="checkbox-marked-circle-outline" color={palette.muted} size={40} />
          <Text style={styles.emptyTitle}>{t("home.dashboard.everything_organized")}</Text>
          <Text style={styles.emptyText}>
            {t("home.dashboard.organized_body")}
          </Text>
          <Pressable
            onPress={() => router.push("/(app)/add-item")}
            style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
          >
            <Text style={styles.emptyButtonText}>{t("home.dashboard.add_item")}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Pressable
        onPress={() => router.push("/(app)/add-item")}
        style={({ pressed }) => [
          styles.fab,
          { bottom: Math.max(insets.bottom + spacing.lg, 76) },
          pressed && styles.fabPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t("home.dashboard.add_item")}
      >
        <MaterialCommunityIcons name="plus" color={palette.logoTint} size={28} />
      </Pressable>
    </View>
  );
}

function StatCard({
  label,
  value,
  color,
  styles,
}: {
  label: string;
  value: number;
  color?: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function isExpiringSoon(expirationDate: string) {
  const days = getDaysUntilExpiration(expirationDate);
  return days !== null && days >= 0 && days <= 3;
}

function getDaysUntilExpiration(expirationDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${expirationDate}T00:00:00`);
  if (Number.isNaN(expiry.getTime())) {
    return null;
  }
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
}

function toExpiringHomeItem(
  item: FridgeItem | InventoryItem,
  location: "fridge" | "pantry",
  t: ReturnType<typeof useI18n>["t"]
): ExpiringHomeItem | null {
  const daysUntilExpiration = getDaysUntilExpiration(item.expirationDate);
  if (daysUntilExpiration === null || daysUntilExpiration < 0 || daysUntilExpiration > 3) {
    return null;
  }
  return {
    id: `${location}-${item.id}`,
    name: item.name,
    meta: `${item.quantity}${item.quantityType} · ${
      location === "fridge" ? t("home.dashboard.meta_fridge") : t("home.dashboard.meta_pantry")
    }`,
    location,
    daysUntilExpiration,
    icon: location === "fridge" ? "fridge-outline" : "food-variant",
  };
}

function formatExpiryBadge(daysUntilExpiration: number, t: ReturnType<typeof useI18n>["t"]) {
  if (daysUntilExpiration === 0) {
    return t("home.dashboard.expiring_today");
  }
  if (daysUntilExpiration === 1) {
    return t("home.dashboard.expiring_tomorrow");
  }
  return t("home.dashboard.expiring_days", { count: daysUntilExpiration });
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatHomeDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function getTagStyle(kind: RecentItem["kind"], styles: ReturnType<typeof createStyles>) {
  if (kind === "fridge") {
    return styles.fridgeTag;
  }
  if (kind === "expiring") {
    return styles.warningTag;
  }
  return styles.wardrobeTag;
}

function getTagTextStyle(kind: RecentItem["kind"], styles: ReturnType<typeof createStyles>) {
  if (kind === "fridge") {
    return styles.fridgeTagText;
  }
  if (kind === "expiring") {
    return styles.warningTagText;
  }
  return styles.wardrobeTagText;
}

const homeColors = {
  secondary: "#00E676",
  secondaryDim: "rgba(0, 230, 118, 0.12)",
  pantry: "#E8A838",
  pantryDim: "rgba(232, 168, 56, 0.12)",
  cocktails: "#3BA4F5",
  cocktailsDim: "rgba(59, 164, 245, 0.12)",
  warning: "#FFA502",
  warningDim: "rgba(255, 165, 2, 0.12)",
  danger: "#FF4757",
};

const createStyles = (theme: AppTheme) => {
  const palette = theme.colors;
  const primaryDim = theme.isDark ? "rgba(0, 212, 255, 0.15)" : "rgba(22, 27, 34, 0.08)";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    content: {
      paddingHorizontal: 20,
      gap: 20,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    greeting: {
      color: palette.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    title: {
      color: palette.text,
      fontSize: 28,
      lineHeight: 32,
      fontWeight: "700",
    },
    headerActions: {
      flexDirection: "row",
      gap: spacing.xs,
    },
    iconButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface2,
    },
    statsRow: {
      flexDirection: "row",
      gap: spacing.xs,
    },
    statCard: {
      flex: 1,
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface2,
    },
    statValue: {
      color: palette.text,
      fontSize: 28,
      lineHeight: 31,
      fontWeight: "700",
    },
    statLabel: {
      marginTop: 4,
      color: palette.textMuted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    moduleGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    moduleCard: {
      width: "48%",
      minHeight: 150,
      paddingVertical: 20,
      paddingHorizontal: spacing.md,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface2,
    },
    cardPressed: {
      opacity: 0.82,
      transform: [{ scale: 0.98 }],
    },
    moduleIcon: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.sm,
      borderRadius: 10,
    },
    wardrobeIcon: {
      backgroundColor: primaryDim,
    },
    fridgeIcon: {
      backgroundColor: homeColors.secondaryDim,
    },
    pantryIcon: {
      backgroundColor: homeColors.pantryDim,
    },
    cocktailIcon: {
      backgroundColor: homeColors.cocktailsDim,
    },
    moduleTitle: {
      color: palette.text,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "600",
    },
    moduleSubtitle: {
      marginTop: 2,
      color: palette.textMuted,
      fontSize: 12,
      lineHeight: 17,
    },
    moduleLink: {
      marginTop: spacing.sm,
      color: palette.primary,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "600",
    },
    warningText: {
      color: homeColors.warning,
    },
    pantryText: {
      color: homeColors.pantry,
    },
    sectionLabel: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: spacing.xs,
    },
    sectionTitle: {
      color: palette.text,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "600",
    },
    sectionAction: {
      color: palette.textMuted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "500",
    },
    recentList: {
      gap: spacing.xs,
    },
    recentItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: 10,
      paddingHorizontal: spacing.sm,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface2,
    },
    expiringItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      minHeight: 66,
      paddingVertical: 10,
      paddingHorizontal: spacing.sm,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface2,
    },
    todayCalendarCard: {
      gap: spacing.sm,
      paddingVertical: 10,
      paddingHorizontal: spacing.sm,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface2,
    },
    todayCalendarHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    todayPreviewRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingLeft: 52,
    },
    todayPreviewTile: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      backgroundColor: primaryDim,
    },
    todayConfigText: {
      flex: 1,
      color: palette.textMuted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "600",
    },
    recentIcon: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      backgroundColor: palette.surface3,
    },
    recentInfo: {
      flex: 1,
      minWidth: 0,
    },
    recentName: {
      color: palette.text,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "600",
    },
    recentMeta: {
      color: palette.textMuted,
      fontSize: 12,
      lineHeight: 17,
    },
    recentTag: {
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 999,
    },
    recentTagText: {
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    wardrobeTag: {
      backgroundColor: primaryDim,
    },
    wardrobeTagText: {
      color: palette.primary,
    },
    fridgeTag: {
      backgroundColor: homeColors.secondaryDim,
    },
    fridgeTagText: {
      color: homeColors.secondary,
    },
    warningTag: {
      backgroundColor: homeColors.warningDim,
    },
    warningTagText: {
      color: homeColors.warning,
    },
    expiringBadge: {
      flexShrink: 0,
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: homeColors.warningDim,
    },
    expiringBadgeCritical: {
      backgroundColor: "rgba(255, 71, 87, 0.12)",
    },
    expiringBadgeText: {
      color: homeColors.warning,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    expiringBadgeCriticalText: {
      color: homeColors.danger,
    },
    emptyListText: {
      color: palette.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      borderRadius: 16,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: palette.border,
      backgroundColor: palette.surface2,
    },
    emptyTitle: {
      marginTop: spacing.xs,
      color: palette.text,
      fontSize: 15,
      lineHeight: 21,
      fontWeight: "600",
    },
    emptyText: {
      marginTop: 4,
      maxWidth: 260,
      color: palette.textMuted,
      fontSize: 13,
      lineHeight: 18,
      textAlign: "center",
    },
    emptyButton: {
      marginTop: spacing.sm,
      paddingVertical: 10,
      paddingHorizontal: spacing.lg,
      borderRadius: 10,
      backgroundColor: palette.primary,
    },
    emptyButtonText: {
      color: palette.logoTint,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "600",
    },
    fab: {
      position: "absolute",
      right: 20,
      width: 52,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 26,
      backgroundColor: palette.primary,
      shadowColor: "#000",
      shadowOpacity: theme.isDark ? 0.6 : 0.18,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 6,
    },
    fabPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.94 }],
    },
    pressed: {
      opacity: 0.85,
    },
  });
};
