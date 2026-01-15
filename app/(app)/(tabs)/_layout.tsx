import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useI18n } from "../../../src/i18n/I18nProvider";
import { colors } from "../../../src/theme/tokens";

export default function TabsLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="wardrobe-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog-outline" color={color} size={size} />
          ),
        }}
      />
      {/* <Tabs.Screen
        name="fridge"
        options={{
          title: t("tabs.fridge"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="fridge-outline" color={color} size={size} />
          ),
        }}
      /> */}
    </Tabs>
  );
}
