import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../../../src/i18n/I18nProvider";
import {
  subscribeToWardrobeCalendarDays,
  type WardrobeCalendarDay,
} from "../../../src/lib/firestore/wardrobeCalendar";
import {
  getWardrobeCalendarWeather,
  getWeatherSummary,
  type WeatherDay,
} from "../../../src/lib/weather";
import { useAuth } from "../../../src/providers/AuthProvider";
import { useTheme, type AppTheme } from "../../../src/providers/ThemeProvider";
import { spacing, typography } from "../../../src/theme/tokens";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WardrobeCalendarScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
  const [calendarDays, setCalendarDays] = useState<WardrobeCalendarDay[]>([]);
  const [weatherDays, setWeatherDays] = useState<WeatherDay[]>([]);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const todayKey = formatDateKey(new Date());

  useEffect(() => {
    if (!user) {
      setCalendarDays([]);
      return;
    }
    return subscribeToWardrobeCalendarDays(user.id, setCalendarDays);
  }, [user]);

  useEffect(() => {
    loadWeather(false);
  }, []);

  const daysByDate = useMemo(
    () => new Map(calendarDays.map((day) => [day.date, day])),
    [calendarDays]
  );
  const monthDays = useMemo(() => createMonthDays(new Date()), []);

  const loadWeather = async (forceRefresh: boolean) => {
    setIsWeatherLoading(true);
    setWeatherError("");
    try {
      setWeatherDays(await getWardrobeCalendarWeather(forceRefresh));
    } catch {
      setWeatherError(t("wardrobe_calendar.weather_error"));
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
            paddingBottom: Math.max(insets.bottom + 96, 120),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{t("wardrobe_calendar.title")}</Text>
            <Text style={styles.subtitle}>{t("wardrobe_calendar.subtitle")}</Text>
          </View>
          <Pressable
            onPress={() => loadWeather(true)}
            disabled={isWeatherLoading}
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && styles.buttonPressed,
              isWeatherLoading && styles.disabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t("wardrobe_calendar.refresh_weather")}
          >
            {isWeatherLoading ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <MaterialCommunityIcons name="refresh" color={colors.primary} size={20} />
            )}
          </Pressable>
        </View>

        <View style={styles.weatherPanel}>
          <View style={styles.panelTitleRow}>
            <Text style={styles.sectionTitle}>{t("wardrobe_calendar.weather_title")}</Text>
            <Text style={styles.sectionHint}>{t("wardrobe_calendar.weather_hint")}</Text>
          </View>
          {weatherError ? <Text style={styles.errorText}>{weatherError}</Text> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weatherList}>
            {weatherDays.map((day) => (
              <View key={day.date} style={styles.weatherCard}>
                <Text style={styles.weatherDay}>{formatShortWeekday(day.date)}</Text>
                <MaterialCommunityIcons
                  name={getWeatherIcon(day.weatherCode)}
                  color={colors.primary}
                  size={22}
                />
                <Text style={styles.weatherTemp}>
                  {Math.round(day.max)}° / {Math.round(day.min)}°
                </Text>
                <Text style={styles.weatherMeta}>{getWeatherSummary(day.weatherCode)}</Text>
                <Text style={styles.weatherMeta}>{day.precipitation}%</Text>
              </View>
            ))}
            {weatherDays.length === 0 && !isWeatherLoading ? (
              <Text style={styles.emptyText}>{t("wardrobe_calendar.weather_empty")}</Text>
            ) : null}
          </ScrollView>
        </View>

        <View style={styles.calendarPanel}>
          <Text style={styles.monthTitle}>{formatMonthTitle(new Date())}</Text>
          <View style={styles.weekRow}>
            {WEEKDAY_LABELS.map((label) => (
              <Text key={label} style={styles.weekday}>
                {label}
              </Text>
            ))}
          </View>
          <View style={styles.monthGrid}>
            {monthDays.map((day) => {
              const dayPlan = daysByDate.get(day.dateKey);
              const isToday = day.dateKey === todayKey;
              const configNames = dayPlan?.configNames ?? [];
              const hasConfigs = configNames.length > 0;

              return (
                <Pressable
                  key={day.dateKey}
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/wardrobe-calendar-day",
                      params: { date: day.dateKey },
                    })
                  }
                  style={({ pressed }) => [
                    styles.dayCell,
                    !day.inCurrentMonth && styles.dayCellMuted,
                    isToday && styles.dayCellToday,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
                    {day.date.getDate()}
                  </Text>
                  <View style={styles.previewRow}>
                    {hasConfigs ? (
                      <View style={styles.previewDot}>
                        <MaterialCommunityIcons name="hanger" color={colors.primary} size={15} />
                      </View>
                    ) : null}
                  </View>
                  {hasConfigs ? (
                    <Text style={styles.configPreview} numberOfLines={1}>
                      {configNames.length}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function createMonthDays(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      dateKey: formatDateKey(date),
      inCurrentMonth: date.getMonth() === anchor.getMonth(),
    };
  });
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthTitle(date: Date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function formatShortWeekday(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" });
}

function getWeatherIcon(code: number): keyof typeof MaterialCommunityIcons.glyphMap {
  if (code === 0) return "weather-sunny";
  if ([1, 2, 3].includes(code)) return "weather-partly-cloudy";
  if ([45, 48].includes(code)) return "weather-fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "weather-rainy";
  if (code >= 71 && code <= 77) return "weather-snowy";
  if (code >= 95) return "weather-lightning-rainy";
  return "weather-cloudy";
}

const createStyles = (theme: AppTheme) => {
  const colors = theme.colors;
  const primaryDim = theme.isDark ? "rgba(0, 212, 255, 0.15)" : "rgba(22, 27, 34, 0.08)";

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20, gap: spacing.md },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    titleBlock: { flex: 1 },
    title: { color: colors.text, fontSize: 26, lineHeight: 32, fontWeight: "700" },
    subtitle: { color: colors.textMuted, ...typography.body },
    refreshButton: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 21,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    weatherPanel: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    panelTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
    sectionTitle: { color: colors.text, ...typography.h2 },
    sectionHint: { color: colors.textMuted, ...typography.caption },
    weatherList: { gap: spacing.xs },
    weatherCard: {
      width: 86,
      minHeight: 112,
      alignItems: "center",
      gap: 4,
      padding: spacing.sm,
      borderRadius: 14,
      backgroundColor: colors.surface3,
    },
    weatherDay: { color: colors.text, ...typography.caption, fontWeight: "700" },
    weatherTemp: { color: colors.text, ...typography.caption, fontWeight: "700" },
    weatherMeta: { color: colors.textMuted, fontSize: 10, lineHeight: 13, fontWeight: "600" },
    calendarPanel: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    monthTitle: { color: colors.text, ...typography.h2 },
    weekRow: { flexDirection: "row" },
    weekday: { flex: 1, color: colors.textMuted, textAlign: "center", ...typography.caption, fontWeight: "700" },
    monthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    dayCell: {
      width: "13.4%",
      minHeight: 78,
      gap: 4,
      padding: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    dayCellMuted: { opacity: 0.45 },
    dayCellToday: { borderColor: colors.primary, backgroundColor: primaryDim },
    dayNumber: { color: colors.text, ...typography.caption, fontWeight: "700" },
    dayNumberToday: { color: colors.primary },
    previewRow: { minHeight: 22, alignItems: "center", justifyContent: "center" },
    previewDot: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      backgroundColor: colors.surface3,
    },
    configPreview: { color: colors.textMuted, fontSize: 10, lineHeight: 12, fontWeight: "700", textAlign: "center" },
    emptyText: { color: colors.textMuted, ...typography.caption },
    errorText: { color: colors.danger, ...typography.caption },
    buttonPressed: { opacity: 0.85 },
    disabled: { opacity: 0.55 },
  });
};
