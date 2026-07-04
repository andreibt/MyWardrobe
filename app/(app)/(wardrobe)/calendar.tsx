import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../../../src/i18n/I18nProvider";
import {
  subscribeToWardrobeCalendarDays,
  type WardrobeCalendarDay,
} from "../../../src/lib/firestore/wardrobeCalendar";
import { useAuth } from "../../../src/providers/AuthProvider";
import { useTheme, type AppTheme } from "../../../src/providers/ThemeProvider";
import { spacing, typography } from "../../../src/theme/tokens";

const UPCOMING_LIMIT = 5;
const WEEKDAY_LABEL_DATES = [
  "2026-07-06",
  "2026-07-07",
  "2026-07-08",
  "2026-07-09",
  "2026-07-10",
  "2026-07-11",
  "2026-07-12",
];
const UPCOMING_ICONS: Array<keyof typeof MaterialCommunityIcons.glyphMap> = [
  "weather-sunny",
  "weather-night",
  "weather-sunset",
  "hanger",
  "tshirt-crew-outline",
];

type CalendarCell =
  | {
      date: Date;
      dateKey: string;
    }
  | null;

export default function WardrobeCalendarScreen() {
  const { t, language } = useI18n();
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
  const locale = language === "ro" ? "ro-RO" : "en-US";
  const [calendarDays, setCalendarDays] = useState<WardrobeCalendarDay[]>([]);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const today = useMemo(() => new Date(), []);
  const todayKey = formatDateKey(today);

  useEffect(() => {
    if (!user) {
      setCalendarDays([]);
      return;
    }
    return subscribeToWardrobeCalendarDays(user.id, setCalendarDays);
  }, [user]);

  const daysByDate = useMemo(
    () => new Map(calendarDays.map((day) => [day.date, day])),
    [calendarDays]
  );
  const monthCells = useMemo(() => createMonthCells(visibleMonth), [visibleMonth]);
  const upcomingOutfits = useMemo(
    () =>
      calendarDays
        .filter((day) => day.date >= todayKey && day.configNames.length > 0)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, UPCOMING_LIMIT),
    [calendarDays, todayKey]
  );
  const weekdayLabels = useMemo(
    () =>
      WEEKDAY_LABEL_DATES.map((dateKey) =>
        new Date(`${dateKey}T00:00:00`).toLocaleDateString(locale, { weekday: "short" })
      ),
    [locale]
  );

  const openDay = (date: string) => {
    router.push({
      pathname: "/(app)/wardrobe-calendar-day",
      params: { date },
    });
  };

  const showToday = () => {
    setVisibleMonth(startOfMonth(new Date()));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + spacing.sm, spacing.lg),
            paddingBottom: Math.max(insets.bottom + 112, 136),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.navBar}>
          <Pressable
            onPress={() => router.push("/(app)/(wardrobe)/module-home")}
            style={({ pressed }) => [styles.roundButton, pressed && styles.buttonPressed]}
            accessibilityRole="button"
            accessibilityLabel={t("wardrobe_calendar.back")}
          >
            <MaterialCommunityIcons name="arrow-left" color={colors.text} size={20} />
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {t("wardrobe_calendar.title")}
          </Text>
          <Pressable
            onPress={showToday}
            style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}
            accessibilityRole="button"
            accessibilityLabel={t("wardrobe_calendar.today")}
          >
            <MaterialCommunityIcons name="calendar-today-outline" color={colors.textMuted} size={19} />
          </Pressable>
        </View>

        <View style={styles.monthNav}>
          <View style={styles.monthRow}>
            <Pressable
              onPress={() => setVisibleMonth((current) => addMonths(current, -1))}
              style={({ pressed }) => [styles.monthButton, pressed && styles.buttonPressed]}
              accessibilityRole="button"
              accessibilityLabel={t("wardrobe_calendar.previous_month")}
            >
              <MaterialCommunityIcons name="chevron-left" color={colors.textMuted} size={20} />
            </Pressable>
            <Text style={styles.monthLabel} numberOfLines={1}>
              {formatMonthTitle(visibleMonth, locale)}
            </Text>
            <Pressable
              onPress={() => setVisibleMonth((current) => addMonths(current, 1))}
              style={({ pressed }) => [styles.monthButton, pressed && styles.buttonPressed]}
              accessibilityRole="button"
              accessibilityLabel={t("wardrobe_calendar.next_month")}
            >
              <MaterialCommunityIcons name="chevron-right" color={colors.textMuted} size={20} />
            </Pressable>
          </View>

          <View style={styles.yearRow}>
            <Pressable
              onPress={() => setVisibleMonth((current) => addYears(current, -1))}
              style={({ pressed }) => [styles.yearButton, pressed && styles.buttonPressed]}
              accessibilityRole="button"
              accessibilityLabel={t("wardrobe_calendar.previous_year")}
            >
              <MaterialCommunityIcons name="chevron-left" color={colors.muted} size={16} />
            </Pressable>
            <Text style={styles.yearLabel}>{visibleMonth.getFullYear()}</Text>
            <Pressable
              onPress={() => setVisibleMonth((current) => addYears(current, 1))}
              style={({ pressed }) => [styles.yearButton, pressed && styles.buttonPressed]}
              accessibilityRole="button"
              accessibilityLabel={t("wardrobe_calendar.next_year")}
            >
              <MaterialCommunityIcons name="chevron-right" color={colors.muted} size={16} />
            </Pressable>
          </View>
        </View>

        <View style={styles.weekdayRow}>
          {weekdayLabels.map((label) => (
            <Text key={label} style={styles.weekday}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {monthCells.map((cell, index) => {
            if (!cell) {
              return <View key={`empty-${index}`} style={styles.emptyCell} />;
            }

            const dayPlan = daysByDate.get(cell.dateKey);
            const configNames = dayPlan?.configNames ?? [];
            const hasConfigs = configNames.length > 0;
            const isToday = cell.dateKey === todayKey;

            return (
              <Pressable
                key={cell.dateKey}
                onPress={() => openDay(cell.dateKey)}
                style={({ pressed }) => [
                  styles.dayCell,
                  isToday && styles.dayCellToday,
                  hasConfigs && styles.dayCellHasOutfit,
                  pressed && styles.dayCellPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t("wardrobe_calendar.open_day", {
                  date: formatUpcomingDate(cell.dateKey, locale),
                })}
              >
                <Text style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
                  {cell.date.getDate()}
                </Text>
                {hasConfigs ? (
                  <Text style={styles.outfitLabel} numberOfLines={2}>
                    {summarizeConfigs(configNames)}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionLabel}>
          <Text style={styles.sectionTitle}>{t("wardrobe_calendar.upcoming_outfits")}</Text>
        </View>

        <View style={styles.upcomingList}>
          {upcomingOutfits.length === 0 ? (
            <Text style={styles.emptyText}>{t("wardrobe_calendar.no_upcoming_outfits")}</Text>
          ) : (
            upcomingOutfits.map((day, index) => (
              <Pressable
                key={day.id}
                onPress={() => openDay(day.date)}
                style={({ pressed }) => [styles.upcomingCard, pressed && styles.buttonPressed]}
                accessibilityRole="button"
                accessibilityLabel={t("wardrobe_calendar.open_day", {
                  date: formatUpcomingDate(day.date, locale),
                })}
              >
                <View style={styles.upcomingIcon}>
                  <MaterialCommunityIcons
                    name={UPCOMING_ICONS[index] ?? "hanger"}
                    color={colors.muted}
                    size={18}
                  />
                </View>
                <View style={styles.upcomingInfo}>
                  <Text style={styles.upcomingDate}>{formatUpcomingDate(day.date, locale)}</Text>
                  <Text style={styles.upcomingDescription} numberOfLines={1}>
                    {summarizeConfigs(day.configNames)}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" color={colors.textMuted} size={18} />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <Pressable
        onPress={() => openDay(todayKey)}
        style={({ pressed }) => [
          styles.fab,
          { bottom: Math.max(insets.bottom + 76, 92) },
          pressed && styles.fabPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t("wardrobe_calendar.add_outfit")}
      >
        <MaterialCommunityIcons name="plus" color={colors.logoTint} size={26} />
      </Pressable>
    </View>
  );
}

function createMonthCells(anchor: Date): CalendarCell[] {
  const first = startOfMonth(anchor);
  const leadingBlankCount = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const blanks = Array.from({ length: leadingBlankCount }, () => null);
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(first.getFullYear(), first.getMonth(), index + 1);
    return {
      date,
      dateKey: formatDateKey(date),
    };
  });

  return [...blanks, ...days];
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function addYears(date: Date, amount: number) {
  return new Date(date.getFullYear() + amount, date.getMonth(), 1);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthTitle(date: Date, locale: string) {
  return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

function formatUpcomingDate(dateKey: string, locale: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function summarizeConfigs(configNames: string[]) {
  if (configNames.length <= 2) {
    return configNames.join(", ");
  }

  return `${configNames.slice(0, 2).join(", ")} +${configNames.length - 2}`;
}

const createStyles = (theme: AppTheme) => {
  const colors = theme.colors;
  const primaryDim = theme.isDark ? "rgba(0, 212, 255, 0.15)" : "rgba(22, 27, 34, 0.08)";
  const pressScale = [{ scale: 0.97 }];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 20,
    },
    navBar: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    roundButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: "transparent",
    },
    actionButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
      backgroundColor: "transparent",
    },
    title: {
      flex: 1,
      color: colors.text,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "700",
    },
    monthNav: {
      gap: 6,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    monthRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    monthButton: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    monthLabel: {
      minWidth: 160,
      flex: 1,
      color: colors.text,
      fontSize: 17,
      lineHeight: 23,
      fontWeight: "600",
      textAlign: "center",
      textTransform: "capitalize",
    },
    yearRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
    },
    yearButton: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: "transparent",
    },
    yearLabel: {
      minWidth: 60,
      color: colors.textMuted,
      ...typography.caption,
      fontWeight: "600",
      textAlign: "center",
    },
    weekdayRow: {
      flexDirection: "row",
      marginBottom: 4,
    },
    weekday: {
      flex: 1,
      paddingVertical: 6,
      color: colors.muted,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "600",
      textAlign: "center",
      textTransform: "uppercase",
    },
    daysGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
    },
    emptyCell: {
      width: "13.42%",
      aspectRatio: 1,
      borderRadius: 10,
    },
    dayCell: {
      width: "13.42%",
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      padding: 2,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    dayCellToday: {
      borderColor: colors.primary,
    },
    dayCellHasOutfit: {
      borderColor: colors.primary,
      backgroundColor: primaryDim,
    },
    dayCellPressed: {
      opacity: 0.9,
      transform: pressScale,
    },
    dayNumber: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 15,
      fontWeight: "700",
    },
    dayNumberToday: {
      color: colors.primary,
    },
    outfitLabel: {
      maxWidth: "100%",
      color: colors.primary,
      fontSize: 7,
      lineHeight: 8,
      fontWeight: "600",
      textAlign: "center",
    },
    sectionLabel: {
      paddingTop: 20,
      paddingBottom: 10,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "600",
    },
    upcomingList: {
      gap: spacing.xs,
    },
    upcomingCard: {
      minHeight: 58,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: spacing.sm,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    upcomingIcon: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 6,
      backgroundColor: colors.surface3,
    },
    upcomingInfo: {
      flex: 1,
      minWidth: 0,
    },
    upcomingDate: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700",
    },
    upcomingDescription: {
      color: colors.textMuted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "500",
    },
    emptyText: {
      color: colors.textMuted,
      ...typography.caption,
    },
    fab: {
      position: "absolute",
      right: 20,
      width: 52,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 26,
      backgroundColor: colors.primary,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.34 : 0.16,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    fabPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.94 }],
    },
  });
};
