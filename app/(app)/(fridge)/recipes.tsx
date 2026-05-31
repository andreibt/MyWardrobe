import { StyleSheet, Text, View } from "react-native";

import { useI18n } from "../../../src/i18n/I18nProvider";
import { colors, spacing, typography } from "../../../src/theme/tokens";

export default function RecipesScreen() {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("recipes.title")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    ...typography.h1,
  },
});
