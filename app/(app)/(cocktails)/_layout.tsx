import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useI18n } from "../../../src/i18n/I18nProvider";
import { useTheme } from "../../../src/providers/ThemeProvider";

export default function CocktailsTabsLayout() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <Tabs
      screenOptions={{
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
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="cocktails"
        options={{
          title: t("tabs.cocktails"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="glass-cocktail" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="cocktail-recipes"
        options={{
          title: t("tabs.cocktail_recipes"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book-open-page-variant-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="module-settings"
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
