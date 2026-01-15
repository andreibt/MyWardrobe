import { useEffect, useState } from "react";
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useI18n } from "../../../src/i18n/I18nProvider";
import { WardrobeCard } from "../../../src/components/WardrobeCard";
import {
  deleteWardrobeItem,
  subscribeToWardrobeItems,
  type WardrobeItem,
} from "../../../src/lib/firestore/wardrobeItems";
import { useAuth } from "../../../src/providers/AuthProvider";
import { colors, radius, spacing, typography } from "../../../src/theme/tokens";

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToWardrobeItems(user.id, (nextItems) => {
      setItems(nextItems);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const confirmDelete = (itemId: string) => {
    const handleDelete = () => {
      deleteWardrobeItem(itemId).catch(() => {});
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(t("home.delete_confirm"))) {
        handleDelete();
      }
      return;
    }

    Alert.alert(
      t("home.delete_title"),
      t("home.delete_message"),
      [
        { text: t("home.delete_cancel"), style: "cancel" },
        {
          text: t("home.delete_confirm_button"),
          style: "destructive",
          onPress: handleDelete,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        updateCellsBatchingPeriod={50}
        windowSize={5}
        removeClippedSubviews={Platform.OS !== "web"}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{t("home.title")}</Text>
            <Text style={styles.subtitle}>{t("home.subtitle")}</Text>
            <Pressable style={styles.addButton} onPress={() => router.push("/(app)/add-item")}>
              <Text style={styles.addButtonText}>{t("home.add_button")}</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <WardrobeCard
            item={item}
            onEdit={() =>
              router.push({
                pathname: "/(app)/edit-item",
                params: {
                  id: item.id,
                  title: item.title,
                  description: item.description,
                  imageUrl: item.imageUrl,
                  color: item.color,
                },
              })
            }
            onDelete={() => confirmDelete(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {isLoading ? t("home.empty_loading") : t("home.empty")}
            </Text>
            <Text style={styles.emptySubtitle}>{t("home.empty_subtitle")}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    ...typography.h1,
  },
  subtitle: {
    color: colors.muted,
    ...typography.body,
  },
  addButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  addButtonText: {
    color: colors.text,
    ...typography.body,
  },
  separator: {
    height: spacing.md,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  emptyTitle: {
    color: colors.text,
    ...typography.h2,
  },
  emptySubtitle: {
    color: colors.muted,
    ...typography.body,
  },
});
