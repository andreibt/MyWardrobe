import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
  type RenderItemParams,
} from "react-native-draggable-flatlist";

import { useI18n } from "../../../src/i18n/I18nProvider";
import {
  deleteTryOnItem,
  subscribeToTryOnItems,
  updateTryOnLayer,
  updateTryOnOrder,
  type TryOnItem,
} from "../../../src/lib/firestore/tryOnList";
import { useAuth } from "../../../src/providers/AuthProvider";
import { colors, radius, spacing, typography } from "../../../src/theme/tokens";

const LAYERS: TryOnItem["layer"][] = ["top", "middle", "bottom"];

export default function TryOnScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [items, setItems] = useState<TryOnItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { width } = useWindowDimensions();
  const numColumns = width >= 900 ? 3 : 2;
  const tileSize = useMemo(
    () => (width - spacing.lg * 2 - spacing.sm * (numColumns - 1)) / numColumns,
    [width, numColumns]
  );

  useEffect(() => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToTryOnItems(user.id, (nextItems) => {
      setItems(nextItems);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const layerItems = useMemo(() => {
    const byLayer = {
      top: [] as TryOnItem[],
      middle: [] as TryOnItem[],
      bottom: [] as TryOnItem[],
    };

    items.forEach((item) => {
      byLayer[item.layer].push(item);
    });

    LAYERS.forEach((layer) => {
      byLayer[layer].sort((a, b) => a.order - b.order);
    });

    return byLayer;
  }, [items]);

  const handleDelete = (itemId: string) => {
    deleteTryOnItem(itemId).catch(() => {});
  };

  const handleDragEnd =
    (layer: TryOnItem["layer"]) =>
    ({ data }: { data: TryOnItem[] }) => {
      setItems((prev) => {
        const others = prev.filter((item) => item.layer !== layer);
        const reordered = data.map((item, index) => ({
          ...item,
          order: index,
          layer,
        }));
        return [...others, ...reordered];
      });
      updateTryOnOrder(data).catch(() => {});
    };

  const handleLayerChange = (item: TryOnItem, nextLayer: TryOnItem["layer"]) => {
    if (item.layer === nextLayer) {
      return;
    }
    const nextOrder = layerItems[nextLayer].length;
    setItems((prev) =>
      prev.map((entry) =>
        entry.id === item.id ? { ...entry, layer: nextLayer, order: nextOrder } : entry
      )
    );
    updateTryOnLayer(item.id, nextLayer, nextOrder).catch(() => {});
  };

  const renderItem =
    (layer: TryOnItem["layer"]) =>
    ({ item, drag, isActive }: RenderItemParams<TryOnItem>) => (
      <Pressable
        onLongPress={drag}
        disabled={isActive}
        style={[styles.card, { width: tileSize }, isActive && styles.cardActive]}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
        <View style={styles.cardFooter}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.layerRow}>
            {LAYERS.map((key) => (
              <Pressable
                key={`${item.id}-${key}`}
                onPress={() => handleLayerChange(item, key)}
                style={({ pressed }) => [
                  styles.layerChip,
                  key === layer && styles.layerChipActive,
                  pressed && styles.cardPressed,
                ]}
              >
                <Text
                  style={[
                    styles.layerChipText,
                    key === layer && styles.layerChipTextActive,
                  ]}
                >
                  {t(`try_on.layer_${key}`)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
            <Text style={styles.deleteText}>{t("try_on.delete_button")}</Text>
          </Pressable>
        </View>
      </Pressable>
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("try_on.title")}</Text>
        <Text style={styles.subtitle}>{t("try_on.subtitle")}</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            {isLoading ? t("home.empty_loading") : t("try_on.empty")}
          </Text>
          <Text style={styles.emptySubtitle}>{t("try_on.empty_subtitle")}</Text>
        </View>
      ) : (
        <NestableScrollContainer
          contentContainerStyle={styles.layers}
          showsVerticalScrollIndicator={false}
        >
          {LAYERS.map((layer) => (
            <View key={layer} style={styles.layerSection}>
              <Text style={styles.layerTitle}>{t(`try_on.layer_${layer}`)}</Text>
              {layerItems[layer].length === 0 ? (
                <Text style={styles.layerEmpty}>{t("try_on.layer_empty")}</Text>
              ) : (
                <NestableDraggableFlatList
                  data={layerItems[layer]}
                  keyExtractor={(item) => item.id}
                  onDragEnd={handleDragEnd(layer)}
                  renderItem={renderItem(layer)}
                  numColumns={numColumns}
                  activationDistance={12}
                  scrollEnabled={false}
                  contentContainerStyle={styles.listContent}
                  columnWrapperStyle={styles.columnWrapper}
                />
              )}
            </View>
          ))}
        </NestableScrollContainer>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    ...typography.h1,
  },
  subtitle: {
    color: colors.muted,
    ...typography.body,
  },
  layers: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  layerSection: {
    gap: spacing.sm,
  },
  layerTitle: {
    color: colors.text,
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  layerEmpty: {
    color: colors.muted,
    ...typography.caption,
  },
  listContent: {
    gap: spacing.sm,
  },
  columnWrapper: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  cardActive: {
    opacity: 0.85,
  },
  image: {
    width: "100%",
    height: 150,
    backgroundColor: colors.card,
  },
  cardFooter: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  cardTitle: {
    color: colors.text,
    ...typography.body,
  },
  layerRow: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  layerChip: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  layerChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  layerChipText: {
    color: colors.text,
    ...typography.caption,
  },
  layerChipTextActive: {
    color: colors.surface,
  },
  deleteButton: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: "#FDECEC",
  },
  deleteText: {
    color: "#8A1F1F",
    ...typography.caption,
  },
  cardPressed: {
    opacity: 0.85,
  },
  emptyState: {
    padding: spacing.lg,
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
