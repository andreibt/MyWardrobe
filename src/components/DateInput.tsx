import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../i18n/I18nProvider";
import { useTheme, type AppTheme } from "../providers/ThemeProvider";
import { radius, spacing, typography } from "../theme/tokens";

type DateInputProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
};

const monthFormatter = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
});
const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
});

export function DateInput({ value, onChange, onBlur, placeholder }: DateInputProps) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => parseDate(value) ?? new Date());
  const selectedDate = parseDate(value);
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const weekDays = useMemo(() => {
    const start = new Date(2026, 0, 4);
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return weekdayFormatter.format(day).slice(0, 2);
    });
  }, []);

  const openPicker = () => {
    setVisibleMonth(parseDate(value) ?? new Date());
    setIsOpen(true);
  };

  const closePicker = () => {
    setIsOpen(false);
    onBlur?.();
  };

  const selectDate = (date: Date) => {
    onChange(formatDate(date));
    setVisibleMonth(date);
    setIsOpen(false);
    onBlur?.();
  };

  const shiftMonth = (amount: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  return (
    <>
      <Pressable
        onPress={openPicker}
        style={({ pressed }) => [styles.input, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
      >
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <MaterialCommunityIcons name="calendar-month-outline" color={colors.textMuted} size={20} />
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={closePicker}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={closePicker} />
          <View style={styles.picker}>
            <View style={styles.header}>
              <Pressable
                onPress={() => shiftMonth(-1)}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={t("date_input.previous_month")}
              >
                <MaterialCommunityIcons name="chevron-left" color={colors.text} size={22} />
              </Pressable>
              <Text style={styles.monthTitle}>{monthFormatter.format(visibleMonth)}</Text>
              <Pressable
                onPress={() => shiftMonth(1)}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={t("date_input.next_month")}
              >
                <MaterialCommunityIcons name="chevron-right" color={colors.text} size={22} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {weekDays.map((day) => (
                <Text key={day} style={styles.weekDay}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {calendarDays.map((date, index) => {
                const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                const isToday = isSameDay(date, new Date());
                return (
                  <Pressable
                    key={`${date.toISOString()}-${index}`}
                    onPress={() => selectDate(date)}
                    style={({ pressed }) => [
                      styles.dayButton,
                      !isCurrentMonth && styles.dayOutside,
                      isToday && styles.dayToday,
                      isSelected && styles.daySelected,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={formatDate(date)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !isCurrentMonth && styles.dayTextOutside,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={closePicker}
                style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
              >
                <Text style={styles.actionText}>{t("date_input.cancel")}</Text>
              </Pressable>
              <Pressable
                onPress={() => selectDate(new Date())}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.primaryText}>{t("date_input.today")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCalendarDays(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

const createStyles = (theme: AppTheme) => {
  const colors = theme.colors;
  return StyleSheet.create({
    input: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    value: {
      flex: 1,
      color: colors.text,
      ...typography.body,
    },
    placeholder: {
      color: colors.muted,
    },
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
    picker: {
      width: "100%",
      maxWidth: 360,
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      shadowColor: "#000",
      shadowOpacity: theme.isDark ? 0.45 : 0.18,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 18 },
      elevation: 8,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.xs,
    },
    iconButton: {
      width: 38,
      height: 38,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface3,
    },
    monthTitle: {
      flex: 1,
      color: colors.text,
      textAlign: "center",
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "700",
      textTransform: "capitalize",
    },
    weekRow: {
      flexDirection: "row",
    },
    weekDay: {
      flex: 1,
      color: colors.textMuted,
      textAlign: "center",
      ...typography.caption,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    daysGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    dayButton: {
      width: "14.2857%",
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "transparent",
      backgroundColor: "transparent",
    },
    dayOutside: {
      opacity: 0.45,
    },
    dayToday: {
      borderColor: colors.primary,
    },
    daySelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    dayText: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "600",
    },
    dayTextOutside: {
      color: colors.textMuted,
    },
    dayTextSelected: {
      color: colors.logoTint,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.xs,
      paddingTop: spacing.xs,
    },
    actionButton: {
      minHeight: 38,
      justifyContent: "center",
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface3,
    },
    primaryButton: {
      minHeight: 38,
      justifyContent: "center",
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
    },
    actionText: {
      color: colors.text,
      ...typography.caption,
      fontWeight: "700",
    },
    primaryText: {
      color: colors.logoTint,
      ...typography.caption,
      fontWeight: "700",
    },
    pressed: {
      opacity: 0.82,
    },
  });
};
