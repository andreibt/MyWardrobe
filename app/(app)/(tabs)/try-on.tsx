import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
  type RenderItemParams,
} from "react-native-draggable-flatlist";

import { useI18n } from "../../../src/i18n/I18nProvider";
import {
  deleteTryOnItem,
  deleteTryOnItemsByConfiguration,
  subscribeToTryOnItems,
  updateTryOnConfiguration,
  updateTryOnLayer,
  updateTryOnOrder,
  type TryOnItem,
} from "../../../src/lib/firestore/tryOnList";
import {
  addTryOnConfig,
  deleteTryOnConfig,
  subscribeToTryOnConfigs,
  type TryOnConfig,
} from "../../../src/lib/firestore/tryOnConfigs";
import { useAuth } from "../../../src/providers/AuthProvider";
import { useTryOnConfig } from "../../../src/providers/TryOnConfigProvider";
import { colors, radius, spacing, typography } from "../../../src/theme/tokens";

const LAYERS: TryOnItem["layer"][] = ["top", "middle", "bottom"];

export default function TryOnScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { activeConfig, setActiveConfig } = useTryOnConfig();
  const [items, setItems] = useState<TryOnItem[]>([]);
  const [configs, setConfigs] = useState<TryOnConfig[]>([]);
  const [configName, setConfigName] = useState("");
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

    setItems([]);
    setIsLoading(true);

    const unsubscribe = subscribeToTryOnItems(
      user.id,
      (nextItems) => {
        setItems(nextItems);
        setIsLoading(false);
      },
      activeConfig
    );

    return unsubscribe;
  }, [user, activeConfig]);

  useEffect(() => {
    if (!user) {
      setConfigs([]);
      return;
    }

    return subscribeToTryOnConfigs(user.id, setConfigs);
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

  const handleSaveConfig = () => {
    if (!user) {
      return;
    }
    const trimmed = configName.trim();
    if (!trimmed) {
      return;
    }

    const itemsToSave =
      activeConfig === null
        ? items.filter((item) => !item.configuration)
        : items;

    if (itemsToSave.length > 0) {
      updateTryOnConfiguration(itemsToSave, trimmed).catch(() => {});
    }

    const exists = configs.some(
      (config) => config.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (!exists) {
      addTryOnConfig(user.id, trimmed).catch(() => {});
    }

    setActiveConfig(trimmed);
    setConfigName("");
  };

  const handleSelectConfig = (name: string) => {
    setActiveConfig(activeConfig === name ? null : name);
  };

  const handleDeleteConfig = (config: TryOnConfig) => {
    if (!user) {
      return;
    }
    deleteTryOnItemsByConfiguration(user.id, config.name).catch(() => {});
    deleteTryOnConfig(config.id).catch(() => {});
    if (activeConfig === config.name) {
      setActiveConfig(null);
    }
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

      <NestableScrollContainer
        contentContainerStyle={styles.layers}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {isLoading ? t("home.empty_loading") : t("try_on.empty")}
            </Text>
            <Text style={styles.emptySubtitle}>{t("try_on.empty_subtitle")}</Text>
          </View>
        ) : (
          LAYERS.map((layer) => (
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
          ))
        )}

        <View style={styles.configSection}>
          <Text style={styles.configTitle}>{t("try_on.config_title")}</Text>
          <View style={styles.configRow}>
            <TextInput
              placeholder={t("try_on.config_placeholder")}
              placeholderTextColor={colors.muted}
              value={configName}
              onChangeText={setConfigName}
              style={styles.configInput}
            />
            <Pressable
              onPress={handleSaveConfig}
              style={({ pressed }) => [
                styles.configSaveButton,
                pressed && styles.cardPressed,
                !configName.trim() && styles.configSaveDisabled,
              ]}
              disabled={!configName.trim()}
            >
              <Text style={styles.configSaveText}>{t("try_on.config_save")}</Text>
            </Pressable>
          </View>

          {configs.length === 0 ? (
            <Text style={styles.configEmpty}>{t("try_on.config_empty")}</Text>
          ) : (
            <View style={styles.configList}>
              {configs.map((config) => {
                const isActive = activeConfig === config.name;
                return (
                  <View key={config.id} style={styles.configItem}>
                    <Pressable
                      onPress={() => handleSelectConfig(config.name)}
                      style={({ pressed }) => [
                        styles.configChip,
                        isActive && styles.configChipActive,
                        pressed && styles.cardPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.configChipText,
                          isActive && styles.configChipTextActive,
                        ]}
                      >
                        {config.name}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteConfig(config)}
                      style={({ pressed }) => pressed && styles.cardPressed}
                    >
                      <Text style={styles.configDeleteText}>
                        {t("try_on.config_delete")}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </NestableScrollContainer>
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
  configSection: {
    marginTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  configTitle: {
    color: colors.text,
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  configRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  configInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: colors.text,
    backgroundColor: colors.card,
  },
  configSaveButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
  },
  configSaveDisabled: {
    opacity: 0.6,
  },
  configSaveText: {
    color: colors.text,
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  configEmpty: {
    color: colors.muted,
    ...typography.caption,
  },
  configList: {
    gap: spacing.xs,
  },
  configItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  configChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  configChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  configChipText: {
    color: colors.text,
    ...typography.caption,
  },
  configChipTextActive: {
    color: colors.surface,
  },
  configDeleteText: {
    color: "#8A1F1F",
    ...typography.caption,
  },
});
