import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useI18n } from "../../../src/i18n/I18nProvider";
import {
  stableTabNavigatorProps,
  stableTabScreenOptions,
} from "../../../src/lib/navigationOptions";
import { useTheme } from "../../../src/providers/ThemeProvider";

export default function PantryTabsLayout() {
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
          backgroundColor: colors.surface2,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: {
          color: colors.text,
          fontSize: 17,
          fontWeight: "700",
        },
        tabBarStyle: {
          height: 64,
          paddingTop: 6,
          backgroundColor: colors.surface2,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
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
        name="pantry"
        options={{
          title: t("tabs.pantry"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="food-variant" color={color} size={size} />
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
