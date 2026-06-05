import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../../../src/i18n/I18nProvider";
import { colors, spacing, typography } from "../../../src/theme/tokens";

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => router.push("/(app)/(wardrobe)/wardrobe-list")}
        style={({ pressed }) => [
          styles.section,
          styles.wardrobeSection,
          pressed && styles.sectionPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t("home.wardrobe")}
      >
        <MaterialCommunityIcons name="wardrobe-outline" color={colors.text} size={88} />
        <Text style={styles.title}>{t("home.wardrobe")}</Text>
        <Text style={styles.subtitle}>{t("home.wardrobe_subtitle")}</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/(app)/(fridge)/fridge-list")}
        style={({ pressed }) => [
          styles.section,
          styles.fridgeSection,
          pressed && styles.sectionPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t("home.fridge")}
      >
        <MaterialCommunityIcons name="fridge-outline" color={colors.text} size={88} />
        <Text style={styles.title}>{t("home.fridge")}</Text>
        <Text style={styles.subtitle}>{t("home.fridge_subtitle")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  wardrobeSection: {
    backgroundColor: "#164E63",
  },
  fridgeSection: {
    backgroundColor: "#14532D",
  },
  sectionPressed: {
    opacity: 0.85,
  },
  title: {
    color: colors.text,
    ...typography.h1,
  },
  subtitle: {
    color: colors.text,
    ...typography.body,
    maxWidth: 360,
    textAlign: "center",
  },
});
