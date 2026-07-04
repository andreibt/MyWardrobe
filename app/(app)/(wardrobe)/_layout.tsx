import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useI18n } from "../../../src/i18n/I18nProvider";
import {
  stableTabNavigatorProps,
  stableTabScreenOptions,
} from "../../../src/lib/navigationOptions";
import { useTheme } from "../../../src/providers/ThemeProvider";

export default function WardrobeTabsLayout() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <Tabs
      {...stableTabNavigatorProps}
      screenOptions={{
        ...stableTabScreenOptions,
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerTintColor: colors.text,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTitleStyle: {
          color: colors.text,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="module-home"
        options={{
          href: "/(app)/(tabs)/home",
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="wardrobe-list"
        options={{
          title: t("tabs.wardrobe_list"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="wardrobe-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="try-on"
        options={{
          title: t("tabs.try_on"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="tshirt-crew-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          headerShown: false,
          title: t("tabs.calendar"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-month-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: t("tabs.assistant"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="robot-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="module-settings"
        options={{
          href: "/(app)/(tabs)/settings",
          title: t("tabs.settings"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
