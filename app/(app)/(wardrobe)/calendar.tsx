import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../../../src/i18n/I18nProvider";
import {
  subscribeToWardrobeCalendarDays,
  type WardrobeCalendarDay,
} from "../../../src/lib/firestore/wardrobeCalendar";
import {
  getWardrobeCalendarWeatherSnapshot,
  getWeatherSummary,
  type WeatherDay,
} from "../../../src/lib/weather";
import { useAuth } from "../../../src/providers/AuthProvider";
import { useTheme, type AppTheme } from "../../../src/providers/ThemeProvider";
import { spacing, typography } from "../../../src/theme/tokens";

const UPCOMING_LIMIT = 5;
const WEATHER_REFRESH_MS = 6 * 60 * 60 * 1000;
const CALENDAR_COLUMN_COUNT = 7;
const CALENDAR_GRID_GAP = 4;
const CONTENT_HORIZONTAL_PADDING = 20;
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
  const { width: windowWidth } = useWindowDimensions();
  const calendarCellSize = useMemo(() => {
    const contentWidth = Math.max(0, windowWidth - CONTENT_HORIZONTAL_PADDING * 2);
    return Math.max(
      0,
      Math.floor(
        (contentWidth - CALENDAR_GRID_GAP * (CALENDAR_COLUMN_COUNT - 1)) / CALENDAR_COLUMN_COUNT
      )
    );
  }, [windowWidth]);
  const styles = useMemo(() => createStyles(theme, calendarCellSize), [calendarCellSize, theme]);
  const colors = theme.colors;
  const locale = language === "ro" ? "ro-RO" : "en-US";
  const [calendarDays, setCalendarDays] = useState<WardrobeCalendarDay[]>([]);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [showWeather, setShowWeather] = useState(false);
  const [weatherDays, setWeatherDays] = useState<WeatherDay[]>([]);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(false);
  const [weatherUpdatedAt, setWeatherUpdatedAt] = useState<number | null>(null);
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
  const forecastDays = useMemo(() => weatherDays.slice(0, 7), [weatherDays]);
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

  useEffect(() => {
    if (!showWeather) {
      return;
    }

    let isMounted = true;
    const loadWeather = async (forceRefresh = false) => {
      setIsWeatherLoading(true);
      setWeatherError(false);
      try {
        const snapshot = await getWardrobeCalendarWeatherSnapshot(forceRefresh);
        if (isMounted) {
          setWeatherDays(snapshot.days);
          setWeatherUpdatedAt(snapshot.fetchedAt);
        }
      } catch {
        if (isMounted) {
          setWeatherError(true);
        }
      } finally {
        if (isMounted) {
          setIsWeatherLoading(false);
        }
      }
    };

    loadWeather();
    const intervalId = setInterval(() => loadWeather(), WEATHER_REFRESH_MS);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [showWeather]);

  const refreshWeather = async () => {
    setIsWeatherLoading(true);
    setWeatherError(false);
    try {
      const snapshot = await getWardrobeCalendarWeatherSnapshot(true);
      setWeatherDays(snapshot.days);
      setWeatherUpdatedAt(snapshot.fetchedAt);
    } catch {
      setWeatherError(true);
    } finally {
      setIsWeatherLoading(false);
    }
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

        <Pressable
          onPress={() => setShowWeather((value) => !value)}
          style={({ pressed }) => [styles.weatherToggle, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel={t("wardrobe_calendar.weather_forecast")}
        >
          <MaterialCommunityIcons name="weather-partly-cloudy" color={colors.textMuted} size={18} />
          <Text style={styles.weatherToggleText}>{t("wardrobe_calendar.weather_forecast")}</Text>
          {isWeatherLoading && showWeather ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <MaterialCommunityIcons
              name={showWeather ? "chevron-up" : "chevron-down"}
              color={colors.textMuted}
              size={18}
            />
          )}
        </Pressable>

        {showWeather ? (
          <View style={styles.weatherSection}>
            <View style={styles.weatherRefresh}>
              <Text
                style={[styles.weatherUpdatedText, weatherError && styles.weatherErrorText]}
                numberOfLines={1}
              >
                {weatherError
                  ? t("wardrobe_calendar.weather_error")
                  : t("wardrobe_calendar.weather_updated", {
                      time: weatherUpdatedAt
                        ? formatWeatherUpdatedAt(weatherUpdatedAt, locale)
                        : t("wardrobe_calendar.weather_updating"),
                    })}
              </Text>
              <Pressable
                onPress={refreshWeather}
                disabled={Boolean(isWeatherLoading)}
                style={({ pressed }) => [styles.weatherRefreshButton, pressed && styles.buttonPressed]}
                accessibilityRole="button"
                accessibilityLabel={t("wardrobe_calendar.weather_refresh_button")}
              >
                <MaterialCommunityIcons name="refresh" color={colors.textMuted} size={13} />
                <Text style={styles.weatherRefreshText}>
                  {isWeatherLoading
                    ? t("wardrobe_calendar.weather_refreshing")
                    : t("wardrobe_calendar.weather_refresh_button")}
                </Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weatherStrip}
            >
              {forecastDays.map((day, index) => (
                <View key={day.date} style={styles.weatherDay}>
                  <Text style={styles.weatherDayName}>
                    {formatWeatherDayName(day.date, locale)}
                  </Text>
                  <MaterialCommunityIcons
                    name={getWeatherIcon(day.weatherCode)}
                    color={colors.text}
                    size={22}
                    style={styles.weatherDayIcon}
                  />
                  <Text style={styles.weatherDayTemp}>{Math.round(day.max)}°</Text>
                  <Text style={styles.weatherDayDesc} numberOfLines={1}>
                    {getWeatherSummary(day.weatherCode)}
                  </Text>
                  {index === 0 ? (
                    <Text style={styles.weatherDayHighlight}>{t("wardrobe_calendar.today")}</Text>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

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

function formatWeatherDayName(dateKey: string, locale: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(locale, { weekday: "short" });
}

function formatWeatherUpdatedAt(timestamp: number, locale: string) {
  return new Date(timestamp).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function summarizeConfigs(configNames: string[]) {
  if (configNames.length <= 2) {
    return configNames.join(", ");
  }

  return `${configNames.slice(0, 2).join(", ")} +${configNames.length - 2}`;
}

function getWeatherIcon(weatherCode: number): keyof typeof MaterialCommunityIcons.glyphMap {
  const summary = getWeatherSummary(weatherCode);
  if (summary === "Clear") {
    return "weather-sunny";
  }
  if (summary === "Clouds") {
    return "weather-cloudy";
  }
  if (summary === "Fog") {
    return "weather-fog";
  }
  if (summary === "Rain") {
    return "weather-pouring";
  }
  if (summary === "Snow") {
    return "weather-snowy";
  }
  if (summary === "Storm") {
    return "weather-lightning-rainy";
  }
  return "weather-partly-cloudy";
}

const createStyles = (theme: AppTheme, calendarCellSize: number) => {
  const colors = theme.colors;
  const primaryDim = theme.isDark ? "rgba(0, 212, 255, 0.15)" : "rgba(22, 27, 34, 0.08)";
  const pressScale = [{ scale: 0.97 }];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
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
      width: calendarCellSize,
      height: calendarCellSize,
      borderRadius: 10,
    },
    dayCell: {
      width: calendarCellSize,
      height: calendarCellSize,
      position: "relative",
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
    weatherToggle: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginTop: spacing.sm,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    weatherToggleText: {
      flex: 1,
      color: colors.text,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700",
    },
    weatherSection: {
      gap: spacing.xs,
      paddingTop: spacing.xs,
    },
    weatherRefresh: {
      minHeight: 32,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: spacing.xs,
    },
    weatherUpdatedText: {
      flex: 1,
      color: colors.muted,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "600",
      textAlign: "right",
    },
    weatherErrorText: {
      color: colors.danger,
    },
    weatherRefreshButton: {
      minHeight: 28,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: spacing.sm,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: "transparent",
    },
    weatherRefreshText: {
      color: colors.textMuted,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "700",
    },
    weatherStrip: {
      gap: spacing.xs,
      paddingBottom: 4,
    },
    weatherDay: {
      width: 72,
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    weatherDayName: {
      color: colors.textMuted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    weatherDayIcon: {
      marginVertical: 4,
    },
    weatherDayTemp: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 19,
      fontWeight: "700",
    },
    weatherDayDesc: {
      maxWidth: "100%",
      marginTop: 2,
      color: colors.muted,
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "500",
    },
    weatherDayHighlight: {
      marginTop: 2,
      color: colors.primary,
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "700",
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
